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

import { PacketField, PacketStructures } from "types/packetStructure";
import { identitySchema } from "./shared";

const groupCharacterSchema: Array<PacketField> = [
  { name: "characterId", type: "uint64string", defaultValue: "" },
  {
    name: "identity",
    type: "schema",
    fields: identitySchema,
    defaultValue: {}
  },
  { name: "unknownByte1", type: "uint8", defaultValue: 0 },
  { name: "unknownString1", type: "string", defaultValue: "" }
];

const inviteDataSchema: Array<PacketField> = [
  { name: "unknownQword1", type: "uint64string", defaultValue: "" },
  { name: "unknownDword1", type: "uint32", defaultValue: 0 },
  {
    name: "sourceCharacter",
    type: "schema",
    defaultValue: {},
    fields: groupCharacterSchema
  },
  {
    name: "targetCharacter",
    type: "schema",
    defaultValue: {},
    fields: groupCharacterSchema
  },
  { name: "unknownDword2", type: "uint32", defaultValue: 0 }
];

const joinDataSchema: Array<PacketField> = [
  {
    name: "inviteData",
    type: "schema",
    defaultValue: {},
    fields: groupCharacterSchema
  },
  {
    name: "unknownData1",
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
  { name: "unknownDword1", type: "uint32", defaultValue: 0 },
  { name: "unknownByte1", type: "uint8", defaultValue: 0 },
  { name: "unknownDword2", type: "uint32", defaultValue: 0 },
  { name: "unknownDword3", type: "uint32", defaultValue: 0 },
  { name: "unknownDword4", type: "uint32", defaultValue: 0 },
  { name: "unknownQword1", type: "uint64string", defaultValue: "" },
  { name: "unknownDword5", type: "uint32", defaultValue: 0 },
  {
    name: "unknownFloatVector3",
    type: "floatvector3",
    defaultValue: [0, 0, 0]
  },
  {
    name: "unknownFloatVector4",
    type: "floatvector4",
    defaultValue: [1, 1, 1, 1]
  },
  { name: "unknownQword2", type: "uint64string", defaultValue: "" },
  { name: "unknownDword6", type: "uint32", defaultValue: 0 },
  { name: "unknownDword7", type: "uint32", defaultValue: 0 },
  { name: "unknownDword8", type: "uint32", defaultValue: 0 },
  { name: "unknownDword9", type: "uint32", defaultValue: 0 },
  { name: "unknownDword10", type: "uint32", defaultValue: 0 }
];

export const groupPackets: PacketStructures = [
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
          fields: inviteDataSchema
        }
      ]
    }
  ],
  [
    "Group.Join",
    0x1302,
    {
      fields: [
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
        { name: "unknownDword2", type: "uint32", defaultValue: 0 },
        { name: "joinState", type: "uint32", defaultValue: 0 },
        { name: "unknownDword3", type: "uint32", defaultValue: 0 },
        {
          name: "inviteData",
          type: "schema",
          defaultValue: {},
          fields: inviteDataSchema
        }
      ]
    }
  ],
  [
    // ** UNFINISHED **
    "Group.AutoGroup",
    0x1303,
    {
      fields: [
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
        { name: "unknownDword2", type: "uint32", defaultValue: 0 },
        { name: "unknownDword3", type: "uint32", defaultValue: 0 },
        { name: "unknownDword4", type: "uint32", defaultValue: 0 }
        // todo: make pack func
      ]
    }
  ],
  [
    "Group.Leave",
    0x1304,
    {
      fields: [
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
        { name: "unknownDword2", type: "uint32", defaultValue: 0 }
      ]
    }
  ],
  [
    "Group.Kick",
    0x1305,
    {
      fields: [
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
        { name: "unknownDword2", type: "uint32", defaultValue: 0 }
      ]
    }
  ],
  [
    "Group.Disband",
    0x1306,
    {
      fields: [
        { name: "executeType", type: "uint32", defaultValue: 0 },
        { name: "errorType", type: "uint32", defaultValue: 0 }
      ]
    }
  ],
  [
    "Group.SetGroupFlags",
    0x1307,
    {
      fields: [
        { name: "executeType", type: "uint32", defaultValue: 0 },
        { name: "errorType", type: "uint32", defaultValue: 0 },
        { name: "flags", type: "uint8", defaultValue: 0 }
      ]
    }
  ],
  [
    "Group.SetGroupOwner",
    0x1308,
    {
      fields: [
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
        { name: "unknownDword2", type: "uint32", defaultValue: 0 },
        { name: "characterId", type: "uint64string", defaultValue: "" },
        { name: "unknownDword3", type: "uint32", defaultValue: 0 }
      ]
    }
  ],
  [
    "Group.SetGroupDescription",
    0x1309,
    {
      fields: [
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
        { name: "unknownDword2", type: "uint32", defaultValue: 0 },
        { name: "description", type: "string", defaultValue: "" }
      ]
    }
  ],
  [
    "Group.UnknownA",
    0x130a,
    {
      fields: [
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
        { name: "unknownDword2", type: "uint32", defaultValue: 0 },
        { name: "unknownQword1", type: "uint64string", defaultValue: "" },
        { name: "unknownBoolean1", type: "boolean", defaultValue: false }
      ]
    }
  ],
  [
    "Group.MapPingRelated",
    0x130b,
    {
      fields: [
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
        { name: "characterId", type: "uint64string", defaultValue: "" },
        { name: "unknownDword2", type: "uint32", defaultValue: 0 }, // X coord?
        { name: "unknownDword3", type: "uint32", defaultValue: 0 } // Y coord?
      ]
    }
  ],
  [
    "Group.UnknownC",
    0x130c,
    {
      fields: [
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
        { name: "characterId", type: "uint64string", defaultValue: "" },
        { name: "unknownBoolean1", type: "boolean", defaultValue: false }
      ]
    }
  ],
  [
    "Group.GetGroup",
    0x130e,
    {
      fields: [
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
        { name: "unknownDword2", type: "uint32", defaultValue: 0 }
      ]
    }
  ],
  [
    "Group.UnknownF",
    0x130f,
    {
      fields: [
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
        { name: "characterId", type: "uint64string", defaultValue: "" },
        { name: "unknownDword2", type: "uint32", defaultValue: 0 }
      ]
    }
  ],
  [
    "Group.JoinLookingForMore",
    0x1310,
    {
      fields: [
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
        { name: "unknownDword2", type: "uint32", defaultValue: 0 }
      ]
    }
  ],
  [
    "Group.ToggleSquadLeaderChat",
    0x1311,
    {
      fields: [
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
        { name: "characterId", type: "uint64string", defaultValue: "" },
        { name: "leaveState", type: "boolean", defaultValue: false }
      ]
    }
  ],
  [
    "Group.Unknown12",
    0x1312,
    {
      fields: [
        // confirmed to be used on Z1BR
        // todo: massive structure
      ]
    }
  ],
  [
    "Group.PlayerJoined",
    0x1313,
    {
      fields: [
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
        { name: "unknownDword2", type: "uint32", defaultValue: 0 },
        {
          name: "joinData",
          type: "schema",
          defaultValue: {},
          fields: joinDataSchema
        }
      ]
    }
  ],
  [
    "Group.Unknown14",
    0x1314,
    {
      fields: [
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
        {
          name: "joinData",
          type: "schema",
          defaultValue: {},
          fields: joinDataSchema
        }
      ]
    }
  ],
  [
    "Group.RemoveGroup",
    0x1316,
    {
      fields: [
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
        { name: "unknownDword2", type: "uint32", defaultValue: 0 },
        { name: "unknownDword3", type: "uint32", defaultValue: 0 }
      ]
    }
  ],
  [
    "Group.RemoveMember",
    0x1317,
    {
      fields: [
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
        { name: "unknownDword2", type: "uint32", defaultValue: 0 },
        { name: "characterId", type: "uint64string", defaultValue: "" }

        // need to write pack func
        // if unknownDword2 == 4
        /*
        { name: "unknownQword1", type: "uint64string", defaultValue: "" },
        { name: "unknownBoolean1", type: "boolean", defaultValue: false },
        */
      ]
    }
  ],
  [
    "Group.RemoveInvitation",
    0x1318,
    {
      fields: [
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
        { name: "unknownDword2", type: "uint32", defaultValue: 0 },
        {
          name: "inviteData",
          type: "schema",
          defaultValue: {},
          fields: inviteDataSchema
        }
      ]
    }
  ],
  [
    "Group.Unknown19",
    0x1319,
    {
      fields: [
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
        { name: "unknownDword2", type: "uint32", defaultValue: 0 }
        // todo: extra dword if dword2 passes some condition
      ]
    }
  ],
  [
    "Group.Unknown1a",
    0x131a,
    {
      fields: [
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
        { name: "unknownDword2", type: "uint32", defaultValue: 0 },
        {
          name: "unknownArray1",
          type: "array",
          defaultValue: [],
          fields: [
            {
              name: "unknownFloatVector",
              type: "floatvector3",
              defaultValue: [0, 0, 0]
            }
          ]
        }
      ]
    }
  ],
  [
    "Group.RaidCreate",
    0x1323,
    {
      fields: [
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
        { name: "unknownDword2", type: "uint32", defaultValue: 0 },
        { name: "unknownDword3", type: "uint32", defaultValue: 0 },
        {
          name: "inviteData",
          type: "schema",
          defaultValue: {},
          fields: inviteDataSchema
        }
      ]
    }
  ]
];
