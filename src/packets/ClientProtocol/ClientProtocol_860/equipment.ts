


export const equipmentPackets:any = [
    [
        "Equipment.SetCharacterEquipment",
        0x9401,
        {
          fields: [
            { name: "profileId", type: "uint32", defaultValue: 0 },
            { name: "characterId", type: "uint64string", defaultValue: "0" },
            { name: "unknownDword1", type: "uint32", defaultValue: 0 },
            { name: "unknownString1", type: "string", defaultValue: "" },
            { name: "unknownString2", type: "string", defaultValue: "" },
            {
              name: "equipmentSlots",
              type: "array",
              defaultValue: [],
              fields: [
                { name: "equipmentSlotId", type: "uint32", defaultValue: 0 },
                {
                  name: "equipmentSlotData",
                  type: "schema",
                  fields: [
                    { name: "equipmentSlotId", type: "uint32", defaultValue: 0 },
                    { name: "guid", type: "uint64string", defaultValue: "0" },
                    { name: "unknownString1", type: "string", defaultValue: "" },
                    { name: "unknownString2", type: "string", defaultValue: "#" },
                  ],
                },
              ],
            },
            {
              name: "attachmentData",
              type: "array",
              defaultValue: [],
              fields: [
                { name: "modelName", type: "string", defaultValue: "" },
                { name: "defaultTextureAlias", type: "string", defaultValue: "" },
                { name: "tintAlias", type: "string", defaultValue: "" },
                { name: "unknownString2", type: "string", defaultValue: "" },
                { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                { name: "enableDebug", type: "uint32", defaultValue: 0 },
                { name: "slotId", type: "uint32", defaultValue: 0 },
              ],
            },
          ],
        },
      ],
      ["Equipment.SetCharacterEquipmentSlot", 0x9402, {}],
      ["Equipment.UnsetCharacterEquipmentSlot", 0x9403, {}],
      [
        "Equipment.SetCharacterEquipmentSlots",
        0x9404,
        {
          fields: [
            { name: "profileId", type: "uint32", defaultValue: 0 },
            { name: "characterId", type: "uint64string", defaultValue: "0" },
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
            { name: "unknown1", type: "uint32", defaultValue: 0 },
            { name: "unknown2", type: "uint32", defaultValue: 0 },
            { name: "unknown3", type: "uint32", defaultValue: 0 },
            {
              name: "textures",
              type: "array",
              defaultValue: [],
              fields: [
                { name: "index", type: "uint32", defaultValue: 0 },
                { name: "slotId", type: "uint32", defaultValue: 0 },
                { name: "itemId", type: "uint32", defaultValue: 0 },
                { name: "unknown1", type: "uint32", defaultValue: 0 },
                { name: "textureAlias", type: "string", defaultValue: "" },
                { name: "unknown2", type: "string", defaultValue: "" },
              ],
            },
            {
              name: "models",
              type: "array",
              defaultValue: [],
              fields: [
                { name: "modelName", type: "string", defaultValue: "" },
                { name: "unknown1", type: "string", defaultValue: "" },
                { name: "textureAlias", type: "string", defaultValue: "" },
                { name: "unknown3", type: "string", defaultValue: "" },
                { name: "unknown4", type: "uint32", defaultValue: 0 },
                { name: "unknown5", type: "uint32", defaultValue: 0 },
                { name: "slotId", type: "uint32", defaultValue: 0 },
              ],
            },
          ],
        },
      ],

]