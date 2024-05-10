// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2024 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

import { PacketStructures } from "types/packetStructure";

export const gamemodePackets: PacketStructures = [
  [
    "GameMode.UpdateToxicGas",
    0xcf0100,
    {
      fields: [
        { name: "position", type: "floatvector4", defaultValue: [0, 0, 0, 0] },
        { name: "radius", type: "uint32", defaultValue: 1000 },
        { name: "unknownDword3", type: "uint32", defaultValue: 10 },
        { name: "unknownDword4", type: "uint32", defaultValue: 0 }
      ]
    }
  ],
  [
    "GameMode.UpdateSafeZone",
    0xcf0200,
    {
      fields: [
        { name: "position", type: "floatvector4", defaultValue: [0, 0, 0, 0] },
        { name: "radius", type: "uint32", defaultValue: 1000 }
      ]
    }
  ]
];
