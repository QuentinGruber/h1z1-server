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

export const lobbyPackets: PacketStructures = [
  ["Lobby.JoinLobbyGame", 0x4101, {}],
  ["Lobby.LeaveLobbyGame", 0x4102, {}],
  ["Lobby.StartLobbyGame", 0x4103, {}],
  ["Lobby.UpdateLobbyGame", 0x4104, {}],
  ["Lobby.SendLobbyToClient", 0x4106, {}],
  ["Lobby.SendLeaveLobbyToClient", 0x4107, {}],
  ["Lobby.RemoveLobbyGame", 0x4108, {}],
  ["Lobby.LobbyErrorMessage", 0x410b, {}],
  ["Lobby.ShowLobbyUi", 0x410c, {}]
];
