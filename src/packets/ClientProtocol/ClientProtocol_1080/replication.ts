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
import { packUnsignedIntWith2bitLengthValue } from "./shared";

export function packComponentNameString(name: string) {
  const stringBuffer = Buffer.from(name.trim(), "ascii"),
    nullBuffer = Buffer.from([0x00]),
    lengthBuffer = Buffer.alloc(2);
  lengthBuffer.writeUInt16LE(stringBuffer.length, 0);
  return Buffer.concat([lengthBuffer, stringBuffer, nullBuffer]);
}

export function packClientNpcComponent(obj: any) {
  const raw: Buffer = Buffer.alloc(78);
  if (obj["nameId"]) {
    raw.writeUInt32LE(obj["nameId"], 12);
  }

  raw.writeUint8(122, 0);
  raw.writeUint8(2, 1);

  raw.writeUint8(1, raw.length - 1);
  return raw;
}

export function packClientInteractComponent(obj: any) {
  const raw: Buffer = Buffer.alloc(11);
  if (obj["distance"]) {
    raw.writeFloatLE(obj["distance"], 0);
  }

  raw.writeUint8(1, raw.length - 1);
  return raw;
}

export function packNpcComponent(obj: any) {
  switch (obj.componentName) {
    case "ClientNpcComponent":
      return packClientNpcComponent(obj);
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
