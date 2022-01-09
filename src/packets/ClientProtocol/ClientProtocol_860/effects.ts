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

import { effectTagDataSchema } from "./shared";

export const effectsPackets: any = [
  [
    "Effect.AddEffect",
    0x9e01,
    {
      fields: [
        {
          name: "unknownData1",
          type: "schema",
          fields: [
            { name: "unknownDword1", type: "uint32", defaultValue: 0 },
            { name: "unknownDword2", type: "uint32", defaultValue: 0 },
            { name: "unknownDword3", type: "uint32", defaultValue: 0 },
          ],
        },
        {
          name: "unknownData2",
          type: "schema",
          fields: [
            { name: "unknownQword1", type: "uint64string", defaultValue: "0" },
            { name: "unknownQword2", type: "uint64string", defaultValue: "0" },
          ],
        },
        {
          name: "unknownData3",
          type: "schema",
          fields: [
            { name: "unknownQword1", type: "uint64string", defaultValue: "0" },
            { name: "unknownQword2", type: "uint64string", defaultValue: "0" },
            {
              name: "unknownVector1",
              type: "floatvector4",
              defaultValue: [0, 0, 0, 0],
            },
          ],
        },
      ],
    },
  ],
  [
    "Effect.UpdateEffect",
    0x9e02,
    {
      fields: [
        {
          name: "unknownData1",
          type: "schema",
          fields: [
            { name: "unknownDword1", type: "uint32", defaultValue: 0 },
            { name: "unknownDword2", type: "uint32", defaultValue: 0 },
            { name: "unknownDword3", type: "uint32", defaultValue: 0 },
          ],
        },
        {
          name: "unknownData2",
          type: "schema",
          fields: [
            { name: "unknownDword1", type: "uint32", defaultValue: 0 },
            { name: "unknownQword1", type: "uint64string", defaultValue: "0" },
          ],
        },
        {
          name: "unknownData3",
          type: "schema",
          fields: [
            { name: "unknownQword1", type: "uint64string", defaultValue: "0" },
            { name: "unknownQword2", type: "uint64string", defaultValue: "0" },
            {
              name: "unknownVector1",
              type: "floatvector4",
              defaultValue: [0, 0, 0, 0],
            },
          ],
        },
      ],
    },
  ],
  [
    "Effect.RemoveEffect",
    0x9e03,
    {
      fields: [
        {
          name: "unknownData1",
          type: "schema",
          fields: [
            { name: "unknownDword1", type: "uint32", defaultValue: 0 },
            { name: "unknownDword2", type: "uint32", defaultValue: 0 },
            { name: "unknownDword3", type: "uint32", defaultValue: 0 },
          ],
        },
        {
          name: "unknownData2",
          type: "schema",
          fields: [
            { name: "unknownQword1", type: "uint64string", defaultValue: "0" },
          ],
        },
        {
          name: "unknownData3",
          type: "schema",
          fields: [
            { name: "unknownQword1", type: "uint64string", defaultValue: "0" },
            { name: "unknownQword2", type: "uint64string", defaultValue: "0" },
            {
              name: "unknownVector1",
              type: "floatvector4",
              defaultValue: [0, 0, 0, 0],
            },
          ],
        },
      ],
    },
  ],
  [
    "Effect.AddEffectTag",
    0x9e04,
    {
      fields: effectTagDataSchema,
    },
  ],
  [
    "Effect.RemoveEffectTag",
    0x9e05,
    {
      fields: [
        {
          name: "unknownData1",
          type: "schema",
          fields: [
            { name: "unknownQword1", type: "uint64string", defaultValue: "0" },
          ],
        },
        {
          name: "unknownData2",
          type: "schema",
          fields: [
            { name: "unknownDword1", type: "uint32", defaultValue: 0 },
            { name: "unknownQword1", type: "uint64string", defaultValue: "0" },
            { name: "unknownQword2", type: "uint64string", defaultValue: "0" },
          ],
        },
      ],
    },
  ],
  [
    "Effect.TargetBlockedEffect",
    0x9e06,
    {
      fields: [
        {
          name: "unknownData1",
          type: "schema",
          fields: [
            { name: "unknownQword1", type: "uint64string", defaultValue: "0" },
          ],
        },
      ],
    },
  ],
];
