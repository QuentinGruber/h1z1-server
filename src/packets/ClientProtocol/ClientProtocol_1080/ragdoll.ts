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
import { packPositionUpdateData, readPositionUpdateData } from "./shared";

export const ragdollPackets: PacketStructures = [
  [
    "Ragdoll.Start",
    0xce0100,
    {
      fields: [
        {
          name: "characterId",
          type: "uint64string",
          defaultValue: "0x0000000000000000"
        }
      ]
    }
  ],
  [
    "Ragdoll.UpdatePose",
    0xce0101,
    {
      fields: [
        {
          name: "characterId",
          type: "uint64string",
          defaultValue: "0x0000000000000000"
        },
        {
          name: "positionUpdate",
          type: "custom",
          parser: readPositionUpdateData,
          packer: packPositionUpdateData
        }
      ]
    }
  ],
  [
    "Ragdoll.Unk",
    0xce0118,
    {
      fields: [
        {
          name: "characterId",
          type: "uint64string",
          defaultValue: "0x0000000000000000"
        },
        { name: "unk1", type: "int32", defaultValue: 1 },
        {
          name: "unkArray1",
          type: "array",
          defaultValue: [],
          fields: [
            { name: "unknownByte1", type: "uint8", defaultValue: 0 },
            {
              name: "position",
              type: "floatvector3",
              defaultValue: [0, 50, 0]
            },
            {
              name: "rotation",
              type: "floatvector4",
              defaultValue: [0, 0, 0, 0]
            }
          ]
        },
        { name: "unk2", type: "int32", defaultValue: 1 },
        {
          name: "unkArray2",
          type: "array",
          defaultValue: [],
          fields: [
            { name: "unknownByte1", type: "uint8", defaultValue: 0 },
            {
              name: "position",
              type: "floatvector3",
              defaultValue: [0, 50, 0]
            },
            {
              name: "rotation",
              type: "floatvector4",
              defaultValue: [0, 0, 0, 0]
            }
          ]
        }
      ]
    }
  ],
  [
    "Ragdoll.Unk2",
    0xce010b,
    {
      fields: [
        {
          name: "characterId",
          type: "uint64string",
          defaultValue: "0x0000000000000000"
        },
        { name: "unk1", type: "int32", defaultValue: 1 },
        {
          name: "unkArray1",
          type: "array",
          defaultValue: [],
          fields: [
            { name: "unknownByte1", type: "uint8", defaultValue: 1 },
            {
              name: "position",
              type: "floatvector3",
              defaultValue: [0, 50, 0]
            },
            {
              name: "rotation",
              type: "floatvector4",
              defaultValue: [0, 0, 0, 0]
            }
          ]
        },
        {
          name: "positionUpdate",
          type: "custom",
          parser: readPositionUpdateData,
          packer: packPositionUpdateData
        }
      ]
    }
  ],
  [
    "Ragdoll.Stop",
    0xce02,
    {
      fields: [
        { name: "unknown3", type: "uint8", defaultValue: 0 },
        {
          name: "unknown4",
          type: "uint64string",
          defaultValue: "0x0000000000000000"
        },
        {
          name: "array1",
          type: "array",
          fields: [
            { name: "unknown5", type: "uint8", defaultValue: 0 },
            { name: "unknown6", type: "uint32", defaultValue: 0 }
          ]
        },
        {
          name: "array2",
          type: "array",
          fields: [{ name: "unknown7", type: "uint32", defaultValue: 0 }]
        }
      ]
    }
  ]
];
