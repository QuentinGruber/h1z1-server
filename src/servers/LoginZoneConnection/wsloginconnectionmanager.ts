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
import fs from "node:fs";
import { WebSocket, ClientOptions } from "ws";
import { LZConnectionProtocol } from "../../protocols/lzconnectionprotocol";
import { LZConnectionClient } from "./shared/lzconnectionclient";

const debug = require("debug")("WsLoginConnection");

/**
 * WebSocket drop-in replacement for LoginConnectionManager.
 * Handles the connection between a zoneserver and the loginserver.
 * Presents its per-server secret on the ws handshake and carries the same
 * LZConnection packets so zoneserver handlers are unchanged.
 */
export class WsLoginConnectionManager extends EventEmitter {
  _protocol = new LZConnectionProtocol();
  private _loginServerInfo: { address?: string; port: number } = { port: 0 };
  private _sessionData: any;
  private _secret: string = process.env.LZ_SERVER_SECRET || "";
  private _tls: boolean = process.env.LZ_TLS === "1";
  private _socket?: WebSocket;
  private _loginClient?: LZConnectionClient;
  private _connected = false;
  // whether a session was ever established (to detect never-registered zones)
  private _hasBeenConnected = false;
  private _reconnectTimer?: NodeJS.Timeout;
  private _reconnectDelay = 5000;
  private _pingTimeout?: NodeJS.Timeout;
  // login pings every 5s; if none arrives within this window the link is dead
  private _deadTimeoutMs = 12000;

  constructor(private _serverId: number) {
    super();
  }

  setLoginInfo(serverInfo: any, sessionData: any) {
    this._loginServerInfo = serverInfo;
    this._sessionData = sessionData;
  }

  private url() {
    const scheme = this._tls ? "wss" : "ws";
    return `${scheme}://${this._loginServerInfo.address}:${this._loginServerInfo.port}`;
  }

  private connect() {
    const options: ClientOptions = {
      headers: {
        "x-server-id": String(this._serverId),
        authorization: this._secret
      }
    };
    if (this._tls) {
      // custom CA for a self-signed/private login cert; LZ_TLS_INSECURE=1
      // ignores invalid/self-signed/hostname-mismatch certs (dev only)
      if (process.env.LZ_TLS_CA)
        options.ca = fs.readFileSync(process.env.LZ_TLS_CA);
      if (process.env.LZ_TLS_INSECURE === "1")
        options.rejectUnauthorized = false;
    }
    const socket = new WebSocket(this.url(), options);
    this._socket = socket;
    // client used for zoneserver-side sender checks; must match _loginServerInfo
    this._loginClient = new LZConnectionClient({
      address: this._loginServerInfo.address,
      port: this._loginServerInfo.port
    });
    this._loginClient.serverId = this._serverId;

    // liveness: reset a deadline on every server ping; if login stops pinging
    // (half-open drop) the deadline terminates the socket, triggering reconnect
    const heartbeat = () => {
      clearTimeout(this._pingTimeout);
      this._pingTimeout = setTimeout(
        () => socket.terminate(),
        this._deadTimeoutMs
      );
    };

    socket.on("open", () => {
      debug(`ws open to login ${this.url()}`);
      heartbeat();
      // reuse the existing SessionRequest packet to hand the loginserver our meta
      this.sendData(this._loginClient, "SessionRequest", this._sessionData);
    });
    socket.on("ping", heartbeat);
    socket.on("message", (buf: Buffer) => this.onMessage(buf));
    socket.on("close", (code, reason) => {
      clearTimeout(this._pingTimeout);
      this._connected = false;
      if (code === 4001) {
        console.error(
          "[ERROR] LoginConnection refused: bad server secret (LZ_SERVER_SECRET) or server not whitelisted"
        );
        this.emit("sessionfailed", null, this._loginClient);
        process.exitCode = 11;
        return;
      }
      if (!this._hasBeenConnected) {
        // closed before we ever registered — a rejected handshake can arrive as
        // an abnormal close (1006) rather than 4001, so surface it instead of
        // reconnecting silently forever
        const detail = reason && reason.length ? `: ${reason}` : "";
        console.error(
          `[ERROR] LoginConnection closed before registering (code ${code}${detail}). Retrying — check the login address and LZ_SERVER_SECRET.`
        );
      }
      this.emit("disconnect", null, this._loginClient, 1);
      this.reconnect();
    });
    socket.on("error", (e) => debug(`ws error: ${e}`));
  }

  private onMessage(buf: Buffer) {
    const packet = this._protocol.parse(buf);
    if (!packet || !this._loginClient) return;
    switch (packet.name) {
      case "SessionReply":
        if (packet.data.status === 1) {
          this._connected = true;
          this._hasBeenConnected = true;
          this.emit("session", null, this._loginClient);
        } else {
          this.emit("sessionfailed", null, this._loginClient);
        }
        break;
      default:
        this.emit("data", null, this._loginClient, packet);
        break;
    }
  }

  sendData(client: LZConnectionClient | undefined, packetName: any, obj: any) {
    if (!this._socket || this._socket.readyState !== WebSocket.OPEN) return;
    const data = this._protocol.pack(packetName, obj);
    if (data) this._socket.send(data);
  }

  reconnect() {
    if (this._reconnectTimer) return;
    this._reconnectTimer = setTimeout(() => {
      this._reconnectTimer = undefined;
      if (!this._connected) this.connect();
    }, this._reconnectDelay);
  }

  async start() {
    if (!this._loginServerInfo.address || !this._sessionData) {
      console.log(
        "[ERROR] WsLoginConnectionManager started without setting login info!"
      );
      return;
    }
    if (!this._secret) {
      console.log(
        "[ERROR] WsLoginConnectionManager: LZ_SERVER_SECRET is not set"
      );
      return;
    }
    this.connect();
  }

  async stop() {
    if (this._reconnectTimer) clearTimeout(this._reconnectTimer);
    clearTimeout(this._pingTimeout);
    this._socket?.close();
  }
}

exports.WsLoginConnectionManager = WsLoginConnectionManager;
