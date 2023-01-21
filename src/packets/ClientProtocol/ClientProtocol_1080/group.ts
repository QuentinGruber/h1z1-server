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

import { identitySchema } from "./shared"

const groupCharacterSchema: Array<any> = [
  { name: "characterId", type: "uint64string", defaultValue: "" },
  { name: "identity", type: "schema", fields: identitySchema, defaultValue: {} },
  { name: "unknownByte1", type: "uint8", defaultValue: 0 },
  { name: "unknownString1", type: "string", defaultValue: "" },
]

const inviteDataSchema: Array<any> = [
  { name: "unknownQword1", type: "uint64string", defaultValue: "" },
  { name: "unknownDword1", type: "uint32", defaultValue: 0 },
  {
    name: "sourceCharacter",
    type: "schema",
    defaultValue: {},
    fields: groupCharacterSchema,
  },
  {
    name: "targetCharacter",
    type: "schema",
    defaultValue: {},
    fields: groupCharacterSchema,
  },
  { name: "unknownDword2", type: "uint32", defaultValue: 0 },
]

export const groupPackets = [
  [
    "Group.Invite", 
    0x1301, 
    {
      fields: [
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
        { name: "unknownDword2", type: "uint32", defaultValue: 0 },
        { name: "unknownDword3", type: "uint32", defaultValue: 0 },
        {
          name: "inviteData",
          type: "schema",
          defaultValue: {},
          fields: inviteDataSchema,
        },
      ]
    }
  ],
  [
    "Group.Join", 
    0x1302, 
    {
      fields: [

      ]
    }
  ],
  [
    "Group.AutoGroup", 
    0x1303, 
    {
      fields: [

      ]
    }
  ],
  [
    "Group.Leave", 
    0x1304, 
    {
      fields: [

      ]
    }
  ],
  [
    "Group.Kick", 
    0x1305, 
    {
      fields: [

      ]
    }
  ],
  [
    "Group.Disband", 
    0x1306, 
    {
      fields: [

      ]
    }
  ],
  [
    "Group.SetGroupFlags", 
    0x1307, 
    {
      fields: [

      ]
    }
  ],
  [
    "Group.SetGroupOwner", 
    0x1308, 
    {
      fields: [

      ]
    }
  ],
  [
    "Group.SetGroupDescription", 
    0x1309, 
    {
      fields: [

      ]
    }
  ],
  [
    "Group.UnknownA", 
    0x130a, 
    {
      fields: [

      ]
    }
  ],
  [
    "Group.MapPingRelated", 
    0x130b, 
    {
      fields: [

      ]
    }
  ],
  [
    "Group.UnknownC", 
    0x130c, 
    {
      fields: [

      ]
    }
  ],
  [
    "Group.GetGroup", 
    0x130e, 
    {
      fields: [

      ]
    }
  ],
  [
    "Group.UnknownF", 
    0x130f, 
    {
      fields: [

      ]
    }
  ],
  [
    "Group.JoinLookingForMore", 
    0x1310, 
    {
      fields: [

      ]
    }
  ],
  [
    "Group.ToggleSquadLeaderChat", 
    0x1311, 
    {
      fields: [

      ]
    }
  ],
  [
    "Group.Unknown12", 
    0x1312, 
    {
      fields: [

      ]
    }
  ],
  [
    "Group.PlayerJoined", 
    0x1313, 
    {
      fields: [

      ]
    }
  ],
  [
    "Group.Unknown14", 
    0x1314, 
    {
      fields: [

      ]
    }
  ],
  [
    "Group.RemoveGroup", 
    0x1316, 
    {
      fields: [

      ]
    }
  ],
  [
    "Group.RemoveMember", 
    0x1317, 
    {
      fields: [

      ]
    }
  ],
  [
    "Group.RemoveInvitation", 
    0x1318, 
    {
      fields: [

      ]
    }
  ],
  [
    "Group.Unknown19", 
    0x1319, 
    {
      fields: [

      ]
    }
  ],
  [
    "Group.Unknown1a", 
    0x131a, 
    {
      fields: [

      ]
    }
  ],
  [
    "Group.RaidCreate", 
    0x1323, 
    {
      fields: [

      ]
    }
  ],
]