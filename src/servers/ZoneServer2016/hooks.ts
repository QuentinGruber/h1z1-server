export type AsyncHooks =
| "OnClientFinishedLoading"
| "OnClientExecuteCommand"
| "OnServerInit"
| "OnServerReady";

export type Hooks =
  | AsyncHooks
  | "OnClientFinishedLoading"
  | "OnClientExecuteCommand"
  | "OnServerReady";

export type FunctionHookType =
  | boolean 
  | void;

export type AsyncHookType =
  | Promise<void | boolean>;