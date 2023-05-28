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

export const characterPackets: PacketStructures = [
  ["Character.None", 0x0f00, {}],
  [
    "Character.RemovePlayer",
    0x0f01,
    {
      fields: [
        { name: "characterId", type: "uint64string", defaultValue: "0" },
        { name: "unknownWord1", type: "uint16", defaultValue: 0 }, // must be 1 to work as remove gracefully
        { name: "unknownBool1", type: "boolean", defaultValue: 0 },
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
        { name: "effectDelay", type: "uint32", defaultValue: 0 },
        { name: "effectId", type: "uint32", defaultValue: 0 },
        { name: "stickyEffectId", type: "uint32", defaultValue: 0 },
        { name: "timeToDisappear", type: "uint32", defaultValue: 0 }
      ]
    }
  ],
  ["Character.Knockback", 0x0f02, {}],
  ["Character.UpdateHitpoints", 0x0f03, {}],
  ["Character.PlayAnimation", 0x0f04, {}],
  [
    "Character.UpdateScale",
    0x0f05,
    {
      fields: [
        {
          name: "characterId",
          type: "uint64string",
          defaultValue: "0x0000000000000000"
        },
        { name: "scale", type: "floatvector4", defaultValue: [20, 5, 20, 1] }
      ]
    }
  ],
  ["Character.UpdateTemporaryAppearance", 0x0f06, {}],
  ["Character.RemoveTemporaryAppearance", 0x0f07, {}],
  ["Character.SetLookAt", 0x0f08, {}],
  ["Character.RenamePlayer", 0x0f09, {}],
  [
    "Character.UpdateCharacterState",
    0x0f0a,
    {
      fields: [
        { name: "characterId", type: "uint64string", defaultValue: "0" },
        {
          name: "states1",
          type: "bitflags",
          flags: [
            { bit: 0, name: "visible", defaultValue: false },
            { bit: 1, name: "afraid", defaultValue: false },
            { bit: 2, name: "asleep", defaultValue: false },
            { bit: 3, name: "silenced", defaultValue: false },
            { bit: 4, name: "bound", defaultValue: false },
            { bit: 5, name: "rooted", defaultValue: false },
            { bit: 6, name: "stunned", defaultValue: false },
            { bit: 7, name: "knockedOut", defaultValue: false }
          ]
        },
        {
          name: "states2",
          type: "bitflags",
          flags: [
            { bit: 0, name: "nonAttackable", defaultValue: false },
            { bit: 1, name: "knockedBack", defaultValue: false },
            { bit: 2, name: "confused", defaultValue: false },
            { bit: 3, name: "goinghome", defaultValue: false },
            { bit: 4, name: "inCombat", defaultValue: false },
            { bit: 5, name: "frozen", defaultValue: false },
            { bit: 6, name: "berserk", defaultValue: false },
            { bit: 7, name: "inScriptedAnimation", defaultValue: false }
          ]
        },
        {
          name: "states3",
          type: "bitflags",
          flags: [
            { bit: 0, name: "pull", defaultValue: false },
            { bit: 1, name: "revivable", defaultValue: false },
            { bit: 2, name: "beingRevived", defaultValue: false },
            { bit: 3, name: "cloaked", defaultValue: false },
            { bit: 4, name: "interactBlocked", defaultValue: false },
            { bit: 5, name: "nonHealable", defaultValue: false },
            { bit: 6, name: "weaponFireBlocked", defaultValue: false },
            { bit: 7, name: "nonResuppliable", defaultValue: false }
          ]
        },
        {
          name: "states4",
          type: "bitflags",
          flags: [
            { bit: 0, name: "charging", defaultValue: false },
            { bit: 1, name: "invincibility", defaultValue: false },
            { bit: 2, name: "thrustPadded", defaultValue: false },
            { bit: 3, name: "castingAbility", defaultValue: false },
            { bit: 4, name: "userMovementDisabled", defaultValue: false },
            { bit: 5, name: "flying", defaultValue: false },
            { bit: 6, name: "hideCorpse", defaultValue: false },
            { bit: 7, name: "gmHidden", defaultValue: false }
          ]
        },
        {
          name: "states5",
          type: "bitflags",
          flags: [
            { bit: 0, name: "griefInvulnerability", defaultValue: false },
            { bit: 1, name: "canSpawnTank", defaultValue: false },
            { bit: 2, name: "inGravityField", defaultValue: false },
            { bit: 3, name: "invulnerable", defaultValue: false },
            { bit: 4, name: "friendlyFireImmunity", defaultValue: false },
            { bit: 5, name: "riotShielded", defaultValue: false },
            { bit: 6, name: "supplyingAmmo", defaultValue: false },
            { bit: 7, name: "supplyingRepairs", defaultValue: false }
          ]
        },
        {
          name: "states6",
          type: "bitflags",
          flags: [
            { bit: 0, name: "REUSE_ME_2", defaultValue: false },
            { bit: 1, name: "REUSE_ME_3", defaultValue: false },
            { bit: 2, name: "hidesHeat", defaultValue: false },
            { bit: 3, name: "nearDeath", defaultValue: false },
            { bit: 4, name: "dormant", defaultValue: false },
            { bit: 5, name: "ignoreStatusNotUsed", defaultValue: false },
            { bit: 6, name: "inWater", defaultValue: false },
            { bit: 7, name: "disarmed", defaultValue: false }
          ]
        },
        {
          name: "states7",
          type: "bitflags",
          flags: [
            { bit: 0, name: "doorState", defaultValue: false },
            { bit: 1, name: "sitting", defaultValue: false },
            { bit: 2, name: "error1", defaultValue: false },
            { bit: 3, name: "error2", defaultValue: false },
            { bit: 4, name: "handsUp", defaultValue: false },
            { bit: 5, name: "bit5", defaultValue: false },
            { bit: 6, name: "bit6", defaultValue: false },
            { bit: 7, name: "bit7", defaultValue: false }
          ]
        },
        { name: "placeholder", type: "uint8", defaultValue: 0 },
        { name: "gameTime", type: "uint32", defaultValue: 1 }
      ]
    }
  ],
  ["Character.ExpectedSpeed", 0x0f0b, {}],
  ["Character.ScriptedAnimation", 0x0f0c, {}],
  ["Character.ThoughtBubble", 0x0f0d, {}],
  ["Character._REUSE_14", 0x0f0e, {}],
  ["Character.LootEvent", 0x0f0f, {}],
  ["Character.SlotCompositeEffectOverride", 0x0f10, {}],
  ["Character.EffectPackage", 0x0f11, {}],
  ["Character.PreferredLanguages", 0x0f12, {}],
  ["Character.CustomizationChange", 0x0f13, {}],
  ["Character.PlayerTitle", 0x0f14, {}],
  ["Character.AddEffectTagCompositeEffect", 0x0f15, {}],
  ["Character.RemoveEffectTagCompositeEffect", 0x0f16, {}],
  ["Character.SetSpawnAnimation", 0x0f17, {}],
  ["Character.CustomizeNpc", 0x0f18, {}],
  ["Character.SetSpawnerActivationEffect", 0x0f19, {}],
  ["Character.SetComboState", 0x0f1a, {}],
  ["Character.SetSurpriseState", 0x0f1b, {}],
  ["Character.RemoveNpcCustomization", 0x0f1c, {}],
  [
    "Character.ReplaceBaseModel",
    0x0f1d,
    {
      fields: [
        {
          name: "characterId",
          type: "uint64string",
          defaultValue: "0x0000000000000000"
        },
        { name: "modelId", type: "uint32", defaultValue: 0 },
        { name: "effectId", type: "uint32", defaultValue: 0 }
      ]
    }
  ],
  ["Character.SetCollidable", 0x0f1e, {}],
  ["Character.UpdateOwner", 0x0f1f, {}],
  [
    "Character.WeaponStance",
    0x0f20,
    {
      fields: [
        { name: "characterId", type: "uint64string", defaultValue: "0" },
        { name: "stance", type: "uint32", defaultValue: 0 }
      ]
    }
  ],
  ["Character.UpdateTintAlias", 0x0f21, {}],
  [
    "Character.MoveOnRail",
    0x0f22,
    {
      fields: [
        {
          name: "characterId",
          type: "uint64string",
          defaultValue: "0x0000000000000000"
        },
        { name: "unknown4", type: "uint32", defaultValue: 50 },
        { name: "unknown5", type: "uint32", defaultValue: 50 },
        {
          name: "position",
          type: "floatvector4",
          defaultValue: [10, 0, 0, 1]
        }
      ]
    }
  ],
  [
    "Character.ClearMovementRail",
    0x0f23,
    {
      fields: [
        {
          name: "characterId",
          type: "uint64string",
          defaultValue: "0x0000000000000000"
        }
      ]
    }
  ],
  [
    "Character.MoveOnRelativeRail",
    0x0f24,
    {
      fields: [
        {
          name: "characterId",
          type: "uint64string",
          defaultValue: "0x0000000000000000"
        },
        { name: "unknown4", type: "uint32", defaultValue: 0 },
        { name: "unknown5", type: "uint32", defaultValue: 0 },
        { name: "unknown6", type: "uint32", defaultValue: 0 },
        { name: "unknown7", type: "uint32", defaultValue: 0 },
        { name: "unknown8", type: "uint32", defaultValue: 0 },
        {
          name: "unknownVector1",
          type: "floatvector4",
          defaultValue: [0, 0, 0, 0]
        }
      ]
    }
  ],
  [
    "Character.Destroyed",
    0x0f25,
    {
      fields: [
        { name: "characterId", type: "uint64string", defaultValue: "0" },
        { name: "destroyedEffect", type: "uint32", defaultValue: 0 },
        { name: "destroyedModel", type: "uint32", defaultValue: 0 },
        { name: "unknown3", type: "uint32", defaultValue: 0 },
        { name: "disableWeirdPhysic", type: "boolean", defaultValue: 0 },
        { name: "destroyedEffect2", type: "uint32", defaultValue: 0 },
        { name: "disableWeirdPhysic2", type: "boolean", defaultValue: true }
      ]
    }
  ],
  [
    "Character.SeekTarget",
    0x0f26,
    {
      fields: [
        {
          name: "characterId",
          type: "uint64string",
          defaultValue: "0x0000000000000000"
        },
        {
          name: "TargetCharacterId",
          type: "uint64string",
          defaultValue: "0x0000000000000000"
        },
        { name: "initSpeed", type: "float", defaultValue: 1 },
        { name: "acceleration", type: "float", defaultValue: 1 },
        { name: "speed", type: "float", defaultValue: 1 },
        { name: "turn", type: "float", defaultValue: 1 },
        { name: "yRot", type: "float", defaultValue: 1 },
        {
          name: "rotation",
          type: "floatvector4",
          defaultValue: [0, 0, 0, 1]
        }
      ]
    }
  ],
  [
    "Character.SeekTargetUpdate",
    0x0f27,
    {
      fields: [
        {
          name: "characterId",
          type: "uint64string",
          defaultValue: "0x0000000000000000"
        },
        {
          name: "TargetCharacterId",
          type: "uint64string",
          defaultValue: "0x0000000000000000"
        }
      ]
    }
  ],
  [
    "Character.UpdateActiveWieldType",
    0x0f28,
    {
      fields: [
        { name: "characterId", type: "uint64string", defaultValue: "0" },
        { name: "unknownDword1", type: "uint32", defaultValue: 0 }
      ]
    }
  ],
  ["Character.LaunchProjectile", 0x0f29, {}],
  ["Character.SetSynchronizedAnimations", 0x0f2a, {}],
  ["Character.MemberStatus", 0x0f2b, {}],
  [
    "Character.KnockedOut",
    0x0f2c,
    {
      fields: [{ name: "guid", type: "uint64string", defaultValue: "0" }]
    }
  ],
  ["Character.KnockedOutDamageReport", 0x0f2d, {}],
  [
    "Character.Respawn",
    0x0f2e,
    {
      fields: [
        { name: "respawnType", type: "uint8", defaultValue: 0 },
        { name: "respawnGuid", type: "uint64string", defaultValue: "0" },
        { name: "profileId", type: "uint32", defaultValue: 0 },
        { name: "profileId2", type: "uint32", defaultValue: 0 },
        { name: "unk", type: "uint32", defaultValue: 0 },
        {
          name: "gridPosition",
          type: "floatvector4",
          defaultValue: [0, 0, 0, 0]
        }
      ]
    }
  ],
  [
    "Character.RespawnReply",
    0x0f2f,
    {
      fields: [
        { name: "characterId", type: "uint64string", defaultValue: "0" },
        { name: "status", type: "boolean", defaultValue: true }
      ]
    }
  ],
  ["Character.ActivateProfile", 0x0f31, {}],
  [
    "Character.Jet",
    0x0f32,
    {
      fields: [
        { name: "characterId", type: "uint64string", defaultValue: "0" },
        { name: "state", type: "uint8", defaultValue: 0 }
      ]
    }
  ],
  ["Character.Turbo", 0x0f33, {}],
  ["Character.StartRevive", 0x0f34, {}],
  ["Character.StopRevive", 0x0f35, {}],
  ["Character.ReadyToRevive", 0x0f36, {}],
  [
    "Character.SetFaction",
    0x0f37,
    {
      fields: [
        { name: "guid", type: "uint64string", defaultValue: "0" },
        { name: "factionId", type: "uint8", defaultValue: 0 }
      ]
    }
  ],
  [
    "Character.SetBattleRank",
    0x0f38,
    {
      fields: [
        { name: "characterId", type: "uint64string", defaultValue: "0" },
        { name: "battleRank", type: "uint32", defaultValue: 0 }
      ]
    }
  ],
  ["Character.StartHeal", 0x0f39, {}],
  ["Character.StopHeal", 0x0f3a, {}],
  [
    "Character.ManagedObject",
    0x0f3b,
    {
      fields: [
        { name: "objectCharacterId", type: "uint64string", defaultValue: "0" },
        { name: "guid2", type: "uint64string", defaultValue: "0" },
        { name: "characterId", type: "uint64string", defaultValue: "0" }
      ]
    }
  ],
  ["Character.MaterialTypeOverride", 0x0f3c, {}],
  ["Character.DebrisLaunch", 0x0f3d, {}],
  ["Character.HideCorpse", 0x0f3e, {}],
  [
    "Character.CharacterStateDelta",
    0x0f3f,
    {
      fields: [
        { name: "guid1", type: "uint64string", defaultValue: "0" },
        { name: "guid2", type: "uint64string", defaultValue: "0" },
        { name: "guid3", type: "uint64string", defaultValue: "0" },
        { name: "guid4", type: "uint64string", defaultValue: "0" },
        { name: "gameTime", type: "uint32", defaultValue: 0 }
      ]
    }
  ],
  ["Character.UpdateStat", 0x0f40, {}],
  ["Character.NonPriorityCharacters", 0x0f42, {}],
  [
    "Character.PlayWorldCompositeEffect",
    0x0f43,
    {
      fields: [
        { name: "characterId", type: "uint64string", defaultValue: 0 },
        { name: "effectId", type: "uint32", defaultValue: 0 },
        {
          name: "position",
          type: "floatvector4",
          defaultValue: [0, 0, 0, 0]
        },
        { name: "unk3", type: "float", defaultValue: 0 }
      ]
    }
  ],
  ["Character.AFK", 0x0f44, {}],
  [
    "Character.FullCharacterDataRequest",
    0x0f45,
    {
      fields: [{ name: "characterId", type: "uint64string", defaultValue: "0" }]
    }
  ],
  ["Character.Deploy", 0x0f46, {}],
  ["Character.LowAmmoUpdate", 0x0f47, {}],
  [
    "Character.KilledBy",
    0x0f48,
    {
      fields: [
        {
          name: "killer",
          type: "uint64string",
          defaultValue: "0x0000000000000000"
        },
        {
          name: "killed",
          type: "uint64string",
          defaultValue: "0x0000000000000000"
        },
        { name: "isCheater", type: "boolean", defaultValue: 0 }
      ]
    }
  ],
  [
    "Character.MotorRunning",
    0x0f49,
    {
      fields: [
        { name: "characterId", type: "uint64string", defaultValue: "0" },
        { name: "unknownBool1", type: "boolean", defaultValue: false }
      ]
    }
  ],
  [
    "Character.DroppedIemNotification",
    0x0f4a,
    {
      fields: [
        { name: "characterId", type: "uint64string", defaultValue: "" },
        {
          name: "itemDefId",
          type: "uint32",
          defaultValue: "2"
        },
        { name: "count", type: "uint32", defaultValue: 10 }
      ]
    }
  ],
  [
    "Character.NoSpaceNotification",
    0x0f4b,
    {
      fields: [{ name: "characterId", type: "uint64string", defaultValue: "" }]
    }
  ],
  ["Character.ReloadNotification", 0x0f4c, {}],
  ["Character.MountBlockedNotification", 0x0f4d, {}],
  [
    "Character.StartMultiStateDeath",
    0x0f4f,
    {
      fields: [
        {
          name: "characterId",
          type: "uint64string",
          defaultValue: "0x0000000000000000"
        },
        { name: "unknown4", type: "uint8", defaultValue: 0 }, // die by falling to there left
        { name: "unknown5", type: "uint8", defaultValue: 1 }, // weird accrobatic stuff
        // when unknown4 & unknown5 are > 0 then the animation play in a loop forever
        { name: "unknown6", type: "uint8", defaultValue: 0 }
        // seems like some bytes can be added after that but not required
      ]
    }
  ],
  ["Character.AggroLevel", 0x0f50, {}],
  [
    "Character.DoorState",
    0x0f51,
    {
      fields: [
        { name: "characterId", type: "uint64string", defaultValue: "0" },
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
        { name: "unknownBool1", type: "boolean", defaultValue: false }
      ]
    }
  ],
  ["Character.RequestToggleDoorState", 0x0f52, {}],
  ["Character.SetAllowRespawn", 0x0f54, {}],
  ["Character.UpdateGuildTag", 0x0f55, {}],
  [
    "Character.MovementVersion",
    0x0f56,
    {
      fields: [
        { name: "characterId", type: "uint64string", defaultValue: "0" },
        { name: "version", type: "uint8", defaultValue: 1 }
      ]
    }
  ],
  ["Character.RequestMovementVersion", 0x0f57, {}],
  ["Character.DailyRepairMaterials", 0x0f58, {}],
  ["Character.BeginPreviewInteraction", 0x0f59, {}],
  ["Character.TransportPlayerToFactionHub", 0x0f5a, {}],
  ["Character.EnterCache", 0x0f5b, {}],
  ["Character.ExitCache", 0x0f5c, {}],
  ["Character.TransportPlayerToGatheringZone", 0x0f5d, {}],
  ["Character.UpdateTwitchInfo", 0x0f5e, {}],
  [
    "Character.UpdateSimpleProxyHealth",
    0x0f5f,
    {
      fields: [
        { name: "characterId", type: "uint64string", defaultValue: "0" },
        { name: "healthPercentage", type: "float", defaultValue: 0 }
      ]
    }
  ]
];
