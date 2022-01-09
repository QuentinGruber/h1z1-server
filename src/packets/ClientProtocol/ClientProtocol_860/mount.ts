// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2022 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

import { identitySchema } from "./shared";

export const mountPackets: any = [
  ["Mount.MountRequest", 0x7001, {}],
  [
    "Mount.MountResponse",
    0x7002,
    {
      fields: [
        { name: "characterId", type: "uint64string", defaultValue: "0" },
        { name: "guid", type: "uint64string", defaultValue: "0" },
        { name: "unknownDword1", type: "uint32", defaultValue: 0 }, // seat 0-3
        { name: "unknownDword2", type: "uint32", defaultValue: 1 }, // must be 1 or we dont get into vehicle?
        { name: "unknownDword3", type: "uint32", defaultValue: 1 }, // is driver? (you can be on seat 3 and still have control)
        { name: "unknownDword4", type: "uint32", defaultValue: 0 }, // colored lines on screen
        {
          name: "characterData",
          type: "schema",
          fields: [
            { name: "unknownDword1", type: "uint32", defaultValue: 0 },
            { name: "unknownDword2", type: "uint32", defaultValue: 0 },
            { name: "unknownDword3", type: "uint32", defaultValue: 0 },
            {
              name: "characterName",
              type: "string",
              defaultValue: "LocalPlayer",
            },
            { name: "unknownString1", type: "string", defaultValue: "" },
          ],
        },
        { name: "tagString", type: "string", defaultValue: "" },
        { name: "unknownDword5", type: "uint32", defaultValue: 0 },
      ],
    },
  ],
  [
    "Mount.DismountRequest",
    0x7003,
    {
      fields: [{ name: "unknownByte1", type: "uint8", defaultValue: 0 }],
    },
  ],
  [
    "Mount.DismountResponse",
    0x7004,
    {
      fields: [
        { name: "characterId", type: "uint64string", defaultValue: "0" },
        { name: "guid", type: "uint64string", defaultValue: "0" },
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
        { name: "unknownBoolean1", type: "boolean", defaultValue: false },
        { name: "unknownByte1", type: "uint8", defaultValue: 0 },
      ],
    },
  ],
  [
    "Mount.List",
    0x7005,
    {
      fields: [
        {
          name: "List",
          type: "array",
          fields: [
            { name: "unknownDword1", type: "uint32", defaultValue: 0 },
            { name: "unknownDword2", type: "uint32", defaultValue: 0 },
            { name: "unknownDword3", type: "uint32", defaultValue: 0 },
            { name: "unknownQword1", type: "uint64string", defaultValue: "0" },
            { name: "unknownBoolean1", type: "boolean", defaultValue: 0 },
            { name: "unknownDword4", type: "uint32", defaultValue: 0 }, // maybe not
            { name: "unknownString1", type: "string", defaultValue: "" },
          ],
        },
      ],
    },
  ],
  ["Mount.Spawn", 0x7006, {}],
  ["Mount.Despawn", 0x7007, {}],
  ["Mount.SpawnByItemDefinitionId", 0x7008, {}],
  ["Mount.OfferUpsell", 0x7009, {}], // contain same schema as Mount.List seems to be glitched
  ["Mount.SeatChangeRequest", 0x700a, {}],
  [
    "Mount.SeatChangeResponse",
    0x700b,
    {
      fields: [
        { name: "characterId", type: "uint64string", defaultValue: "0" },
        { name: "unknownGuid", type: "uint64string", defaultValue: "0" },
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
        { name: "unknownDword2", type: "uint32", defaultValue: 0 },
        { name: "unknownDword3", type: "uint32", defaultValue: 0 },
      ],
    },
  ],
  [
    "Mount.SeatSwapRequest",
    0x700c,
    {
      fields: [
        { name: "characterId", type: "uint64string", defaultValue: "0" },
        identitySchema,
        { name: "unknownDword3", type: "uint32", defaultValue: 0 },
      ],
    },
  ],
  ["Mount.SeatSwapResponse", 0x700d, {}],
  ["Mount.TypeCount", 0x700e, {}],
];
