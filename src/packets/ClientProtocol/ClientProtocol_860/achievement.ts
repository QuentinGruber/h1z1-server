// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2024 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

import { achievementDataSchema, objectiveDataSchema } from "./shared";

export const achievementPackets: any = [
  [
    "Achievement.Add",
    0x6502,
    {
      fields: [
        { name: "achievementId", type: "uint32", defaultValue: 0 },
        {
          name: "achievementData",
          type: "schema",
          fields: objectiveDataSchema
        }
      ]
    }
  ],
  [
    "Achievement.Initialize",
    0x6503,
    {
      fields: [
        {
          name: "clientAchievements",
          type: "array",
          defaultValue: [],
          fields: achievementDataSchema
        },
        {
          name: "achievementData",
          type: "byteswithlength",
          fields: [
            {
              name: "achievements",
              type: "array",
              defaultValue: [],
              fields: achievementDataSchema
            }
          ]
        }
      ]
    }
  ],
  ["Achievement.Complete", 0x6504, {}],
  ["Achievement.ObjectiveAdded", 0x6505, {}],
  ["Achievement.ObjectiveActivated", 0x6506, {}],
  ["Achievement.ObjectiveUpdate", 0x6507, {}],
  ["Achievement.ObjectiveComplete", 0x6508, {}]
];
