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

export const clientPcDataPackets: any = [
  ["ClientPcData.SetSpeechPack", 0xa501, {}],
  [
    "ClientPcData.SpeechPackList",
    0xa503,
    {
      fields: [
        {
          name: "speechPacks",
          type: "array",
          defaultValue: [],
          fields: [{ name: "speechPackId", type: "uint32", defaultValue: 0 }],
        },
      ],
    },
  ],
];
