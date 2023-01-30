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

import { MongoClient } from "mongodb";
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
  ServerSaveData,
  WeaponSaveData,
} from "types/savedata";
import {
  fixDbTempData,
  getAppDataFolderPath,
  initMongo,
  toBigHex,
  _,
} from "../../../utils/utils";
import { ZoneServer2016 } from "../zoneserver";
import { Vehicle2016 } from "../entities/vehicle";
import { ZoneClient2016 as Client } from "../classes/zoneclient";
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
import { Items } from "../models/enums";
import { PlantingDiameter } from "../entities/plantingdiameter";
import { Plant } from "../entities/plant";
import { DB_COLLECTIONS } from "../../../utils/enums";
import { DB_NAME } from "../../../utils/constants";
import { Character2016 } from "../entities/character";
import { TemporaryEntity } from "../entities/temporaryentity";

const fs = require("fs");
const debug = require("debug")("ZoneServer");
export interface WorldArg {
  lastGuidItem: bigint;
  characters: CharacterUpdateSaveData[];
  worldConstructions: LootableConstructionSaveData[];
  tempEntities: TemporaryEntity[];
  constructions: ConstructionParentSaveData[];
}
export interface FetchedWorldData {
  constructionParents: ConstructionParentSaveData[];
  lastTransientId: number;
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
  private _db: any;
  readonly _appDataFolder = getAppDataFolderPath();
  private _worldId: number = 0;
  private _soloMode: boolean = false;
  //TODO: remove it from zoneserver then
  private _worldSaveVersion: number = 2;
  _isSaving: boolean = false;

  static async getDatabase(mongoAddress: string) {
    const mongoClient = new MongoClient(mongoAddress, {
      maxPoolSize: 50,
    });
    try {
      await mongoClient.connect();
    } catch (e) {
      throw debug("[ERROR]Unable to connect to mongo server " + mongoAddress);
    }
    debug("connected to mongo !");
    // if no collections exist on h1server database , fill it with samples
    (await mongoClient.db(DB_NAME).collections()).length ||
      (await initMongo(mongoClient, "ZoneServer"));
    return mongoClient.db(DB_NAME);
  }

  async initialize(worldId: number, mongoAddress: string) {
    this._soloMode = !mongoAddress;
    this._worldId = worldId;
    if (!this._soloMode) {
      this._db = await WorldDataManager.getDatabase(mongoAddress);
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
        worldSaveVersion: this._worldSaveVersion,
      });
      debug("Existing world was not found, created one.");
    } else {
      await this._db?.collection(DB_COLLECTIONS.WORLDS).insertOne({
        worldId: this._worldId,
        lastItemGuid: toBigHex(lastItemGuid),
        worldSaveVersion: this._worldSaveVersion,
      });
    }
  }

  async fetchWorldData(): Promise<FetchedWorldData> {
    //await this.loadVehicleData(server);
    const constructionParents =
      (await this.loadConstructionData()) as ConstructionParentSaveData[];
    // await this.loadWorldFreeplaceConstruction();
    // await this.loadCropData();
    debug("World fetched!");
    return { constructionParents, lastTransientId: 0 };
  }
  async deleteServerData() {
    if (this._soloMode) {
      fs.writeFileSync(
        `${this._appDataFolder}/worlddata/world.json`,
        JSON.stringify({}, null, 2)
      );
    } else {
      await this._db?.collection(DB_COLLECTIONS.WORLDS).deleteOne({
        worldId: this._worldId,
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
          serverId: this._worldId,
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
    if (this._isSaving) {
      // server.sendChatTextToAdmins("A save is already in progress.");
      return;
    }
    // server.sendChatTextToAdmins("World save started.");
    this._isSaving = true;
    try {
      //await this.saveVehicles(server);
      await this.saveServerData(world.lastGuidItem);
      await this.saveCharacters(world.characters);
      await this.saveConstructionData(world.constructions);
      // await this.saveWorldFreeplaceConstruction(
      //   world.worldConstructions,
      //   this._worldId
      // );
      // await this.saveCropData(world.tempEntities, this._worldId);
    } catch (e) {
      console.log(e);
      this._isSaving = false;
      // server.sendChatTextToAdmins("World save failed!");
    }
    this._isSaving = false;
    // server.sendChatTextToAdmins("World saved!");
    debug("World saved!");
  }

  //#region DATA GETTER HELPER FUNCTIONS

  static getBaseSaveData(serverId: number): BaseSaveData {
    return {
      serverId: serverId,
    };
  }

  static getBaseEntityUpdateSaveData(
    entity: BaseEntity
  ): BaseEntityUpdateSaveData {
    return {
      position: Array.from(entity.state.position),
      rotation: Array.from(entity.state.rotation),
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
      actorModelId: entity.actorModelId,
    };
  }

  static getWeaponSaveData(weapon: Weapon): WeaponSaveData {
    return {
      ammoCount: weapon.ammoCount,
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
      weapon: item.weapon ? this.getWeaponSaveData(item.weapon) : undefined,
    };
  }

  static getLoadoutItemSaveData(item: LoadoutItem): LoadoutItemSaveData {
    return {
      ...this.getItemSaveData(item),
      loadoutItemOwnerGuid: item.loadoutItemOwnerGuid,
    };
  }

  static getLoadoutContainerSaveData(
    container: LoadoutContainer
  ): LoadoutContainerSaveData {
    const items: { [itemGuid: string]: ItemSaveData } = {};
    Object.values(container.items).forEach((item) => {
      items[item.itemGuid] = {
        ...this.getItemSaveData(item),
      };
    });

    return {
      ...this.getLoadoutItemSaveData(container),
      containerDefinitionId: container.containerDefinitionId,
      items: items,
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
        ...this.getLoadoutItemSaveData(item),
      };
    });
    Object.values(entity._containers).forEach((container) => {
      containers[container.slotId] = {
        ...this.getLoadoutContainerSaveData(container),
      };
    });

    return {
      ...this.getBaseEntityUpdateSaveData(entity),
      _loadout: loadout,
      _containers: containers,
      _resources: entity._resources,
      worldSaveVersion: worldSaveVersion,
    };
  }

  //#endregion

  //#region SERVER DATA

  async getServerData(serverId: number): Promise<ServerSaveData | undefined> {
    let serverData: ServerSaveData;
    if (this._soloMode) {
      serverData = require(`${this._appDataFolder}/worlddata/world.json`);
      if (!serverData) {
        debug("World data not found in file, aborting.");
        return;
      }
    } else {
      serverData = <any>(
        await this._db
          ?.collection(DB_COLLECTIONS.WORLDS)
          .findOne({ worldId: serverId })
      );
    }
    return serverData;
  }

  private async saveServerData(lastItemGuid: bigint) {
    const saveData: ServerSaveData = {
      serverId: this._worldId,
      lastItemGuid: toBigHex(lastItemGuid),
      worldSaveVersion: this._worldSaveVersion,
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
            ...saveData,
          },
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
      const SinglePlayerCharacters = require(`${this._appDataFolder}/single_player_characters2016.json`);
      savedCharacter = SinglePlayerCharacters.find(
        (character: any) => character.characterId === characterId
      );
      if (!savedCharacter) {
        throw `[ERROR] Single player character not found! characterId: ${characterId}`;
      }
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
        position: loadedCharacter.position,
        rotation: loadedCharacter.rotation,
        _loadout: loadedCharacter._loadout || {},
        _containers: loadedCharacter._containers || {},
        _resources: loadedCharacter._resources || {},
        status: 1,
        worldSaveVersion: this._worldSaveVersion,
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
      charactersSaveData.push(
        this.convertToCharacterSaveData(character, worldId)
      );
    }
    return charactersSaveData;
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
    };
    return saveData;
  }
  async saveCharacterData(characterSaveData: CharacterUpdateSaveData) {
    if (this._soloMode) {
      const singlePlayerCharacters = require(`${this._appDataFolder}/single_player_characters2016.json`);
      let singlePlayerCharacter = singlePlayerCharacters.find(
        (character: any) => character.characterId === character.characterId
      );
      if (!singlePlayerCharacter) {
        console.log("[ERROR] Single player character savedata not found!");
        return;
      }
      singlePlayerCharacter = {
        ...singlePlayerCharacter,
        ...characterSaveData,
      };
      fs.writeFileSync(
        `${this._appDataFolder}/single_player_characters2016.json`,
        JSON.stringify([singlePlayerCharacter], null, 2)
      );
    } else {
      await this._db?.collection(DB_COLLECTIONS.CHARACTERS).updateOne(
        {
          serverId: this._worldId,
          characterId: characterSaveData.characterId,
        },
        {
          $set: {
            ...characterSaveData,
          },
        }
      );
    }
  }

  async saveCharacters(characters: CharacterUpdateSaveData[]) {
    const promises: Array<any> = [];
    for (let i = 0; i < characters.length; i++) {
      const character = characters[i];
      promises.push(
        this.saveCharacterData(character).then((ret: any) => {
          return ret;
        })
      );
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
        entityData.itemDefinitionId,
        entityData.parentObjectCharacterId,
        entityData.subEntityType
      );

    entity.placementTime = entityData.placementTime;

    if (entityData.container) {
      const container = constructContainer(entityData.container);
      entity._loadout["31"] = container;
      entity._containers["31"] = container;
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
        new Float32Array(entityData.rotation),
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
        new Float32Array(entityData.rotation),
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

    return foundation;
  }

  async loadConstructionData() {
    let constructionParents: Array<ConstructionParentSaveData> = [];
    if (this._soloMode) {
      constructionParents = require(`${this._appDataFolder}/worlddata/construction.json`);
      if (!constructionParents) {
        debug("Construction data not found in file, aborting.");
        return;
      }
    } else {
      const tempData = await this._db
        ?.collection(DB_COLLECTIONS.CONSTRUCTION_TEMP)
        .find({ serverId: this._worldId })
        .toArray();

      if (tempData.length) {
        await fixDbTempData(
          this._db,
          this._worldId,
          tempData,
          DB_COLLECTIONS.CONSTRUCTION,
          DB_COLLECTIONS.CONSTRUCTION_TEMP
        );
      }
      constructionParents = <any>(
        await this._db
          ?.collection("construction")
          .find({ serverId: this._worldId })
          .toArray()
      );
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
      slot: entity instanceof LootableConstructionEntity ? "" : entity.slot,
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
      rotation: Array.from(entity.startRot), // override quaternion rotation
    };
  }

  static getLootableConstructionSaveData(
    entity: LootableConstructionEntity,
    serverId: number
  ): LootableConstructionSaveData {
    return {
      ...this.getBaseConstructionSaveData(entity, serverId),
      container: entity.getContainer(),
      subEntityType: entity.subEntity?.subType || "",
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
      freeplaceEntities: freePlaceEntities,
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
      occupiedRampSlots: rampSlots,
    };
  }

  async saveConstructionData(
    constructions: ConstructionParentSaveData[]
  ) {
    if (this._soloMode) {
      fs.writeFileSync(
        `${this._appDataFolder}/worlddata/construction.json`,
        JSON.stringify(constructions, null, 2)
      );
    } else {
      const tempCollection = this._db?.collection(
        DB_COLLECTIONS.CONSTRUCTION_TEMP
      );
      if (constructions.length) await tempCollection?.insertMany(constructions);
      const collection = this._db?.collection(DB_COLLECTIONS.CONSTRUCTION);
      await collection?.deleteMany({ serverId: this._worldId });
      if (constructions.length) await collection?.insertMany(constructions);
      await tempCollection?.deleteMany({ serverId: this._worldId });
    }
  }

  static getPlantSaveData(entity: Plant, serverId: number): PlantSaveData {
    return {
      ...this.getBaseFullEntitySaveData(entity, serverId),
      growState: entity.growState,
      parentObjectCharacterId: entity.parentObjectCharacterId,
      slot: entity.slot,
      item: this.getItemSaveData(entity.item),
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
      isFertilized: entity.isFertilized,
    };
  }

  async saveCropData(temporaryObjects: TemporaryEntity[], serverId: number) {
    const crops: Array<PlantingDiameterSaveData> = [];

    Object.values(temporaryObjects).forEach((entity) => {
      if (entity instanceof PlantingDiameter) {
        crops.push(
          WorldDataManager.getPlantingDiameterSaveData(entity, serverId)
        );
      }
    });

    if (this._soloMode) {
      fs.writeFileSync(
        `${this._appDataFolder}/worlddata/crops.json`,
        JSON.stringify(crops, null, 2)
      );
    } else {
      const collection = this._db?.collection(DB_COLLECTIONS.CROPS);
      const tempCollection = this._db?.collection(DB_COLLECTIONS.CROPS_TEMP);
      if (crops.length) await tempCollection?.insertMany(crops);
      await collection?.deleteMany({ serverId: this._worldId });
      if (crops.length) await collection?.insertMany(crops);
      await tempCollection?.deleteMany({ serverId: this._worldId });
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

    server._plants[plant.characterId] = plant;
    return plant;
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

  async loadCropData(server: ZoneServer2016) {
    if (!server.enableWorldSaves) return;
    let crops: Array<PlantingDiameterSaveData> = [];
    if (server._soloMode) {
      crops = require(`${this._appDataFolder}/worlddata/crops.json`);
      if (!crops) {
        debug("Crop data not found in file, aborting.");
        return;
      }
    } else {
      const tempData = await server._db
        ?.collection("crop-temp")
        .find({ serverId: server._worldId })
        .toArray();
      if (tempData.length) {
        await fixDbTempData(
          this._db,
          this._worldId,
          tempData,
          DB_COLLECTIONS.CROPS,
          DB_COLLECTIONS.CROPS_TEMP
        );
      }
      crops = <any>(
        await server._db
          ?.collection(DB_COLLECTIONS.CROPS)
          .find({ serverId: server._worldId })
          .toArray()
      );
    }
    crops.forEach((entityData) => {
      WorldDataManager.loadPlantingDiameter(server, entityData);
    });
  }

  async saveWorldFreeplaceConstruction(
    worldLootableConstruction: LootableConstructionEntity[],
    serverId: number
  ) {
    //worldconstruction
    const freeplace: Array<LootableConstructionSaveData> = [];
    Object.values(worldLootableConstruction).forEach((entity) => {
      freeplace.push(
        WorldDataManager.getLootableConstructionSaveData(entity, serverId)
      );
    });

    if (this._soloMode) {
      fs.writeFileSync(
        `${this._appDataFolder}/worlddata/worldconstruction.json`,
        JSON.stringify(freeplace, null, 2)
      );
    } else {
      const collection = this._db?.collection(
        DB_COLLECTIONS.WORLD_CONSTRUCTIONS
      );
      const tempCollection = this._db?.collection(
        DB_COLLECTIONS.WORLD_CONSTRUCTIONS_TEMP
      );
      if (freeplace.length) await tempCollection?.insertMany(freeplace);
      await collection?.deleteMany({ serverId: this._worldId });
      if (freeplace.length) await collection?.insertMany(freeplace);
      await tempCollection?.deleteMany({ serverId: this._worldId });
    }
  }

  async loadWorldFreeplaceConstruction(server: ZoneServer2016) {
    //worldconstruction
    if (!server.enableWorldSaves) return;
    let freeplace: Array<LootableConstructionSaveData> = [];
    if (server._soloMode) {
      freeplace = require(`${this._appDataFolder}/worlddata/worldconstruction.json`);
      if (!freeplace) {
        debug("World construction data not found in file, aborting.");
        return;
      }
    } else {
      const tempData = await server._db
        ?.collection(DB_COLLECTIONS.WORLD_CONSTRUCTIONS_TEMP)
        .find({ serverId: server._worldId })
        .toArray();
      if (tempData.length) {
        await fixDbTempData(
          this._db,
          this._worldId,
          tempData,
          DB_COLLECTIONS.WORLD_CONSTRUCTIONS,
          DB_COLLECTIONS.WORLD_CONSTRUCTIONS_TEMP
        );
      }
      freeplace = <any>(
        await server._db
          ?.collection(DB_COLLECTIONS.WORLD_CONSTRUCTIONS)
          .find({ serverId: server._worldId })
          .toArray()
      );
    }
    freeplace.forEach((entityData) => {
      WorldDataManager.loadLootableConstructionEntity(server, entityData, true);
    });
  }

  //#endregion
}
