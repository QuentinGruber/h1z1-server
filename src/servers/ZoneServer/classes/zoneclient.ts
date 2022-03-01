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


import { Character } from "./character";

export class ZoneClient {
  currentPOI?: number;
  firstLoading: boolean = false;
  isLoading: boolean = true;
  isInteracting: boolean = false;
  isAdmin: boolean = false;
  posAtLastRoutine: Float32Array = new Float32Array();
  posAtLogoutStart: Float32Array = new Float32Array();
  hudTimer!: any;
  spawnedDTOs: any[] = [];
  spawnedEntities: any[] = [];
  managedObjects: string[] = [];
  vehicle: {
    falling: number;
    mountedVehicle?: string;
    mountedVehicleType?: string;
    mountedVehicleSeat?: number;
    vehicleState: number;
    vehicleSeat: number;
  };
  npcsToSpawn: any[] = [];
  npcsToSpawnTimer!: NodeJS.Timeout;
  character: Character;
  loginSessionId: string;
  pingTimer: NodeJS.Timeout | undefined;
  savePositionTimer: any;
  clearHudTimer: () => void;
  clearTimers: () => void;
  sessionId: number;
  soeClientId: string;

  constructor(
    sessionId: number,
    soeClientId: string,
    loginSessionId: string,
    characterId: string,
    generatedTransient: number
  ) {
    this.sessionId = sessionId;
    this.soeClientId = soeClientId;

    this.isLoading = true;
    this.firstLoading = true;
    this.loginSessionId = loginSessionId;
    this.vehicle = {
      vehicleState: 0,
      falling: -1,
      vehicleSeat: 0,
    };
    this.character = new Character(characterId, generatedTransient);
    this.spawnedEntities = [];
    this.managedObjects = [];
    this.clearTimers = () => {
      clearTimeout(this.npcsToSpawnTimer);
    };
    this.clearHudTimer = () => {
      clearTimeout(this.hudTimer);
      this.hudTimer = null;
      this.isInteracting = false;
    };
  }
}
