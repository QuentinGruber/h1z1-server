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
import { DamageInfo, EntityDictionary } from "types/zoneserver";
import { LootableProp } from "../entities/lootableprop";
import { LoadoutItem } from "../classes/loadoutItem";
import { Crate } from "../entities/crate";
import { Destroyable } from "../entities/destroyable";
import { Npc } from "../entities/npc";
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

  processAbilityInit(
    server: ZoneServer2016,
    client: Client,
    packetData: AbilitiesInitAbility
  ) {
    const vehicle = server._vehicles[client.vehicle.mountedVehicle ?? ""],
    isDriver = vehicle?.getDriver(server) == client.character;
    if (!vehicle || !isDriver) {
      client.character.abilityInitTime = Date.now();
      return;
    };
    server.abilitiesManager.processVehicleAbilityInit(
      server,
      client,
      vehicle,
      packetData
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
        vehicle.setHornState(server, true, client);
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
        vehicle.setHornState(server, false, client);
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
    // todo: validate time between init and update
    if(!client.character.abilityInitTime) {
      console.log(`${client.character.characterId} tried to update a non-initialized ability!`);
      return;
    }
    client.character.abilityInitTime = 0;
    client.character.checkCurrentInteractionGuid();
    const weaponItem = client.character.getEquippedWeapon();
    if (!weaponItem) return;

    this.handleMeleeHit(server, client, entity, weaponItem);
  }

  handleMeleeHit(server: ZoneServer2016, client: Client, entity: BaseEntity, weaponItem: LoadoutItem) {
    if(!weaponItem.weapon) return;

    // TODO: CHECK MELEE BLOCK TIME FOR EACH WEAPON
    // CHECK MELEE RANGE ALSO

    //if (client.character.meleeBlocked()) return true;
    client.character.lastMeleeHitTime = Date.now();

    // TODO: calculate this based on melee weapondefinition
    const baseDamage = 1000;

    const damageInfo: DamageInfo = {
      entity: client.character.characterId,
      weapon: weaponItem.itemDefinitionId,
      damage: baseDamage // need to figure out a good number for this
    };

    /*
      THIS IF STATEMENT IS ONLY TEMPORARY UNTIL OnMeleeHit METHODS
      ARE DEFINED IN ALL ENTITIES
    */

      console.log(entity.characterId);

    if (
      entity instanceof LootableProp || 
      entity instanceof Vehicle2016 ||
      entity instanceof Crate ||
      entity instanceof Destroyable ||
      entity instanceof Npc
      ) {
      entity.OnMeleeHit(server, damageInfo);
      console.log("OnMeleeHit");
      return;
    }

    server.handleMeleeHit(client, entity, weaponItem);
  }

  processAddEffectPacket(
    server: ZoneServer2016,
    client: Client,
    packetData: EffectAddEffect
  ) {
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
    const vehicleAbilityEffectId = packetData.effectData.abilityEffectId1,
      vehicle = server._vehicles[client.vehicle.mountedVehicle ?? ""];
    if (!vehicle) return;

    switch (vehicleAbilityEffectId) {
      case VehicleEffects.MOTOR_RUN_OFFROADER:
        vehicle.checkEngineRequirements(server);
        break;
      case VehicleEffects.TURBO_OFFROADER:
      case VehicleEffects.TURBO_PICKUP_TRUCK:
      case VehicleEffects.TURBO_POLICE_CAR:
      case VehicleEffects.TURBO_ATV:
        vehicle.setTurboState(server, client, true);
        break;
    }
  }

  processRemoveEffectPacket(
    server: ZoneServer2016,
    client: Client,
    packetData: EffectRemoveEffect
  ) {
    const vehicleAbilityEffectId =
        packetData.abilityEffectData.abilityEffectId1,
      vehicle = server._vehicles[client.vehicle.mountedVehicle ?? ""];
    if (!vehicle) return;

    switch (vehicleAbilityEffectId) {
      case VehicleEffects.MOTOR_RUN_OFFROADER:
        this.sendRemoveEffectPacket(server, packetData, server._vehicles);
        vehicle.stopEngine(server);
        break;
      case VehicleEffects.TURBO_OFFROADER:
      case VehicleEffects.TURBO_PICKUP_TRUCK:
      case VehicleEffects.TURBO_POLICE_CAR:
      case VehicleEffects.TURBO_ATV:
        this.sendRemoveEffectPacket(server, packetData, server._vehicles);
        vehicle.setTurboState(server, client, false);
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

  sendRemoveEffectPacket(
    server: ZoneServer2016,
    packetData: EffectRemoveEffect,
    dictionary: EntityDictionary<BaseEntity>
  ) {
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
        targetCharacterId: packetData.unknownData2.characterId
        //unknownVector1: [0, 0, 0, 0]
      }
    );
  }

  deactivateAbility(server: ZoneServer2016, client: Client, abilityId: number) {
    server.sendData(client, "Abilities.DeactivateAbility", {
      abilityId: abilityId,
      unknownDword1: 3
    });
    server.sendData(client, "Abilities.UninitAbility", {
      unknownDword1: 4,
      abilityId: abilityId,
      unknownDword2: 3
    });
  }
}
