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
  StringIds,
} from "../models/enums";
import { ZoneClient2016 } from "../classes/zoneclient";
import { ZoneServer2016 } from "../zoneserver";
import { DamageInfo } from "types/zoneserver";
import { BaseLootableEntity } from "./baselootableentity";
import { vehicleDefaultLoadouts } from "../data/loadouts";
import { LoadoutItem } from "../classes/loadoutItem";

function getActorModelId(vehicleId: number) {
  switch (vehicleId) {
    case VehicleIds.OFFROADER:
      return 7225;
    case VehicleIds.PICKUP:
      return 9258;
    case VehicleIds.POLICECAR:
      return 9301;
    case VehicleIds.ATV:
      return 9588;
    case VehicleIds.PARACHUTE:
      return 9374;
    case VehicleIds.SPECTATE:
      return 9371;
    default:
      return 7225;
  }
}

function getVehicleName(ModelId: number) {
  switch (ModelId) {
    case 7225:
      return StringIds.OFFROADER;
    case 9258: // pickup
      return StringIds.PICKUP_TRUCK;
    case 9301: // policecar
      return StringIds.POLICE_CAR;
    case 9588: // atv
      return StringIds.ATV;
    default:
      return StringIds.OFFROADER;
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
  destroyedModel: number = 0;
  minorDamageEffect: number = 0;
  majorDamageEffect: number = 0;
  criticalDamageEffect: number = 0;
  supercriticalDamageEffect: number = 0;
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
  currentDamageEffect: number = 0;
  droppedManagedClient?: ZoneClient2016; // for temporary fix
  constructor(
    characterId: string,
    transientId: number,
    actorModelId: number,
    position: Float32Array,
    rotation: Float32Array,
    server: ZoneServer2016,
    gameTime: number,
    vehicleId: number
  ) {
    super(characterId, transientId, actorModelId, position, rotation, server);
    this._resources = {
      [ResourceIds.CONDITION]: 100000,
      [ResourceIds.FUEL]: 7590,
    };
    this.state = {
      position: position,
      rotation: rotation,
      lookAt: new Float32Array([0, 0, 0, 1]),
    };
    this.vehicleId = vehicleId;
    if (!this.actorModelId) this.actorModelId = getActorModelId(this.vehicleId);
    this.loadoutId = getVehicleLoadoutId(this.vehicleId);
    this.defaultLoadout = getDefaultLoadout(this.loadoutId);
    this.npcRenderDistance = 200;
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
    this.nameId = getVehicleName(this.actorModelId);

    switch (this.vehicleId) {
      case VehicleIds.PICKUP:
        this.destroyedEffect = 326;
        this.destroyedModel = 9315;
        this.minorDamageEffect = 325;
        this.majorDamageEffect = 324;
        this.criticalDamageEffect = 323;
        this.supercriticalDamageEffect = 5228;
        break;
      case VehicleIds.POLICECAR:
        this.destroyedEffect = 286;
        this.destroyedModel = 9316;
        this.minorDamageEffect = 285;
        this.majorDamageEffect = 284;
        this.criticalDamageEffect = 283;
        this.supercriticalDamageEffect = 5229;
        break;
      case VehicleIds.ATV:
        this.destroyedEffect = 357;
        this.destroyedModel = 9593;
        this.minorDamageEffect = 360;
        this.majorDamageEffect = 359;
        this.criticalDamageEffect = 358;
        this.supercriticalDamageEffect = 5226;
        break;
      case VehicleIds.OFFROADER:
      default:
        this.destroyedEffect = 135;
        this.destroyedModel = 7226;
        this.minorDamageEffect = 182;
        this.majorDamageEffect = 181;
        this.criticalDamageEffect = 180;
        this.supercriticalDamageEffect = 5227;
        break;
    }
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
      positionUpdate: {
        ...this.positionUpdate,
        position: this.state.position, // trying to fix invisible characters/vehicles until they move
      },
    };
  }
  pGetFullVehicle(server: ZoneServer2016) {
    return {
      npcData: {
        ...this.pGetFull(server),
      },
      positionUpdate: {
        ...this.positionUpdate,
        sequenceTime: server.getGameTime(),
        position: this.state.position, // trying to fix invisible characters/vehicles until they move
      },
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

  startDamageDelay(server: ZoneServer2016) {
    this.damageTimeout = setTimeout(() => {
      this.damage(server, { entity: "", damage: 1000 });
      if (
        this._resources[ResourceIds.CONDITION] < 20000 &&
        this._resources[ResourceIds.CONDITION] > 0
      ) {
        this.damageTimeout.refresh();
      } else {
        delete this.damageTimeout;
      }
    }, 1000);
  }

  damage(server: ZoneServer2016, damageInfo: DamageInfo) {
    if (this.isInvulnerable) return;

    const oldHealth = this._resources[ResourceIds.CONDITION];
    this._resources[ResourceIds.CONDITION] -= damageInfo.damage;

    const client = server.getClientByCharId(damageInfo.entity);
    if (client) {
      client.character.addCombatlogEntry(
        server.generateDamageRecord(this.characterId, damageInfo, oldHealth)
      );
    }

    if (this._resources[ResourceIds.CONDITION] <= 0) {
      this.destroy(server);
    } else {
      let damageeffect = 0;
      let allowSend = false;
      let startDamageTimeout = false;
      if (
        this._resources[ResourceIds.CONDITION] <= 50000 &&
        this._resources[ResourceIds.CONDITION] > 35000
      ) {
        if (this.destroyedState != 1) {
          damageeffect = this.minorDamageEffect;
          allowSend = true;
          this.destroyedState = 1;
        }
      } else if (
        this._resources[ResourceIds.CONDITION] <= 35000 &&
        this._resources[ResourceIds.CONDITION] > 20000
      ) {
        if (this.destroyedState != 2) {
          damageeffect = this.majorDamageEffect;
          allowSend = true;
          this.destroyedState = 2;
        }
      } else if (
        this._resources[ResourceIds.CONDITION] <= 20000 &&
        this._resources[ResourceIds.CONDITION] > 10000
      ) {
        if (this.destroyedState != 3) {
          damageeffect = this.criticalDamageEffect;
          allowSend = true;
          startDamageTimeout = true;
          this.destroyedState = 3;
        }
      } else if (this._resources[ResourceIds.CONDITION] <= 10000) {
        if (this.destroyedState != 4) {
          damageeffect = this.supercriticalDamageEffect;
          allowSend = true;
          startDamageTimeout = true;
          this.destroyedState = 4;
        }
      } else if (
        this._resources[ResourceIds.CONDITION] > 50000 &&
        this.destroyedState != 0
      ) {
        this.destroyedState = 0;
        damageeffect = 0;
        this.currentDamageEffect = 0;
        allowSend = true;
      }
      if (allowSend) {
        this.currentDamageEffect = damageeffect;
        server.sendDataToAllWithSpawnedEntity(
          server._vehicles,
          this.characterId,
          "Command.PlayDialogEffect",
          {
            characterId: this.characterId,
            effectId: damageeffect,
          }
        );
        if (!this.damageTimeout && startDamageTimeout) {
          this.startDamageDelay(server);
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
  /* eslint-disable @typescript-eslint/no-unused-vars */
  OnPlayerSelect(
    server: ZoneServer2016,
    client: ZoneClient2016,
    isInstant?: boolean
    /* eslint-enable @typescript-eslint/no-unused-vars */
  ) {
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
    // fix seat change crash related to our managed object workaround
    if (this.droppedManagedClient == client) {
      const seatId = this.getCharacterSeat(client.character.characterId);
      server.sendData(client, "Mount.MountResponse", {
        characterId: client.character.characterId,
        vehicleGuid: this.characterId, // vehicle guid
        seatId: seatId,
        isDriver: seatId === "0" ? 1 : 0, //isDriver
        identity: {},
      });
      delete this.droppedManagedClient;
    }
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

    if (this.currentDamageEffect != 0) {
      server.sendData(client, "Command.PlayDialogEffect", {
        characterId: this.characterId,
        effectId: this.currentDamageEffect,
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
  destroy(server: ZoneServer2016) {
    if (!server._vehicles[this.characterId]) return;
    this._resources[ResourceIds.CONDITION] = 0;
    for (const c in server._clients) {
      if (this.characterId === server._clients[c].vehicle.mountedVehicle) {
        server.dismountVehicle(server._clients[c]);
      }
    }
    server.sendDataToAllWithSpawnedEntity(
      server._vehicles,
      this.characterId,
      "Character.Destroyed",
      {
        characterId: this.characterId,
        destroyedEffect: this.destroyedEffect,
        destroyedModel: this.destroyedModel,
        unknown3: 0,
        disableWeirdPhysics: false,
      }
    );
    server.deleteEntity(this.characterId, server._vehicles);
    server.explosionDamage(this.state.position, this.characterId);
    this.state.position[1] -= 0.4;
    // fix floating vehicle lootbags
    Object.values(this._loadout).forEach((item: LoadoutItem) => {
      delete this._loadout[item.slotId];
    });
    // delete vehicle loadout parts from lootbag
    server.worldObjectManager.createLootbag(server, this);
  }
}
