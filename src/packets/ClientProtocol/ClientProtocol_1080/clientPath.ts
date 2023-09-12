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

export const clientPathPackets: PacketStructures = [
  [
    "ClientPath.Request",
    0x3e01,
    {
      fields: []
    }
  ],
  [
    "ClientPath.Reply",
    0x3e02,
    {
      fields: [
        { name: "PathProcessingTech", type: "uint32", defaultValue: 0 }, // 1 = Kynapse, for real using an uint32 for this is dumb as fuck DB
        { name: "unknownDword2", type: "uint32", defaultValue: 6 },
        {
          name: "nodes",
          type: "array",
          defaultValue: [],
          fields: [
            {
              name: "node",
              type: "floatvector4",
              defaultValue: [0, 0, 0, 0]
            }
          ]
        }
      ]
    }
  ]
];
