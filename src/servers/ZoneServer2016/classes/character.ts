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

import { Character } from "../../ZoneServer2015/classes/character";
import {
  characterEquipment,
  loadoutItem,
  loadoutContainer,
} from "../../../types/zoneserver";
import { ZoneClient2016 } from "./zoneclient";
import { ZoneServer2016 } from "../zoneserver";

export class Character2016 extends Character {
  resources: {
    health: number;
    stamina: number;
    virus: number;
    food: number;
    water: number;
    comfort: number;
    bleeding: number;
  };
  actorModelId!: number;
  headActor!: string;
  hairModel!: string;
  isRespawning: boolean = false;
  gender!: number;
  creationDate!: string;
  lastLoginDate!: string;
  _loadout: { [loadoutSlotId: number]: loadoutItem } = {};
  currentLoadoutSlot: number = 7; //fists
  _equipment: { [equipmentSlotId: number]: characterEquipment } = {};
  _containers: { [loadoutSlotId: number]: loadoutContainer } = {};
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
    this.resources = {
      health: 10000,
      stamina: 50,
      food: 5000,
      water: 5000,
      virus: 0,
      comfort: 6000,
      bleeding: -40,
    };
    this.timeouts = {};
    this.starthealingInterval = (
      client: ZoneClient2016,
      server: ZoneServer2016
    ) => {
      client.character.healingInterval = setTimeout(() => {
        if (!server._clients[client.sessionId]) {
          return;
        }
        client.character.resources.health += 100;
        if (client.character.resources.health > 10000) {
          client.character.resources.health = 10000;
        }

        server.updateResource(
          client,
          client.character.characterId,
          client.character.resources.health,
          1,
          1
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
      client.character.resourcesUpdater = setTimeout(() => {
        // prototype resource manager
        if (!server._clients[client.sessionId]) {
          return;
        }
        const { stamina, food, water, virus, health, bleeding } =
          client.character.resources;
        const { isRunning } = client.character;
        if (isRunning) {
          client.character.resources.stamina -= 20;
          client.character.isExhausted =
            client.character.resources.stamina < 120;
        } else if (!client.character.isBleeding || !client.character.isMoving) {
          client.character.resources.stamina += 30;
        }

        // if we had a packets we could modify sprint stat to 0
        // or play exhausted sounds etc
        client.character.resources.food -= 10;
        client.character.resources.water -= 20;
        if (client.character.resources.stamina > 600) {
          client.character.resources.stamina = 600;
        } else if (client.character.resources.stamina < 0) {
          client.character.resources.stamina = 0;
        }
        if (client.character.resources.bleeding > 0) {
          server.playerDamage(
            client,
            Math.ceil(client.character.resources.bleeding / 40) * 100
          );
        }
        if (client.character.resources.bleeding > 80) {
          client.character.resources.bleeding = 80;
        }
        if (client.character.resources.bleeding < -40) {
          client.character.resources.bleeding = -40;
        }
        if (client.character.resources.food > 10000) {
          client.character.resources.food = 10000;
        } else if (client.character.resources.food < 0) {
          client.character.resources.food = 0;
          server.playerDamage(client, 100);
        }
        if (client.character.resources.water > 10000) {
          client.character.resources.water = 10000;
        } else if (client.character.resources.water < 0) {
          client.character.resources.water = 0;
          server.playerDamage(client, 100);
        }
        if (client.character.resources.health > 10000) {
          client.character.resources.health = 10000;
        } else if (client.character.resources.health < 0) {
          client.character.resources.health = 0;
        }

        if (client.character.resources.food != food) {
          server.updateResourceToAllWithSpawnedCharacter(
            client,
            client.character.characterId,
            client.character.resources.food,
            4,
            4
          );
        }
        if (client.character.resources.water != water) {
          server.updateResourceToAllWithSpawnedCharacter(
            client,
            client.character.characterId,
            client.character.resources.water,
            5,
            5
          );
        }
        if (client.character.resources.health != health) {
          server.updateResourceToAllWithSpawnedCharacter(
            client,
            client.character.characterId,
            client.character.resources.health,
            1,
            1
          );
        }
        if (client.character.resources.virus != virus) {
          server.updateResourceToAllWithSpawnedCharacter(
            client,
            client.character.characterId,
            client.character.resources.virus,
            12,
            12
          );
        }
        if (client.character.resources.stamina != stamina) {
          server.updateResourceToAllWithSpawnedCharacter(
            client,
            client.character.characterId,
            client.character.resources.stamina,
            6,
            6
          );
        }
        if (client.character.resources.bleeding != bleeding) {
          server.updateResourceToAllWithSpawnedCharacter(
            client,
            client.character.characterId,
            client.character.resources.bleeding > 0
              ? client.character.resources.bleeding
              : 0,
            21,
            21
          );
        }

        client.character.resourcesUpdater.refresh();
      }, 3000);
    };
  }
}
