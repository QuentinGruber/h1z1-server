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

import { PacketStructures } from "types/packetStructure";
import { rewardBundleSchema } from "./shared";

export const lootPackets: PacketStructures = [
  [
    "Loot",
    0x6a01,
    {
      fields: [
        { name: "unknownQword1", type: "uint32", defaultValue: 0 },
        { name: "unknownArray1", type: "array", fields: rewardBundleSchema }
      ]
    }
  ]
];
