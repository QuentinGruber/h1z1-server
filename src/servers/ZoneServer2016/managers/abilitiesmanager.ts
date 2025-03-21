// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2025 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

import {
  Abilities,
  AbilityIds,
  Effects,
  Items,
  MaterialTypes,
  MeleeTypes,
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
  CharacterRemoveEffectTagCompositeEffect,
  EffectAddEffect,
  EffectRemoveEffect
} from "types/zone2016packets";
import { DamageInfo, EntityDictionary } from "types/zoneserver";
import { LoadoutItem } from "../classes/loadoutItem";
import { Npc } from "../entities/npc";
const vehicleAbilities = require("../../../../data/2016/dataSources/VehicleAbilities.json");

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
    const hitLocation = (packetData.abilityData as any)?.hitLocation;
    client.character.checkCurrentInteractionGuid();
    const characterId =
      (packetData.abilityData as any)?.hitLocation ??
      client.character.currentInteractionGuid;

    if (hitLocation) {
      client.character.abilityInitTime = Date.now();
      client.character.meleeHit = {
        abilityHitLocation: hitLocation,
        characterId: characterId
      };
      return;
    }
    switch (packetData.abilityId) {
      case AbilityIds.NV_GOGGLES:
        const index = client.character.screenEffects.indexOf("NIGHTVISION");
        if (index <= -1) {
          if (
            client.character._loadout[29] &&
            client.character._loadout[29].itemDefinitionId == Items.NV_GOGGLES
          ) {
            client.character.screenEffects.push("NIGHTVISION");
            server.addScreenEffect(
              client,
              server._screenEffects["NIGHTVISION"]
            );
          }
        } else {
          client.character.screenEffects.splice(index, 1);
          server.removeScreenEffect(
            client,
            server._screenEffects["NIGHTVISION"]
          );
        }
        this.deactivateAbility(server, client, AbilityIds.NV_GOGGLES, 3, 3);
        return;
    }

    const vehicle = server._vehicles[client.vehicle.mountedVehicle ?? ""],
      isDriver = vehicle?.getDriver(server) == client.character;
    if (!vehicle || !isDriver) {
      client.character.abilityInitTime = Date.now();
      return;
    }
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
        vehicle.setHeadlightState(server, true, client);
        break;
      case Abilities.VEHICLE_SIREN:
        vehicle.setSirenState(server, true, client);
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
        vehicle.setHeadlightState(server, false, client);
        break;
      case Abilities.VEHICLE_SIREN:
        vehicle.setSirenState(server, false, client);
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
    if (!client.character.abilityInitTime) {
      // This happen a lot in production but i'm unable to reproduce it
      // Maybe sometimes the hitLocation field in abilityInit is empty
      // console.log(
      //   `${client.character.characterId} tried to update a non-initialized ability!`
      // );
      return;
    }
    client.character.checkCurrentInteractionGuid();
    const weaponItem = client.character.getEquippedWeapon();
    if (!weaponItem) return;

    this.handleMeleeHit(server, client, entity, weaponItem);
    client.character.meleeHit = {
      abilityHitLocation: "",
      characterId: ""
    };
  }

  handleMeleeHit(
    server: ZoneServer2016,
    client: Client,
    entity: BaseEntity,
    weaponItem: LoadoutItem
  ) {
    client.character.abilityInitTime = 0;
    if (!weaponItem.weapon) return;

    if (
      entity instanceof Npc &&
      entity.isAlive &&
      server.isHeadshotOnly &&
      client.character.meleeHit.abilityHitLocation != "HEAD"
    )
      return;
    // Zombies should be able to get hit anywhere when they're dead even if the gamerule is headshot only.

    // TODO: CHECK MELEE BLOCK TIME FOR EACH WEAPON
    // CHECK MELEE RANGE ALSO

    //if (client.character.meleeBlocked()) return true;
    client.character.lastMeleeHitTime = Date.now();

    // TODO: calculate this based on melee weapondefinition
    const baseDamage = 1000;
    if (entity instanceof BaseLightweightCharacter && entity.flags.knockedOut)
      return;
    let effectString = "MAT_";
    let meleeType: number;
    let damage = baseDamage;
    switch (weaponItem.itemDefinitionId) {
      case Items.WEAPON_MACHETE01:
      case Items.WEAPON_AXE_FIRE:
      case Items.WEAPON_AXE_WOOD:
      case Items.WEAPON_HATCHET:
      case Items.WEAPON_HATCHET_MAKESHIFT:
      case Items.WEAPON_KATANA:
      case Items.WEAPON_HISREGARD_MACHETE:
        effectString += "Blade_ForehandSlash";
        meleeType = MeleeTypes.BLADE;
        damage *= 3;
        break;
      case Items.WEAPON_BAT_ALUM:
      case Items.WEAPON_BAT_WOOD:
      case Items.WEAPON_MOURNING_WOOD:
      case Items.WEAPON_BRANCH:
      case Items.WEAPON_CROWBAR:
      case Items.WEAPON_HAMMER:
      case Items.WEAPON_HAMMER_DEMOLITION:
      case Items.WEAPON_PIPE:
      case Items.WEAPON_WRENCH:
        effectString += "Blunt_ForehandChop";
        meleeType = MeleeTypes.BLUNT;
        damage *= 2;
        break;
      case Items.WEAPON_COMBATKNIFE:
      case Items.SKINNING_KNIFE:
      case Items.WEAPON_TOXIC_COMBATKNIFE:
        effectString += "Knife_ForehandSlash";
        meleeType = MeleeTypes.KNIFE;
        damage *= 3;
        break;
      case Items.WEAPON_GUITAR:
        effectString += "Guitar_ForehandSlash";
        meleeType = MeleeTypes.GUITAR;
        damage *= 2;
        break;
      default:
        effectString += "Fists_RightHook";
        meleeType = MeleeTypes.FISTS;
        break;
    }
    switch (client.character.meleeHit.abilityHitLocation) {
      case "HEAD":
      case "GLASSES":
      case "NECK":
        damage *= 2;
        break;
    }
    const damageInfo: DamageInfo = {
      entity: client.character.characterId,
      weapon: weaponItem.itemDefinitionId,
      damage: damage, // need to figure out a good number for this
      causeBleed: false, // another method for melees to apply bleeding
      meleeType: meleeType,
      hitReport: {
        sessionProjectileCount: 0,
        characterId: client.character.characterId,
        position: client.character.state.position,
        unknownFlag1: 0,
        unknownByte2: 0,
        totalShotCount: 0,
        hitLocation: client.character.meleeHit.abilityHitLocation
      }
    };
    entity.OnMeleeHit(server, damageInfo);
    if (
      entity.materialType != MaterialTypes.ZOMBIE &&
      entity.materialType != MaterialTypes.FLESH
    )
      return;
    const effectId: Effects = Effects[effectString as keyof typeof Effects];
    const dictionary = server.getEntityDictionary(entity.characterId);
    if (!dictionary) return;
    if (entity.effectTags.includes(effectId)) {
      server.sendDataToAllWithSpawnedEntity<CharacterRemoveEffectTagCompositeEffect>(
        dictionary,
        entity.characterId,
        "Character.RemoveEffectTagCompositeEffect",
        {
          characterId: entity.characterId,
          newEffectId: 0,
          effectId: effectId
        }
      );
    } else {
      entity.effectTags.push(effectId);
    }
    server.sendDataToAllWithSpawnedEntity<CharacterAddEffectTagCompositeEffect>(
      dictionary,
      entity.characterId,
      "Character.AddEffectTagCompositeEffect",
      {
        characterId: entity.characterId,
        unknownDword1: effectId,
        effectId: effectId,
        unknownGuid: client.character.characterId,
        unknownDword2: 3
      }
    );
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
          animationName: animationName,
          animationType: ""
        }
      );
      return;
    }
    const vehicleAbilityEffectId = packetData.effectData.abilityEffectId1,
      vehicle = server._vehicles[client.vehicle.mountedVehicle ?? ""];
    if (!vehicle) return;

    switch (vehicleAbilityEffectId) {
      case VehicleEffects.MOTOR_RUN_OFFROADER_1:
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
      vehicle = server._vehicles[packetData.targetCharacterId ?? ""];
    if (!vehicle) return;

    switch (vehicleAbilityEffectId) {
      case VehicleEffects.MOTOR_RUN_OFFROADER_1:
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
      packetData.targetCharacterData.characterId,
      "Effect.RemoveEffect",
      {
        abilityEffectData: {
          unknownDword1: 4,
          abilityEffectId1: packetData.abilityEffectData.abilityEffectId1,
          abilityEffectId2: packetData.abilityEffectData.abilityEffectId2
        },
        targetCharacterData: {
          characterId: packetData.targetCharacterId
        },
        guid2: "0x0",
        targetCharacterId: packetData.targetCharacterData.characterId
        //unknownVector1: [0, 0, 0, 0]
      }
    );
  }

  deactivateAbility(
    server: ZoneServer2016,
    client: Client,
    abilityId: number,
    unk1?: number,
    unk2?: number
  ) {
    server.sendData(client, "Abilities.UninitAbility", {
      unknownDword1: unk1 ?? 4,
      abilityId: abilityId,
      unknownDword2: unk2 ?? 3
    });
  }
}
