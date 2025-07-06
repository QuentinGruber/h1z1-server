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

export class LogicalPacket {
  sequence?: number;
  data: Uint8Array;
  isReliable: boolean = false;
  canCrc: boolean = false;
  canBeBuffered: boolean = true;
  constructor(data: Uint8Array, sequence?: number) {
    this.sequence = sequence;
    this.data = data;
    switch (data[1]) {
      case 3:
        this.canCrc = true;
        this.canBeBuffered = false;
        break;
      case 9:
        this.isReliable = true;
        this.canCrc = true;
        this.canBeBuffered = this.data.length < 255;
        break;
      case 11:
        this.canCrc = true;
        break;
      case 21:
        this.canCrc = true;
        break;
      case 27:
        this.canBeBuffered = this.data.length < 255;
        this.canCrc = true;
        break;
      case 13:
        this.isReliable = true;
        this.canCrc = true;
        this.canBeBuffered = this.data.length < 255;
        break;
      default:
        break;
    }
  }
}
