export type AsyncHooks =
  | "OnServerInit"
  | "OnSendCharacterData";

export type Hooks =
  | AsyncHooks
  | "OnClientFinishedLoading"
  | "OnClientExecuteCommand"
  | "OnServerReady"
  | "OnWorldRoutine"
  | "OnSentCharacterData";

export type FunctionHookType =
  | boolean 
  | void;

export type AsyncHookType =
  | Promise<void | boolean>;