export const zoneSettingPackets: any = [
  [
    "ZoneSetting.Data",
    0xb601,
    {
      fields: [
        {
          name: "settings",
          type: "array",
          defaultValue: [],
          fields: [
            { name: "hash", type: "uint32", defaultValue: 0 },
            { name: "unknown1", type: "uint32", defaultValue: 0 },
            { name: "unknown2", type: "uint32", defaultValue: 0 },
            { name: "value", type: "uint32", defaultValue: 0 },
            { name: "settingType", type: "uint32", defaultValue: 0 },
          ],
        },
      ],
    },
  ],
];
