import { packItemData, parseItemData } from "./shared/shared";



export const vehiclePackets:any = [
    [
        "Vehicle.Owner",
        0x8801,
        {
          fields: [
            { name: "guid", type: "uint64string", defaultValue: "0" },
            { name: "characterId", type: "uint64string", defaultValue: "0" },
            { name: "unknownDword1", type: "uint32", defaultValue: 0 },
            { name: "vehicleId", type: "uint32", defaultValue: 0 },
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
        0x8802,
        {
          fields: [
            { name: "guid", type: "uint64string", defaultValue: "0" },
            { name: "characterId", type: "uint64string", defaultValue: "0" },
            { name: "vehicleId", type: "uint32", defaultValue: 0 },
            { name: "unknownDword1", type: "uint32", defaultValue: 0 },
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
            {
              name: "unknownArray2",
              type: "array",
              defaultValue: [],
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
                  defaultValue: [],
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
                              defaultValue: [],
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
                              defaultValue: [],
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
                  parser: parseItemData,
                  packer: packItemData,
                },
              ],
            },
            { name: "unknownBytes2", type: "byteswithlength", defaultValue: null },
          ],
        },
      ],
      [
        "Vehicle.StateData",
        0x8803,
        {
          fields: [
            { name: "guid", type: "uint64string", defaultValue: "0" },
            { name: "unknown3", type: "float", defaultValue: 0.0 },
            {
              name: "unknown4",
              type: "array",
              defaultValue: [],
              fields: [
                { name: "unknown1", type: "uint32", defaultValue: 0 },
                { name: "unknown2", type: "uint8", defaultValue: 0 },
              ],
            },
            {
              name: "unknown5",
              type: "array",
              defaultValue: [],
              fields: [
                { name: "unknown1", type: "uint32", defaultValue: 0 },
                { name: "unknown2", type: "uint8", defaultValue: 0 },
              ],
            },
          ],
        },
      ],
      [
        "Vehicle.StateDamage",
        0x8804,
        {
          fields: [
            { name: "guid", type: "uint64string", defaultValue: 0 },
            {
              name: "unknownVector1",
              type: "floatvector4",
              defaultValue: [0, 50, 0, 0],
            },
            {
              name: "unknownVector2",
              type: "floatvector4",
              defaultValue: [0, 0, 0, 0],
            },
          ],
        },
      ],
      ["Vehicle.PlayerManager", 0x8805, {}],
      [
        "Vehicle.Spawn",
        0x8806,
        {
          fields: [
            { name: "vehicleId", type: "uint32", defaultValue: 0 },
            { name: "loadoutTab", type: "uint32", defaultValue: 0 },
          ],
        },
      ],
      ["Vehicle.Tint", 0x8807, {}],
      ["Vehicle.LoadVehicleTerminalDefinitionManager", 0x8808, {}],
      ["Vehicle.ActiveWeapon", 0x8809, {}],
      ["Vehicle.Stats", 0x880a, {}],
      ["Vehicle.DamageInfo", 0x880b, {}],
      ["Vehicle.StatUpdate", 0x880c, {}],
      ["Vehicle.UpdateWeapon", 0x880d, {}],
      ["Vehicle.RemovedFromQueue", 0x880e, {}],
      [
        "Vehicle.UpdateQueuePosition",
        0x880f,
        {
          fields: [{ name: "queuePosition", type: "uint32", defaultValue: 0 }],
        },
      ],
      ["Vehicle.PadDestroyNotify", 0x8810, {}],
      [
        "Vehicle.SetAutoDrive",
        0x8811,
        {
          fields: [{ name: "guid", type: "uint64string", defaultValue: "0" }],
        },
      ],
      ["Vehicle.LockOnInfo", 0x8812, {}],
      ["Vehicle.LockOnState", 0x8813, {}],
      ["Vehicle.TrackingState", 0x8814, {}],
      ["Vehicle.CounterMeasureState", 0x8815, {}],
      [
        "Vehicle.LoadVehicleDefinitionManager",
        0x8816,
        {
          fields: [
            {
              name: "vehicleDefinitions",
              type: "array",
              defaultValue: [],
              fields: [
                { name: "vehicleId", type: "uint32", defaultValue: 0 },
                { name: "modelId", type: "uint32", defaultValue: 0 },
              ],
            },
          ],
        },
      ],
      ["Vehicle.AcquireState", 0x8817, {}],
      ["Vehicle.Dismiss", 0x8818, { fields: [] }],
      [
        "Vehicle.AutoMount",
        0x8819,
        {
          fields: [
            { name: "guid", type: "uint64string", defaultValue: "0" },
            { name: "unknownBoolean1", type: "boolean", defaultValue: false },
            { name: "unknownDword1", type: "uint32", defaultValue: 0 },
          ],
        },
      ],
      ["Vehicle.Deploy", 0x881a, {}],
      [
        "Vehicle.Engine",
        0x881b,
        {
          fields: [
            { name: "guid1", type: "uint64string", defaultValue: "0" },
            { name: "guid2", type: "uint64string", defaultValue: "0" },
            { name: "unknownBoolean", type: "boolean", defaultValue: false },
          ],
        },
      ],
      [
        "Vehicle.AccessType",
        0x881c,
        {
          fields: [
            {
              name: "vehicleGuid",
              type: "uint64string",
              defaultValue: "0x000000000000000000",
            },
            { name: "accessType", type: "uint16", defaultValue: 0 },
          ],
        },
      ],
      ["Vehicle.KickPlayer", 0x881d, {}],
      [
        "Vehicle.HealthUpdateOwner",
        0x881e,
        {
          fields: [
            { name: "vehicleGuid", type: "uint64string", defaultValue: "0" },
            { name: "health", type: "float", defaultValue: 0 },
          ],
        },
      ],
      ["Vehicle.OwnerPassengerList", 0x881f, {}],
      ["Vehicle.Kick", 0x8820, {}],
      ["Vehicle.NoAccess", 0x8821, {}],
      [
        "Vehicle.Expiration",
        0x8822,
        {
          fields: [{ name: "expireTime", type: "uint32", defaultValue: 0 }],
        },
      ],
      ["Vehicle.Group", 0x8823, {}],
      ["Vehicle.DeployResponse", 0x8824, {}],
      ["Vehicle.ExitPoints", 0x8825, {}],
      ["Vehicle.ControllerLogOut", 0x8826, {}],
      ["Vehicle.CurrentMoveMode", 0x8827, {
        fields: [
          { name: "characterId", type: "uint64string", defaultValue: "0" },
          { name: "moveMode", type: "uint8", defaultValue: 0 },
        ],
      }],
      ["Vehicle.ItemDefinitionRequest", 0x8828, {
        fields: []
      }],
      ["Vehicle.ItemDefinitionReply", 0x8829, {}],
      ["Vehicle.InventoryItems", 0x882a, {}],

]