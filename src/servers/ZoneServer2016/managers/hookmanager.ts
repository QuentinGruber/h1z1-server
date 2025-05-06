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

import {
  AsyncHooks,
  AsyncHookType,
  FunctionHookType,
  Hooks
} from "../models/hooks";

export class HookManager {
  private readonly _hooks: {
    [hook: string]: Array<(...args: any) => FunctionHookType>;
  } = {};
  private readonly _asyncHooks: {
    [hook: string]: Array<(...args: any) => AsyncHookType>;
  } = {};
  private enableHooks;
  constructor(enableHooks = true) {
    this.enableHooks = enableHooks;
  }

  /**
   * Registers a new hook to be called when the corresponding checkHook() call is executed.
   * @param hookName The name of the hook
   * @param hook The function to be called when the hook is executed.
   */
  hook(hookName: Hooks, hook: (...args: any) => FunctionHookType) {
    if (!this._hooks[hookName]) this._hooks[hookName] = [];
    this._hooks[hookName].push(hook);
    return;
  }

  /**
   * Registers a new hook to be called when the corresponding checkAsyncHook() call is executed.
   * @param hookName The name of the async hook.
   * @param hook The function to be called when the hook is executed.
   */
  hookAsync(hookName: AsyncHooks, hook: (...args: any) => AsyncHookType) {
    if (!this._asyncHooks[hookName]) this._asyncHooks[hookName] = [];
    this._asyncHooks[hookName].push(hook);
    return;
  }

  /**
   * Calls all hooks currently registered and either halts or continues the
   * function based on the return behavior of each hook.
   * @param hookName The name of the async hook
   * @param hook The function to be called when the hook is executed.
   * @returns Returns the value of the first hook to return a boolean, or true.
   */
  checkHook(hookName: Hooks, ...args: any): boolean {
    if (this._hooks[hookName]?.length > 0) {
      for (const hook of this._hooks[hookName]) {
        switch (hook.apply(this, args)) {
          case true:
            return true;
          case false:
            return false;
        }
      }
    }
    return true;
  }

  /**
   * Calls all async hooks currently registered and either halts or continues the
   * function based on the return behavior of each hook.
   * @param hookName The name of the async hook.
   * @param hook The function to be called when the hook is executed.
   * @returns Returns the value of the first hook to return a boolean, or true.
   */
  async checkAsyncHook(hookName: Hooks, ...args: any): Promise<boolean> {
    if (this._asyncHooks[hookName]?.length > 0) {
      for (const hook of this._asyncHooks[hookName]) {
        switch (await hook.apply(this, args)) {
          case true:
            return Promise.resolve(true);
          case false:
            return Promise.resolve(false);
        }
      }
    }
    return Promise.resolve(true);
  }
}
