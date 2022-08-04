export type AsyncHooks =
| "OnServerInit";

export type Hooks =
  | AsyncHooks
  | "OnClientFinishedLoading"
  | "OnClientExecuteCommand"
  | "OnServerReady"
  | "OnWorldRoutine";

export type FunctionHookType =
  | boolean 
  | void;

export type AsyncHookType =
  | Promise<void | boolean>;