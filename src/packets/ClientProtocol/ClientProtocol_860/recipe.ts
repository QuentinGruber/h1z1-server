


export const recipePackets:any = [
    ["Recipe.Add", 0x2601, {}],
    ["Recipe.ComponentUpdate", 0x2602, {}],
    ["Recipe.Remove", 0x2603, {}],
    [
      "Recipe.List",
      0x2605,
      {
        fields: [
          {
            name: "recipes",
            type: "array",
            defaultValue: [],
            fields: [
              { name: "recipeId", type: "uint32", defaultValue: 0 },
              {
                name: "recipeData",
                type: "schema",
                fields: [
                  { name: "recipeId", type: "uint32", defaultValue: 0 },
                  { name: "nameId", type: "uint32", defaultValue: 0 },
                  { name: "iconId", type: "uint32", defaultValue: 0 },
                  { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                  { name: "descriptionId", type: "uint32", defaultValue: 0 },
                  { name: "rewardCount", type: "uint32", defaultValue: 0 },
                  { name: "membersOnly", type: "boolean", defaultValue: false },
                  { name: "discovered", type: "uint32", defaultValue: 0 },
                  {
                    name: "components",
                    type: "array",
                    defaultValue: [],
                    fields: [
                      { name: "componentId", type: "uint32", defaultValue: 0 },
                      {
                        name: "componentData",
                        type: "schema",
                        fields: [
                          { name: "nameId", type: "uint32", defaultValue: 0 },
                          { name: "iconId", type: "uint32", defaultValue: 0 },
                          {
                            name: "unknownDword1",
                            type: "uint32",
                            defaultValue: 0,
                          },
                          {
                            name: "descriptionId",
                            type: "uint32",
                            defaultValue: 0,
                          },
                          {
                            name: "requiredCount",
                            type: "uint32",
                            defaultValue: 0,
                          },
                          {
                            name: "unknownDword2",
                            type: "uint32",
                            defaultValue: 0,
                          },
                          {
                            name: "unknownDword3",
                            type: "uint32",
                            defaultValue: 0,
                          },
                          {
                            name: "unknownDword4",
                            type: "uint32",
                            defaultValue: 0,
                          },
                          { name: "itemId", type: "uint32", defaultValue: 0 },
                        ],
                      },
                    ],
                  },
                  { name: "rewardItemId", type: "uint32", defaultValue: 0 },
                ],
              },
            ],
          },
        ],
      },
    ]

]