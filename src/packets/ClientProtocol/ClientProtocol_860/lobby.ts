export const lobbyPackets: any = [
  ["Lobby.JoinLobbyGame", 0x4101, {}],
  ["Lobby.LeaveLobbyGame", 0x4102, {}],
  ["Lobby.StartLobbyGame", 0x4103, {}],
  ["Lobby.UpdateLobbyGame", 0x4104, {}],
  ["Lobby.SendLobbyToClient", 0x4106, {}],
  ["Lobby.SendLeaveLobbyToClient", 0x4107, {}],
  ["Lobby.RemoveLobbyGame", 0x4108, {}],
  ["Lobby.LobbyErrorMessage", 0x410b, {}],
  ["Lobby.ShowLobbyUi", 0x410c, {}],
];
