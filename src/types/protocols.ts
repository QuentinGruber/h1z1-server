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
