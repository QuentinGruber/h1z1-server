// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2025 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

import { GatewayChannels } from "h1emu-core";

export interface LoginProtocolReadingFormat {
  serverId?: number;
  unknown?: number;
  subPacketName?: string;
  packetLength?: number;
  name: string;
  result: any;
  type?: number;
}

export interface H1z1ProtocolReadingFormat {
  name: string;
  flag: GatewayChannels 
  data: any;
}

export interface GatewayProtocolReadingFormat {
  type: number;
  flags: number;
  fromClient?: boolean;
  tunnelData?: Buffer;
  name: string;
  result?: any;
}

export interface LZConnectionProtocolReadingFormat {
  type: number;
  name: string;
  data: any;
}
