import { MongoClient } from "mongodb";
import { CharacterUpdateSaveData, FullCharacterSaveData } from "types/savedata";
import { initMongo, _ } from "../../../utils/utils";
import { ZoneServer2016 } from "../zoneserver";
import { Vehicle2016 } from "./vehicle";
import { ZoneClient2016 as Client } from "./zoneclient";

const fs = require("fs");
const debug = require("debug")("ZoneServer");

export class WorldDataManager {
  lastSaveTime = 0;
  saveTimer = 600000; // 10 minutes

  run(server: ZoneServer2016) {
    debug("WOM::Run");
    if (this.lastSaveTime + this.saveTimer <= Date.now()) {
      server.executeFuncForAllReadyClients((client: Client)=> {
        this.saveCharacterData(server, client);
      })
      // save here

      this.lastSaveTime = Date.now();
    }
  }

  //#region CHARACTER

  async loadCharacterData(server: ZoneServer2016, client: Client) {
    let savedCharacter: FullCharacterSaveData;
    if (!server._soloMode) {
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
    } else {
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
      /*
      // Take position/rotation from a random spawn location.
      const randomSpawnIndex = Math.floor(
        Math.random() * server._spawnLocations.length
      );
      client.character.state.position = new Float32Array(
        server._spawnLocations[randomSpawnIndex].position
      );
      client.character.state.rotation = new Float32Array(
        server._spawnLocations[randomSpawnIndex].rotation
      );
      client.character.spawnLocation =
        server._spawnLocations[randomSpawnIndex].name;
      server.clearInventory(client);
      server.giveDefaultEquipment(client, false);
      server.giveDefaultItems(client, false);
      */
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
    if (client.character) {
      const { position, rotation } = client.character.state;
      await server._db?.collection("characters").updateOne(
        { characterId: client.character.characterId },
        {
          $set: {
            position: Array.from(position),
            rotation: Array.from(rotation),
          },
        }
      );
      refreshTimeout && client.savePositionTimer.refresh();
    }
  }

  async saveCharacterData(server: ZoneServer2016, client: Client) {
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
        { characterId: client.character.characterId },
        {
          $set: {
            ...saveData
          },
        }
      );
    }
  }

  //#endregion

  async fetchZoneData(server: ZoneServer2016) {
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

  async loadVehicleData(server: ZoneServer2016) {
    const vehiclesArray: any = await server._db
      ?.collection("vehicles")
      .find({ worldId: server._worldId })
      .toArray();
    for (let index = 0; index < vehiclesArray.length; index++) {
      const vehicle = vehiclesArray[index];
      const vehicleData = new Vehicle2016(
        vehicle.characterId,
        vehicle.transientId,
        vehicle.actorModelId,
        new Float32Array(vehicle.state.position),
        new Float32Array(vehicle.state.rotation),
        server._gameTime
      );
      server.worldObjectManager.createVehicle(server, vehicleData);
    }
  }

  async fetchWorldData(server: ZoneServer2016) {
    if (!server._soloMode) {

      await this.loadVehicleData(server);

      const npcsArray: any = await server._db
        ?.collection("npcs")
        .find({ worldId: server._worldId })
        .toArray();
      for (let index = 0; index < npcsArray.length; index++) {
        const npc = npcsArray[index];
        server._npcs[npc.characterId] = npc;
      }
      server._spawnedItems = {};
      const objectsArray: any = await server._db
        ?.collection("objects")
        .find({ worldId: server._worldId })
        .toArray();
      for (let index = 0; index < objectsArray.length; index++) {
        const object = objectsArray[index];
        server._spawnedItems[object.characterId] = object;
      }
      server._transientIds = server.getAllCurrentUsedTransientId();
      debug("World fetched!");
    }
  }

  async saveWorld(server: ZoneServer2016) {
    if (!server._soloMode) {
      if (server._worldId) {
        await server._db
          ?.collection(`npcs`)
          .insertMany(Object.values(server._npcs));
        await server._db
          ?.collection(`vehicles`)
          .insertMany(Object.values(server._vehicles));
        await server._db
          ?.collection(`objects`)
          .insertMany(Object.values(server._spawnedItems));
      } else {
        const numberOfWorld: number =
          (await server._db?.collection("worlds").find({}).count()) || 0;
        server._worldId = numberOfWorld + 1;
        await server._db?.collection("worlds").insertOne({
          worldId: server._worldId,
        });
        await server._db
          ?.collection(`npcs`)
          .insertMany(Object.values(server._npcs));
        await server._db
          ?.collection(`vehicles`)
          .insertMany(Object.values(server._vehicles));
        await server._db
          ?.collection(`objects`)
          .insertMany(Object.values(server._spawnedItems));
        debug("World saved!");
      }
    }
  }

  async saveVehicleData(vehicle: Vehicle2016) {

  }
}