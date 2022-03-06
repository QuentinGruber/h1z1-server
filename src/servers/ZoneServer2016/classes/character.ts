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
  constructor(characterId: string, generatedTransient: number) {
    super(characterId, generatedTransient);
    this.healingTicks = 0;
    this.healingMaxTicks = 0;
    this.resources = {
      health: 5000,
      stamina: 50,
      food: 5000,
      water: 5000,
      virus: 0,
      comfort: 6000,
      bleeding: -40,
    };

    this.starthealingInterval = (
      client: ZoneClient2016,
      server: ZoneServer2016
    ) => {
      client.character.healingInterval = setTimeout(() => {
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
          client.character.resources.health -= 100;
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
        const { stamina, food, water, virus, health, bleeding } =
          client.character.resources;
        server.sendData(client, "ResourceEvent", {
          eventData: {
            type: 1,
            value: {
              characterId: client.character.characterId,
              characterResources: [
                {
                  resourceId: 6,
                  resourceData: {
                    resourceId: 6,
                    resourceType: 6,
                    value: stamina,
                  },
                },
                {
                  resourceId: 4,
                  resourceData: {
                    resourceId: 4,
                    resourceType: 4,
                    value: food,
                  },
                },
                {
                  resourceId: 5,
                  resourceData: {
                    resourceId: 5,
                    resourceType: 5,
                    value: water,
                  },
                },
                {
                  resourceId: 12,
                  resourceData: {
                    resourceId: 12,
                    resourceType: 12,
                    value: virus,
                  },
                },
                {
                  resourceId: 1,
                  resourceData: {
                    resourceId: 1,
                    resourceType: 1,
                    value: health,
                  },
                },
                {
                  resourceId: 21,
                  resourceData: {
                    resourceId: 21,
                    resourceType: 21,
                    value: bleeding > 0 ? bleeding : 0,
                  },
                },
              ],
            },
          },
        });

        client.character.resourcesUpdater.refresh();
      }, 3000);
    };
  }
}
