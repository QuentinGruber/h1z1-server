// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2024 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

import { SoePacket } from "./soeserver";

export class PacketsQueue {
  packets: SoePacket[] = [];
  CurrentByteLength: number = 0;

  clear(): void {
    this.packets = [];
    this.CurrentByteLength = 0;
  }
  addPacket(packet: SoePacket): void {
    const fullBufferedPacketLen = packet.length + 1; // the additionnal byte is the length of the packet written in the buffer when assembling the packet
    this.packets.push(packet);
    this.CurrentByteLength += fullBufferedPacketLen;
  }
}
