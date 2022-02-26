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

import {
  attachmentDataSchema,
  equipmentCharacterDataSchema,
  equipmentSlotSchema,
} from "./shared";

export const equipmentPackets: any = [
  [
    "Equipment.SetCharacterEquipment",
    0x9501,
    {
      fields: [
        {
          name: "characterData",
          type: "schema",
          fields: equipmentCharacterDataSchema,
        },
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
        { name: "unknownString1", type: "string", defaultValue: "" },
        { name: "unknownString2", type: "string", defaultValue: "#" },
        {
          name: "equipmentSlots",
          type: "array",
          defaultValue: [],
          fields: equipmentSlotSchema,
        },
        {
          name: "attachmentData",
          type: "array",
          defaultValue: [],
          fields: attachmentDataSchema,
        },
      ],
    },
  ],
  [
    "Equipment.SetCharacterEquipmentSlot",
    0x9502,
    {
      fields: [
        {
          name: "characterData",
          type: "schema",
          fields: equipmentCharacterDataSchema,
        },
        {
          name: "equipmentSlot",
          type: "schema",
          fields: equipmentSlotSchema,
        },
        {
          name: "attachmentData",
          type: "schema",
          fields: attachmentDataSchema,
        },
      ],
    },
  ],
  ["Equipment.UnsetCharacterEquipmentSlot", 0x9503, {}],
  [
    "Equipment.SetCharacterEquipmentSlots",
    0x9504,
    {
      fields: [
        {
          name: "characterData",
          type: "schema",
          fields: equipmentCharacterDataSchema,
        },
        { name: "gameTime", type: "uint32", defaultValue: 0 },
        {
          name: "slots",
          type: "array",
          defaultValue: [],
          fields: [
            { name: "index", type: "uint32", defaultValue: 0 },
            { name: "slotId", type: "uint32", defaultValue: 0 },
          ],
        },
        { name: "unknownDword1", type: "uint32", defaultValue: 1 },
        { name: "unknownString1", type: "string", defaultValue: "" },
        { name: "unknownString2", type: "string", defaultValue: "#" },
        {
          name: "equipmentSlots",
          type: "array",
          defaultValue: [],
          fields: equipmentSlotSchema,
        },
        {
          name: "attachmentData",
          type: "array",
          defaultValue: [],
          fields: attachmentDataSchema,
        },
      ],
    },
  ],
];
