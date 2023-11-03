// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2023 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

export interface Packet {
  result: any;
  name: string;
  tunnelData: any;
  flags: any;
}
export interface ReceivedPacket<PacketType> {
  name: string;
  data: PacketType;
}

export interface httpServerMessage {
  type: string;
  requestId: number;
  data: any;
}

export type json = any;

export interface FileHash {
  file_name: string,
  crc32_hash: string;
}

interface FileHashList {
  type: string, 
  hashes: Array<FileHash>
}

export type FileHashTypeList = Array<FileHashList>;
