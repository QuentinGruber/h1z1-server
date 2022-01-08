import { statDataSchema, lightWeightPcSchema, lightWeightNpcSchema, readPositionUpdateData, packPositionUpdateData, readUnsignedIntWith2bitLengthValue, packUnsignedIntWith2bitLengthValue, fullPcDataSchema, fullNpcDataSchema } from "./shared";

  

export const playerUpdatePackets:any = [ ["PlayerUpdate.None", 0x0f00, {}],
[
  "PlayerUpdate.RemovePlayer",
  0x0f010000,
  {
    fields: [
      { name: "characterId", type: "uint64string", defaultValue: "0" },
    ],
  },
],
[
  "PlayerUpdate.RemovePlayerGracefully",
  0x0f010100,
  {
    fields: [
      { name: "characterId", type: "uint64string", defaultValue: "0" },
      { name: "unknown5", type: "boolean", defaultValue: false },
      { name: "unknown6", type: "uint32", defaultValue: 1 },
      { name: "effectDelay", type: "uint32", defaultValue: 0 },
      { name: "effectId", type: "uint32", defaultValue: 0 }, // effect that stays at first object position
      { name: "stickyEffectId", type: "uint32", defaultValue: 0 }, // effect that follows object
      { name: "timeToDisappear", type: "uint32", defaultValue: 0 },
    ],
  },
],
[
  "PlayerUpdate.Knockback",
  0x0f02,
  {
    fields: [
      { name: "characterId", type: "uint64string", defaultValue: "0" },
      { name: "unk", type: "uint32", defaultValue: 1 },
      {
        name: "position",
        type: "floatvector4",
        defaultValue: [0, 50, 0, 1],
      },
      {
        name: "rotation",
        type: "floatvector4",
        defaultValue: [0, 0, 0, 1],
      },
      { name: "unk2", type: "uint32", defaultValue: 1 },
    ],
  },
],
["PlayerUpdate.UpdateHitpoints", 0x0f03, {}],
[
  "PlayerUpdate.PlayAnimation",
  0x0f04,
  {
    fields: [
      {
        name: "characterId",
        type: "uint64string",
        defaultValue: "0x0000000000000000",
      },
      {
        name: "unk1",
        type: "uint32",
        defaultValue: 1,
      },
      {
        name: "unk2",
        type: "uint32",
        defaultValue: 2,
      },
      {
        name: "unk3",
        type: "uint8",
        defaultValue: 3,
      },
      {
        name: "unk4",
        type: "uint32",
        defaultValue: 4,
      },
    ],
  },
],
["PlayerUpdate.AddNotifications", 0x0f05, {}],
["PlayerUpdate.RemoveNotifications", 0x0f06, {}],
[
  "PlayerUpdate.NpcRelevance",
  0x0f07,
  {
    fields: [
      {
        name: "npcs",
        type: "array",
        defaultValue: [],
        fields: [
          { name: "guid", type: "uint64string", defaultValue: "0" },
          { name: "unknownBoolean1", type: "boolean", defaultValue: true },
          { name: "unknownByte1", type: "uint8", defaultValue: 1 },
          { name: "unknownByte2", type: "uint8", defaultValue: 1 },
        ],
      },
    ],
  },
],
[
  "PlayerUpdate.UpdateScale",
  0x0f08,
  {
    fields: [
      {
        name: "characterId",
        type: "uint64string",
        defaultValue: "0x0000000000000000",
      },
      {
        name: "scale",
        type: "floatvector4",
        defaultValue: [20, 5, 20, 1],
      },
    ],
  },
],
[
  "PlayerUpdate.UpdateTemporaryAppearance",
  0x0f09,
  {
    fields: [
      {
        name: "modelId",
        type: "uint32",
        defaultValue: 9008,
      },
      {
        name: "characterId",
        type: "uint64string",
        defaultValue: "0x0000000000000000",
      },
    ],
  },
],
[
  "PlayerUpdate.RemoveTemporaryAppearance",
  0x0f0a,
  {
    fields: [
      {
        name: "characterId",
        type: "uint64string",
        defaultValue: "0x0000000000000000",
      },
      {
        name: "modelId?",
        type: "uint32",
        defaultValue: 9008,
      },
    ],
  },
],
[
  "PlayerUpdate.PlayCompositeEffect",
  0x0f0b,
  {
    fields: [
      { name: "characterId", type: "uint64string", defaultValue: "5048" },
      { name: "unk1", type: "uint32", defaultValue: 0 },
      { name: "unk2", type: "uint32", defaultValue: 0 },
      { name: "unk3", type: "uint32", defaultValue: 0 },
      { name: "unk4", type: "boolean", defaultValue: 0 },
      { name: "unk5", type: "boolean", defaultValue: 0 },
    ],
  },
],
[
  "PlayerUpdate.SetLookAt",
  0x0f0c,
  {
    fields: [
      { name: "characterId", type: "uint64string", defaultValue: "0" },
      { name: "targetCharacterId", type: "uint64string", defaultValue: "0" },
    ],
  },
],
["PlayerUpdate.RenamePlayer", 0x0f0d, {}],
[
  "PlayerUpdate.UpdateCharacterState",
  0x0f0e,
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
          { bit: 7, name: "knockedOut", defaultValue: false },
        ],
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
          { bit: 7, name: "inScriptedAnimation", defaultValue: false },
        ],
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
          { bit: 7, name: "nonResuppliable", defaultValue: false },
        ],
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
          { bit: 7, name: "gmHidden", defaultValue: false },
        ],
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
          { bit: 7, name: "supplyingRepairs", defaultValue: false },
        ],
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
          { bit: 7, name: "disarmed", defaultValue: false },
        ],
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
          { bit: 7, name: "bit7", defaultValue: false },
        ],
      },
      { name: "placeholder", type: "uint8", defaultValue: 0 },
      { name: "gameTime", type: "uint32", defaultValue: 1 },
    ],
  },
],
["PlayerUpdate.QueueAnimation", 0x0f0f, {}], // have been removed from the game
[
  "PlayerUpdate.ExpectedSpeed",
  0x0f10,
  {
    fields: [
      { name: "characterId", type: "uint64string", defaultValue: "0" },
      {
        name: "speed",
        type: "uint32",
        defaultValue: 0,
      },
    ],
  },
],
["PlayerUpdate.ScriptedAnimation", 0x0f11, {}], // have been removed from the game
[
  "PlayerUpdate.ThoughtBubble",
  0x0f12,
  {
    fields: [
      { name: "characterId", type: "uint64string", defaultValue: "0" },
      {
        name: "unk1",
        type: "uint32",
        defaultValue: 0,
      },
      {
        name: "unk2",
        type: "uint32",
        defaultValue: 0,
      },
      {
        name: "unk3",
        type: "boolean",
        defaultValue: false,
      },
    ],
  },
],
[
  "PlayerUpdate.SetDisposition",
  0x0f13,
  {
    fields: [
      { name: "characterId", type: "uint64string", defaultValue: "0" },

      {
        name: "disposition",
        type: "uint32",
        defaultValue: 0,
      },
    ],
  },
],
[
  "PlayerUpdate.LootEvent",
  0x0f14,
  {
    fields: [
      { name: "characterId", type: "uint64string", defaultValue: "0" },

      {
        name: "position",
        type: "floatvector4",
        defaultValue: [0, 50, 0, 1],
      },
      {
        name: "rotation",
        type: "floatvector4",
        defaultValue: [0, 0, 0, 1],
      },
      {
        name: "modelFileName",
        type: "string",
        defaultValue: "ZombieMale001.adr",
      },
    ],
  },
],
[
  "PlayerUpdate.SlotCompositeEffectOverride",
  0x0f15,
  {
    fields: [
      { name: "characterId", type: "uint64string", defaultValue: "0x000" },
      { name: "slotId", type: "uint32", defaultValue: 1 },
      { name: "effectId", type: "uint32", defaultValue: 0 },
    ],
  },
],
[
  "PlayerUpdate.EffectPackage",
  0x0f16,
  {
    fields: [
      { name: "unknownQword1", type: "uint64string", defaultValue: "0x000" },
      { name: "characterId", type: "uint64string", defaultValue: "0x000" },
      { name: "unknownBoolean1", type: "boolean", defaultValue: false },
      { name: "unknownDword1", type: "float", defaultValue: 0 },
      { name: "stringId", type: "uint32", defaultValue: 0 },
      { name: "unknownBoolean2", type: "boolean", defaultValue: false },
      { name: "effectId", type: "uint32", defaultValue: 0 },
      { name: "unknownDword4", type: "float", defaultValue: 0 },
      { name: "unknownDword5", type: "float", defaultValue: 0 },
    ],
  },
],
["PlayerUpdate.PreferredLanguages", 0x0f17, {}],
["PlayerUpdate.CustomizationChange", 0x0f18, {}],
["PlayerUpdate.PlayerTitle", 0x0f19, {}],
["PlayerUpdate.AddEffectTagCompositeEffect", 0x0f1a, {
  fields: [
    { name: "characterId", type: "uint64string", defaultValue: "0" },
    { name: "unk1", type: "uint32", defaultValue: 2 },
    { name: "unk2", type: "uint32", defaultValue: 3 },
    { name: "unk3", type: "uint64string", defaultValue: "0" },
    { name: "unk4", type: "uint64string", defaultValue: "0" },
    { name: "unk5", type: "uint32", defaultValue: 4 },
  ],
}],
["PlayerUpdate.RemoveEffectTagCompositeEffect", 0x0f1b, {}],
["PlayerUpdate.SetSpawnAnimation", 0x0f1c, {}],
[
  "PlayerUpdate.CustomizeNpc",
  0x0f1d,
  {
    fields: [
      { name: "characterId", type: "uint64string", defaultValue: "0" },
      { name: "a", type: "uint32", defaultValue: 15 },
      { name: "b", type: "uint32", defaultValue: 35 },

      {
        name: "unk1",
        type: "string",
        defaultValue: "0",
      },
      {
        name: "unk2",
        type: "string",
        defaultValue: "0",
      },
      { name: "c", type: "uint32", defaultValue: 0 },
      {
        name: "unk3",
        type: "boolean",
        defaultValue: 1,
      },
    ],
  },
],
[
  "PlayerUpdate.SetSpawnerActivationEffect",
  0x0f1e,
  {
    fields: [
      { name: "characterId", type: "uint64string", defaultValue: "0" },
      { name: "effectId", type: "uint32", defaultValue: 0 },
    ],
  },
],
["PlayerUpdate.SetComboState", 0x0f1f, {}],
["PlayerUpdate.SetSurpriseState", 0x0f20, {}],
["PlayerUpdate.RemoveNpcCustomization", 0x0f21, {}],
[
  "PlayerUpdate.ReplaceBaseModel",
  0x0f22,
  {
    fields: [
      {
        name: "characterId",
        type: "uint64string",
        defaultValue: "0x0000000000000000",
      },
      { name: "modelId", type: "uint32", defaultValue: 0 },
      { name: "unknown3", type: "uint32", defaultValue: 0 },
    ],
  },
],
[
  "PlayerUpdate.SetCollidable",
  0x0f23,
  {
    fields: [
      {
        name: "characterId",
        type: "uint64string",
        defaultValue: "0x0000000000000000",
      },
      { name: "collisionEnabled", type: "boolean", defaultValue: 0 },
    ],
  },
],
[
  "PlayerUpdate.UpdateOwner",
  0x0f24,
  {
    fields: [
      { name: "characterId", type: "uint64string", defaultValue: "0" },
      { name: "unk", type: "uint8", defaultValue: 0 },
    ],
  },
],
[
  "PlayerUpdate.WeaponStance",
  0x0f25,
  {
    fields: [
      { name: "characterId", type: "uint64string", defaultValue: "0" },
      { name: "stance", type: "uint32", defaultValue: 0 },
    ],
  },
],
["PlayerUpdate.UpdateTintAlias", 0x0f26, {}],
[
  "PlayerUpdate.MoveOnRail",
  0x0f27,
  {
    fields: [
      {
        name: "characterId",
        type: "uint64string",
        defaultValue: "0x0000000000000000",
      },
      { name: "unknown4", type: "uint32", defaultValue: 50 },
      { name: "unknown5", type: "uint32", defaultValue: 50 },
      {
        name: "position",
        type: "floatvector4",
        defaultValue: [10, 0, 0, 1],
      },
    ],
  },
],
[
  "PlayerUpdate.ClearMovementRail",
  0x0f28,
  {
    fields: [
      {
        name: "characterId",
        type: "uint64string",
        defaultValue: "0x0000000000000000",
      },
    ],
  },
],
[
  "PlayerUpdate.MoveOnRelativeRail",
  0x0f29,
  {
    fields: [
      {
        name: "characterId",
        type: "uint64string",
        defaultValue: "0x0000000000000000",
      },
      { name: "unknown4", type: "uint32", defaultValue: 0 },
      { name: "unknown5", type: "uint32", defaultValue: 0 },
      { name: "unknown6", type: "uint32", defaultValue: 0 },
      { name: "unknown7", type: "uint32", defaultValue: 0 },
      { name: "unknown8", type: "uint32", defaultValue: 0 },
      {
        name: "unknownVector1",
        type: "floatvector4",
        defaultValue: [0, 0, 0, 0],
      },
    ],
  },
],
[
  "PlayerUpdate.Destroyed",
  0x0f2a,
  {
    fields: [
      { name: "characterId", type: "uint64string", defaultValue: "0" },
      { name: "unknown1", type: "uint32", defaultValue: 9001 },
      { name: "unknown2", type: "uint32", defaultValue: 200 },
      { name: "unknown3", type: "uint32", defaultValue: 300 },
      { name: "disableWeirdPhysics", type: "boolean", defaultValue: 0 },
    ],
  },
],
[
  "PlayerUpdate.SeekTarget",
  0x0f2b,
  {
    fields: [
      {
        name: "characterId",
        type: "uint64string",
        defaultValue: "0x0000000000000000",
      },
      {
        name: "TargetCharacterId",
        type: "uint64string",
        defaultValue: "0x0000000000000000",
      },
      { name: "unknown5", type: "float", defaultValue: 1 },
      { name: "unknown6", type: "float", defaultValue: 1 },
      { name: "unknown7", type: "float", defaultValue: 1 },
      { name: "unknown8", type: "float", defaultValue: 1 },
      { name: "unknown9", type: "float", defaultValue: 1 },
      {
        name: "rotation",
        type: "floatvector4",
        defaultValue: [0, 0, 0, 0],
      },
    ],
  },
],
[
  "PlayerUpdate.SeekTargetUpdate",
  0x0f2c,
  {
    fields: [
      {
        name: "characterId",
        type: "uint64string",
        defaultValue: "0x0000000000000000",
      },
      {
        name: "TargetCharacterId",
        type: "uint64string",
        defaultValue: "0x0000000000000000",
      },
    ],
  },
],
[
  "PlayerUpdate.UpdateActiveWieldType",
  0x0f2d,
  {
    fields: [
      { name: "characterId", type: "uint64string", defaultValue: "0" },
      //  "Melee"=0,"Handgun"=1,"SubmachineGun"=2,"Rifle"=3,"Shoulder"=4,"Heavy"=5,"Hip"=6 
      { name: "filterType", type: "uint32", defaultValue: 0 }, 
    ],
  },
],
["PlayerUpdate.LaunchProjectile", 0x0f2e, { // half done
  fields: [
    {
      name: "projectile",
      type: "schema",
      fields: [
        { name: "unknownQword1", type: "uint64string", defaultValue: "0" },
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
        { name: "unknownDword2", type: "uint32", defaultValue: 0 },

        { name: "unknownWord3", type: "boolean", defaultValue: 0 },
        { name: "unknownWord4", type: "boolean", defaultValue: 0 },
       
        {
          name: "unknownVector1",
          type: "floatvector4",
          defaultValue: [0, 0, 0, 1],
        },
        {
          name: "unknownVector2",
          type: "floatvector4",
          defaultValue: [0, 0, 0, 1],
        },
        {
          name: "unknownVector3",
          type: "floatvector3",
          defaultValue: [0, 0, 0, 1],
        },
        {
          name: "unknownVector4",
          type: "floatvector3",
          defaultValue: [0, 0, 0, 1],
        },
        { name: "unkstring", type: "string", defaultValue: "test" },
        {
          name: "unknownVector5",
          type: "floatvector4",
          defaultValue: [0, 0, 0, 1],
        },

        { name: "unknownDword6", type: "uint32", defaultValue: 0 },
        { name: "unknownDword7", type: "uint32", defaultValue: 0 },
        { name: "unknownDword8", type: "uint32", defaultValue: 0 },
        { name: "unknownDword9", type: "uint32", defaultValue: 0 },
        { name: "unknownDword10", type: "uint32", defaultValue: 0 },
        { name: "unknownDword11", type: "uint32", defaultValue: 0 },
        { name: "unknownDword12", type: "uint32", defaultValue: 0 },
        { name: "unknownDword13", type: "uint32", defaultValue: 0 },
        { name: "unknownDword14", type: "uint32", defaultValue: 0 },
        { name: "unknownDword15", type: "uint32", defaultValue: 0 },
        { name: "unknownDword16", type: "uint32", defaultValue: 0 },
        { name: "unknownDword17", type: "uint32", defaultValue: 0 },
        { name: "unkstring2", type: "string", defaultValue: "test" },


        { name: "unknownDword18", type: "uint32", defaultValue: 0 },
        { name: "unknownDword19", type: "uint32", defaultValue: 0 },
        { name: "unknownDword20", type: "uint32", defaultValue: 0 },
        { name: "unknownDword21", type: "uint32", defaultValue: 0 },
        { name: "unknownDword22", type: "uint32", defaultValue: 0 },
        { name: "unknownDword23", type: "uint32", defaultValue: 0 },
        { name: "unknownDword24", type: "uint32", defaultValue: 0 },
        { name: "unknownDword25", type: "uint32", defaultValue: 0 },

        { name: "unknown26", type: "boolean", defaultValue: 0 },
        { name: "unknown27", type: "boolean", defaultValue: 0 },

        { name: "unknownDword28", type: "uint32", defaultValue: 0 },
        { name: "unknownDword29", type: "uint32", defaultValue: 0 },
        { name: "unknownDword30", type: "uint32", defaultValue: 0 },
        { name: "unknownDword31", type: "uint32", defaultValue: 0 },
        { name: "unknownDword32", type: "uint32", defaultValue: 0 },
        { name: "unknownDword33", type: "uint32", defaultValue: 0 },
        { name: "unknownDword34", type: "uint32", defaultValue: 0 },

        // vector2 ? ( a non sense but it's read the same way)
        { name: "unknownDword35", type: "uint32", defaultValue: 0 },
        { name: "unknownDword36", type: "uint32", defaultValue: 0 },


        // 3 bytes read in a standalone function
        { name: "unknown37", type: "uint8", defaultValue: 0 },
        { name: "unknown38", type: "uint8", defaultValue: 0 },
        { name: "unknown39", type: "uint8", defaultValue: 0 },

        { name: "unknownDword40", type: "uint32", defaultValue: 0 },
        { name: "unknownDword41", type: "uint32", defaultValue: 0 },

        { name: "unknownQword42", type: "uint64string", defaultValue: "0" },


        { name: "unknownDword42", type: "uint32", defaultValue: 0 },
        { name: "unknownDword43", type: "uint32", defaultValue: 0 },
        { name: "unknownDword44", type: "uint32", defaultValue: 0 },
        { name: "unknownDword45", type: "uint32", defaultValue: 0 },

        {
          name: "unknownVector6",
          type: "floatvector4",
          defaultValue: [0, 0, 0, 1],
        },

        { name: "unknownDword46", type: "uint32", defaultValue: 0 },
        { name: "unknownDword47", type: "uint32", defaultValue: 0 },

        { name: "unknownDword48", type: "uint8", defaultValue: 0 },

        // 9 4 

        { name: "unknownDword49", type: "uint32", defaultValue: 0 },
        { name: "unknownDword50", type: "uint32", defaultValue: 0 },
        { name: "unknownDword51", type: "uint32", defaultValue: 0 },
        { name: "unknownDword52", type: "uint32", defaultValue: 0 },
        { name: "unknownDword53", type: "uint32", defaultValue: 0 },
        { name: "unknownDword54", type: "uint32", defaultValue: 0 },
        { name: "unknownDword55", type: "uint32", defaultValue: 0 },
        { name: "unknownDword56", type: "uint32", defaultValue: 0 },
        { name: "unknownDword57", type: "uint32", defaultValue: 0 },

      ],
    },
    { name: "unknownDword1", type: "uint32", defaultValue: 0 },
  ],
}],
["PlayerUpdate.SetSynchronizedAnimations", 0x0f2f, {}],
[
  "PlayerUpdate.HudMessage",
  0x0f30,
  {
    fields: [
      { name: "characterId", type: "uint64string", defaultValue: "0" },
      {
        name: "unkguid2",
        type: "uint64string",
        defaultValue: "0x0000000000000011",
      },
      { name: "unknownDword1", type: "uint32", defaultValue: 1 },
      { name: "unknownDword2", type: "uint32", defaultValue: 2 },
      { name: "unknownDword3", type: "uint32", defaultValue: 3 },
      { name: "unknownDword4", type: "uint32", defaultValue: 4 },
      { name: "unknownDword5", type: "uint32", defaultValue: 5 },
      { name: "unknownDword6", type: "uint32", defaultValue: 6 },
    ],
  },
],
[
  "PlayerUpdate.CustomizationData",
  0x0f31,
  {
    fields: [
      {
        name: "customizationData",
        type: "array",
        defaultValue: [],
        fields: [
          { name: "unknown1", type: "uint32", defaultValue: 0 },
          { name: "modelName", type: "string", defaultValue: "" },
          { name: "unknown3", type: "uint32", defaultValue: 0 },
          { name: "unknown4", type: "uint32", defaultValue: 0 },
        ],
      },
    ],
  },
],
["PlayerUpdate.MemberStatus", 0x0f32, {}],
["PlayerUpdate.SetCurrentAdventure", 0x0f33, {}],
[
  "PlayerUpdate.StartHarvest",
  0x0f34,
  {
    fields: [
      {
        name: "characterId",
        type: "uint64string",
        defaultValue: "0x0000000000000000",
      },
      { name: "unknown4", type: "uint32", defaultValue: 10 },
      { name: "timeMs", type: "uint32", defaultValue: 1000 },
      { name: "unknown6", type: "uint32", defaultValue: 10 },
      { name: "stringId", type: "uint32", defaultValue: 10 },
      {
        name: "unknownGuid",
        type: "uint64string",
        defaultValue: "0x0000000000000000",
      },
    ],
  },
],
["PlayerUpdate.StopHarvest", 0x0f35, {}],
[
  "PlayerUpdate.KnockedOut",
  0x0f36,
  {
    fields: [
      { name: "characterId", type: "uint64string", defaultValue: "0" },
      {
        name: "unknownData1",
        type: "schema",
        fields: [
          { name: "unknownQword1", type: "uint64string", defaultValue: "0" },
          { name: "unknownDword1", type: "uint32", defaultValue: 0 },
          { name: "unknownDword2", type: "uint32", defaultValue: 0 },
          { name: "unknownDword3", type: "uint32", defaultValue: 0 },
          { name: "unknownDword4", type: "uint32", defaultValue: 0 },
          { name: "unknownDword5", type: "uint32", defaultValue: 0 },
          { name: "unknownDword6", type: "uint32", defaultValue: 0 },
          { name: "unknownDword7", type: "uint32", defaultValue: 0 },
          { name: "unknownDword8", type: "uint32", defaultValue: 0 },
          { name: "unknownDword9", type: "uint32", defaultValue: 0 },
          { name: "unknownDword10", type: "uint32", defaultValue: 0 },
          { name: "unknownDword11", type: "uint32", defaultValue: 0 },
          { name: "unknownDword12", type: "uint32", defaultValue: 0 },
        ],
      },
      {
        name: "unknownData2", // same schema as unknownData1
        type: "schema",
        fields: [
          { name: "unknownQword1", type: "uint64string", defaultValue: "0" },
          { name: "unknownDword1", type: "uint32", defaultValue: 0 },
          { name: "unknownDword2", type: "uint32", defaultValue: 0 },
          { name: "unknownDword3", type: "uint32", defaultValue: 0 },
          { name: "unknownDword4", type: "uint32", defaultValue: 0 },
          { name: "unknownDword5", type: "uint32", defaultValue: 0 },
          { name: "unknownDword6", type: "uint32", defaultValue: 0 },
          { name: "unknownDword7", type: "uint32", defaultValue: 0 },
          { name: "unknownDword8", type: "uint32", defaultValue: 0 },
          { name: "unknownDword9", type: "uint32", defaultValue: 0 },
          { name: "unknownDword10", type: "uint32", defaultValue: 0 },
          { name: "unknownDword11", type: "uint32", defaultValue: 0 },
          { name: "unknownDword12", type: "uint32", defaultValue: 0 },
        ],
      },
      {
        name: "unknownData3",
        type: "schema",
        fields: [
          {
            name: "unknownArray1",
            type: "array",
            defaultValue: [],
            fields: [
              { name: "unknownByte1", type: "uint8", defaultValue: 0 },
              { name: "unknownByte2", type: "uint8", defaultValue: 0 },
            ],
          },
          { name: "unknownDword1", type: "uint32", defaultValue: 0 },
          { name: "unknownQword1", type: "uint64string", defaultValue: "0" },
          { name: "unknownQword2", type: "uint64string", defaultValue: "0" },
          { name: "unknownQword3", type: "uint64string", defaultValue: "0" },
          { name: "unknownDword2", type: "uint32", defaultValue: 0 },
          { name: "unknownDword3", type: "uint32", defaultValue: 0 },
          { name: "unknownDword4", type: "uint32", defaultValue: 0 },
          { name: "unknownDword5", type: "uint32", defaultValue: 0 },
          { name: "unknownDword6", type: "uint32", defaultValue: 0 },
          { name: "unknownDword7", type: "uint32", defaultValue: 0 },
          { name: "unknownDword8", type: "uint32", defaultValue: 0 },
          {
            name: "unknownVector1",
            type: "floatvector4",
            defaultValue: [0, 0, 0, 1],
          },
          { name: "unknownDword9", type: "uint32", defaultValue: 0 },
          { name: "unknownDword10", type: "uint32", defaultValue: 0 },
          { name: "unknownDword11", type: "uint32", defaultValue: 0 },
          { name: "unknownDword12", type: "uint32", defaultValue: 0 },
        ],
      },
      { name: "unknownDword1", type: "uint32", defaultValue: 0 },
    ],
  },
],
["PlayerUpdate.KnockedOutDamageReport", 0x0f37, {}],
[
  "PlayerUpdate.Respawn",
  0x0f38,
  {
    fields: [
      { name: "respawnType", type: "uint8", defaultValue: 0 },
      { name: "respawnGuid", type: "uint64string", defaultValue: "0" },
      { name: "profileId", type: "uint32", defaultValue: 0 },
    ],
  },
],
[
  "PlayerUpdate.RespawnReply",
  0x0f39,
  {
    fields: [
      {
        name: "characterId",
        type: "uint64string",
        defaultValue: "0x0000000000000000",
      },
      { name: "unk", type: "uint8", defaultValue: 1 },
    ],
  },
],
["PlayerUpdate.ReadyToReviveResponse", 0x0f3a, {}],
["PlayerUpdate.ActivateProfile", 0x0f3b, {}],
[
  "PlayerUpdate.SetSpotted",
  0x0f3c,
  {
    fields: [
      {
        name: "unkArray",
        type: "array",
        defaultValue: [],
        fields: [{ name: "guid", type: "uint64string", defaultValue: "0" }],
      },
      { name: "unk1", type: "uint32", defaultValue: 100 },
      { name: "unk2", type: "uint8", defaultValue: 1 },
    ],
  },
],
[
  "PlayerUpdate.Jet",
  0x0f3d,
  {
    fields: [
      { name: "characterId", type: "uint64string", defaultValue: "0" },
      { name: "state", type: "uint8", defaultValue: 0 },
    ],
  },
],
["PlayerUpdate.Turbo", 0x0f3e, {}],
["PlayerUpdate.StartRevive", 0x0f3f, {}],
["PlayerUpdate.StopRevive", 0x0f40, {}],
["PlayerUpdate.ReadyToRevive", 0x0f41, {}],
[
  "PlayerUpdate.SetFaction",
  0x0f42,
  {
    fields: [
      { name: "guid", type: "uint64string", defaultValue: "0" },
      { name: "factionId", type: "uint8", defaultValue: 0 },
    ],
  },
],
[
  "PlayerUpdate.SetBattleRank",
  0x0f43,
  {
    fields: [
      { name: "characterId", type: "uint64string", defaultValue: "0" },
      { name: "battleRank", type: "uint32", defaultValue: 0 },
    ],
  },
],
["PlayerUpdate.StartHeal", 0x0f44, {}],
["PlayerUpdate.StopHeal", 0x0f45, {}],
["PlayerUpdate.Currency", 0x0f46, {}],
["PlayerUpdate.RewardCurrency", 0x0f47, {}],
[
  "PlayerUpdate.ManagedObject",
  0x0f48,
  {
    fields: [
      { name: "guid", type: "uint64string", defaultValue: "0" },
      { name: "guid2", type: "uint64string", defaultValue: "0" },
      { name: "characterId", type: "uint64string", defaultValue: "0" },
    ],
  },
],
["PlayerUpdate.ManagedObjectRequestControl", 0x0f49, {}],
[
  "PlayerUpdate.ManagedObjectResponseControl",
  0x0f4a,
  {
    fields: [
      { name: "unk", type: "uint8", defaultValue: 0 },
      { name: "characterId", type: "uint64string", defaultValue: "0" },
    ],
  },
],
["PlayerUpdate.ManagedObjectReleaseControl", 0x0f4b, {}],
[
  "PlayerUpdate.MaterialTypeOverride",
  0x0f4c,
  {
    fields: [
      { name: "characterId", type: "uint64string", defaultValue: "0" },
      { name: "materialType", type: "uint32", defaultValue: 0 },
    ],
  },
],
[
  "PlayerUpdate.DebrisLaunch",
  0x0f4d,
  {
    fields: [
      { name: "characterId", type: "uint64string", defaultValue: "0" },
      { name: "unk1", type: "uint32", defaultValue: 0 },
      { name: "unk2", type: "uint32", defaultValue: 0 },
      { name: "unk3", type: "uint64string", defaultValue: "0" },
    ],
  },
],
[
  "PlayerUpdate.HideCorpse",
  0x0f4e,
  {
    fields: [
      { name: "characterId", type: "uint64string", defaultValue: "0" },
      { name: "unknownBoolean", type: "boolean", defaultValue: 0 },
    ],
  },
],
[
  "PlayerUpdate.CharacterStateDelta",
  0x0f4f,
  {
    fields: [
      { name: "guid1", type: "uint64string", defaultValue: "0" },
      { name: "guid2", type: "uint64string", defaultValue: "0" },
      { name: "guid3", type: "uint64string", defaultValue: "0" },
      { name: "guid4", type: "uint64string", defaultValue: "0" },
      { name: "gameTime", type: "uint32", defaultValue: 0 },
    ],
  },
],
[
  "PlayerUpdate.UpdateStat",
  0x0f50,
  {
    fields: [
      { name: "characterId", type: "uint64string", defaultValue: "0" },
      {
        name: "stats",
        type: "array",
        defaultValue: [],
        fields: statDataSchema,
      },
    ],
  },
],
["PlayerUpdate.AnimationRequest", 0x0f51, {}],
["PlayerUpdate.NonPriorityCharacters", 0x0f53, {}],
[
  "PlayerUpdate.PlayWorldCompositeEffect",
  0x0f54,
  {
    fields: [
      { name: "soundId", type: "uint32", defaultValue: 0 },
      {
        name: "position",
        type: "floatvector4",
        defaultValue: [0, 0, 0, 0],
      },
      { name: "unk3", type: "uint32", defaultValue: 0 },
    ],
  },
],
["PlayerUpdate.AFK", 0x0f55, {}],
[
  "PlayerUpdate.AddLightweightPc",
  0x0f56,
  {
    fields: lightWeightPcSchema,
  },
],
[
  "PlayerUpdate.AddLightweightNpc",
  0x0f57,
  {
    fields: lightWeightNpcSchema,
  },
],
[
  "PlayerUpdate.AddLightweightVehicle",
  0x0f58,
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
        packer: packPositionUpdateData,
      },
      { name: "unknownString1", type: "string", defaultValue: "" },
    ],
  },
],
[
  "PlayerUpdate.AddProxiedObject",
  0x0f59,
  {
    fields: [
      {
        name: "characterId",
        type: "uint64string",
        defaultValue: "0x0000000000000000",
      },
      {
        name: "transientId",
        type: "custom",
        parser: readUnsignedIntWith2bitLengthValue,
        packer: packUnsignedIntWith2bitLengthValue,
      },
      { name: "unknown5", type: "uint8", defaultValue: 1 },
      {
        name: "position",
        type: "floatvector3",
        defaultValue: [0, 40, 0],
      },
      {
        name: "rotation",
        type: "floatvector3",
        defaultValue: [0, 0, 0],
      },
      { name: "unknown6", type: "uint32", defaultValue: 11 },

      {
        name: "NetworkObjectComponent", // can't be empty
        type: "array",
        fields: [{ name: "unknown1", type: "uint8", defaultValue: 0 }],
      },
    ],
  },
],
["PlayerUpdate.LightweightToFullPc", 0x0f5a, { fields: fullPcDataSchema }],
[
  "PlayerUpdate.LightweightToFullNpc",
  0x0f5b,
  {
    fields: fullNpcDataSchema,
  },
],
[
  "PlayerUpdate.LightweightToFullVehicle",
  0x0f5c,
  {
    fields: [
      { name: "npcData", type: "schema", fields: fullNpcDataSchema },
      { name: "unknownByte1", type: "uint8", defaultValue: 0 },
      { name: "unknownDword1", type: "uint32", defaultValue: 0 },
      {
        name: "unknownArray1",
        type: "array",
        defaultValue: [],
        fields: [
          { name: "unknownBoolean1", type: "boolean", defaultValue: false },
          { name: "unknownBoolean2", type: "boolean", defaultValue: false },
        ],
      },
      {
        name: "unknownArray2",
        type: "array",
        defaultValue: [],
        fields: [
          { name: "unknownBoolean1", type: "boolean", defaultValue: false },
          { name: "unknownBoolean2", type: "boolean", defaultValue: false },
        ],
      },
      {
        name: "unknownVector1",
        type: "floatvector4",
        defaultValue: [0, 0, 0, 0],
      },
      {
        name: "unknownVector2",
        type: "floatvector4",
        defaultValue: [0, 0, 0, 0],
      },
      { name: "unknownByte3", type: "uint8", defaultValue: 0 },
      {
        name: "unknownArray3",
        type: "array",
        defaultValue: [],
        fields: [
          //TODO
        ],
      },
      {
        name: "unknownArray4",
        type: "array",
        defaultValue: [],
        fields: [
          // TODO: 1401ab630
        ],
      },
      {
        name: "vehicleStats",
        type: "array",
        defaultValue: [],
        fields: [
          // using the "stat" schema
        ],
      },
      {
        name: "characterStats", // not sure about the name
        type: "array",
        defaultValue: [],
        fields: [
          // TODO: 1401f48c0
        ],
      },
    ],
  },
],
[
  "PlayerUpdate.FullCharacterDataRequest",
  0x0f5d,
  {
    fields: [
      { name: "characterId", type: "uint64string", defaultValue: "0" },
    ],
  },
],
[
  "PlayerUpdate.InitiateNameChange",
  0x0f5e,
  {
    fields: [
      {
        name: "characterId",
        type: "uint64string",
        defaultValue: "0x0000000000000000",
      },
    ],
  },
],
[
  "PlayerUpdate.NameChangeResult",
  0x0f5f,
  {
    fields: [
      {
        name: "characterId",
        type: "uint64string",
        defaultValue: "0x0000000000000000",
      },
      { name: "result", type: "uint32", defaultValue: 1 },
      { name: "unknown5", type: "uint8", defaultValue: 1 },
      { name: "unknown6", type: "uint8", defaultValue: 1 },
    ],
  },
],
["PlayerUpdate.NameValidationResult", 0x0f60, {}],
[
  "PlayerUpdate.Deploy", // just freeze the player...
  0x0f61,
  {
    fields: [
      {
        name: "characterId",
        type: "uint64string",
        defaultValue: "0x0000000000000000",
      },
      { name: "status", type: "uint32", defaultValue: 1 },
    ],
  },
],
[
  "PlayerUpdate.LowAmmoUpdate",
  0x0f62,
  {
    fields: [
      {
        name: "characterId",
        type: "uint64string",
        defaultValue: "0x0000000000000000",
      },
      { name: "status", type: "boolean", defaultValue: 0 },
    ],
  },
],
[
  "PlayerUpdate.KilledBy",
  0x0f63,
  {
    fields: [
      {
        name: "characterId",
        type: "uint64string",
        defaultValue: "0x0000000000000000",
      },
      {
        name: "characterId2",
        type: "uint64string",
        defaultValue: "0x0000000000000000",
      },
      { name: "isCheater", type: "boolean", defaultValue: 0 },
    ],
  },
],
[
  "PlayerUpdate.MotorRunning",
  0x0f64,
  {
    fields: [
      {
        name: "characterId",
        type: "uint64string",
        defaultValue: "0x0000000000000000",
      },
      {
        name: "isRunning",
        type: "boolean",
        defaultValue: "true",
      },
    ],
  },
],
[
  "PlayerUpdate.DroppedIemNotification",
  0x0f65,
  {
    fields: [
      {
        name: "itemId",
        type: "uint32",
        defaultValue: "2",
      },
      { name: "quantity", type: "uint32", defaultValue: 10 },
    ],
  },
],
["PlayerUpdate.NoSpaceNotification", 0x0f66, { fields: [] }],
[
  "PlayerUpdate.StartMultiStateDeath",
  0x0f68,
  {
    fields: [
      {
        name: "characterId",
        type: "uint64string",
        defaultValue: "0x0000000000000000",
      },
      { name: "unknown4", type: "uint8", defaultValue: 0 }, // die by falling to there left
      { name: "unknown5", type: "uint8", defaultValue: 1 }, // weird accrobatic stuff
      // when unknown4 & unknown5 are > 0 then the animation play in a loop forever
      { name: "unknown6", type: "uint8", defaultValue: 0 },
      // seems like some bytes can be added after that but not required
    ],
  },
],
[
  "PlayerUpdate.AggroLevel",
  0x0f69,
  {
    fields: [
      {
        name: "characterId",
        type: "uint64string",
        defaultValue: "0x0000000000000000",
      },
      { name: "aggroLevel", type: "uint32", defaultValue: 0 },
    ],
  },
],
[
  "PlayerUpdate.DoorState",
  0x0f6a,
  {
    fields: [
      {
        name: "characterId",
        type: "uint64string",
        defaultValue: "0x0000000000000000",
      },
      { name: "doorState", type: "uint32", defaultValue: 0 },
      { name: "unknownBoolean", type: "boolean", defaultValue: 0 },
    ],
  },
],
["PlayerUpdate.RequestToggleDoorState", 0x0f6b, {}],
[
  "PlayerUpdate.BeginCharacterAccess",
  0x0f6c,
  {
    fields: [
      { name: "characterId", type: "uint64string", defaultValue: "0" },
      { name: "state", type: "boolean", defaultValue: 0 },
      { name: "unk1", type: "uint32", defaultValue: 0 },
    ],
  },
],
[
  "PlayerUpdate.EndCharacterAccess",
  0x0f6d,
  {
    fields: [],
  },
],
[
  "PlayerUpdate.UpdateMutateRights",
  0x0f6e,
  {
    fields: [
      { name: "unknownQword1", type: "uint64string", defaultValue: "0" },
      { name: "unknownBoolean1", type: "boolean", defaultValue: false },
    ],
  },
],
["PlayerUpdate.UpdateFogOfWar", 0x0f70, {}],
["PlayerUpdate.SetAllowRespawn", 0x0f71, {}],]