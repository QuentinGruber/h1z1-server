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
import { ZoneClient2016 as Client } from "./zoneclient";

export class ZoneClient2016 {
  guid?: string;
  character: Character2016;
  currentPOI?: number;
  firstLoading: boolean = false;
  isLoading: boolean = true;
  isInteracting: boolean = false;
  isAdmin: boolean = false;
  banType: string = "";
  HWID: string = "";
  posAtLastRoutine: Float32Array = new Float32Array();
  posAtLogoutStart: Float32Array = new Float32Array();
  oldPos: { position: Float32Array, time: number} = { position: new Float32Array(), time: 0};
  speedWarnsNumber: number = 0;
  pvpStats: { shotsFired: number, shotsHit: number, head: number, spine: number, hands: number, legs: number } = { shotsFired: 0, shotsHit: 0, head: 0, spine: 0, legs: 0, hands: 0};
  clientLogs: {log: string, isSuspicious: boolean}[] = [];
  reports: number = 0;
  lastDeathReport?: { position: Float32Array, attackerPosition: Float32Array, distance: number, attacker: Client };
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
