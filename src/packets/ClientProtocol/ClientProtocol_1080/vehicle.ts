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

export const vehiclePackets: any = [
  [
    "Vehicle.Owner",
    0x8901,
    {
      fields: [
        { name: "guid", type: "uint64string", defaultValue: "0" },
        { name: "characterId", type: "uint64string", defaultValue: "0" },
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
        { name: "vehicleId", type: "uint32", defaultValue: 0 },
        {
          name: "passengers",
          type: "array",
          defaultValue: [{}],
          fields: [
            {
              name: "passengerData",
              type: "schema",
              fields: [
                {
                  name: "characterId",
                  type: "uint64string",
                  defaultValue: "0",
                },
                {
                  name: "characterData",
                  type: "schema",
                  fields: [
                    { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                    { name: "unknownDword2", type: "uint32", defaultValue: 0 },
                    { name: "unknownDword3", type: "uint32", defaultValue: 0 },
                    { name: "characterName", type: "string", defaultValue: "" },
                    {
                      name: "unknownString1",
                      type: "string",
                      defaultValue: "",
                    },
                  ],
                },
                { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                { name: "unknownString1", type: "string", defaultValue: "" },
              ],
            },
            { name: "unknownByte1", type: "uint8", defaultValue: 0 },
          ],
        },
      ],
    },
  ],
  [
    "Vehicle.Occupy",
    0x8902,
    {
      fields: [
        { name: "guid", type: "uint64string", defaultValue: "0" },
        { name: "characterId", type: "uint64string", defaultValue: "0" },
        { name: "vehicleId", type: "uint32", defaultValue: 0 },
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
        {
          name: "unknownArray1",
          type: "array",
          defaultValue: [{}],
          fields: [
            { name: "unknownDword1", type: "uint32", defaultValue: 0 },
            { name: "unknownBoolean1", type: "boolean", defaultValue: false },
          ],
        },
        {
          name: "passengers",
          type: "array",
          defaultValue: [],
          fields: [
            {
              name: "passengerData",
              type: "schema",
              fields: [
                {
                  name: "characterId",
                  type: "uint64string",
                  defaultValue: "0",
                },
                {
                  name: "characterData",
                  type: "schema",
                  fields: identitySchema,
                },
                { name: "unknownString1", type: "string", defaultValue: "" },
              ],
            },
            { name: "unknownByte1", type: "uint8", defaultValue: 0 },
          ],
        },
        {
          name: "unknownArray2",
          type: "array",
          defaultValue: [{}],
          fields: [
            { name: "unknownQword1", type: "uint64string", defaultValue: "0" },
          ],
        },
        {
          name: "unknownData1",
          type: "schema",
          fields: [
            { name: "unknownDword1", type: "uint32", defaultValue: 0 },
            {
              name: "unknownData1",
              type: "schema",
              fields: [
                { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                { name: "unknownByte1", type: "uint8", defaultValue: 0 },
              ],
            },
            { name: "unknownString1", type: "string", defaultValue: "" },
            { name: "unknownDword2", type: "uint32", defaultValue: 0 },
            { name: "unknownDword3", type: "uint32", defaultValue: 0 },
            { name: "unknownDword4", type: "uint32", defaultValue: 0 },
            { name: "unknownDword5", type: "uint32", defaultValue: 0 },
            {
              name: "unknownArray3",
              type: "array",
              defaultValue: [{}],
              fields: [
                { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                {
                  name: "unknownData1",
                  type: "schema",
                  fields: [
                    { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                    {
                      name: "unknownData1",
                      type: "schema",
                      fields: [
                        {
                          name: "unknownDword1",
                          type: "uint32",
                          defaultValue: 0,
                        },
                        {
                          name: "unknownByte1",
                          type: "uint8",
                          defaultValue: 0,
                        },
                        {
                          name: "unknownArray1",
                          type: "array",
                          defaultValue: [{}],
                          fields: [
                            {
                              name: "unknownDword1",
                              type: "uint32",
                              defaultValue: 0,
                            },
                          ],
                        },
                        {
                          name: "unknownArray2",
                          type: "array",
                          defaultValue: [{}],
                          fields: [
                            {
                              name: "unknownDword1",
                              type: "uint32",
                              defaultValue: 0,
                            },
                            {
                              name: "unknownDword2",
                              type: "uint32",
                              defaultValue: 0,
                            },
                          ],
                        },
                      ],
                    },
                    { name: "unknownDword2", type: "uint32", defaultValue: 0 },
                    { name: "unknownDword3", type: "uint32", defaultValue: 0 },
                  ],
                },
              ],
            },
          ],
        },
        {
          name: "unknownBytes1",
          type: "byteswithlength",
          defaultValue: null,
          fields: [
            {
              name: "itemData",
              type: "custom",
              //parser: parseItemData,
              //packer: packItemData,
            },
          ],
        },
        { name: "unknownBytes2", type: "byteswithlength", defaultValue: null },
      ],
    },
  ],
  [
    "Vehicle.StateData",
    0x8903,
    {
      fields: [
        { name: "guid", type: "uint64string", defaultValue: "0" },
        { name: "unknownFloat1", type: "float", defaultValue: 0.0 },
        {
          name: "unknownArray1",
          type: "array",
          defaultValue: [],
          fields: [
            { name: "unknownDword1", type: "uint32", defaultValue: 0 },
            { name: "unknownBoolean1", type: "boolean", defaultValue: false },
          ],
        },
        {
          name: "unknownArray2",
          type: "array",
          defaultValue: [],
          fields: [
            { name: "unknownDword1", type: "uint32", defaultValue: 0 },
            { name: "unknownByte1", type: "uint8", defaultValue: 0 },
          ],
        },
      ],
    },
  ],
  ["Vehicle.StateDamage", 0x8904, {}],
  ["Vehicle.PlayerManager", 0x8905, {}],
  [
    "Vehicle.Spawn",
    0x8906,
    {
      fields: [
        { name: "vehicleId", type: "uint32", defaultValue: 0 },
        { name: "loadoutTab", type: "uint32", defaultValue: 0 },
      ],
    },
  ],
  ["Vehicle.Tint", 0x8907, {}],
  ["Vehicle.LoadVehicleTerminalDefinitionManager", 0x8908, {}],
  ["Vehicle.ActiveWeapon", 0x8909, {}],
  ["Vehicle.Stats", 0x890a, {}],
  ["Vehicle.DamageInfo", 0x890b, {}],
  ["Vehicle.StatUpdate", 0x890c, {}],
  ["Vehicle.UpdateWeapon", 0x890d, {}],
  ["Vehicle.RemovedFromQueue", 0x890e, {}],
  [
    "Vehicle.UpdateQueuePosition",
    0x890f,
    {
      fields: [{ name: "queuePosition", type: "uint32", defaultValue: 0 }],
    },
  ],
  ["Vehicle.PadDestroyNotify", 0x8910, {}],
  [
    "Vehicle.SetAutoDrive",
    0x8911,
    {
      fields: [{ name: "guid", type: "uint64string", defaultValue: "0" }],
    },
  ],
  ["Vehicle.LockOnInfo", 0x8912, {}],
  ["Vehicle.LockOnState", 0x8913, {}],
  ["Vehicle.TrackingState", 0x8914, {}],
  ["Vehicle.CounterMeasureState", 0x8915, {}],
  [
    "Vehicle.LoadVehicleDefinitionManager",
    0x8916,
    {
      fields: [
        {
          name: "vehicleDefinitions",
          type: "array",
          defaultValue: [{}],
          fields: [
            { name: "vehicleId", type: "uint32", defaultValue: 0 },
            { name: "modelId", type: "uint32", defaultValue: 0 },
          ],
        },
      ],
    },
  ],
  ["Vehicle.AcquireState", 0x8917, {}],
  ["Vehicle.Dismiss", 0x8918, {}],
  [
    "Vehicle.AutoMount",
    0x8919,
    {
      fields: [
        { name: "guid", type: "uint64string", defaultValue: "0" },
        { name: "unknownBoolean1", type: "boolean", defaultValue: false },
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
      ],
    },
  ],
  ["Vehicle.Deploy", 0x891a, {}],
  [
    "Vehicle.Engine",
    0x891b,
    {
      fields: [
        { name: "guid1", type: "uint64string", defaultValue: "0" },
        { name: "guid2", type: "uint64string", defaultValue: "0" },
        { name: "engineOn", type: "boolean", defaultValue: false },
      ],
    },
  ],
  ["Vehicle.AccessType", 0x891c, {}],
  ["Vehicle.KickPlayer", 0x891d, {}],
  ["Vehicle.HealthUpdateOwner", 0x891e, {}],
  [
    "Vehicle.OwnerPassengerList",
    0x891f,
    {
      fields: [
        { name: "characterId", type: "uint64string", defaultValue: "0" },
        {
          name: "passengers",
          type: "array",
          defaultValue: [],
          fields: [
            { name: "characterId", type: "uint64string", defaultValue: "0" },
            {
              name: "identity",
              type: "schema",
              defaultValue: {},
              fields: identitySchema,
            },
            { name: "unknownString1", type: "string", defaultValue: "" },
            { name: "unknownByte1", type: "uint8", defaultValue: 0 },
          ],
        },
      ],
    },
  ],
  ["Vehicle.Kick", 0x8920, {}],
  ["Vehicle.NoAccess", 0x8921, {}],
  [
    "Vehicle.Expiration",
    0x8922,
    {
      fields: [{ name: "expireTime", type: "uint32", defaultValue: 0 }],
    },
  ],
  ["Vehicle.Group", 0x8923, {}],
  ["Vehicle.DeployResponse", 0x8924, {}],
  ["Vehicle.ExitPoints", 0x8925, {}],
  ["Vehicle.ControllerLogOut", 0x8926, {}],
  ["Vehicle.CurrentMoveMode", 0x8927, {}],
  ["Vehicle.ItemDefinitionRequest", 0x8928, {}],
  ["Vehicle.ItemDefinitionReply", 0x8929, {}],
  ["Vehicle.InventoryItems", 0x892a, {}],
];
