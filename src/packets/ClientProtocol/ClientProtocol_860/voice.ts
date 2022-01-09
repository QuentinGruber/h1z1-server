export const voicePackets: any = [
  [
    "Voice.Login",
    0x8100,
    {
      fields: [
        { name: "clientName", type: "string", defaultValue: "" },
        { name: "sessionId", type: "string", defaultValue: "" },
        { name: "url", type: "string", defaultValue: "" },
        { name: "characterName", type: "string", defaultValue: "" },
      ],
    },
  ],
  [
    "Voice.JoinChannel",
    0x8101,
    {
      fields: [
        { name: "roomType", type: "uint8", defaultValue: 0 },
        { name: "uri", type: "string", defaultValue: "" },
        { name: "unknown1", type: "string", defaultValue: "" },
      ],
    },
  ],
  ["Voice.LeaveChannel", 0x8102, {}],
];
