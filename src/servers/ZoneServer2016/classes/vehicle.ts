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
import { LoadoutIds, ResourceIds, VehicleIds } from "../enums";
import { /*positionUpdate,*/ passengers } from "../../../types/zoneserver";
import { BaseFullCharacter } from "./basefullcharacter";

function getVehicleId(ModelId: number) {
  switch (ModelId) {
    case 7225:
      return VehicleIds.OFFROADER;
    case 9258: // pickup
      return VehicleIds.PICKUP;
    case 9301: // policecar
      return VehicleIds.POLICECAR;
    case 9588: // atv
      return VehicleIds.ATV;
    case 9374: // parachute
      return VehicleIds.PARACHUTE;
    case 9371: // spectate
      return VehicleIds.SPECTATE;
    default:
      return VehicleIds.OFFROADER;
  }
}

export class Vehicle2016 extends BaseFullCharacter {
  isManaged: boolean = false;
  manager?: any;
  destroyedEffect: number = 0;
  engineOn: boolean = false;
  isLocked: number = 0;
  positionUpdate: any/*positionUpdate*/;
  fuelUpdater: any;
  isInvulnerable: boolean = false;
  onDismount?: any;
  resourcesUpdater?: any;
  damageTimeout?: any;
  vehicleManager?: string;
  seats: { [seatId: string]: any } = {};
  passengers: passengers = {};
  vehicleId: number;
  destroyedState = 0;
  positionUpdateType = 1;
  loadoutId = LoadoutIds.VEHICLE;
  constructor(
    characterId: string,
    transientId: number,
    actorModelId: number,
    position: Float32Array,
    rotation: Float32Array,
    gameTime: number
  ) {
    super(characterId, transientId, actorModelId, position, rotation);
    this._resources = {
      [ResourceIds.CONDITION]: 100000,
      [ResourceIds.FUEL]: 7590,
    };
    this.state = {
      position: position,
      rotation: rotation,
      lookAt: new Float32Array([0, 0, 0, 1]),
    };
    this.vehicleId = getVehicleId(this.actorModelId);
    this.isInvulnerable = 
      this.vehicleId == VehicleIds.SPECTATE || 
      this.vehicleId == VehicleIds.PARACHUTE;
    switch (this.vehicleId) {
      case VehicleIds.OFFROADER:
      case VehicleIds.PICKUP:
      case VehicleIds.POLICECAR:
        this.seats = {
          0: "",
          1: "",
          2: "",
          3: "",
          4: "",
        };
        break;
      case VehicleIds.ATV:
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
    this.positionUpdate = {
      ...createPositionUpdate(
        this.state.position,
        this.state.rotation,
        gameTime
      ),
      vehicle: this,
      get position() {
        return this.vehicle.state.position;
      }
    };
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
    const passengers: string[] = [];
    for (const seatId in this.seats) {
      if (this.seats[seatId]) {
        passengers.push(this.seats[seatId]);
      }
    }
    return passengers;
  }

  removePassenger(characterId: string) {
    for (const seatId in this.seats) {
      if (this.seats[seatId] === characterId) {
        this.seats[seatId] = "";
        break;
      }
    }
  }

  pGetLightweightVehicle() {
    return {
      npcData: {
        ...this.pGetLightweight(),
        position: this.positionUpdate.position || this.state.position,
        vehicleId: this.vehicleId,
      },
      positionUpdate: this.positionUpdate,
    };
  }
  pGetFullVehicle() {
    return {
      npcData: {
        ...this.pGetFull(),
      },
      positionUpdate: this.positionUpdate,
      unknownArray1: [],
      unknownArray2: [],
      unknownArray3: [],
      unknownArray4: [],
      unknownArray5: [
        {
          unknownData1: {
            unknownData1: {},
          },
        },
      ],
      unknownArray6: [],
      unknownArray7: [],
      unknownArray8: [
        {
          unknownArray1: [],
        },
      ],
    };
  }
}
