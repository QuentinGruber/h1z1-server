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

import { createPositionUpdate } from "../../../utils/utils";
import {
  Items,
  LoadoutIds,
  ResourceIds,
  ResourceTypes,
  VehicleIds,
} from "../models/enums";
import { ZoneClient2016 } from "./zoneclient";
import { ZoneServer2016 } from "../zoneserver";
import { DamageInfo } from "types/zoneserver";
import { BaseLootableEntity } from "./baselootableentity";
import { vehicleDefaultLoadouts } from "../data/loadouts";

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

function getDefaultLoadout(loadoutId: number) {
  switch (loadoutId) {
    case LoadoutIds.VEHICLE_OFFROADER:
      return vehicleDefaultLoadouts.offroader;
    case LoadoutIds.VEHICLE_PICKUP:
      return vehicleDefaultLoadouts.pickup;
    case LoadoutIds.VEHICLE_POLICECAR:
      return vehicleDefaultLoadouts.policecar;
    case LoadoutIds.VEHICLE_ATV:
      return vehicleDefaultLoadouts.atv;
    default:
      return [];
  }
}

export class Vehicle2016 extends BaseLootableEntity {
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
    this.defaultLoadout = getDefaultLoadout(this.loadoutId);
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
  getNextSeatId(server: ZoneServer2016) {
    for (const seatId in this.seats) {
      const seat = this.seats[seatId],
        passenger = seat ? server._characters[seat] : undefined;
      if (!this.seats[seatId] || !passenger?.isAlive) {
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
  pGetFullVehicle(server: ZoneServer2016) {
    return {
      npcData: {
        ...this.pGetFull(server),
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

  pGetPassengers(server: ZoneServer2016) {
    return this.getPassengerList().map((passenger) => {
      return {
        characterId: passenger,
        identity: {
          characterName: server._characters[passenger].name,
        },
        unknownString1: server._characters[passenger].name,
        unknownByte1: 1,
      };
    });
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

  damage(server: ZoneServer2016, damageInfo: DamageInfo) {
    if (this.isInvulnerable) return;

    let destroyedVehicleEffect: number;
    let minorDamageEffect: number;
    let majorDamageEffect: number;
    let criticalDamageEffect: number;
    let supercriticalDamageEffect: number;
    let destroyedVehicleModel: number;
    switch (this.vehicleId) {
      case VehicleIds.OFFROADER:
        destroyedVehicleEffect = 135;
        destroyedVehicleModel = 7226;
        minorDamageEffect = 182;
        majorDamageEffect = 181;
        criticalDamageEffect = 180;
        supercriticalDamageEffect = 5227;
        break;
      case VehicleIds.PICKUP:
        destroyedVehicleEffect = 326;
        destroyedVehicleModel = 9315;
        minorDamageEffect = 325;
        majorDamageEffect = 324;
        criticalDamageEffect = 323;
        supercriticalDamageEffect = 5228;
        break;
      case VehicleIds.POLICECAR:
        destroyedVehicleEffect = 286;
        destroyedVehicleModel = 9316;
        minorDamageEffect = 285;
        majorDamageEffect = 284;
        criticalDamageEffect = 283;
        supercriticalDamageEffect = 5229;
        break;
      case VehicleIds.ATV:
        destroyedVehicleEffect = 357;
        destroyedVehicleModel = 9593;
        minorDamageEffect = 360;
        majorDamageEffect = 359;
        criticalDamageEffect = 358;
        supercriticalDamageEffect = 5226;
        break;
      default:
        destroyedVehicleEffect = 135;
        destroyedVehicleModel = 7226;
        minorDamageEffect = 182;
        majorDamageEffect = 181;
        criticalDamageEffect = 180;
        supercriticalDamageEffect = 5227;
        break;
    }
    const oldHealth = this._resources[ResourceIds.CONDITION];
    this._resources[ResourceIds.CONDITION] -= damageInfo.damage;

    const client = server.getClientByCharId(damageInfo.entity);
    if (client) {
      client.character.addCombatlogEntry(
        server.generateDamageRecord(this.characterId, damageInfo, oldHealth)
      );
    }

    if (this._resources[ResourceIds.CONDITION] <= 0) {
      server.destroyVehicle(
        this,
        destroyedVehicleEffect,
        destroyedVehicleModel
      );
    } else {
      let damageeffect = 0;
      let allowSend = false;
      let startDamageTimeout = false;
      if (
        this._resources[ResourceIds.CONDITION] <= 50000 &&
        this._resources[ResourceIds.CONDITION] > 35000
      ) {
        if (this.destroyedState != 1) {
          damageeffect = minorDamageEffect;
          allowSend = true;
          this.destroyedState = 1;
        }
      } else if (
        this._resources[ResourceIds.CONDITION] <= 35000 &&
        this._resources[ResourceIds.CONDITION] > 20000
      ) {
        if (this.destroyedState != 2) {
          damageeffect = majorDamageEffect;
          allowSend = true;
          this.destroyedState = 2;
        }
      } else if (
        this._resources[ResourceIds.CONDITION] <= 20000 &&
        this._resources[ResourceIds.CONDITION] > 10000
      ) {
        if (this.destroyedState != 3) {
          damageeffect = criticalDamageEffect;
          allowSend = true;
          startDamageTimeout = true;
          this.destroyedState = 3;
        }
      } else if (this._resources[ResourceIds.CONDITION] <= 10000) {
        if (this.destroyedState != 4) {
          damageeffect = supercriticalDamageEffect;
          allowSend = true;
          startDamageTimeout = true;
          this.destroyedState = 4;
        }
      } else if (
        this._resources[ResourceIds.CONDITION] > 50000 &&
        this.destroyedState != 0
      ) {
        this.destroyedState = 0;
        server._vehicles[this.characterId].destroyedEffect = 0;
        allowSend = true;
      }

      if (allowSend) {
        server.sendDataToAllWithSpawnedEntity(
          server._vehicles,
          this.characterId,
          "Command.PlayDialogEffect",
          {
            characterId: this.characterId,
            effectId: damageeffect,
          }
        );
        server._vehicles[this.characterId].destroyedEffect = damageeffect;
        if (!this.damageTimeout && startDamageTimeout) {
          server.startVehicleDamageDelay(this);
        }
      }

      server.updateResourceToAllWithSpawnedEntity(
        this.characterId,
        this._resources[ResourceIds.CONDITION],
        ResourceIds.CONDITION,
        ResourceTypes.CONDITION,
        server._vehicles
      );
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
    server.sendData(
      client,
      "LightweightToFullVehicle",
      this.pGetFullVehicle(server)
    );
    this.updateLoadout(server);
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
}
