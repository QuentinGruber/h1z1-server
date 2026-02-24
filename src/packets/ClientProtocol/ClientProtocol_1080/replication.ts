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

import { PacketFields, PacketStructures } from "types/packetStructure";
import { packUnsignedIntWith2bitLengthValue } from "./shared";
import DataSchema from "h1z1-dataschema";

export function packComponentNameString(name: string) {
  const stringBuffer = Buffer.from(name.trim(), "ascii"),
    nullBuffer = Buffer.from([0x00]),
    lengthBuffer = Buffer.alloc(2);
  lengthBuffer.writeUInt16LE(stringBuffer.length, 0);
  return Buffer.concat([lengthBuffer, stringBuffer, nullBuffer]);
}

export const npcComponent: PacketFields = [
  { name: "unknownDword1", type: "uint32", defaultValue: 634 },
  { name: "unknownDword2", type: "uint32", defaultValue: 0 },
  { name: "unknownDword3", type: "uint32", defaultValue: 0 },
  { name: "nameId", type: "uint32", defaultValue: 0 },
  { name: "unknownDword5", type: "uint32", defaultValue: 0 },
  { name: "unknownDword6", type: "uint32", defaultValue: 0 },
  { name: "unknownDword7", type: "uint32", defaultValue: 0 },
  { name: "unknownFloatVector1", type: "floatvector3", defaultValue: 0 },
  { name: "unknownFloatVector2", type: "floatvector3", defaultValue: 0 },
  { name: "unknownDword8", type: "uint32", defaultValue: 0 },
  { name: "unknownDword9", type: "uint32", defaultValue: 0 },
  { name: "unknownQword1", type: "uint64string", defaultValue: "0" },
  { name: "unknownDword10", type: "uint32", defaultValue: 0 },
  { name: "unknownDword11", type: "uint32", defaultValue: 0 },
  { name: "unknownByte1", type: "uint8", defaultValue: 0 },
  { name: "unknownBoolean1", type: "boolean", defaultValue: true }
];

export function packClientInteractComponent(obj: any) {
  const raw: Buffer = Buffer.alloc(11);
  if (obj["distance"]) {
    raw.writeFloatLE(obj["distance"], 0);
  }

  if (obj["disableInteractionGlow"] && obj["disableInteractionGlow"] == true) {
    raw.writeUint8(1, 9);
  }

  raw.writeUint8(1, raw.length - 1);
  return raw;
}

export function packNpcComponent(obj: any) {
  switch (obj.componentName) {
    case "ClientNpcComponent":
      return DataSchema.pack(npcComponent, obj).data;
    case "ClientInteractComponent":
      return packClientInteractComponent(obj);
    default:
      throw new Error(
        `Unknown componentName for NPC component: ${obj.componentName}`
      );
  }
}

export const replicationPackets: PacketStructures = [
  [
    "Replication.CreateRepData",
    0xeb00,
    {
      fields: [
        {
          name: "sequenceNumber",
          type: "uint32",
          defaultValue: 0
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
          name: "unknownByte1",
          type: "uint8",
          defaultValue: 0
        },
        {
          name: "unknownDword1",
          type: "uint32",
          defaultValue: 0
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
          name: "componentName",
          type: "custom",
          packer: packComponentNameString
        },
        {
          name: "unknownArray1",
          type: "array",
          defaultValue: [],
          fields: [
            {
              name: "unknownString1",
              type: "string",
              defaultValue: ""
            }
          ]
        },
        {
          name: "unknownDword1",
          type: "uint32",
          defaultValue: 1
        },
        {
          name: "sequenceNumber",
          type: "uint32",
          defaultValue: 0
        },
        {
          name: "propertyHash",
          type: "uint32",
          defaultValue: 0
        },
        {
          name: "unknownByte1",
          type: "uint8",
          defaultValue: 0
        },
        {
          name: "payload",
          type: "byteswithlength",
          defaultValue: {},
          fields: [
            {
              name: "bufferData",
              type: "custom",
              defaultValue: {},
              packer: packNpcComponent
            }
          ]
        }
      ]
    }
  ],
  ["Replication.DestroyComponent", 0xeb05, {}],
  ["Replication.CreateComponentRepData", 0xeb06, {}]
];
