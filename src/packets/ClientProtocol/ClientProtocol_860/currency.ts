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
