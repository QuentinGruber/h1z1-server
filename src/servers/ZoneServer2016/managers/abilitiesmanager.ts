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

import {
  Abilities,
  AbilityIds,
  VehicleEffects,
  VehicleIds
} from "../models/enums";
import { ZoneClient2016 as Client } from "../classes/zoneclient";
import { ZoneServer2016 } from "../zoneserver";
import { Vehicle2016 } from "../entities/vehicle";
import { BaseLightweightCharacter } from "../entities/baselightweightcharacter";
import { BaseEntity } from "../entities/baseentity";
import {
  AbilitiesInitAbility,
  AbilitiesSetVehicleActivatableAbilityManager,
  AbilitiesUninitAbility,
  AbilitiesUpdateAbility,
  AbilitiesVehicleDeactivateAbility,
  CharacterAddEffectTagCompositeEffect,
  EffectAddEffect,
  EffectRemoveEffect
} from "types/zone2016packets";
import { EntityDictionary } from "types/zoneserver";
const //abilities = require("../../../../data/2016/dataSources/Abilities.json"),
  vehicleAbilities = require("../../../../data/2016/dataSources/VehicleAbilities.json");

export class AbilitiesManager {
  sendVehicleAbilities(
    server: ZoneServer2016,
    client: Client,
    vehicle: Vehicle2016
  ) {
    let abilityId: number | undefined;
    switch (vehicle.vehicleId) {
      case VehicleIds.OFFROADER:
        abilityId = AbilityIds.TURBO_OFFROADER;
        break;
      case VehicleIds.PICKUP:
        abilityId = AbilityIds.TURBO_PICKP_TRUCK;
        break;
      case VehicleIds.POLICECAR:
        abilityId = AbilityIds.TURBO_POLICE_CAR;
        break;
      case VehicleIds.ATV:
        abilityId = AbilityIds.TURBO_ATV;
        break;
    }
    if (abilityId) {
      vehicleAbilities.abilities[2].unknownArray1 = [
        {
          unknownDword1: abilityId,
          unknownDword2: abilityId,
          unknownDword3: 0
        }
      ];
    }
    server.sendData<AbilitiesSetVehicleActivatableAbilityManager>(
      client,
      "Abilities.SetVehicleActivatableAbilityManager",
      vehicleAbilities
    );
  }

  processVehicleAbilityInit(
    server: ZoneServer2016,
    client: Client,
    vehicle: Vehicle2016,
    packetData: AbilitiesInitAbility
  ) {
    switch (packetData.abilityId) {
      case Abilities.VEHICLE_HEADLIGHTS:
        vehicle.toggleHeadlights(server, client);
        break;
      case Abilities.VEHICLE_SIREN:
        vehicle.toggleSiren(server, client);
        break;
      case Abilities.VEHICLE_TURBO:
        break;
      case Abilities.VEHICLE_HORN:
        vehicle.toggleHorn(server, true, client);
        break;
    }
  }

  processAbilityUninit(
    server: ZoneServer2016,
    client: Client,
    vehicle: Vehicle2016,
    packetData: AbilitiesUninitAbility
  ) {
    switch (packetData.abilityId) {
      case Abilities.VEHICLE_HEADLIGHTS:
        vehicle.toggleHeadlights(server, client);
        break;
      case Abilities.VEHICLE_SIREN:
        vehicle.toggleSiren(server, client);
        break;
      case Abilities.VEHICLE_TURBO:
        break;
      case Abilities.VEHICLE_HORN:
        vehicle.toggleHorn(server, false, client);
        break;
    }
    server.sendData<AbilitiesVehicleDeactivateAbility>(
      client,
      "Abilities.VehicleDeactivateAbility",
      {
        abilityId: packetData.abilityId,
        unknownDword1: 12
      }
    );
  }

  processAbilityUpdate(
    server: ZoneServer2016,
    client: Client,
    packetData: AbilitiesUpdateAbility,
    entity: BaseEntity
  ) {
    client.character.checkCurrentInteractionGuid();
    const weaponItem = client.character.getEquippedWeapon();
    if (!weaponItem || !weaponItem.weapon) return;
    server.handleMeleeHit(client, entity, weaponItem);
  }

  processAddEffectPacket(
    server: ZoneServer2016,
    client: Client,
    packetData: EffectAddEffect
  ) {
    console.log(packetData);
    const abilityEffectId: number = packetData.effectData.abilityEffectId2 ?? 0,
      clientEffect = server._clientEffectsData[abilityEffectId];
    if (clientEffect.typeName == "RequestAnimation") {
      const animationName = clientEffect.animationName;
      server.sendDataToAllOthersWithSpawnedEntity(
        server._characters,
        client,
        client.character.characterId,
        "Character.PlayAnimation",
        {
          characterId: client.character.characterId,
          animationName: animationName
        }
      );
      return;
    }
    const vehicleAbilityEffectId = packetData.effectData.abilityEffectId1;
    let vehicle: Vehicle2016 | undefined;
    switch (vehicleAbilityEffectId) {
      case VehicleEffects.MOTOR_RUN_OFFROADER:
        if (!client.vehicle.mountedVehicle) return;
        vehicle = server._vehicles[client.vehicle.mountedVehicle];
        vehicle.checkEngineRequirements(server);
        break;
      case VehicleEffects.TURBO_OFFROADER:
      case VehicleEffects.TURBO_PICKUP_TRUCK:
      case VehicleEffects.TURBO_POLICE_CAR:
      case VehicleEffects.TURBO_ATV:
        if (!client.vehicle.mountedVehicle) return;
        vehicle = server._vehicles[client.vehicle.mountedVehicle];
        let effectId: number | undefined;
        switch (vehicle.vehicleId) {
          case VehicleIds.OFFROADER:
            effectId = 5016;
            break;
          case VehicleIds.PICKUP:
            effectId = 319;
            break;
          case VehicleIds.POLICECAR:
            effectId = 279;
            break;
          case VehicleIds.ATV:
            effectId = 354;
            break;
        }
        if (!effectId) return;
        this.addEffectTag(server, client, vehicle, effectId, server._vehicles);
        vehicle.turboOn = true;
        break;
    }
  }

  processRemoveEffectPacket(
    server: ZoneServer2016,
    client: Client,
    packetData: EffectRemoveEffect
  ) {
    const effectId = packetData.abilityEffectData.abilityEffectId1;
    let vehicle: Vehicle2016 | undefined;
    switch (effectId) {
      case VehicleEffects.MOTOR_RUN_OFFROADER:
        if (!client.vehicle.mountedVehicle) return;
        vehicle = server._vehicles[client.vehicle.mountedVehicle];
        this.sendRemoveEffectPacket(server, packetData, server._vehicles);
        vehicle.stopEngine(server);
        break;
      case VehicleEffects.TURBO_OFFROADER:
      case VehicleEffects.TURBO_PICKUP_TRUCK:
      case VehicleEffects.TURBO_POLICE_CAR:
      case VehicleEffects.TURBO_ATV:
        if (!client.vehicle.mountedVehicle) return;
        vehicle = server._vehicles[client.vehicle.mountedVehicle];
        let effectId: number | undefined;
        switch (vehicle.vehicleId) {
          case VehicleIds.OFFROADER:
            effectId = 5016;
            break;
          case VehicleIds.PICKUP:
            effectId = 319;
            break;
          case VehicleIds.POLICECAR:
            effectId = 279;
            break;
          case VehicleIds.ATV:
            effectId = 354;
            break;
        }
        if (!effectId) return;
        this.removeEffectTag(
          server,
          client,
          vehicle,
          effectId,
          server._vehicles
        );
        this.sendRemoveEffectPacket(server, packetData, server._vehicles);
        vehicle.turboOn = false;
        break;
    }
  }

  addEffectTag(
    server: ZoneServer2016,
    client: Client,
    entity: BaseLightweightCharacter,
    effectId: number,
    dictionary: EntityDictionary<BaseEntity>
  ) {
    const index = entity.effectTags.indexOf(effectId);
    if (index <= -1) {
      server.sendDataToAllOthersWithSpawnedEntity<CharacterAddEffectTagCompositeEffect>(
        dictionary,
        client,
        entity.characterId,
        "Character.AddEffectTagCompositeEffect",
        {
          characterId: entity.characterId,
          effectId: effectId,
          unknownDword1: effectId,
          unknownDword2: effectId
        }
      );
      entity.effectTags.push(effectId);
    }
  }

  removeEffectTag(
    server: ZoneServer2016,
    client: Client,
    entity: BaseLightweightCharacter,
    effectId: number,
    dictionary: EntityDictionary<BaseEntity>
  ) {
    const index = entity.effectTags.indexOf(effectId);
    if (index > -1)
      server.sendDataToAllOthersWithSpawnedEntity(
        dictionary,
        client,
        entity.characterId,
        "Character.RemoveEffectTagCompositeEffect",
        {
          characterId: entity.characterId,
          effectId: effectId,
          newEffectId: 0
        }
      );
    entity.effectTags.splice(index, 1);
  }

  sendRemoveEffectPacket(server: ZoneServer2016, packetData: EffectRemoveEffect, dictionary: EntityDictionary<BaseEntity>) {
    server.sendDataToAllWithSpawnedEntity<EffectRemoveEffect>(
      dictionary,
      packetData.unknownData2.characterId,
      "Effect.RemoveEffect",
      {
        abilityEffectData: {
          unknownDword1: 4,
          abilityEffectId1: packetData.abilityEffectData.abilityEffectId1,
          abilityEffectId2: packetData.abilityEffectData.abilityEffectId2
        },
        unknownData2: {
          characterId: packetData.targetCharacterId
        },
          guid2: "0x0",
          targetCharacterId: packetData.unknownData2.characterId,
          //unknownVector1: [0, 0, 0, 0]
      }
    );
  }
}
