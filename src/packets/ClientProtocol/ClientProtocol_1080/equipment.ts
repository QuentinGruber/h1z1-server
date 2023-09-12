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

import {
  attachmentSchema,
  equipmentCharacterSchema,
  equipmentSlotSchema
} from "./shared";
import { PacketStructures } from "types/packetStructure";

export const equipmentPackets: PacketStructures = [
  [
    "Equipment.SetCharacterEquipment",
    0x9501,
    {
      fields: [
        {
          name: "characterData",
          type: "schema",
          fields: equipmentCharacterSchema
        },
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
        { name: "unknownString1", type: "string", defaultValue: "" },
        { name: "unknownString2", type: "string", defaultValue: "#" },
        {
          name: "equipmentSlots",
          type: "array",
          defaultValue: [],
          fields: equipmentSlotSchema
        },
        {
          name: "attachmentData",
          type: "array",
          defaultValue: [],
          fields: attachmentSchema
        },
        { name: "unknownBoolean1", type: "boolean", defaultValue: false }
      ]
    }
  ],
  [
    "Equipment.SetCharacterEquipmentSlot",
    0x9502,
    {
      fields: [
        {
          name: "characterData",
          type: "schema",
          fields: equipmentCharacterSchema
        },
        {
          name: "equipmentSlot",
          type: "schema",
          fields: equipmentSlotSchema
        },
        {
          name: "attachmentData",
          type: "schema",
          fields: attachmentSchema
        }
      ]
    }
  ],
  [
    "Equipment.UnsetCharacterEquipmentSlot",
    0x9503,
    {
      fields: [
        {
          name: "characterData",
          type: "schema",
          fields: equipmentCharacterSchema
        },
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
        { name: "slotId", type: "uint32", defaultValue: 0 }
      ]
    }
  ],
  [
    "Equipment.SetCharacterEquipmentSlots",
    0x9504,
    {
      fields: [
        {
          name: "characterData",
          type: "schema",
          fields: equipmentCharacterSchema
        },
        { name: "gameTime", type: "uint32", defaultValue: 0 },
        {
          name: "slots",
          type: "array",
          defaultValue: [],
          fields: [
            { name: "index", type: "uint32", defaultValue: 0 },
            { name: "slotId", type: "uint32", defaultValue: 0 }
          ]
        },
        { name: "unknownDword1", type: "uint32", defaultValue: 1 },
        { name: "unknownString1", type: "string", defaultValue: "" },
        { name: "unknownString2", type: "string", defaultValue: "#" },
        {
          name: "equipmentSlots",
          type: "array",
          defaultValue: [],
          fields: equipmentSlotSchema
        },
        {
          name: "attachmentData",
          type: "array",
          defaultValue: [],
          fields: attachmentSchema
        }
      ]
    }
  ]
];
