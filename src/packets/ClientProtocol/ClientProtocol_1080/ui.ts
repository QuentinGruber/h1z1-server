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

export const uiPackets: PacketStructures = [
  ["Ui.TaskAdd", 0x1a01, {}],
  ["Ui.TaskUpdate", 0x1a02, {}],
  ["Ui.TaskComplete", 0x1a03, {}],
  ["Ui.TaskFail", 0x1a04, {}],
  ["Ui.Unknown", 0x1a05, {}],
  [
    "Ui.ExecuteScript",
    0x1a07,
    {
      fields: [
        { name: "unknownString1", type: "string", defaultValue: "" },
        {
          name: "unknownArray1",
          type: "array",
          defaultValue: [],
          fields: [{ name: "unknownDword1", type: "uint32", defaultValue: 0 }]
        }
      ]
    }
  ],
  ["Ui.StartTimer", 0x1a09, {}],
  ["Ui.ResetTimer", 0x1a0a, {}],
  ["Ui.ObjectiveTargetUpdate", 0x1a0d, {}],
  ["Ui.Message", 0x1a0e, {}],
  ["Ui.CinematicStartLookAt", 0x1a0f, {}],
  [
    "Ui.WeaponHitFeedback",
    0x1a10,
    {
      fields: [
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
        { name: "unknownByte1", type: "uint8", defaultValue: 0 },
        { name: "unknownDword2", type: "uint32", defaultValue: 0 }
      ]
    }
  ],
  ["Ui.HeadShotFeedback", 0x1a11, {}],
  ["Ui.WaypointCooldown", 0x1a14, {}],
  ["Ui.ZoneWaypoint", 0x1a15, {}],
  ["Ui.WaypointNotify", 0x1a16, {}],
  ["Ui.ContinentDominationNotification", 0x1a17, {}],
  ["Ui.InteractStart", 0x1a18, {}],
  ["Ui.SomeInteractionThing", 0x1a19, {}],
  ["Ui.RewardNotification", 0x1a1a, {}],
  ["Ui.WarpgateRotateWarning", 0x1a1b, {}],
  [
    "Ui.ConfirmHit",
    0x1a1c,
    {
      fields: [
        {
          name: "hitType",
          type: "bitflags",
          defaultValue: [],
          flags: [
            { bit: 0, name: "isAlly", defaultValue: 0 },
            { bit: 1, name: "isHeadshot", defaultValue: 0 },
            { bit: 2, name: "damagedArmor", defaultValue: 0 },
            { bit: 3, name: "crackedArmor", defaultValue: 0 },
            { bit: 4, name: "bit4", defaultValue: 0 },
            { bit: 5, name: "bit5", defaultValue: 0 },
            { bit: 6, name: "bit6", defaultValue: 0 },
            { bit: 7, name: "bit7", defaultValue: 0 }
          ]
        }
      ]
    }
  ]
];
