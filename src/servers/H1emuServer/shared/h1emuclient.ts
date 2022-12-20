// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2022 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

import { RemoteInfo } from "dgram";

export class H1emuClient {
  sessionId: number = 0;
  address: string;
  port: number;
  serverId?: number;
  clientId: string;
  lastPing: number = 0;

  constructor(remote: RemoteInfo) {
    this.address = remote.address;
    this.port = remote.port;
    this.clientId = `${remote.address}:${remote.port}`;
  }
}
