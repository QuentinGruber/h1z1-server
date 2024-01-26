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

import { PacketStructures } from "types/packetStructure";

export default function PacketTableBuild(packets: PacketStructures): any[] {
  const packetTypes: any = {};
  const packetDescriptors: any = {};
  for (let i = 0; i < packets.length; i++) {
    const packet = packets[i],
      name = packet[0],
      type = packet[1] >>> 0,
      packetDesc = packet[2];
    packetTypes[name] = type;
    packetDescriptors[type] = {
      type: type,
      name: name,
      schema: packetDesc.fields,
      fn: packetDesc.fn,
      parse: packetDesc.parse,
      pack: packetDesc.pack
    };
  }
  return [packetTypes, packetDescriptors];
}
