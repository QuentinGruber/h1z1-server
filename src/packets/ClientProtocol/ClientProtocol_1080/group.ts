// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2025 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

import DataSchema from "h1z1-dataschema";
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
    name: "jobData",
    type: "schema",
    defaultValue: {},
    fields: [
      { name: "id", type: "uint32", defaultValue: 0 },
      { name: "unknownDword2", type: "uint32", defaultValue: 0 },
      { name: "iconId", type: "uint32", defaultValue: 0 },
      { name: "backgroundIconId", type: "uint32", defaultValue: 0 },
      { name: "rank", type: "uint32", defaultValue: 0 }
    ]
  },
  { name: "unknownDword1", type: "uint32", defaultValue: 0 },
  { name: "unknownByte1", type: "int8", defaultValue: 0 },
  { name: "unknownDword2", type: "uint32", defaultValue: 0 },
  { name: "unknownDword3", type: "uint32", defaultValue: 0 },
  { name: "unknownDword4", type: "uint32", defaultValue: 0 },
  { name: "unknownQword1", type: "uint64string", defaultValue: "" },
  { name: "zoneId", type: "uint32", defaultValue: 0 },
  {
    name: "position",
    type: "floatvector3",
    defaultValue: [0, 0, 0]
  },
  {
    name: "rotation",
    type: "floatvector4",
    defaultValue: [1, 1, 1, 1]
  },
  { name: "unknownQword2", type: "uint64string", defaultValue: "" },
  { name: "unknownDword6", type: "uint32", defaultValue: 0 },
  { name: "memberId", type: "uint32", defaultValue: 0 },
  { name: "playerDistance", type: "uint32", defaultValue: 0 },
  { name: "helmetDurability", type: "uint32", defaultValue: 0 },
  { name: "armorDurability", type: "uint32", defaultValue: 0 }
];

export function packRemoveMember(obj: any) {
  const unknownData1Schema = [
    { name: "unknownDword1", type: "uint32", defaultValue: 0 },
    { name: "unknownDword2", type: "uint32", defaultValue: 0 },
    { name: "characterId", type: "uint64string", defaultValue: "" }
  ];

  const unknownData2Schema = [
    { name: "unknownQword1", type: "uint64string", defaultValue: "" },
    { name: "unknownBoolean1", type: "boolean", defaultValue: false }
  ];

  if (obj.unknownDword2 == 4) {
    return DataSchema.pack([...unknownData1Schema, ...unknownData2Schema], obj)
      .data;
  }
  return DataSchema.pack(unknownData1Schema, obj).data;
}

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
    "Group.AutoGroup",
    0x1303,
    {
      fields: [
        { name: "unknownDword1", type: "uint32", defaultValue: 3 },
        { name: "unknownDword2", type: "uint32", defaultValue: 0 },
        { name: "unknownDword3", type: "uint32", defaultValue: 0 },
        { name: "unknownDword4", type: "uint32", defaultValue: 1 },
        {
          name: "unknownArray1",
          type: "array",
          fields: [
            { name: "unknownQword1", type: "uint64string", defaultValue: "0" }
          ]
        },
        {
          name: "unknownArray2",
          type: "array",
          fields: [
            { name: "unknownQword1", type: "uint64string", defaultValue: "0" }
          ]
        }
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
        { name: "unknownDword2", type: "uint32", defaultValue: 0 },
        { name: "unknownDword3", type: "uint32", defaultValue: 0 },
        { name: "unknownDword4", type: "uint32", defaultValue: 0 },
        { name: "characterId", type: "uint64string", defaultValue: 0 },
        { name: "unknownByte1", type: "uint8", defaultValue: 0 }
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
        { name: "unknownDword1", type: "uint32", defaultValue: 2 },
        { name: "unknownDword2", type: "uint32", defaultValue: 0 },
        { name: "characterId", type: "uint64string", defaultValue: "" },
        { name: "groupId", type: "uint32", defaultValue: 0 }
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
        { name: "unknownDword1", type: "uint32", defaultValue: 2 },
        {
          name: "unknownData1",
          type: "schema",
          fields: [
            { name: "groupId", type: "uint32", defaultValue: 0 },
            { name: "characterId", type: "uint64string", defaultValue: "" },
            { name: "unknownByte1", type: "uint8", defaultValue: 0 }
          ]
        },
        { name: "unknownByte1", type: "uint8", defaultValue: 0 },
        { name: "unknownString1", type: "string", defaultValue: "" },
        { name: "unknownDword2", type: "uint32", defaultValue: 0 },
        {
          name: "members",
          type: "array",
          fields: [
            { name: "characterId", type: "uint64string", defaultValue: "" },
            ...joinDataSchema
          ]
        },
        { name: "unknownDword3", type: "uint32", defaultValue: 0 }
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
        { name: "groupId", type: "uint32", defaultValue: 0 }
      ]
    }
  ],
  [
    "Group.RemoveMember",
    0x1317,
    {
      fields: [{ name: "data", type: "custom", packer: packRemoveMember }]
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
        {
          name: "unknownArray1",
          type: "array",
          defaultValue: [],
          fields: [
            {
              name: "unknownString1",
              type: "string",
              defaultValue: ""
            },
            { name: "unknownDword1", type: "uint32", defaultValue: 0 },
            { name: "unknownShort1", type: "uint16", defaultValue: 0 },
            { name: "unknownShort2", type: "uint16", defaultValue: 0 },
            { name: "unknownByte1", type: "uint8", defaultValue: 0 },
            { name: "unknownBoolean1", type: "boolean", defaultValue: false },
            { name: "unknownDword2", type: "uint32", defaultValue: 0 },
            {
              name: "unknownString2",
              type: "string",
              defaultValue: ""
            },
            {
              name: "unknownString3",
              type: "string",
              defaultValue: ""
            },
            { name: "unknownDword3", type: "uint32", defaultValue: 0 }
          ]
        }
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
