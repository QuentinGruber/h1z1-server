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

export const friendPackets: PacketStructures = [
  [
    "Friend.List",
    0x2d01,
    {
      fields: [
        {
          name: "friends",
          type: "array",
          defaultValue: [{}],
          fields: [
            { name: "unknown1", type: "uint32", defaultValue: 0 },
            { name: "unknown2", type: "uint32", defaultValue: 0 },
            { name: "unknown3", type: "uint32", defaultValue: 0 },
            { name: "characterName", type: "string", defaultValue: "" },
            { name: "unknown4", type: "uint32", defaultValue: 0 },
            { name: "characterId", type: "uint64string", defaultValue: "0" },
            {
              name: "is_online_data",
              type: "variabletype8",
              types: {
                0: [
                  { name: "unknown5", type: "uint32", defaultValue: 0 },
                  { name: "unknown6", type: "uint32", defaultValue: 0 }
                ],
                1: [
                  { name: "unknown5", type: "uint32", defaultValue: 0 },
                  { name: "unknown6", type: "uint32", defaultValue: 0 },
                  { name: "unknown7", type: "uint32", defaultValue: 0 },
                  { name: "unknown8", type: "uint32", defaultValue: 0 },
                  { name: "unknown9", type: "uint8", defaultValue: 0 },
                  { name: "location_x", type: "float", defaultValue: 0.0 },
                  { name: "location_y", type: "float", defaultValue: 0.0 },
                  { name: "unknown10", type: "uint32", defaultValue: 0 },
                  { name: "unknown11", type: "uint32", defaultValue: 0 },
                  { name: "unknown12", type: "uint32", defaultValue: 0 },
                  { name: "unknown13", type: "uint32", defaultValue: 0 },
                  { name: "unknown14", type: "uint8", defaultValue: 0 }
                ]
              }
            }
          ]
        }
      ]
    }
  ],
  ["Friend.Online", 0x2d02, {}],
  ["Friend.Offline", 0x2d03, {}],
  ["Friend.UpdateProfileInfo", 0x2d04, {}],
  ["Friend.UpdatePositions", 0x2d05, {}],
  ["Friend.Add", 0x2d06, {}],
  ["Friend.Remove", 0x2d07, {}],
  [
    "Friend.Message",
    0x2d08,
    {
      fields: [
        { name: "messageType", type: "uint8", defaultValue: 0 },
        { name: "messageTime", type: "uint64string", defaultValue: "0" },
        {
          name: "messageData1",
          type: "schema",
          fields: [
            { name: "unknowndDword1", type: "uint32", defaultValue: 0 },
            { name: "unknowndDword2", type: "uint32", defaultValue: 0 },
            { name: "unknowndDword3", type: "uint32", defaultValue: 0 },
            { name: "characterName", type: "string", defaultValue: "" },
            { name: "unknownString1", type: "string", defaultValue: "" }
          ]
        },
        {
          name: "messageData2",
          type: "schema",
          fields: [
            { name: "unknowndDword1", type: "uint32", defaultValue: 0 },
            { name: "unknowndDword2", type: "uint32", defaultValue: 0 },
            { name: "unknowndDword3", type: "uint32", defaultValue: 0 },
            { name: "characterName", type: "string", defaultValue: "" },
            { name: "unknownString1", type: "string", defaultValue: "" }
          ]
        }
      ]
    }
  ],
  ["Friend.Status", 0x2d09, {}],
  ["Friend.Rename", 0x2d0a, {}]
];
