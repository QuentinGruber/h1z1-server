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

import { Abilities } from "../models/enums";
import { ZoneClient2016 as Client } from "../classes/zoneclient";
import { ZoneServer2016 } from "../zoneserver";
import { Vehicle2016 } from "h1z1-server/src/servers/ZoneServer2016/entities/vehicle";
const abilities = require("../../../../data/2016/dataSources/Abilities.json"),
  vehicleAbilities = require("../../../../data/2016/dataSources/VehicleAbilities.json");

export class AbilitiesManager {
  sendVehicleAbilities(server: ZoneServer2016, client: Client) {
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
}
