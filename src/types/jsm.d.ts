// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2026 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

declare module 'javascript-state-machine' {
  interface Config {
    init: string;
    data?(): Record<string, unknown>;
    transitions: Array<{ name: string; from: string | string[]; to: string }>;
    methods?: Record<string, (...args: any[]) => any>; // ← any, not unknown
  }

  class StateMachine {
    state: string;
    constructor(config: Config);
    goto(state: string): void;
    is(state: string): boolean;
    can(transition: string): boolean;
  }

  export = StateMachine;
}
