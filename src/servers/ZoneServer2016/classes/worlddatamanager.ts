import { MongoClient } from "mongodb";
import { CharacterUpdateSaveData, FullCharacterSaveData, FullVehicleSaveData, ServerSaveData } from "types/savedata";
import { initMongo, toBigHex, _ } from "../../../utils/utils";
import { ZoneServer2016 } from "../zoneserver";
import { Vehicle2016 } from "./vehicle";
import { ZoneClient2016 as Client } from "./zoneclient";

const fs = require("fs");
const debug = require("debug")("ZoneServer");

export class WorldDataManager {
  lastSaveTime = 0;
  saveTimer = 600000; // 10 minutes
  run(server: ZoneServer2016) {
    debug("WorldDataManager::Run");
    if (this.lastSaveTime + this.saveTimer <= Date.now()) {
      server.executeFuncForAllReadyClients((client: Client)=> {
        this.saveCharacterData(server, client);
      })
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
      const worldCount =
        await server._db?.collection("worlds").countDocuments() || 0;
      server._worldId = worldCount + 1;
      await server._db?.collection("worlds").insertOne({
        worldId: server._worldId,
      });
      debug("Existing world was not found, created one.");
    }
  }

  async fetchWorldData(server: ZoneServer2016) {
    //await this.loadVehicleData(server);
    await this.loadServerData(server);
    server._transientIds = server.getAllCurrentUsedTransientId();
    debug("World fetched!");
  }

  async saveWorld(server: ZoneServer2016) {
    //await this.saveVehicles(server);
    await this.saveServerData(server);
    await this.saveCharacters(server);
    debug("World saved!");
  }

  //#region SERVER DATA

  private async loadServerData(server: ZoneServer2016) {
    let serverData: ServerSaveData;
    if (server._soloMode) {
      serverData = require(`${server._appDataFolder}/worlddata/world.json`);
      if(!serverData) {
        debug("World data not found in file, aborting.")
        return;
      }
    }
    else {
      serverData = <any>await server._db
      ?.collection("worlds")
      .find({ worldId: server._worldId });
    }
    server.lastItemGuid = BigInt(serverData.lastItemGuid || server.lastItemGuid);
  }

  private async saveServerData(server: ZoneServer2016) {
    const saveData: ServerSaveData = {
      serverId: server._worldId,
      lastItemGuid: toBigHex(server.lastItemGuid)
    }
    if (server._soloMode) {
      fs.writeFileSync(`${server._appDataFolder}/worlddata/world.json`, JSON.stringify(saveData, null, 2));
    }
    else {
      await server._db?.collection("worlds").updateOne(
        { worldId: server._worldId },
        {
          $set: {
            ...saveData
          },
        }
      );
    }
  }

  //#endregion

  //#region CHARACTER DATA

  async loadCharacterData(server: ZoneServer2016, client: Client) {
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
      if(!savedCharacter) {
        console.log(`[ERROR] Single player character not found! characterId: ${client.character.characterId}`);
        return;
      }
    } else {
      const loadedCharacter = await server._db
        ?.collection("characters")
        .findOne({ characterId: client.character.characterId });
      if(!loadedCharacter) {
        console.log(`[ERROR] Mongo character not found! characterId: ${client.character.characterId}`);
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
        _resources: loadedCharacter._resources || client.character._resources
      }
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
      (_.isEqual(savedCharacter.position, [0, 0, 0, 1]) &&
        _.isEqual(savedCharacter.rotation, [0, 0, 0, 1]))
    ) {
      // if position/rotation hasn't changed
      newCharacter = true;
    }

    if (newCharacter || client.character.isRespawning) {
      client.character.isRespawning = false;
      server.respawnPlayer(client);
    } else {
      client.character.state.position = new Float32Array(savedCharacter.position);
      client.character.state.rotation = new Float32Array(savedCharacter.rotation);
      client.character._loadout = savedCharacter._loadout || {};
      client.character._containers = savedCharacter._containers || {};
      client.character._resources = savedCharacter._resources || client.character._resources;
      server.generateEquipmentFromLoadout(client.character);
    }
  }

  async saveCharacterPosition(server: ZoneServer2016, client: Client, refreshTimeout = false) {
    if (!client.character) {
      return;
    }
    const { position, lookAt } = client.character.state;
    if (server._soloMode) {
      const singlePlayerCharacters = require(`${server._appDataFolder}/single_player_characters2016.json`);
      let singlePlayerCharacter = singlePlayerCharacters.find(
        (character: any) =>
          character.characterId === client.character.characterId
      );
      if(!singlePlayerCharacter) {
        console.log("[ERROR] Single player character savedata not found!");
        return;
      }
      singlePlayerCharacter = {
        ...singlePlayerCharacter,
        position: Array.from(position),
        rotation: Array.from(lookAt),
      }
      fs.writeFileSync(`${server._appDataFolder}/single_player_characters2016.json`, JSON.stringify([singlePlayerCharacter], null, 2));
    }
    else {
      await server._db?.collection("characters").updateOne(
        { characterId: client.character.characterId },
        {
          $set: {
            position: Array.from(position),
            rotation: Array.from(lookAt),
          },
        }
      );
    }
    refreshTimeout && client.savePositionTimer.refresh();
  }

  async saveCharacterData(server: ZoneServer2016, client: Client, updateItemGuid = true) {
    if(updateItemGuid) await this.saveServerData(server);
    const saveData: CharacterUpdateSaveData = {
      position: Array.from(client.character.state.position),
      rotation: Array.from(client.character.state.lookAt),
      isRespawning: client.character.isRespawning,
      _loadout: client.character._loadout,
      _containers: client.character._containers,
      _resources: client.character._resources
    }
    if(server._soloMode) {
      const singlePlayerCharacters = require(`${server._appDataFolder}/single_player_characters2016.json`);
      let singlePlayerCharacter = singlePlayerCharacters.find(
        (character: any) =>
          character.characterId === client.character.characterId
      );
      if(!singlePlayerCharacter) {
        console.log("[ERROR] Single player character savedata not found!");
        return;
      }
      singlePlayerCharacter = {
        ...singlePlayerCharacter,
        ...saveData
      }
      fs.writeFileSync(`${server._appDataFolder}/single_player_characters2016.json`, JSON.stringify([singlePlayerCharacter], null, 2));
    }
    else {
      await server._db?.collection("characters").updateOne(
        {
          serverId: server._worldId, 
          characterId: client.character.characterId
        },
        {
          $set: {
            ...saveData
          },
        }
      );
    }
  }

  async saveCharacters(server: ZoneServer2016) {
    const promises: Array<any> = [];
    await this.saveServerData(server);
    server.executeFuncForAllReadyClients((client: Client)=> {
      promises.push(
        server.worldDataManager.saveCharacterData(server, client, false).then((ret)=> {
          return ret;
        })
      );
    });
    await Promise.all(promises)
  }

  //#endregion

  //#region VEHICLE DATA

  private async loadVehicleData(server: ZoneServer2016) {
    let vehicles: Array<FullVehicleSaveData>;
    if(server._soloMode) {
      vehicles = require(`${server._appDataFolder}/worlddata/vehicles.json`);
      if(!vehicles) {
        debug("Vehicle data not found in file, aborting.")
        return;
      }
    }
    else {
      vehicles = <any>await server._db
      ?.collection("vehicles")
      .find({ worldId: server._worldId })
      .toArray();
    }
    vehicles.forEach((vehicle)=> {
      const transientId = server.getTransientId(vehicle.characterId);
      const vehicleData = new Vehicle2016(
        vehicle.characterId,
        transientId,
        vehicle.actorModelId,
        new Float32Array(vehicle.position),
        new Float32Array(vehicle.rotation),
        server._gameTime
      );
      vehicleData._loadout = vehicle._loadout,
      vehicleData._containers = vehicle._containers,
      vehicleData._resources = vehicle._resources
      server.worldObjectManager.createVehicle(server, vehicleData);
    })
  }

  async saveVehicles(server: ZoneServer2016) {
    const vehicles: Array<FullVehicleSaveData> = Object.values(server._vehicles).map((vehicle)=> {
      return {
        serverId: server._worldId,
        characterId: vehicle.characterId,
        actorModelId: vehicle.actorModelId,
        position: Array.from(vehicle.state.position),
        rotation: Array.from(vehicle.state.rotation),
        _loadout: vehicle._loadout,
        _containers: vehicle._containers,
        _resources: vehicle._resources
      }
    })
    if(server._soloMode) {
      fs.writeFileSync(`${server._appDataFolder}/worlddata/vehicles.json`, JSON.stringify(vehicles, null, 2));
    }
    else {
      const collection = server._db?.collection("vehicles");
      collection?.deleteMany({serverId: server._worldId}) // clear vehicles
      collection?.insertMany(vehicles)
    }
  }
}

//#endregion