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
import PacketTableBuild from "../../packettable";
import {
  itemDefinitionSchema,
  loadoutSlotData
} from "../../ClientProtocol/ClientProtocol_1080/shared";

const serverField: any[] = [
  { name: "serverId", type: "uint32" },
  { name: "serverState", type: "uint32" },
  { name: "locked", type: "boolean" },
  { name: "name", type: "string" },
  { name: "nameId", type: "uint32" },
  { name: "description", type: "string" },
  { name: "descriptionId", type: "uint32" },
  { name: "reqFeatureId", type: "uint32" },
  { name: "serverInfo", type: "string" },
  // The "populationNumber" dword was split into 2 uint16s to show server population numbers on the main menu -Meme
  { name: "populationNumber", type: "uint16", defaultValue: 0 },
  { name: "maxPopulationNumber", type: "uint16", defaultValue: 1 },
  { name: "populationData", type: "string" },
  { name: "AccessExpression", type: "string", defaultValue: "" },
  { name: "allowedAccess", type: "boolean" }
];

export const applicationDataJS2016 = [
  { name: "serverAddress", type: "string" },
  { name: "serverTicket", type: "string" },
  { name: "encryptionKey", type: "byteswithlength" },
  { name: "encryptionType", type: "uint32", defaultValue: 3 },
  { name: "guid", type: "uint64string" },
  {
    name: "unknownQword1",
    type: "uint64string",
    defaultValue: "0x0000000000000000"
  },
  { name: "unknownString1", type: "string", defaultValue: "" },
  { name: "unknownString2", type: "string", defaultValue: "" },
  { name: "unknownString3", type: "string", defaultValue: "" },
  {
    name: "serverFeatureBit",
    type: "uint64string",
    defaultValue: "0x0000000000000000"
  }
];

export const applicationDataKOTK = [
  {
    name: "unknownByte1",
    type: "uint8",
    defaultValue: 0
  },
  {
    name: "unknownByte2",
    type: "uint8",
    defaultValue: 0
  },
  ...applicationDataJS2016
];

const packets: PacketStructures = [
  [
    "LoginRequest",
    0x01,
    {
      fields: [
        { name: "sessionId", type: "string" },
        { name: "systemFingerPrint", type: "string" },
        { name: "Locale", type: "uint32", defaultValue: 0 },
        { name: "ThirdPartyAuthTicket", type: "uint32", defaultValue: 0 },
        { name: "ThirdPartyUserId", type: "uint32", defaultValue: 0 },
        { name: "ThirdPartyId", type: "uint32", defaultValue: 0 }
      ]
    }
  ],
  [
    "LoginReply",
    0x02,
    {
      fields: [
        { name: "loggedIn", type: "boolean" },
        { name: "status", type: "uint32" },
        { name: "resultCode", type: "uint32" },
        { name: "isMember", type: "boolean" },
        { name: "isInternal", type: "boolean" },
        { name: "namespace", type: "string" },
        {
          name: "accountFeatures",
          type: "array",
          fields: [
            { name: "key", type: "uint32" },
            {
              name: "accountFeature",
              type: "schema",
              fields: [
                { name: "id", type: "uint32" },
                { name: "active", type: "boolean" },
                { name: "remainingCount", type: "uint32" },
                { name: "rawData", type: "string" }
              ]
            }
          ]
        },
        {
          name: "applicationPayload",
          type: "byteswithlength",
          defaultValue: 0
        },
        {
          name: "errorDetails",
          type: "array",
          fields: [
            { name: "unknownDword1", type: "uint32" },
            { name: "name", type: "string" },
            { name: "value", type: "string" }
          ]
        },
        { name: "ipCountryCode", type: "string" }
      ]
    }
  ],
  [
    "Logout",
    0x03,
    {
      fields: []
    }
  ],
  [
    "ForceDisconnect",
    0x04,
    {
      fields: []
    }
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
            { name: "characterName", type: "string" }
          ]
        }
      ]
    }
  ],
  [
    "CharacterCreateReply",
    0x06,
    {
      fields: [
        { name: "status", type: "uint32" },
        { name: "characterId", type: "uint64string" }
      ]
    }
  ],
  [
    "CharacterLoginRequest",
    0x07,
    {
      fields: [
        { name: "characterId", type: "uint64string" },
        { name: "serverId", type: "uint32" },
        { name: "status", type: "uint32", defaultValue: 0 },
        {
          name: "payload",
          type: "byteswithlength",
          fields: [
            { name: "locale", type: "string" },
            { name: "localeId", type: "uint32" },
            { name: "preferredGatewayId", type: "uint32" }
          ]
        }
      ]
    }
  ],
  [
    "CharacterLoginReply",
    0x08,
    {
      fields: [
        { name: "unknownQword1", type: "uint64string" },
        { name: "unknownDword1", type: "uint32" },
        { name: "unknownDword2", type: "uint32" },
        { name: "status", type: "uint32" },
        {
          name: "applicationData",
          type: "byteswithlength",
          fields: applicationDataJS2016 // default
        }
      ]
    }
  ],
  [
    "CharacterDeleteRequest",
    0x09,
    {
      fields: [{ name: "characterId", type: "uint64string" }]
    }
  ],
  [
    "CharacterDeleteReply",
    0x0a,
    {
      fields: [
        { name: "characterId", type: "uint64string" },
        { name: "status", type: "uint32" },
        { name: "Payload", type: "string" }
      ]
    }
  ],
  [
    "CharacterSelectInfoRequest",
    0x0b,
    {
      fields: []
    }
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
            { name: "characterId", type: "uint64string" },
            { name: "serverId", type: "uint32", defaultValue: 1 },
            { name: "lastLoginDate", type: "uint64string", defaultValue: "" },
            { name: "nullField", type: "uint32", defaultValue: 0 },
            { name: "status", type: "uint32", defaultValue: 1 },
            {
              name: "payload",
              type: "byteswithlength",
              fields: [
                { name: "name", type: "string" },
                { name: "empireId", type: "uint8", defaultValue: 0 },
                { name: "battleRank", type: "uint32", defaultValue: 0 },
                {
                  name: "nextBattleRankPercent",
                  type: "uint32",
                  defaultValue: 0
                },
                { name: "headId", type: "uint32", defaultValue: 0 },
                { name: "modelId", type: "uint32", defaultValue: 0 },
                { name: "gender", type: "uint32", defaultValue: 0 },
                { name: "profileId", type: "uint32", defaultValue: 0 },
                { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                { name: "unknownDword2", type: "uint32", defaultValue: 0 },
                {
                  name: "loadoutSlots",
                  type: "array",
                  defaultValue: [],
                  fields: [
                    { name: "hotbarSlotId", type: "uint32", defaultValue: 0 },
                    ...loadoutSlotData
                  ]
                },
                {
                  name: "itemDefinitions",
                  type: "array",
                  defaultValue: [],
                  fields: [
                    { name: "ID", type: "uint32", defaultValue: "" },
                    {
                      name: "itemDefinitionData",
                      type: "schema",
                      defaultValue: {},
                      fields: [
                        { name: "ID", type: "uint32", defaultValue: "" },
                        ...itemDefinitionSchema
                      ]
                    }
                  ]
                },
                { name: "lastUseDate", type: "uint64string", defaultValue: "" }
              ]
            }
          ]
        }
      ]
    }
  ],
  [
    "ServerListRequest",
    0x0d,
    {
      fields: []
    }
  ],
  [
    "ServerListReply",
    0x0e,
    {
      fields: [
        {
          name: "servers",
          type: "array",
          fields: serverField
        }
      ]
    }
  ],
  [
    "ServerUpdate",
    0x0f,
    {
      fields: serverField
    }
  ],
  [
    "TunnelAppPacketClientToServer",
    0x10,
    {
      fields: [
        { name: "unknown", type: "string" },
        { name: "data", type: "string" }
      ]
    }
  ],
  [
    "TunnelAppPacketServerToClient",
    0x11,
    {
      fields: [{ name: "unknown1", type: "boolean" }]
    }
  ],
  ["CharacterTransferRequest", 0x12, {}],
  ["CharacterTransferReply", 0x13, {}],

  // __opcode__ is used since loginserver opcodes are only a byte serverside and I don't feel like fixing that -Meme
  [
    "H1emu.PrintToConsole",
    0x20,
    {
      fields: [
        { name: "__opcode__", type: "uint8", defaultValue: 1 },
        { name: "message", type: "string", defaultValue: "" },
        { name: "showConsole", type: "boolean", defaultValue: false },
        { name: "clearOutput", type: "boolean", defaultValue: false }
      ]
    }
  ],
  [
    "H1emu.MessageBox",
    0x21,
    {
      fields: [
        { name: "__opcode__", type: "uint8", defaultValue: 2 },
        { name: "title", type: "string", defaultValue: "" },
        { name: "message", type: "string", defaultValue: "" }
      ]
    }
  ],
  [
    "H1emu.HadesInit",
    0x22,
    {
      fields: [
        { name: "__opcode__", type: "uint8", defaultValue: 3 },
        { name: "authTicket", type: "string", defaultValue: "" },
        { name: "gatewayServer", type: "string", defaultValue: "" }
      ]
    }
  ],
  [
    "H1emu.HadesQuery",
    0x23,
    {
      fields: [
        { name: "__opcode__", type: "uint8", defaultValue: 4 },
        { name: "authTicket", type: "string", defaultValue: "" },
        { name: "gatewayServer", type: "string", defaultValue: "" }
      ]
    }
  ]
];

export const [packetTypes, packetDescriptors] = PacketTableBuild(packets);
const loginPackets = { Packets: packetDescriptors, PacketTypes: packetTypes };
export default loginPackets;
