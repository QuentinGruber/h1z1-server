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
  packItemWeaponData,
  packUnsignedIntWith2bitLengthValue,
  readUnsignedIntWith2bitLengthValue,
  itemSchema,
  profileSchema,
  respawnLocationSchema,
  statSchema
} from "./shared";
import { PacketStructures } from "types/packetStructure";

export const clientUpdatePackets: PacketStructures = [
  ["ClientUpdate.Hitpoints", 0x110100, {}],
  [
    "ClientUpdate.ItemAdd",
    0x110200,
    {
      fields: [
        { name: "characterId", type: "uint64string", defaultValue: "0" },
        {
          name: "data",
          type: "byteswithlength",
          fields: [
            ...itemSchema,
            {
              name: "weaponData",
              type: "custom",
              defaultValue: {},
              packer: packItemWeaponData
            }
          ]
        }
      ]
    }
  ],
  [
    "ClientUpdate.ItemUpdate",
    0x110300,
    {
      fields: [
        { name: "characterId", type: "uint64string", defaultValue: "0" },
        {
          name: "data",
          type: "schema",
          fields: itemSchema
        }
      ]
    }
  ],
  [
    "ClientUpdate.ItemDelete",
    0x110400,
    {
      fields: [
        { name: "characterId", type: "uint64string", defaultValue: "0" },
        { name: "itemGuid", type: "uint64string", defaultValue: "0" }
      ]
    }
  ],
  [
    "ClientUpdate.UpdateStat",
    0x110500,
    {
      fields: statSchema
    }
  ],
  ["ClientUpdate.CollectionStart", 0x110600, {}],
  ["ClientUpdate.CollectionRemove", 0x110700, {}],
  ["ClientUpdate.CollectionAddEntry", 0x110800, {}],
  ["ClientUpdate.CollectionRemoveEntry", 0x110900, {}],
  [
    "ClientUpdate.UpdateLocation",
    0x110a00,
    {
      fields: [
        { name: "position", type: "floatvector4", defaultValue: [0, 0, 0, 1] },
        { name: "rotation", type: "floatvector4", defaultValue: [0, 0, 0, 1] },
        { name: "unknownBoolean1", type: "boolean", defaultValue: true },
        { name: "unknownByte1", type: "uint8", defaultValue: 0 },
        { name: "triggerLoadingScreen", type: "boolean", defaultValue: true }
      ]
    }
  ],
  ["ClientUpdate.Mana", 0x110b00, {}],
  ["ClientUpdate.UpdateProfileExperience", 0x110c00, {}],
  ["ClientUpdate.AddProfileAbilitySetApl", 0x110d00, {}],
  ["ClientUpdate.AddEffectTag", 0x110e00, {}],
  ["ClientUpdate.RemoveEffectTag", 0x110f00, {}],
  ["ClientUpdate.UpdateProfileRank", 0x111000, {}],
  ["ClientUpdate.CoinCount", 0x111100, {}],
  ["ClientUpdate.DeleteProfile", 0x111200, {}],
  [
    "ClientUpdate.ActivateProfile",
    0x111300,
    {
      fields: [
        {
          name: "profileData",
          type: "byteswithlength",
          fields: profileSchema
        },
        {
          name: "attachmentData",
          type: "array",
          defaultValue: [],
          fields: attachmentSchema
        },
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
        { name: "unknownDword2", type: "uint32", defaultValue: 0 },
        { name: "actorModelId", type: "uint32", defaultValue: 0 },
        { name: "tintAlias", type: "string", defaultValue: "" },
        { name: "decalAlias", type: "string", defaultValue: "" }
      ]
    }
  ],
  ["ClientUpdate.AddAbility", 0x111400, {}],
  ["ClientUpdate.NotifyPlayer", 0x111500, {}],
  ["ClientUpdate.UpdateProfileAbilitySetApl", 0x111600, {}],
  ["ClientUpdate.RemoveActionBars", 0x111700, {}],
  ["ClientUpdate.UpdateActionBarSlot", 0x111800, {}],
  [
    "ClientUpdate.DoneSendingPreloadCharacters",
    0x111900,
    {
      fields: [{ name: "done", type: "boolean", defaultValue: false }]
    }
  ],
  ["ClientUpdate.SetGrandfatheredStatus", 0x111a00, {}],
  ["ClientUpdate.UpdateActionBarSlotUsed", 0x111b00, {}],
  ["ClientUpdate.PhaseChange", 0x111c00, {}],
  ["ClientUpdate.UpdateKingdomExperience", 0x111d00, {}],
  [
    "ClientUpdate.DamageInfo",
    0x111e00,
    {
      fields: [
        { name: "unknownDword1", type: "uint32", defaultValue: 100 },
        {
          name: "transientId", // not sure if its used
          type: "custom",
          parser: readUnsignedIntWith2bitLengthValue,
          packer: packUnsignedIntWith2bitLengthValue,
          defaultValue: 0
        },
        { name: "unknownDword2", type: "int32", defaultValue: 1 }, // cant be 0
        { name: "orientationToSource", type: "float", defaultValue: 1 },
        { name: "unknownDword4", type: "float", defaultValue: 1 },
        { name: "unknownBoolean2", type: "boolean", defaultValue: 1 },
        { name: "unknownBoolean3", type: "boolean", defaultValue: 1 },
        { name: "unknownDword5", type: "uint32", defaultValue: 0 },
        { name: "unknownDword6", type: "uint32", defaultValue: 66 }
      ]
    }
  ],
  [
    "ClientUpdate.ZonePopulation",
    0x112f00,
    {
      fields: [
        {
          name: "populations",
          type: "array",
          defaultValue: [{}],
          elementType: "uint8"
        }
      ]
    }
  ],
  [
    // 2016
    "ClientUpdate.RespawnLocations",
    0x111f00,
    {
      fields: [
        { name: "unknownFlags", type: "uint8", defaultValue: 0 },
        {
          name: "locations",
          type: "array",
          defaultValue: [{}],
          fields: respawnLocationSchema
        },
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
        { name: "unknownDword2", type: "uint32", defaultValue: 0 },
        {
          name: "locations2",
          type: "array",
          defaultValue: [{}],
          fields: respawnLocationSchema
        }
      ]
    }
  ],
  [
    // 2016
    "ClientUpdate.ModifyMovementSpeed",
    0x112000,
    {
      fields: [
        { name: "speed", type: "float", defaultValue: 10 },
        { name: "movementVersion", type: "uint8", defaultValue: 1 }
      ]
    }
  ],
  [
    "ClientUpdate.ModifyTurnRate",
    0x112100,
    {
      fields: [
        { name: "speed", type: "float", defaultValue: 10 },
        { name: "movementVersion", type: "uint8", defaultValue: 1 }
      ]
    }
  ],
  [
    "ClientUpdate.ModifyStrafeSpeed",
    0x112200,
    {
      fields: [
        { name: "speed", type: "float", defaultValue: 10 },
        { name: "movementVersion", type: "uint8", defaultValue: 1 }
      ]
    }
  ],
  [
    "ClientUpdate.UpdateManagedLocation",
    0x112300,
    {
      fields: [
        { name: "characterId", type: "uint64string", defaultValue: "" },
        { name: "position", type: "floatvector4", defaultValue: [0, 0, 0, 1] },
        { name: "rotation", type: "floatvector4", defaultValue: [0, 0, 0, 1] },
        { name: "unknownBoolean1", type: "boolean", defaultValue: true },
        { name: "unknownByte1", type: "uint8", defaultValue: 0 }
      ]
    }
  ],
  [
    "ClientUpdate.ManagedMovementVersion",
    0x112400,
    {
      fields: [
        {
          name: "version",
          type: "custom",
          parser: readUnsignedIntWith2bitLengthValue,
          packer: packUnsignedIntWith2bitLengthValue
        }
      ]
    }
  ],
  [
    "ClientUpdate.UpdateWeaponAddClips",
    0x112500,
    {
      fields: [
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
        { name: "unknownByte1", type: "uint8", defaultValue: 0 },
        { name: "unknownFloat1", type: "float", defaultValue: 0.0 }
      ]
    }
  ],
  ["ClientUpdate.SpotProbation", 0x112600, {}],
  ["ClientUpdate.DailyRibbonCount", 0x112700, {}],
  ["ClientUpdate.DespawnNpcUpdate", 0x112900, {}],
  ["ClientUpdate.LoyaltyPoints", 0x112a00, {}],
  ["ClientUpdate.ResetMissionRespawnTimer", 0x112b00, {}],
  ["ClientUpdate.Freeze", 0x112c00, {}],
  ["ClientUpdate.InGamePurchaseResult", 0x112d00, {}],
  ["ClientUpdate.QuizComplete", 0x112e00, {}],
  [
    "ClientUpdate.StartTimer",
    0x112f00,
    {
      fields: [
        { name: "stringId", type: "uint32", defaultValue: 0 },
        { name: "time", type: "uint32", defaultValue: 10000 },
        { name: "message", type: "string", defaultValue: "hello" }
      ]
    }
  ],
  [
    "ClientUpdate.CompleteLogoutProcess",
    0x113000,
    {
      fields: []
    }
  ],
  [
    "ClientUpdate.ProximateItems",
    0x113100,
    {
      fields: [
        {
          name: "items",
          type: "array",
          defaultValue: [],
          fields: [
            { name: "itemDefinitionId", type: "uint32", defaultValue: 0 },
            {
              name: "itemData",
              type: "schema",
              defaultValue: {},
              fields: itemSchema
            },
            {
              name: "associatedCharacterGuid",
              type: "uint64string",
              defaultValue: "0"
            }
          ]
        }
      ]
    }
  ],
  [
    "ClientUpdate.TextAlert",
    0x113200,
    {
      fields: [{ name: "message", type: "string", defaultValue: "hello" }]
    }
  ],
  ["ClientUpdate.ClearEntitlementValues", 0x113300, {}],
  ["ClientUpdate.AddEntitlementValue", 0x113400, {}],
  [
    "ClientUpdate.NetworkProximityUpdatesComplete",
    0x113500,
    {
      fields: []
    }
  ],
  ["ClientUpdate.FileValidationRequest", 0x113600, {}],
  ["ClientUpdate.FileValidationResponse", 0x113700, {}],
  [
    "ClientUpdate.DeathMetrics",
    0x113800,
    {
      fields: [
        { name: "recipesDiscovered", type: "uint32", defaultValue: 0 },
        { name: "unknown4", type: "uint32", defaultValue: 0 },
        { name: "wildlifeKilled", type: "uint32", defaultValue: 0 },
        { name: "zombiesKilled", type: "uint32", defaultValue: 0 },
        { name: "unknown7", type: "uint32", defaultValue: 0 },
        { name: "minutesSurvived", type: "uint32", defaultValue: 0 },
        { name: "position", type: "floatvector4", defaultValue: [0, 0, 0, 1] },
        { name: "unknown10", type: "uint32", defaultValue: 0 },
        { name: "unknown11", type: "boolean", defaultValue: 1 }
      ]
    }
  ],
  ["ClientUpdate.ManagedObjectRequestControl", 0x113900, {}],
  [
    "ClientUpdate.ManagedObjectResponseControl",
    0x113a00,
    {
      fields: [
        { name: "control", type: "boolean", defaultValue: false },
        { name: "objectCharacterId", type: "uint64string", defaultValue: "0" }
      ]
    }
  ],
  ["ClientUpdate.ManagedObjectReleaseControl", 0x113b00, {}],
  ["ClientUpdate.SetCurrentAdventure", 0x113c00, {}],
  ["ClientUpdate.CharacterSlot", 0x113d00, {}],
  ["ClientUpdate.CustomizationData", 0x113e00, {}],
  ["ClientUpdate.UpdateCurrency", 0x113f00, {}],
  ["ClientUpdate.AddNotifications", 0x114000, {}],
  ["ClientUpdate.RemoveNotifications", 0x114100, {}],
  ["ClientUpdate.NpcRelevance", 0x114200, {}],
  ["ClientUpdate.InitiateNameChange", 0x114300, {}],
  ["ClientUpdate.NameChangeResult", 0x114400, {}],
  [
    "ClientUpdate.MonitorTimeDrift",
    0x114500,
    {
      fields: [{ name: "timeDrift", type: "uint32" }]
    }
  ],
  ["ClientUpdate.NotifyServerOfStalledEvent", 0x114600, {}],
  ["ClientUpdate.UpdateSights", 0x114700, {}],
  ["ClientUpdate.UpdateRewardAndGrinderState", 0x114900, {}],
  ["ClientUpdate.UpdateActivityMetrics", 0x114b00, {}],
  ["ClientUpdate.StopWithError", 0x114c00, {}],
  ["ClientUpdate.SetWorldWipeTimer", 0x114d00, {}],
  [
    "ClientUpdate.UpdateLockoutTimes",
    0x114e00,
    {
      fields: [
        {
          name: "unk",
          type: "array",
          defaultValue: [],
          fields: [{ name: "unk", type: "uint32", defaultValue: 0 }]
        },
        { name: "bool", type: "boolean", defaultValue: 1 }
      ]
    }
  ],
  ["ClientUpdate.ZoneStatus", 0x114f00, {}],
  ["ClientUpdate.SetDataCenter", 0x115000, {}],
  ["ClientUpdate.UpdateBattlEyeRegistration", 0x115100, {}]
];
