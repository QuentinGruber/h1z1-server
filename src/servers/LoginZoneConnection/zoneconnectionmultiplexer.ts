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
import { LZConnectionClient } from "./shared/lzconnectionclient";

/** Minimal shape shared by the UDP and ws zone connection managers. */
type ZoneManager = EventEmitter & {
  _clients: { [clientId: string]: LZConnectionClient };
  sendData(client: LZConnectionClient | undefined, name: any, obj: any): void;
  start(): Promise<void>;
  stop(): Promise<void>;
};

/**
 * Runs several zone connection transports (UDP + ws) side by side so the
 * loginserver can accept old and migrated zones at the same time.
 * Re-emits their events under one interface and routes outbound packets to
 * whichever transport a given zone connected on.
 */
export class ZoneConnectionMultiplexer extends EventEmitter {
  constructor(private _managers: ZoneManager[]) {
    super();
    for (const m of this._managers) {
      for (const ev of ["data", "processInternalReq", "disconnect"]) {
        m.on(ev, (...args: any[]) => this.emit(ev, ...args));
      }
    }
  }

  /** Merged read-only view of every transport's clients. */
  get _clients(): { [clientId: string]: LZConnectionClient } {
    const merged: { [clientId: string]: LZConnectionClient } = {};
    for (const m of this._managers) Object.assign(merged, m._clients);
    return merged;
  }

  private managerFor(clientId: string): ZoneManager | undefined {
    return this._managers.find((m) => m._clients[clientId]);
  }

  sendData(client: LZConnectionClient | undefined, name: any, obj: any) {
    if (!client) return;
    (this.managerFor(client.clientId) ?? this._managers[0]).sendData(
      client,
      name,
      obj
    );
  }

  /** Drops a client from whichever transport owns it (used on reject). */
  dropClient(clientId: string) {
    const m = this.managerFor(clientId);
    if (m) delete m._clients[clientId];
  }

  async start(): Promise<void> {
    await Promise.all(this._managers.map((m) => m.start()));
  }

  async stop(): Promise<void> {
    await Promise.all(this._managers.map((m) => m.stop()));
  }
}

exports.ZoneConnectionMultiplexer = ZoneConnectionMultiplexer;
