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

import { Collection, Db, MongoClient } from "mongodb";
import {
  BaseConstructionSaveData,
  BaseEntityUpdateSaveData,
  BaseFullCharacterUpdateSaveData,
  BaseFullEntitySaveData,
  BaseSaveData,
  CharacterUpdateSaveData,
  ConstructionChildSaveData,
  ConstructionDoorSaveData,
  ConstructionParentSaveData,
  FullCharacterSaveData,
  FullVehicleSaveData,
  ItemSaveData,
  LoadoutContainerSaveData,
  LoadoutItemSaveData,
  LootableConstructionSaveData,
  PlantingDiameterSaveData,
  PlantSaveData,
  positionUpdate,
  ServerSaveData,
  TrapSaveData,
  WeaponSaveData
} from "types/savedata";
import {
  getAppDataFolderPath,
  getCurrentServerTimeWrapper,
  initMongo,
  removeUntransferableFields,
  toBigHex
} from "../../../utils/utils";
import { ZoneServer2016 } from "../zoneserver";
import { LoadoutItem } from "../classes/loadoutItem";
import { LoadoutContainer } from "../classes/loadoutcontainer";
import { BaseItem } from "../classes/baseItem";
import { Weapon } from "../classes/weapon";
import { BaseEntity } from "../entities/baseentity";
import { BaseFullCharacter } from "../entities/basefullcharacter";
import { ConstructionEntity } from "types/zoneserver";
import { ConstructionChildEntity } from "../entities/constructionchildentity";
import { ConstructionParentEntity } from "../entities/constructionparententity";
import { LootableConstructionEntity } from "../entities/lootableconstructionentity";
import { ConstructionDoor } from "../entities/constructiondoor";
import { PlantingDiameter } from "../entities/plantingdiameter";
import { Plant } from "../entities/plant";
import { DB_COLLECTIONS } from "../../../utils/enums";
import { DB_NAME } from "../../../utils/constants";
import { Character2016 } from "../entities/character";
import { Items } from "../models/enums";
import { Vehicle2016 } from "../entities/vehicle";
import { TrapEntity } from "../entities/trapentity";
import { ExplosiveEntity } from "../entities/explosiveentity";

const fs = require("node:fs");
const debug = require("debug")("ZoneServer");
export interface WorldArg {
  lastGuidItem: bigint;
  characters: CharacterUpdateSaveData[];
  worldConstructions: LootableConstructionSaveData[];
  crops: PlantingDiameterSaveData[];
  traps: TrapSaveData[];
  constructions: ConstructionParentSaveData[];
  vehicles: FullVehicleSaveData[];
}
export interface FetchedWorldData {
  constructionParents: ConstructionParentSaveData[];
  freeplace: LootableConstructionSaveData[];
  crops: PlantingDiameterSaveData[];
  traps: TrapSaveData[];
  lastTransientId: number;
  vehicles: FullVehicleSaveData[];
}

export function constructLoadout(
  savedLoadout: { [loadoutSlotId: number]: LoadoutItemSaveData },
  entityLoadout: { [loadoutSlotId: number]: LoadoutItem }
) {
  Object.values(savedLoadout).forEach((item) => {
    const loadoutItem = new LoadoutItem(
      new BaseItem(
        item.itemDefinitionId,
        item.itemGuid,
        item.currentDurability,
        item.stackCount
      ),
      item.slotId,
      item.loadoutItemOwnerGuid
    );
    loadoutItem.weapon = item.weapon
      ? new Weapon(loadoutItem, item.weapon.ammoCount)
      : undefined;
    entityLoadout[item.slotId] = loadoutItem;
  });
}

export function constructContainer(
  container: LoadoutContainerSaveData
): LoadoutContainer {
  const loadoutContainer = new LoadoutContainer(
    new LoadoutItem(
      new BaseItem(
        container.itemDefinitionId,
        container.itemGuid,
        container.currentDurability,
        container.stackCount
      ),
      container.slotId,
      container.loadoutItemOwnerGuid
    ),
    container.containerDefinitionId
  );
  Object.values(container.items).forEach((item) => {
    const i = new BaseItem(
      item.itemDefinitionId,
      item.itemGuid,
      item.currentDurability,
      item.stackCount
    );
    i.slotId = item.slotId;
    i.containerGuid = item.containerGuid;
    i.weapon = item.weapon ? new Weapon(i, item.weapon.ammoCount) : undefined;
    loadoutContainer.items[item.itemGuid] = i;
  });
  return loadoutContainer;
}

export function constructContainers(
  savedContainers: { [loadoutSlotId: number]: LoadoutContainerSaveData },
  entityContainers: { [loadoutSlotId: number]: LoadoutContainer }
) {
  Object.values(savedContainers).forEach((container) => {
    entityContainers[container.slotId] = constructContainer(container);
  });
}

export class WorldDataManager {
  private _db!: Db;
  private _appDataFolder = getAppDataFolderPath();
  private _worldId: number = 0;
  private _soloMode: boolean = false;
  readonly worldSaveVersion: number = 2;

  /** MANAGED BY CONFIGMANAGER - See defaultConfig.yaml for more information */
  /*saveTimeInterval: number = 600000;

  nextSaveTime: number = Date.now() + this.saveTimeInterval;*/

  static async getDatabase(mongoAddress: string): Promise<[Db, MongoClient]> {
    const mongoClient = new MongoClient(mongoAddress, {
      maxPoolSize: 100
    });
    try {
      await mongoClient.connect();
    } catch (e) {
      console.error(e);
      throw debug("[ERROR]Unable to connect to mongo server " + mongoAddress);
    }
    debug("connected to mongo !");
    // if no collections exist on h1server database , fill it with samples

    if (!(await mongoClient.db(DB_NAME).collections()).length) {
      await initMongo(mongoClient, "ZoneServer");
    }
    return [mongoClient.db(DB_NAME), mongoClient];
  }

  async initialize(worldId: number, mongoAddress: string) {
    this._soloMode = !mongoAddress;
    this._worldId = worldId;
    if (!this._soloMode) {
      [this._db] = await WorldDataManager.getDatabase(mongoAddress);
    }
  }

  async insertWorld(lastItemGuid: bigint) {
    if (this._soloMode) return;
    if (!this._worldId) {
      const worldCount: number =
        (await this._db?.collection(DB_COLLECTIONS.WORLDS).countDocuments()) ||
        0;
      this._worldId = worldCount + 1;
      await this._db?.collection(DB_COLLECTIONS.WORLDS).insertOne({
        worldId: this._worldId,
        lastItemGuid: toBigHex(lastItemGuid),
        worldSaveVersion: this.worldSaveVersion
      });
      debug("Existing world was not found, created one.");
    } else {
      await this._db?.collection(DB_COLLECTIONS.WORLDS).insertOne({
        worldId: this._worldId,
        lastItemGuid: toBigHex(lastItemGuid),
        worldSaveVersion: this.worldSaveVersion
      });
    }
  }

  async fetchWorldData(): Promise<FetchedWorldData> {
    const vehicles = (await this.loadVehiclesData()) as FullVehicleSaveData[];
    const constructionParents =
      (await this.loadConstructionData()) as ConstructionParentSaveData[];
    const freeplace =
      (await this.loadWorldFreeplaceConstruction()) as LootableConstructionSaveData[];
    const crops = (await this.loadCropData()) as PlantingDiameterSaveData[];
    const traps = (await this.loadTrapData()) as TrapSaveData[];
    debug("World fetched!");
    return {
      constructionParents,
      freeplace,
      crops,
      traps,
      lastTransientId: 0,
      vehicles
    };
  }
  async deleteServerData() {
    if (this._soloMode) {
      fs.writeFileSync(
        `${this._appDataFolder}/worlddata/world.json`,
        JSON.stringify({}, null, 2)
      );
    } else {
      await this._db?.collection(DB_COLLECTIONS.WORLDS).deleteOne({
        worldId: this._worldId
      });
    }
  }

  async deleteCharacters() {
    if (this._soloMode) {
      fs.writeFileSync(
        `${this._appDataFolder}/single_player_characters2016.json`,
        JSON.stringify([], null, 2)
      );
    } else {
      await this._db?.collection(DB_COLLECTIONS.CHARACTERS).updateMany(
        {
          serverId: this._worldId
        },
        { $set: { status: 0 } }
      );
    }
  }

  async deleteWorld() {
    await this.deleteServerData();
    await this.deleteCharacters();
    debug("World deleted!");
  }

  async saveWorld(world: WorldArg) {
    console.time("WDM: saveWorld");
    await this.saveVehicles(world.vehicles);
    await this.saveServerData(world.lastGuidItem);
    await this.saveCharacters(world.characters);
    await this.saveConstructionData(world.constructions);
    await this.saveWorldFreeplaceConstruction(world.worldConstructions);
    await this.saveCropData(world.crops);
    await this.saveTrapData(world.traps);
    console.timeEnd("WDM: saveWorld");
  }

  //#region DATA GETTER HELPER FUNCTIONS

  static getBaseSaveData(serverId: number): BaseSaveData {
    return {
      serverId: serverId
    };
  }

  static getBaseEntityUpdateSaveData(
    entity: BaseEntity
  ): BaseEntityUpdateSaveData {
    return {
      position: Array.from(entity.state.position),
      rotation: Array.from(entity.state.rotation)
    };
  }

  static getPositionUpdateSaveData(entity: Vehicle2016): positionUpdate {
    return {
      orientation: entity.positionUpdate.orientation,
      frontTilt: entity.positionUpdate.frontTilt,
      sideTilt: entity.positionUpdate.sideTilt
    };
  }

  static getBaseFullEntitySaveData(
    entity: BaseEntity,
    serverId: number
  ): BaseFullEntitySaveData {
    return {
      ...this.getBaseEntityUpdateSaveData(entity),
      ...this.getBaseSaveData(serverId),
      characterId: entity.characterId,
      actorModelId: entity.actorModelId
    };
  }

  static getWeaponSaveData(weapon: Weapon): WeaponSaveData {
    return {
      ammoCount: weapon.ammoCount
    };
  }

  static getItemSaveData(item: BaseItem): ItemSaveData {
    return {
      itemDefinitionId: item.itemDefinitionId,
      slotId: item.slotId,
      itemGuid: item.itemGuid,
      containerGuid: item.containerGuid,
      currentDurability: item.currentDurability,
      stackCount: item.stackCount,
      weapon: item.weapon ? this.getWeaponSaveData(item.weapon) : undefined
    };
  }

  static getLoadoutItemSaveData(item: LoadoutItem): LoadoutItemSaveData {
    return {
      ...this.getItemSaveData(item),
      loadoutItemOwnerGuid: item.loadoutItemOwnerGuid
    };
  }

  static getLoadoutContainerSaveData(
    container: LoadoutContainer
  ): LoadoutContainerSaveData {
    const items: { [itemGuid: string]: ItemSaveData } = {};
    Object.values(container.items).forEach((item) => {
      items[item.itemGuid] = {
        ...this.getItemSaveData(item)
      };
    });

    return {
      ...this.getLoadoutItemSaveData(container),
      containerDefinitionId: container.containerDefinitionId,
      items: items
    };
  }

  static getBaseFullCharacterUpdateSaveData(
    entity: BaseFullCharacter,
    worldSaveVersion: number
  ): BaseFullCharacterUpdateSaveData {
    const loadout: { [loadoutSlotId: number]: LoadoutItemSaveData } = {},
      containers: { [loadoutSlotId: number]: LoadoutContainerSaveData } = {};
    Object.values(entity._loadout).forEach((item) => {
      loadout[item.slotId] = {
        ...this.getLoadoutItemSaveData(item)
      };
    });
    Object.values(entity._containers).forEach((container) => {
      containers[container.slotId] = {
        ...this.getLoadoutContainerSaveData(container)
      };
    });

    return {
      ...this.getBaseEntityUpdateSaveData(entity),
      _loadout: loadout,
      _containers: containers,
      _resources: entity._resources,
      worldSaveVersion: worldSaveVersion
    };
  }

  //#endregion

  //#region SERVER DATA

  async getServerData(serverId: number): Promise<ServerSaveData | null> {
    let serverData: ServerSaveData | null;
    if (this._soloMode) {
      serverData = require(`${this._appDataFolder}/worlddata/world.json`);
      if (!serverData?.serverId) {
        debug("World data not found in file, aborting.");
        return null;
      }
    } else {
      serverData = await this._db
        ?.collection<ServerSaveData>(DB_COLLECTIONS.WORLDS)
        .findOne({ worldId: serverId });
      if (!serverData || !serverData.serverId) {
        debug("World data not found in mongo, aborting.");
        return null;
      }
    }
    return serverData ?? null;
  }

  private async saveServerData(lastItemGuid: bigint) {
    const saveData: ServerSaveData = {
      serverId: this._worldId,
      lastItemGuid: toBigHex(lastItemGuid),
      worldSaveVersion: this.worldSaveVersion
    };
    if (this._soloMode) {
      fs.writeFileSync(
        `${this._appDataFolder}/worlddata/world.json`,
        JSON.stringify(saveData, null, 2)
      );
    } else {
      await this._db?.collection(DB_COLLECTIONS.WORLDS).updateOne(
        { worldId: this._worldId },
        {
          $set: {
            ...saveData
          }
        }
      );
    }
  }

  //#endregion

  //#region CHARACTER DATA

  async fetchCharacterData(
    characterId: string
  ): Promise<FullCharacterSaveData> {
    let savedCharacter: FullCharacterSaveData;
    if (this._soloMode) {
      delete require.cache[
        require.resolve(
          `${this._appDataFolder}/single_player_characters2016.json`
        )
      ];
      const SinglePlayerCharacters = require(
        `${this._appDataFolder}/single_player_characters2016.json`
      );
      savedCharacter = SinglePlayerCharacters.find(
        (character: any) => character.characterId === characterId
      );
      if (!savedCharacter) {
        throw `[ERROR] Single player character not found! characterId: ${characterId}`;
      }
      savedCharacter.spawnGridData =
        savedCharacter.spawnGridData || Array(100).fill(0);
    } else {
      const loadedCharacter = await this._db
        ?.collection("characters")
        .findOne({ characterId: characterId });
      if (!loadedCharacter) {
        throw `[ERROR] Mongo character not found! characterId: ${characterId}`;
      }
      savedCharacter = {
        serverId: loadedCharacter.serverId,
        creationDate: loadedCharacter.creationDate,
        lastLoginDate: loadedCharacter.lastLoginDate,
        characterId: loadedCharacter.characterId,
        ownerId: loadedCharacter.ownerId,
        characterName: loadedCharacter.characterName,
        actorModelId: loadedCharacter.actorModelId,
        headActor: loadedCharacter.headActor,
        hairModel: loadedCharacter.hairModel,
        gender: loadedCharacter.gender,
        isRespawning: loadedCharacter.isRespawning || false,
        spawnGridData: loadedCharacter.spawnGridData || Array(100).fill(0),
        position: loadedCharacter.position,
        rotation: loadedCharacter.rotation,
        _loadout: loadedCharacter._loadout || {},
        _containers: loadedCharacter._containers || {},
        _resources: loadedCharacter._resources || {},
        mutedCharacters: loadedCharacter.mutedCharacters || [],
        groupId: 0, //loadedCharacter.groupId || 0,
        playTime: loadedCharacter.playTime ?? 0,
        lastDropPlayTime: loadedCharacter.lastDropPlayTime ?? 0,
        status: 1,
        worldSaveVersion: this.worldSaveVersion
      };
    }
    return savedCharacter;
  }

  static convertCharactersToSaveData(
    characters: Character2016[],
    worldId: number
  ) {
    const charactersSaveData: CharacterUpdateSaveData[] = [];
    for (let i = 0; i < characters.length; i++) {
      const character = characters[i];
      const characterSave = this.convertToCharacterSaveData(character, worldId);
      // TODO: this is a temp solution, a deepclone slow down the save process :(
      removeUntransferableFields(characterSave);
      charactersSaveData.push(characterSave);
    }
    return charactersSaveData;
  }

  static convertVehiclesToSaveData(characters: Vehicle2016[], worldId: number) {
    const vehiclesSaveData: FullVehicleSaveData[] = [];
    for (let i = 0; i < characters.length; i++) {
      const vehicle = characters[i];
      const vehicleSave = this.convertToVehicleSaveData(vehicle, worldId);
      // TODO: this is a temp solution, a deepclone slow down the save process :(
      removeUntransferableFields(vehicleSave);
      vehiclesSaveData.push(vehicleSave);
    }
    return vehiclesSaveData;
  }

  static convertToVehicleSaveData(vehicle: Vehicle2016, worldId: number) {
    const saveData: FullVehicleSaveData = {
      ...WorldDataManager.getBaseFullCharacterUpdateSaveData(vehicle, worldId),
      vehicleId: vehicle.vehicleId,
      actorModelId: vehicle.actorModelId,
      shaderGroupId: vehicle.shaderGroupId,
      characterId: vehicle.characterId,
      serverId: worldId,
      rotation: Array.from(vehicle.state.lookAt),
      positionUpdate: WorldDataManager.getPositionUpdateSaveData(vehicle)
    };
    return saveData;
  }

  static convertToCharacterSaveData(character: Character2016, worldId: number) {
    const saveData: CharacterUpdateSaveData = {
      ...WorldDataManager.getBaseFullCharacterUpdateSaveData(
        character,
        worldId
      ),
      characterId: character.characterId,
      rotation: Array.from(character.state.lookAt),
      isRespawning: character.isRespawning,
      playTime: character.playTime,
      lastDropPlayTime: character.lastDropPlaytime,
      spawnGridData: character.spawnGridData,
      mutedCharacters: character.mutedCharacters,
      groupId: 0 //character.groupId
    };
    return saveData;
  }
  async saveCharacterData(
    characterSaveData: CharacterUpdateSaveData,
    lastItemGuid?: bigint
  ) {
    /* 
      lastItemGuid MUST be saved whenever a character is saved (a character is saved on logout)
      in case of a crash so that a player can't end up with an item in their inventory with an
      itemGuid lower than the saved lastItemGuid
    */
    if (lastItemGuid) this.saveServerData(lastItemGuid);
    if (this._soloMode) {
      const singlePlayerCharacters = require(
        `${this._appDataFolder}/single_player_characters2016.json`
      );
      let singlePlayerCharacter = singlePlayerCharacters.find(
        (character: any) => character.characterId === character.characterId
      );
      if (!singlePlayerCharacter) {
        console.log("[ERROR] Single player character savedata not found!");
        return;
      }
      singlePlayerCharacter = {
        ...singlePlayerCharacter,
        ...characterSaveData
      };
      fs.writeFileSync(
        `${this._appDataFolder}/single_player_characters2016.json`,
        JSON.stringify([singlePlayerCharacter], null, 2)
      );
    } else {
      await this._db?.collection(DB_COLLECTIONS.CHARACTERS).updateOne(
        {
          serverId: this._worldId,
          characterId: characterSaveData.characterId
        },
        {
          $set: {
            ...characterSaveData
          }
        },
        { upsert: process.env.MONGO_TESTS ? true : false }
      );
    }
  }

  async saveCharacters(characters: CharacterUpdateSaveData[]) {
    const promises: Array<any> = [];
    for (let i = 0; i < characters.length; i++) {
      const character = characters[i];
      promises.push(this.saveCharacterData(character));
    }
    await Promise.all(promises);
  }

  //#endregion

  //#region VEHICLE DATA

  // private async loadVehicleData() {
  //   let vehicles: Array<FullVehicleSaveData>;
  //   if (this._soloMode) {
  //     vehicles = require(`${this._appDataFolder}/worlddata/vehicles.json`);
  //     if (!vehicles) {
  //       debug("Vehicle data not found in file, aborting.");
  //       return;
  //     }
  //   } else {
  //     vehicles = <any>(
  //       await this._db
  //         ?.collection("vehicles")
  //         .find({ worldId: this._worldId })
  //         .toArray()
  //     );
  //   }
  //   vehicles.forEach((vehicle) => {
  //     const transientId = server.getTransientId(vehicle.characterId);
  //     const vehicleData = new Vehicle2016(
  //       vehicle.characterId,
  //       transientId,
  //       0,
  //       new Float32Array(vehicle.position),
  //       new Float32Array(vehicle.rotation),
  //       server,
  //       server._gameTime,
  //       vehicle.vehicleId
  //     );
  //     constructLoadout(vehicle._loadout, vehicleData._loadout);
  //     constructContainers(vehicle._containers, vehicleData._containers);
  //     vehicleData._resources = vehicle._resources;
  //     server.worldObjectManager.createVehicle(server, vehicleData);
  //   });
  // }

  // async saveVehicles(server: ZoneServer2016) {
  //   if (!server.enableWorldSaves) return;
  //   const vehicles: Array<FullVehicleSaveData> = Object.values(
  //     server._vehicles
  //   ).map((vehicle) => {
  //     return {
  //       ...WorldDataManager.getBaseFullCharacterUpdateSaveData(server, vehicle),
  //       ...WorldDataManager.getBaseFullEntitySaveData(server, vehicle),
  //       characterId: vehicle.characterId,
  //       actorModelId: vehicle.actorModelId,
  //       vehicleId: vehicle.vehicleId,
  //       worldSaveVersion: server.worldSaveVersion,
  //     };
  //   });
  //   if (server._soloMode) {
  //     fs.writeFileSync(
  //       `${this._appDataFolder}/worlddata/vehicles.json`,
  //       JSON.stringify(vehicles, null, 2)
  //     );
  //   } else {
  //     const collection = server._db?.collection(DB_COLLECTIONS.VEHICLES);
  //     collection?.deleteMany({ serverId: server._worldId }); // clear vehicles
  //     if (vehicles.length) collection?.insertMany(vehicles);
  //   }
  // }
  //#endregion

  //#region CONSTRUCTION DATA

  static loadConstructionDoorEntity(
    server: ZoneServer2016,
    entityData: ConstructionDoorSaveData
  ): ConstructionDoor {
    const transientId = server.getTransientId(entityData.characterId),
      entity = new ConstructionDoor(
        entityData.characterId,
        transientId,
        entityData.actorModelId,
        new Float32Array(entityData.position),
        new Float32Array(entityData.rotation),
        server,
        entityData.itemDefinitionId,
        entityData.ownerCharacterId,
        entityData.parentObjectCharacterId,
        entityData.slot
      );
    entity.health = entityData.health;
    entity.passwordHash = entityData.passwordHash;
    entity.grantedAccess = entityData.grantedAccess;
    entity.placementTime = entityData.placementTime;

    server._constructionDoors[entity.characterId] = entity;

    return entity;
  }

  static loadLootableConstructionEntity(
    server: ZoneServer2016,
    entityData: LootableConstructionSaveData,
    isWorldConstruction: boolean = false
  ): LootableConstructionEntity {
    const transientId = server.getTransientId(entityData.characterId),
      entity = new LootableConstructionEntity(
        entityData.characterId,
        transientId,
        entityData.actorModelId,
        new Float32Array(entityData.position),
        new Float32Array(entityData.rotation),
        server,
        new Float32Array([1, 1, 1, 1]),
        entityData.itemDefinitionId,
        entityData.parentObjectCharacterId,
        entityData.subEntityType
      );
    entity.health = entityData.health;
    entity.placementTime = entityData.placementTime;

    if (entityData.container) {
      const container = constructContainer(entityData.container);
      entity._loadout["31"] = container;
      entity._containers["31"] = container;
    }
    if (entityData.subEntityType === "CollectingEntity") {
      server.smeltingManager._collectingEntities[entityData.characterId] =
        entityData.characterId;
      const container = entity.getContainer();
      switch (entityData.itemDefinitionId) {
        case Items.ANIMAL_TRAP:
          if (container) container.canAcceptItems = false;
          break;
        case Items.DEW_COLLECTOR:
        case Items.BEE_BOX:
          if (container) container.acceptedItems = [Items.WATER_EMPTY];
      }
    }
    if (isWorldConstruction) {
      server._worldLootableConstruction[entity.characterId] = entity;
      return entity;
    }
    server._lootableConstruction[entity.characterId] = entity;

    return entity;
  }

  static loadConstructionChildSlots(
    server: ZoneServer2016,
    parent: ConstructionChildEntity,
    entityData: ConstructionChildSaveData
  ) {
    Object.values(entityData.occupiedWallSlots).forEach((wallData) => {
      let wall: ConstructionChildEntity | ConstructionDoor;
      if ("occupiedWallSlots" in wallData) {
        wall = this.loadConstructionChildEntity(server, wallData);
      } else {
        wall = this.loadConstructionDoorEntity(server, wallData);
      }
      parent.setWallSlot(server, wall);
    });
    Object.values(entityData.occupiedUpperWallSlots).forEach((wallData) => {
      const wall = this.loadConstructionChildEntity(server, wallData);
      parent.setWallSlot(server, wall);
    });
    Object.values(entityData.occupiedShelterSlots).forEach((shelterData) => {
      const shelter = this.loadConstructionChildEntity(server, shelterData);
      parent.setShelterSlot(server, shelter);
    });
    Object.values(entityData.freeplaceEntities).forEach((freeplaceData) => {
      let freeplace:
        | ConstructionChildEntity
        | ConstructionDoor
        | LootableConstructionEntity;
      if ("occupiedWallSlots" in freeplaceData) {
        freeplace = this.loadConstructionChildEntity(server, freeplaceData);
      } else if ("passwordHash" in freeplaceData) {
        freeplace = this.loadConstructionDoorEntity(server, freeplaceData);
      } else {
        freeplace = this.loadLootableConstructionEntity(server, freeplaceData);
      }
      parent.addFreeplaceConstruction(freeplace);
    });
  }

  static loadConstructionChildEntity(
    server: ZoneServer2016,
    entityData: ConstructionChildSaveData
  ) {
    const transientId = server.getTransientId(entityData.characterId),
      entity = new ConstructionChildEntity(
        entityData.characterId,
        transientId,
        entityData.actorModelId,
        new Float32Array(entityData.position),
        new Float32Array([0, entityData.eulerAngle, 0, 0]),
        server,
        entityData.itemDefinitionId,
        entityData.parentObjectCharacterId,
        entityData.slot,
        entityData.eulerAngle
      );
    entity.health = entityData.health;
    entity.placementTime = entityData.placementTime;
    server._constructionSimple[entity.characterId] = entity;

    this.loadConstructionChildSlots(server, entity, entityData);

    return entity;
  }

  static loadConstructionParentEntity(
    server: ZoneServer2016,
    entityData: ConstructionParentSaveData
  ): ConstructionParentEntity {
    const transientId = server.getTransientId(entityData.characterId),
      foundation = new ConstructionParentEntity(
        entityData.characterId,
        transientId,
        entityData.actorModelId,
        new Float32Array(entityData.position),
        new Float32Array([0, entityData.eulerAngle, 0, 0]),
        server,
        entityData.itemDefinitionId,
        entityData.ownerCharacterId,
        "",
        entityData.parentObjectCharacterId,
        entityData.slot,
        entityData.eulerAngle
      );
    foundation.health = entityData.health;
    foundation.placementTime = entityData.placementTime;
    foundation.permissions = entityData.permissions;
    server._constructionFoundations[foundation.characterId] = foundation;

    this.loadConstructionChildSlots(server, foundation, entityData);

    Object.values(entityData.occupiedExpansionSlots).forEach(
      (expansionData) => {
        const expansion = WorldDataManager.loadConstructionParentEntity(
          server,
          expansionData
        );
        foundation.setExpansionSlot(expansion);
      }
    );

    Object.values(entityData.occupiedRampSlots).forEach((rampData) => {
      const ramp = this.loadConstructionChildEntity(server, rampData);
      foundation.setRampSlot(ramp);
    });
    foundation.updateSecuredState(server);
    return foundation;
  }

  async loadVehiclesData() {
    let vehicles: Array<FullVehicleSaveData> = [];
    if (this._soloMode) {
      vehicles = require(`${this._appDataFolder}/worlddata/vehicles.json`);
      if (!vehicles) {
        debug("vehicles data not found in file, aborting.");
        return;
      }
    } else {
      vehicles = <any>(
        await this._db
          ?.collection(DB_COLLECTIONS.VEHICLES)
          .find({ serverId: this._worldId })
          .toArray()
      );
    }
    return vehicles;
  }

  async loadConstructionData() {
    let constructionParents: Array<ConstructionParentSaveData> = [];
    if (this._soloMode) {
      constructionParents = require(
        `${this._appDataFolder}/worlddata/construction.json`
      );
      if (!constructionParents) {
        debug("Construction data not found in file, aborting.");
        return;
      }
    } else {
      constructionParents = <any>(
        await this._db
          ?.collection(DB_COLLECTIONS.CONSTRUCTION)
          .find({ serverId: this._worldId })
          .toArray()
      );
      if (!constructionParents.length) {
        console.log("load backup due to empty construction collection");
        constructionParents = <any>(
          await this._db
            ?.collection(DB_COLLECTIONS.CONSTRUCTION_BACKUP)
            .find({ serverId: this._worldId })
            .toArray()
        );
      }
    }
    return constructionParents;
  }

  static loadConstructionParentEntities(
    constructionParents: ConstructionParentSaveData[],
    server: ZoneServer2016
  ) {
    constructionParents.forEach((parent) => {
      WorldDataManager.loadConstructionParentEntity(server, parent);
    });
  }

  static getBaseConstructionSaveData(
    entity: ConstructionEntity,
    serverId: number
  ): BaseConstructionSaveData {
    return {
      ...this.getBaseFullEntitySaveData(entity, serverId),
      health: entity.health,
      placementTime: entity.placementTime,
      parentObjectCharacterId: entity.parentObjectCharacterId,
      itemDefinitionId: entity.itemDefinitionId,
      slot: entity instanceof LootableConstructionEntity ? "" : entity.slot
    };
  }

  static getConstructionDoorSaveData(
    entity: ConstructionDoor,
    serverId: number
  ): ConstructionDoorSaveData {
    return {
      ...this.getBaseConstructionSaveData(entity, serverId),
      ownerCharacterId: entity.ownerCharacterId,
      passwordHash: entity.passwordHash,
      grantedAccess: entity.grantedAccess,
      rotation: Array.from(entity.startRot) // override quaternion rotation
    };
  }

  static getLootableConstructionSaveData(
    entity: LootableConstructionEntity,
    serverId: number
  ): LootableConstructionSaveData {
    return {
      ...this.getBaseConstructionSaveData(entity, serverId),
      container: entity.getContainer(),
      subEntityType: entity.subEntity?.subType || ""
    };
  }

  static getConstructionChildSaveData(
    entity: ConstructionChildEntity,
    serverId: number
  ): ConstructionChildSaveData {
    const wallSlots: {
        [slot: number]: ConstructionChildSaveData | ConstructionDoorSaveData;
      } = {},
      upperWallSlots: { [slot: number]: ConstructionChildSaveData } = {},
      shelterSlots: { [slot: number]: ConstructionChildSaveData } = {},
      freePlaceEntities: {
        [characterId: string]:
          | ConstructionChildSaveData
          | ConstructionDoorSaveData
          | LootableConstructionSaveData;
      } = {};
    Object.values(entity.occupiedWallSlots).forEach((wall) => {
      if (wall instanceof ConstructionDoor) {
        wallSlots[wall.getSlotNumber()] = this.getConstructionDoorSaveData(
          wall,
          serverId
        );
      } else {
        wallSlots[wall.getSlotNumber()] = this.getConstructionChildSaveData(
          wall,
          serverId
        );
      }
    });
    Object.values(entity.occupiedUpperWallSlots).forEach((wall) => {
      upperWallSlots[wall.getSlotNumber()] = this.getConstructionChildSaveData(
        wall,
        serverId
      );
    });
    Object.values(entity.occupiedShelterSlots).forEach((shelter) => {
      shelterSlots[shelter.getSlotNumber()] = this.getConstructionChildSaveData(
        shelter,
        serverId
      );
    });
    Object.values(entity.freeplaceEntities).forEach((entity) => {
      if (entity instanceof ConstructionDoor) {
        freePlaceEntities[entity.characterId] =
          this.getConstructionDoorSaveData(entity, serverId);
      } else if (entity instanceof LootableConstructionEntity) {
        freePlaceEntities[entity.characterId] =
          this.getLootableConstructionSaveData(entity, serverId);
      } else {
        freePlaceEntities[entity.characterId] =
          this.getConstructionChildSaveData(entity, serverId);
      }
    });

    return {
      ...this.getBaseConstructionSaveData(entity, serverId),
      eulerAngle: entity.eulerAngle,
      occupiedWallSlots: wallSlots,
      occupiedUpperWallSlots: upperWallSlots,
      occupiedShelterSlots: shelterSlots,
      freeplaceEntities: freePlaceEntities
    };
  }

  static getConstructionParentSaveData(
    entity: ConstructionParentEntity,
    serverId: number
  ): ConstructionParentSaveData {
    const expansionSlots: { [slot: number]: ConstructionParentSaveData } = {},
      rampSlots: { [slot: number]: ConstructionChildSaveData } = {};
    Object.values(entity.occupiedExpansionSlots).forEach((expansion) => {
      expansionSlots[expansion.getSlotNumber()] =
        this.getConstructionParentSaveData(expansion, serverId);
    });
    Object.values(entity.occupiedRampSlots).forEach((ramp) => {
      rampSlots[ramp.getSlotNumber()] = this.getConstructionChildSaveData(
        ramp,
        serverId
      );
    });
    return {
      ...this.getConstructionChildSaveData(entity, serverId),
      permissions: entity.permissions,
      ownerCharacterId: entity.ownerCharacterId,
      occupiedExpansionSlots: expansionSlots,
      occupiedRampSlots: rampSlots
    };
  }

  async saveConstructionData(constructions: ConstructionParentSaveData[]) {
    if (this._soloMode) {
      fs.writeFileSync(
        `${this._appDataFolder}/worlddata/construction.json`,
        JSON.stringify(constructions, null, 2)
      );
    } else {
      const collection = this._db?.collection(
        DB_COLLECTIONS.CONSTRUCTION
      ) as Collection;
      const collectionBackup = this._db?.collection(
        DB_COLLECTIONS.CONSTRUCTION_BACKUP
      ) as Collection;
      await collectionBackup.deleteMany({ serverId: this._worldId });
      await collectionBackup.insertMany(structuredClone(constructions));
      await collection.deleteMany({
        serverId: this._worldId
      });
      await collection.insertMany(constructions);
    }
  }

  static getPlantSaveData(entity: Plant, serverId: number): PlantSaveData {
    return {
      ...this.getBaseFullEntitySaveData(entity, serverId),
      growState: entity.growState,
      nextStateTime: entity.nextStateTime,
      parentObjectCharacterId: entity.parentObjectCharacterId,
      slot: entity.slot,
      item: this.getItemSaveData(entity.item)
    };
  }

  static getPlantingDiameterSaveData(
    entity: PlantingDiameter,
    serverId: number
  ): PlantingDiameterSaveData {
    const slots: { [id: string]: PlantSaveData } = {};
    Object.values(entity.seedSlots).forEach((plant) => {
      slots[plant.slot] = this.getPlantSaveData(plant, serverId);
    });

    return {
      ...this.getBaseFullEntitySaveData(entity, serverId),
      seedSlots: slots,
      fertilizedTimestamp: entity.fertilizedTimestamp,
      isFertilized: entity.isFertilized
    };
  }

  async saveCropData(crops: PlantingDiameterSaveData[]) {
    if (this._soloMode) {
      fs.writeFileSync(
        `${this._appDataFolder}/worlddata/crops.json`,
        JSON.stringify(crops, null, 2)
      );
    } else {
      const collection = this._db?.collection(
        DB_COLLECTIONS.CROPS
      ) as Collection;
      const updatePromises = [];
      for (let i = 0; i < crops.length; i++) {
        const construction = crops[i];
        updatePromises.push(
          collection.updateOne(
            { characterId: construction.characterId, serverId: this._worldId },
            { $set: construction },
            { upsert: true }
          )
        );
      }
      await Promise.all(updatePromises);
      const allCharactersIds = crops.map((crop) => {
        return crop.characterId;
      });
      await collection.deleteMany({
        serverId: this._worldId,
        characterId: { $nin: allCharactersIds }
      });
    }
  }

  static loadPlant(
    server: ZoneServer2016,
    parent: PlantingDiameter,
    entityData: PlantSaveData
  ): Plant {
    const item = new BaseItem(
        entityData.item.itemDefinitionId,
        entityData.item.itemGuid,
        entityData.item.currentDurability,
        entityData.item.stackCount
      ),
      transientId = server.getTransientId(entityData.characterId),
      plant = new Plant(
        entityData.characterId,
        transientId,
        entityData.actorModelId,
        new Float32Array(entityData.position),
        new Float32Array(entityData.rotation),
        server,
        0,
        item,
        parent.characterId,
        entityData.slot
      );
    plant.growState = entityData.growState;
    plant.nextStateTime = entityData.nextStateTime;

    server._plants[plant.characterId] = plant;
    return plant;
  }

  static loadVehicles(server: ZoneServer2016, entityData: FullVehicleSaveData) {
    const transientId = server.getTransientId(entityData.characterId),
      vehicle = new Vehicle2016(
        entityData.characterId,
        transientId,
        entityData.actorModelId,
        new Float32Array(entityData.position),
        new Float32Array(entityData.rotation),
        server,
        getCurrentServerTimeWrapper().getTruncatedU32(),
        entityData.vehicleId,
        entityData?.shaderGroupId ?? 0
      );
    vehicle._resources = entityData._resources;
    Object.assign(vehicle.positionUpdate, entityData.positionUpdate);
    constructLoadout(entityData._loadout, vehicle._loadout);
    constructContainers(entityData._containers, vehicle._containers);
    server._vehicles[vehicle.characterId] = vehicle;
  }

  static loadPlantingDiameter(
    server: ZoneServer2016,
    entityData: PlantingDiameterSaveData
  ) {
    const transientId = server.getTransientId(entityData.characterId),
      plantingDiameter = new PlantingDiameter(
        entityData.characterId,
        transientId,
        entityData.actorModelId,
        new Float32Array(entityData.position),
        new Float32Array(entityData.rotation),
        server
      );

    plantingDiameter.fertilizedTimestamp = entityData.fertilizedTimestamp;
    plantingDiameter.isFertilized = entityData.isFertilized;
    server._temporaryObjects[plantingDiameter.characterId] = plantingDiameter;

    Object.values(entityData.seedSlots).forEach((plant) => {
      plantingDiameter.seedSlots[plant.slot] = this.loadPlant(
        server,
        plantingDiameter,
        plant
      );
    });
  }

  async loadCropData() {
    let crops: Array<PlantingDiameterSaveData> = [];
    if (this._soloMode) {
      crops = require(`${this._appDataFolder}/worlddata/crops.json`);
      if (!crops) {
        debug("Crop data not found in file, aborting.");
        return;
      }
    } else {
      crops = <any>(
        await this._db
          ?.collection(DB_COLLECTIONS.CROPS)
          .find({ serverId: this._worldId })
          .toArray()
      );
    }
    return crops;
  }

  async saveVehicles(vehicles: FullVehicleSaveData[]) {
    if (this._soloMode) {
      fs.writeFileSync(
        `${this._appDataFolder}/worlddata/vehicles.json`,
        JSON.stringify(vehicles, null, 2)
      );
    } else {
      const collection = this._db?.collection(DB_COLLECTIONS.VEHICLES);
      const updatePromises = [];
      for (let i = 0; i < vehicles.length; i++) {
        const vehicle = vehicles[i];
        updatePromises.push(
          collection.updateOne(
            { characterId: vehicle.characterId, serverId: this._worldId },
            { $set: vehicle },
            { upsert: true }
          )
        );
      }
      await Promise.all(updatePromises);
      const allCharactersIds = vehicles.map((vehicle) => {
        return vehicle.characterId;
      });
      await collection.deleteMany({
        serverId: this._worldId,
        characterId: { $nin: allCharactersIds }
      });
    }
  }

  async saveWorldFreeplaceConstruction(
    freeplaces: LootableConstructionSaveData[]
  ) {
    if (this._soloMode) {
      fs.writeFileSync(
        `${this._appDataFolder}/worlddata/worldconstruction.json`,
        JSON.stringify(freeplaces, null, 2)
      );
    } else {
      const collection = this._db?.collection(
        DB_COLLECTIONS.WORLD_CONSTRUCTIONS
      );
      const updatePromises = [];
      for (let i = 0; i < freeplaces.length; i++) {
        const construction = freeplaces[i];
        updatePromises.push(
          collection.updateOne(
            { characterId: construction.characterId, serverId: this._worldId },
            { $set: construction },
            { upsert: true }
          )
        );
      }
      await Promise.all(updatePromises);
      const allCharactersIds = freeplaces.map((freeplace) => {
        return freeplace.characterId;
      });
      await collection.deleteMany({
        serverId: this._worldId,
        characterId: { $nin: allCharactersIds }
      });
    }
  }

  async loadWorldFreeplaceConstruction() {
    //worldconstruction
    let freeplace: Array<LootableConstructionSaveData> = [];
    if (this._soloMode) {
      freeplace = require(
        `${this._appDataFolder}/worlddata/worldconstruction.json`
      );
      if (!freeplace) {
        debug("World construction data not found in file, aborting.");
        return;
      }
    } else {
      freeplace = <any>(
        await this._db
          ?.collection(DB_COLLECTIONS.WORLD_CONSTRUCTIONS)
          .find({ serverId: this._worldId })
          .toArray()
      );
    }
    return freeplace;
  }

  static getTrapSaveData(
    entity: TrapEntity | ExplosiveEntity,
    serverId: number
  ): TrapSaveData {
    return {
      ...this.getBaseFullEntitySaveData(entity, serverId),
      ownerCharacterId: entity.ownerCharacterId,
      itemDefinitionId: entity.itemDefinitionId,
      health: entity.health
    };
  }

  async saveTrapData(traps: TrapSaveData[]) {
    if (this._soloMode) {
      fs.writeFileSync(
        `${this._appDataFolder}/worlddata/traps.json`,
        JSON.stringify(traps, null, 2)
      );
    } else {
      const collection = this._db?.collection(
        DB_COLLECTIONS.TRAPS
      ) as Collection;
      const updatePromises = [];
      for (let i = 0; i < traps.length; i++) {
        const construction = traps[i];
        updatePromises.push(
          collection.updateOne(
            { characterId: construction.characterId, serverId: this._worldId },
            { $set: construction },
            { upsert: true }
          )
        );
      }
      await Promise.all(updatePromises);
      const allCharactersIds = traps.map((trap) => {
        return trap.characterId;
      });
      await collection.deleteMany({
        serverId: this._worldId,
        characterId: { $nin: allCharactersIds }
      });
    }
  }

  async loadTrapData() {
    let traps: Array<TrapSaveData> = [];
    if (this._soloMode) {
      traps = require(`${this._appDataFolder}/worlddata/traps.json`);
      if (!traps) {
        debug("trap data not found in file, aborting.");
        return;
      }
    } else {
      traps = <any>(
        await this._db
          ?.collection(DB_COLLECTIONS.TRAPS)
          .find({ serverId: this._worldId })
          .toArray()
      );
    }
    return traps;
  }

  static loadTraps(server: ZoneServer2016, entityData: TrapSaveData) {
    const transientId = server.getTransientId(entityData.characterId);
    switch (entityData.itemDefinitionId) {
      case Items.LANDMINE:
        const explosive = new ExplosiveEntity(
          entityData.characterId,
          transientId,
          entityData.actorModelId,
          new Float32Array(entityData.position),
          new Float32Array(entityData.rotation),
          server,
          entityData.itemDefinitionId,
          entityData.ownerCharacterId
        );
        server._explosives[entityData.characterId] = explosive;
        //explosive.arm(server);
        //temporarily Disabled
        break;
      default:
        const trap = new TrapEntity(
          entityData.characterId,
          transientId,
          entityData.actorModelId,
          new Float32Array(entityData.position),
          new Float32Array(entityData.rotation),
          server,
          entityData.itemDefinitionId,
          false,
          entityData.ownerCharacterId
        );
        trap.health = entityData.health;
        server._traps[trap.characterId] = trap;
      //trap.arm(server);
      //temporarily disabled
    }
  }

  //#endregion
}
