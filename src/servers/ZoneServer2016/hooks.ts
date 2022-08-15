export type AsyncHooks =
  | "OnServerInit"
  | "OnSendCharacterData"
  | "OnLoadCharacterData"
  | "OnPlayerRespawn";

export type Hooks =
  | AsyncHooks
  | "OnClientFinishedLoading"
  | "OnClientExecuteCommand"
  | "OnServerReady"
  | "OnWorldRoutine"
  | "OnSentCharacterData"
  | "OnLoadedCharacterData"
  | "OnPlayerRespawned";

export type FunctionHookType =
  | boolean 
  | void;

export type AsyncHookType =
  | Promise<void | boolean>;