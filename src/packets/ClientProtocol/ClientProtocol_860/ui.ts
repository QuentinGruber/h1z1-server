// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2022 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

export const uiPackets: any = [
  [
    "Ui.TaskAdd",
    0x1a01,
    {
      fields: [
        { name: "Unknown1", type: "boolean", defaultValue: 0 },
        { name: "Unknown2", type: "boolean", defaultValue: 0 },
        { name: "Unknown3", type: "boolean", defaultValue: 0 },

        { name: "Unknown4", type: "uint32", defaultValue: 0 },
        { name: "Unknown5", type: "uint32", defaultValue: 0 },
        { name: "Unknown6", type: "boolean", defaultValue: 0 },
        { name: "Unknown7", type: "boolean", defaultValue: 0 },
        { name: "Unknown8", type: "uint32", defaultValue: 0 },
        { name: "Unknown9", type: "boolean", defaultValue: 0 },
        { name: "Unknown10", type: "uint32", defaultValue: 0 },
        { name: "Unknown11", type: "uint32", defaultValue: 0 },
      ],
    },
  ],
  ["Ui.TaskUpdate", 0x1a02, {}],
  ["Ui.TaskComplete", 0x1a03, {}],
  ["Ui.TaskFail", 0x1a04, {}],
  ["Ui.Unknown", 0x1a05, {}],
  ["Ui.ExecuteScript", 0x1a07, {}],
  [
    "Ui.StartTimer",
    0x1a09,
    { fields: [{ name: "time", type: "uint32", defaultValue: 0 }] },
  ],
  ["Ui.ResetTimer", 0x1a0a, { fields: [] }],
  ["Ui.ObjectiveTargetUpdate", 0x1a0d, {}],
  [
    "Ui.Message",
    0x1a0e,
    { fields: [{ name: "stringId", type: "uint32", defaultValue: 0 }] },
  ],
  ["Ui.CinematicStartLookAt", 0x1a0f, {}],
  [
    "Ui.WeaponHitFeedback",
    0x1a10,
    {
      fields: [
        { name: "Unknown1", type: "uint32", defaultValue: 0 },
        { name: "isEnemy", type: "boolean", defaultValue: 0 },
        { name: "Unknown2", type: "uint32", defaultValue: 0 },
      ],
    },
  ],
  [
    "Ui.HeadShotFeedback",
    0x1a11,
    {
      fields: [
        { name: "Unknown3", type: "boolean", defaultValue: 0 },
        { name: "Unknown4", type: "boolean", defaultValue: 0 },
      ],
    },
  ],
  ["Ui.WaypointCooldown", 0x1a14, {}],
  ["Ui.ZoneWaypoint", 0x1a15, {}],
  ["Ui.WaypointNotify", 0x1a16, {}],
  ["Ui.ContinentDominationNotification", 0x1a17, {}],
  ["Ui.InteractStart", 0x1a18, {}],
  ["Ui.SomeInteractionThing", 0x1a19, {}],
  ["Ui.RewardNotification", 0x1a1a, {}],
  ["Ui.WarpgateRotateWarning", 0x1a1b, {}],
  ["Ui.SystemBroadcast", 0x1a1c, {}],
];
