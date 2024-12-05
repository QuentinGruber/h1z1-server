// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2024 H1emu community
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
const Z1_taskProps = require("../../../../data/2016/zoneData/Z1_taskProps.json");
const Z1_crates = require("../../../../data/2016/zoneData/Z1_crates.json");
const Z1_destroyables = require("../../../../data/2016/zoneData/Z1_destroyables.json");
const models = require("../../../../data/2016/dataSources/Models.json");
// const bannedZombieModels = require("../../../../data/2016/sampleData/bannedZombiesModels.json");
import {
  _,
  eul2quat,
  generateRandomGuid,
  isPosInRadius,
  randomIntFromInterval,
  fixEulerOrder,
  getCurrentServerTimeWrapper,
  isLootNerfedLoc
} from "../../../utils/utils";
import { EquipSlots, Items, Effects, ModelIds } from "../models/enums";
import { Vehicle2016 } from "../entities/vehicle";
import { LootDefinition } from "types/zoneserver";
import { ItemObject } from "../entities/itemobject";
import { DoorEntity } from "../entities/doorentity";
import { BaseFullCharacter } from "../entities/basefullcharacter";
import { ExplosiveEntity } from "../entities/explosiveentity";
import { lootTables, containerLootSpawners } from "../data/lootspawns";
import { BaseItem } from "../classes/baseItem";
import { Lootbag } from "../entities/lootbag";
import { LootableProp } from "../entities/lootableprop";
import { ZoneClient2016 } from "../classes/zoneclient";
import { TaskProp } from "../entities/taskprop";
import { Crate, getActorModelId } from "../entities/crate";
import { Destroyable } from "../entities/destroyable";
import { CharacterPlayWorldCompositeEffect } from "types/zone2016packets";
import { WaterSource } from "../entities/watersource";
import { TreasureChest } from "../entities/treasurechest";
import { Npc } from "../entities/npc";
//import { EntityType } from "h1emu-ai";
import { scheduler } from "node:timers/promises";
const debug = require("debug")("ZoneServer");

export function getRandomItem(items: Array<LootDefinition>) {
  const totalWeight = items.reduce((total, item) => total + item.weight, 0),
    randomWeight = Math.random() * totalWeight;
  let currentWeight = 0;

  for (let i = 0; i < items.length; i++) {
    currentWeight += items[i].weight;
    if (currentWeight > randomWeight) {
      return items[i];
    }
  }
}

export class WorldObjectManager {
  /** HashMap of all spawned NPCs in the world - uses spawnerId (number) for indexing */
  spawnedNpcs: { [spawnerId: number]: string } = {};

  /** HashMap of all spawned objects in the world - uses spawnerId (number) for indexing */
  spawnedLootObjects: { [spawnerId: number]: string } = {};

  /** Global respawn timers */
  private _lastLootRespawnTime: number = 0;
  private _lastVehicleRespawnTime: number = 0;
  private _lastNpcRespawnTime: number = 0;
  private _lastWaterSourceReplenishTime: number = 0;

  /** MANAGED BY CONFIGMANAGER - See defaultConfig.yaml for more information */
  vehicleSpawnCap!: number;
  minAirdropSurvivors!: number;
  lootRespawnTimer!: number;
  vehicleRespawnTimer!: number;
  npcRespawnTimer!: number;
  hasCustomLootRespawnTime!: boolean;
  itemDespawnTimer!: number;
  lootDespawnTimer!: number;
  deadNpcDespawnTimer!: number;
  lootbagDespawnTimer!: number;
  vehicleSpawnRadius!: number;
  npcSpawnRadius!: number;
  chanceNpc!: number;
  chanceScreamer!: number;
  chanceWornLetter!: number;
  waterSourceReplenishTimer!: number;
  waterSourceRefillAmount!: number;

  private zombieSlots = [
    EquipSlots.HEAD,
    EquipSlots.CHEST,
    EquipSlots.LEGS,
    EquipSlots.HANDS,
    EquipSlots.FEET,
    EquipSlots.HAIR
  ];
  static itemSpawnersChances: Record<string, number> = {};

  private getItemRespawnTimer(server: ZoneServer2016): void {
    if (this.hasCustomLootRespawnTime) return;

    const playerCount = _.size(server._characters);

    if (playerCount >= 100) {
      this.lootRespawnTimer = 600_000; // 10 min
    } else if (playerCount >= 75) {
      this.lootRespawnTimer = 900_000; // 15 min
    } else if (playerCount >= 50) {
      this.lootRespawnTimer = 1_200_000; // 20 min
    } else if (playerCount >= 25) {
      this.lootRespawnTimer = 1_500_000; // 25 min
    } else {
      this.lootRespawnTimer = 1_800_000; // 30 min
    }
  }

  async run(server: ZoneServer2016) {
    debug("WOM::Run");
    this.getItemRespawnTimer(server);
    if (this._lastLootRespawnTime + this.lootRespawnTimer <= Date.now()) {
      this.refillScrapInChunks(server);
      this.createLoot(server);
      this.createContainerLoot(server);
      this._lastLootRespawnTime = Date.now();
      server.divideLargeCells(700);
    }
    if (this._lastNpcRespawnTime + this.npcRespawnTimer <= Date.now()) {
      this.createNpcs(server);
      this._lastNpcRespawnTime = Date.now();
    }
    if (this._lastVehicleRespawnTime + this.vehicleRespawnTimer <= Date.now()) {
      this.createVehicles(server);
      this._lastVehicleRespawnTime = Date.now();
    }
    if (
      this._lastWaterSourceReplenishTime + this.waterSourceReplenishTimer <=
      Date.now()
    ) {
      this.replenishWaterSources(server);
      this._lastWaterSourceReplenishTime = Date.now();
    }

    this.updateQuestContainers(server);

    this.despawnEntities(server);
  }

  private async npcDespawner(server: ZoneServer2016) {
    let counter = 0;
    for (const characterId in server._npcs) {
      if (counter > 30) {
        counter = 0;
        await scheduler.wait(30);
      }
      counter++;
      const npc = server._npcs[characterId];
      // dead npc despawner
      if (
        npc &&
        npc.flags.knockedOut &&
        Date.now() - npc.deathTime >= this.deadNpcDespawnTimer
      ) {
        server.deleteEntity(npc.characterId, server._npcs);
      }
    }
  }

  private lootbagDespawner(server: ZoneServer2016) {
    for (const characterId in server._lootbags) {
      // lootbag despawner
      const lootbag = server._lootbags[characterId];
      if (Date.now() - lootbag.creationTime >= this.lootbagDespawnTimer) {
        server.deleteEntity(lootbag.characterId, server._lootbags);
      }
    }
  }

  private async itemDespawner(server: ZoneServer2016) {
    let counter = 0;
    for (const characterId in server._spawnedItems) {
      if (counter > 100) {
        counter = 0;
        await scheduler.wait(30);
      }
      counter++;
      const itemObject = server._spawnedItems[characterId];
      if (!itemObject) return;
      // dropped item despawner
      const despawnTime =
        itemObject.spawnerId == -1
          ? this.itemDespawnTimer
          : this.lootDespawnTimer;
      if (Date.now() - itemObject.creationTime >= despawnTime) {
        server.deleteEntity(itemObject.characterId, server._spawnedItems);
        switch (itemObject.item.itemDefinitionId) {
          case Items.FUEL_ETHANOL:
          case Items.FUEL_BIOFUEL:
            server.deleteEntity(itemObject.characterId, server._explosives);
            break;
        }
        if (itemObject.spawnerId != -1)
          delete this.spawnedLootObjects[itemObject.spawnerId];
        server.sendCompositeEffectToAllWithSpawnedEntity(
          server._spawnedItems,
          itemObject,
          server.getItemDefinition(itemObject.item.itemDefinitionId)
            ?.PICKUP_EFFECT ?? 5151
        );
      }
    }
  }

  private despawnEntities(server: ZoneServer2016) {
    this.npcDespawner(server);
    this.lootbagDespawner(server);
    this.itemDespawner(server);
  }

  createNpc(
    server: ZoneServer2016,
    modelId: number,
    position: Float32Array,
    rotation: Float32Array,
    spawnerId: number = 0
  ) {
    const characterId = generateRandomGuid();
    const npc = new Npc(
      characterId,
      server.getTransientId(characterId),
      modelId,
      position,
      rotation,
      server,
      spawnerId
    );

    // doesn't work anymore
    // this.equipRandomSkins(server, npc, this.zombieSlots, bannedZombieModels);
    server._npcs[characterId] = npc;
    if (spawnerId) this.spawnedNpcs[spawnerId] = characterId;
    return npc;
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
      modelId = itemDef.WORLD_MODEL_ID || 9,
      lootObj = new ItemObject(
        characterId,
        server.getTransientId(characterId),
        modelId,
        position,
        rotation,
        server,
        itemSpawnerId || 0,
        item
      );
    server._spawnedItems[characterId] = lootObj;
    server._spawnedItems[characterId].nameId = itemDef.NAME_ID;

    switch (item.itemDefinitionId) {
      case Items.FUEL_ETHANOL:
      case Items.FUEL_BIOFUEL:
        lootObj.flags.projectileCollision = 1;
        server._explosives[characterId] = new ExplosiveEntity(
          characterId,
          server.getTransientId(characterId),
          modelId,
          position,
          rotation,
          server,
          item.itemDefinitionId
        );
        break;
    }
    if (itemSpawnerId) this.spawnedLootObjects[itemSpawnerId] = characterId;
    lootObj.creationTime = Date.now();
    return lootObj;
  }

  createLootbag(server: ZoneServer2016, entity: BaseFullCharacter) {
    const characterId = generateRandomGuid(),
      isCharacter = !!server._characters[entity.characterId],
      items = entity.getDeathItems(server);

    if (!_.size(items)) return; // don't spawn lootbag if inventory is empty

    const pos = entity.state.position,
      lootbag = new Lootbag(
        characterId,
        server.getTransientId(characterId),
        isCharacter ? 9581 : 9391,
        new Float32Array([pos[0], pos[1] + 0.1, pos[2]]),
        new Float32Array([0, 0, 0, 0]),
        server
      );
    const container = lootbag.getContainer();
    if (container) {
      container.items = items;
    }

    server._lootbags[characterId] = lootbag;
    server.executeFuncForAllReadyClientsInRange((client) => {
      server.addLightweightNpc(client, lootbag);
      client.spawnedEntities.add(lootbag);
    }, lootbag);
  }

  createAirdropContainer(
    server: ZoneServer2016,
    pos: Float32Array,
    forceAirdrop: string = ""
  ) {
    const airdropTypes: string[] = [
      "Farmer",
      "Demolitioner",
      "Medic",
      "Builder",
      "Fighter",
      "Supplier"
    ];
    const experimentalWeapons: { weapon: number; ammo: number }[] = [
      { weapon: Items.WEAPON_REAPER, ammo: Items.AMMO_308 },
      { weapon: Items.WEAPON_BLAZE, ammo: Items.AMMO_223 },
      { weapon: Items.WEAPON_FROSTBITE, ammo: Items.AMMO_762 },
      { weapon: Items.WEAPON_NAGAFENS_RAGE, ammo: Items.AMMO_12GA }
    ];

    const experimentalSrubs: number[] = [
      Items.HAPPY_SKULL_SCRUBS_CAP,
      Items.HAPPY_SKULL_SCRUBS_SHIRT,
      Items.HAPPY_SKULL_SCRUBS_PANTS,

      2806,
      2803,
      2809,

      2804,
      2801,
      2807,

      2799,
      2798,
      2800
    ];

    const index = Math.floor(Math.random() * airdropTypes.length);
    let airdropType = airdropTypes[index];
    let lootSpawner = containerLootSpawners[airdropType];

    if (forceAirdrop.length > 0) {
      airdropType = forceAirdrop;
      lootSpawner = containerLootSpawners[forceAirdrop];
    }

    const characterId = generateRandomGuid();

    const lootbag = new Lootbag(
      characterId,
      server.getTransientId(characterId),
      9218,
      new Float32Array([pos[0], pos[1] + 0.1, pos[2]]),
      new Float32Array([0, 0, 0, 0]),
      server
    );
    const container = lootbag.getContainer();
    if (container) {
      lootSpawner.items.forEach((item: LootDefinition) => {
        server.addContainerItem(
          lootbag,
          server.generateItem(item.item, item.spawnCount.max),
          container
        );
      });
    }
    let effectId = Effects.Smoke_Green; // default
    switch (airdropType) {
      case "Farmer":
        effectId = Effects.Smoke_Green;
        break;
      case "Demolitioner":
        effectId = Effects.Smoke_Orange;
        break;
      case "Medic":
        effectId = Effects.Smoke_Blue;
        break;
      case "Builder":
        effectId = Effects.Smoke_Purple;
        break;
      case "Fighter":
        effectId = Effects.Smoke_Red;
        if (container) {
          const experimental =
            experimentalWeapons[
              Math.floor(Math.random() * experimentalWeapons.length)
            ];
          server.addContainerItem(
            lootbag,
            server.generateItem(experimental.weapon, 1),
            container
          );
          server.addContainerItem(
            lootbag,
            server.generateItem(experimental.ammo, 30),
            container
          );
        }
        break;
      case "Supplier":
        effectId = Effects.Smoke_Yellow;
        if (container) {
          const experimental =
            experimentalWeapons[
              Math.floor(Math.random() * experimentalWeapons.length)
            ];
          server.addContainerItem(
            lootbag,
            server.generateItem(experimental.weapon, 1),
            container
          );
          server.addContainerItem(
            lootbag,
            server.generateItem(experimental.ammo, 30),
            container
          );
        }
      case "Hospital":
        effectId = Effects.Smoke_Orange;
        if (container) {
          const randomIndex = Math.floor(
            Math.random() * experimentalSrubs.length
          );
          server.addContainerItem(
            lootbag,
            server.generateItem(experimentalSrubs[randomIndex], 1),
            container
          );
        }
        break;
    }
    if (server._airdrop) {
      const smokePos = new Float32Array([
        server._airdrop.destinationPos[0],
        server._airdrop.destinationPos[1] + 0.3,
        server._airdrop.destinationPos[2],
        1
      ]);
      for (const a in server._clients) {
        const c = server._clients[a];
        server.sendData<CharacterPlayWorldCompositeEffect>(
          c,
          "Character.PlayWorldCompositeEffect",
          {
            characterId: c.character.characterId,
            effectId: effectId,
            position: smokePos,
            effectTime: 60
          }
        );
      }
    }
    server._lootbags[characterId] = lootbag;
  }

  createProps(server: ZoneServer2016) {
    Z1_lootableProps.forEach((propType: any) => {
      propType.instances.forEach((propInstance: any) => {
        const itemMap: { [modelId: number]: number } = {
          36: Items.FURNACE,
          9205: Items.BARBEQUE,
          9041: Items.CAMPFIRE
        };
        if (Object.keys(itemMap).includes(propInstance.modelId.toString())) {
          server.constructionManager.placeSmeltingEntity(
            server,
            itemMap[propInstance.modelId],
            propInstance.modelId,
            new Float32Array(propInstance.position),
            new Float32Array(fixEulerOrder(propInstance.rotation)),
            new Float32Array(propInstance.scale),
            server._serverGuid,
            true
          );
          return;
        }
        const characterId = generateRandomGuid();
        const obj = new (
          propInstance.modelId == 9347 ? TreasureChest : LootableProp
        )(
          characterId,
          server.getTransientId(characterId), // need transient generated for Interaction Replication
          propInstance.modelId,
          new Float32Array(propInstance.position),
          new Float32Array([
            propInstance.rotation[1],
            propInstance.rotation[0],
            propInstance.rotation[2],
            0
          ]),
          server,
          new Float32Array(propInstance.scale),
          propInstance.id,
          Number(propType.renderDistance)
        );
        server._lootableProps[characterId] = obj;
        obj.equipItem(server, server.generateItem(obj.containerId), false);
        if (
          ![
            ModelIds.HOSPITAL_LAB_WORKBENCH,
            ModelIds.TREASURE_CHEST,
            ModelIds.CAMPFIRE,
            ModelIds.FURNACE
          ].includes(propInstance.modelId)
        ) {
          const container = obj.getContainer();
          if (container) {
            container.canAcceptItems = false;
          }
          obj.nameId = server.getItemDefinition(obj.containerId)?.NAME_ID ?? 0;
        }
      });
    });
    Z1_taskProps.forEach((propType: any) => {
      propType.instances.forEach((propInstance: any) => {
        const characterId = generateRandomGuid();
        let obj;
        switch (propType.actorDefinition) {
          case "Common_Props_SpikeTrap.adr":
            server.constructionManager.placeTrap(
              server,
              Items.PUNJI_STICKS,
              propType.modelId,
              new Float32Array(propInstance.position),
              fixEulerOrder(propInstance.rotation),
              true
            );
            break;
          case "Common_Props_BarbedWire.adr":
          case "Common_Props_BarbedWire_Posts.adr":
            server.constructionManager.placeTrap(
              server,
              Items.BARBED_WIRE,
              propType.modelId,
              new Float32Array(propInstance.position),
              fixEulerOrder(propInstance.rotation),
              true
            );
            break;
          case "Common_Props_Cabinets_BathroomSink.adr":
          case "Common_Props_Bathroom_Toilet01.adr":
          case "Common_Props_Dam_WaterValve01.adr":
          case "Common_Props_Well.adr":
          case "Common_Props_FireHydrant.adr":
            obj = new WaterSource(
              characterId,
              server.getTransientId(characterId), // need transient generated for Interaction Replication
              propType.modelId,
              new Float32Array(propInstance.position),
              new Float32Array(fixEulerOrder(propInstance.rotation)),
              server,
              new Float32Array(propInstance.scale),
              propInstance.id,
              propType.renderDistance,
              propType.actorDefinition,
              this.waterSourceRefillAmount
            );
            break;
          case "Common_Props_WorkBench01.adr":
            server.constructionManager.placeSimpleConstruction(
              server,
              propType.modelId,
              new Float32Array(propInstance.position),
              new Float32Array(fixEulerOrder(propInstance.rotation)),
              server._serverGuid,
              Items.WORKBENCH
            );
            break;
          case "Common_Props_Gravestone01.adr":
            obj = new TaskProp(
              characterId,
              server.getTransientId(characterId), // need transient generated for Interaction Replication
              propType.modelId,
              new Float32Array(propInstance.position),
              new Float32Array(fixEulerOrder(propInstance.rotation)),
              server,
              new Float32Array(propInstance.scale),
              propInstance.id,
              propType.renderDistance,
              propType.actorDefinition
            );
            if (propType.tribute) {
              const thisObj = obj;
              obj.OnInteractionString = (server, client) => {
                server.sendData(client, "Command.InteractionString", {
                  guid: thisObj.characterId,
                  stringId: 0
                });
              };
              obj.getTaskPropData = () => {
                thisObj.nameId = 66;
                thisObj.rewardItems = [];
              };
              obj.OnPlayerSelect = (server, client) => {
                server.utilizeHudTimer(
                  client,
                  66,
                  60000, // Minute of silence
                  0,
                  () => {
                    server.sendChatText(
                      client,
                      "In loving memory of our dear friend, you will be deeply missed."
                    );
                  }
                );
              };
              // punish shooting at the grave
              obj.OnProjectileHit = (server, damageInfo) => {
                const assholeId = damageInfo.entity;
                const asshole = server._characters[assholeId];
                damageInfo.damage = damageInfo.damage * 2;
                asshole.damage(server, damageInfo);
              };
              obj.OnMeleeHit = obj.OnProjectileHit;
            }
            break;
          default:
            obj = new TaskProp(
              characterId,
              server.getTransientId(characterId), // need transient generated for Interaction Replication
              propType.modelId,
              new Float32Array(propInstance.position),
              new Float32Array(fixEulerOrder(propInstance.rotation)),
              server,
              new Float32Array(propInstance.scale),
              propInstance.id,
              propType.renderDistance,
              propType.actorDefinition
            );
        }
        if (obj) server._taskProps[characterId] = obj;
      });
    });
    Z1_crates.forEach((propType: any) => {
      propType.instances.forEach((propInstance: any) => {
        const characterId = generateRandomGuid();
        const obj = new Crate(
          characterId,
          server.getTransientId(characterId), // need transient generated for Interaction Replication
          getActorModelId(propType.actorDefinition),
          new Float32Array(propInstance.position),
          new Float32Array([
            propInstance.rotation[1],
            propInstance.rotation[0],
            propInstance.rotation[2],
            0
          ]),
          server,
          new Float32Array(propInstance.scale),
          propInstance.zoneId,
          Number(propType.renderDistance)
        );
        server._crates[characterId] = obj;
      });
    });
    Z1_destroyables.forEach((propType: any) => {
      propType.instances.forEach((propInstance: any) => {
        const characterId = generateRandomGuid();
        const obj = new Destroyable(
          characterId,
          server.getTransientId(characterId), // need transient generated for Interaction Replication
          propInstance.modelId,
          new Float32Array(propInstance.position),
          new Float32Array([
            propInstance.rotation[1],
            propInstance.rotation[0],
            propInstance.rotation[2],
            0
          ]),
          server,
          new Float32Array(propInstance.scale),
          propInstance.id,
          Number(propType.renderDistance)
        );
        server._destroyables[characterId] = obj;
        server._destroyableDTOlist.push(propInstance.id);
      });
    });
    debug("All props created");
  }

  async replenishWaterSources(server: ZoneServer2016) {
    let counter = 0;
    for (const a in server._taskProps) {
      if (counter > 9) {
        counter = 0;
        await scheduler.wait(60);
      }
      counter++;
      const propInstance = server._taskProps[a];
      if (propInstance instanceof WaterSource) propInstance.replenish();
    }
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
      server,
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
          new Float32Array(doorInstance.position),
          new Float32Array(doorInstance.rotation),
          new Float32Array(doorInstance.scale),
          // doorInstance.id doesn't exist
          0
        );
      });
    });
    debug("All doors objects created");
  }

  setSpawnchance(
    server: ZoneServer2016,
    entity: BaseFullCharacter,
    percentage: number,
    item: Items
  ) {
    if (percentage <= 0) return false;

    const randomNumber = Math.random() * 100;
    if (randomNumber <= percentage || percentage >= 100) {
      entity.lootItem(server, server.generateItem(item));
    }
  }

  createVehicle(
    server: ZoneServer2016,
    vehicle: Vehicle2016,
    maxSpawnChance: boolean = false
  ) {
    vehicle.equipLoadout(server);

    this.setSpawnchance(
      server,
      vehicle,
      maxSpawnChance ? 100 : 50,
      Items.BATTERY
    );
    this.setSpawnchance(
      server,
      vehicle,
      maxSpawnChance ? 100 : 50,
      Items.SPARKPLUGS
    );
    this.setSpawnchance(
      server,
      vehicle,
      maxSpawnChance ? 100 : 30,
      Items.VEHICLE_KEY
    );
    this.setSpawnchance(
      server,
      vehicle,
      maxSpawnChance ? 100 : 20,
      Items.FUEL_BIOFUEL
    );
    this.setSpawnchance(
      server,
      vehicle,
      maxSpawnChance ? 100 : 30,
      vehicle.getHeadlightsItemId()
    );
    this.setSpawnchance(
      server,
      vehicle,
      maxSpawnChance ? 100 : 30,
      vehicle.getTurboItemId()
    );

    server._vehicles[vehicle.characterId] = vehicle;
  }

  createVehicles(server: ZoneServer2016) {
    if (_.size(server._vehicles) >= this.vehicleSpawnCap) return;
    const respawnAmount = Math.ceil(
      (this.vehicleSpawnCap - _.size(server._vehicles)) / 8
    );
    for (let x = 0; x < respawnAmount; x++) {
      const dataVehicle =
        Z1_vehicles[randomIntFromInterval(0, Z1_vehicles.length - 1)];
      let spawn = true;
      Object.values(server._vehicles).forEach((spawnedVehicle: Vehicle2016) => {
        if (!spawn) return;
        if (
          isPosInRadius(
            this.vehicleSpawnRadius,
            dataVehicle.position,
            spawnedVehicle.state.position
          )
        ) {
          spawn = false;
        }
      });
      if (!spawn) {
        continue;
      }
      const characterId = generateRandomGuid(),
        vehicleData = new Vehicle2016(
          characterId,
          server.getTransientId(characterId),
          0,
          new Float32Array(dataVehicle.position),
          new Float32Array(dataVehicle.rotation),
          server,
          getCurrentServerTimeWrapper().getTruncatedU32(),
          dataVehicle.vehicleId
        );
      vehicleData.positionUpdate.orientation = dataVehicle.orientation;
      this.createVehicle(server, vehicleData); // save vehicle
    }
    debug("All vehicles created");
  }

  async createNpcs(server: ZoneServer2016) {
    // This is only for giving the world some life
    for (const spawnerType of Z1_npcs) {
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
          authorizedModelId.push(9253);
          break;
        case "NPCSpawner_Wolf001.adr":
          authorizedModelId.push(9003);
          break;
        case "Bear_Brown.adr":
          authorizedModelId.push(9187);
          break;
        default:
          break;
      }
      if (!authorizedModelId.length) continue;
      for (const npcInstance of spawnerType.instances) {
        let spawn = true;
        let counter = 0;
        for (const a in server._npcs) {
          if (counter > 150) {
            counter = 0;
            await scheduler.wait(30);
          }
          counter++;
          if (!server._npcs[a]) continue;
          if (
            isPosInRadius(
              this.npcSpawnRadius,
              npcInstance.position,
              server._npcs[a].state.position
            )
          ) {
            spawn = false;
            break;
          }
        }
        if (!spawn) continue;
        const spawnchance = Math.floor(Math.random() * 100) + 1; // temporary spawnchance
        if (spawnchance <= this.chanceNpc) {
          const screamerChance = Math.floor(Math.random() * 1000) + 1; // temporary spawnchance
          if (screamerChance <= this.chanceScreamer) {
            authorizedModelId.push(9667);
          }
          this.createNpc(
            server,
            authorizedModelId[
              Math.floor(Math.random() * authorizedModelId.length)
            ],
            new Float32Array(npcInstance.position),
            new Float32Array(eul2quat(npcInstance.rotation)),
            npcInstance.id
          );
        }
      }
    }
    debug("All npcs objects created");
  }

  refillScrapInChunks(server: ZoneServer2016) {
    for (let x = 0; x < server._grid.length; x++) {
      const chunk = server._grid[x];
      chunk.availableScrap += 20;
      if (chunk.availableScrap > 50) chunk.availableScrap = 50;
    }
  }

  async createLoot(server: ZoneServer2016, lTables = lootTables) {
    let counter = 0;
    for (const spawnerType of Z1_items) {
      const lootTable = lTables[spawnerType.actorDefinition];
      if (lootTable) {
        for (const itemInstance of spawnerType.instances) {
          if (counter > 9) {
            counter = 0;
            await scheduler.wait(60);
          }
          counter++;
          if (this.spawnedLootObjects[itemInstance.id]) continue;
          const chance = Math.floor(Math.random() * 100) + 1;
          if (
            chance <=
            lootTable.spawnChance *
              (1 - isLootNerfedLoc(itemInstance.position) / 100)
          ) {
            if (!WorldObjectManager.itemSpawnersChances[itemInstance.id]) {
              const realSpawnChance =
                ((lootTable.spawnChance / lootTable.items.length) *
                  spawnerType.instances.length) /
                100;
              WorldObjectManager.itemSpawnersChances[
                spawnerType.actorDefinition
              ] = realSpawnChance;
            }
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
                new Float32Array(itemInstance.position),
                new Float32Array(itemInstance.rotation),
                itemInstance.id
              );
            }
          }
        }
      }
    }
  }

  async updateQuestContainers(server: ZoneServer2016) {
    let counter = 0;
    for (const a in server._lootableProps) {
      if (counter > 100) {
        counter = 0;
        await scheduler.wait(30); // Await the wait function to pause
      }
      counter++;
      const prop = server._lootableProps[a] as BaseFullCharacter;
      switch (prop.actorModelId) {
        case ModelIds.HOSPITAL_LAB_WORKBENCH:
          if (
            prop.hasItem(Items.SYRINGE_INFECTED_BLOOD) &&
            prop.hasItem(Items.EMPTY_SPECIMEN_BAG) &&
            prop.hasItem(Items.BRAIN_INFECTED) &&
            prop.hasItem(Items.VIAL_H1Z1_REDUCER)
          ) {
            const req1 = prop.getItemById(Items.SYRINGE_INFECTED_BLOOD),
              req2 = prop.getItemById(Items.EMPTY_SPECIMEN_BAG),
              req3 = prop.getItemById(Items.BRAIN_INFECTED),
              req4 = prop.getItemById(Items.VIAL_H1Z1_REDUCER);

            if (!req1 || !req2 || !req3 || !req4) continue;

            if (
              !server.removeInventoryItem(prop, req1) ||
              !server.removeInventoryItem(prop, req2) ||
              !server.removeInventoryItem(prop, req3) ||
              !server.removeInventoryItem(prop, req4)
            ) {
              continue;
            }

            const obj = server.generateItem(Items.BRAIN_TREATED, 1);
            prop.lootItem(server, obj, 1, false);
          }
          break;
        case 9347:
          const rewardChest = server._lootableProps[a] as TreasureChest;
          if (rewardChest) rewardChest.triggerRewards(server);
          break;
      }
    }
  }
  async createContainerLoot(server: ZoneServer2016) {
    let counter = 0;
    for (const a in server._lootableProps) {
      if (counter > 9) {
        counter = 0;
        await scheduler.wait(60); // Await the wait function to pause
      }
      counter++;
      const prop = server._lootableProps[a] as LootableProp;
      const container = prop.getContainer();
      if (!container) continue;
      if (!!Object.keys(container.items).length) continue; // skip if container is not empty
      if (!prop.shouldSpawnLoot) continue; // skip medical stations and treasure chests
      const lootTable = containerLootSpawners[prop.lootSpawner];
      if (lootTable) {
        for (let x = 0; x < lootTable.maxItems; x++) {
          const item = getRandomItem(lootTable.items);
          if (!item) continue;
          const chance = Math.floor(Math.random() * 100) + 1; // temporary spawnchance
          let allow = true;
          Object.values(container.items).forEach((spawnedItem: BaseItem) => {
            if (item.item == spawnedItem.itemDefinitionId) allow = false; // dont allow the same item to be added twice
          });
          if (allow) {
            if (
              chance <=
              item.weight * (1 - isLootNerfedLoc(prop.state.position) / 100)
            ) {
              const count = Math.floor(
                Math.random() *
                  (item.spawnCount.max - item.spawnCount.min + 1) +
                  item.spawnCount.min
              );
              // temporary spawnchance
              server.addContainerItem(
                prop,
                server.generateItem(item.item, count),
                container
              );
            }
          } else {
            x--;
          }
        }
      }
      if (Object.keys(container.items).length != 0) {
        // mark prop as unsearched for clients
        Object.values(server._clients).forEach((client: ZoneClient2016) => {
          const index = client.searchedProps.indexOf(prop);
          if (index > -1) {
            client.searchedProps.splice(index, 1);
          }
        });
      }
    }
  }
}
