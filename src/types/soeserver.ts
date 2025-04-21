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

export type soePacket = any;
export type crc_length_options = 0 | 2;
export type dataCache = {
  data: Uint8Array;
  fragment: boolean;
  sequence: number;
  resendCounter: number;
}
export type dataCacheMap = {
  [sequence: number]: dataCache;
};
