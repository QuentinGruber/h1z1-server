import SOEClient from "../SoeServer/soeclient";
import { RemoteInfo } from "dgram";
import { characterEquipment } from "types/zoneserver";

export default class ZoneClient extends SOEClient {
  
    currentPOI?: number;
    firstLoading: boolean = false;
    isLoading: boolean = false;
    isInteracting: boolean = false;
    posAtLastRoutine: Float32Array = new Float32Array();
    posAtLogoutStart: Float32Array = new Float32Array();
    timer: any;
    spawnedEntities: any[] = [];
    managedObjects: any[] = [];
    vehicle?: {
      falling: number;
      mountedVehicle?: string;
      mountedVehicleType?: string;
      vehicleState: number;
    };
    character?: {
      characterId: string;
      transientId: number;
      name?: string;
      loadouts?: any;
      extraModel?: string;
      isRunning: boolean;
      resourcesUpdater?: any;
      equipment: characterEquipment[];
      resources: {
        health: number;
        stamina: number;
        virus: number;
        food: number;
        water: number;
      };
      currentLoadoutTab?: number;
      currentLoadoutId?: number;
      currentLoadout?: number;
      guid?: string;
      inventory?: Array<any>;
      factionId?: number;
      spawnLocation?: string;
      state: {
        position: Float32Array;
        rotation: Float32Array;
        lookAt: Float32Array;
        health: number;
        shield: number;
      };
    };
    loginSessionId?: string;
    lastPingTime: number;
    pingTimer: NodeJS.Timeout;
  constructor(
    initialClient: SOEClient,
  ) {
    super(
        {address:initialClient.address,port:initialClient.port} as RemoteInfo,
        initialClient.crcSeed,
        initialClient.compression,
        initialClient.cryptoKey
        );
    this.inputStream = initialClient.inputStream;
    this.outputStream = initialClient.outputStream;
    // @ts-ignore
    this = {...this,...initialClient}

  }
}
