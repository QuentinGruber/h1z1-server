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

export class LogicalPacket {
  sequence?: number;
  data: Uint8Array;
  isReliable: boolean;
  canCrc: boolean;
  constructor(data: Uint8Array, sequence?: number) {
    this.sequence = sequence;
    this.data = data;
    switch (data[1]) {
      case 3:
        this.isReliable = false;
        this.canCrc = true;
        break;
      case 9:
        this.isReliable = true;
        this.canCrc = true;
        break;
      case 11:
        this.isReliable = false;
        this.canCrc = true;
        break;
      case 21:
        this.isReliable = false;
        this.canCrc = true;
        break;
      case 27:
        this.isReliable = false;
        this.canCrc = true;
        break;
      case 13:
        this.isReliable = true;
        this.canCrc = true;
        break;
      default:
        this.isReliable = false;
        this.canCrc = false;
        break;
    }
  }
}
