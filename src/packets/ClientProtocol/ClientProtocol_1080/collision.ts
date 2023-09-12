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
import { PacketStructures } from "types/packetStructure";

export const collisionPackets: PacketStructures = [
  [
    "Collision.Damage",
    0x8f01,
    {
      fields: [
        { name: "unknownByte1", type: "uint8", defaultValue: 0 },
        { name: "characterId", type: "uint64string", defaultValue: "0" },
        { name: "objectCharacterId", type: "uint64string", defaultValue: 0 },
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
        { name: "damage", type: "uint32", defaultValue: 0 },
        { name: "unknownDword2", type: "uint32", defaultValue: 0 },
        { name: "position", type: "floatvector3", defaultValue: 0 },
        { name: "unknownByte2", type: "uint8", defaultValue: 0 }
      ]
    }
  ]
];
