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

export const experiencePackets: PacketStructures = [
  ["Experience.SetExperience", 0x8801, {}],
  [
    "Experience.SetExperienceRanks",
    0x8802,
    {
      fields: [
        {
          name: "experienceRanks",
          type: "array",
          defaultValue: [{}],
          fields: [
            { name: "unknownDword1", type: "uint32", defaultValue: 0 },
            {
              name: "experienceRankData",
              type: "array",
              defaultValue: [{}],
              fields: [
                { name: "experienceRequired", type: "uint32", defaultValue: 0 },
                {
                  name: "factionRanks",
                  type: "array",
                  defaultValue: [{}],
                  length: 4,
                  fields: [
                    { name: "nameId", type: "uint32", defaultValue: 0 },
                    { name: "unknownDword2", type: "uint32", defaultValue: 0 },
                    { name: "imageSetId", type: "uint32", defaultValue: 0 },
                    {
                      name: "rewards",
                      type: "array",
                      defaultValue: [{}],
                      fields: [
                        { name: "itemId", type: "uint32", defaultValue: 0 },
                        { name: "nameId", type: "uint32", defaultValue: 0 },
                        { name: "imageSetId", type: "uint32", defaultValue: 0 },
                        {
                          name: "itemCountMin",
                          type: "uint32",
                          defaultValue: 0
                        },
                        {
                          name: "itemCountMax",
                          type: "uint32",
                          defaultValue: 0
                        },
                        { name: "itemType", type: "uint32", defaultValue: 0 }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  ],
  [
    "Experience.SetExperienceRateTier",
    0x8803,
    {
      fields: [
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
        { name: "unknownDword2", type: "uint32", defaultValue: 0 },
        { name: "unknownDword3", type: "uint32", defaultValue: 0 },
        { name: "unknownDword4", type: "uint32", defaultValue: 0 },
        { name: "unknownDword5", type: "uint32", defaultValue: 0 }
      ]
    }
  ]
];
