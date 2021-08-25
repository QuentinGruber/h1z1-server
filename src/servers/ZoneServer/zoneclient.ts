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
    vehicle: {
      falling: number;
      mountedVehicle?: string;
      mountedVehicleType?: string;
      vehicleState: number;
    };
    character: {
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
    lastPingTime: number = 0;
    pingTimer: any;
    savePositionTimer: any;
  constructor(
    initialClient: SOEClient,loginSessionId:string,characterId:string,generatedTransient:number
  ) {
    super(
        {address:initialClient.address,port:initialClient.port} as RemoteInfo,
        initialClient.crcSeed,
        initialClient.compression,
        initialClient.cryptoKey
        );
    this.inputStream = initialClient.inputStream;
    this.outputStream = initialClient.outputStream;
    this.crcSeed = initialClient.crcSeed;
    this.sequences = initialClient.sequences;
    this.outQueue = initialClient.outQueue;
    this.protocolName = initialClient.protocolName;
    this.outOfOrderPackets = initialClient.outOfOrderPackets;
    this.nextAck = initialClient.nextAck;
    this.lastAck = initialClient.lastAck;
    this.outQueueTimer = initialClient.outputStream;
    this.ackTimer = initialClient.inputStream;
    this.outOfOrderTimer = initialClient.outputStream;

    this.isLoading = true;
    this.firstLoading = true;
    this.loginSessionId = loginSessionId;
    this.vehicle = {
      vehicleState: 0,
      falling: -1,
    };
    this.lastPingTime = new Date().getTime() + 120 * 1000;
    this.character = {
        characterId: characterId,
        transientId: generatedTransient,
        isRunning: false,
        equipment: [
          { modelName: "Weapon_Empty.adr", slotId: 1 }, // yeah that's an hack TODO find a better way
          { modelName: "Weapon_Empty.adr", slotId: 7 },
          {
            modelName: "SurvivorMale_Ivan_Shirt_Base.adr",
            defaultTextureAlias: "Ivan_Tshirt_Navy_Shoulder_Stripes",
            slotId: 3,
          },
          {
            modelName: "SurvivorMale_Ivan_Pants_Base.adr",
            defaultTextureAlias: "Ivan_Pants_Jeans_Blue",
            slotId: 4,
          },
        ],
        resources: {
          health: 5000,
          stamina: 50,
          food: 5000,
          water: 5000,
          virus: 6000,
        },
        state: {
          position: new Float32Array([0, 0, 0, 0]),
          rotation: new Float32Array([0, 0, 0, 0]),
          lookAt: new Float32Array([0, 0, 0, 0]),
          health: 0,
          shield: 0,
        },
      };
    this.spawnedEntities = [];
    this.managedObjects = [];
  }
}
