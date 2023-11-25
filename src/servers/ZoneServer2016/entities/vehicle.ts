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

import { createPositionUpdate, eul2quat } from "../../../utils/utils";
import {
  Items,
  LoadoutIds,
  ResourceIds,
  ResourceTypes,
  VehicleIds,
  StringIds,
  Effects,
  VehicleEffects
} from "../models/enums";
import { ZoneClient2016 } from "../classes/zoneclient";
import { ZoneServer2016 } from "../zoneserver";
import { DamageInfo } from "types/zoneserver";
import { BaseLootableEntity } from "./baselootableentity";
import { vehicleDefaultLoadouts } from "../data/loadouts";
import { BaseItem } from "../classes/baseItem";
import { LOADOUT_CONTAINER_ID } from "../../../utils/constants";
import { Character2016 } from "./character";
import {
  EffectRemoveEffect,
  LightweightToFullNpc,
  LightweightToFullVehicle
} from "types/zone2016packets";

function getActorModelId(vehicleId: VehicleIds) {
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

function getVehicleLoadoutId(vehicleId: VehicleIds) {
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

function getDefaultLoadout(loadoutId: LoadoutIds) {
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

function getHeadlightEffect(vehicleId: VehicleIds) {
  switch (vehicleId) {
    case VehicleIds.OFFROADER:
      return Effects.VEH_Headlight_OffRoader_wShadows;
    case VehicleIds.PICKUP:
      return Effects.VEH_Headlight_PickupTruck_wShadows;
    case VehicleIds.POLICECAR:
      return Effects.VEH_Headlight_PoliceCar_wShadows;
    case VehicleIds.ATV:
      return Effects.VEH_Headlight_ATV_wShadows;
    default:
      return Effects.VEH_Headlight_OffRoader_wShadows;
  }
}

function getHornEffect(vehicleId: VehicleIds) {
  switch (vehicleId) {
    case VehicleIds.OFFROADER:
      return Effects.SFX_VEH_Offroader_Horn;
    case VehicleIds.PICKUP:
      return Effects.SFX_VEH_Pickup_Truck_Horn;
    case VehicleIds.POLICECAR:
      return Effects.SFX_VEH_Police_Car_Horn;
    case VehicleIds.ATV:
      return Effects.SFX_VEH_ATV_Horn;
    default:
      return Effects.SFX_VEH_Offroader_Horn;
  }
}

function getTurboEffect(vehicleId: VehicleIds) {
  switch (vehicleId) {
    case VehicleIds.OFFROADER:
      return Effects.VEH_Engine_Boost_OffRoader;
    case VehicleIds.PICKUP:
      return Effects.VEH_Engine_Boost_PickupTruck;
    case VehicleIds.POLICECAR:
      return Effects.VEH_Engine_Boost_PoliceCar;
    case VehicleIds.ATV:
      return Effects.VEH_Engine_Boost_ATV;
    default:
      return Effects.VEH_Engine_Boost_OffRoader;
  }
}

function getHotwireEffect(vehicleId: VehicleIds) {
  switch (vehicleId) {
    case VehicleIds.OFFROADER:
      return Effects.SFX_VEH_OffRoader_Hotwire;
    case VehicleIds.PICKUP:
      return Effects.SFX_VEH_Pickup_Truck_Hotwire;
    case VehicleIds.POLICECAR:
      return Effects.SFX_VEH_Police_Car_Hotwire;
    case VehicleIds.ATV:
      return Effects.SFX_VEH_ATV_Hotwire;
    default:
      return Effects.SFX_VEH_OffRoader_Hotwire;
  }
}

export class Vehicle2016 extends BaseLootableEntity {
  isManaged: boolean = false;
  manager?: ZoneClient2016;
  destroyedEffect: number = 0;
  destroyedModel: number = 0;
  minorDamageEffect: number = 0;
  majorDamageEffect: number = 0;
  criticalDamageEffect: number = 0;
  supercriticalDamageEffect: number = 0;
  engineOn: boolean = false;
  isLocked: boolean = false;
  positionUpdate: any /*positionUpdate*/;
  engineRPM: number = 0;
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
  oldPos: { position: Float32Array; time: number } = {
    position: new Float32Array(),
    time: 0
  };
  droppedManagedClient?: ZoneClient2016; // for temporary fix
  isMountable: boolean = true;
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
      [ResourceIds.FUEL]: 7500
    };
    this.state = {
      position: position,
      rotation: rotation,
      lookAt: new Float32Array([0, 0, 0, 1]),
      yaw: 0
    };
    this.vehicleId = vehicleId;
    if (!this.actorModelId) this.actorModelId = getActorModelId(this.vehicleId);
    this.getMaterialType(server, this.actorModelId);
    this.loadoutId = getVehicleLoadoutId(this.vehicleId);
    this.defaultLoadout = getDefaultLoadout(this.loadoutId);
    this.npcRenderDistance = 400;
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
          4: ""
        };
        break;
      case VehicleIds.ATV:
        this.seats = {
          0: "",
          1: ""
        };
        break;
      default:
        this.seats = {
          0: ""
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
    this.nameId = getVehicleName(this.actorModelId);

    switch (this.vehicleId) {
      case VehicleIds.PICKUP:
        this.destroyedEffect = Effects.VEH_Death_PickupTruck;
        this.destroyedModel = 9315;
        this.minorDamageEffect = Effects.VEH_Damage_PickupTruck_Stage01;
        this.majorDamageEffect = Effects.VEH_Damage_PickupTruck_Stage02;
        this.criticalDamageEffect = Effects.VEH_Damage_PickupTruck_Stage03;
        this.supercriticalDamageEffect = Effects.VEH_Damage_PickupTruck_Stage04;
        break;
      case VehicleIds.POLICECAR:
        this.destroyedEffect = Effects.VEH_Death_PoliceCar;
        this.destroyedModel = 9316;
        this.minorDamageEffect = Effects.VEH_Damage_PoliceCar_Stage01;
        this.majorDamageEffect = Effects.VEH_Damage_PoliceCar_Stage02;
        this.criticalDamageEffect = Effects.VEH_Damage_PoliceCar_Stage03;
        this.supercriticalDamageEffect = Effects.VEH_Damage_PoliceCar_Stage04;
        break;
      case VehicleIds.ATV:
        this.destroyedEffect = Effects.VEH_Death_ATV;
        this.destroyedModel = 9593;
        this.minorDamageEffect = Effects.VEH_Damage_ATV_Stage01;
        this.majorDamageEffect = Effects.VEH_Damage_ATV_Stage02;
        this.criticalDamageEffect = Effects.VEH_Damage_ATV_Stage03;
        this.supercriticalDamageEffect = Effects.VEH_Damage_ATV_Stage04;
        break;
      case VehicleIds.OFFROADER:
      default:
        this.destroyedEffect = Effects.VEH_Death_OffRoader;
        this.destroyedModel = 7226;
        this.minorDamageEffect = Effects.VEH_Damage_OffRoader_Stage01;
        this.majorDamageEffect = Effects.VEH_Damage_OffRoader_Stage02;
        this.criticalDamageEffect = Effects.VEH_Damage_OffRoader_Stage03;
        this.supercriticalDamageEffect = Effects.VEH_Damage_OffRoader_Stage04;
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
        return Number(seatId);
      }
    }
    return -1;
  }
  getCharacterSeat(characterId: string) {
    for (const seatId in this.seats) {
      if (this.seats[seatId] === characterId) {
        return Number(seatId);
      }
    }
    return -1;
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
        position: this.state.position,
        vehicleId: this.vehicleId
      },
      positionUpdate: {
        ...this.positionUpdate
      }
    };
  }

  pGetFull(server: ZoneServer2016): LightweightToFullNpc {
    return {
      transientId: this.transientId,
      attachmentData: this.pGetAttachmentSlots(),
      characterId: this.characterId,
      resources: {
        data: this.pGetResources()
      },
      effectTags: [],
      unknownData1: {},
      targetData: {},
      unknownArray1: [],
      unknownArray2: [],
      unknownArray3: { data: [] },
      unknownArray4: {},
      unknownArray5: { data: [] },
      materialType: this.materialType,
      remoteWeapons: {
        isVehicle: true,
        data: {}
      },
      itemsData: {
        items: this.pGetInventoryItems(server),
        unknownDword1: 0
      }
    };
  }

  pGetFullVehicle(server: ZoneServer2016): LightweightToFullVehicle {
    return {
      npcData: {
        ...this.pGetFull(server)
      },
      unknownArray1: [],
      unknownArray2: [],
      passengers: this.pGetPassengers(server),
      unknownArray3: [],
      unknownArray4: []
    };
  }

  pGetPassengers(server: ZoneServer2016) {
    return this.getPassengerList().map((passenger) => {
      return {
        characterId: passenger,
        identity: {
          characterName: server._characters[passenger].name
        },
        unknownString1: server._characters[passenger].name,
        unknownByte1: 1
      };
    });
  }

  getInventoryItemId(): number {
    switch (this.loadoutId) {
      case LoadoutIds.VEHICLE_OFFROADER:
        return Items.CONTAINER_VEHICLE_OFFROADER;
      case LoadoutIds.VEHICLE_PICKUP:
        return Items.CONTAINER_VEHICLE_PICKUP;
      case LoadoutIds.VEHICLE_POLICECAR:
        return Items.CONTAINER_VEHICLE_POLICECAR;
      case LoadoutIds.VEHICLE_ATV:
        return Items.CONTAINER_VEHICLE_ATV;
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

  getHealth() {
    return this._resources[ResourceIds.CONDITION];
  }

  damage(server: ZoneServer2016, damageInfo: DamageInfo) {
    if (server.isPvE && damageInfo.hitReport?.characterId) return;
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
            effectId: damageeffect
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

  updateLoadout(server: ZoneServer2016) {
    const client = server.getClientByCharId(this.characterId);
    if (client) {
      if (!client.character.initialized) return;
      server.checkConveys(client);
    }
    server.sendDataToAllWithSpawnedEntity(
      server._vehicles,
      this.characterId,
      "Loadout.SetLoadoutSlots",
      this.pGetLoadoutSlots()
    );
  }

  getDriver(server: ZoneServer2016): Character2016 | undefined {
    const seat = this.seats[0];
    if (seat) return server._characters[seat];
  }

  startEngine(server: ZoneServer2016) {
    server.sendDataToAllWithSpawnedEntity(
      server._vehicles,
      this.characterId,
      "Vehicle.Engine",
      {
        vehicleCharacterId: this.characterId,
        engineOn: true
      }
    );
    this.engineOn = true;
    this.startResourceUpdater(server);
  }

  stopEngine(server: ZoneServer2016) {
    server.sendDataToAllWithSpawnedEntity(
      server._vehicles,
      this.characterId,
      "Vehicle.Engine",
      {
        vehicleCharacterId: this.characterId,
        engineOn: false
      }
    );
    this.engineOn = false;

    const driver = this.getDriver(server);
    server.sendDataToAllWithSpawnedEntity<EffectRemoveEffect>(
      server._vehicles,
      this.characterId,
      "Effect.RemoveEffect",
      {
        abilityEffectData: {
          unknownDword1: 4,
          abilityEffectId1: VehicleEffects.MOTOR_RUN_OFFROADER,
          abilityEffectId2: 100042
        },
        targetCharacterData: {
          characterId: this.characterId
        },
        guid2: "0x0",
        targetCharacterId: driver?.characterId ?? ""
      }
    );
  }

  getHeadlightState() {
    const headlightEffect = getHeadlightEffect(this.vehicleId),
      index = this.effectTags.indexOf(headlightEffect);
    return !(index <= -1);
  }

  getSirenState() {
    const sirenEffect = Effects.VEH_SirenLight_PoliceCar,
      index = this.effectTags.indexOf(sirenEffect);
    return !(index <= -1);
  }

  getHornState() {
    const hornEffect = getHornEffect(this.vehicleId),
      index = this.effectTags.indexOf(hornEffect);
    return !(index <= -1);
  }

  getTurboState() {
    const turboEffect = getTurboEffect(this.vehicleId),
      index = this.effectTags.indexOf(turboEffect);
    return !(index <= -1);
  }

  sendNoPartsAlert(server: ZoneServer2016, client: ZoneClient2016) {
    server.sendAlert(client, "Parts may be required. Open vehicle loadout.");
  }

  sendNoFuelAlert(server: ZoneServer2016, client: ZoneClient2016) {
    server.sendAlert(
      client,
      "This vehicle will not run without fuel.  It can be created from animal fat or from corn based ethanol."
    );
  }

  setHeadlightState(
    server: ZoneServer2016,
    state: boolean,
    client?: ZoneClient2016
  ) {
    const headlightEffect = getHeadlightEffect(this.vehicleId),
      index = this.effectTags.indexOf(headlightEffect);

    if (state && index <= -1) {
      if (!this.hasBattery() || !this.hasHeadlights()) {
        if (client) this.sendNoPartsAlert(server, client);
        return;
      }
      server.sendDataToAllWithSpawnedEntity(
        server._vehicles,
        this.characterId,
        "Character.AddEffectTagCompositeEffect",
        {
          characterId: this.characterId,
          effectId: headlightEffect,
          unknownDword1: headlightEffect,
          unknownDword2: headlightEffect
        }
      );
      this.effectTags.push(headlightEffect);
      return;
    }

    server.sendDataToAllWithSpawnedEntity(
      server._vehicles,
      this.characterId,
      "Character.RemoveEffectTagCompositeEffect",
      {
        characterId: this.characterId,
        effectId: headlightEffect,
        newEffectId: 0
      }
    );
    this.effectTags.splice(index, 1);
  }

  setSirenState(
    server: ZoneServer2016,
    state: boolean,
    client?: ZoneClient2016
  ) {
    if (this.vehicleId != VehicleIds.POLICECAR) return;
    const sirenEffect = Effects.VEH_SirenLight_PoliceCar,
      index = this.effectTags.indexOf(sirenEffect);

    if (state && index <= -1) {
      if (!this.hasBattery()) {
        if (client) this.sendNoPartsAlert(server, client);
        return;
      }
      server.sendDataToAllWithSpawnedEntity(
        server._vehicles,
        this.characterId,
        "Character.AddEffectTagCompositeEffect",
        {
          characterId: this.characterId,
          effectId: sirenEffect,
          unknownDword1: sirenEffect,
          unknownDword2: sirenEffect
        }
      );
      this.effectTags.push(sirenEffect);
      return;
    }

    server.sendDataToAllWithSpawnedEntity(
      server._vehicles,
      this.characterId,
      "Character.RemoveEffectTagCompositeEffect",
      {
        characterId: this.characterId,
        effectId: sirenEffect,
        newEffectId: 0
      }
    );
    this.effectTags.splice(index, 1);
  }

  setHornState(
    server: ZoneServer2016,
    state: boolean,
    client?: ZoneClient2016
  ) {
    const hornEffect = getHornEffect(this.vehicleId),
      index = this.effectTags.indexOf(hornEffect);

    if (state && index <= -1) {
      if (!this.hasBattery()) {
        if (client) this.sendNoPartsAlert(server, client);
        return;
      }
      server.sendDataToAllWithSpawnedEntity(
        server._vehicles,
        this.characterId,
        "Character.AddEffectTagCompositeEffect",
        {
          characterId: this.characterId,
          effectId: hornEffect,
          unknownDword1: hornEffect,
          unknownDword2: hornEffect
        }
      );
      this.effectTags.push(hornEffect);
      return;
    }

    server.sendDataToAllWithSpawnedEntity(
      server._vehicles,
      this.characterId,
      "Character.RemoveEffectTagCompositeEffect",
      {
        characterId: this.characterId,
        effectId: hornEffect,
        newEffectId: 0
      }
    );
    this.effectTags.splice(index, 1);
  }

  setTurboState(
    server: ZoneServer2016,
    client: ZoneClient2016,
    state: boolean
  ) {
    const turboEffect = getTurboEffect(this.vehicleId),
      index = this.effectTags.indexOf(turboEffect);

    if (state && index <= -1) {
      if (!this.hasBattery()) {
        if (client) this.sendNoPartsAlert(server, client);
        return;
      }
      server.abilitiesManager.addEffectTag(
        server,
        client,
        this,
        turboEffect,
        server._vehicles
      );
      return;
    }

    server.abilitiesManager.removeEffectTag(
      server,
      client,
      this,
      turboEffect,
      server._vehicles
    );
  }

  hasTurbo(): boolean {
    return (
      !!this.getLoadoutItemById(Items.TURBO_OFFROADER) ||
      !!this.getLoadoutItemById(Items.TURBO_PICKUP) ||
      !!this.getLoadoutItemById(Items.TURBO_POLICE) ||
      !!this.getLoadoutItemById(Items.TURBO_ATV)
    );
  }

  hasHeadlights(): boolean {
    return (
      !!this.getLoadoutItemById(Items.HEADLIGHTS_OFFROADER) ||
      !!this.getLoadoutItemById(Items.HEADLIGHTS_PICKUP) ||
      !!this.getLoadoutItemById(Items.HEADLIGHTS_POLICE) ||
      !!this.getLoadoutItemById(Items.HEADLIGHTS_ATV)
    );
  }

  hasBattery(): boolean {
    return !!this.getLoadoutItemById(Items.BATTERY);
  }

  hasRequiredEngineParts(): boolean {
    return !!this.hasBattery() && !!this.getLoadoutItemById(Items.SPARKPLUGS);
  }

  hasVehicleKey(server: ZoneServer2016): boolean {
    return (
      !!this.getItemById(Items.VEHICLE_KEY) ||
      !!this.getDriver(server)?.getItemById(Items.VEHICLE_KEY)
    );
  }

  hasFuel(): boolean {
    return this._resources[ResourceIds.FUEL] > 0;
  }

  hasRequiredComponents(server: ZoneServer2016): boolean {
    return (
      this.hasRequiredEngineParts() &&
      this.hasVehicleKey(server) &&
      this.hasFuel()
    );
  }

  checkEngineRequirements(server: ZoneServer2016, runEngine = true) {
    if (this.hasRequiredComponents(server) && !this.engineOn && runEngine) {
      this.startEngine(server);
      return;
    }

    const driver = this.getDriver(server),
      client = server.getClientByCharId(driver?.characterId || "");

    if (
      this.getHeadlightState() &&
      (!this.hasHeadlights() || !this.hasBattery())
    ) {
      this.setHeadlightState(server, false);
    }

    if (this.getSirenState() && !this.hasBattery()) {
      this.setSirenState(server, false);
    }

    if (this.getHornState() && !this.hasBattery()) {
      this.setHornState(server, false);
    }

    if (!this.hasRequiredEngineParts()) {
      if (this.engineOn) this.stopEngine(server);
      if (client) this.sendNoPartsAlert(server, client);
      return;
    }

    if (!this.hasVehicleKey(server)) {
      if (this.engineOn) this.stopEngine(server);
      if (client) this.hotwire(server);
      return;
    }

    if (!this.hasFuel()) {
      if (this.engineOn) this.stopEngine(server);
      if (client) this.sendNoFuelAlert(server, client);
      return;
    }
  }

  removeHotwireEffect(server: ZoneServer2016) {
    const hotwireEffect = getHotwireEffect(this.vehicleId),
      index = this.effectTags.indexOf(hotwireEffect);

    if (index <= -1) return;

    server.sendDataToAllWithSpawnedEntity(
      server._vehicles,
      this.characterId,
      "Character.RemoveEffectTagCompositeEffect",
      {
        characterId: this.characterId,
        effectId: hotwireEffect,
        newEffectId: 0
      }
    );
    this.effectTags.splice(index, 1);
  }

  hotwire(server: ZoneServer2016) {
    const driver = this.getDriver(server),
      client = server.getClientByCharId(driver?.characterId || "");
    if (!client) return;

    const hotwireEffect = getHotwireEffect(this.vehicleId),
      index = this.effectTags.indexOf(hotwireEffect);
    if (!hotwireEffect || index >= 0) return;
    server.sendDataToAllWithSpawnedEntity(
      server._vehicles,
      this.characterId,
      "Character.AddEffectTagCompositeEffect",
      {
        characterId: this.characterId,
        effectId: hotwireEffect,
        unknownDword1: hotwireEffect,
        unknownDword2: hotwireEffect
      }
    );
    this.effectTags.push(hotwireEffect);

    server.utilizeHudTimer(client, 0, 5000, 0, () => {
      this.removeHotwireEffect(server);
      this.startEngine(server);
    });
  }

  startResourceUpdater(server: ZoneServer2016) {
    if (this.resourcesUpdater) return;
    this.resourcesUpdater = setTimeout(() => {
      if (!server._vehicles[this.characterId]) return;
      if (!this.engineOn) {
        delete this.resourcesUpdater;
        return;
      }
      if (this.engineRPM) {
        const fuelLoss =
          this.engineRPM * 0.003 * (this.getTurboState() ? 4 : 1);
        this._resources[ResourceIds.FUEL] -= fuelLoss;
      }
      if (this._resources[ResourceIds.FUEL] < 0) {
        this._resources[ResourceIds.FUEL] = 0;
      }
      if (this.engineOn && this._resources[ResourceIds.FUEL] <= 0) {
        this.stopEngine(server);
        const driver = this.getDriver(server),
          client = server.getClientByCharId(driver?.characterId || "");
        if (client) this.sendNoFuelAlert(server, client);
      }
      server.updateResourceToAllWithSpawnedEntity(
        this.characterId,
        this._resources[ResourceIds.FUEL],
        ResourceIds.FUEL,
        ResourceTypes.FUEL,
        server._vehicles
      );
      this.resourcesUpdater.refresh();
    }, 3000);
  }

  setLockState(server: ZoneServer2016, client: ZoneClient2016, state: boolean) {
    server.sendData(client, "Vehicle.AccessType", {
      vehicleGuid: this.characterId,
      accessType: state ? 2 : 0
    });
    this.isLocked = state;
  }

  pGetLoadoutSlots() {
    return {
      characterId: this.characterId,
      loadoutId: this.loadoutId,
      loadoutData: {
        loadoutSlots: Object.values(this.getLoadoutSlots()).map((slotId) => {
          return this.pGetLoadoutSlot(slotId);
        })
      },
      currentSlotId: this.currentLoadoutSlot
    };
  }

  isFlipped(): boolean {
    return Math.abs(this.positionUpdate.sideTilt) > 2;
  }

  flipVehicle(server: ZoneServer2016) {
    let c: ZoneClient2016 | undefined;
    for (const a in server._clients) {
      if (server._clients[a].managedObjects.includes(this.characterId)) {
        c = server._clients[a];
      }
    }
    if (c) {
      this.positionUpdate.sideTilt = 0;
      server.sendData(c, "ClientUpdate.UpdateManagedLocation", {
        characterId: this.characterId,
        position: this.state.position,
        rotation: eul2quat(
          new Float32Array([
            this.positionUpdate.orientation,
            this.positionUpdate.sideTilt,
            this.positionUpdate.frontTilt
          ])
        )
      });
    }
  }

  /* eslint-disable @typescript-eslint/no-unused-vars */
  OnPlayerSelect(
    server: ZoneServer2016,
    client: ZoneClient2016,
    isInstant?: boolean
    /* eslint-enable @typescript-eslint/no-unused-vars */
  ) {
    if (client.vehicle.mountedVehicle) {
      server.dismountVehicle(client);
      return;
    }
    if (this.isFlipped()) {
      this.flipVehicle(server);
      return;
    }
    server.mountVehicle(client, this.characterId);
  }

  OnInteractionString(server: ZoneServer2016, client: ZoneClient2016) {
    if (client.vehicle.mountedVehicle) return;

    if (this.isFlipped()) {
      server.sendData(client, "Command.InteractionString", {
        guid: this.characterId,
        stringId: StringIds.USE_TARGET
      });
      return;
    }

    server.sendData(client, "Command.InteractionString", {
      guid: this.characterId,
      stringId: StringIds.ENTER_VEHICLE
    });
  }

  pGetItemData(server: ZoneServer2016, item: BaseItem, containerDefId: number) {
    let durability: number = 0;
    switch (true) {
      case server.isWeapon(item.itemDefinitionId):
        durability = 2000;
        break;
      case server.isArmor(item.itemDefinitionId):
        durability = 1000;
        break;
      case server.isHelmet(item.itemDefinitionId):
        durability = 100;
        break;
    }
    return {
      itemDefinitionId: item.itemDefinitionId,
      tintId: 0,
      guid: item.itemGuid,
      count: item.stackCount,
      itemSubData: {
        hasSubData: false
      },
      containerGuid: item.containerGuid,
      containerDefinitionId: containerDefId,
      containerSlotId: item.slotId,
      baseDurability: durability,
      currentDurability: durability ? item.currentDurability : 0,
      maxDurabilityFromDefinition: durability,
      unknownBoolean1: true,
      ownerCharacterId: this.characterId,
      unknownDword9: 1,
      weaponData: this.pGetItemWeaponData(server, item)
    };
  }

  OnFullCharacterDataRequest(server: ZoneServer2016, client: ZoneClient2016) {
    if (
      this.vehicleId == VehicleIds.SPECTATE ||
      this.vehicleId == VehicleIds.PARACHUTE
    ) {
      return;
    }
    server.sendData(
      client,
      "LightweightToFullVehicle",
      this.pGetFullVehicle(server)
    );
    Object.values(this._loadout).forEach((item) => {
      server.sendData(client, "ClientUpdate.ItemAdd", {
        characterId: this.characterId,
        data: this.pGetItemData(server, item, LOADOUT_CONTAINER_ID)
      });
    });
    this.updateLoadout(server);
    // fix seat change crash related to our managed object workaround
    if (this.droppedManagedClient == client) {
      const seatId = this.getCharacterSeat(client.character.characterId);
      server.sendData(client, "Mount.MountResponse", {
        characterId: client.character.characterId,
        vehicleGuid: this.characterId, // vehicle guid
        seatId: seatId,
        isDriver: seatId == 0 ? 1 : 0, //isDriver
        identity: {}
      });
      delete this.droppedManagedClient;
    }

    server.sendData(client, "ResourceEvent", {
      eventData: {
        type: 1,
        value: {
          characterId: this.characterId,
          characterResources: this.pGetResources()
        }
      }
    });
    // disable this workaround for now
    /*for (const a in this.seats) {
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
    }*/

    if (this.currentDamageEffect != 0) {
      server.sendData(client, "Command.PlayDialogEffect", {
        characterId: this.characterId,
        effectId: this.currentDamageEffect
      });
    }
    // has to be sent or vehicle will lose sound after fullVehicle packet
    if (this.engineOn) {
      server.sendData(client, "Vehicle.Engine", {
        vehicleCharacterId: this.characterId,
        engineOn: true
      });
    }

    if (this.onReadyCallback) {
      this.onReadyCallback(client);
      delete this.onReadyCallback;
    }
  }

  OnMeleeHit(server: ZoneServer2016, damageInfo: DamageInfo) {
    const client = server.getClientByCharId(damageInfo.entity),
      weapon = client?.character.getEquippedWeapon();
    damageInfo.damage = damageInfo.damage * 2;
    if (!client || weapon?.itemDefinitionId != Items.WEAPON_WRENCH) {
      this.damage(server, damageInfo);
      return;
    }

    if (this._resources[ResourceIds.CONDITION] < 100000) {
      this.damage(server, { ...damageInfo, damage: -5000 });
      server.damageItem(client, weapon, 100);
    }
  }

  destroy(server: ZoneServer2016, disableExplosion = false): boolean {
    if (!server._vehicles[this.characterId]) return false;
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
        disableWeirdPhysics: false
      }
    );
    const deleted = server.deleteEntity(this.characterId, server._vehicles);
    if (!disableExplosion) {
      server.explosionDamage(this.state.position, this.characterId, 0);
    }
    this.state.position[1] -= 0.4;
    // fix floating vehicle lootbags
    server.worldObjectManager.createLootbag(server, this);
    return deleted;
  }
}
