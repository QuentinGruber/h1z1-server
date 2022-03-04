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

import { Character } from "../../ZoneServer/classes/character";
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
  startRessourceUpdater : any
  constructor(characterId: string, generatedTransient: number) {
    super(characterId, generatedTransient);
    this.resources = {
      health: 5000,
      stamina: 50,
      food: 5000,
      water: 5000,
      virus: 6000,
      comfort: 6000,
    };

    this.startRessourceUpdater = (client: ZoneClient2016, server: ZoneServer2016)=> {
      client.character.resourcesUpdater = setTimeout(() => {
        // prototype resource manager
        const { isRunning } = client.character;
        if (isRunning) {
          client.character.resources.stamina -= 20;
          client.character.isExhausted = client.character.resources.stamina < 120;
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
        // Prototype bleeding
        if (client.character.isBleeding && client.character.isAlive) {
          if (!client.character.isBandaged) {
            server.playerDamage(client, 100);
          }
          if (client.character.isBandaged) {
            client.character.resources.health += 100;
            server.updateResource(
              client,
              client.character.characterId,
              client.character.resources.health,
              1,
              1
            );
          }
          if (client.character.resources.health >= 2000) {
            client.character.isBleeding = false;
          }
          if (client.character.resources.stamina > 130 && isRunning) {
            client.character.resources.stamina -= 100;
          }
  
          if (
            client.character.resources.health < 10000 &&
            !client.character.isBleeding &&
            client.character.isBandaged
          ) {
            client.character.resources.health += 400;
            server.updateResource(
              client,
              client.character.characterId,
              client.character.resources.health,
              1,
              1
            );
          }
          if (client.character.resources.health >= 10000) {
            client.character.isBandaged = false;
          }
        }
        if (client.character.isBleeding && !client.character.isAlive) {
          client.character.isBleeding = false;
        }
        const { stamina, food, water, virus } = client.character.resources;
        server.updateResource(client, client.character.characterId, stamina, 6, 6);
        server.updateResource(client, client.character.characterId, food, 4, 4);
        server.updateResource(client, client.character.characterId, water, 5, 5);
        server.updateResource(client, client.character.characterId, virus, 12, 12);
        client.character.resourcesUpdater.refresh();
      }, 3000);
    }
  }
}
