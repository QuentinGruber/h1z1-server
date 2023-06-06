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

export const currencyPackets: PacketStructures = [
  [
    "Currency.SetCurrencyDiscount",
    0xae01,
    {
      fields: [
        { name: "currencyId", type: "uint32", defaultValue: 0 },
        { name: "discount", type: "float", defaultValue: 0.0 }
      ]
    }
  ],
  ["Currency.SetCurrencyRateTier", 0xae02, {}]
];
