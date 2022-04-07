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

import { ResourceIds } from "../enums";
import { ZoneClient2016 } from "./zoneclient";
import { ZoneServer2016 } from "../zoneserver";
import { BaseFullCharacter } from "./basefullcharacter";

export class Character2016 extends BaseFullCharacter {
  guid?: string;
  name?: string;
  spawnLocation?: string;
  resourcesUpdater?: any;
  factionId = 2;
  godMode = false;
  characterStates: any;
  isRunning = false;
  isHidden = false;
  isBleeding = false;
  isBandaged = false;
  isExhausted = false;
  isAlive = true;
  isSonic = false;
  isMoving = false;
  actorModelId!: number;
  headActor!: string;
  hairModel!: string;
  isRespawning = false;
  gender!: number;
  creationDate!: string;
  lastLoginDate!: string;
  currentLoadoutSlot = 7; //fists
  loadoutId = 3; // character
  startRessourceUpdater: any;
  healingInterval?: any;
  healingTicks: number;
  healingMaxTicks: number;
  starthealingInterval: any;
  timeouts: any;
  hasConveys: boolean = false;
  constructor(characterId: string, generatedTransient: number) {
    super(characterId, generatedTransient);
    this.healingTicks = 0;
    this.healingMaxTicks = 0;
    this._resources = {
      [ResourceIds.HEALTH]: 10000,
      [ResourceIds.STAMINA]: 600,
      [ResourceIds.HUNGER]: 10000,
      [ResourceIds.HYDRATION]: 10000,
      [ResourceIds.VIRUS]: 0,
      [ResourceIds.COMFORT]: 5000,
      [ResourceIds.BLEEDING]: -40,
    },
    this.characterStates = {
      knockedOut: false,
      inWater: false,
    }
    this.timeouts = {};
    this.starthealingInterval = (
      client: ZoneClient2016,
      server: ZoneServer2016
    ) => {
      client.character.healingInterval = setTimeout(() => {
        if (!server._clients[client.sessionId]) {
          return;
        }
        client.character._resources[ResourceIds.HEALTH] += 100;
        if (client.character._resources[ResourceIds.HEALTH] > 10000) {
          client.character._resources[ResourceIds.HEALTH] = 10000;
        }

        server.updateResource(
          client,
          client.character.characterId,
          client.character._resources[ResourceIds.HEALTH],
          ResourceIds.HEALTH
        );
        if (
          client.character.healingTicks++ < client.character.healingMaxTicks
        ) {
          client.character.healingInterval.refresh();
        } else {
          client.character.healingMaxTicks = 0;
          client.character.healingTicks = 0;
          delete client.character.healingInterval;
        }
      }, 1000);
    };

    this.startRessourceUpdater = (
      client: ZoneClient2016,
      server: ZoneServer2016
    ) => {
      const hunger = this._resources[ResourceIds.HUNGER],
      hydration = this._resources[ResourceIds.HYDRATION],
      health = this._resources[ResourceIds.HEALTH],
      virus = this._resources[ResourceIds.VIRUS],
      stamina = this._resources[ResourceIds.STAMINA],
      bleeding = this._resources[ResourceIds.BLEEDING]

      client.character.resourcesUpdater = setTimeout(() => {
        // prototype resource manager
        if (!server._clients[client.sessionId]) {
          return;
        }
        const { isRunning } = client.character;
        if (isRunning && (client.vehicle.mountedVehicle == "" || !client.vehicle.mountedVehicle)) {
          client.character._resources[ResourceIds.STAMINA] -= 20;
          client.character.isExhausted =
            client.character._resources[ResourceIds.STAMINA] < 120;
        } else if (!client.character.isBleeding || !client.character.isMoving) {
          client.character._resources[ResourceIds.STAMINA] += 30;
        }

        // if we had a packets we could modify sprint stat to 0
        // or play exhausted sounds etc
        client.character._resources[ResourceIds.HUNGER] -= 10;
        client.character._resources[ResourceIds.HYDRATION] -= 20;
        if (client.character._resources[ResourceIds.STAMINA] > 600) {
          client.character._resources[ResourceIds.STAMINA] = 600;
        } else if (client.character._resources[ResourceIds.STAMINA] < 0) {
          client.character._resources[ResourceIds.STAMINA] = 0;
        }
        if (client.character._resources[ResourceIds.BLEEDING] > 0) {
          server.playerDamage(
            client,
            Math.ceil(client.character._resources[ResourceIds.BLEEDING] / 40) * 100
          );
        }
        if (client.character._resources[ResourceIds.BLEEDING] > 80) {
          client.character._resources[ResourceIds.BLEEDING] = 80;
        }
        if (client.character._resources[ResourceIds.BLEEDING] < -40) {
          client.character._resources[ResourceIds.BLEEDING] = -40;
        }
        if (client.character._resources[ResourceIds.HUNGER] > 10000) {
          client.character._resources[ResourceIds.HUNGER] = 10000;
        } else if (client.character._resources[ResourceIds.HUNGER] < 0) {
          client.character._resources[ResourceIds.HUNGER] = 0;
          server.playerDamage(client, 100);
        }
        if (client.character._resources[ResourceIds.HYDRATION] > 10000) {
          client.character._resources[ResourceIds.HYDRATION] = 10000;
        } else if (client.character._resources[ResourceIds.HYDRATION] < 0) {
          client.character._resources[ResourceIds.HYDRATION] = 0;
          server.playerDamage(client, 100);
        }
        if (client.character._resources[ResourceIds.HEALTH] > 10000) {
          client.character._resources[ResourceIds.HEALTH] = 10000;
        } else if (client.character._resources[ResourceIds.HEALTH] < 0) {
          client.character._resources[ResourceIds.HEALTH] = 0;
        }

        if (client.character._resources[ResourceIds.HUNGER] != hunger) {
          server.updateResourceToAllWithSpawnedCharacter(
            client,
            client.character.characterId,
            client.character._resources[ResourceIds.HUNGER],
            ResourceIds.HUNGER
          );
        }
        if (client.character._resources[ResourceIds.HYDRATION] != hydration) {
          server.updateResourceToAllWithSpawnedCharacter(
            client,
            client.character.characterId,
            client.character._resources[ResourceIds.HYDRATION],
            ResourceIds.HYDRATION
          );
        }
        if (client.character._resources[ResourceIds.HEALTH] != health) {
          server.updateResourceToAllWithSpawnedCharacter(
            client,
            client.character.characterId,
            client.character._resources[ResourceIds.HEALTH],
            ResourceIds.HEALTH
          );
        }
        if (client.character._resources[ResourceIds.VIRUS] != virus) {
          server.updateResourceToAllWithSpawnedCharacter(
            client,
            client.character.characterId,
            client.character._resources[ResourceIds.VIRUS],
            ResourceIds.VIRUS
          );
        }
        if (client.character._resources[ResourceIds.STAMINA] != stamina) {
          server.updateResourceToAllWithSpawnedCharacter(
            client,
            client.character.characterId,
            client.character._resources[ResourceIds.STAMINA],
            ResourceIds.STAMINA
          );
        }
        if (client.character._resources[ResourceIds.BLEEDING] != bleeding) {
          server.updateResourceToAllWithSpawnedCharacter(
            client,
            client.character.characterId,
            client.character._resources[ResourceIds.BLEEDING] > 0
              ? client.character._resources[ResourceIds.BLEEDING]
              : 0,
              ResourceIds.BLEEDING
          );
        }

        client.character.resourcesUpdater.refresh();
      }, 3000);
    };
  }
}
