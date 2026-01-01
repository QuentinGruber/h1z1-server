// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2026 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

import { PacketStructures } from "types/packetStructure";
import { lobbyDataSchema } from "./shared";

export const lobbyPackets: PacketStructures = [
  [
    "Lobby.JoinLobbyGame",
    0x4101,
    {
      fields: [{ name: "unknownDword1", type: "uint32", defaultValue: 0 }]
    }
  ],
  [
    "Lobby.LeaveLobbyGame",
    0x4102,
    {
      fields: [
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
        { name: "unknownDword2", type: "uint32", defaultValue: 0 }
      ]
    }
  ],
  [
    "Lobby.StartLobbyGame",
    0x4103,
    {
      fields: [
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
        { name: "unknownDword2", type: "uint32", defaultValue: 0 }
      ]
    }
  ],
  [
    "Lobby.UpdateLobbyGame",
    0x4104,
    {
      fields: [
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
        { name: "unknownDword2", type: "uint32", defaultValue: 0 },
        {
          name: "lobbyData",
          type: "schema",
          defaultValue: {},
          fields: lobbyDataSchema
        }
      ]
    }
  ],
  [
    "Lobby.SendLobbyToClient",
    0x4106,
    {
      fields: [
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
        {
          name: "lobbyData",
          type: "array",
          defaultValue: [],
          fields: [
            { name: "unknownDword1", type: "uint32", defaultValue: 0 },
            {
              name: "data",
              type: "schema",
              defaultValue: {},
              fields: lobbyDataSchema
            }
          ]
        }
      ]
    }
  ],
  ["Lobby.SendLeaveLobbyToClient", 0x4107, {}],
  ["Lobby.RemoveLobbyGame", 0x4108, {}],
  [
    "Lobby.LobbyErrorMessage",
    0x410b,
    {
      fields: [{ name: "unknownDword1", type: "uint32", defaultValue: 0 }]
    }
  ],
  [
    "Lobby.ShowLobbyUi",
    0x410c,
    {
      fields: [
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
        { name: "unknownDword2", type: "uint32", defaultValue: 0 }
      ]
    }
  ]
];
