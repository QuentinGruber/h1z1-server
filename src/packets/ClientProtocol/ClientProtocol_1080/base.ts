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
  characterResourceData,
  collectionsSchema,
  currencySchema,
  effectTagsSchema,
  equipmentSlotSchema,
  firemodesSchema,
  fullNpcSchema,
  fullPcSchema,
  itemSchema,
  lightWeightNpcSchema,
  lightWeightPcSchema,
  loadoutSlotsSchema,
  objectiveSchema,
  packPositionUpdateData,
  packUnsignedIntWith2bitLengthValue,
  readPositionUpdateData,
  readUnsignedIntWith2bitLengthValue,
  recipeData,
  packItemWeaponData,
  containers
} from "./shared";
import {
  achievementSchema,
  identitySchema,
  profileSchema,
  rewardBundleSchema,
  skyData,
  statSchema
} from "./shared";
import { packWeaponPacket, parseWeaponPacket } from "./weapon";
import { PacketStructures } from "types/packetStructure";

export const basePackets: PacketStructures = [
  ["Server", 0x01, {}],
  ["ClientFinishedLoading", 0x02, {}],
  [
    "SendSelfToClient",
    0x03,
    {
      fields: [
        {
          name: "data",
          type: "byteswithlength",
          fields: [
            { name: "guid", type: "uint64string", defaultValue: "" },
            { name: "characterId", type: "uint64string", defaultValue: "" },
            {
              name: "transientId",
              type: "custom",
              parser: readUnsignedIntWith2bitLengthValue,
              packer: packUnsignedIntWith2bitLengthValue
            },
            { name: "lastLoginDate", type: "uint64string", defaultValue: "" },
            { name: "actorModelId", type: "uint32", defaultValue: 0 },
            { name: "headActor", type: "string", defaultValue: "" },
            { name: "hairModel", type: "string", defaultValue: "" },
            { name: "hairTint", type: "uint32", defaultValue: 0 },
            { name: "eyeTint", type: "uint32", defaultValue: 0 },
            { name: "emptyTexture", type: "string", defaultValue: "" },
            { name: "unknownString3", type: "string", defaultValue: "" },
            { name: "unknownString4", type: "string", defaultValue: "" },
            { name: "headId", type: "uint32", defaultValue: 0 },
            { name: "unknownDword6", type: "uint32", defaultValue: 0 },
            { name: "shaderGroupId", type: "uint32", defaultValue: 664 },
            { name: "unknownDword9", type: "uint32", defaultValue: 0 },
            { name: "unknownDword10", type: "uint32", defaultValue: 0 },
            { name: "position", type: "floatvector4", defaultValue: 0 },
            { name: "rotation", type: "floatvector4", defaultValue: 0 },
            { name: "identity", type: "schema", fields: identitySchema },
            { name: "unknownDword11", type: "uint32", defaultValue: 0 },
            {
              name: "currency",
              type: "array",
              defaultValue: [],
              fields: currencySchema
            },
            { name: "creationDate", type: "uint64string", defaultValue: "" },
            { name: "unknownDword15", type: "uint32", defaultValue: 0 },
            { name: "unknownDword16", type: "uint32", defaultValue: 0 },
            { name: "unknownBoolean1", type: "boolean", defaultValue: false },
            { name: "isRespawning", type: "boolean", defaultValue: false },
            { name: "isMember", type: "uint32", defaultValue: 0 },
            { name: "unknownDword18", type: "uint32", defaultValue: 0 },
            { name: "unknownBoolean3", type: "boolean", defaultValue: false },
            { name: "unknownDword19", type: "uint32", defaultValue: 0 },
            { name: "unknownDword26", type: "uint32", defaultValue: 0 },
            { name: "unknownDword21", type: "uint32", defaultValue: 0 },
            { name: "unknownDword22", type: "uint32", defaultValue: 0 },
            { name: "unknownDword23", type: "uint32", defaultValue: 0 },
            { name: "unknownTime1", type: "uint64string", defaultValue: "" },
            { name: "unknownTime2", type: "uint64string", defaultValue: "" },
            { name: "unknownDword24", type: "uint32", defaultValue: 0 },
            { name: "unknownBoolean5", type: "boolean", defaultValue: false },
            { name: "unknownDword25", type: "uint32", defaultValue: 0 },
            {
              name: "profiles",
              type: "array",
              defaultValue: [],
              fields: profileSchema
            },
            { name: "currentProfile", type: "uint32", defaultValue: 0 },

            {
              name: "unknownArray1",
              type: "array",
              defaultValue: [],
              fields: [
                { name: "unknownDword1", type: "int32", defaultValue: 0 },
                { name: "unknownDword2", type: "int32", defaultValue: 0 }
              ]
            },
            {
              name: "collections",
              type: "array",
              defaultValue: [],
              fields: collectionsSchema
            },
            {
              name: "inventory",
              type: "schema",
              defaultValue: {},
              fields: [
                {
                  name: "items",
                  type: "array",
                  defaultValue: [],
                  fields: [
                    ...itemSchema,
                    {
                      name: "weaponData",
                      type: "custom",
                      defaultValue: {},
                      packer: packItemWeaponData
                    }
                  ]
                },
                { name: "unknownDword1", type: "uint32", defaultValue: 0 }
              ]
            },
            { name: "gender", type: "uint32", defaultValue: 0 },
            {
              name: "characterQuests",
              type: "schema",
              defaultValue: {},
              fields: [
                {
                  name: "quests",
                  type: "array",
                  defaultValue: [],
                  fields: [
                    { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                    { name: "unknownDword2", type: "uint32", defaultValue: 0 },
                    { name: "unknownDword3", type: "uint32", defaultValue: 0 },
                    { name: "unknownDword4", type: "uint32", defaultValue: 0 },
                    {
                      name: "unknownBoolean1",
                      type: "boolean",
                      defaultValue: true
                    },
                    {
                      name: "unknownGuid1",
                      type: "uint64string",
                      defaultValue: ""
                    },
                    { name: "unknownDword5", type: "uint32", defaultValue: 0 },
                    {
                      name: "unknownBoolean2",
                      type: "boolean",
                      defaultValue: true
                    },
                    { name: "unknownDword6", type: "uint32", defaultValue: 0 },
                    {
                      name: "reward",
                      type: "schema",
                      defaultValue: {},
                      fields: rewardBundleSchema
                    },
                    {
                      name: "unknownArray1",
                      type: "array",
                      defaultValue: [],
                      fields: [
                        {
                          name: "unknownDword1",
                          type: "uint32",
                          defaultValue: 0
                        },
                        {
                          name: "unknownData1",
                          type: "schema",
                          defaultValue: {},
                          fields: [
                            {
                              name: "unknownDword1",
                              type: "uint32",
                              defaultValue: 0
                            },
                            {
                              name: "unknownDword2",
                              type: "uint32",
                              defaultValue: 0
                            },
                            {
                              name: "unknownDword3",
                              type: "uint32",
                              defaultValue: 0
                            },
                            {
                              name: "unknownBoolean1",
                              type: "boolean",
                              defaultValue: true
                            },
                            {
                              name: "reward",
                              type: "schema",
                              defaultValue: {},
                              fields: rewardBundleSchema
                            },
                            {
                              name: "unknownDword4",
                              type: "uint32",
                              defaultValue: 0
                            },
                            {
                              name: "unknownDword5",
                              type: "uint32",
                              defaultValue: 0
                            },
                            {
                              name: "unknownDword6",
                              type: "uint32",
                              defaultValue: 0
                            },
                            {
                              name: "unknownDword7",
                              type: "uint32",
                              defaultValue: 0
                            },
                            {
                              name: "unknownBoolean2",
                              type: "boolean",
                              defaultValue: true
                            },
                            {
                              name: "unknownDword8",
                              type: "uint32",
                              defaultValue: 0
                            },
                            {
                              name: "unknownDword9",
                              type: "uint32",
                              defaultValue: 0
                            },
                            {
                              name: "unknownData1",
                              type: "schema",
                              defaultValue: {},
                              fields: [
                                {
                                  name: "unknownDword1",
                                  type: "uint32",
                                  defaultValue: 0
                                },
                                {
                                  name: "unknownDword2",
                                  type: "uint32",
                                  defaultValue: 0
                                },
                                {
                                  name: "unknownDword3",
                                  type: "uint32",
                                  defaultValue: 0
                                },
                                {
                                  name: "unknownDword4",
                                  type: "uint32",
                                  defaultValue: 0
                                }
                              ]
                            }
                          ]
                        }
                      ]
                    },
                    { name: "unknownDword7", type: "uint32", defaultValue: 0 },
                    {
                      name: "unknownBoolean3",
                      type: "boolean",
                      defaultValue: true
                    },
                    {
                      name: "unknownBoolean4",
                      type: "boolean",
                      defaultValue: true
                    }
                  ]
                },
                { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                { name: "unknownDword2", type: "uint32", defaultValue: 0 },
                {
                  name: "unknownBoolean1",
                  type: "boolean",
                  defaultValue: true
                },
                { name: "unknownDword3", type: "uint32", defaultValue: 0 },
                { name: "unknownDword4", type: "uint32", defaultValue: 0 }
              ]
            },
            {
              name: "characterAchievements",
              type: "array",
              defaultValue: [],
              fields: achievementSchema
            },
            {
              name: "acquaintances",
              type: "array",
              defaultValue: [],
              fields: [
                {
                  name: "unknownGuid1",
                  type: "uint64string",
                  defaultValue: ""
                },
                { name: "unknownString1", type: "string", defaultValue: "" },
                { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                {
                  name: "unknownGuid2",
                  type: "uint64string",
                  defaultValue: ""
                },
                {
                  name: "unknownBoolean1",
                  type: "boolean",
                  defaultValue: true
                }
              ]
            },
            {
              name: "recipes",
              type: "array",
              defaultValue: [],
              fields: recipeData
            },
            {
              name: "mounts",
              type: "array",
              defaultValue: [],
              fields: [
                { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                { name: "unknownDword2", type: "uint32", defaultValue: 0 },
                { name: "unknownDword3", type: "uint32", defaultValue: 0 },
                {
                  name: "unknownQword1",
                  type: "uint64string",
                  defaultValue: ""
                },
                {
                  name: "unknownBoolean1",
                  type: "boolean",
                  defaultValue: true
                },
                { name: "unknownDword4", type: "uint32", defaultValue: 0 },
                { name: "unknownString1", type: "string", defaultValue: "" }
              ]
            },
            {
              name: "sendFirstTimeEvents",
              type: "boolean",
              defaultValue: true
            },
            {
              name: "unknownCoinStoreData",
              type: "schema",
              defaultValue: {},
              fields: [
                {
                  name: "unknownArray1",
                  type: "array",
                  defaultValue: [],
                  fields: [
                    { name: "unknownDword1", type: "uint32", defaultValue: 0 }
                  ]
                }
              ]
            },
            {
              name: "unknownArray2",
              type: "array",
              defaultValue: [],
              fields: [
                { name: "unknownDword1", type: "uint32", defaultValue: 0 }
              ]
            },
            {
              name: "unknownEffectArray",
              type: "array",
              defaultValue: [],
              fields: [
                {
                  name: "effectTag",
                  type: "schema",
                  defaultValue: {},
                  fields: effectTagsSchema
                },
                { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                {
                  name: "unknownBoolean1",
                  type: "boolean",
                  defaultValue: true
                },
                { name: "unknownDword2", type: "uint32", defaultValue: 0 },
                { name: "unknownDword3", type: "uint32", defaultValue: 0 },
                {
                  name: "unknownArray1",
                  type: "array",
                  defaultValue: [],
                  fields: [
                    { name: "unknownDword1", type: "uint32", defaultValue: 0 }
                  ]
                }
              ]
            },
            {
              name: "stats",
              type: "array",
              defaultValue: [],
              fields: [
                { name: "statId", type: "uint32", defaultValue: 0 },
                {
                  name: "statData",
                  type: "schema",
                  defaultValue: {},
                  fields: statSchema
                }
              ]
            },
            {
              name: "playerTitles",
              type: "array",
              defaultValue: [],
              fields: [
                { name: "titleId", type: "uint32", defaultValue: 0 },
                { name: "titleType", type: "uint32", defaultValue: 0 },
                { name: "stringId", type: "uint32", defaultValue: 0 }
              ]
            },
            { name: "currentPlayerTitle", type: "uint32", defaultValue: 0 },

            {
              name: "unknownArray13",
              type: "array",
              defaultValue: [],
              fields: [
                { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                { name: "unknownDword2", type: "uint32", defaultValue: 0 }
              ]
            },
            {
              name: "unknownArray14",
              type: "array",
              defaultValue: [],
              fields: [
                { name: "unknownDword1", type: "uint32", defaultValue: 0 }
              ]
            },
            { name: "unknownDword33", type: "uint32", defaultValue: 0 },
            {
              name: "FIRE_MODES_1",
              type: "array",
              defaultValue: [],
              fields: firemodesSchema
            },
            {
              name: "FIRE_MODES_2",
              type: "array",
              defaultValue: [],
              fields: firemodesSchema
            },
            {
              name: "unknownArray17",
              type: "array",
              defaultValue: [],
              fields: [
                {
                  name: "unknownBoolean1",
                  type: "boolean",
                  defaultValue: true
                }
              ]
            },

            { name: "unknownDword34", type: "uint32", defaultValue: 0 },
            { name: "unknownDword35", type: "uint32", defaultValue: 0 },
            {
              name: "unknownAbilityData1",
              type: "schema",
              defaultValue: {},
              fields: [
                {
                  name: "unknownArray1",
                  type: "array",
                  defaultValue: [],
                  fields: [
                    { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                    {
                      name: "unknownData1",
                      type: "schema",
                      defaultValue: {},
                      fields: [
                        {
                          name: "unknownDword1",
                          type: "uint32",
                          defaultValue: 0
                        },
                        {
                          name: "unknownArray1",
                          type: "array",
                          defaultValue: [],
                          fields: [
                            {
                              name: "unknownDword1",
                              type: "uint32",
                              defaultValue: 0
                            },
                            {
                              name: "unknownDword2",
                              type: "uint32",
                              defaultValue: 0
                            },
                            {
                              name: "unknownDword3",
                              type: "uint32",
                              defaultValue: 0
                            }
                          ]
                        },
                        {
                          name: "unknownDword2",
                          type: "uint32",
                          defaultValue: 0
                        },
                        {
                          name: "unknownDword3",
                          type: "uint32",
                          defaultValue: 0
                        },
                        {
                          name: "unknownByte1",
                          type: "uint8",
                          defaultValue: 0
                        }
                      ]
                    }
                  ]
                },
                {
                  name: "unknownArray2",
                  type: "array",
                  defaultValue: [],
                  fields: [
                    { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                    {
                      name: "unknownData1",
                      type: "schema",
                      defaultValue: {},
                      fields: [
                        {
                          name: "unknownDword1",
                          type: "uint32",
                          defaultValue: 0
                        },
                        {
                          name: "unknownArray1",
                          type: "array",
                          defaultValue: [],
                          fields: [
                            {
                              name: "unknownDword1",
                              type: "uint32",
                              defaultValue: 0
                            },
                            {
                              name: "unknownDword2",
                              type: "uint32",
                              defaultValue: 0
                            },
                            {
                              name: "unknownDword3",
                              type: "uint32",
                              defaultValue: 0
                            }
                          ]
                        },
                        {
                          name: "unknownDword2",
                          type: "uint32",
                          defaultValue: 0
                        },
                        {
                          name: "unknownDword3",
                          type: "uint32",
                          defaultValue: 0
                        },
                        {
                          name: "unknownByte1",
                          type: "uint8",
                          defaultValue: 0
                        }
                      ]
                    }
                  ]
                },
                {
                  name: "unknownArray3",
                  type: "array",
                  defaultValue: [],
                  fields: [
                    { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                    { name: "unknownDword2", type: "uint32", defaultValue: 0 }
                  ]
                }
              ]
            },

            {
              name: "unknownAbilityData2",
              type: "schema",
              defaultValue: {},
              fields: [
                {
                  name: "abilityLines1",
                  type: "array",
                  defaultValue: [],
                  fields: [
                    { name: "abilityLineId", type: "uint32", defaultValue: 0 },
                    {
                      name: "abilityLineData",
                      type: "schema",
                      defaultValue: {},
                      fields: [
                        {
                          name: "abilityLineId",
                          type: "uint32",
                          defaultValue: 0
                        },
                        { name: "abilityId", type: "uint32", defaultValue: 0 },
                        {
                          name: "abilityLineIndex",
                          type: "uint32",
                          defaultValue: 0
                        }
                      ]
                    }
                  ]
                },
                {
                  name: "abilityLines2",
                  type: "array",
                  defaultValue: [],
                  fields: [
                    { name: "abilityLineId", type: "uint32", defaultValue: 0 },
                    {
                      name: "abilityLineData",
                      type: "schema",
                      defaultValue: {},
                      fields: [
                        {
                          name: "abilityLineId",
                          type: "uint32",
                          defaultValue: 0
                        },
                        { name: "abilityId", type: "uint32", defaultValue: 0 },
                        {
                          name: "abilityLineIndex",
                          type: "uint32",
                          defaultValue: 0
                        }
                      ]
                    }
                  ]
                },
                {
                  name: "abilityLines3",
                  type: "array",
                  defaultValue: [],
                  fields: [
                    { name: "abilityLineId", type: "uint32", defaultValue: 0 },
                    {
                      name: "abilityLineData",
                      type: "schema",
                      defaultValue: {},
                      fields: [
                        {
                          name: "abilityLineId",
                          type: "uint32",
                          defaultValue: 0
                        },
                        { name: "abilityId", type: "uint32", defaultValue: 0 },
                        {
                          name: "abilityLineIndex",
                          type: "uint32",
                          defaultValue: 0
                        }
                      ]
                    }
                  ]
                },
                {
                  name: "abilityLines4",
                  type: "array",
                  defaultValue: [],
                  fields: [
                    { name: "abilityLineId", type: "uint32", defaultValue: 0 },
                    {
                      name: "abilityLineData",
                      type: "schema",
                      defaultValue: {},
                      fields: [
                        {
                          name: "abilityLineId",
                          type: "uint32",
                          defaultValue: 0
                        },
                        { name: "abilityId", type: "uint32", defaultValue: 0 },
                        {
                          name: "abilityLineIndex",
                          type: "uint32",
                          defaultValue: 0
                        }
                      ]
                    }
                  ]
                },
                { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                { name: "unknownDword2", type: "uint32", defaultValue: 0 },
                {
                  name: "unknownArray1", // inventory / items related (ps2 dump)
                  type: "array",
                  defaultValue: [],
                  fields: [
                    { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                    {
                      name: "unknownData1",
                      type: "schema",
                      defaultValue: {},
                      fields: [
                        {
                          name: "unknownDword1",
                          type: "uint32",
                          defaultValue: 0
                        },
                        {
                          name: "unknownDword2",
                          type: "uint32",
                          defaultValue: 0
                        },
                        {
                          name: "unknownDword3",
                          type: "uint32",
                          defaultValue: 0
                        },
                        {
                          name: "unknownGuid1",
                          type: "uint64string",
                          defaultValue: ""
                        },
                        {
                          name: "unknownGuid2",
                          type: "uint64string",
                          defaultValue: ""
                        }
                      ]
                    }
                  ]
                },
                {
                  name: "unknownArray2",
                  type: "array",
                  defaultValue: [],
                  fields: [
                    { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                    {
                      name: "unknownData1",
                      type: "schema",
                      defaultValue: {},
                      fields: [
                        {
                          name: "unknownDword1",
                          type: "uint32",
                          defaultValue: 0
                        },
                        {
                          name: "unknownDword2",
                          type: "uint32",
                          defaultValue: 0
                        },
                        {
                          name: "unknownDword3",
                          type: "uint32",
                          defaultValue: 0
                        },
                        {
                          name: "unknownGuid1",
                          type: "uint64string",
                          defaultValue: ""
                        }
                      ]
                    }
                  ]
                },
                {
                  name: "unknownArray3",
                  type: "array",
                  defaultValue: [],
                  fields: [
                    { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                    { name: "unknownDword2", type: "uint32", defaultValue: 0 }
                  ]
                },
                {
                  name: "unknownArray4",
                  type: "array",
                  defaultValue: [],
                  fields: [
                    { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                    { name: "unknownDword2", type: "uint32", defaultValue: 0 }
                  ]
                }
              ]
            },
            {
              name: "unknownData1",
              type: "schema",
              defaultValue: {},
              fields: [
                {
                  name: "unknownArray1",
                  type: "array",
                  defaultValue: [],
                  fields: [
                    { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                    {
                      name: "unknownData1",
                      type: "schema",
                      defaultValue: {},
                      fields: [
                        {
                          name: "unknownDword1",
                          type: "uint32",
                          defaultValue: 0
                        },
                        {
                          name: "unknownDword2",
                          type: "uint32",
                          defaultValue: 0
                        },
                        {
                          name: "unknownQword1",
                          type: "uint64string",
                          defaultValue: ""
                        }
                      ]
                    },
                    { name: "unknownDword2", type: "uint32", defaultValue: 0 }
                  ]
                },
                {
                  name: "unknownArray2",
                  type: "array",
                  defaultValue: [],
                  fields: [
                    { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                    { name: "unknownByte1", type: "uint8", defaultValue: 0 },
                    {
                      name: "unknownData1",
                      type: "schema",
                      defaultValue: {},
                      fields: [
                        {
                          name: "unknownData1",
                          type: "schema",
                          defaultValue: {},
                          fields: [
                            {
                              name: "unknownDword1",
                              type: "uint32",
                              defaultValue: 0
                            },
                            {
                              name: "unknownDword2",
                              type: "uint32",
                              defaultValue: 0
                            },
                            {
                              name: "unknownQword1",
                              type: "uint64string",
                              defaultValue: ""
                            }
                          ]
                        },
                        {
                          name: "unknownDword1",
                          type: "uint32",
                          defaultValue: 0
                        },
                        {
                          name: "unknownByte1",
                          type: "uint8",
                          defaultValue: 0
                        }
                      ]
                    }
                  ]
                },
                { name: "unknownByte1", type: "uint8", defaultValue: 0 }
              ]
            },
            {
              name: "unknownData2",
              type: "schema",
              defaultValue: {},
              fields: [
                { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                {
                  name: "unknownData1",
                  type: "schema",
                  defaultValue: {},
                  fields: [
                    { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                    { name: "unknownDword2", type: "uint32", defaultValue: 0 },
                    { name: "unknownDword3", type: "uint32", defaultValue: 0 }
                  ]
                },
                {
                  name: "unknownData1",
                  type: "schema",
                  defaultValue: {},
                  fields: [
                    { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                    { name: "unknownDword2", type: "uint32", defaultValue: 0 },
                    { name: "unknownDword3", type: "uint32", defaultValue: 0 }
                  ]
                },
                { name: "unknownDword2", type: "uint32", defaultValue: 0 }
              ]
            },
            { name: "unknownDword37", type: "uint32", defaultValue: 0 },
            {
              name: "unknownData3",
              type: "schema",
              defaultValue: {},
              fields: [
                {
                  name: "unknownQword1",
                  type: "uint64string",
                  defaultValue: ""
                },
                {
                  name: "unknownData1",
                  type: "schema",
                  defaultValue: {},
                  fields: [
                    {
                      name: "unknownData1",
                      type: "schema",
                      defaultValue: {},
                      fields: [
                        {
                          name: "unknownDword1",
                          type: "uint32",
                          defaultValue: 0
                        },
                        {
                          name: "unknownDword2",
                          type: "uint32",
                          defaultValue: 0
                        },
                        {
                          name: "unknownQword1",
                          type: "uint64string",
                          defaultValue: ""
                        }
                      ]
                    },
                    {
                      name: "unknownQword1",
                      type: "uint64string",
                      defaultValue: ""
                    },
                    { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                    { name: "unknownDword2", type: "uint32", defaultValue: 0 },
                    { name: "unknownDword3", type: "uint32", defaultValue: 0 },
                    {
                      name: "unknownData2",
                      type: "schema",
                      defaultValue: {},
                      fields: [
                        {
                          name: "unknownDword1",
                          type: "uint32",
                          defaultValue: 0
                        },
                        {
                          name: "unknownDword2",
                          type: "uint32",
                          defaultValue: 0
                        },
                        {
                          name: "unknownDword3",
                          type: "uint32",
                          defaultValue: 0
                        },
                        {
                          name: "unknownDword4",
                          type: "uint32",
                          defaultValue: 0
                        }
                      ]
                    },
                    {
                      name: "unknownString1",
                      type: "string",
                      defaultValue: ""
                    }
                  ]
                },
                { name: "unknownByte1", type: "uint8", defaultValue: 0 }
              ]
            },
            {
              name: "unknownArray18",
              type: "array",
              defaultValue: [],
              fields: [
                { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                { name: "unknownDword2", type: "uint32", defaultValue: 0 }
              ]
            },
            {
              name: "unknownData4",
              type: "schema",
              defaultValue: {},
              fields: [
                { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                { name: "unknownDword2", type: "uint32", defaultValue: 0 },
                { name: "unknownDword3", type: "uint32", defaultValue: 0 },
                { name: "unknownDword4", type: "uint32", defaultValue: 0 },
                { name: "unknownDword5", type: "uint32", defaultValue: 0 }
              ]
            },
            {
              name: "unknownArray19",
              type: "array",
              defaultValue: [],
              fields: [
                { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                { name: "unknownDword2", type: "uint32", defaultValue: 0 },
                { name: "unknownDword3", type: "uint32", defaultValue: 0 }
              ]
            },
            {
              name: "unknownArray20",
              type: "array",
              defaultValue: [],
              fields: [
                { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                {
                  name: "unknownQword1",
                  type: "uint64string",
                  defaultValue: ""
                },
                { name: "unknownDword2", type: "uint32", defaultValue: 0 },
                { name: "unknownDword3", type: "uint32", defaultValue: 0 }
              ]
            },
            {
              name: "unknownArray21",
              type: "array",
              defaultValue: [],
              fields: [
                { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                {
                  name: "unknownGuid1",
                  type: "uint64string",
                  defaultValue: ""
                },
                {
                  name: "unknownArray1",
                  type: "array",
                  defaultValue: [],
                  fields: [
                    { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                    { name: "unknownDword2", type: "uint32", defaultValue: 0 }
                  ]
                }
              ]
            },
            {
              name: "unknownArray22",
              type: "array",
              defaultValue: [],
              fields: [
                {
                  name: "unknownQword1",
                  type: "uint64string",
                  defaultValue: ""
                },
                {
                  name: "unknownEffectData",
                  type: "schema",
                  defaultValue: {},
                  fields: [
                    {
                      name: "unknownQword1",
                      type: "uint64string",
                      defaultValue: ""
                    },
                    { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                    {
                      name: "unknownData1",
                      type: "schema",
                      defaultValue: {},
                      fields: [
                        {
                          name: "unknownDword1",
                          type: "uint32",
                          defaultValue: 0
                        },
                        {
                          name: "unknownDword2",
                          type: "uint32",
                          defaultValue: 0
                        },
                        {
                          name: "unknownDword3",
                          type: "uint32",
                          defaultValue: 0
                        }
                      ]
                    },
                    {
                      name: "unknownData2",
                      type: "schema",
                      defaultValue: {},
                      fields: [
                        {
                          name: "unknownDword1",
                          type: "uint32",
                          defaultValue: 0
                        },
                        {
                          name: "unknownDword2",
                          type: "uint32",
                          defaultValue: 0
                        },
                        {
                          name: "unknownDword3",
                          type: "uint32",
                          defaultValue: 0
                        }
                      ]
                    },
                    {
                      name: "unknownData3",
                      type: "schema",
                      defaultValue: {},
                      fields: [
                        {
                          name: "unknownQword1",
                          type: "uint64string",
                          defaultValue: ""
                        },
                        {
                          name: "unknownDword1",
                          type: "uint32",
                          defaultValue: 0
                        },
                        {
                          name: "unknownQword2",
                          type: "uint64string",
                          defaultValue: ""
                        }
                      ]
                    },
                    {
                      name: "unknownData4",
                      type: "schema",
                      defaultValue: {},
                      fields: [
                        {
                          name: "unknownQword1",
                          type: "uint64string",
                          defaultValue: ""
                        },
                        {
                          name: "unknownQword2",
                          type: "uint64string",
                          defaultValue: ""
                        },
                        {
                          name: "unknownFloatVector4",
                          type: "floatvector4",
                          defaultValue: [0, 0, 0, 0]
                        }
                      ]
                    },
                    {
                      name: "unknownData5",
                      type: "schema",
                      defaultValue: {},
                      fields: [
                        {
                          name: "unknownDword1",
                          type: "uint32",
                          defaultValue: 0
                        },
                        {
                          name: "unknownDword2",
                          type: "uint32",
                          defaultValue: 0
                        },
                        {
                          name: "unknownDword3",
                          type: "uint32",
                          defaultValue: 0
                        }
                      ]
                    },
                    { name: "unknownDword2", type: "uint32", defaultValue: 0 },
                    { name: "unknownByte1", type: "uint8", defaultValue: 0 }
                  ]
                }
              ]
            },
            {
              name: "unknownArray23",
              type: "array",
              defaultValue: [],
              fields: [
                {
                  name: "unknownQword1",
                  type: "uint64string",
                  defaultValue: ""
                },
                {
                  name: "unknownData1",
                  type: "schema",
                  defaultValue: {},
                  fields: [
                    {
                      name: "unknownQword1",
                      type: "uint64string",
                      defaultValue: ""
                    },
                    { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                    { name: "unknownDword2", type: "uint32", defaultValue: 0 },
                    { name: "unknownDword3", type: "uint32", defaultValue: 0 },
                    {
                      name: "unknownQword2",
                      type: "uint64string",
                      defaultValue: ""
                    },
                    { name: "unknownDword4", type: "uint32", defaultValue: 0 }
                  ]
                }
              ]
            },
            {
              name: "equipmentSlots", // equipment probably
              type: "array",
              defaultValue: [],
              fields: [
                { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                {
                  name: "unknownData1",
                  type: "schema",
                  defaultValue: {},
                  fields: [
                    { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                    {
                      name: "unknownString1",
                      type: "string",
                      defaultValue: ""
                    },
                    {
                      name: "unknownString1",
                      type: "string",
                      defaultValue: ""
                    },
                    {
                      name: "equipmentSlot",
                      type: "schema",
                      defaultValue: {},
                      fields: equipmentSlotSchema
                    }
                  ]
                }
              ]
            },
            {
              name: "unknownArray25", // playerRanks (from ps2 sendself dump)
              type: "array",
              defaultValue: [],
              fields: [
                { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                {
                  name: "unknownData1",
                  type: "schema",
                  defaultValue: {},
                  fields: [
                    { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                    { name: "unknownDword2", type: "uint32", defaultValue: 0 },
                    { name: "unknownDword3", type: "uint32", defaultValue: 0 },
                    { name: "unknownDword4", type: "uint32", defaultValue: 0 },
                    { name: "unknownDword5", type: "uint32", defaultValue: 0 },
                    { name: "unknownDword6", type: "uint32", defaultValue: 0 },
                    { name: "unknownDword7", type: "uint32", defaultValue: 0 }
                  ]
                }
              ]
            },
            {
              name: "unknownData5",
              type: "schema",
              defaultValue: {},
              fields: [
                { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                { name: "unknownDword2", type: "uint32", defaultValue: 0 },
                { name: "unknownDword3", type: "uint32", defaultValue: 0 },
                { name: "unknownDword4", type: "uint32", defaultValue: 0 },
                { name: "unknownDword5", type: "uint32", defaultValue: 0 }
              ]
            },
            {
              name: "unknownData6",
              type: "schema",
              defaultValue: {},
              fields: [
                { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                { name: "unknownDword2", type: "uint32", defaultValue: 0 },
                { name: "unknownDword3", type: "uint32", defaultValue: 0 }
              ]
            },
            {
              name: "implantSlots",
              type: "array",
              defaultValue: [],
              fields: [
                { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                { name: "unknownDword2", type: "uint32", defaultValue: 0 },
                {
                  name: "unknownData1",
                  type: "schema",
                  defaultValue: {},
                  fields: [
                    {
                      name: "unknownData1",
                      type: "schema",
                      defaultValue: {},
                      fields: [
                        {
                          name: "unknownDword1",
                          type: "uint32",
                          defaultValue: 0
                        },
                        {
                          name: "unknownDword2",
                          type: "uint32",
                          defaultValue: 0
                        },
                        {
                          name: "unknownQword1",
                          type: "uint64string",
                          defaultValue: ""
                        }
                      ]
                    },
                    { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                    { name: "unknownDword2", type: "uint32", defaultValue: 0 },
                    { name: "unknownDword3", type: "uint32", defaultValue: 0 }
                  ]
                }
              ]
            },
            {
              name: "itemTimerData",
              type: "schema",
              defaultValue: {},
              fields: [
                {
                  name: "unknownArray1",
                  type: "array",
                  defaultValue: [],
                  fields: [
                    {
                      name: "unknownQword1",
                      type: "uint64string",
                      defaultValue: ""
                    },
                    {
                      name: "unknownData1",
                      type: "schema",
                      defaultValue: {},
                      fields: [
                        {
                          name: "unknownQword1",
                          type: "uint64string",
                          defaultValue: ""
                        },
                        {
                          name: "unknownDword1",
                          type: "uint32",
                          defaultValue: 0
                        },
                        {
                          name: "unknownDword2",
                          type: "uint32",
                          defaultValue: 0
                        },
                        {
                          name: "unknownDword3",
                          type: "uint32",
                          defaultValue: 0
                        }
                      ]
                    }
                  ]
                },
                {
                  name: "unknownArray2",
                  type: "array",
                  defaultValue: [],
                  fields: [
                    {
                      name: "unknownQword1",
                      type: "uint64string",
                      defaultValue: ""
                    },
                    { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                    { name: "unknownDword2", type: "uint32", defaultValue: 0 }
                  ]
                },
                {
                  name: "unknownArray3",
                  type: "array",
                  defaultValue: [],
                  fields: [
                    {
                      name: "unknownQword1",
                      type: "uint64string",
                      defaultValue: ""
                    },
                    {
                      name: "unknownQword2",
                      type: "uint64string",
                      defaultValue: ""
                    },
                    { name: "unknownDword1", type: "uint32", defaultValue: 0 }
                  ]
                }
              ]
            },
            {
              name: "unknownArray26",
              type: "array",
              defaultValue: [],
              fields: [
                {
                  name: "unknownQword1",
                  type: "uint64string",
                  defaultValue: ""
                },
                {
                  name: "unknownData1",
                  type: "schema",
                  defaultValue: {},
                  fields: [
                    {
                      name: "unknownData1",
                      type: "schema",
                      defaultValue: {},
                      fields: [
                        {
                          name: "unknownQword1",
                          type: "uint64string",
                          defaultValue: ""
                        },
                        {
                          name: "unknownDword1",
                          type: "uint32",
                          defaultValue: 0
                        },
                        {
                          name: "unknownDword2",
                          type: "uint32",
                          defaultValue: 0
                        },
                        {
                          name: "unknownDword3",
                          type: "uint32",
                          defaultValue: 0
                        }
                      ]
                    },
                    {
                      name: "unknownQword1",
                      type: "uint64string",
                      defaultValue: ""
                    },
                    { name: "unknownDword1", type: "uint32", defaultValue: 0 }
                  ]
                }
              ]
            },
            {
              name: "unknownData7",
              type: "schema",
              defaultValue: {},
              fields: [
                {
                  name: "unknownData1",
                  type: "schema",
                  defaultValue: {},
                  fields: [
                    { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                    { name: "unknownDword2", type: "uint32", defaultValue: 0 },
                    {
                      name: "unknownQword1",
                      type: "uint64string",
                      defaultValue: ""
                    },
                    {
                      name: "unknownQword2",
                      type: "uint64string",
                      defaultValue: ""
                    }
                  ]
                },
                {
                  name: "unknownArray1",
                  type: "array",
                  defaultValue: [],
                  fields: [
                    { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                    {
                      name: "unknownData1",
                      type: "schema",
                      defaultValue: {},
                      fields: [
                        {
                          name: "unknownDword1",
                          type: "uint32",
                          defaultValue: 0
                        },
                        {
                          name: "unknownDword2",
                          type: "uint32",
                          defaultValue: 0
                        },
                        {
                          name: "unknownQword1",
                          type: "uint64string",
                          defaultValue: ""
                        },
                        {
                          name: "unknownQword2",
                          type: "uint64string",
                          defaultValue: ""
                        }
                      ]
                    },
                    { name: "unknownDword2", type: "uint32", defaultValue: 0 }
                  ]
                },
                {
                  name: "unknownData2",
                  type: "schema",
                  defaultValue: {},
                  fields: [
                    { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                    { name: "unknownDword2", type: "uint32", defaultValue: 0 },
                    {
                      name: "unknownQword1",
                      type: "uint64string",
                      defaultValue: ""
                    }
                  ]
                },
                {
                  name: "unknownArray2",
                  type: "array",
                  defaultValue: [],
                  fields: [
                    { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                    {
                      name: "unknownData1",
                      type: "schema",
                      defaultValue: {},
                      fields: [
                        {
                          name: "unknownData1",
                          type: "schema",
                          defaultValue: {},
                          fields: [
                            {
                              name: "unknownDword1",
                              type: "uint32",
                              defaultValue: 0
                            },
                            {
                              name: "unknownDword2",
                              type: "uint32",
                              defaultValue: 0
                            },
                            {
                              name: "unknownQword1",
                              type: "uint64string",
                              defaultValue: ""
                            }
                          ]
                        },
                        {
                          name: "unknownDword1",
                          type: "uint32",
                          defaultValue: 0
                        },
                        {
                          name: "unknownDword2",
                          type: "uint32",
                          defaultValue: 0
                        },
                        {
                          name: "unknownByte1",
                          type: "uint8",
                          defaultValue: 0
                        }
                      ]
                    }
                  ]
                },
                {
                  name: "unknownArray3",
                  type: "array",
                  defaultValue: [],
                  fields: [
                    { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                    {
                      name: "unknownData1",
                      type: "schema",
                      defaultValue: {},
                      fields: [
                        {
                          name: "unknownData1",
                          type: "schema",
                          defaultValue: {},
                          fields: [
                            {
                              name: "unknownDword1",
                              type: "uint32",
                              defaultValue: 0
                            },
                            {
                              name: "unknownDword2",
                              type: "uint32",
                              defaultValue: 0
                            },
                            {
                              name: "unknownQword1",
                              type: "uint64string",
                              defaultValue: ""
                            }
                          ]
                        },
                        {
                          name: "unknownDword1",
                          type: "uint32",
                          defaultValue: 0
                        },
                        {
                          name: "unknownDword2",
                          type: "uint32",
                          defaultValue: 0
                        },
                        {
                          name: "unknownByte1",
                          type: "uint8",
                          defaultValue: 0
                        }
                      ]
                    }
                  ]
                },
                { name: "unknownByte1", type: "uint8", defaultValue: 0 }
              ]
            },
            {
              name: "unknownData8",
              type: "schema",
              defaultValue: {},
              fields: [
                { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                { name: "unknownDword2", type: "uint32", defaultValue: 0 },
                { name: "unknownString1", type: "string", defaultValue: "" },
                {
                  name: "unknownArray1",
                  type: "array",
                  defaultValue: [],
                  fields: [
                    { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                    {
                      name: "unknownData1",
                      type: "schema",
                      defaultValue: {},
                      fields: [
                        {
                          name: "unknownDword1",
                          type: "uint32",
                          defaultValue: 0
                        },
                        {
                          name: "unknownQword1",
                          type: "uint64string",
                          defaultValue: ""
                        },
                        {
                          name: "unknownDword2",
                          type: "uint32",
                          defaultValue: 0
                        },
                        {
                          name: "unknownByte1",
                          type: "uint8",
                          defaultValue: 0
                        }
                      ]
                    }
                  ]
                },
                {
                  name: "unknownArray2",
                  type: "array",
                  defaultValue: [],
                  fields: [
                    { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                    { name: "unknownDword2", type: "uint32", defaultValue: 0 },
                    { name: "unknownDword3", type: "uint32", defaultValue: 0 }
                  ]
                },
                {
                  name: "unknownArray3",
                  type: "array",
                  defaultValue: [],
                  fields: [
                    { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                    { name: "unknownDword2", type: "uint32", defaultValue: 0 },
                    {
                      name: "unknownString1",
                      type: "string",
                      defaultValue: ""
                    },
                    {
                      name: "unknownArray1",
                      type: "array",
                      defaultValue: [],
                      fields: [
                        {
                          name: "unknownDword1",
                          type: "uint32",
                          defaultValue: 0
                        },
                        {
                          name: "unknownData1",
                          type: "schema",
                          defaultValue: {},
                          fields: [
                            {
                              name: "unknownDword1",
                              type: "uint32",
                              defaultValue: 0
                            },
                            {
                              name: "unknownQword1",
                              type: "uint64string",
                              defaultValue: ""
                            },
                            {
                              name: "unknownDword2",
                              type: "uint32",
                              defaultValue: 0
                            },
                            {
                              name: "unknownByte1",
                              type: "uint8",
                              defaultValue: 0
                            }
                          ]
                        }
                      ]
                    },
                    {
                      name: "unknownArray2",
                      type: "array",
                      defaultValue: [],
                      fields: [
                        {
                          name: "unknownDword1",
                          type: "uint32",
                          defaultValue: 0
                        },
                        {
                          name: "unknownDword2",
                          type: "uint32",
                          defaultValue: 0
                        },
                        {
                          name: "unknownDword3",
                          type: "uint32",
                          defaultValue: 0
                        }
                      ]
                    }
                  ]
                }
              ]
            },
            {
              name: "loadoutSlots",
              type: "schema",
              defaultValue: {},
              fields: loadoutSlotsSchema
            },
            {
              name: "unknownArray27",
              type: "array",
              defaultValue: [],
              fields: [
                { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                { name: "unknownDword2", type: "uint32", defaultValue: 0 }
              ]
            },
            {
              name: "unknownData9",
              type: "schema",
              defaultValue: {},
              fields: [
                {
                  name: "unknownArray1",
                  type: "array",
                  defaultValue: [],
                  fields: [
                    {
                      name: "unknownData1",
                      type: "schema",
                      defaultValue: {},
                      fields: [
                        {
                          name: "unknownDword1",
                          type: "uint32",
                          defaultValue: 0
                        },
                        {
                          name: "unknownQword1",
                          type: "uint64string",
                          defaultValue: ""
                        },
                        {
                          name: "unknownByte1",
                          type: "uint8",
                          defaultValue: 0
                        }
                      ]
                    },
                    { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                    { name: "unknownDword2", type: "uint32", defaultValue: 0 },
                    { name: "unknownDword3", type: "uint32", defaultValue: 0 }
                  ]
                },
                {
                  name: "unknownArray2",
                  type: "array",
                  defaultValue: [],
                  fields: [
                    {
                      name: "unknownData1",
                      type: "schema",
                      defaultValue: {},
                      fields: [
                        {
                          name: "unknownDword1",
                          type: "uint32",
                          defaultValue: 0
                        },
                        {
                          name: "unknownQword1",
                          type: "uint64string",
                          defaultValue: ""
                        },
                        {
                          name: "unknownByte1",
                          type: "uint8",
                          defaultValue: 0
                        }
                      ]
                    },
                    { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                    { name: "unknownDword2", type: "uint32", defaultValue: 0 },
                    { name: "unknownDword3", type: "uint32", defaultValue: 0 }
                  ]
                },
                {
                  name: "unknownArray3",
                  type: "array",
                  defaultValue: [],
                  fields: [
                    {
                      name: "unknownData1",
                      type: "schema",
                      defaultValue: {},
                      fields: [
                        {
                          name: "unknownDword1",
                          type: "uint32",
                          defaultValue: 0
                        },
                        {
                          name: "unknownQword1",
                          type: "uint64string",
                          defaultValue: ""
                        },
                        {
                          name: "unknownByte1",
                          type: "uint8",
                          defaultValue: 0
                        }
                      ]
                    },
                    { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                    { name: "unknownDword2", type: "uint32", defaultValue: 0 },
                    {
                      name: "unknownQword1",
                      type: "uint64string",
                      defaultValue: ""
                    }
                  ]
                },
                {
                  name: "unknownArray4",
                  type: "array",
                  defaultValue: [],
                  fields: [
                    {
                      name: "unknownData1",
                      type: "schema",
                      defaultValue: {},
                      fields: [
                        {
                          name: "unknownDword1",
                          type: "uint32",
                          defaultValue: 0
                        },
                        {
                          name: "unknownQword1",
                          type: "uint64string",
                          defaultValue: ""
                        },
                        {
                          name: "unknownByte1",
                          type: "uint8",
                          defaultValue: 0
                        }
                      ]
                    },
                    {
                      name: "unknownData2",
                      type: "schema",
                      defaultValue: {},
                      fields: [
                        {
                          name: "unknownData1",
                          type: "schema",
                          defaultValue: {},
                          fields: [
                            {
                              name: "unknownDword1",
                              type: "uint32",
                              defaultValue: 0
                            },
                            {
                              name: "unknownQword1",
                              type: "uint64string",
                              defaultValue: ""
                            },
                            {
                              name: "unknownByte1",
                              type: "uint8",
                              defaultValue: 0
                            }
                          ]
                        },
                        {
                          name: "unknownData2",
                          type: "schema",
                          defaultValue: {},
                          fields: [
                            {
                              name: "unknownDword1",
                              type: "uint32",
                              defaultValue: 0
                            },
                            {
                              name: "unknownDword2",
                              type: "uint32",
                              defaultValue: 0
                            },
                            {
                              name: "unknownDword3",
                              type: "uint32",
                              defaultValue: 0
                            }
                          ]
                        },
                        {
                          name: "unknownDword1",
                          type: "uint32",
                          defaultValue: 0
                        },
                        {
                          name: "unknownData3",
                          type: "schema",
                          defaultValue: {},
                          fields: [
                            {
                              name: "unknownDword1",
                              type: "uint32",
                              defaultValue: 0
                            },
                            {
                              name: "unknownDword2",
                              type: "uint32",
                              defaultValue: 0
                            },
                            {
                              name: "unknownFloatVector4",
                              type: "floatvector4",
                              defaultValue: [0, 0, 0, 0]
                            }
                          ]
                        }
                      ]
                    }
                  ]
                },
                {
                  name: "unknownArray5",
                  type: "array",
                  defaultValue: [],
                  fields: [
                    {
                      name: "unknownData1",
                      type: "schema",
                      defaultValue: {},
                      fields: [
                        {
                          name: "unknownDword1",
                          type: "uint32",
                          defaultValue: 0
                        },
                        {
                          name: "unknownQword1",
                          type: "uint64string",
                          defaultValue: ""
                        },
                        {
                          name: "unknownByte1",
                          type: "uint8",
                          defaultValue: 0
                        }
                      ]
                    },
                    {
                      name: "unknownData2",
                      type: "schema",
                      defaultValue: {},
                      fields: [
                        {
                          name: "unknownData1",
                          type: "schema",
                          defaultValue: {},
                          fields: [
                            {
                              name: "unknownDword1",
                              type: "uint32",
                              defaultValue: 0
                            },
                            {
                              name: "unknownQword1",
                              type: "uint64string",
                              defaultValue: ""
                            },
                            {
                              name: "unknownByte1",
                              type: "uint8",
                              defaultValue: 0
                            }
                          ]
                        },
                        {
                          name: "unknownData2",
                          type: "schema",
                          defaultValue: {},
                          fields: [
                            {
                              name: "unknownDword1",
                              type: "uint32",
                              defaultValue: 0
                            },
                            {
                              name: "unknownDword2",
                              type: "uint32",
                              defaultValue: 0
                            },
                            {
                              name: "unknownDword3",
                              type: "uint32",
                              defaultValue: 0
                            }
                          ]
                        },
                        {
                          name: "unknownDword1",
                          type: "uint32",
                          defaultValue: 0
                        },
                        {
                          name: "unknownData3",
                          type: "schema",
                          defaultValue: {},
                          fields: [
                            {
                              name: "unknownDword1",
                              type: "uint32",
                              defaultValue: 0
                            },
                            {
                              name: "unknownDword2",
                              type: "uint32",
                              defaultValue: 0
                            },
                            {
                              name: "unknownFloatVector4",
                              type: "floatvector4",
                              defaultValue: [0, 0, 0, 0]
                            }
                          ]
                        }
                      ]
                    }
                  ]
                }
              ]
            },
            {
              name: "characterResources",
              type: "array",
              defaultValue: [],
              fields: [
                { name: "resourceType", type: "uint32", defaultValue: 0 },
                {
                  name: "resourceData",
                  type: "schema",
                  defaultValue: {},
                  fields: characterResourceData
                }
              ]
            },
            {
              name: "skillPointData",
              type: "schema",
              defaultValue: {},
              fields: [
                {
                  name: "skillPointsGranted",
                  type: "uint64string",
                  defaultValue: ""
                },
                {
                  name: "skillPointsTotal",
                  type: "uint64string",
                  defaultValue: ""
                },
                {
                  name: "skillPointsSpent",
                  type: "uint64string",
                  defaultValue: ""
                },
                {
                  name: "unknownQword1",
                  type: "uint64string",
                  defaultValue: ""
                },
                {
                  name: "unknownQword2",
                  type: "uint64string",
                  defaultValue: ""
                },
                { name: "unknownDword1", type: "uint32", defaultValue: 0 }
              ]
            },
            {
              name: "skills",
              type: "array",
              defaultValue: [],
              fields: [
                { name: "skillLineId", type: "uint32", defaultValue: 0 },
                { name: "skillId", type: "uint32", defaultValue: 0 }
              ]
            },
            {
              name: "containers",
              type: "array",
              defaultValue: [],
              fields: containers
            },
            {
              name: "unknownArray28",
              type: "array",
              defaultValue: [],
              fields: [
                { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                { name: "unknownDword2", type: "uint32", defaultValue: 0 },
                { name: "unknownDword3", type: "uint32", defaultValue: 0 },
                {
                  name: "currency",
                  type: "array",
                  defaultValue: [],
                  fields: currencySchema
                }
              ]
            },
            {
              name: "unknownArray29",
              type: "array",
              defaultValue: [],
              fields: [
                { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                {
                  name: "unknownArray1",
                  type: "array",
                  defaultValue: [],
                  fields: [
                    { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                    { name: "unknownDword2", type: "uint32", defaultValue: 0 }
                  ]
                }
              ]
            },
            { name: "quizComplete", type: "boolean", defaultValue: false },
            { name: "unknownQword1", type: "uint64string", defaultValue: "" },
            { name: "unknownDword38", type: "uint32", defaultValue: 0 },
            {
              name: "vehicleLoadoutRelatedQword",
              type: "uint64string",
              defaultValue: "0x0"
            },
            { name: "unknownQword3", type: "uint64string", defaultValue: "" },
            {
              name: "vehicleLoadoutRelatedDword",
              type: "uint32",
              defaultValue: 0
            },
            { name: "unknownDword40", type: "uint32", defaultValue: 0 },
            { name: "isAdmin", type: "boolean", defaultValue: true },
            { name: "firstPersonOnly", type: "boolean", defaultValue: false },
            { name: "spectatorFlags", type: "uint8", defaultValue: 0 }
          ]
        }
      ]
    }
  ],
  [
    "ClientIsReady",
    0x04,
    {
      fields: []
    }
  ],
  [
    "ZoneDoneSendingInitialData",
    0x05,
    {
      fields: []
    }
  ],
  ["ClientLogout", 0x07, {}],
  ["TargetClientNotOnline", 0x08, {}],
  [
    "ClientBeginZoning",
    0x0b,
    {
      fields: [
        { name: "zoneName", type: "string", defaultValue: "Z1" },
        { name: "zoneType", type: "int32", defaultValue: 4 },
        { name: "position", type: "floatvector4", defaultValue: [0, 0, 0, 1] },
        { name: "rotation", type: "floatvector4", defaultValue: [0, 0, 0, 1] },
        { name: "skyData", type: "schema", fields: skyData },
        // this byte breaks it for some reason (TODO)
        { name: "unknownByte1", type: "uint8", defaultValue: 5 },
        { name: "zoneId1", type: "uint32", defaultValue: 5 },
        { name: "zoneId2", type: "uint32", defaultValue: 0 },
        { name: "nameId", type: "uint32", defaultValue: 7699 },
        { name: "unknownDword10", type: "uint32", defaultValue: 674234378 },
        { name: "unknownBoolean1", type: "boolean", defaultValue: true },
        { name: "waitForZoneReady", type: "boolean", defaultValue: false },
        { name: "unknownBoolean3", type: "boolean", defaultValue: true }
      ]
    }
  ],
  ["Mail", 0x0e, {}],
  ["Ability.ClientRequestStartAbility", 0x1001, {}],
  ["Ability.ClientRequestStopAbility", 0x1002, {}],
  ["Ability.ClientMoveAndCast", 0x1003, {}],
  ["Ability.Failed", 0x1004, {}],
  ["Ability.StartCasting", 0x1005, {}],
  ["Ability.Launch", 0x1006, {}],
  ["Ability.Land", 0x1007, {}],
  ["Ability.StartChanneling", 0x1008, {}],
  ["Ability.StopCasting", 0x1009, {}],
  ["Ability.StopAura", 0x100a, {}],
  ["Ability.MeleeRefresh", 0x100b, {}],
  ["Ability.AbilityDetails", 0x100c, {}],
  ["Ability.PurchaseAbility", 0x100d, {}],
  ["Ability.UpdateAbilityExperience", 0x100e, {}],
  ["Ability.SetDefinition", 0x100f, {}],
  ["Ability.RequestAbilityDefinition", 0x1010, {}],
  ["Ability.AddAbilityDefinition", 0x1011, {}],
  ["Ability.PulseLocationTargeting", 0x1012, {}],
  ["Ability.ReceivePulseLocation", 0x1013, {}],
  ["Ability.ActivateItemAbility", 0x1014, {}],
  ["Ability.ActivateVehicleAbility", 0x1015, {}],
  ["Ability.DeactivateItemAbility", 0x1016, {}],
  ["Ability.DeactivateVehicleAbility", 0x1017, {}],
  ["MiniGame", 0x12, {}],
  ["Encounter", 0x14, {}],
  ["Inventory", 0x15, {}],
  [
    "SendZoneDetails",
    0x16,
    {
      fields: [
        { name: "zoneName", type: "string", defaultValue: "" },
        { name: "zoneType", type: "uint32", defaultValue: 0 },
        { name: "unknownBoolean1", type: "boolean", defaultValue: false },
        { name: "skyData", type: "schema", fields: skyData },
        { name: "zoneId1", type: "uint32", defaultValue: 0 },
        { name: "zoneId2", type: "uint32", defaultValue: 0 },
        { name: "nameId", type: "uint32", defaultValue: 0 },
        { name: "unknownBoolean2", type: "boolean", defaultValue: false },
        { name: "lighting", type: "string", defaultValue: "" },
        { name: "unknownBoolean3", type: "boolean", defaultValue: false }
      ]
    }
  ],
  ["Objective", 0x18, {}],
  ["Debug", 0x19, {}],

  ["Quest", 0x1b, {}],
  ["Reward", 0x1c, {}],
  [
    "Reward.AddNonRewardItem",
    0x1c02,
    {
      fields: [
        { name: "itemDefId", type: "uint32", defaultValue: 10 },
        { name: "unk1", type: "uint32", defaultValue: 1 },
        { name: "iconId", type: "uint32", defaultValue: 7 },
        { name: "time4", type: "uint32", defaultValue: 1 },
        { name: "count", type: "uint32", defaultValue: 2 },
        { name: "time6", type: "uint32", defaultValue: 1 }
      ]
    }
  ],
  [
    "GameTimeSync",
    0x1d,
    {
      fields: [
        { name: "time", type: "uint64string", defaultValue: "0" },
        { name: "cycleSpeed", type: "float", defaultValue: 0.0 },
        { name: "unknownBoolean1", type: "boolean", defaultValue: false }
      ]
    }
  ],
  ["Pet", 0x1e, {}],
  ["PointOfInterestDefinitionRequest", 0x1f, {}],
  ["PointOfInterestDefinitionReply", 0x20, {}],
  ["WorldTeleportRequest", 0x21, {}],
  ["Trade", 0x22, {}],
  ["EscrowGivePackage", 0x23, {}],
  ["EscrowGotPackage", 0x24, {}],
  ["UpdateEncounterDataCommon", 0x25, {}],

  ["Report", 0x29, {}],
  ["LiveGamer", 0x2a, {}],
  ["Acquaintance", 0x2b, {}],
  ["ClientServerShuttingDown", 0x2c, {}],

  ["Broadcast", 0x2e, {}],
  ["ClientKickedFromServer", 0x2f, {}],
  [
    "UpdateClientSessionData",
    0x30,
    {
      fields: [
        { name: "sessionId", type: "string", defaultValue: "" },
        { name: "stationName", type: "string", defaultValue: "" },
        { name: "unknownBoolean1", type: "boolean", defaultValue: false },
        { name: "unknownString1", type: "string", defaultValue: "" },
        { name: "unknownString2", type: "string", defaultValue: "" },
        { name: "stationCode", type: "string", defaultValue: "" },
        { name: "unknownString3", type: "string", defaultValue: "" }
      ]
    }
  ],
  ["BugSubmission", 0x31, {}],
  [
    "WorldDisplayInfo",
    0x32,
    {
      fields: [{ name: "worldId", type: "uint32", defaultValue: 0 }]
    }
  ],
  ["MOTD", 0x33, {}],
  [
    "SetLocale",
    0x34,
    {
      fields: [{ name: "locale", type: "string", defaultValue: "" }]
    }
  ],
  ["SetClientArea", 0x35, {}],
  ["ZoneTeleportRequest", 0x36, {}],
  ["TradingCard", 0x37, {}],
  [
    "WorldShutdownNotice",
    0x38,
    {
      fields: [
        {
          name: "timeBeforeShutdown",
          type: "uint64string",
          defaultValue: "600EB251"
        },
        { name: "message", type: "string", defaultValue: "" }
      ]
    }
  ],
  ["LoadWelcomeScreen", 0x39, {}],
  ["ShipCombat", 0x3a, {}],
  ["AdminMiniGame", 0x3b, {}],
  [
    "KeepAlive",
    0x3c,
    {
      fields: [{ name: "gameTime", type: "uint32", defaultValue: 0 }]
    }
  ],
  [
    "ClientExitLaunchUrl",
    0x3d,
    {
      fields: [{ name: "url", type: "string", defaultValue: "" }]
    }
  ],
  ["ClientPendingKickFromServer", 0x3f, {}],
  [
    "MembershipActivation",
    0x40,
    {
      fields: [{ name: "unknown", type: "uint32", defaultValue: 0 }]
    }
  ],
  [
    "ShowSystemMessage",
    0x43,
    {
      fields: [
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
        { name: "message", type: "string", defaultValue: "" },
        { name: "unknownDword2", type: "uint32", defaultValue: 0 },
        { name: "color", type: "uint32", defaultValue: 0 }
      ]
    }
  ],
  [
    "POIChangeMessage",
    0x44,
    {
      fields: [
        { name: "messageStringId", type: "uint32", defaultValue: 0 },
        { name: "id", type: "uint32", defaultValue: 0 },
        { name: "unknownDword1", type: "uint32", defaultValue: 0 }
      ]
    }
  ],
  ["ClientMetrics", 0x45, {}],
  [
    "FirstTimeEvent.Unknown1",
    0x4601,
    {
      fields: []
    }
  ],
  [
    "FirstTimeEvent.State",
    0x4602,
    {
      fields: [
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
        { name: "unknownDword2", type: "uint32", defaultValue: 0 },
        { name: "unknownBoolean1", type: "boolean", defaultValue: false }
      ]
    }
  ],
  [
    "FirstTimeEvent.Unknown2",
    0x4603,
    {
      fields: []
    }
  ],
  [
    "FirstTimeEvent.Unknown3",
    0x4604,
    {
      fields: []
    }
  ],
  [
    "FirstTimeEvent.Script",
    0x4605,
    {
      fields: [
        { name: "unknownString1", type: "string", defaultValue: "" },
        {
          name: "unknownArray1",
          type: "array",
          defaultValue: [],
          fields: [{ name: "unknownDword1", type: "uint32", defaultValue: 0 }]
        },
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
        { name: "unknownBoolean1", type: "boolean", defaultValue: false }
      ]
    }
  ],
  ["Claim", 0x47, {}],
  [
    "ClientLog",
    0x48,
    {
      fields: [
        { name: "file", type: "string", defaultValue: "" },
        { name: "message", type: "string", defaultValue: "" }
      ]
    }
  ],
  ["Ignore", 0x49, {}],
  ["SnoopedPlayer", 0x4a, {}],
  ["Promotional", 0x4b, {}],
  ["AddClientPortraitCrc", 0x4c, {}],
  ["ObjectiveTarget", 0x4d, {}],
  ["CommerceSessionRequest", 0x4e, {}],
  ["CommerceSessionResponse", 0x4f, {}],
  ["TrackedEvent", 0x50, {}],
  [
    "LoginFailed",
    0x51,
    {
      fields: []
    }
  ],
  ["LoginToUChat", 0x52, {}],
  ["ZoneSafeTeleportRequest", 0x53, {}],
  ["RemoteInteractionRequest", 0x54, {}],
  ["UpdateCamera", 0x57, {}],

  [
    "UnknownPacketName", // unknown name, sent from client, same dword value every time ?
    0x58,
    {
      fields: [{ name: "unknownDword1", type: "uint32", defaultValue: 0 }]
    }
  ],

  ["AdminGuild", 0x5a, {}],
  ["BattleMages", 0x5b, {}],
  ["WorldToWorld", 0x5c, {}],
  ["PerformAction", 0x5d, {}],
  ["EncounterMatchmaking", 0x5e, {}],
  ["ClientLuaMetrics", 0x5f, {}],
  ["RepeatingActivity", 0x60, {}],
  [
    "ClientGameSettings",
    0x61,
    {
      fields: [
        { name: "Unknown2", type: "uint32", defaultValue: 0 },
        { name: "interactGlowAndDist", type: "uint32", defaultValue: 3 }, // client doesnt send interactionstring by distance but still sends interactrequest
        { name: "unknownBoolean1", type: "boolean", defaultValue: false },
        { name: "timescale", type: "float", defaultValue: 1.0 },
        { name: "enableWeapons", type: "uint32", defaultValue: 0 },
        { name: "Unknown5", type: "uint32", defaultValue: 0 },
        { name: "unknownFloat1", type: "float", defaultValue: 0.0 },
        { name: "unknownFloat2", type: "float", defaultValue: 0.0 },
        { name: "damageMultiplier", type: "float", defaultValue: 1.0 } // 0 = crash
      ]
    }
  ],
  ["ClientTrialProfileUpsell", 0x62, {}],
  ["ActivityManager.ProfileActivityList", 0x6301, {}],
  ["ActivityManager.JoinErrorString", 0x6302, {}],
  ["RequestSendItemDefinitionsToClient", 0x64, {}],
  ["Inspect", 0x65, {}],
  [
    "Achievement.Add",
    0x6602,
    {
      fields: [
        { name: "achievementId", type: "uint32", defaultValue: 0 },
        {
          name: "achievementData",
          type: "schema",
          fields: objectiveSchema
        }
      ]
    }
  ],
  [
    "Achievement.Initialize",
    0x6603,
    {
      fields: [
        {
          name: "clientAchievements",
          type: "array",
          defaultValue: [{}],
          fields: achievementSchema
        },
        {
          name: "achievementData",
          type: "byteswithlength",
          fields: [
            {
              name: "achievements",
              type: "array",
              defaultValue: [{}],
              fields: achievementSchema
            }
          ]
        }
      ]
    }
  ],
  ["Achievement.Complete", 0x6604, {}],
  ["Achievement.ObjectiveAdded", 0x6605, {}],
  ["Achievement.ObjectiveActivated", 0x6606, {}],
  ["Achievement.ObjectiveUpdate", 0x6607, {}],
  ["Achievement.ObjectiveComplete", 0x6608, {}],
  [
    "PlayerTitle",
    0x67,
    {
      fields: [
        { name: "unknown1", type: "uint8", defaultValue: 0 },
        { name: "titleId", type: "uint32", defaultValue: 0 }
      ]
    }
  ],
  ["MatchHistory", 0x68, {}],
  ["UpdateUserAge", 0x69, {}],
  ["Loot", 0x6a, {}],
  ["ActionBarManager", 0x6b, {}],
  ["ClientTrialProfileUpsellRequest", 0x6c, {}],
  ["PlayerUpdateJump", 0x6d, {}],

  [
    "InitializationParameters",
    0x6f,
    {
      fields: [
        { name: "ENVIRONMENT", type: "string", defaultValue: "" },
        { name: "unknownString1", type: "string", defaultValue: "" },
        {
          name: "rulesetDefinitions",
          type: "array",
          defaultValue: [],
          fields: [
            { name: "unknownDword1", type: "uint32", defaultValue: 0 },
            { name: "unknownDword2", type: "uint32", defaultValue: 0 },
            { name: "ruleset", type: "string", defaultValue: "" },
            { name: "unknownString2", type: "string", defaultValue: "" },
            {
              name: "rulesets",
              type: "array",
              defaultValue: [],
              fields: [
                { name: "ID", type: "uint32", defaultValue: 0 },
                {
                  name: "DATA",
                  type: "schema",
                  defaultValue: {},
                  fields: [
                    { name: "ID", type: "uint32", defaultValue: 0 },
                    { name: "RULESET_ID", type: "uint32", defaultValue: 0 },
                    {
                      name: "CONTENT_PACK_ID",
                      type: "uint32",
                      defaultValue: 0
                    },
                    {
                      name: "CONTENT_PACK_ACTION_ID",
                      type: "uint32",
                      defaultValue: 0
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
    "ClientInitializationDetails",
    0x72,
    {
      fields: [{ name: "unknownDword1", type: "uint32", defaultValue: 0 }]
    }
  ],
  ["ClientAreaTimer", 0x73, {}],
  ["LoyaltyReward.GiveLoyaltyReward", 0x7401, {}],
  ["Rating", 0x75, {}],
  ["ClientActivityLaunch", 0x76, {}],
  ["ServerActivityLaunch", 0x77, {}],
  ["ClientFlashTimer", 0x78, {}],
  [
    "PlayerUpdatePosition",
    0x79,
    {
      fields: [
        {
          name: "transientId",
          type: "custom",
          parser: readUnsignedIntWith2bitLengthValue,
          packer: packUnsignedIntWith2bitLengthValue
        },
        {
          name: "positionUpdate",
          type: "custom",
          parser: readPositionUpdateData,
          packer: packPositionUpdateData
        }
      ]
    }
  ],
  ["InviteAndStartMiniGame", 0x7a, {}],
  ["Quiz", 0x7b, {}],
  ["PlayerUpdate.PositionOnPlatform", 0x7c, {}],
  ["ClientMembershipVipInfo", 0x7d, {}],
  ["Target", 0x7e, {}],
  ["GuideStone", 0x80, {}],
  ["Raid", 0x81, {}],
  [
    "Weapon.Weapon",
    0x8300,
    {
      fields: [
        {
          name: "weaponPacket",
          type: "custom",
          parser: parseWeaponPacket,
          packer: packWeaponPacket
        }
      ]
    }
  ],
  ["MatchSchedule", 0x84, {}],
  ["Grief", 0x8a, {}],
  ["SpotPlayer", 0x8b, {}],
  ["Faction", 0x8c, {}],
  [
    "Synchronization",
    0x8d,
    {
      fields: [
        { name: "clientHoursMs", type: "uint64string", defaultValue: "0" }, // seems like hours since a 12h trip in ms UTC time
        { name: "clientHoursMs2", type: "uint64string", defaultValue: "0" },
        { name: "clientTime", type: "uint64string", defaultValue: "0" },
        { name: "serverTime", type: "uint64string", defaultValue: "0" },
        { name: "serverTime2", type: "uint64string", defaultValue: "0" },
        { name: "time3", type: "uint64string", defaultValue: "0" } // maybe drift ?
      ]
    }
  ],
  [
    "ResourceEvent",
    0x8e00,
    {
      fields: [
        { name: "gameTime", type: "uint32", defaultValue: 0 },
        {
          name: "eventData",
          type: "variabletype8",
          types: {
            1: [
              // SetCharacterResources
              { name: "characterId", type: "uint64string", defaultValue: "0" },
              {
                name: "characterResources",
                type: "array",
                defaultValue: [],
                fields: [
                  { name: "resourceType", type: "uint32", defaultValue: 0 },
                  {
                    name: "resourceData",
                    type: "schema",
                    fields: characterResourceData
                  }
                ]
              }
            ],
            2: [
              // SetCharacterResource
              { name: "characterId", type: "uint64string", defaultValue: "0" },
              {
                name: "resourceData",
                type: "schema",
                fields: characterResourceData
              }
            ],
            3: [
              // UpdateCharacterResource
              { name: "characterId", type: "uint64string", defaultValue: "0" },
              { name: "resourceId", type: "uint32", defaultValue: 0 },
              { name: "resourceType", type: "uint32", defaultValue: 0 },

              { name: "initialValue", type: "uint32", defaultValue: 0 },
              { name: "unknownDword4", type: "uint32", defaultValue: 0 },
              { name: "unknownFloat5", type: "float", defaultValue: 0.0 },
              { name: "unknownFloat6", type: "float", defaultValue: 0.0 },
              { name: "unknownFloat7", type: "float", defaultValue: 0.0 },
              { name: "unknownDword8", type: "uint32", defaultValue: 0 },
              { name: "unknownDword9", type: "uint32", defaultValue: 0 },
              { name: "unknownDword10", type: "uint32", defaultValue: 0 },

              { name: "unknownByte1", type: "uint8", defaultValue: 0 },
              { name: "unknownByte2", type: "uint8", defaultValue: 0 },
              { name: "unknownGuid3", type: "uint64string", defaultValue: "0" },
              { name: "unknownGuid4", type: "uint64string", defaultValue: "0" },
              { name: "unknownGuid5", type: "uint64string", defaultValue: "0" },

              { name: "unknownBoolean", type: "boolean", defaultValue: false }
            ],
            4: [
              // RemoveCharacterResource
            ]
          }
        }
      ]
    }
  ],

  ["Leaderboard", 0x90, {}],
  [
    "PlayerUpdateManagedPosition",
    0x91,
    {
      fields: [
        {
          name: "transientId",
          type: "custom",
          parser: readUnsignedIntWith2bitLengthValue,
          packer: packUnsignedIntWith2bitLengthValue,
          defaultValue: 1
        },
        {
          name: "positionUpdate",
          type: "custom",
          parser: readPositionUpdateData,
          packer: packPositionUpdateData,
          defaultValue: 1
        }
      ]
    }
  ],

  [
    "AddSimpleNpc",
    0x92,
    {
      fields: [
        { name: "characterId", type: "uint64string", defaultValue: "0" },
        {
          name: "transientId",
          type: "custom",
          parser: readUnsignedIntWith2bitLengthValue,
          packer: packUnsignedIntWith2bitLengthValue
        },
        { name: "unknownByte1", type: "uint8", defaultValue: 50 },
        { name: "position", type: "floatvector3", defaultValue: [0, 0, 0] },
        { name: "rotation", type: "floatvector3", defaultValue: [0, 0, 0] },
        { name: "unknownDword1", type: "uint32", defaultValue: 23 },
        { name: "unknownDword2", type: "uint32", defaultValue: 23 },
        { name: "modelId", type: "uint32", defaultValue: 0 },
        { name: "scale", type: "floatvector4", defaultValue: [1, 1, 1, 1] },
        { name: "unknownDword3", type: "uint32", defaultValue: 23 },
        { name: "showHealth", type: "boolean", defaultValue: true },
        { name: "health", type: "float", defaultValue: 100 }
      ]
    }
  ],
  ["PlayerUpdateUpdateVehicleWeapon", 0x93, {}],

  [
    "ContinentBattleInfo",
    0x97,
    {
      fields: [
        {
          name: "zones",
          type: "array",
          defaultValue: [{}],
          fields: [
            { name: "id", type: "uint32", defaultValue: 0 },
            { name: "nameId", type: "uint32", defaultValue: 0 },
            { name: "descriptionId", type: "uint32", defaultValue: 0 },
            {
              name: "population",
              type: "array",
              defaultValue: [{}],
              elementType: "uint8"
            },
            {
              name: "regionPercent",
              type: "array",
              defaultValue: [{}],
              elementType: "uint8"
            },
            {
              name: "populationBuff",
              type: "array",
              defaultValue: [{}],
              elementType: "uint8"
            },
            {
              name: "populationTargetPercent",
              type: "array",
              defaultValue: [{}],
              elementType: "uint8"
            },
            { name: "name", type: "string", defaultValue: "" },
            { name: "hexSize", type: "float", defaultValue: 0.0 },
            { name: "isProductionZone", type: "uint8", defaultValue: 0 }
          ]
        }
      ]
    }
  ],
  [
    "GetContinentBattleInfo",
    0x98,
    {
      fields: []
    }
  ],
  [
    "SendSecurityPacketAndSelfDestruct",
    0x99,
    {
      fields: [{ name: "unk", type: "uint32", defaultValue: 4294967295 }]
    }
  ],
  [
    "GetRespawnLocations",
    0x9a,
    {
      fields: []
    }
  ],

  ["ClientInGamePurchase", 0x9d, {}],

  [
    "Security",
    0xa3,
    {
      fields: [{ name: "code", type: "uint32", defaultValue: 0 }]
    }
  ],
  ["HudManager", 0xa5, {}],
  ["AcquireTimers", 0xa6, {}],
  ["LoginBase", 0xa7, {}],
  [
    "ServerPopulationInfo",
    0xa8,
    {
      fields: [
        {
          name: "population",
          type: "array",
          defaultValue: [{}],
          elementtype: "uint16"
        },
        {
          name: "populationPercent",
          type: "array",
          defaultValue: [{}],
          elementType: "uint8"
        },
        {
          name: "populationBuff",
          type: "array",
          defaultValue: [{}],
          elementType: "uint8"
        }
      ]
    }
  ],
  [
    "GetServerPopulationInfo",
    0xa9,
    {
      fields: []
    }
  ],
  [
    "VehicleCollision",
    0xaa,
    {
      fields: [
        {
          name: "transientId",
          type: "custom",
          parser: readUnsignedIntWith2bitLengthValue,
          packer: packUnsignedIntWith2bitLengthValue
        },
        { name: "damage", type: "float", defaultValue: 0 }
      ]
    }
  ],
  [
    "PlayerStop",
    0xab,
    {
      fields: [
        {
          name: "transientId",
          type: "custom",
          parser: readUnsignedIntWith2bitLengthValue,
          packer: packUnsignedIntWith2bitLengthValue
        },
        { name: "state", type: "boolean", defaultValue: false }
      ]
    }
  ],

  ["PlayerUpdate.AttachObject", 0xae, {}],
  ["PlayerUpdate.DetachObject", 0xaf, {}],
  [
    "ClientSettings",
    0xb0,
    {
      fields: [
        { name: "helpUrl", type: "string", defaultValue: "" },
        { name: "shopUrl", type: "string", defaultValue: "" },
        { name: "shop2Url", type: "string", defaultValue: "" }
      ]
    }
  ],
  [
    "RewardBuffInfo",
    0xb1,
    {
      fields: [
        { name: "unknownFloat1", type: "float", defaultValue: 0.0 },
        { name: "unknownFloat2", type: "float", defaultValue: 0.0 },
        { name: "unknownFloat3", type: "float", defaultValue: 0.0 },
        { name: "unknownFloat4", type: "float", defaultValue: 0.0 },
        { name: "unknownFloat5", type: "float", defaultValue: 0.0 },
        { name: "unknownFloat6", type: "float", defaultValue: 0.0 },
        { name: "unknownFloat7", type: "float", defaultValue: 0.0 },
        { name: "unknownFloat8", type: "float", defaultValue: 0.0 },
        { name: "unknownFloat9", type: "float", defaultValue: 0.0 },
        { name: "unknownFloat10", type: "float", defaultValue: 0.0 },
        { name: "unknownFloat11", type: "float", defaultValue: 0.0 },
        { name: "unknownFloat12", type: "float", defaultValue: 0.0 }
      ]
    }
  ],
  [
    "GetRewardBuffInfo",
    0xb2,
    {
      fields: []
    }
  ],
  ["Cais", 0xb3, {}],

  ["RequestPromoEligibilityUpdate", 0xb5, {}],
  ["PromoEligibilityReply", 0xb6, {}],
  ["RequestWalletTopupUpdate", 0xb8, {}],
  ["StationCashActivePromoRequestUpdate", 0xb9, {}],
  [
    "WordFilter.Data",
    0xbd01,
    {
      fields: [{ name: "wordFilterData", type: "byteswithlength" }]
    }
  ],

  ["ProxiedPlayer", 0xbf, {}],
  ["Resists", 0xc0, {}],
  ["InGamePurchasing", 0xc1, {}],
  ["BusinessEnvironments", 0xc2, {}],
  ["EmpireScore", 0xc3, {}],
  ["CharacterSelectSessionRequest", 0xc4, {}],
  [
    "CharacterSelectSessionResponse",
    0xc5,
    {
      fields: [
        { name: "status", type: "uint8", defaultValue: 0 },
        { name: "sessionId", type: "string", defaultValue: "" }
      ]
    }
  ],
  ["Stats", 0xc6, {}],
  ["Score", 0xc7, {}],
  ["Resources", 0xc8, {}],
  [
    "UpdateWeatherData",
    0xcb,
    {
      fields: skyData
    }
  ],
  ["NavGen", 0xcc, {}],
  [
    "Locks.ShowMenu",
    0xcd05,
    {
      fields: [
        { name: "characterId", type: "uint64string", defaultValue: "0" },
        { name: "unknownDword1", type: "uint32", defaultValue: 1 },
        { name: "lockType", type: "uint32", defaultValue: 1 }, // 1-lock, 2-enter password
        { name: "objectCharacterId", type: "uint64string", defaultValue: "0" }
      ]
    }
  ],
  [
    "Locks.setLock",
    0xcd0300,
    {
      fields: [
        { name: "unknownDword1", type: "uint32", defaultValue: 1 },
        { name: "unknownDword2", type: "uint32", defaultValue: 1 },
        { name: "password", type: "uint32", defaultValue: 0 }
      ]
    }
  ],
  ["CharacterState", 0xd0, {}],
  [
    "AddLightweightPc",
    0xd6,
    {
      fields: lightWeightPcSchema
    }
  ],
  [
    "AddLightweightNpc",
    0xd7,
    {
      fields: lightWeightNpcSchema
    }
  ],
  [
    "AddLightweightVehicle",
    0xd8,
    {
      fields: [
        { name: "npcData", type: "schema", fields: lightWeightNpcSchema },
        { name: "unknownGuid1", type: "uint64string", defaultValue: "0" },
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
        { name: "unknownDword2", type: "uint32", defaultValue: 0 },
        {
          name: "positionUpdate",
          type: "custom",
          parser: readPositionUpdateData,
          packer: packPositionUpdateData
        },
        { name: "unknownString1", type: "string", defaultValue: "" }
      ]
    }
  ],
  [
    "AddProxiedObject",
    0xd9,
    {
      fields: [
        { name: "guid", type: "uint64string", defaultValue: "0" },
        {
          name: "transientId",
          type: "custom",
          parser: readUnsignedIntWith2bitLengthValue,
          packer: packUnsignedIntWith2bitLengthValue
        },
        { name: "unknownByte1", type: "uint8", defaultValue: 0 },
        { name: "position", type: "floatvector3", defaultValue: [0, 0, 0] },
        { name: "rotation", type: "floatvector3", defaultValue: [0, 0, 0] }
      ]
    }
  ],
  ["LightweightToFullPc", 0xda, { fields: fullPcSchema }],
  [
    "LightweightToFullNpc",
    0xdb,
    {
      fields: fullNpcSchema
    }
  ],
  [
    "LightweightToFullVehicle",
    0xdc,
    {
      fields: [
        { name: "npcData", type: "schema", fields: fullNpcSchema },
        { name: "unknownByte1", type: "uint8", defaultValue: 0 },
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
        {
          name: "unknownArray1",
          type: "array",
          defaultValue: [],
          fields: [
            { name: "unknownDword1", type: "uint32", defaultValue: 0 },
            { name: "unknownBoolean1", type: "boolean", defaultValue: false }
          ]
        },
        {
          name: "unknownArray2",
          type: "array",
          defaultValue: [],
          fields: [
            { name: "unknownDword1", type: "uint32", defaultValue: 0 },
            { name: "unknownByte1", type: "boolean", defaultValue: false }
          ]
        },
        {
          name: "unknownVector1",
          type: "floatvector4",
          defaultValue: [0, 0, 0, 0]
        },
        {
          name: "unknownVector2",
          type: "floatvector4",
          defaultValue: [0, 0, 0, 0]
        },
        { name: "unknownByte3", type: "uint8", defaultValue: 0 },
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
                  defaultValue: "0"
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
                      defaultValue: ""
                    }
                  ]
                },
                { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                { name: "unknownString1", type: "string", defaultValue: "" }
              ]
            },
            { name: "unknownByte1", type: "uint8", defaultValue: 0 }
          ]
        },
        {
          name: "unknownArray3",
          type: "array",
          defaultValue: [],
          fields: [
            {
              name: "unknownString1",
              type: "string",
              defaultValue: ""
            }
          ]
        },
        {
          name: "stats",
          type: "array",
          defaultValue: [],
          fields: [
            { name: "statId", type: "uint32", defaultValue: 0 },
            {
              name: "statData",
              type: "schema",
              defaultValue: {},
              fields: statSchema
            }
          ]
        },
        {
          name: "unknownArray4",
          type: "array",
          defaultValue: [],
          fields: [
            { name: "unknownDword1", type: "uint32", defaultValue: 0 },
            {
              name: "unknownArray1",
              type: "array",
              defaultValue: [],
              fields: [
                { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                {
                  name: "stats",
                  type: "array",
                  defaultValue: [],
                  fields: [
                    { name: "statId", type: "uint32", defaultValue: 0 },
                    {
                      name: "statData",
                      type: "schema",
                      defaultValue: {},
                      fields: statSchema
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
  ["CheckLocalValues", 0xde, {}],
  ["ChronicleBase", 0xdf, {}],
  ["GrinderBase", 0xe0, {}],
  ["RequestObject", 0xe1, {}],
  ["ScreenEffectBase", 0xe2, {}],
  ["WhitelistBase", 0xe4, {}],
  [
    "NpcFoundationPermissionsManagerBase.showPermissions",
    0xe505,
    {
      fields: [
        { name: "characterId", type: "uint64string", defaultValue: "0" },
        { name: "characterId2", type: "uint64string", defaultValue: "0" },
        {
          name: "permissions",
          type: "array",
          defaultValue: [],
          fields: [
            { name: "characterId", type: "uint64string", defaultValue: "0" },
            { name: "characterName", type: "string", defaultValue: "0" },
            { name: "useContainers", type: "boolean", defaultValue: false },
            { name: "build", type: "boolean", defaultValue: false },
            { name: "demolish", type: "boolean", defaultValue: false },
            { name: "visit", type: "boolean", defaultValue: false }
          ]
        }
      ]
    }
  ],

  [
    "NpcFoundationPermissionsManager.AddPermission",
    0xe501,
    {
      fields: [
        { name: "objectCharacterId", type: "uint64string", defaultValue: "0" },
        { name: "characterName", type: "string", defaultValue: "" },
        { name: "unk", type: "uint64string", defaultValue: "0" },
        { name: "permissionSlot", type: "uint32", defaultValue: 0 }
      ]
    }
  ],

  [
    "NpcFoundationPermissionsManager.EditPermission",
    0xe502,
    {
      fields: [
        { name: "objectCharacterId", type: "uint64string", defaultValue: "0" },
        { name: "unk", type: "uint64string", defaultValue: "0" },
        { name: "characterName", type: "string", defaultValue: "" },

        { name: "permissionSlot", type: "uint32", defaultValue: 0 }
      ]
    }
  ],
  ["BattlEyeData", 0xe6, {}],
  ["OnlineIdBase", 0xe7, {}],
  ["Ps4PlayGoBase", 0xe8, {}],
  ["SynchronizedTeleportBase", 0xe9, {}],
  ["StaticViewBase", 0xea, {}],
  ["DatasheetsBase", 0xec, {}],
  ["PlayerWorldTransferRequest", 0xed, {}],
  ["PlayerWorldTransferReply", 0xee, {}],
  ["CancelQueueOnWorld", 0xef, {}],
  ["DeclineEnterGameOnWorld", 0xf0, {}],
  [
    "ShaderParameterOverrideBase",
    0xf20100,
    {
      fields: [
        { name: "characterId", type: "uint64string", defaultValue: "0" },
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
        { name: "slotId", type: "uint32", defaultValue: 0 },
        { name: "unknownDword2", type: "uint32", defaultValue: 0 },
        { name: "shaderGroupId", type: "uint32", defaultValue: 0 }
      ]
    }
  ],
  ["VehicleSkinBase", 0xf3, {}],
  ["WeaponLagLockParameters", 0xf5, {}],
  ["CrateOpeningBase", 0xf6, {}],
  ["PlayerHeatWarning", 0xf7, {}],
  ["AnimationBase", 0xf8, {}]
];
