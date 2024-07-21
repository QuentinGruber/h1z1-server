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
const bannedZombieModels = require("../../../../data/2016/sampleData/bannedZombiesModels.json");
import {
  _,
  generateRandomGuid,
  isPosInRadius,
  randomIntFromInterval,
  fixEulerOrder,
  movePoint3D,
  getCurrentServerTimeWrapper
} from "../../../utils/utils";
import {
  EquipSlots,
  Items,
  Skins_Shirt,
  Skins_Pants,
  Skins_Beanie,
  Skins_Cap,
  Skins_MotorHelmet,
  Skins_Kevlar,
  Skins_Military,
  Skins_Glasses,
  Effects,
  ModelIds,
  Skins_Conveys,
  Skins_Backpack,
  Skins_Sniper,
  Skins_Shotgun,
  Skins_AK47,
  Skins_AR15,
  Skins_TacticalHelmet,
  Skins_Respirator,
  Skins_Bandana,
  Skins_Boots
} from "../models/enums";
import { Vehicle2016 } from "../entities/vehicle";
import { LootDefinition } from "types/zoneserver";
import { ItemObject } from "../entities/itemobject";
import { DoorEntity } from "../entities/doorentity";
import { Zombie } from "../entities/zombie";
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
import { Wolf } from "../entities/wolf";
import { Deer } from "../entities/deer";
import { Bear } from "../entities/bear";
const debug = require("debug")("ZoneServer");

function getRandomSkin(itemDefinitionId: number) {
  let itemDefId = 0;
  let arr: any[] = [];
  switch (itemDefinitionId) {
    case Items.SHIRT_DEFAULT:
      arr = Object.keys(Skins_Shirt);
      break;
    case Items.PANTS_DEFAULT:
      arr = Object.keys(Skins_Pants);
      break;
    case Items.HAT_BEANIE:
      arr = Object.keys(Skins_Beanie);
      break;
    case Items.HAT_CAP:
      arr = Object.keys(Skins_Cap);
      break;
    case Items.HELMET_MOTORCYCLE:
      arr = Object.keys(Skins_MotorHelmet);
      break;
    case Items.KEVLAR_DEFAULT:
      arr = Object.keys(Skins_Kevlar);
      break;
    case Items.BACKPACK_MILITARY_TAN:
      arr = Object.keys(Skins_Military);
      break;
    case Items.BACKPACK_BLUE_ORANGE:
      arr = Object.keys(Skins_Backpack);
      break;
    case Items.ALL_PURPOSE_GOGGLES:
      arr = Object.keys(Skins_Glasses);
      break;
    case Items.CONVEYS_BLUE:
      arr = Object.keys(Skins_Conveys);
      break;
    case Items.BOOTS_TAN:
      arr = Object.keys(Skins_Boots);
      break;
    case Items.WEAPON_308:
      arr = Object.keys(Skins_Sniper);
      break;
    case Items.WEAPON_SHOTGUN:
      arr = Object.keys(Skins_Shotgun);
      break;
    case Items.WEAPON_AK47:
      arr = Object.keys(Skins_AK47);
      break;
    case Items.WEAPON_AR15:
      arr = Object.keys(Skins_AR15);
      break;
    case Items.HELMET_TACTICAL:
      arr = Object.keys(Skins_TacticalHelmet);
      break;
    case Items.RESPIRATOR:
      arr = Object.keys(Skins_Respirator);
      break;
    case Items.BANDANA_BASIC:
      arr = Object.keys(Skins_Bandana);
      break;
    default:
      return itemDefinitionId;
  }
  itemDefId = Number(arr[Math.floor((Math.random() * arr.length) / 2)]);
  return itemDefId;
}

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

    if (playerCount >= 60) {
      this.lootRespawnTimer = 600_000; // 10 min
    } else if (playerCount >= 30) {
      this.lootRespawnTimer = 900_000; // 15 min
    } else {
      this.lootRespawnTimer = 1_500_000; // 25 min
    }
  }

  run(server: ZoneServer2016) {
    debug("WOM::Run");
    this.getItemRespawnTimer(server);
    if (this._lastLootRespawnTime + this.lootRespawnTimer <= Date.now()) {
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

  private npcDespawner(server: ZoneServer2016) {
    for (const characterId in server._npcs) {
      const npc = server._npcs[characterId];
      // dead npc despawner
      if (
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

  private itemDespawner(server: ZoneServer2016) {
    for (const characterId in server._spawnedItems) {
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
      server,
      spawnerId
    );
    this.equipRandomSkins(server, zombie, this.zombieSlots, bannedZombieModels);
    server._npcs[characterId] = zombie;
    if (spawnerId) this.spawnedNpcs[spawnerId] = characterId;
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
    if (entity instanceof Zombie) {
      const wornLetters = [
        Items.WORN_LETTER_CHURCH_PV,
        Items.WORN_LETTER_LJ_PV,
        Items.WORN_LETTER_MISTY_DAM,
        Items.WORN_LETTER_RADIO,
        Items.WORN_LETTER_RUBY_LAKE,
        Items.WORN_LETTER_TOXIC_LAKE,
        Items.WORN_LETTER_VILLAS,
        Items.WORN_LETTER_WATER_TOWER
      ];

      const shouldGenerateWornLetter =
        Math.floor(Math.random() * 100) + 1 <= this.chanceWornLetter;
      if (shouldGenerateWornLetter) {
        const randomIndex = randomIntFromInterval(0, wornLetters.length - 1);
        const randomWornLetter = wornLetters[randomIndex];
        const newItem = server.generateItem(randomWornLetter, 1);
        entity.lootItem(server, newItem);
      }
    }

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

  replenishWaterSources(server: ZoneServer2016) {
    Object.values(server._taskProps).forEach((propInstance: any) => {
      if (propInstance instanceof WaterSource) propInstance.replenish();
    });
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
          new Float32Array(doorInstance.scale) ??
            new Float32Array([1, 1, 1, 1]),
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
    let tickRate = this.npcRespawnTimer;
    const size = _.size(server._clients);
    if (size <= 0) return;
    tickRate = this.npcRespawnTimer / size;
    for (const a in server._clients) {
      const client = server._clients[a];
      const zombieSpawnChance =
        Math.floor(Math.random() * 100) + 1 * (client.currentPOI ? 2 : 1);
      const wolfSpawnChance = client.currentPOI
        ? 0
        : Math.floor(Math.random() * 100) + 1;
      const bearSpawnChance = client.currentPOI
        ? 0
        : Math.floor(Math.random() * 100) + 1;
      const deerSpawnChance = client.currentPOI
        ? 0
        : Math.floor(Math.random() * 100) + 1;
      const pos = client.character.state.position;
      if (zombieSpawnChance >= 60) {
        const characterId = server.generateGuid();
        const randomAngle = Math.random() * (2 * Math.PI) - Math.PI;
        const newPos = movePoint3D(pos, randomAngle, 30);
        const newPosFixed = server.getHeight(newPos);
        const npc = new Zombie(
          characterId,
          server.getTransientId(characterId),
          9510,
          newPosFixed,
          new Float32Array([0, 0, 0, 0]),
          server
        );
        server._npcs[characterId] = npc;
      }

      if (wolfSpawnChance >= 70) {
        const characterId = server.generateGuid();
        const randomAngle = Math.random() * (2 * Math.PI) - Math.PI;
        const newPos = movePoint3D(pos, randomAngle, 50);
        const newPosFixed = server.getHeight(newPos);
        const npc = new Wolf(
          characterId,
          server.getTransientId(characterId),
          9003,
          newPosFixed,
          new Float32Array([0, 0, 0, 0]),
          server
        );
        server._npcs[characterId] = npc;
      }

      if (bearSpawnChance >= 80) {
        const characterId = server.generateGuid();
        const randomAngle = Math.random() * (2 * Math.PI) - Math.PI;
        const newPos = movePoint3D(pos, randomAngle, 50);
        const newPosFixed = server.getHeight(newPos);
        const npc = new Bear(
          characterId,
          server.getTransientId(characterId),
          9187,
          newPosFixed,
          new Float32Array([0, 0, 0, 0]),
          server
        );
        server._npcs[characterId] = npc;
      }

      if (deerSpawnChance >= 70) {
        const characterId = server.generateGuid();
        const randomAngle = Math.random() * (2 * Math.PI) - Math.PI;
        const newPos = movePoint3D(pos, randomAngle, 50);
        const newPosFixed = server.getHeight(newPos);
        const npc = new Deer(
          characterId,
          server.getTransientId(characterId),
          Math.floor(newPos[0]) % 2 == 1 ? 9253 : 9002, // randomize model
          newPosFixed,
          new Float32Array([0, 0, 0, 0]),
          server
        );
        server._npcs[characterId] = npc;
      }
      await new Promise((resolve) => setTimeout(resolve, Math.floor(tickRate)));
    }
  }

  createLoot(server: ZoneServer2016, lTables = lootTables) {
    Z1_items.forEach((spawnerType: any) => {
      const lootTable = lTables[spawnerType.actorDefinition];
      if (lootTable) {
        spawnerType.instances.forEach((itemInstance: any) => {
          if (this.spawnedLootObjects[itemInstance.id]) return;
          const chance = Math.floor(Math.random() * 100) + 1; // temporary spawnchance
          if (chance <= lootTable.spawnChance) {
            if (!WorldObjectManager.itemSpawnersChances[itemInstance.id]) {
              const realSpawnChance =
                ((lootTable.spawnChance / lootTable.items.length) *
                  spawnerType.instances.length) /
                100;
              WorldObjectManager.itemSpawnersChances[
                spawnerType.actorDefinition
              ] = realSpawnChance;
            }
            // temporary spawnchance
            const item = getRandomItem(lootTable.items);
            if (item) {
              this.createLootEntity(
                server,
                server.generateItem(
                  getRandomSkin(item.item),
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
        });
      }
    });
  }
  updateQuestContainers(server: ZoneServer2016) {
    Object.values(server._lootableProps).forEach((a) => {
      const prop = a as BaseFullCharacter;
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

            if (!req1 || !req2 || !req3 || !req4) return;

            if (
              !server.removeInventoryItem(prop, req1) ||
              !server.removeInventoryItem(prop, req2) ||
              !server.removeInventoryItem(prop, req3) ||
              !server.removeInventoryItem(prop, req4)
            ) {
              return;
            }

            const obj = server.generateItem(Items.BRAIN_TREATED, 1);
            prop.lootItem(server, obj, 1, false);
          }
          break;
        case 9347:
          const rewardChest = a as TreasureChest;
          if (rewardChest) rewardChest.triggerRewards(server);
          break;
      }
    });
  }
  createContainerLoot(server: ZoneServer2016) {
    for (const a in server._lootableProps) {
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
            if (chance <= item.weight) {
              const count = Math.floor(
                Math.random() *
                  (item.spawnCount.max - item.spawnCount.min + 1) +
                  item.spawnCount.min
              );
              // temporary spawnchance
              server.addContainerItem(
                prop,
                server.generateItem(getRandomSkin(item.item), count),
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
