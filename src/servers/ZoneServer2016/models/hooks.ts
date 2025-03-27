// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2025 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

export type AsyncHooks =
  | "OnServerInit"
  | "OnSendCharacterData"
  | "OnLoadCharacterData"
  | "OnPlayerRespawn";

export type Hooks =
  | AsyncHooks
  | "OnClientFinishedLoading"
  | "OnClientExecuteCommand"
  | "OnClientExecuteInternalCommand"
  | "OnServerReady"
  | "OnWorldRoutine"
  | "OnSentCharacterData"
  | "OnLoadedCharacterData"
  | "OnPlayerRespawned"
  | "OnPlayerDeath"
  | "OnPlayerDied";

export type FunctionHookType = boolean | void;

export type AsyncHookType = Promise<void | boolean>;
