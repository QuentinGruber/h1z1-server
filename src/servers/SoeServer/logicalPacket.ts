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

export class LogicalPacket {
  sequence?: number;
  data: Buffer;
  isReliable: boolean;
  constructor(data: Buffer, sequence?: number) {
    this.sequence = sequence;
    this.data = data;
    this.isReliable = data[1] === 9 || data[1] === 13;
  }
}
