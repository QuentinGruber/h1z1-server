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

import { ZoneServer2016 } from "../zoneserver";
const Z1_doors = require("../../../../data/2016/zoneData/Z1_doors.json");
const Z1_items = require("../../../../data/2016/zoneData/Z1_items.json");
const Z1_vehicles = require("../../../../data/2016/zoneData/Z1_vehicleLocations.json");
const Z1_npcs = require("../../../../data/2016/zoneData/Z1_npcs.json");
const Z1_lootableProps = require("../../../../data/2016/zoneData/Z1_lootableProps.json");
const models = require("../../../../data/2016/dataSources/Models.json");
const bannedZombieModels = require("../../../../data/2016/sampleData/bannedZombiesModels.json");
import {
  _,
  eul2quat,
  generateRandomGuid,
  isPosInRadius,
  randomIntFromInterval,
} from "../../../utils/utils";
import { EquipSlots, Items } from "../models/enums";
import { Vehicle2016 } from "../classes/vehicle";
import { LootDefinition } from "types/zoneserver";
import { ItemObject } from "../classes/itemobject";
import { DoorEntity } from "../classes/doorentity";
import { Zombie } from "../classes/zombie";
import { BaseFullCharacter } from "../classes/basefullcharacter";
import { ExplosiveEntity } from "../classes/explosiveentity";
import { lootTables, containerLootSpawners } from "../data/lootspawns";
import { BaseItem } from "../classes/baseItem";
import { Lootbag } from "../classes/lootbag";
import { LoadoutContainer } from "../classes/loadoutcontainer";
import { LootableProp } from "../classes/lootableprop";
import { ZoneClient2016 } from "../classes/zoneclient";
const debug = require("debug")("ZoneServer");

function getRandomVehicleId() {
  switch (Math.floor(Math.random() * 4)) {
    case 0: // offroader
      return 7225;
    case 1: // policecar
      return 9301;
    case 2: // pickup
      return 9258;
    case 3: // atv
      return 9588;
    default:
      // pickup
      return 9258;
  }
}

function getRandomItem(items: Array<LootDefinition>) {
  //return items[Math.floor(Math.random() * items.length)];
  //items[0].

  const totalWeight = items.reduce((total, item) => total + item.weight, 0),
    randomWeight = Math.random() * totalWeight;
  let currentWeight = 0;

  for (let i = 0; i < items.length; i++) {
    currentWeight += items[i].weight;
    if (currentWeight > randomWeight) {
      return items[i];
    }
  }

  // This line should never be reached, but is included for type safety
  return;
}

export class WorldObjectManager {
  _spawnedNpcs: { [spawnerId: number]: string } = {};
  _spawnedLootObjects: { [spawnerId: number]: string } = {};
  vehicleSpawnCap: number = 100;

  private lastLootRespawnTime: number = 0;
  private lastVehicleRespawnTime: number = 0;
  private lastNpcRespawnTime: number = 0;
  lootRespawnTimer: number = 600000; // 10 minutes
  vehicleRespawnTimer: number = 600000; // 10 minutes // 600000
  npcRespawnTimer: number = 600000; // 10 minutes
  // items get despawned after x minutes
  itemDespawnTimer: number = 1800000; // 30 minutes
  deadNpcDespawnTimer: number = 600000; // 10 minutes

  // objects won't spawn if another object is within this radius
  vehicleSpawnRadius: number = 50;
  npcSpawnRadius: number = 3;
  chanceNpc: number = 100;
  chanceScreamer: number = 5; // 1000 max

  private zombieSlots = [
    EquipSlots.HEAD,
    EquipSlots.CHEST,
    EquipSlots.LEGS,
    EquipSlots.HANDS,
    EquipSlots.FEET,
    EquipSlots.HAIR,
  ];

  run(server: ZoneServer2016) {
    debug("WOM::Run");
    if (this.lastLootRespawnTime + this.lootRespawnTimer <= Date.now()) {
      //this.createLootOld(server);
      this.createLoot(server);
      this.createContainerLoot(server)
      this.lastLootRespawnTime = Date.now();
    }
    if (this.lastNpcRespawnTime + this.npcRespawnTimer <= Date.now()) {
      this.createNpcs(server);
      this.lastNpcRespawnTime = Date.now();
    }
    if (this.lastVehicleRespawnTime + this.vehicleRespawnTimer <= Date.now()) {
      this.createVehicles(server);
      this.lastVehicleRespawnTime = Date.now();
    }
  }
  private equipRandomSkins(
    server: ZoneServer2016,
    entity: BaseFullCharacter,
    slots: EquipSlots[],
    excludedModels: string[] = []
  ): void {
    server.generateRandomEquipmentsFromAnEntity(entity, slots, excludedModels);
  }
  createZombie(
    server: ZoneServer2016,
    modelId: number,
    position: Float32Array,
    rotation: Float32Array,
    spawnerId: number = 0
  ) {
    const characterId = generateRandomGuid();
    const zombie = new Zombie(
      characterId,
      server.getTransientId(characterId),
      modelId,
      position,
      rotation,
      spawnerId
    );
    this.equipRandomSkins(server, zombie, this.zombieSlots, bannedZombieModels);
    server._npcs[characterId] = zombie;
    if (spawnerId) this._spawnedNpcs[spawnerId] = characterId;
  }

  createLootEntity(
    server: ZoneServer2016,
    item: BaseItem | undefined,
    position: Float32Array,
    rotation: Float32Array,
    itemSpawnerId: number = -1
  ): ItemObject | undefined {
    if (!item) {
      debug(`[ERROR] Tried to createLootEntity with invalid item object`);
      return;
    }
    const itemDef = server.getItemDefinition(item.itemDefinitionId);
    if (!itemDef) {
      debug(
        `[ERROR] Tried to createLootEntity for invalid itemDefId: ${item.itemDefinitionId}`
      );
      return;
    }
    const characterId = generateRandomGuid(),
      modelId = itemDef.WORLD_MODEL_ID || 9;
    server._spawnedItems[characterId] = new ItemObject(
      characterId,
      server.getTransientId(characterId),
      modelId,
      position,
      rotation,
      itemSpawnerId || 0,
      item
    );
    if (
      item.itemDefinitionId === Items.FUEL_ETHANOL ||
      item.itemDefinitionId === Items.FUEL_BIOFUEL
    ) {
      server._spawnedItems[characterId].flags.projectileCollision = 1;
      server._explosives[characterId] = new ExplosiveEntity(
        characterId,
        server.getTransientId(characterId),
        modelId,
        position,
        rotation,
        item.itemDefinitionId
      );
    }
    if (itemSpawnerId) this._spawnedLootObjects[itemSpawnerId] = characterId;
    server._spawnedItems[characterId].creationTime = Date.now();
    return server._spawnedItems[characterId];
  }

  createLootbag(server: ZoneServer2016, entity: BaseFullCharacter) {
    const characterId = generateRandomGuid(),
      isCharacter = !!server._characters[entity.characterId];

    const items: { [itemGuid: string]: BaseItem } = {};
    Object.values(entity._loadout).forEach((item) => {
      if (
        item.itemGuid != "0x0" &&
        !entity.isDefaultItem(item.itemDefinitionId) &&
        !server.isAdminItem(item.itemDefinitionId)
      ) {
        items[item.itemGuid] = _.cloneDeep(item);
        items[item.itemGuid].slotId = Object.keys(items).length + 1;
      }
    });

    Object.values(entity._containers).forEach((container: LoadoutContainer) => {
      Object.values(container.items).forEach((item) => {
        if (!isCharacter || !entity.isDefaultItem(item.itemDefinitionId)) {
          let stacked = false;
          for (const i of Object.values(items)) {
            // stack similar items
            if (
              i.itemDefinitionId == item.itemDefinitionId &&
              server.isStackable(item.itemDefinitionId)
            ) {
              items[i.itemGuid].stackCount += item.stackCount;
              stacked = true;
              break;
            }
          }
          if (!stacked) {
            items[item.itemGuid] = _.cloneDeep(item);
            items[item.itemGuid].slotId = Object.keys(items).length + 1;
          }
        }
      });
    });

    if (!_.size(items)) return; // don't spawn lootbag if inventory is empty

    const lootbag = new Lootbag(
      characterId,
      server.getTransientId(characterId),
      isCharacter ? 9581 : 9391,
      entity.state.position,
      new Float32Array([0, 0, 0, 0])
    );

    lootbag.equipItem(
      server,
      server.generateItem(Items.CONTAINER_DROPPED_ITEMS),
      false
    );
    const container = lootbag.getContainer();
    if (container) {
      container.items = items;
    }

    server._lootbags[characterId] = lootbag;
  }

  createProps(server: ZoneServer2016) {
      Z1_lootableProps.forEach((propType: any) => {
            propType.instances.forEach((propInstance: any) => {
                const characterId = generateRandomGuid();
                const obj = new LootableProp(
                    characterId,
                    server.getTransientId(characterId), // need transient generated for Interaction Replication
                    propInstance.modelId,
                    propInstance.position,
                    propInstance.rotation,
                    propInstance.scale,
                    propInstance.id,
                    propType.renderDistance,
                );
                server._lootableProps[characterId] = obj
                obj.equipItem(server, server.generateItem(obj.containerId), false);
                obj._containers['31'].canAcceptItems = false;
            });
        });
        debug("All props created");
    }

  private createDoor(
    server: ZoneServer2016,
    modelID: number,
    position: Float32Array,
    rotation: Float32Array,
    scale: Float32Array,
    spawnerId: number
  ) {
    const characterId = generateRandomGuid();
    server._doors[characterId] = new DoorEntity(
      characterId,
      server.getTransientId(characterId),
      modelID,
      position,
      rotation,
      scale,
      spawnerId
    );
  }

  createDoors(server: ZoneServer2016) {
    Z1_doors.forEach((doorType: any) => {
      const modelId: number = _.find(models, (model: any) => {
        return (
          model.MODEL_FILE_NAME ===
          doorType.actorDefinition.replace("_Placer", "")
        );
      })?.ID;
      doorType.instances.forEach((doorInstance: any) => {
        this.createDoor(
          server,
          modelId ? modelId : 9183,
          doorInstance.position,
          doorInstance.rotation,
          doorInstance.scale ?? [1, 1, 1, 1],
          doorInstance.id
        );
      });
    });
    debug("All doors objects created");
  }

  createVehicle(server: ZoneServer2016, vehicle: Vehicle2016) {
    vehicle.equipLoadout(server);

    // TODO - Randomize these
    vehicle.equipItem(server, server.generateItem(vehicle.getTurboItemId()));
    vehicle.equipItem(
      server,
      server.generateItem(vehicle.getHeadlightsItemId())
    );
    vehicle.equipItem(server, server.generateItem(Items.BATTERY));
    vehicle.equipItem(server, server.generateItem(Items.SPARKPLUGS));
    server._vehicles[vehicle.characterId] = vehicle;
  }

  createVehicles(server: ZoneServer2016) {
    if (Object.keys(server._vehicles).length >= this.vehicleSpawnCap) return;
    Z1_vehicles.forEach((vehicle: any) => {
      let spawn = true;
      Object.values(server._vehicles).every((spawnedVehicle: Vehicle2016) => {
        if (
          isPosInRadius(
            this.vehicleSpawnRadius,
            vehicle.position,
            spawnedVehicle.state.position
          )
        ) {
          spawn = false;
          return false;
        }
        return true;
      });
      if (!spawn) return;

      const characterId = generateRandomGuid(),
        vehicleData = new Vehicle2016(
          characterId,
          server.getTransientId(characterId),
          getRandomVehicleId(),
          new Float32Array(vehicle.position),
          new Float32Array(vehicle.rotation),
          server.getGameTime()
        );

      this.createVehicle(server, vehicleData); // save vehicle
    });
    debug("All vehicles created");
  }

  createNpcs(server: ZoneServer2016) {
    // This is only for giving the world some life
    Z1_npcs.forEach((spawnerType: any) => {
      const authorizedModelId: number[] = [];
      switch (spawnerType.actorDefinition) {
        case "NPCSpawner_ZombieLazy.adr":
          authorizedModelId.push(9510);
          authorizedModelId.push(9634);
          break;
        case "NPCSpawner_ZombieWalker.adr":
          authorizedModelId.push(9510);
          authorizedModelId.push(9634);
          break;
        case "NPCSpawner_Deer001.adr":
          authorizedModelId.push(9002);
          break;
        default:
          break;
      }
      if (!authorizedModelId.length) return;
      spawnerType.instances.forEach((npcInstance: any) => {
        let spawn = true;
        Object.values(server._npcs).every((spawnedNpc: Zombie) => {
          if (
            isPosInRadius(
              this.npcSpawnRadius,
              npcInstance.position,
              spawnedNpc.state.position
            )
          ) {
            spawn = false;
            return false;
          }
          return true;
        });
        if (!spawn) return;
        const spawnchance = Math.floor(Math.random() * 100) + 1; // temporary spawnchance
        if (spawnchance <= this.chanceNpc) {
          const screamerChance = Math.floor(Math.random() * 1000) + 1; // temporary spawnchance
          if (screamerChance <= this.chanceScreamer) {
            authorizedModelId.push(9667);
          }
          this.createZombie(
            server,
            authorizedModelId[
              Math.floor(Math.random() * authorizedModelId.length)
            ],
            npcInstance.position,
            new Float32Array(eul2quat(npcInstance.rotation)),
            npcInstance.id
          );
        }
      });
    });
    debug("All npcs objects created");
  }

  createLoot(server: ZoneServer2016, lTables = lootTables) {
    // temp logic until item weights are added
    Z1_items.forEach((spawnerType: any) => {
      const lootTable = lTables[spawnerType.actorDefinition];
      if (lootTable) {
        spawnerType.instances.forEach((itemInstance: any) => {
          if (this._spawnedLootObjects[itemInstance.id]) return;
          const chance = Math.floor(Math.random() * 100) + 1; // temporary spawnchance
          if (chance <= lootTable.spawnChance) {
            // temporary spawnchance
            const item = getRandomItem(lootTable.items);
            if (item) {
              this.createLootEntity(
                server,
                server.generateItem(
                  item.item,
                  randomIntFromInterval(
                    item.spawnCount.min,
                    item.spawnCount.max
                  )
                ),
                itemInstance.position,
                itemInstance.rotation,
                itemInstance.id
              );
            }
          }
        });
      }
    });
  }
    createContainerLoot(server: ZoneServer2016) {
        for (const a in server._lootableProps) {
            const prop = server._lootableProps[a] as LootableProp;
            if (!!Object.keys(prop._containers['31'].items).length) continue; // skip if container is not empty
            const lootTable = containerLootSpawners[prop.lootSpawner];
            if (lootTable) {
                for (let x = 0; x < lootTable.maxItems; x++) {
                    const item = getRandomItem(lootTable.items);
                    if (!item) continue
                    const chance = Math.floor(Math.random() * 100) + 1; // temporary spawnchance
                    let allow = true;
                    Object.values(prop._containers['31'].items).forEach((spawnedItem: BaseItem) => {
                        if (item.item == spawnedItem.itemDefinitionId) allow = false // dont allow the same item to be added twice
                    });
                    if (allow) {
                        if (chance <= item.weight) {
                            const count = Math.floor(Math.random() * (item.spawnCount.max - item.spawnCount.min + 1) + item.spawnCount.min)
                            // temporary spawnchance                       
                            server.addContainerItem(
                                prop,
                                server.generateItem(item.item),
                                prop._containers['31'],
                                count,
                                false
                            );
                        }
                    } else {
                        x--;
                    }
                }
            }
            if (Object.keys(prop._containers['31'].items).length != 0) { // mark prop as unsearched for clients
                Object.values(server._clients).forEach((client: ZoneClient2016) => {
                        const index = client.searchedProps.indexOf(prop);
                        if (index > -1) {
                            client.searchedProps.splice(index, 1);
                        }
                })
            }
        }
  }

}
