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
import { Items, LoadoutIds, ResourceIds, VehicleIds } from "../models/enums";
import { /*positionUpdate,*/ passengers } from "../../../types/zoneserver";
import { BaseFullCharacter } from "./basefullcharacter";
import { ZoneClient2016 } from "./zoneclient";
import { ZoneServer2016 } from "../zoneserver";

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

function getVehicleLoadoutId(vehicleId: number) {
  switch (vehicleId) {
    case VehicleIds.OFFROADER:
      return LoadoutIds.VEHICLE_OFFROADER;
    case VehicleIds.PICKUP:
      return LoadoutIds.VEHICLE_PICKUP;
    case VehicleIds.POLICECAR:
      return LoadoutIds.VEHICLE_POLICECAR;
    case VehicleIds.ATV:
      return LoadoutIds.VEHICLE_ATV;
    case VehicleIds.PARACHUTE:
    case VehicleIds.SPECTATE:
    default:
      return 5; // idk if this is right but these vehicles dont have a loadout
  }
}

export class Vehicle2016 extends BaseFullCharacter {
  isManaged: boolean = false;
  manager?: any;
  destroyedEffect: number = 0;
  engineOn: boolean = false;
  isLocked: number = 0;
  positionUpdate: any /*positionUpdate*/;
  fuelUpdater: any;
  isInvulnerable: boolean = false;
  onDismount?: any;
  resourcesUpdater?: any;
  damageTimeout?: any;
  vehicleManager?: string;
  seats: { [seatId: string]: string } = {};
  vehicleId: number;
  destroyedState = 0;
  positionUpdateType = 1;
  driverIsDead: boolean = false;
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
    this.loadoutId = getVehicleLoadoutId(this.vehicleId);
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
      },
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
  getInventoryItemId(): number {
    switch (this.loadoutId) {
      case LoadoutIds.VEHICLE_OFFROADER:
        return Items.VEHICLE_CONTAINER_OFFROADER;
      case LoadoutIds.VEHICLE_PICKUP:
        return Items.VEHICLE_CONTAINER_PICKUP;
      case LoadoutIds.VEHICLE_POLICECAR:
        return Items.VEHICLE_CONTAINER_POLICECAR;
      case LoadoutIds.VEHICLE_ATV:
        return Items.VEHICLE_CONTAINER_ATV;
      default:
        return 0;
    }
  }

  getTurboItemId(): number {
    switch (this.loadoutId) {
      case LoadoutIds.VEHICLE_OFFROADER:
        return Items.TURBO_OFFROADER;
      case LoadoutIds.VEHICLE_PICKUP:
        return Items.TURBO_PICKUP;
      case LoadoutIds.VEHICLE_POLICECAR:
        return Items.TURBO_POLICE;
      case LoadoutIds.VEHICLE_ATV:
        return Items.TURBO_ATV;
      default:
        return 0;
    }
  }

  getHeadlightsItemId(): number {
    switch (this.loadoutId) {
      case LoadoutIds.VEHICLE_OFFROADER:
        return Items.HEADLIGHTS_OFFROADER;
      case LoadoutIds.VEHICLE_PICKUP:
        return Items.HEADLIGHTS_PICKUP;
      case LoadoutIds.VEHICLE_POLICECAR:
        return Items.HEADLIGHTS_POLICE;
      case LoadoutIds.VEHICLE_ATV:
        return Items.HEADLIGHTS_ATV;
      default:
        return 0;
    }
  }

  getMotorItemId(): number {
    switch (this.loadoutId) {
      case LoadoutIds.VEHICLE_OFFROADER:
        return Items.VEHICLE_MOTOR_OFFROADER;
      case LoadoutIds.VEHICLE_PICKUP:
        return Items.VEHICLE_MOTOR_PICKUP;
      case LoadoutIds.VEHICLE_POLICECAR:
        return Items.VEHICLE_MOTOR_POLICECAR;
      case LoadoutIds.VEHICLE_ATV:
        return Items.VEHICLE_MOTOR_ATV;
      default:
        return 0;
    }
  }

  OnPlayerSelect(server: ZoneServer2016, client: ZoneClient2016) {
    !client.vehicle.mountedVehicle
      ? server.mountVehicle(client, this.characterId)
      : server.dismountVehicle(client);
  }

  OnInteractionString(server: ZoneServer2016, client: ZoneClient2016) {
    if (!client.vehicle.mountedVehicle) {
      server.sendData(client, "Command.InteractionString", {
        guid: this.characterId,
        stringId: 15,
      });
    }
  }

  OnFullCharacterDataRequest(server: ZoneServer2016, client: ZoneClient2016) {
    if (
      this.vehicleId == VehicleIds.SPECTATE ||
      this.vehicleId == VehicleIds.PARACHUTE
    )
      return;
    server.sendData(client, "LightweightToFullVehicle", this.pGetFullVehicle());
    server.updateLoadout(this);
    // prevents cars from spawning in under the map for other characters
    /*
    server.sendData(client, "PlayerUpdatePosition", {
      transientId: vehicle.transientId,
      positionUpdate: vehicle.positionUpdate,
    });
    */
    server.sendData(client, "ResourceEvent", {
      eventData: {
        type: 1,
        value: {
          characterId: this.characterId,
          characterResources: this.pGetResources(),
        },
      },
    });
    for (const a in this.seats) {
      const seatId = this.getCharacterSeat(this.seats[a]);
      if (!this.seats[a]) continue;
      server.sendData(client, "Mount.MountResponse", {
        // mounts character
        characterId: this.seats[a],
        vehicleGuid: this.characterId, // vehicle guid
        seatId: seatId,
        unknownDword3: seatId === "0" ? 1 : 0, //isDriver
        identity: {},
      });
    }

    if (this.destroyedEffect != 0) {
      server.sendData(client, "Command.PlayDialogEffect", {
        characterId: this.characterId,
        effectId: this.destroyedEffect,
      });
    }
    if (this.engineOn) {
      server.sendData(client, "Vehicle.Engine", {
        guid2: this.characterId,
        engineOn: true,
      });
    }

    if (this.onReadyCallback) {
      this.onReadyCallback(client);
      delete this.onReadyCallback;
    }
  }

  OnProjectileHit(
    server: ZoneServer2016,
    client: ZoneClient2016,
    damage: number
  ) {
    server.damageVehicle(damage, this);
  }
}
