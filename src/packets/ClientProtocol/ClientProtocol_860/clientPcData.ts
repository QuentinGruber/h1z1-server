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
