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
import { identitySchema } from "./shared";

export const mountPackets: PacketStructures = [
  ["Mount.MountRequest", 0x7101, {}],
  [
    "Mount.MountResponse",
    0x7102,
    {
      fields: [
        { name: "characterId", type: "uint64string", defaultValue: "0" },
        { name: "vehicleGuid", type: "uint64string", defaultValue: "0" },
        { name: "seatId", type: "uint32", defaultValue: 0 }, // seat 0-3
        { name: "unknownDword2", type: "uint32", defaultValue: 1 }, // must be 1 or we dont get into vehicle?
        { name: "isDriver", type: "uint32", defaultValue: 0 }, // is driver? (you can be on seat 3 and still have control)
        { name: "debugStuff", type: "uint32", defaultValue: 0 }, // colored lines on screen
        { name: "identity", type: "schema", fields: identitySchema },
        { name: "tagString", type: "string", defaultValue: "" }
      ]
    }
  ],
  [
    "Mount.DismountRequest",
    0x7103,
    {
      fields: [{ name: "unknownByte1", type: "uint8", defaultValue: 0 }]
    }
  ],
  [
    "Mount.DismountResponse",
    0x7104,
    {
      fields: [
        { name: "characterId", type: "uint64string", defaultValue: "0" },
        { name: "vehicleGuid", type: "uint64string", defaultValue: "0" },
        { name: "debugStuff", type: "uint32", defaultValue: 0 },
        { name: "removePlayerControl", type: "boolean", defaultValue: false },
        { name: "unknownByte1", type: "uint8", defaultValue: 0 }
      ]
    }
  ],
  ["Mount.List", 0x7105, {}],
  ["Mount.Spawn", 0x7106, {}],
  ["Mount.Despawn", 0x7107, {}],
  ["Mount.SpawnByItemDefinitionId", 0x7108, {}],
  ["Mount.OfferUpsell", 0x7109, {}],
  [
    "Mount.SeatChangeRequest",
    0x710a,
    {
      fields: [
        { name: "seatId", type: "uint32", defaultValue: 0 },
        { name: "unknownByte1", type: "uint8", defaultValue: 0 }
      ]
    }
  ],
  [
    "Mount.SeatChangeResponse",
    0x710b,
    {
      fields: [
        { name: "characterId", type: "uint64string", defaultValue: "0" },
        { name: "vehicleGuid", type: "uint64string", defaultValue: "0" },
        { name: "identity", type: "schema", fields: identitySchema },
        { name: "seatId", type: "uint32", defaultValue: 0 },
        { name: "unknownDword1", type: "uint32", defaultValue: 1 }, // needs to be 1
        { name: "unknownDword2", type: "uint32", defaultValue: 1 } // needs to be 1
      ]
    }
  ],
  ["Mount.SeatSwapRequest", 0x710c, {}],
  ["Mount.SeatSwapResponse", 0x710d, {}],
  ["Mount.TypeCount", 0x710e, {}]
];
