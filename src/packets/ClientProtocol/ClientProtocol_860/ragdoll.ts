import { packPositionUpdateData, readPositionUpdateData } from "./shared";

export const ragdollPackets: any = [
  [
    "Ragdoll.Start",
    0xd00100,
    {
      fields: [
        {
          name: "characterId",
          type: "uint64string",
          defaultValue: "0x0000000000000000",
        },
      ],
    },
  ],
  [
    "Ragdoll.UpdatePose",
    0xd00101,
    {
      fields: [
        {
          name: "characterId",
          type: "uint64string",
          defaultValue: "0x0000000000000000",
        },
        {
          name: "positionUpdate",
          type: "custom",
          parser: readPositionUpdateData,
          packer: packPositionUpdateData,
        },
      ],
    },
  ],
  [
    "Ragdoll.Unk",
    0xd00118,
    {
      fields: [
        {
          name: "characterId",
          type: "uint64string",
          defaultValue: "0x0000000000000000",
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
              defaultValue: [0, 50, 0],
            },
            {
              name: "rotation",
              type: "floatvector4",
              defaultValue: [0, 0, 0, 0],
            },
          ],
        },
      ],
    },
  ],
  [
    "Ragdoll.Unk2",
    0xd0010b,
    {
      fields: [
        {
          name: "characterId",
          type: "uint64string",
          defaultValue: "0x0000000000000000",
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
              defaultValue: [0, 50, 0],
            },
            {
              name: "rotation",
              type: "floatvector4",
              defaultValue: [0, 0, 0, 0],
            },
          ],
        },
        {
          name: "positionUpdate",
          type: "custom",
          parser: readPositionUpdateData,
          packer: packPositionUpdateData,
        },
      ],
    },
  ],
  [
    "Ragdoll.Stop",
    0xd002,
    {
      fields: [
        { name: "unknown3", type: "uint8", defaultValue: 0 },
        {
          name: "unknown4",
          type: "uint64string",
          defaultValue: "0x0000000000000000",
        },
        {
          name: "array1",
          type: "array",
          fields: [
            { name: "unknown5", type: "uint8", defaultValue: 0 },
            { name: "unknown6", type: "uint32", defaultValue: 0 },
          ],
        },
        {
          name: "array2",
          type: "array",
          fields: [{ name: "unknown7", type: "uint32", defaultValue: 0 }],
        },
      ],
    },
  ],
];
