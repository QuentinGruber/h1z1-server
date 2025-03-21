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

import { LogicalPacket } from "./logicalPacket";

export class PacketsQueue {
  packets: LogicalPacket[] = [];
  CurrentByteLength: number = 0;

  clear(): void {
    this.packets = [];
    this.CurrentByteLength = 0;
  }
  addPacket(packet: LogicalPacket): void {
    const fullBufferedPacketLen = packet.data.length + 1; // the additionnal byte is the length of the packet written in the buffer when assembling the packet
    this.packets.push(packet);
    this.CurrentByteLength += fullBufferedPacketLen;
  }
}
