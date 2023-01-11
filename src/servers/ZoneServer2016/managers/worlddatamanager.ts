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
  CharacterUpdateSaveData,
  FullCharacterSaveData,
  FullVehicleSaveData,
  LoadoutContainerSaveData,
  LoadoutItemSaveData,
  ServerSaveData,
} from "types/savedata";
import { initMongo, toBigHex, _ } from "../../../utils/utils";
import { ZoneServer2016 } from "../zoneserver";
import { Vehicle2016 } from "../classes/vehicle";
import { ZoneClient2016 as Client } from "../classes/zoneclient";
import { LoadoutItem } from "../classes/loadoutItem";
import { LoadoutContainer } from "../classes/loadoutcontainer";
import { BaseItem } from "../classes/baseItem";
import { Weapon } from "../classes/weapon";

const fs = require("fs");
const debug = require("debug")("ZoneServer");

function constructLoadout(
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

function constructContainers(
  savedContainers: { [loadoutSlotId: number]: LoadoutContainerSaveData },
  entityContainers: { [loadoutSlotId: number]: LoadoutContainer }
) {
  Object.values(savedContainers).forEach((container) => {
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
    entityContainers[container.slotId] = loadoutContainer;
  });
}

export class WorldDataManager {
  lastSaveTime = 0;
  saveTimer = 600000; // 10 minutes
  run(server: ZoneServer2016) {
    if (!server.enableWorldSaves) return;
    debug("WorldDataManager::Run");
    if (this.lastSaveTime + this.saveTimer <= Date.now()) {
      server.executeFuncForAllReadyClients((client: Client) => {
        this.saveCharacterData(server, client);
      });
      // save here

      this.lastSaveTime = Date.now();
    }
  }

  async initializeDatabase(server: ZoneServer2016) {
    if (server._mongoAddress) {
      const mongoClient = new MongoClient(server._mongoAddress, {
        maxPoolSize: 50,
      });
      try {
        await mongoClient.connect();
      } catch (e) {
        throw debug(
          "[ERROR]Unable to connect to mongo server " + server._mongoAddress
        );
      }
      debug("connected to mongo !");
      // if no collections exist on h1server database , fill it with samples
      (await mongoClient.db("h1server").collections()).length ||
        (await initMongo(mongoClient, "ZoneServer"));
      server._db = mongoClient.db("h1server");
    }
  }

  async insertWorld(server: ZoneServer2016) {
    if (!server._worldId) {
      const worldCount: number =
        (await server._db?.collection("worlds").countDocuments()) || 0;
      server._worldId = worldCount + 1;
      await server._db?.collection("worlds").insertOne({
        worldId: server._worldId,
        lastItemGuid: toBigHex(server.lastItemGuid),
        worldSaveVersion: server.worldSaveVersion,
      });
      debug("Existing world was not found, created one.");
    } else {
      await server._db?.collection("worlds").insertOne({
        worldId: server._worldId,
        lastItemGuid: toBigHex(server.lastItemGuid),
        worldSaveVersion: server.worldSaveVersion,
      });
    }
  }

  async fetchWorldData(server: ZoneServer2016) {
    if (!server.enableWorldSaves) return;
    //await this.loadVehicleData(server);
    await this.loadServerData(server);
    server._transientIds = server.getAllCurrentUsedTransientId();
    debug("World fetched!");
  }
  async deleteServerData(server: ZoneServer2016) {
    if (!server.enableWorldSaves) return;
    if (server._soloMode) {
      fs.writeFileSync(
        `${server._appDataFolder}/worlddata/world.json`,
        JSON.stringify({}, null, 2)
      );
    } else {
      await server._db?.collection("worlds").deleteOne({
        worldId: server._worldId,
      });
    }
  }

  async deleteCharacters(server: ZoneServer2016) {
    if (!server.enableWorldSaves) return;
    if (server._soloMode) {
      fs.writeFileSync(
        `${server._appDataFolder}/single_player_characters2016.json`,
        JSON.stringify({}, null, 2)
      );
    } else {
      await server._db?.collection("characters").updateMany(
        {
          serverId: server._worldId,
        },
        { $set: { status: 0 } }
      );
    }
  }

  async deleteWorld(server: ZoneServer2016) {
    await this.deleteServerData(server);
    await this.deleteCharacters(server);
    debug("World deleted!");
  }

  async saveWorld(server: ZoneServer2016) {
    //await this.saveVehicles(server);
    await this.saveServerData(server);
    await this.saveCharacters(server);
    debug("World saved!");
  }

  //#region SERVER DATA

  private async loadServerData(server: ZoneServer2016) {
    if (!server.enableWorldSaves) return;
    let serverData: ServerSaveData;
    if (server._soloMode) {
      serverData = require(`${server._appDataFolder}/worlddata/world.json`);
      if (!serverData) {
        debug("World data not found in file, aborting.");
        return;
      }
    } else {
      serverData = <any>(
        await server._db
          ?.collection("worlds")
          .find({ worldId: server._worldId })
      );
    }
    server.lastItemGuid = BigInt(
      serverData.lastItemGuid || server.lastItemGuid
    );
  }

  private async saveServerData(server: ZoneServer2016) {
    if (!server.enableWorldSaves) return;
    const saveData: ServerSaveData = {
      serverId: server._worldId,
      lastItemGuid: toBigHex(server.lastItemGuid),
      worldSaveVersion: server.worldSaveVersion,
    };
    if (server._soloMode) {
      fs.writeFileSync(
        `${server._appDataFolder}/worlddata/world.json`,
        JSON.stringify(saveData, null, 2)
      );
    } else {
      await server._db?.collection("worlds").updateOne(
        { worldId: server._worldId },
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

  async loadCharacterData(server: ZoneServer2016, client: Client) {
    if (!server.hookManager.checkHook("OnLoadCharacterData", client)) return;
    if (
      !(await server.hookManager.checkAsyncHook("OnLoadCharacterData", client))
    )
      return;

    let savedCharacter: FullCharacterSaveData;
    if (server._soloMode) {
      delete require.cache[
        require.resolve(
          `${server._appDataFolder}/single_player_characters2016.json`
        )
      ];
      const SinglePlayerCharacters = require(`${server._appDataFolder}/single_player_characters2016.json`);
      savedCharacter = SinglePlayerCharacters.find(
        (character: any) =>
          character.characterId === client.character.characterId
      );
      if (!savedCharacter) {
        console.log(
          `[ERROR] Single player character not found! characterId: ${client.character.characterId}`
        );
        return;
      }
    } else {
      const loadedCharacter = await server._db
        ?.collection("characters")
        .findOne({ characterId: client.character.characterId });
      if (!loadedCharacter) {
        console.log(
          `[ERROR] Mongo character not found! characterId: ${client.character.characterId}`
        );
        return;
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
        _resources: loadedCharacter._resources || client.character._resources,
        status: 1,
        worldSaveVersion: server.worldSaveVersion,
      };
    }
    client.guid = "0x665a2bff2b44c034"; // default, only matters for multiplayer
    client.character.name = savedCharacter.characterName;
    client.character.actorModelId = savedCharacter.actorModelId;
    client.character.headActor = savedCharacter.headActor;
    client.character.isRespawning = savedCharacter.isRespawning;
    client.character.gender = savedCharacter.gender;
    client.character.creationDate = savedCharacter.creationDate;
    client.character.lastLoginDate = savedCharacter.lastLoginDate;
    client.character.hairModel = savedCharacter.hairModel || "";

    let newCharacter = false;
    if (
      _.isEqual(savedCharacter.position, [0, 0, 0, 1]) &&
      _.isEqual(savedCharacter.rotation, [0, 0, 0, 1])
    ) {
      // if position/rotation hasn't changed
      newCharacter = true;
    }

    if (
      newCharacter ||
      client.character.isRespawning ||
      !server.enableWorldSaves
    ) {
      client.character.isRespawning = false;
      await server.respawnPlayer(client);
    } else {
      client.character.state.position = new Float32Array(
        savedCharacter.position
      );
      client.character.state.rotation = new Float32Array(
        savedCharacter.rotation
      );
      constructLoadout(savedCharacter._loadout, client.character._loadout);
      constructContainers(
        savedCharacter._containers,
        client.character._containers
      );
      client.character._resources =
        savedCharacter._resources || client.character._resources;
      client.character.generateEquipmentFromLoadout(server);
    }

    server.hookManager.checkHook("OnLoadedCharacterData", client);
  }

  async saveCharacterData(
    server: ZoneServer2016,
    client: Client,
    updateItemGuid = true
  ) {
    if (!server.enableWorldSaves) return;
    if (updateItemGuid) await this.saveServerData(server);
    const loadoutKeys = Object.keys(client.character._loadout),
      containerKeys = Object.keys(client.character._containers),
      loadoutSaveData: { [loadoutSlotId: number]: LoadoutItemSaveData } = {},
      containerSaveData: { [loadoutSlotId: number]: LoadoutContainerSaveData } =
        {};
    Object.values(client.character._loadout).forEach((item, idx) => {
      loadoutSaveData[Number(loadoutKeys[idx])] = item;
    });
    Object.values(client.character._containers).forEach((item, idx) => {
      containerSaveData[Number(containerKeys[idx])] = item;
    });

    const saveData: CharacterUpdateSaveData = {
      position: Array.from(client.character.state.position),
      rotation: Array.from(client.character.state.lookAt),
      isRespawning: client.character.isRespawning,
      _loadout: loadoutSaveData,
      _containers: containerSaveData,
      _resources: client.character._resources,
      worldSaveVersion: server.worldSaveVersion,
    };
    if (server._soloMode) {
      const singlePlayerCharacters = require(`${server._appDataFolder}/single_player_characters2016.json`);
      let singlePlayerCharacter = singlePlayerCharacters.find(
        (character: any) =>
          character.characterId === client.character.characterId
      );
      if (!singlePlayerCharacter) {
        console.log("[ERROR] Single player character savedata not found!");
        return;
      }
      singlePlayerCharacter = {
        ...singlePlayerCharacter,
        ...saveData,
      };
      fs.writeFileSync(
        `${server._appDataFolder}/single_player_characters2016.json`,
        JSON.stringify([singlePlayerCharacter], null, 2)
      );
    } else {
      await server._db?.collection("characters").updateOne(
        {
          serverId: server._worldId,
          characterId: client.character.characterId,
        },
        {
          $set: {
            ...saveData,
          },
        }
      );
    }
  }

  async saveCharacters(server: ZoneServer2016) {
    if (!server.enableWorldSaves) return;
    const promises: Array<any> = [];
    await this.saveServerData(server);
    server.executeFuncForAllReadyClients((client: Client) => {
      promises.push(
        server.worldDataManager
          .saveCharacterData(server, client, false)
          .then((ret) => {
            return ret;
          })
      );
    });
    await Promise.all(promises);
  }

  //#endregion

  //#region VEHICLE DATA

  private async loadVehicleData(server: ZoneServer2016) {
    if (!server.enableWorldSaves) return;
    let vehicles: Array<FullVehicleSaveData>;
    if (server._soloMode) {
      vehicles = require(`${server._appDataFolder}/worlddata/vehicles.json`);
      if (!vehicles) {
        debug("Vehicle data not found in file, aborting.");
        return;
      }
    } else {
      vehicles = <any>(
        await server._db
          ?.collection("vehicles")
          .find({ worldId: server._worldId })
          .toArray()
      );
    }
    vehicles.forEach((vehicle) => {
      const transientId = server.getTransientId(vehicle.characterId);
      const vehicleData = new Vehicle2016(
        vehicle.characterId,
        transientId,
        vehicle.actorModelId,
        new Float32Array(vehicle.position),
        new Float32Array(vehicle.rotation),
        server._gameTime
      );
      constructLoadout(vehicle._loadout, vehicleData._loadout);
      constructContainers(vehicle._containers, vehicleData._containers);
      vehicleData._resources = vehicle._resources;
      server.worldObjectManager.createVehicle(server, vehicleData);
    });
  }

  async saveVehicles(server: ZoneServer2016) {
    if (!server.enableWorldSaves) return;
    const vehicles: Array<FullVehicleSaveData> = Object.values(
      server._vehicles
    ).map((vehicle) => {
      return {
        serverId: server._worldId,
        characterId: vehicle.characterId,
        actorModelId: vehicle.actorModelId,
        position: Array.from(vehicle.state.position),
        rotation: Array.from(vehicle.state.rotation),
        _loadout: vehicle._loadout,
        _containers: vehicle._containers,
        _resources: vehicle._resources,
        worldSaveVersion: server.worldSaveVersion,
      };
    });
    if (server._soloMode) {
      fs.writeFileSync(
        `${server._appDataFolder}/worlddata/vehicles.json`,
        JSON.stringify(vehicles, null, 2)
      );
    } else {
      const collection = server._db?.collection("vehicles");
      collection?.deleteMany({ serverId: server._worldId }); // clear vehicles
      collection?.insertMany(vehicles);
    }
  }
}

//#endregion
