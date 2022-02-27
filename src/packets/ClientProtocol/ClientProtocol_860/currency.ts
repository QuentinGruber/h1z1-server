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

export const currencyPackets: any = [
  [
    "Currency.SetCurrencyDiscount",
    0xae01,
    {
      fields: [
        { name: "currencyId", type: "uint32", defaultValue: 0 },
        { name: "discount", type: "float", defaultValue: 0.0 },
      ],
    },
  ],
  ["Currency.SetCurrencyRateTier", 0xae02, {}],
];
