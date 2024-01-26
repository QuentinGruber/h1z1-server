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

import { packItemDefinitionData } from "./shared";

export const commandPackets: any = [
  ["Command.ShowDialog", 0x090100, {}],
  ["Command.EndDialog", 0x090200, {}],
  ["Command.StartDialog", 0x090300, {}],
  ["Command.PlayerPlaySpeech", 0x090400, {}],
  ["Command.DialogResponse", 0x090500, {}],
  [
    "Command.PlaySoundAtLocation",
    0x090600,
    {
      fields: [
        { name: "soundName", type: "string", defaultValue: "name" },
        { name: "unk1", type: "uint32", defaultValue: 5048 },
        { name: "unk2", type: "uint32", defaultValue: 5048 },
        { name: "unk3", type: "uint32", defaultValue: 5048 }
      ]
    }
  ],
  [
    "Command.InteractRequest",
    0x090700,
    {
      fields: [{ name: "guid", type: "uint64string", defaultValue: "0" }]
    }
  ],
  [
    "Command.InteractCancel",
    0x090800,
    {
      fields: []
    }
  ],
  [
    "Command.InteractionList",
    0x090900,
    {
      fields: [
        // { name: "unk", type: "uint16", defaultValue: 0 },
        { name: "guid", type: "uint64string", defaultValue: "0" },
        { name: "unknownBoolean1", type: "boolean", defaultValue: true },
        {
          name: "unknownArray1", // can't be empty
          type: "array",
          defaultValue: [],
          fields: [
            { name: "unknownDword1", type: "uint32", defaultValue: 0 },
            { name: "unknownDword2", type: "uint32", defaultValue: 0 },
            { name: "unknownDword3", type: "uint32", defaultValue: 0 },
            { name: "unknownDword4", type: "uint32", defaultValue: 0 },
            { name: "unknownDword5", type: "uint32", defaultValue: 0 },
            { name: "unknownDword6", type: "uint32", defaultValue: 0 },
            { name: "unknownDword7", type: "uint32", defaultValue: 0 }
          ]
        },
        { name: "unknownString1", type: "string", defaultValue: "hello" },
        { name: "unknownBoolean2", type: "boolean", defaultValue: true },
        {
          name: "unknownArray2", // can't be empty
          type: "array",
          defaultValue: [],
          fields: [
            { name: "unknownString1", type: "string", defaultValue: "helllo" },
            { name: "unknownFloat2", type: "uint32", defaultValue: 0 },
            { name: "unknownDword1", type: "uint32", defaultValue: 0 },
            { name: "unknownDword2", type: "uint32", defaultValue: 0 },
            { name: "unknownDword3", type: "uint32", defaultValue: 0 },
            { name: "unknownDword4", type: "uint32", defaultValue: 0 },
            { name: "unknownDword5", type: "uint32", defaultValue: 0 },
            { name: "unknownDword6", type: "uint32", defaultValue: 0 },
            { name: "unknownDword7", type: "uint32", defaultValue: 0 }
          ]
        },
        { name: "unknownBoolean3", type: "boolean", defaultValue: false }
      ]
    }
  ],
  [
    "Command.InteractionSelect",
    0x090a00,
    {
      fields: [
        { name: "guid", type: "uint64string", defaultValue: "0" },
        { name: "interactionId", type: "uint32", defaultValue: 0 }
      ]
    }
  ],
  ["Command.InteractionStartWheel", 0x090b00, {}],
  ["Command.StartFlashGame", 0x090c00, {}],
  [
    "Command.SetProfile",
    0x090d00,
    {
      fields: [
        { name: "profileId", type: "uint32", defaultValue: 0 },
        { name: "tab", type: "uint32", defaultValue: 0 }
      ]
    }
  ],
  ["Command.AddFriendRequest", 0x090e00, {}],
  ["Command.RemoveFriendRequest", 0x090f00, {}],
  ["Command.ConfirmFriendRequest", 0x091000, {}],
  ["Command.ConfirmFriendResponse", 0x091100, {}],
  ["Command.SetChatBubbleColor", 0x091200, {}],
  [
    "Command.PlayerSelect",
    0x091300,
    {
      fields: [
        { name: "characterId", type: "uint64string", defaultValue: "0" },
        { name: "guid", type: "uint64string", defaultValue: "0" }
      ]
    }
  ],
  [
    "Command.FreeInteractionNpc",
    0x091400,
    {
      fields: []
    }
  ],
  ["Command.FriendsPositionRequest", 0x091500, {}],
  [
    "Command.MoveAndInteract",
    0x091600,
    {
      fields: [
        { name: "position", type: "floatvector4", defaultValue: [0, 0, 0, 1] },
        { name: "guid", type: "uint64string", defaultValue: "0x0000" }
      ]
    }
  ],
  ["Command.QuestAbandon", 0x091700, {}],
  [
    "Command.RecipeStart",
    0x091800,
    { fields: [{ name: "recipeId", type: "uint32", defaultValue: 1 }] }
  ],
  [
    "Command.ShowRecipeWindow",
    0x091900,
    { fields: [{ name: "characterId", type: "uint32", defaultValue: 0 }] }
  ],
  ["Command.ActivateProfileFailed", 0x091a00, {}],
  [
    "Command.PlayDialogEffect",
    0x091b00,
    {
      fields: [
        { name: "characterId", type: "uint64string", defaultValue: "0x000" },
        { name: "effectId", type: "uint32", defaultValue: 0 }
      ]
    }
  ],
  ["Command.ForceClearDialog", 0x091c00, {}],
  ["Command.IgnoreRequest", 0x091d00, {}],
  [
    "Command.SetActiveVehicleGuid",
    0x091e00,
    {
      fields: [
        { name: "unknown2", type: "uint16", defaultValue: 0 },
        { name: "unknown3", type: "uint32", defaultValue: 0 },
        { name: "vehicleId", type: "uint64string", defaultValue: "0x0000" }
      ]
    }
  ],
  ["Command.ChatChannelOn", 0x091f00, {}],
  ["Command.ChatChannelOff", 0x092000, {}],
  ["Command.RequestPlayerPositions", 0x092100, {}],
  ["Command.RequestPlayerPositionsReply", 0x092200, {}],
  ["Command.SetProfileByItemDefinitionId", 0x092300, {}],
  ["Command.RequestRewardPreviewUpdate", 0x092400, {}],
  ["Command.RequestRewardPreviewUpdateReply", 0x092500, {}],
  [
    "Command.PlaySoundIdOnTarget",
    0x092600,
    {
      fields: [
        { name: "target", type: "uint32", defaultValue: 4 },
        { name: "unk", type: "boolean", defaultValue: false }
      ]
    }
  ],
  ["Command.RequestPlayIntroEncounter", 0x092700, {}],
  ["Command.SpotPlayer", 0x092800, {}],
  [
    "Command.SpotPlayerReply",
    0x092900,
    {
      fields: [
        { name: "guid", type: "uint64string", defaultValue: "0" },
        { name: "unk1", type: "string", defaultValue: "0" },
        { name: "unk2", type: "string", defaultValue: "0" }
      ]
    }
  ],
  ["Command.SpotPrimaryTarget", 0x092a00, {}],
  [
    "Command.InteractionString",
    0x092b00,
    {
      fields: [
        { name: "guid", type: "uint64string", defaultValue: "0" },
        { name: "stringId", type: "uint32", defaultValue: 0 },
        {
          name: "unknownArray1",
          type: "array",
          defaultValue: [],
          fields: [
            { name: "unknownString1", type: "string", defaultValue: "" },
            { name: "unknownDword1", type: "uint32", defaultValue: 0 },
            { name: "unknownDword2", type: "uint32", defaultValue: 0 }
          ]
        }
      ]
    }
  ],
  ["Command.GiveCurrency", 0x092c00, {}],
  ["Command.HoldBreath", 0x092d00, {}],
  ["Command.ChargeCollision", 0x092e00, {}],
  ["Command.DebrisLaunch", 0x092f00, {}],
  ["Command.Suicide", 0x093000, {}],
  ["Command.RequestHelp", 0x093100, {}],
  ["Command.OfferHelp", 0x093200, {}],
  ["Command.Redeploy", 0x093300, {}],
  [
    "Command.PlayersInRadius",
    0x093400,
    {
      fields: [
        { name: "radius", type: "float", defaultValue: 20 },
        {
          name: "unknown",
          type: "uint32",
          defaultValue: 0
        },
        {
          name: "numberOfPlayer",
          type: "uint32",
          defaultValue: 155
        }
      ]
    }
  ],
  ["Command.AFK", 0x093500, {}],
  ["Command.ReportPlayerReply", 0x093600, {}],
  ["Command.ReportPlayerCheckNameRequest", 0x093700, {}],
  ["Command.ReportPlayerCheckNameReply", 0x093800, {}],
  ["Command.ReportRendererDump", 0x093900, {}],
  ["Command.ChangeName", 0x093a00, {}],
  ["Command.NameValidation", 0x093b00, {}],
  ["Command.PlayerFileDistribution", 0x093c00, {}],
  ["Command.ZoneFileDistribution", 0x093d00, {}],
  [
    "Command.AddWorldCommand",
    0x093e00,
    {
      fields: [{ name: "command", type: "string", defaultValue: "" }]
    }
  ],
  [
    "Command.AddZoneCommand",
    0x093f00,
    {
      fields: [{ name: "command", type: "string", defaultValue: "" }]
    }
  ],
  [
    "Command.ExecuteCommand",
    0x094000,
    {
      fields: [
        { name: "commandHash", type: "uint32", defaultValue: 0 },
        { name: "arguments", type: "string", defaultValue: "" }
      ]
    }
  ],
  [
    "Command.ZoneExecuteCommand",
    0x094100,
    {
      fields: [
        { name: "commandHash", type: "uint32", defaultValue: 0 },
        { name: "arguments", type: "string", defaultValue: "" }
      ]
    }
  ],
  ["Command.RequestStripEffect", 0x094200, {}],
  ["Command.ItemDefinitionRequest", 0x094300, {}],
  ["Command.ItemDefinitionReply", 0x094400, {}],
  [
    "Command.ItemDefinitions",
    0x094500,
    {
      fields: [
        {
          name: "data",
          type: "byteswithlength",
          fields: [
            {
              name: "itemDefinitions",
              type: "array",
              defaultValue: [],
              fields: [
                {
                  name: "definitionData",
                  type: "custom",
                  packer: packItemDefinitionData
                }
              ]
            }
          ]
        }
      ]
    }
  ],
  [
    "Command.EnableCompositeEffects",
    0x094600,
    {
      fields: [{ name: "enabled", type: "boolean", defaultValue: false }]
    }
  ],
  ["Command.StartRentalUpsell", 0x094700, {}],
  ["Command.SafeEject", 0x094800, {}],
  ["Command.ValidateDataForZoneOwnedTiles", 0x096c04, {}],
  [
    "Command.RequestWeaponFireStateUpdate",
    0x094900,
    {
      fields: [{ name: "characterId", type: "uint64string", defaultValue: "0" }]
    }
  ],
  ["Command.SetInWater", 0x094a00, {}],
  ["Command.ClearInWater", 0x094b00, {}],
  ["Command.StartLogoutRequest", 0x094c00, {}],
  ["Command.Delivery", 0x094d00, {}],
  ["Command.DeliveryDisplayInfo", 0x094e00, {}],
  [
    "Command.DeliveryManagerStatus",
    0x094f00,
    {
      fields: [
        { name: "color", type: "uint16", defaultValue: 1 },
        { name: "status", type: "uint16", defaultValue: 0 },
        { name: "unkString", type: "string", defaultValue: "hello dude" }
      ]
    }
  ],
  ["Command.DeliveryManagerShowNotification", 0x095000, {}],
  [
    "Command.AddItem",
    0x09ea03,
    {
      // found at 1407c97d0
      fields: [
        { name: "itemId", type: "uint32", defaultValue: "0" },
        { name: "stackCount", type: "uint32", defaultValue: "0" },
        { name: "imageSetId", type: "uint32", defaultValue: "0" },
        { name: "imageTintValue", type: "uint32", defaultValue: "0" },
        { name: "NameId", type: "uint32", defaultValue: "0" },
        { name: "DescriptionId", type: "uint32", defaultValue: "0" }
      ]
    }
  ],
  ["Command.DeleteItem", 0x09eb03, {}],
  ["Command.AbilityReply", 0x09ec03, {}],
  ["Command.AbilityList", 0x09ed03, {}],
  ["Command.AbilityAdd", 0x09ee03, {}],
  ["Command.ServerInformation", 0x09ef03, {}],
  ["Command.SpawnNpcRequest", 0x09f003, {}],
  ["Command.NpcSpawn", 0x09f103, {}],
  ["Command.NpcList", 0x09f203, {}],
  ["Command.NpcDisableSpawners", 0x09f303, {}],
  ["Command.NpcDespawn", 0x09f403, {}],
  ["Command.NpcCreateSpawn", 0x09f503, {}],
  ["Command.NpcInfoRequest", 0x09f603, {}],
  ["Command.ZonePacketLogging", 0x09f703, {}],
  ["Command.ZoneListRequest", 0x09f803, {}],
  ["Command.ZoneListReply", 0x09f903, {}],
  ["Command.TeleportToLocation", 0x09fa03, {}],
  ["Command.TeleportToLocationEx", 0x09fb03, {}],
  ["Command.TeleportManagedToLocation", 0x09fc03, {}],
  ["Command.CollectionStart", 0x09fd03, {}],
  ["Command.CollectionClear", 0x09fe03, {}],
  ["Command.CollectionRemove", 0x09ff03, {}],
  ["Command.CollectionAddEntry", 0x090004, {}],
  ["Command.CollectionRemoveEntry", 0x090104, {}],
  ["Command.CollectionRefresh", 0x090204, {}],
  ["Command.CollectionFill", 0x090304, {}],
  ["Command.ReloadData", 0x090404, {}],
  ["Command.OnlineStatusRequest", 0x090504, {}],
  ["Command.OnlineStatusReply", 0x090604, {}],
  ["Command.MovePlayerToWorldLocation", 0x090704, {}],
  ["Command.MovePlayerToTargetPlayer", 0x090804, {}],
  ["Command.LaunchAbilityId", 0x090904, {}],
  ["Command.Kill", 0x090a04, {}],
  ["Command.FindEnemy", 0x090b04, {}],
  ["Command.FindEnemyReply", 0x090c04, {}],
  ["Command.FollowPlayer", 0x090d04, {}],
  ["Command.SetClientDebugFlag", 0x090e04, {}],
  ["Command.RunZoneScript", 0x090f04, {}],
  ["Command.RequestAggroDist", 0x091004, {}],
  ["Command.AggroDist", 0x091104, {}],
  ["Command.TestRequirement", 0x091204, {}],
  ["Command.UITest", 0x091304, {}],
  ["Command.EncounterComplete", 0x091404, {}],
  ["Command.AddRewardBonus", 0x091504, {}],
  ["Command.SetClientBehaviorFlag", 0x091604, {}],
  ["Command.SetVipRank", 0x091704, {}],
  ["Command.ToggleDebugNpc", 0x091804, {}],
  ["Command.QuestStart", 0x091904, {}],
  ["Command.SummonRequest", 0x091a04, {}],
  ["Command.QuestList", 0x091b04, {}],
  ["Command.EncounterStart", 0x091c04, {}],
  ["Command.RewardSetGive", 0x091d04, {}],
  ["Command.RewardSetList", 0x091e04, {}],
  ["Command.RewardSetFind", 0x091f04, {}],
  ["Command.QuestComplete", 0x092004, {}],
  ["Command.QuestStatus", 0x092104, {}],
  ["Command.CoinsSet", 0x092204, {}],
  ["Command.CoinsAdd", 0x092304, {}],
  ["Command.CoinsGet", 0x092404, {}],
  ["Command.AddCurrency", 0x092504, {}],
  ["Command.SetCurrency", 0x092604, {}],
  ["Command.ClearCurrency", 0x092704, {}],
  ["Command.RewardCurrency", 0x092804, {}],
  ["Command.ListCurrencyRequest", 0x092904, {}],
  ["Command.ListCurrencyReply", 0x092a04, {}],
  ["Command.RewardSetGiveRadius", 0x092b04, {}],
  ["Command.InGamePurchaseRequest", 0x092c04, {}],
  ["Command.InGamePurchaseReply", 0x092d04, {}],
  ["Command.TestNpcRelevance", 0x092e04, {}],
  ["Command.GameTime", 0x092f04, {}],
  ["Command.ClientTime", 0x093004, {}],
  ["Command.QuestObjectiveComplete", 0x093104, {}],
  ["Command.QuestObjectiveIncrement", 0x093204, {}],
  ["Command.EncounterStatus", 0x093304, {}],
  ["Command.GotoRequest", 0x093404, {}],
  ["Command.GotoReply", 0x093504, {}],
  ["Command.GotoWapointRequest", 0x093604, {}],
  ["Command.ServerVersion", 0x093704, {}],
  ["Command.ServerUptime", 0x093804, {}],
  ["Command.DeleteItemById", 0x093904, {}],
  ["Command.GetItemList", 0x093a04, {}],
  ["Command.GetItemListReply", 0x093b04, {}],
  ["Command.QuestHistory", 0x093c04, {}],
  ["Command.QuestHistoryClear", 0x093d04, {}],
  ["Command.TradeStatus", 0x093e04, {}],
  ["Command.PathDataRequest", 0x093f04, {}],
  ["Command.SummonReply", 0x094004, {}],
  ["Command.Broadcast", 0x094104, {}],
  ["Command.BroadcastZone", 0x094204, {}],
  ["Command.BroadcastWorld", 0x094304, {}],
  ["Command.ListPets", 0x094404, {}],
  ["Command.PetSetUtility", 0x094504, {}],
  ["Command.PetTrick", 0x094604, {}],
  ["Command.RecipeAction", 0x094704, { fields: [] }],
  ["Command.WorldKick", 0x094804, {}],
  ["Command.EncounterRunTimerDisable", 0x094904, {}],
  ["Command.ReloadPermissions", 0x094a04, {}],
  ["Command.CharacterFlags", 0x094b04, {}],
  ["Command.SetEncounterPartySizeOverride", 0x094c04, {}],
  ["Command.BuildTime", 0x094d04, {}],
  ["Command.SelectiveSpawnEnable", 0x094e04, {}],
  ["Command.SelectiveSpawnAdd", 0x094f04, {}],
  ["Command.SelectiveSpawnAddById", 0x095004, {}],
  ["Command.SelectiveSpawnClear", 0x095104, {}],
  ["Command.BecomeEnforcer", 0x095204, {}],
  ["Command.BecomeReferee", 0x095304, {}],
  ["Command.Profiler", 0x095404, {}],
  ["Command.WorldKickPending", 0x095504, {}],
  ["Command.ActivateMembership", 0x095604, {}],
  ["Command.JoinLobby", 0x095704, {}],
  ["Command.LeaveLobby", 0x095804, {}],
  ["Command.SetMOTD", 0x095904, {}],
  ["Command.Snoop", 0x095a04, {}],
  ["Command.JoinScheduledActivityRequest", 0x095b04, {}],
  ["Command.JoinScheduledActivityReply", 0x095c04, {}],
  ["Command.BecomeAmbassador", 0x095d04, {}],
  ["Command.CollectionsShow", 0x095e04, {}],
  ["Command.GetZoneDrawData", 0x095f04, {}],
  ["Command.ZoneDrawData", 0x096004, {}],
  ["Command.QuestAbandon", 0x096104, {}],
  ["Command.SetVehicleDefault", 0x096204, {}],
  ["Command.Freeze", 0x096304, {}],
  ["Command.ObjectiveAction", 0x096404, {}],
  ["Command.EquipAdd", 0x096504, {}],
  ["Command.Info", 0x096604, {}],
  ["Command.Silence", 0x096704, {}],
  ["Command.SpawnerStatus", 0x096804, {}],
  ["Command.Behavior", 0x096904, {}],
  ["Command.DebugFirstTimeEvents", 0x096a04, {}],
  ["Command.SetWorldWebEventAggregationPeriod", 0x096b04, {}],
  ["Command.GivePet", 0x096d04, {}],
  ["Command.NpcLocationRequest", 0x096e04, {}],
  ["Command.BroadcastUniverse", 0x096f04, {}],
  ["Command.TrackedEventLogToFile", 0x097004, {}],
  ["Command.TrackedEventEnable", 0x097104, {}],
  ["Command.TrackedEventEnableAll", 0x097204, {}],
  ["Command.Event", 0x097304, {}],
  ["Command.PerformAction", 0x097404, {}],
  ["Command.CountrySet", 0x097504, {}],
  ["Command.TrackedEventReloadConfig", 0x097604, {}],
  ["Command.SummonNPC", 0x097704, {}],
  ["Command.AchievementComplete", 0x097804, {}],
  ["Command.AchievementList", 0x097904, {}],
  ["Command.AchievementStatus", 0x097a04, {}],
  ["Command.AchievementObjectiveComplete", 0x097b04, {}],
  ["Command.AchievementObjectiveIncrement", 0x097c04, {}],
  ["Command.AchievementEnable", 0x097d04, {}],
  ["Command.AchievementReset", 0x097e04, {}],
  ["Command.SetAffiliate", 0x097f04, {}],
  ["Command.HousingInstanceEdit", 0x098004, {}],
  ["Command.WorldRequest", 0x098104, {}],
  ["Command.EnableNpcRelevanceBypass", 0x098204, {}],
  ["Command.GrantPromotionalBundle", 0x098304, {}],
  ["Command.ResetItemCooldowns", 0x098404, {}],
  ["Command.MountAdd", 0x098504, {}],
  ["Command.MountDelete", 0x098604, {}],
  ["Command.MountList", 0x098704, {}],
  ["Command.GetItemInfo", 0x098804, {}],
  ["Command.RequestZoneComprehensiveDataDump", 0x098904, {}],
  ["Command.RequestZoneComprehensiveDataDumpReply", 0x098a04, {}],
  ["Command.NpcDamage", 0x098b04, {}],
  ["Command.HousingAddTrophy", 0x098c04, {}],
  ["Command.TargetOfTarget", 0x098d04, {}],
  ["Command.AddAbilityEntry", 0x098e04, {}],
  ["Command.RemoveAbilityEntry", 0x098f04, {}],
  ["Command.PhaseList", 0x099004, {}],
  ["Command.PhaseAdd", 0x099104, {}],
  ["Command.PhaseRemove", 0x099204, {}],
  ["Command.AdventureAdd", 0x099304, {}],
  ["Command.AdventureSetPhase", 0x099404, {}],
  ["Command.SetFactionId", 0x099504, {}],
  ["Command.FacilitySpawnSetCollisionState", 0x099604, {}],
  ["Command.SkillBase", 0x099704, {}],
  ["Command.VehicleBase", 0x099804, {}],
  [
    "Command.SpawnVehicle",
    0x099904,
    {
      fields: [
        { name: "vehicleId", type: "uint32", defaultValue: 0 },
        { name: "factionId", type: "uint8", defaultValue: 0 },
        { name: "position", type: "floatvector3", defaultValue: [0, 0, 0] },
        { name: "heading", type: "float", defaultValue: 0.0 },
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
        { name: "autoMount", type: "boolean", defaultValue: false }
      ]
    }
  ],
  ["Command.SpawnVehicleReply", 0x099a04, {}],
  ["Command.DespawnVehicle", 0x099b04, {}],
  ["Command.WeaponStat", 0x099c04, {}],
  ["Command.GuildBase", 0x099d04, {}],
  ["Command.VisualizePhysics", 0x099e04, {}],
  ["Command.PlayerHealthSetRequest", 0x099f04, {}],
  ["Command.PlayerForceRespawnRequest", 0x09a004, {}],
  ["Command.ResourceRequest", 0x09a104, {}],
  ["Command.ZoneDebugMessage", 0x09a204, {}],
  ["Command.VerifyAdminTarget", 0x09a304, {}],
  ["Command.SetAllZoneFacilitiesToFactionRequest", 0x09a404, {}],
  ["Command.FacilityResetMapRequest", 0x09a504, {}],
  ["Command.DesignDataChanges", 0x09a604, {}],
  ["Command.GiveXp", 0x09a704, {}],
  ["Command.GiveRank", 0x09a804, {}],
  ["Command.PlayerExperienceRequest", 0x09a904, {}],
  ["Command.Noclip", 0x09aa04, {}],
  ["Command.VerifyAdminPermission", 0x09ab04, {}],
  ["Command.RegionRequest", 0x09ac04, {}],
  ["Command.RegionReply", 0x09ad04, {}],
  ["Command.RegionRewardsReply", 0x09ae04, {}],
  ["Command.RegionFactionRewardsReply", 0x09af04, {}],
  ["Command.FacilityListNpcReply", 0x09b004, {}],
  ["Command.FacilityListReply", 0x09b104, {}],
  ["Command.PingServer", 0x09b204, {}],
  ["Command.AnimDebug", 0x09b304, {}],
  ["Command.RemoteClientAnimDebugRequest", 0x09b404, {}],
  ["Command.RemoteClientAnimDebugReply", 0x09b504, {}],
  ["Command.RewardBuffManagerGiveReward", 0x09b604, {}],
  ["Command.RewardBuffManagerAddPlayers", 0x09b704, {}],
  ["Command.RewardBuffManagerRemovePlayers", 0x09b804, {}],
  ["Command.RewardBuffManagerClearAllPlayers", 0x09b904, {}],
  ["Command.RewardBuffManagerListAll", 0x09ba04, {}],
  ["Command.QueryNpcRequest", 0x09bb04, {}],
  ["Command.QueryNpcReply", 0x09bc04, {}],
  ["Command.ZonePlayerCount", 0x09bd04, {}],
  ["Command.GriefRequest", 0x09be04, {}],
  ["Command.TeleportToObjectTag", 0x09bf04, {}],
  ["Command.DamagePlayer", 0x09c004, {}],
  ["Command.HexPermissions", 0x09c104, {}],
  ["Command.SpyRequest", 0x09c204, {}],
  ["Command.SpyReply", 0x09c304, {}],
  ["Command.GatewayProfilerRegistration", 0x09c404, {}],
  [
    "Command.RunSpeed",
    0x09c504,
    {
      fields: [{ name: "runSpeed", type: "float", defaultValue: 0.0 }]
    }
  ],
  ["Command.LocationRequest", 0x09c604, {}],
  ["Command.GriefBase", 0x09c704, {}],
  ["Command.PlayerRenameRequest", 0x09c804, {}],
  ["Command.EffectBase", 0x09c904, {}],
  ["Command.AbilityBase", 0x09ca04, {}],
  ["Command.AcquireTimerBase", 0x09cb04, {}],
  ["Command.ReserveNameRequest", 0x09cc04, {}],
  ["Command.InternalConnectionBypass", 0x09cd04, {}],
  ["Command.Queue", 0x09ce04, {}],
  ["Command.CharacterStatQuery", 0x09cf04, {}],
  ["Command.CharacterStatReply", 0x09d004, {}],
  ["Command.LockStatusReply", 0x09d104, {}],
  ["Command.StatTracker", 0x09d204, {}],
  ["Command.ItemBase", 0x09d304, {}],
  ["Command.CurrencyBase", 0x09d404, {}],
  ["Command.ImplantBase", 0x09d504, {}],
  ["Command.FileDistribution", 0x09d604, {}],
  ["Command.TopReports", 0x09d704, {}],
  ["Command.ClearAllReports", 0x09d804, {}],
  ["Command.GetReport", 0x09d904, {}],
  ["Command.DeleteReport", 0x09da04, {}],
  ["Command.UserReports", 0x09db04, {}],
  ["Command.ClearUserReports", 0x09dc04, {}],
  ["Command.WhoRequest", 0x09dd04, {}],
  ["Command.WhoReply", 0x09de04, {}],
  ["Command.FindRequest", 0x09df04, {}],
  ["Command.FindReply", 0x09e004, {}],
  ["Command.CaisBase", 0x09e104, {}],
  ["Command.MyRealtimeGatewayMovement", 0x09e204, {}],
  ["Command.ObserverCam", 0x09e304, {}],
  ["Command.AddItemContentPack", 0x09e404, {}],
  ["Command.CharacterSlotBase", 0x09e504, {}],
  ["Command.ResourceBase", 0x09e804, {}],
  ["Command.CharacterStateBase", 0x09e904, {}],
  ["Command.ResistsBase", 0x09ea04, {}],
  ["Command.LoadoutBase", 0x09eb04, {}],
  ["Command.GiveBotOrders", 0x09f104, {}],
  ["Command.ReceiveBotOrders", 0x09f204, {}],
  ["Command.SetIgnoreMaxTrackables", 0x09ec04, {}],
  ["Command.ToggleNavigationLab", 0x09ed04, {}],
  ["Command.RequirementDebug", 0x09ee04, {}],
  ["Command.ConsolePrint", 0x09ef04, {}],
  ["Command.ReconcileItemList", 0x09f304, {}],
  ["Command.ReconcileItemListReply", 0x09f404, {}],
  ["Command.FillItem", 0x09f504, {}],
  ["Command.HeatMapList", 0x09f604, {}],
  ["Command.HeatMapResponse", 0x09f704, {}],
  ["Command.Weather", 0x09f904, {}],
  ["Command.LockBase", 0x09fa04, {}],
  ["Command.AbandonedItemsStats", 0x09fb04, {}],
  ["Command.DatabaseBase", 0x09fd04, {}],
  ["Command.ModifyEntitlement", 0x09fe04, {}]
];
