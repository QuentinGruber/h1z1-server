// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (c) 2020 Quentin Gruber
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

var PacketTable = require("./packettable");

var packets = [
  [
    "LoginRequest",
    0x01,
    {
      fields: [
        { name: "sessionId", type: "string" },
        { name: "systemFingerPrint", type: "string" },
        { name: "unknown1", type: "uint32", defaultValue: 0 },
        { name: "unknown2", type: "uint32", defaultValue: 0 },
        { name: "unknown3", type: "uint32", defaultValue: 0 },
        { name: "unknown4", type: "uint32", defaultValue: 0 },
      ],
    },
  ],
  [
    "LoginReply",
    0x02,
    {
      fields: [
        { name: "loggedIn", type: "boolean" },
        { name: "status", type: "uint32" },
        { name: "isMember", type: "boolean" },
        { name: "isInternal", type: "boolean" },
        { name: "namespace", type: "string" },
        { name: "ApplicationPayload", type: "byteswithlength" },
      ],
    },
  ],
  [
    "Logout",
    0x03,
    {
      fields: [],
    },
  ],
  [
    "ForceDisconnect",
    0x04,
    {
      fields: [],
    },
  ],
  [
    "CharacterCreateRequest",
    0x05,
    {
      fields: [
        { name: "serverId", type: "uint32" },
        { name: "unknown", type: "uint32" },
        {
          name: "payload",
          type: "byteswithlength",
          fields: [
            { name: "empireId", type: "uint8" },
            { name: "headType", type: "uint32" },
            { name: "profileType", type: "uint32" },
            { name: "gender", type: "uint32" },
            { name: "characterName", type: "string" },
          ],
        },
      ],
    },
  ],
  [
    "CharacterCreateReply",
    0x06,
    {
      fields: [
        { name: "status", type: "uint32" },
        { name: "characterId", type: "uint64" },
      ],
    },
  ],
  [
    "CharacterLoginRequest",
    0x07,
    {
      fields: [
        { name: "characterId", type: "uint64" },
        { name: "serverId", type: "uint32" },
        { name: "unknown", type: "uint32", defaultValue: 0 },
        {
          name: "payload",
          type: "byteswithlength",
          fields: [{ name: "locale", type: "string" }],
        },
      ],
    },
  ],
  [
    "CharacterLoginReply",
    0x08,
    {
      fields: [
        { name: "characterId", type: "uint64" },
        { name: "serverId", type: "uint32" },
        { name: "unknown", type: "uint32" },
        { name: "status", type: "uint32" },
        {
          name: "payload",
          type: "byteswithlength",
          fields: [
            { name: "serverAddress", type: "string" },
            { name: "serverTicket", type: "string" },
            { name: "encryptionKey", type: "byteswithlength" },
            { name: "characterId", type: "uint64" },
            { name: "guid", type: "uint32" },
            { name: "unknown2", type: "uint32" },
            { name: "stationName", type: "string" },
            { name: "characterName", type: "string" },
            { name: "loginQueuePlacement", type: "uint32" },
          ],
        },
      ],
    },
  ],
  [
    "CharacterDeleteRequest",
    0x09,
    {
      fields: [{ name: "characterId", type: "uint64" }],
    },
  ],
  [
    "CharacterDeleteReply",
    0x0a,
    {
      fields: [
        { name: "characterId", type: "uint64" },
        { name: "status", type: "uint32" },
        { name: "Payload", type: "string" },
      ],
    },
  ],
  [
    "CharacterSelectInfoRequest",
    0x0b,
    {
      fields: [],
    },
  ],
  [
    "CharacterSelectInfoReply",
    0x0c,
    {
      fields: [
        { name: "status", type: "uint32" },
        { name: "canBypassServerLock", type: "boolean" },
        {
          name: "characters",
          type: "array",
          fields: [
            { name: "characterId", type: "uint64" },
            { name: "serverId", type: "uint32" },
            { name: "status", type: "uint32" },
            { name: "lastLoginDate", type: "uint32" },
            { name: "unknown1", type: "uint32" },
            { name: "unknown2", type: "uint32" },
            {
              name: "payload",
              type: "byteswithlength",
              fields: [
                { name: "name", type: "string" },
                { name: "empireId", type: "uint8" },
                { name: "battleRank", type: "uint32" },
                { name: "nextBattleRankPercent", type: "uint32" },
                { name: "headId", type: "uint32" },
                { name: "modelId", type: "uint32" },
                { name: "gender", type: "uint32" },
                { name: "profileId", type: "uint32" },
                { name: "unknownDword1", type: "uint32" },
                {
                  name: "loadoutData",
                  type: "schema",
                  fields: [
                    { name: "loadoutId", type: "uint32" },
                    {
                      name: "unknownData1",
                      type: "schema",
                      fields: [
                        { name: "unknownDword1", type: "uint32" },
                        { name: "unknownByte1", type: "uint8" },
                      ],
                    },
                    { name: "unknownDword1", type: "uint32" },
                    {
                      name: "unknownData2",
                      type: "schema",
                      fields: [
                        { name: "unknownDword1", type: "uint32" },
                        { name: "loadoutName", type: "string" },
                      ],
                    },
                    { name: "tintItemId", type: "uint32" },
                    { name: "unknownDword2", type: "uint32" },
                    { name: "decalItemId", type: "uint32" },
                    {
                      name: "loadoutSlots",
                      type: "array",
                      fields: [
                        { name: "slotId", type: "uint32" },
                        {
                          name: "loadoutSlotData",
                          type: "schema",
                          fields: [
                            { name: "index", type: "uint32" },
                            {
                              name: "unknownData1",
                              type: "schema",
                              fields: [
                                { name: "itemLineId", type: "uint32" },
                                { name: "flags", type: "uint8" },
                                {
                                  name: "attachments",
                                  type: "array",
                                  fields: [
                                    { name: "attachmentId", type: "uint32" },
                                  ],
                                },
                                {
                                  name: "attachmentClasses",
                                  type: "array",
                                  fields: [
                                    { name: "classId", type: "uint32" },
                                    { name: "attachmentId", type: "uint32" },
                                  ],
                                },
                              ],
                            },
                            { name: "tintItemId", type: "uint32" },
                            { name: "itemSlot", type: "uint32" },
                          ],
                        },
                      ],
                    },
                  ],
                },
                {
                  name: "itemDefinitions",
                  type: "array",
                  fields: [
                    { name: "itemId", type: "uint32" },
                    {
                      name: "itemDefinitionData",
                      type: "schema",
                      fields: [
                        { name: "itemId", type: "uint32" },
                        { name: "flags", type: "uint16" },
                        { name: "nameId", type: "uint32" },
                        { name: "descriptionId", type: "uint32" },
                        { name: "unknownDword1", type: "uint32" },
                        { name: "iconId", type: "uint32" },
                        { name: "unknownDword2", type: "uint32" },
                        { name: "hudImageSetId", type: "uint32" },
                        { name: "unknownDword3", type: "uint32" },
                        { name: "unknownDword4", type: "uint32" },
                        { name: "cost", type: "uint32" },
                        { name: "itemClass", type: "uint32" },
                        { name: "unknownDword5", type: "uint32" },
                        { name: "itemSlot", type: "uint32" },
                        { name: "slotOverrideKey", type: "uint32" },
                        { name: "unknownDword6", type: "uint8" },
                        { name: "modelName", type: "string" },
                        { name: "unknownString1", type: "string" },
                        { name: "unknownByte1", type: "uint8" },
                        { name: "itemType", type: "uint32" },
                        { name: "categoryId", type: "uint32" },
                        { name: "unknownDword7", type: "uint32" },
                        { name: "unknownDword8", type: "uint32" },
                        { name: "unknownDword9", type: "uint32" },
                        { name: "unknownDword10", type: "uint32" },
                        { name: "unknownDword11", type: "uint32" },
                        { name: "activatableAbilityId", type: "uint32" },
                        { name: "passiveAbilityId", type: "uint32" },
                        { name: "unknownDword12", type: "uint32" },
                        { name: "maxStackSize", type: "uint32" },
                        { name: "tintName", type: "string" },
                        { name: "unknownDword13", type: "uint32" },
                        { name: "unknownDword14", type: "uint32" },
                        { name: "unknownDword15", type: "uint32" },
                        { name: "unknownDword16", type: "uint32" },
                        { name: "uiModelCamera", type: "uint32" },
                        { name: "equipCountMax", type: "uint32" },
                        { name: "currencyType", type: "uint32" },
                        { name: "unknownDword17", type: "uint32" },
                        { name: "clientItemType", type: "uint32" },
                        { name: "skillSetId", type: "uint32" },
                        { name: "overlayTexture", type: "string" },
                        { name: "decalSlot", type: "string" },
                        { name: "unknownDword18", type: "uint32" },
                        { name: "trialDurationSec", type: "uint32" },
                        { name: "trialExclusionSec", type: "uint32" },
                        { name: "clientUseRequirementId", type: "uint32" },
                        { name: "overrideAppearance", type: "string" },
                        { name: "unknownDword19", type: "uint32" },
                        { name: "clientUseRequirementId2", type: "uint32" },
                      ],
                    },
                  ],
                },
                {
                  name: "attachmentDefinitions",
                  type: "array",
                  fields: [
                    { name: "attachmentId", type: "uint32" },
                    {
                      name: "attachmentData",
                      type: "schema",
                      fields: [
                        { name: "attachmentId", type: "uint32" },
                        { name: "groupId", type: "uint32" },
                        { name: "itemLineId", type: "uint32" },
                        {
                          name: "flags",
                          type: "bitflags",
                          flags: [
                            { bit: 0, name: "bit0" },
                            { bit: 1, name: "bit1" },
                            { bit: 2, name: "bit2" },
                            { bit: 3, name: "bit3" },
                            { bit: 4, name: "bit4" },
                            { bit: 5, name: "bit5" },
                            { bit: 6, name: "bit6" },
                            { bit: 7, name: "required" },
                          ],
                        },
                        {
                          name: "classes",
                          type: "array",
                          elementType: "uint32",
                        },
                      ],
                    },
                  ],
                },
                { name: "lastUseDate", type: "uint64" },
              ],
            },
          ],
        },
      ],
    },
  ],
  [
    "ServerListRequest",
    0x0d,
    {
      fields: [],
    },
  ],
  [
    "ServerListReply",
    0x0e,
    {
      fields: [
        {
          name: "servers",
          type: "array",
          fields: [
            { name: "serverId", type: "uint32" },
            { name: "serverState", type: "uint32" },
            { name: "locked", type: "boolean" },
            { name: "name", type: "string" },
            { name: "nameId", type: "uint32" },
            { name: "description", type: "string" },
            { name: "descriptionId", type: "uint32" },
            { name: "reqFeatureId", type: "uint32" },
            { name: "serverInfo", type: "string" },
            { name: "populationLevel", type: "uint32" },
            { name: "populationData", type: "string" },
            { name: "allowedAccess", type: "boolean" },
          ],
        },
      ],
    },
  ],
  [
    "ServerUpdate",
    0x0f,
    {
      fields: [
        { name: "serverId", type: "uint32" },
        { name: "serverState", type: "uint32" },
        { name: "locked", type: "boolean" },
        { name: "name", type: "string" },
        { name: "nameId", type: "uint32" },
        { name: "description", type: "string" },
        { name: "descriptionId", type: "uint32" },
        { name: "reqFeatureId", type: "uint32" },
        { name: "serverInfo", type: "string" },
        { name: "populationLevel", type: "uint32" },
        { name: "populationData", type: "string" },
        { name: "allowedAccess", type: "boolean" },
      ],
    },
  ],
  [
    "TunnelAppPacketClientToServer",
    0x10,
    {
      fields: [
        { name: "unknown", type: "string" },
        { name: "data", type: "string" },
      ],
    },
  ],
  [
    "TunnelAppPacketServerToClient",
    0x11,
    {
      fields: [{ name: "unknown1", type: "boolean" }],
    },
  ],
  ["CharacterTransferRequest", 0x12, {}],
  ["CharacterTransferReply", 0x13, {}],
];

var packetTypes = {},
  packetDescriptors = {};

PacketTable.build(packets, packetTypes, packetDescriptors);

exports.PacketTypes = packetTypes;
exports.Packets = packetDescriptors;
