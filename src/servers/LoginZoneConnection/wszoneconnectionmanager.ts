// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2026 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

import { EventEmitter } from "node:events";
import { IncomingMessage } from "node:http";
import https from "node:https";
import fs from "node:fs";
import { WebSocket, WebSocketServer } from "ws";
import { LZConnectionProtocol } from "../../protocols/lzconnectionprotocol";
import { LZConnectionClient } from "./shared/lzconnectionclient";

const debug = require("debug")("WsZoneConnection");

/** Validates a zone's per-server secret against the DB. Provided by the loginserver. */
export type ZoneAuthValidator = (
  serverId: number,
  secret: string,
  address: string
) => Promise<boolean>;

/**
 * WebSocket drop-in replacement for ZoneConnectionManager.
 * Handles connections between the loginserver and multiple zoneservers.
 * Authenticates each zone by a per-server secret on the ws handshake, then
 * carries the exact same LZConnection packets so loginserver handlers are unchanged.
 *
 * Serves wss when LZ_TLS_CERT + LZ_TLS_KEY are set, otherwise plain ws (only
 * safe behind a TLS-terminating proxy or on a trusted network, since the secret
 * rides the handshake). LZ_TLS_CA is optional.
 */
export class WsZoneConnectionManager extends EventEmitter {
  _protocol = new LZConnectionProtocol();
  _clients: { [clientId: string]: LZConnectionClient } = {};
  private _sockets: { [clientId: string]: WebSocket } = {};
  private _wss?: WebSocketServer;
  private _tlsServer?: https.Server;
  private _pingTime = 5000;
  private _heartbeat?: NodeJS.Timeout;

  constructor(
    private _port: number,
    private _authenticate: ZoneAuthValidator
  ) {
    super();
  }

  async start(): Promise<void> {
    const cert = process.env.LZ_TLS_CERT;
    const key = process.env.LZ_TLS_KEY;
    if (cert && key) {
      // terminate TLS in-process: attach the ws server to an https server
      this._tlsServer = https.createServer({
        cert: fs.readFileSync(cert),
        key: fs.readFileSync(key),
        ca: process.env.LZ_TLS_CA
          ? fs.readFileSync(process.env.LZ_TLS_CA)
          : undefined
      });
      this._wss = new WebSocketServer({ server: this._tlsServer });
      this._tlsServer.listen(this._port);
      debug(`WsZoneConnectionManager listening on ${this._port} (wss)`);
    } else {
      this._wss = new WebSocketServer({ port: this._port });
      debug(`WsZoneConnectionManager listening on ${this._port} (ws)`);
    }
    this._wss.on("connection", (socket, req) => this.onConnection(socket, req));
    // ws heartbeat: ping every tick, terminate any socket that missed the last
    // ping's pong. terminate() fires 'close', reusing the disconnect path so a
    // half-open (no-FIN) drop marks the zone offline instead of hanging forever.
    this._heartbeat = setInterval(() => {
      for (const id in this._sockets) {
        const socket = this._sockets[id];
        if ((socket as any).isAlive === false) {
          socket.terminate();
          continue;
        }
        (socket as any).isAlive = false;
        if (socket.readyState === WebSocket.OPEN) socket.ping();
      }
    }, this._pingTime);
  }

  private async onConnection(socket: WebSocket, req: IncomingMessage) {
    const serverId = Number(req.headers["x-server-id"]);
    const secret = String(req.headers["authorization"] || "").replace(
      /^Bearer /i,
      ""
    );
    const address = (req.socket.remoteAddress || "").replace(/^::ffff:/, "");
    const port = req.socket.remotePort || 0;
    const clientId = `${address}:${port}`;

    // attach the message listener synchronously and buffer until auth resolves:
    // the zone sends SessionRequest on open, which would otherwise arrive during
    // the async secret check (a DB lookup) and be dropped by ws
    let client: LZConnectionClient | undefined;
    const buffered: Buffer[] = [];
    socket.on("message", (buf: Buffer) => {
      if (client) this.onMessage(buf, client);
      else buffered.push(buf);
    });

    if (
      !serverId ||
      !secret ||
      !(await this._authenticate(serverId, secret, address))
    ) {
      debug(`Rejected zone ${serverId} from ${clientId}: bad secret`);
      socket.close(4001, "unauthorized");
      return;
    }

    client = new LZConnectionClient({ address, port });
    client.serverId = serverId;
    // marks the connection as already authenticated so the loginserver
    // SessionRequest handler skips the legacy source-IP check
    (client as any).authed = true;
    this._clients[clientId] = client;
    this._sockets[clientId] = socket;

    (socket as any).isAlive = true;
    socket.on("pong", () => ((socket as any).isAlive = true));
    socket.on("close", () => {
      delete this._clients[clientId];
      delete this._sockets[clientId];
      this.emit("disconnect", null, client, 1);
    });
    socket.on("error", (e) => debug(`ws error ${clientId}: ${e}`));
    debug(`Zone ${serverId} authenticated from ${clientId}`);
    // flush anything received during the auth check (e.g. the zone's SessionRequest)
    for (const buf of buffered) this.onMessage(buf, client);
  }

  private onMessage(buf: Buffer, client: LZConnectionClient) {
    const packet = this._protocol.parse(buf);
    if (!packet) return;
    switch (packet.name) {
      case "CharacterAllowedReply":
        this.emit("processInternalReq", packet, [
          "status",
          "rejectionFlag",
          "message"
        ]);
        break;
      case "CharacterCreateReply":
      case "CharacterDeleteReply":
      case "ClientIsAdminReply":
        this.emit("processInternalReq", packet, ["status"]);
        break;
      default:
        this.emit("data", null, client, packet);
        break;
    }
  }

  sendData(client: LZConnectionClient | undefined, packetName: any, obj: any) {
    if (!client) return;
    // resolve the live socket by clientId (callers may pass a rebuilt client
    // that has no socket, e.g. getZoneConnectionClient)
    const socket = this._sockets[client.clientId];
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    const data = this._protocol.pack(packetName, obj);
    if (data) socket.send(data);
  }

  async stop(): Promise<void> {
    if (this._heartbeat) clearInterval(this._heartbeat);
    await new Promise<void>((resolve) => {
      if (!this._wss) return resolve();
      this._wss.close(() => resolve());
    });
    this._tlsServer?.close();
  }
}

exports.WsZoneConnectionManager = WsZoneConnectionManager;
