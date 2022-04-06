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

import { createPositionUpdate } from "../../../utils/utils";
import {
  positionUpdate,
  passengers
} from "../../../types/zoneserver"
import { ZoneClient2016 } from "./zoneclient";
import { BaseFullCharacter } from "./basefullcharacter";

function getVehicleId(ModelId: number) {
  switch (ModelId) {
    case 7225: // offroader
      return 1;
    case 9258: // pickup
      return 2;
    case 9301: // policecar
      return 3;
    case 9588: // atv
      return 5;
    case 9374: // parachute
      return 13;
    case 9371: // spectate
      return 1337;
    default:
      return 1;
  }
}

export class Vehicle2016 extends BaseFullCharacter {
  worldId: number;
  isManaged: boolean = false;
  manager?: any;
  destroyedEffect: number = 0;
  engineOn: boolean = false;
  isLocked: number = 0;
  positionUpdate: positionUpdate;
  fuelUpdater: any;
  isInvulnerable: boolean = false;
  onReadyCallback?: (clientTriggered: ZoneClient2016) => boolean;
  onDismount?: any;
  resourcesUpdater?: any;
  damageTimeout?: any;
  vehicleManager?: string;
  seats: { [seatId: string]: any } = {};
  passengers: passengers = {};
  gameTime: number;
  resources: { 
    health: number, 
    fuel: number 
  };
  vehicleId: number
  destroyedState = 0;
  positionUpdateType = 1;
  loadoutId = 5; // vehicle (need to confirm)
  constructor(
    worldId: number,
    characterId: string,
    transientId: number,
    modelId: number,
    position: Float32Array,
    rotation: Float32Array,
    gameTime: number
  ) {
    super(characterId, transientId);
    this.resources = { health: 100000, fuel: 7590 };
    this.state = {
      position: position,
      rotation: rotation,
      lookAt: new Float32Array([0, 0, 0, 1]),
    }
    this.worldId = worldId;
    this.actorModelId = modelId;
    this.vehicleId = getVehicleId(this.actorModelId);
    this.isInvulnerable =
      this.vehicleId == 1337 || this.vehicleId == 13;
    switch (this.vehicleId) {
      case 1: // offroader
      case 2: // pickup
      case 3: // policecar
        this.seats = {
          0: "",
          1: "",
          2: "",
          3: "",
          4: "",
        };
        break;
      case 5: // atv
        this.seats = {
          0: "",
          1: "",
        };
        break;
      default:
        this.seats = {
          0: "",
        };
        break;
    }
    Object.seal(this.seats); // object can't be edited, but properties can
    this.gameTime = gameTime;
    this.positionUpdate = createPositionUpdate(
      this.state.position,
      this.state.rotation,
      this.gameTime
    );
  }
  getSeatCount() {
    return Object.keys(this.seats).length;
  }
  getNextSeatId() {
    for (const seatId in this.seats) {
      if (!this.seats[seatId]) {
        return seatId;
      }
    }
    return -1;
  }
  getCharacterSeat(characterId: string) {
    for (const seatId in this.seats) {
      if (this.seats[seatId] === characterId) {
        return seatId;
      }
    }
  }

  getPassengerList(): string[] {
    let passengers: string[] = [];
    for (const seatId in this.seats) {
      if (this.seats[seatId]) {
        passengers.push(this.seats[seatId]);
      }
    }
    return passengers;
  }

  pGetLightweightVehicle() {
    return {
      npcData: {
        ...this.pGetLightweight(),
        position: this.positionUpdate.position || this.state.position,
        vehicleId: this.vehicleId,
        positionUpdateType: this.positionUpdateType
      },
      positionUpdate: this.positionUpdate
    }
  }
  pGetFullVehicle() {
    return {
      npcData: {
        ...this.pGetFull(),
      },
    }
  }
}