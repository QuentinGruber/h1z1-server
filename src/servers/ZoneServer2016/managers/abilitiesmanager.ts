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
import { BaseLightweightCharacter } from "h1z1-server/src/servers/ZoneServer2016/entities/baselightweightcharacter";
const abilities = require("../../../../data/2016/dataSources/Abilities.json"),
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
    server.sendData(
      client,
      "Abilities.SetVehicleActivatableAbilityManager",
      vehicleAbilities
    );
  }

  processVehicleAbilityInit(
    server: ZoneServer2016,
    client: Client,
    vehicle: Vehicle2016,
    packet: any
  ) {
    switch (packet.abilityId) {
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
    packet: any
  ) {
    switch (packet.abilityId) {
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
    server.sendData(client, "Abilities.VehicleDeactivateAbility", {
      abilityId: packet.abilityId,
      unknownDword1: 12
    });
  }
  processAddEffectPacket(server: ZoneServer2016, client: Client, packet: any) {
    const effectId = packet.data.unknownData1.unknownDword2;
    let vehicle: Vehicle2016 | undefined;
    switch (effectId) {
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
    packet: any
  ) {
    const effectId = packet.data.unknownData1.unknownDword2;
    let vehicle: Vehicle2016 | undefined;
    switch (effectId) {
      case VehicleEffects.MOTOR_RUN_OFFROADER:
        if (!client.vehicle.mountedVehicle) return;
        vehicle = server._vehicles[client.vehicle.mountedVehicle];
        this.sendRemoveEffectPacket(server, packet, server._vehicles);
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
        this.sendRemoveEffectPacket(server, packet, server._vehicles);
        vehicle.turboOn = false;
        break;
    }
  }

  addEffectTag(
    server: ZoneServer2016,
    client: Client,
    entity: BaseLightweightCharacter,
    effectId: number,
    dictionary: any
  ) {
    const index = entity.effectTags.indexOf(effectId);
    if (index <= -1) {
      server.sendDataToAllOthersWithSpawnedEntity(
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
    dictionary: any
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

  sendRemoveEffectPacket(server: ZoneServer2016, packet: any, dictionary: any) {
    server.sendDataToAllWithSpawnedEntity(
      dictionary,
      packet.data.unknownData2.characterId,
      "Effect.RemoveEffect",
      {
        unknownData1: {
          unknownDword1: 4,
          unknownDword2: packet.data.unknownData1.unknownDword2,
          unknownDword3: packet.data.unknownData1.unknownDword3
        },
        unknownData2: {
          characterId: packet.data.targetCharacterId
        },
        targetCharacterId: packet.data.unknownData2.characterId,
        guid2: "0x0",
        unknownVector1: [0, 0, 0, 0]
      }
    );
  }
}
