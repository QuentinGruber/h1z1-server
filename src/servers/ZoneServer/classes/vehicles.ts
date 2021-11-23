import {
  npcData,
  seats,
  passengers,
  positionUpdate,
} from "../../../types/zoneserver";
import { generateRandomGuid } from "../../../utils/utils";
import { ZoneClient } from "./zoneclient";

function getVehicleId(ModelId: number):number {
  switch (ModelId) {
    case 7225:
      return 1;
    case 9301:
      return 3;
    case 9258:
      return 2;
    case 9374:
      return 13;
    case 9371:
      return 1337;
    default:
      return 1;
  }
}

function getVehicleType(ModelId: number):string {
  switch (ModelId) {
    case 7225:
      return "offroader";
    case 9301:
      return "policecar";
    case 9258:
      return "pickup";
    case 9374:
      return "parachute";
    case 9371:
      return "spectate";
    default:
      return "offroader";
  }
}

export class Vehicle {
  worldId: number;
  vehicleType:string;
  isManaged: boolean = false;
  manager?: any;
  engineOn: boolean = false;
  npcData: npcData;
  isLocked: number = 0;
  unknownGuid1: string;
  positionUpdate: positionUpdate;
  seat: seats;
  passengers: passengers;
  fuelUpdater: any;
  isInvulnerable: boolean = false;
  onReadyCallback?: (clientTriggered: ZoneClient) => boolean;
  onDismount?: any;
  resourcesUpdater?: any;

  constructor(
    worldId: number,
    characterId: string,
    transientId: number,
    modelId: number,
    position: Float32Array,
    rotation: Float32Array
  ) {
    this.worldId = worldId;
    this.npcData = {
      guid: generateRandomGuid(),
      characterId: characterId,
      transientId: transientId,
      modelId: modelId,
      scale: [1, 1, 1, 1],
      resources: { health: 100000, fuel: 7590 },
      position: position,
      rotation: rotation,
      attachedObject: {},
      vehicleId: getVehicleId(modelId),
      isVehicle: true,
      color: {},
      unknownArray1: [],
      destroyedState: 0,
      array5: [{ unknown1: 0 }],
      array17: [{ unknown1: 0 }],
      array18: [{ unknown1: 0 }],
    };
    this.unknownGuid1 = generateRandomGuid();
    this.positionUpdate = {};
    this.seat = {
      seat1: false,
      seat2: false,
      seat3: false,
      seat4: false,
    };
    this.passengers = {};
    this.vehicleType = getVehicleType(modelId);
  }
}
