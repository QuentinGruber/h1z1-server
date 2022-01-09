export const acquaintancePackets: any = [
  [
    "Acquaintance.Add",
    0x2b01,
    {
      fields: [
        { name: "characterId", type: "uint64string", defaultValue: "0x000" },
        { name: "characterName", type: "string", defaultValue: "0" },
        { name: "type", type: "uint32", defaultValue: 0 },
        { name: "elapsedTime", type: "uint64string", defaultValue: "0x000" },
        { name: "isOnline", type: "uint8", defaultValue: 0 },
      ],
    },
  ],
  [
    "Acquaintance.Remove",
    0x2b02,
    {
      fields: [],
    },
  ],
  [
    "Acquaintance.Online",
    0x2b03,
    {
      fields: [
        { name: "characterId", type: "uint64string", defaultValue: "0x000" },
        { name: "isOnline", type: "boolean", defaultValue: 0 },
      ],
    },
  ],
];
