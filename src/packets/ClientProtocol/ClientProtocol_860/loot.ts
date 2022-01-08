import { lootItemSchema } from "./shared";



export const lootPackets:any = [
    [
        "Loot.Reply",
        0x6901,
        {
          fields: [
            {
              name: "items",
              type: "array",
              defaultValue: [],
              fields: [...lootItemSchema],
            },
          ],
        },
      ],
      ["Loot.Request", 0x6902, {}],
      ["Loot.DiscardRequest", 0x6903, {}],
      ["Loot.LootAllRequest", 0x6904, {}],

]