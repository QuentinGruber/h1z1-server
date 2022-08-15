export type AsyncHooks =
  | "OnServerInit"
  | "OnSendCharacterData"
  | "OnLoadCharacterData";

export type Hooks =
  | AsyncHooks
  | "OnClientFinishedLoading"
  | "OnClientExecuteCommand"
  | "OnServerReady"
  | "OnWorldRoutine"
  | "OnSentCharacterData"
  | "OnLoadedCharacterData";

export type FunctionHookType =
  | boolean 
  | void;

export type AsyncHookType =
  | Promise<void | boolean>;