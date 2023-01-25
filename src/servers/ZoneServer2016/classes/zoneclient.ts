// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2023 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

import { toInt, _ } from "../../../utils/utils";
import { Character2016 } from "../entities/character";
import { ZoneClient2016 as Client } from "./zoneclient";
import { LootableProp } from "../entities/lootableprop";
import { ZoneServer2016 } from "../zoneserver";

export class ZoneClient2016 {
  guid?: string;
  character: Character2016;
  currentPOI?: number;
  firstLoading: boolean = false;
  isLoading: boolean = true;
  characterReleased: boolean = false;
  isInteracting: boolean = false;
  isAdmin: boolean = false;
  isDebugMode: boolean = false;
  banType: string = "";
  HWID: string = "";
  posAtLastRoutine: Float32Array = new Float32Array();
  posAtLogoutStart: Float32Array = new Float32Array();
  oldPos: { position: Float32Array; time: number } = {
    position: new Float32Array(),
    time: 0,
  };
  speedWarnsNumber: number = 0;
  allowedProjectiles: number = 0;
  pvpStats: {
    shotsFired: number;
    shotsHit: number;
    head: number;
    spine: number;
    hands: number;
    legs: number;
  } = { shotsFired: 0, shotsHit: 0, head: 0, spine: 0, legs: 0, hands: 0 };
  clientLogs: { log: string; isSuspicious: boolean }[] = [];
  reports: number = 0;
  lastDeathReport?: {
    position: Float32Array;
    attackerPosition: Float32Array;
    distance: number;
    attacker: Client;
  };
  hudTimer?: NodeJS.Timeout | null;
  spawnedDTOs: any[] = [];
  spawnedEntities: any[] = [];
  searchedProps: LootableProp[] = [];
  managedObjects: string[] = [];
  vehicle: {
    mountedVehicle?: string;
  } = {};
  radio: boolean = false;
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
  avgPingLen: number = 4;
  pingWarnings: number = 0;
  isWeaponLock: boolean = false;
  avgPingReady: boolean = false;
  chunkRenderDistance: number = 400;
  routineInterval?: NodeJS.Timeout;
  routineCounter: number = 0;
  constructor(
    sessionId: number,
    soeClientId: string,
    loginSessionId: string,
    characterId: string,
    transientId: number,
    server: ZoneServer2016
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

    this.character = new Character2016(characterId, transientId, server);
  }
  addPing(ping: number) {
    if (ping > 0) {
      this.pings.push(ping);
    }
    if (this.pings.length > this.avgPingLen) {
      this.pings.shift();
    }
    if (this.pings.length === this.avgPingLen) {
      this.updateAvgPing();
    } else {
      this.avgPingReady = false;
    }
  }
  updateAvgPing() {
    this.avgPing = toInt(_.sum(this.pings) / this.pings.length);
    this.avgPingReady = true;
  }
}
