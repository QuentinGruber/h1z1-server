// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2026 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

import { PacketStructures } from "types/packetStructure";
import {
  packComponentNameString,
  packUnsignedIntWith2bitLengthValue,
  generateWorldItemRepData
} from "./shared";
import { ReplicationPropertyHash } from "../../../servers/ZoneServer2016/models/enums";

export const replicationPackets: PacketStructures = [
  [
    "Replication.CreateRepData",
    0xeb00,
    {
      fields: [
        {
          name: "replicationId",
          type: "uint32",
          defaultValue: 0x2e6e
        },
        {
          name: "propertyHash",
          type: "uint32"
        },
        {
          name: "transientId",
          type: "custom",
          packer: packUnsignedIntWith2bitLengthValue
        },
        {
          name: "sequenceNumber",
          type: "uint8",
          defaultValue: 0
        },
        {
          name: "bufferData",
          type: "custom",
          packer: (bytes: any) => bytes,
          defaultValue: generateWorldItemRepData()
        }
      ]
    }
  ],
  ["Replication.DestroyRepData", 0xeb01, {}],
  [
    "Replication.UpdateRepData",
    0xeb02,
    {
      fields: [
        {
          name: "replicationId",
          type: "uint32"
        },
        {
          name: "sequenceNumber",
          type: "uint8",
          defaultValue: 0
        },
        {
          name: "bufferSize",
          type: "uint8",
          defaultValue: 0x4e
        },
        {
          name: "skip",
          type: "uint8",
          defaultValue: 0x4d
        },
        {
          name: "updateAction",
          type: "uint8",
          defaultValue: 0x81
        },
        {
          name: "dataValue",
          type: "uint8",
          defaultValue: 1
        }
      ]
    }
  ],
  ["Replication.UpdateFullRepData", 0xeb03, {}],
  [
    "Replication.CreateComponent",
    0xeb04,
    {
      fields: [
        {
          name: "transientId",
          type: "custom",
          packer: packUnsignedIntWith2bitLengthValue
        },
        {
          name: "stringSize",
          type: "uint16"
        },
        {
          name: "componentName",
          type: "custom",
          packer: packComponentNameString
        },
        {
          name: "unknownDword", // padding?
          type: "uint32",
          defaultValue: 0
        },
        {
          name: "properties",
          type: "array",
          fields: [
            {
              name: "replicationId",
              type: "uint32",
              defaultValue: 0x2e6e
            },
            {
              name: "propertyHash",
              type: "uint32",
              defaultValue: ReplicationPropertyHash.ISWORLDITEM
            },
            {
              name: "unknownByte", // sequence number?
              type: "uint8",
              defaultValue: 0
            },
            {
              name: "bufferSize",
              type: "uint32",
              defaultValue: 0x4e
            },

            {
              name: "bufferData",
              type: "custom",
              packer: (bytes: any) => bytes,
              defaultValue: generateWorldItemRepData()
            }
          ]
        }
      ]
    }
  ],
  ["Replication.DestroyComponent", 0xeb05, {}],
  ["Replication.CreateComponentRepData", 0xeb06, {}]
];
