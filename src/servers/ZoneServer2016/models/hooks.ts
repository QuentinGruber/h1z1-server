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
