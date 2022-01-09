export const lobbyGameDefinitionPackets: any = [
  [
    "LobbyGameDefinition.DefinitionsRequest",
    0x420100,
    {
      fields: [],
    },
  ],
  [
    "LobbyGameDefinition.DefinitionsResponse",
    0x420200,
    {
      fields: [
        {
          name: "definitionsData",
          type: "byteswithlength",
          fields: [{ name: "data", type: "string", defaultValue: "" }],
        },
      ],
    },
  ],
];
