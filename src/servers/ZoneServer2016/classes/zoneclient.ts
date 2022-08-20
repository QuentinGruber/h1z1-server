// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2022 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

import { Character2016 } from "./character";

export class ZoneClient2016 {
  guid?: string;
  character: Character2016;
  currentPOI?: number;
  firstLoading: boolean = false;
  isLoading: boolean = true;
  isInteracting: boolean = false;
  isAdmin: boolean = false;
  posAtLastRoutine: Float32Array = new Float32Array();
  posAtLogoutStart: Float32Array = new Float32Array();
  hudTimer?: NodeJS.Timeout | null;
  spawnedDTOs: any[] = [];
  spawnedEntities: any[] = [];
  managedObjects: string[] = [];
  vehicle: {
    mountedVehicle?: string;
  } = {};
  npcsToSpawnTimer!: NodeJS.Timeout;
  loginSessionId: string;
  pingTimer: NodeJS.Timeout | undefined;
  savePositionTimer: any;
  clearHudTimer: () => void;
  clearTimers: () => void;
  sessionId: number;
  soeClientId: string;
  lastKeepAliveTime: number = 0;
  pings: number[] = [];
  avgPing: number = 0;
  constructor(
    sessionId: number,
    soeClientId: string,
    loginSessionId: string,
    characterId: string,
    transientId: number
  ) {
    this.sessionId = sessionId;
    this.soeClientId = soeClientId;

    this.isLoading = true;
    this.firstLoading = true;
    this.loginSessionId = loginSessionId;
    this.spawnedEntities = [];
    this.managedObjects = [];
    this.clearTimers = () => {
      clearTimeout(this.npcsToSpawnTimer);
    };
    this.clearHudTimer = () => {
      if (this.hudTimer) {
        clearTimeout(this.hudTimer);
      }
      this.hudTimer = null;
      this.isInteracting = false;
    };
    this.character = new Character2016(characterId, transientId);
  }
}
