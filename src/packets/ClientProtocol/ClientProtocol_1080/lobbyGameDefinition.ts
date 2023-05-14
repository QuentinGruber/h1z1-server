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

export const lobbyGameDefinitionPackets: PacketStructures = [
  [
    "LobbyGameDefinition.DefinitionsRequest",
    0x420100,
    {
      fields: []
    }
  ],
  [
    "LobbyGameDefinition.DefinitionsResponse",
    0x420200,
    {
      fields: [
        {
          name: "definitionsData",
          type: "byteswithlength",
          fields: [{ name: "data", type: "string", defaultValue: "" }]
        }
      ]
    }
  ]
];
