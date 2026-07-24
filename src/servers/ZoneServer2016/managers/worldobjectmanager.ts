// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2026 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

import { ZoneServer2016 } from "../zoneserver";
import { PluginManager } from "./pluginmanager";
const Z1_doors = PluginManager.loadServerData("2016/zoneData/Z1_doors.json");
const Z1_items = PluginManager.loadServerData("2016/zoneData/Z1_items.json");
const Z1_vehicles = PluginManager.loadServerData(
  "2016/zoneData/Z1_vehicleLocations.json"
);
const Z1_npcs = PluginManager.loadServerData("2016/zoneData/Z1_npcs.json");
const Z1_lootableProps = PluginManager.loadServerData(
  "2016/zoneData/Z1_lootableProps.json"
);
const Z1_taskProps = PluginManager.loadServerData(
  "2016/zoneData/Z1_taskProps.json"
);
const Z1_crates = PluginManager.loadServerData("2016/zoneData/Z1_crates.json");
const Z1_destroyables = PluginManager.loadServerData(
  "2016/zoneData/Z1_destroyables.json"
);
const Z1_POIs = PluginManager.loadServerData("2016/zoneData/Z1_POIs.json");
const models = PluginManager.loadServerData("2016/dataSources/Models.json");
// const bannedZombieModels = PluginManager.loadServerData("2016/sampleData/bannedZombiesModels.json");
import {
  _,
  eul2quat,
  generateRandomGuid,
  isPosInRadius,
  randomIntFromInterval,
  fixEulerOrder,
  getCurrentServerTimeWrapper
} from "../../../utils/utils";
import {
  EquipSlots,
  Items,
  Effects,
  ModelIds,
  NpcIds,
  DefaultSkinsConveys,
  DefaultSkinsBackpack,
  DefaultSkinsMotorHelmet,
  DefaultSkinsZeds,
  DefaultSkinsGators,
  DefaultSkinsBoots,
  VehicleIds
} from "../models/enums";
import { Vehicle2016 } from "../entities/vehicle";
import { ItemObject } from "../entities/itemobject";
import { DoorEntity } from "../entities/doorentity";
import { BaseFullCharacter } from "../entities/basefullcharacter";
import { ExplosiveEntity } from "../entities/explosiveentity";
import { LootTableManager } from "./loottablemanager";
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
import { ZombieWalker } from "../entities/zombiewalker";
import { ZombieScreamer } from "../entities/zombiescreamer";
import { PrototypeZombie } from "../entities/prototypezombie";
import { Exploder } from "../entities/exploder";
import { Deer } from "../entities/deer";
import { Rabbit } from "../entities/rabbit";
import { Wolf } from "../entities/wolf";
import { Bear } from "../entities/bear";
import { BasicNpc } from "../entities/basicnpc";
import { scheduler } from "node:timers/promises";
import {
  ContainerPropSnapshot,
  ItemDespawnSnapshot,
  LootSpawnWorker,
  LootbagDespawnSnapshot,
  NpcDespawnSnapshot,
  SpawnedItemSnapshot
} from "./lootspawnworker";
import type { ItemFunction } from "types/zoneserver";
import { Gasser } from "../entities/gasser";
const debug = require("debug")("ZoneServer");
const apm = require("elastic-apm-node");

export function getRandomSkin(itemDefinitionId: number) {
  let itemDefId = 0;
  let arr: any[] = [];
  switch (itemDefinitionId) {
    case Items.CONVEYS_BLUE:
      arr = Object.keys(DefaultSkinsConveys);
      break;
    case Items.BACKPACK_BLUE_ORANGE:
      arr = Object.keys(DefaultSkinsBackpack);
      break;
    case Items.HELMET_MOTORCYCLE:
      arr = Object.keys(DefaultSkinsMotorHelmet);
      break;
    case Items.ZEDS_WHITE:
      arr = Object.keys(DefaultSkinsZeds);
      break;
    case Items.GATORS_RED:
      arr = Object.keys(DefaultSkinsGators);
      break;
    case Items.BOOTS_GRAY_BLUE:
      arr = Object.keys(DefaultSkinsBoots);
      break;
    default:
      return itemDefinitionId;
  }
  itemDefId = Number(arr[Math.floor((Math.random() * arr.length) / 2)]);
  return itemDefId;
}

export function getRandomItem<T extends { weight: number }>(
  items: Array<T>
): T | undefined {
  const totalWeight = items.reduce((total, item) => total + item.weight, 0),
    randomWeight = Math.random() * totalWeight;
  let currentWeight = 0;

  for (let i = 0; i < items.length; i++) {
    currentWeight += items[i].weight;
    if (currentWeight > randomWeight) {
      return items[i];
    }
  }
  return undefined;
}

function applyItemFunctions(item: BaseItem, functions: ItemFunction[]): void {
  for (const fn of functions) {
    if (fn.function === "set_damage") {
      const fraction = fn.min + Math.random() * (fn.max - fn.min);
      item.currentDurability = Math.max(
        1,
        Math.floor(item.currentDurability * fraction)
      );
    } else if (fn.function === "set_count") {
      item.stackCount = Math.max(
        1,
        Math.floor(Math.random() * (fn.max - fn.min + 1) + fn.min)
      );
    }
  }
}

export class WorldObjectManager {
  /** HashMap of all spawned NPCs in the world - uses spawnerId (number) for indexing */
  spawnedNpcs: { [spawnerId: number]: string } = {};

  /** HashMap of all spawned objects in the world - uses spawnerId (number) for indexing */
  spawnedLootObjects: { [spawnerId: number]: string } = {};

  /** Global respawn timers */
  _lastLootRespawnTime: number = 0;
  _lastVehicleRespawnTime: number = 0;
  _lastNpcRespawnTime: number = 0;
  _lastPrototypeZombieRespawnTime: number = 0;
  _lastWaterSourceReplenishTime: number = 0;
  private _waterSourceCache: WaterSource[] | null = null;

  /** MANAGED BY CONFIGMANAGER - See defaultConfig.yaml for more information */
  vehicleSpawnCap!: number;
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
  chanceRabbit!: number;
  chanceScreamer!: number;
  chanceGasser!: number;
  chanceGasserPropagation!: number;
  chanceExploder!: number;
  chanceWornLetter!: number;
  waterSourceReplenishTimer!: number;
  waterSourceRefillAmount!: number;
  gridScrapLimit!: number;
  gridScrapLimitEnabled!: boolean;
  npcSpawnCap!: number;

  private zombieSlots = [
    EquipSlots.HEAD,
    EquipSlots.CHEST,
    EquipSlots.LEGS,
    EquipSlots.HANDS,
    EquipSlots.FEET,
    EquipSlots.HAIR
  ];
  static itemSpawnersChances: Record<string, number> = {};
  private isRunning = false;
  private lootSpawnWorker?: LootSpawnWorker;
  readonly lootTableManager = new LootTableManager();
  maxNpcDespawnsPerRun = 40;
  maxLootbagDespawnsPerRun = 40;
  maxItemDespawnsPerRun = 120;

  private getItemRespawnTimer(server: ZoneServer2016): void {
    if (this.hasCustomLootRespawnTime) return;

    const playerCount = _.size(server._characters);

    if (playerCount >= 75) {
      this.lootRespawnTimer = 600_000; // 10 min
    } else if (playerCount >= 50) {
      this.lootRespawnTimer = 900_000; // 15 min
    } else if (playerCount >= 25) {
      this.lootRespawnTimer = 1_200_000; // 20 min
    } else if (playerCount >= 1) {
      this.lootRespawnTimer = 1_500_000; // 25 min
    } else {
      this.lootRespawnTimer = 1_500_000; // 25 min
    }
  }

  async run(server: ZoneServer2016) {
    if (this.isRunning) return;
    this.isRunning = true;
    const transaction = apm.startTransaction(
      "WorldObjectManager::Run",
      "custom"
    );
    debug("WOM::Run");
    try {
      if (server.isSurvival()) {
        this.getItemRespawnTimer(server);
        if (this._lastLootRespawnTime + this.lootRespawnTimer <= Date.now()) {
          if (this.gridScrapLimitEnabled) {
            this.refillScrapInChunks(server);
          }
          const lootSpan = transaction.startSpan("createLootThreaded");
          await this.createLootThreaded(server);
          lootSpan?.end();
          const containerLootSpan = transaction.startSpan(
            "createContainerLootThreaded"
          );
          await this.createContainerLootThreaded(server);
          containerLootSpan?.end();
          this._lastLootRespawnTime = Date.now();
          server.divideLargeCells(700);
        }
        if (this._lastNpcRespawnTime + this.npcRespawnTimer <= Date.now()) {
          const npcSpan = transaction.startSpan("createNpcsThreaded");
          await this.createNpcsThreaded(server);
          npcSpan?.end();
          this._lastNpcRespawnTime = Date.now();
        }
        // Prototype zombies: 1 hour respawn timer (3,600,000 ms), 100% spawn chance
        if (this._lastPrototypeZombieRespawnTime + 3_600_000 <= Date.now()) {
          const prototypeSpan = transaction.startSpan("spawnPrototypeZombies");
          await this.spawnPrototypeZombies(server);
          prototypeSpan?.end();
          this._lastPrototypeZombieRespawnTime = Date.now();
        }
        if (
          this._lastVehicleRespawnTime + this.vehicleRespawnTimer <=
          Date.now()
        ) {
          const vehicleSpan = transaction.startSpan("createVehicles");
          this.createVehicles(server);
          vehicleSpan?.end();
          this._lastVehicleRespawnTime = Date.now();
        }
        if (
          this._lastWaterSourceReplenishTime + this.waterSourceReplenishTimer <=
          Date.now()
        ) {
          const waterSpan = transaction.startSpan("replenishWaterSources");
          await this.replenishWaterSources(server);
          waterSpan?.end();
          this._lastWaterSourceReplenishTime = Date.now();
        }

        const questSpan = transaction.startSpan("updateQuestContainers");
        await this.updateQuestContainers(server);
        questSpan?.end();
      }

      if (server.isSurvival()) {
        const despawnSpan = transaction.startSpan("despawnEntities");
        await this.despawnEntities(server);
        despawnSpan?.end();
      }
    } finally {
      transaction.end();
      this.isRunning = false;
    }
  }

  private getLootSpawnWorker(): LootSpawnWorker {
    if (!this.lootSpawnWorker) {
      this.lootSpawnWorker = new LootSpawnWorker({
        groundTables: this.lootTableManager.getGroundTables(),
        containerTables: this.lootTableManager.getContainerTables()
      });
    }
    return this.lootSpawnWorker;
  }

  async stop() {
    if (!this.lootSpawnWorker) return;
    await this.lootSpawnWorker.stop();
    this.lootSpawnWorker = undefined;
  }

  async createLootThreaded(server: ZoneServer2016) {
    try {
      const worker = this.getLootSpawnWorker();
      const spawnedLootSpawnerIds: number[] = [];
      for (const spawnerId in this.spawnedLootObjects) {
        spawnedLootSpawnerIds.push(Number(spawnerId));
      }
      const spawnedItemSnapshots: SpawnedItemSnapshot[] = [];
      for (const characterId in server._spawnedItems) {
        const itemObject = server._spawnedItems[characterId];
        spawnedItemSnapshots.push({
          position: [
            itemObject.state.position[0],
            itemObject.state.position[1],
            itemObject.state.position[2]
          ] as [number, number, number],
          itemDefinitionId: itemObject.item.itemDefinitionId
        });
      }
      const ingameHour = (server.inGameTimeManager.time / 3600) % 24;
      const plan = await worker.createLootPlan(
        spawnedLootSpawnerIds,
        spawnedItemSnapshots,
        ingameHour
      );

      let i = 0;
      for (const entry of plan) {
        if (this.spawnedLootObjects[entry.spawnerId]) continue;
        const item = server.generateItem(
          getRandomSkin(entry.itemDefinitionId),
          entry.count
        );
        if (item && entry.functions?.length)
          applyItemFunctions(item, entry.functions);
        this.createLootEntity(
          server,
          item,
          new Float32Array(entry.position),
          new Float32Array(entry.rotation),
          entry.spawnerId
        );
        if (++i % 200 === 0) await scheduler.yield();
      }
    } catch (error) {
      console.log(`[WOM] createLootThreaded fallback: ${error}`);
      apm.captureError(error);
      await this.createLoot(server);
    }
  }

  async createContainerLootThreaded(server: ZoneServer2016) {
    try {
      const worker = this.getLootSpawnWorker();
      const props: ContainerPropSnapshot[] = [];

      let i = 0;
      for (const characterId in server._lootableProps) {
        const prop = server._lootableProps[characterId] as LootableProp;
        if (!prop.shouldSpawnLoot) continue;
        const container = prop.getContainer();
        if (!container) continue;
        if (Object.keys(container.items).length > 0) continue;

        props.push({
          characterId,
          lootSpawner: prop.lootSpawner,
          shouldSpawnLoot: true,
          position: [
            prop.state.position[0],
            prop.state.position[1],
            prop.state.position[2]
          ],
          existingItemDefinitionIds: []
        });
        if (++i % 100 === 0) await scheduler.yield();
      }

      const plan = await worker.createContainerLootPlan(props);
      const updatedProps = new Set<string>();

      i = 0;
      for (const entry of plan) {
        const prop = server._lootableProps[entry.characterId] as LootableProp;
        if (!prop) continue;
        const container = prop.getContainer();
        if (!container) continue;

        const hasSameItem = Object.values(container.items).some(
          (spawnedItem: BaseItem) =>
            spawnedItem.itemDefinitionId === entry.itemDefinitionId
        );
        if (hasSameItem) continue;

        const item = server.generateItem(
          getRandomSkin(entry.itemDefinitionId),
          entry.count
        );
        if (item && entry.functions?.length)
          applyItemFunctions(item, entry.functions);
        server.addContainerItem(prop, item, container);
        updatedProps.add(entry.characterId);
        if (++i % 50 === 0) await scheduler.yield();
      }

      if (!updatedProps.size) return;
      Object.values(server._clients).forEach((client: ZoneClient2016) => {
        updatedProps.forEach((characterId) => {
          const prop = server._lootableProps[characterId] as LootableProp;
          const index = client.searchedProps.indexOf(prop);
          if (index > -1) {
            client.searchedProps.splice(index, 1);
          }
        });
      });
    } catch (error) {
      console.warn(
        `[WOM] createContainerLootThreaded fallback to main thread: ${error}`
      );
      await this.createContainerLoot(server);
    }
  }

  async createNpcsThreaded(server: ZoneServer2016) {
    try {
      const worker = this.getLootSpawnWorker();
      const existingNpcPositions = Object.values(server._npcs).map((npc) => [
        npc.state.position[0],
        npc.state.position[1],
        npc.state.position[2]
      ]);

      const plan = await worker.createNpcPlan(
        existingNpcPositions,
        this.npcSpawnRadius,
        this.chanceNpc,
        this.chanceScreamer,
        this.chanceGasser,
        this.chanceExploder,
        this.npcSpawnCap
      );

      let i = 0;
      for (const entry of plan) {
        this.createNpc(
          server,
          entry.modelId,
          new Float32Array(entry.position),
          new Float32Array(eul2quat(new Float32Array(entry.rotation))),
          entry.spawnerId,
          entry.npcId
        );
        if (++i % 100 === 0) await scheduler.yield();
      }
    } catch (error) {
      console.warn(
        `[WOM] createNpcsThreaded fallback to main thread: ${error}`
      );
      await this.createNpcs(server);
    }
  }

  private async despawnEntities(server: ZoneServer2016) {
    const tx = apm.currentTransaction;
    try {
      const worker = this.getLootSpawnWorker();
      const now = Date.now();

      // Snapshots are pure reads — no yields needed, each loop is < 5ms.
      let snapshotSpan = tx?.startSpan("despawn.npcSnapshot");
      const npcs: NpcDespawnSnapshot[] = Object.values(server._npcs).map(
        (npc) => ({
          characterId: npc.characterId,
          knockedOut: !!npc.flags.knockedOut,
          deathTime: npc.deathTime
        })
      );
      snapshotSpan?.end();

      snapshotSpan = tx?.startSpan("despawn.lootbagSnapshot");
      const lootbags: LootbagDespawnSnapshot[] = Object.values(
        server._lootbags
      ).map((lootbag) => ({
        characterId: lootbag.characterId,
        creationTime: lootbag.creationTime
      }));
      snapshotSpan?.end();

      snapshotSpan = tx?.startSpan("despawn.itemSnapshot");
      // Only include items old enough to possibly be despawned — items younger
      // than 50% of the shortest timer are guaranteed safe and skipped entirely.
      const minDespawnMs = Math.min(
        this.itemDespawnTimer,
        this.lootDespawnTimer
      );
      const items: ItemDespawnSnapshot[] = [];
      for (const itemObject of Object.values(server._spawnedItems)) {
        if (now - itemObject.creationTime < minDespawnMs * 0.5) continue;
        items.push({
          characterId: itemObject.characterId,
          creationTime: itemObject.creationTime,
          spawnerId: itemObject.spawnerId,
          itemDefinitionId: itemObject.item.itemDefinitionId
        });
      }
      snapshotSpan?.end();

      const planSpan = tx?.startSpan("despawn.workerPlan");
      const plan = await worker.createDespawnPlan({
        now,
        deadNpcDespawnTimer: this.deadNpcDespawnTimer,
        lootbagDespawnTimer: this.lootbagDespawnTimer,
        itemDespawnTimer: this.itemDespawnTimer,
        lootDespawnTimer: this.lootDespawnTimer,
        fuelItemDefinitionIds: [Items.FUEL_ETHANOL, Items.FUEL_BIOFUEL],
        npcs,
        lootbags,
        items
      });
      planSpan?.end();

      const npcDeleteSpan = tx?.startSpan("despawn.deleteNpcs");
      server.batchDeleteEntities(
        plan.npcCharacterIds.slice(0, this.maxNpcDespawnsPerRun),
        server._npcs
      );
      npcDeleteSpan?.end();
      await scheduler.yield();

      const lootbagDeleteSpan = tx?.startSpan("despawn.deleteLootbags");
      server.batchDeleteEntities(
        plan.lootbagCharacterIds.slice(0, this.maxLootbagDespawnsPerRun),
        server._lootbags
      );
      lootbagDeleteSpan?.end();
      await scheduler.yield();

      const itemEntries = plan.itemEntries.slice(0, this.maxItemDespawnsPerRun);

      // Phase 1: send effects + collect ids — entity must still be in dict
      const itemEffectsSpan = tx?.startSpan("despawn.itemEffects");
      let i = 0;
      const itemIdsToDelete: string[] = [];
      const explosiveIdsToDelete: string[] = [];
      for (const entry of itemEntries) {
        const itemObject = server._spawnedItems[entry.characterId];
        if (!itemObject) continue;
        server.sendCompositeEffectToAllWithSpawnedEntity(
          server._spawnedItems,
          itemObject,
          server.getItemDefinition(entry.itemDefinitionId)?.PICKUP_EFFECT ??
            5151
        );
        itemIdsToDelete.push(entry.characterId);
        if (entry.deleteExplosive) explosiveIdsToDelete.push(entry.characterId);
        if (entry.spawnerId != -1)
          delete this.spawnedLootObjects[entry.spawnerId];
        if (++i % 20 === 0) await scheduler.yield();
      }
      itemEffectsSpan?.end();

      // Phase 2: one grid pass for all items, one for explosives
      const itemDeleteSpan = tx?.startSpan("despawn.deleteItems");
      server.batchDeleteEntities(itemIdsToDelete, server._spawnedItems);
      itemDeleteSpan?.end();
      await scheduler.yield();
      const explosiveDeleteSpan = tx?.startSpan("despawn.deleteExplosives");
      server.batchDeleteEntities(explosiveIdsToDelete, server._explosives);
      explosiveDeleteSpan?.end();
    } catch (error) {
      debug(`[WARN] despawnEntities threaded path failed: ${error}`);
      // Safe fallback to avoid leaking stale entities if worker path fails.
      for (const characterId in server._npcs) {
        const npc = server._npcs[characterId];
        if (
          npc &&
          npc.flags.knockedOut &&
          Date.now() - npc.deathTime >= this.deadNpcDespawnTimer
        ) {
          server.deleteEntity(npc.characterId, server._npcs);
        }
      }
      for (const characterId in server._lootbags) {
        const lootbag = server._lootbags[characterId];
        if (Date.now() - lootbag.creationTime >= this.lootbagDespawnTimer) {
          server.deleteEntity(lootbag.characterId, server._lootbags);
        }
      }
      for (const characterId in server._spawnedItems) {
        const itemObject = server._spawnedItems[characterId];
        if (!itemObject) continue;
        const despawnTime =
          itemObject.spawnerId == -1
            ? this.itemDespawnTimer
            : this.lootDespawnTimer;
        if (Date.now() - itemObject.creationTime >= despawnTime) {
          server.deleteEntity(itemObject.characterId, server._spawnedItems);
          if (
            itemObject.item.itemDefinitionId == Items.FUEL_ETHANOL ||
            itemObject.item.itemDefinitionId == Items.FUEL_BIOFUEL
          ) {
            server.deleteEntity(itemObject.characterId, server._explosives);
          }
          if (itemObject.spawnerId != -1)
            delete this.spawnedLootObjects[itemObject.spawnerId];
        }
      }
    }
  }

  createNpc(
    server: ZoneServer2016,
    modelId: number,
    position: Float32Array,
    rotation: Float32Array,
    spawnerId: number = 0,
    npcId?: NpcIds
  ) {
    const characterId = generateRandomGuid();
    const transientId = server.getTransientId(characterId);
    let npc: Npc;

    switch (modelId) {
      case ModelIds.ZOMBIE_FEMALE_WALKER:
      case ModelIds.ZOMBIE_MALE_WALKER:
        switch (npcId) {
          case NpcIds.EXPLODER:
            npc = new Exploder(
              characterId,
              transientId,
              position,
              rotation,
              server,
              spawnerId
            );
            break;
          case NpcIds.GASSER:
            npc = new Gasser(
              characterId,
              transientId,
              position,
              rotation,
              server,
              spawnerId
            );

            break;
          default:
            let variant = this.getVariantBasedOnPoi(new Float32Array(position));
            npc = new ZombieWalker(
              characterId,
              transientId,
              modelId,
              position,
              rotation,
              server,
              spawnerId,
              variant
            );
            break;
        }
        break;
      case ModelIds.ZOMBIE_SCREAMER:
        npc = new ZombieScreamer(
          characterId,
          transientId,
          position,
          rotation,
          server,
          spawnerId
        );
        break;
      case ModelIds.DEER:
      case ModelIds.DEER_BUCK:
        npc = new Deer(
          characterId,
          transientId,
          modelId,
          position,
          rotation,
          server,
          spawnerId
        );
        break;
      case ModelIds.RABBIT:
        npc = new Rabbit(
          characterId,
          transientId,
          modelId,
          position,
          rotation,
          server,
          spawnerId
        );
        break;
      case ModelIds.WOLF:
        npc = new Wolf(
          characterId,
          transientId,
          position,
          rotation,
          server,
          spawnerId
        );
        break;
      case ModelIds.BEAR:
        npc = new Bear(
          characterId,
          transientId,
          position,
          rotation,
          server,
          spawnerId
        );
        break;
      default:
        // Fallback to BasicNpc as this was used for testing models as well
        npc = new BasicNpc(
          characterId,
          transientId,
          modelId,
          position,
          rotation,
          server,
          spawnerId
        );
        break;
    }
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
    lootObj.isWorldItem = true;
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
        isCharacter ? ModelIds.LOOT_BAG_BLOODY : ModelIds.LOOT_BAG_CLEAN,
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
      Items.QUEST_HAPPY_SKULL_SCRUBS_CAP,
      Items.QUEST_HAPPY_SKULL_SCRUBS_SHIRT,
      Items.QUEST_HAPPY_SKULL_SCRUBS_PANTS,

      Items.QUEST_HUGZ_NEEDED_SCRUBS_CAP,
      Items.QUEST_HUGZ_NEEDED_SCRUBS_SHIRT,
      Items.QUEST_HUGZ_NEEDED_SCRUBS_PANTS,

      Items.QUEST_KURAMA_MEDICAL_SCRUBS_CAP,
      Items.QUEST_KURAMA_MEDICAL_SCRUBS_SHIRT,
      Items.QUEST_KURAMA_MEDICAL_SCRUBS_PANTS
    ];

    const index = Math.floor(Math.random() * airdropTypes.length);
    let airdropType = airdropTypes[index];

    if (forceAirdrop.length > 0) {
      airdropType = forceAirdrop;
    }

    const containerTables = this.lootTableManager.getContainerTables();
    const lootSpawner = containerTables[airdropType];

    const characterId = generateRandomGuid();

    const lootbag = new Lootbag(
      characterId,
      server.getTransientId(characterId),
      ModelIds.MILITARY_CRATE,
      new Float32Array([pos[0], pos[1] + 0.1, pos[2]]),
      new Float32Array([0, 0, 0, 0]),
      server
    );
    const container = lootbag.getContainer();
    if (container && lootSpawner) {
      // Airdrop: spawn every item entry at max count regardless of weights/conditions
      const allEntries = lootSpawner.pools
        .flatMap((p) => p.entries)
        .filter((e) => (e.type ?? "item") === "item" && e.item !== undefined);
      allEntries.forEach((entry) => {
        server.addContainerItem(
          lootbag,
          server.generateItem(entry.item!, entry.count?.max ?? 1),
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
    const smokePos = new Float32Array([pos[0], pos[1] + 0.3, pos[2], 1]);
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

      if (isPosInRadius(3, c.character.state.position, pos)) {
        server.killCharacter(c, { damage: 99999, entity: "aidrop" });
      }
    }

    server._lootbags[characterId] = lootbag;
  }

  createProps(server: ZoneServer2016) {
    if (server.isSurvival()) {
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
          if (
            propInstance.modelId === ModelIds.HOSPITAL_LAB_WORKBENCH ||
            propInstance.modelId === ModelIds.TREASURE_CHEST
          ) {
            server._questContainerProps[characterId] = obj;
          }
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
            obj.nameId =
              server.getItemDefinition(obj.containerId)?.NAME_ID ?? 0;
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
                new Float32Array([1, 1, 1, 1]),
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
    }
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

    // Build static spatial map for destroyables (they never move, so this is built once).
    const sz = ZoneServer2016._DESTROYABLE_GRID_SIZE;
    for (const characterId in server._destroyables) {
      const d = server._destroyables[characterId];
      const key = `${Math.floor(d.state.position[0] / sz)},${Math.floor(d.state.position[2] / sz)}`;
      let bucket = server._destroyableSpatialMap.get(key);
      if (!bucket) {
        bucket = [];
        server._destroyableSpatialMap.set(key, bucket);
      }
      bucket.push(d);
    }
    debug("All props created");
  }

  async replenishWaterSources(server: ZoneServer2016) {
    if (!this._waterSourceCache) {
      this._waterSourceCache = Object.values(server._taskProps).filter(
        (p): p is WaterSource => p instanceof WaterSource
      );
    }
    let i = 0;
    for (const ws of this._waterSourceCache) {
      ws.replenish();
      if (++i % 100 === 0) await scheduler.yield();
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

  createVehicleAtPos(
    server: ZoneServer2016,
    position: Float32Array,
    rotation: Float32Array = new Float32Array([0, 0, 0, 1]),
    vehicleId: number = 1,
    maxSpawnChance = false
  ) {
    const characterId = server.generateGuid(),
      vehicleData = new Vehicle2016(
        characterId,
        server.getTransientId(characterId),
        0,
        new Float32Array(position),
        new Float32Array(rotation),
        server,
        getCurrentServerTimeWrapper().getTruncatedU32(),
        vehicleId
      );
    this.createVehicle(server, vehicleData, maxSpawnChance);
  }

  createVehicle(
    server: ZoneServer2016,
    vehicle: any,
    maxSpawnChance: boolean = false
  ): void {
    if (!(vehicle instanceof Vehicle2016)) {
      const characterId = server.generateGuid();
      const vehicleData = new Vehicle2016(
        characterId,
        server.getTransientId(characterId),
        0,
        new Float32Array(vehicle.position),
        new Float32Array(vehicle.rotation),
        server,
        getCurrentServerTimeWrapper().getTruncatedU32(),
        vehicle.vehicleId
      );
      this.createVehicle(server, vehicleData, maxSpawnChance);
      return;
    }

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
    if (vehicle.vehicleId != VehicleIds.PARACHUTE) {
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
    }
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
    server.insertVehicleIntoSpatialMap(vehicle);
    // Immediately send the vehicle to any clients in range
    for (const sessionId in server._clients) {
      const client = server._clients[sessionId];
      if (!client.isLoading) server.vehicleManager(client);
    }
  }

  createVehicles(server: ZoneServer2016, maxSpawnChance: boolean = false) {
    const transaction = apm.startTransaction(
      "WorldObjectManager::createVehicles",
      "custom"
    );
    try {
      if (_.size(server._vehicles) >= this.vehicleSpawnCap) return;
      const respawnAmount = Math.ceil(
        (this.vehicleSpawnCap - _.size(server._vehicles)) / 8
      );
      for (let x = 0; x < respawnAmount; x++) {
        const dataVehicle =
          Z1_vehicles[randomIntFromInterval(0, Z1_vehicles.length - 1)];
        let spawn = true;
        Object.values(server._vehicles).forEach(
          (spawnedVehicle: Vehicle2016) => {
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
          }
        );
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
        this.createVehicle(server, vehicleData, maxSpawnChance); // save vehicle
      }
    } finally {
      transaction.end();
      debug("All vehicles created");
    }
  }

  private async createNpcs(server: ZoneServer2016) {
    // This is only for giving the world some life
    for (const spawnerType of Z1_npcs) {
      const authorizedModelId: number[] = [];

      switch (spawnerType.actorDefinition) {
        case "NPCSpawner_ZombieLazy.adr":
          authorizedModelId.push(ModelIds.ZOMBIE_FEMALE_WALKER);
          authorizedModelId.push(ModelIds.ZOMBIE_MALE_WALKER);
          break;
        case "NPCSpawner_ZombieWalker.adr":
          authorizedModelId.push(ModelIds.ZOMBIE_FEMALE_WALKER);
          authorizedModelId.push(ModelIds.ZOMBIE_MALE_WALKER);
          break;
        case "NPCSpawner_Deer001.adr":
          authorizedModelId.push(9002);
          authorizedModelId.push(9253);
          break;
        case "NPCSpawner_Rabbit001.adr":
          authorizedModelId.push(ModelIds.RABBIT);
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
            await scheduler.yield();
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
          const modelId =
            authorizedModelId[
              Math.floor(Math.random() * authorizedModelId.length)
            ];
          let npcId: NpcIds | undefined;
          if (
            modelId === ModelIds.ZOMBIE_FEMALE_WALKER ||
            modelId === ModelIds.ZOMBIE_MALE_WALKER
          ) {
            if (Math.floor(Math.random() * 1000) + 1 <= this.chanceExploder) {
              npcId = NpcIds.EXPLODER;
            } else if (
              Math.floor(Math.random() * 1000) + 1 <=
              this.chanceGasser
            ) {
              npcId = NpcIds.GASSER;
            }
          }
          this.createNpc(
            server,
            modelId,
            new Float32Array(npcInstance.position),
            new Float32Array(eul2quat(npcInstance.rotation)),
            npcInstance.id,
            npcId
          );
        }
      }
    }
    debug("All npcs objects created");
  }

  _Poimap: Map<string, string> = new Map([["17", "Nurse"]]);

  private getVariantBasedOnPoi(position: Float32Array): string {
    // Find which POI contains this position
    for (const poi of Z1_POIs) {
      if (!poi.bounds || !Array.isArray(poi.bounds)) continue;

      // Check if position is in any of the polygon bounds for this POI
      for (const polygon of poi.bounds) {
        // Validate polygon is an array and has proper structure
        if (!Array.isArray(polygon) || polygon.length < 3) continue;

        if (this.isPointInPolygon([position[0], position[2]], polygon)) {
          // Found POI - look up variant from map using POI ID
          const variant = this._Poimap.get(String(poi.POIid));
          if (variant) {
            return variant;
          }
        }
      }
    }
    // No POI found - return empty for random variant
    return "";
  }

  private isPointInPolygon(
    point: [number, number],
    polygon: Array<[number, number]>
  ): boolean {
    const [x, y] = point;
    let inside = false;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const coord = polygon[i];
      const prevCoord = polygon[j];

      // Validate coordinates are properly formatted
      if (
        !Array.isArray(coord) ||
        !Array.isArray(prevCoord) ||
        coord.length < 2 ||
        prevCoord.length < 2
      ) {
        continue;
      }

      const [xi, yi] = coord;
      const [xj, yj] = prevCoord;

      const intersect =
        yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }

    return inside;
  }

  private async spawnPrototypeZombies(server: ZoneServer2016) {
    // Prototype zombies: 100% spawn chance, independent respawn (1 hour)
    for (const spawnerType of Z1_npcs) {
      let prototypeNpcId: number | null = null;

      switch (spawnerType.actorDefinition) {
        case "NPCSpawner_PrototypeAssaultZombie.adr":
          prototypeNpcId = NpcIds.PROTOTYPE_ASSAULT_ZOMBIE;
          break;
        case "NPCSpawner_PrototypeHunterZombie.adr":
          prototypeNpcId = NpcIds.PROTOTYPE_HUNTER_ZOMBIE;
          break;
        case "NPCSpawner_PrototypeSniperZombie.adr":
          prototypeNpcId = NpcIds.PROTOTYPE_SNIPER_ZOMBIE;
          break;
        default:
          continue;
      }

      const authorizedModelId = [ModelIds.ZOMBIE_MALE_WALKER];

      for (const npcInstance of spawnerType.instances) {
        let spawn = true;

        // Check if there's already a prototype zombie at this location
        for (const a in server._npcs) {
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

        // Create PrototypeZombie directly (not generic ZombieWalker)
        const characterId = generateRandomGuid();
        const transientId = server.getTransientId(characterId);
        const modelId =
          authorizedModelId[
            Math.floor(Math.random() * authorizedModelId.length)
          ];

        const npc = new PrototypeZombie(
          characterId,
          transientId,
          modelId,
          new Float32Array(npcInstance.position),
          new Float32Array(eul2quat(npcInstance.rotation)),
          server,
          npcInstance.id,
          prototypeNpcId ?? NpcIds.ZOMBIE
        );

        server._npcs[characterId] = npc;
        if (npcInstance.id) this.spawnedNpcs[npcInstance.id] = characterId;
      }
    }
    debug("Prototype zombies spawned");
  }

  refillScrapInChunks(server: ZoneServer2016) {
    for (let x = 0; x < server._grid.length; x++) {
      const chunk = server._grid[x];
      chunk.availableScrap += 20;
      if (chunk.availableScrap > this.gridScrapLimit)
        chunk.availableScrap = this.gridScrapLimit;
    }
  }

  private async createLoot(server: ZoneServer2016) {
    const transaction = apm.startTransaction(
      "WorldObjectManager::createLoot",
      "custom"
    );
    const groundTables = this.lootTableManager.getGroundTables();
    let counter = 0;
    for (const spawnerType of Z1_items) {
      const span = transaction.startSpan("spawnerType");
      const lootTable = groundTables[spawnerType.actorDefinition];
      if (lootTable) {
        const allEntries = lootTable.pools.flatMap((p) => p.entries);
        for (const itemInstance of spawnerType.instances) {
          if (counter > 9) {
            counter = 0;
            await scheduler.yield();
          }
          counter++;
          if (this.spawnedLootObjects[itemInstance.id]) continue;
          const chance = Math.floor(Math.random() * 100) + 1;
          if (chance <= lootTable.spawnChance) {
            if (!WorldObjectManager.itemSpawnersChances[itemInstance.id]) {
              const realSpawnChance =
                ((lootTable.spawnChance / allEntries.length) *
                  spawnerType.instances.length) /
                100;
              WorldObjectManager.itemSpawnersChances[
                spawnerType.actorDefinition
              ] = realSpawnChance;
            }
            const entry = getRandomItem(allEntries);
            if (
              entry &&
              (entry.type ?? "item") === "item" &&
              entry.item !== undefined
            ) {
              this.createLootEntity(
                server,
                server.generateItem(
                  getRandomSkin(entry.item),
                  entry.count
                    ? randomIntFromInterval(entry.count.min, entry.count.max)
                    : 1
                ),
                new Float32Array(itemInstance.position),
                new Float32Array(itemInstance.rotation),
                itemInstance.id
              );
            }
          }
        }
      }
      span?.end();
    }
    transaction.end();
  }

  async updateQuestContainers(server: ZoneServer2016) {
    let counter = 0;
    for (const a in server._questContainerProps) {
      if (counter > 25) {
        counter = 0;
        await scheduler.yield();
      }
      counter++;
      const prop = server._questContainerProps[a] as BaseFullCharacter;
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
          if (
            prop.hasItem(Items.QUEST_HAPPY_SKULL_SCRUBS_SHIRT) &&
            prop.hasItem(Items.QUEST_HAPPY_SKULL_SCRUBS_PANTS) &&
            prop.hasItem(Items.QUEST_HAPPY_SKULL_SCRUBS_CAP)
          ) {
            const req1 = prop.getItemById(Items.QUEST_HAPPY_SKULL_SCRUBS_SHIRT),
              req2 = prop.getItemById(Items.QUEST_HAPPY_SKULL_SCRUBS_PANTS),
              req3 = prop.getItemById(Items.QUEST_HAPPY_SKULL_SCRUBS_CAP);

            if (!req1 || !req2 || !req3) continue;

            if (
              !server.removeInventoryItem(prop, req1) ||
              !server.removeInventoryItem(prop, req2) ||
              !server.removeInventoryItem(prop, req3)
            ) {
              continue;
            }

            const obj1 = server.generateItem(
              Items.REWARD_HAPPY_SKULL_SCRUBS_SHIRT,
              1
            );
            prop.lootItem(server, obj1, 1, false);
            const obj2 = server.generateItem(
              Items.REWARD_HAPPY_SKULL_SCRUBS_PANTS,
              1
            );
            prop.lootItem(server, obj2, 1, false);
            const obj3 = server.generateItem(
              Items.REWARD_HAPPY_SKULL_SCRUBS_CAP,
              1
            );
            prop.lootItem(server, obj3, 1, false);
          }
          if (
            prop.hasItem(Items.QUEST_HUGZ_NEEDED_SCRUBS_SHIRT) &&
            prop.hasItem(Items.QUEST_HUGZ_NEEDED_SCRUBS_PANTS) &&
            prop.hasItem(Items.QUEST_HUGZ_NEEDED_SCRUBS_CAP)
          ) {
            const req1 = prop.getItemById(Items.QUEST_HUGZ_NEEDED_SCRUBS_SHIRT),
              req2 = prop.getItemById(Items.QUEST_HUGZ_NEEDED_SCRUBS_PANTS),
              req3 = prop.getItemById(Items.QUEST_HUGZ_NEEDED_SCRUBS_CAP);

            if (!req1 || !req2 || !req3) continue;

            if (
              !server.removeInventoryItem(prop, req1) ||
              !server.removeInventoryItem(prop, req2) ||
              !server.removeInventoryItem(prop, req3)
            ) {
              continue;
            }

            const obj4 = server.generateItem(
              Items.REWARD_HUGZ_NEEDED_SCRUBS_SHIRT,
              1
            );
            prop.lootItem(server, obj4, 1, false);
            const obj5 = server.generateItem(
              Items.REWARD_HUGZ_NEEDED_SCRUBS_PANTS,
              1
            );
            prop.lootItem(server, obj5, 1, false);
            const obj6 = server.generateItem(
              Items.REWARD_HUGZ_NEEDED_SCRUBS_CAP,
              1
            );
            prop.lootItem(server, obj6, 1, false);
          }
          if (
            prop.hasItem(Items.QUEST_KURAMA_MEDICAL_SCRUBS_SHIRT) &&
            prop.hasItem(Items.QUEST_KURAMA_MEDICAL_SCRUBS_PANTS) &&
            prop.hasItem(Items.QUEST_KURAMA_MEDICAL_SCRUBS_CAP)
          ) {
            const req1 = prop.getItemById(
                Items.QUEST_KURAMA_MEDICAL_SCRUBS_SHIRT
              ),
              req2 = prop.getItemById(Items.QUEST_KURAMA_MEDICAL_SCRUBS_PANTS),
              req3 = prop.getItemById(Items.QUEST_KURAMA_MEDICAL_SCRUBS_CAP);

            if (!req1 || !req2 || !req3) continue;

            if (
              !server.removeInventoryItem(prop, req1) ||
              !server.removeInventoryItem(prop, req2) ||
              !server.removeInventoryItem(prop, req3)
            ) {
              continue;
            }

            const obj10 = server.generateItem(
              Items.REWARD_KURAMA_MEDICAL_SCRUBS_SHIRT,
              1
            );
            prop.lootItem(server, obj10, 1, false);
            const obj11 = server.generateItem(
              Items.REWARD_KURAMA_MEDICAL_SCRUBS_PANTS,
              1
            );
            prop.lootItem(server, obj11, 1, false);
            const obj12 = server.generateItem(
              Items.REWARD_KURAMA_MEDICAL_SCRUBS_CAP,
              1
            );
            prop.lootItem(server, obj12, 1, false);
          }
          if (
            prop.hasItem(Items.QUEST_MILITARY_SCRUBS_SHIRT) &&
            prop.hasItem(Items.QUEST_MILITARY_SCRUBS_PANTS) &&
            prop.hasItem(Items.QUEST_MILITARY_SCRUBS_CAP)
          ) {
            const req1 = prop.getItemById(Items.QUEST_MILITARY_SCRUBS_SHIRT),
              req2 = prop.getItemById(Items.QUEST_MILITARY_SCRUBS_PANTS),
              req3 = prop.getItemById(Items.QUEST_MILITARY_SCRUBS_CAP);

            if (!req1 || !req2 || !req3) continue;

            if (
              !server.removeInventoryItem(prop, req1) ||
              !server.removeInventoryItem(prop, req2) ||
              !server.removeInventoryItem(prop, req3)
            ) {
              continue;
            }

            const obj7 = server.generateItem(
              Items.REWARD_MILITARY_SCRUBS_SHIRT,
              1
            );
            prop.lootItem(server, obj7, 1, false);
            const obj8 = server.generateItem(
              Items.REWARD_MILITARY_SCRUBS_PANTS,
              1
            );
            prop.lootItem(server, obj8, 1, false);
            const obj9 = server.generateItem(
              Items.REWARD_MILITARY_SCRUBS_CAP,
              1
            );
            prop.lootItem(server, obj9, 1, false);
          }
          break;
        case ModelIds.TREASURE_CHEST:
          const rewardChest = server._lootableProps[a] as TreasureChest;
          if (rewardChest) rewardChest.triggerRewards(server);

          if (rewardChest.clearChestTimer) {
            clearTimeout(rewardChest.clearChestTimer);
          }

          rewardChest.clearChestTimer = setTimeout(() => {
            // give the player 5 minutes to loot before clearing out the treasure chest. also check
            // if no players are currently accessing the chest
            if (!rewardChest.mountedCharacter) {
              const container = rewardChest.getContainer();
              for (const a in container!.items) {
                const item = container!.items[a];
                if (item.itemDefinitionId === rewardChest.requiredItemId)
                  continue; // skip worn letters
                server.removeContainerItem(
                  rewardChest,
                  item,
                  container,
                  item.stackCount
                );
              }
            }
          }, 300_000);
          break;
      }
    }
  }
  private async createContainerLoot(server: ZoneServer2016) {
    const transaction = apm.startTransaction(
      "WorldObjectManager::createContainerLoot",
      "custom"
    );
    const containerTables = this.lootTableManager.getContainerTables();
    let counter = 0;
    for (const a in server._lootableProps) {
      if (counter > 9) {
        counter = 0;
        await scheduler.yield();
      }
      counter++;
      const prop = server._lootableProps[a] as LootableProp;
      const container = prop.getContainer();
      if (!container) continue;
      if (!!Object.keys(container.items).length) continue;
      if (!prop.shouldSpawnLoot) continue;
      const lootTable = containerTables[prop.lootSpawner];
      if (lootTable) {
        const containerItemIds = new Set<number>(
          Object.values(container.items).map(
            (spawnedItem: BaseItem) => spawnedItem.itemDefinitionId
          )
        );
        for (const pool of lootTable.pools) {
          const rolls = pool.rolls
            ? randomIntFromInterval(pool.rolls.min, pool.rolls.max)
            : 1;
          for (let r = 0; r < rolls; r++) {
            const entry = getRandomItem(pool.entries);
            if (
              !entry ||
              (entry.type ?? "item") !== "item" ||
              entry.item === undefined
            )
              continue;
            if (containerItemIds.has(entry.item)) continue;
            const count = entry.count
              ? randomIntFromInterval(entry.count.min, entry.count.max)
              : 1;
            server.addContainerItem(
              prop,
              server.generateItem(getRandomSkin(entry.item), count),
              container
            );
            containerItemIds.add(entry.item);
          }
        }
      }
      if (Object.keys(container.items).length != 0) {
        Object.values(server._clients).forEach((client: ZoneClient2016) => {
          const index = client.searchedProps.indexOf(prop);
          if (index > -1) {
            client.searchedProps.splice(index, 1);
          }
        });
      }
    }
    transaction.end();
  }
}
