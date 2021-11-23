import { Weather } from "types/zoneserver";
import { ZoneClient as Client } from "../classes/zoneclient";
import { ZoneServer } from "../zoneserver";

import { _, generateRandomGuid } from "../../../utils/utils";
import { Vehicle } from "../classes/vehicles";

const debug = require("debug")("zonepacketHandlers");

const hax: any = {
  list: function (server: ZoneServer, client: Client, args: any[]) {
    server.sendChatText(
      client,
      `/hax commands list: \n/hax ${Object.keys(this).join("\n/hax ")}`
    );
  },
  placement: function (server: ZoneServer, client: Client, args: any[]) {
    const modelChoosen = args[1];
    if (!modelChoosen) {
      server.sendChatText(client, "[ERROR] Usage /hax placement {modelId}");
      return;
    }
    server.sendData(client, "Construction.PlacementResponse", {
      model: modelChoosen,
    });
  },
  siren: function (server: ZoneServer, client: Client, args: any[]) {
    switch (client.vehicle.mountedVehicleType) {
      case "policecar":
        server.sendData(client, "Mount.DismountResponse", {
          characterId: client.character.characterId,
        });
        server.sendData(client, "Mount.MountResponse", {
          characterId: client.character.characterId,
          guid: client.vehicle.mountedVehicle,
          unknownDword4: 275,
          characterData: {},
        });
        break;
      default:
        server.sendChatText(client, "You are not in a police car");
        break;
    }
  },
  spectate: function (server: ZoneServer, client: Client, args: any[]) {
    const characterId = server.generateGuid();
    const vehicleData = new Vehicle(
      server._worldId,
      characterId,
      server.getTransientId(client, characterId),
      9371,
      client.character.state.position,
      client.character.state.lookAt
    );
    server.sendDataToAll("PlayerUpdate.AddLightweightVehicle", vehicleData);
    vehicleData.isManaged = true;
    vehicleData.isInvulnerable = true;
    server._vehicles[characterId] = {
      ...vehicleData,
      onDismount: () => {
        server.dismissVehicle(characterId);
      },
      onReadyCallback: (clientTriggered: Client) => {
        if (clientTriggered === client) {
          // doing anything with vehicle before client gets fullvehicle packet breaks it
          server.sendData(client, "PlayerUpdate.ManagedObject", {
            guid: vehicleData.npcData.characterId,
            characterId: client.character.characterId,
          });
          server.sendDataToAll("Mount.MountResponse", {
            characterId: client.character.characterId,
            guid: characterId,
            characterData: [],
          });
          server.sendDataToAll("Vehicle.Engine", {
            guid2: characterId,
            unknownBoolean: true,
          });
          client.vehicle.mountedVehicle = characterId;
          client.vehicle.mountedVehicleType = "spectate";
          client.managedObjects.push(characterId);
          return true;
        }
        return false;
      },
    };
  },
  headlights: function (server: ZoneServer, client: Client, args: any[]) {
    let headlightType: number;
    switch (client.vehicle.mountedVehicleType) {
      case "offroader":
        headlightType = 273;
        break;
      case "pickup":
        headlightType = 321;
        break;
      case "policecar":
        headlightType = 281;
        break;
      default:
        headlightType = 273;
        break;
    }
    if (client.vehicle.mountedVehicleType != "0") {
      server.sendData(client, "Mount.DismountResponse", {
        characterId: client.character.characterId,
      });
      server.sendData(client, "Mount.MountResponse", {
        characterId: client.character.characterId,
        guid: client.vehicle.mountedVehicle,
        unknownDword4: headlightType,
        characterData: {},
      });
    } else {
      server.sendChatText(client, "You are not in a vehicle");
    }
  },
  vehicleaction: function (server: ZoneServer, client: Client, args: any[]) {
    if (client.vehicle.mountedVehicle) {
      const type = args[1];
      if (!args[1]) {
        server.sendChatText(client, "[ERROR] Specify action (repair/refuel)");
        return;
      }
      const vehicle = server._vehicles[client.vehicle.mountedVehicle];
      switch (type) {
        case "refuel":
          server._vehicles[
            client.vehicle.mountedVehicle
          ].npcData.resources.fuel = 10000;
          server.updateResource(
            client,
            vehicle.npcData.characterId,
            vehicle.npcData.resources.fuel,
            396,
            50
          );
          server.sendChatText(client, "Vehicle refueled");
          break;
        case "repair":
          server._vehicles[
            client.vehicle.mountedVehicle
          ].npcData.resources.health = 100000;
          server.updateResource(
            client,
            vehicle.npcData.characterId,
            vehicle.npcData.resources.health,
            561,
            1
          );
          server.sendChatText(client, "Vehicle repaired");
          break;
        default:
          server.sendChatText(client, "[ERROR] Usage: /hax repair/refuel");
          break;
      }
    } else {
      server.sendChatText(client, "[ERROR] You are not in a vehicle");
    }
  },
  drive: function (server: ZoneServer, client: Client, args: any[]) {
    let driveModel;
    const driveChoosen = args[1];
    if (!args[1]) {
      server.sendChatText(
        client,
        "[ERROR] Usage /hax drive offroader/pickup/policecar"
      );
      return;
    }
    let wasAlreadyGod = client.character.godMode;
    client.character.godMode = true;
    switch (driveChoosen) {
      case "offroader":
        driveModel = 7225;
        client.vehicle.mountedVehicleType = "offroader";
        break;
      case "pickup":
        driveModel = 9258;
        client.vehicle.mountedVehicleType = "pickup";
        break;
      case "policecar":
        driveModel = 9301;
        client.vehicle.mountedVehicleType = "policecar";
        break;
      default:
        driveModel = 7225;
        client.vehicle.mountedVehicleType = "offroader";
        break;
    }
    const characterId = server.generateGuid();
    const vehicleData = new Vehicle(
      server._worldId,
      characterId,
      server.getTransientId(client, characterId),
      driveModel,
      client.character.state.position,
      client.character.state.lookAt
    );
    server.sendDataToAll("PlayerUpdate.AddLightweightVehicle", vehicleData);
    vehicleData.isManaged = true;
    server._vehicles[characterId] = {
      ...vehicleData,
      onReadyCallback: (clientTriggered: Client) => {
        if (clientTriggered === client) {
          // doing anything with vehicle before client gets fullvehicle packet breaks it
          server.enterVehicle(client, vehicleData);
          setTimeout(() => {
            client.character.godMode = wasAlreadyGod;
          }, 1000);
          return true;
        }
        return false;
      },
    };
    server.worldRoutine();
  },
  weaponstance: function (server: ZoneServer, client: Client, args: any[]) {
    const stance = args[1];
    let weaponStance;
    switch (stance) {
      case "0":
        weaponStance = 0;
        break;
      case "1":
        weaponStance = 1;
        break;
      case "2":
        weaponStance = 2;
        break;
      case "list":
        server.sendChatText(client, `Avaible weaponstances: "0, 1, 2"`);
        break;
      default:
        server.sendChatText(
          client,
          `Incorrect weaponstance! use /hax weaponstance list`
        );
        break;
    }
    server.sendDataToAll("PlayerUpdate.WeaponStance", {
      characterId: client.character.characterId,
      stance: weaponStance,
    });
  },
  state: function (server: ZoneServer, client: Client, args: any[]) {
    const state = args[1];
    let stateId = "";
    switch (state) {
      case "list":
          server.sendChatText(client, 
             "Availables states : default, hidden, sit, autorun, cuffed, handsup"
            );
        break;
      case "default":
        stateId = "000000000000000000";
        break;
      case "hidden":
        stateId = "0000000000F0000000";
        break;
      case "sit":
        stateId = "00000F000000000F00";
        break;
      case "autorun":
        stateId = "000000000001000000";
        break;
      case "cuffed":
        stateId = "000000000000000010";
        break;
      case "handsup":
        stateId = "0000F0000000000000";
        break;
      case "disfunctional":
        stateId = "FFFFFFFFFFFFFFFFFF";
        break;
      default:
        server.sendChatText(
          client,
          `Incorrect characterstate! use /hax state list`
        );
        break;
    }
    server.sendDataToAll("PlayerUpdate.UpdateCharacterState", {
      characterId: client.character.characterId,
      state: stateId,
      gameTime: server.getSequenceTime(),
    });
  },
  spawnvehicle: function (server: ZoneServer, client: Client, args: any[]) {
    if (!args[1]) {
      server.sendChatText(
        client,
        "[ERROR] Usage /hax spawnVehicle offroader/pickup/policecar"
      );
      return;
    }
    let driveModel;
    switch (args[1]) {
      case "offroader":
        driveModel = 7225;
        break;
      case "pickup":
        driveModel = 9258;
        break;
      case "policecar":
        driveModel = 9301;
        break;
      default:
        // offroader default
        driveModel = 7225;
        break;
    }
    let wasAlreadyGod = client.character.godMode;
    client.character.godMode = true;
    const characterId = server.generateGuid();
    const vehicleData = new Vehicle(
      server._worldId,
      characterId,
      server.getTransientId(client, characterId),
      driveModel,
      client.character.state.position,
      client.character.state.lookAt
    );
    server.sendDataToAll("PlayerUpdate.AddLightweightVehicle", vehicleData);
    vehicleData.isManaged = true;
    server._vehicles[characterId] = {
      ...vehicleData,
      onReadyCallback: (clientTriggered: Client) => {
        if (clientTriggered === client) {
          // doing anything with vehicle before client gets fullvehicle packet breaks it
          server.sendData(client, "PlayerUpdate.ManagedObject", {
            guid: vehicleData.npcData.characterId,
            characterId: client.character.characterId,
          });
          setTimeout(() => {
            client.character.godMode = wasAlreadyGod;
          }, 1000);
          return true;
        }
        return false;
      },
    };
    server.worldRoutine();
  },

  parachute: function (server: ZoneServer, client: Client, args: any[]) {
    const dropPosition = new Float32Array([
      client.character.state.position[0],
      client.character.state.position[1] + 700,
      client.character.state.position[2],
      client.character.state.position[3],
    ]);
    server.dropPlayerInParachute(client, dropPosition);
  },

  time: function (server: ZoneServer, client: Client, args: any[]) {
    const choosenHour = Number(args[1]);
    if (choosenHour < 0) {
      server.sendChatText(client, "You need to specify an hour to set !");
      return;
    }
    server.forceTime(choosenHour * 3600 * 1000);
    server.sendChatText(
      client,
      `Will force time to be ${
        choosenHour % 1 >= 0.5
          ? Number(choosenHour.toFixed(0)) - 1
          : choosenHour.toFixed(0)
      }:${
        choosenHour % 1 === 0
          ? "00"
          : (((choosenHour % 1) * 100 * 60) / 100).toFixed(0)
      } on next sync...`,
      true
    );
  },
  realTime: function (server: ZoneServer, client: Client, args: any[]) {
    server.removeForcedTime();
    server.sendChatText(client, "Game time is now based on real time", true);
  },
  globalheartattack: function (
    server: ZoneServer,
    client: Client,
    args: any[]
  ) {
    for (const npcKey in server._npcs) {
      const npc = server._npcs[npcKey];
      server.sendData(client, "PlayerUpdate.StartMultiStateDeath", {
        characterId: npc.characterId,
      });
    }
  },
  tp: function (server: ZoneServer, client: Client, args: any[]) {
    client.isLoading = true;
    const choosenSpawnLocation = args[1];
    let locationPosition: Float32Array;
    switch (choosenSpawnLocation) {
      case "zimms":
        locationPosition = new Float32Array([2209.17, 47.42, -1011.48, 1]);
        break;
      case "pv":
        locationPosition = new Float32Array([-125.55, 23.41, -1131.71, 1]);
        break;
      case "br":
        locationPosition = new Float32Array([3824.41, 168.19, -4000.0, 1]);
        break;
      case "ranchito":
        locationPosition = new Float32Array([2185.32, 42.36, 2130.49, 1]);
        break;
      case "drylake":
        locationPosition = new Float32Array([479.46, 109.7, 2902.51, 1]);
        break;
      case "dam":
        locationPosition = new Float32Array([-629.49, 69.96, 1233.49, 1]);
        break;
      case "cranberry":
        locationPosition = new Float32Array([-1368.37, 71.29, 1837.61, 1]);
        break;
      case "church":
        locationPosition = new Float32Array([-1928.68, 62.77, 2880.1, 1]);
        break;
      case "desoto":
        locationPosition = new Float32Array([-2793.22, 140.77, 1035.8, 1]);
        break;
      case "toxic":
        locationPosition = new Float32Array([-3064.68, 42.98, -2160.06, 1]);
        break;
      case "radiotower":
        locationPosition = new Float32Array([-1499.21, 353.98, -840.52, 1]);
        break;
      default:
        locationPosition = new Float32Array([0, 50, 0, 1]);
        break;
    }
    client.character.state.position = locationPosition;
    server.sendData(client, "ClientUpdate.UpdateLocation", {
      position: locationPosition,
    });
  },
  despawnobjects: function (server: ZoneServer, client: Client, args: any[]) {
    client.spawnedEntities.forEach((object) => {
      server.despawnEntity(
        object.characterId ? object.characterId : object.npcData.characterId
      );
    });
    client.spawnedEntities = [];
    server._props = {};
    server._npcs = {};
    server._objects = {};
    server._vehicles = {};
    server._doors = {};
    server.sendChatText(client, "Objects removed from the game.", true);
  },
  spamoffroader: function (server: ZoneServer, client: Client, args: any[]) {
    for (let index = 0; index < 150; index++) {
      const vehicleData = {
        npcData: {
          guid: server.generateGuid(),
          transientId: 1,
          modelId: 7225,
          scale: [1, 1, 1, 1],
          position: client.character.state.position,
          attachedObject: {},
          color: {},
          unknownArray1: [],
          array5: [{ unknown1: 0 }],
          array17: [{ unknown1: 0 }],
          array18: [{ unknown1: 0 }],
        },
        unknownGuid1: server.generateGuid(),
        positionUpdate: server.createPositionUpdate(
          client.character.state.position,
          [0, 0, 0, 0]
        ),
      };

      server.sendData(
        client,
        "PlayerUpdate.AddLightweightVehicle",
        vehicleData
      );
    }
  },
  spampolicecar: function (server: ZoneServer, client: Client, args: any[]) {
    for (let index = 0; index < 150; index++) {
      const vehicleData = {
        npcData: {
          guid: server.generateGuid(),
          transientId: 1,
          modelId: 9301,
          position: client.character.state.position,
          attachedObject: {},
          color: {},
          unknownArray1: [],
          array5: [{ unknown1: 0 }],
          array17: [{ unknown1: 0 }],
          array18: [{ unknown1: 0 }],
        },
        unknownGuid1: server.generateGuid(),
        positionUpdate: server.createPositionUpdate(
          client.character.state.position,
          [0, 0, 0, 0]
        ),
      };

      server.sendData(
        client,
        "PlayerUpdate.AddLightweightVehicle",
        vehicleData
      );
    }
  },
  spawnnpcmodel: function (server: ZoneServer, client: Client, args: any[]) {
    const guid = server.generateGuid();
    const transientId = 1;
    if (!args[1]) {
      server.sendChatText(client, "[ERROR] You need to specify a model id !");
      return;
    }
    const choosenModelId = Number(args[1]);
    const characterId = server.generateGuid();
    let isVehicle = false;
    if (
      choosenModelId === 7225 ||
      choosenModelId === 9301 ||
      choosenModelId === 9258
    ) {
      isVehicle = true;
    }
    const npc = {
      characterId: characterId,
      worldId: server._worldId,
      guid: guid,
      transientId: transientId,
      modelId: choosenModelId,
      position: client.character.state.position,
      rotation: client.character.state.lookAt,
      attachedObject: {},
      isVehicle: isVehicle,
      color: {},
      array5: [{ unknown1: 0 }],
      array17: [{ unknown1: 0 }],
      array18: [{ unknown1: 0 }],
    };
    isVehicle = false;
    server.sendDataToAll("PlayerUpdate.AddLightweightNpc", npc);
    server._db?.collection("npcs").insertOne(npc);
    server._npcs[characterId] = npc; // save npc
  },
  sonic: function (server: ZoneServer, client: Client, args: any[]) {
    let character = client.character;
    character.isSonic = !character.isSonic;
    server.setGodMode(client, character.isSonic);
    server.sendData(client, "ClientGameSettings", {
      interactGlowAndDist: 3,
      unknownBoolean1: false,
      timescale: character.isSonic ? 3.0 : 1.0,
      Unknown4: 0,
      Unknown: 0,
      unknownFloat1: 1,
      unknownFloat2: 1,
      velDamageMulti: 1.0,
    });
    server.sendData(client, "Command.RunSpeed", {
      runSpeed: character.isSonic ? -100 : 0,
    });
    const messageToMrHedgehog = character.isSonic
      ? "Welcome MR.Hedgehog"
      : "Goodbye MR.Hedgehog";
    server.sendChatText(client, messageToMrHedgehog, true);
  },
  observer: function (server: ZoneServer, client: Client, args: any[]) {
    server.sendChatText(
      client,
      "[Deprecated] You should use /hax spectate, this command will be removed soon!"
    );
    server.sendDataToAll("PlayerUpdate.RemovePlayer", {
      characterId: client.character.characterId,
    });
    delete server._characters[client.character.characterId];
    debug(server._characters);
    server.sendChatText(client, "Delete player, back in observer mode");
  },
  changestat: function (server: ZoneServer, client: Client, args: any[]) {
    const stats = require("../../../../data/2015/sampleData/stats.json");
    server.sendData(client, "PlayerUpdate.UpdateStat", {
      characterId: client.character.characterId,
      stats: stats,
    });
    server.sendChatText(client, "change stat");
  },
  changemodel: function (server: ZoneServer, client: Client, args: any[]) {
    const newModelId = args[1];
    if (newModelId) {
      server.sendDataToAll("PlayerUpdate.ReplaceBaseModel", {
        characterId: client.character.characterId,
        modelId: newModelId,
      });
    } else {
      server.sendChatText(client, "Specify a model id !");
    }
  },
  removedynamicweather: async function (
    server: ZoneServer,
    client: Client,
    args: any[]
  ) {
    if(server._dynamicWeatherWorker){
      await server._dynamicWeatherWorker.terminate();
      server._dynamicWeatherWorker = null;
    }
    if (server._soloMode) {
      server.changeWeatherWithTemplate(
        client,
        server._defaultWeatherTemplate
      );
    }
    else{
      const weatherTemplate = await server._db?.collection("weathers").findOne({templateName:server._defaultWeatherTemplate})
      if(weatherTemplate){
        server.changeWeather(
          client,
          weatherTemplate as any
        ); 
    }
    }
    server.sendChatText(client, "Dynamic weather removed !");
  },
  weather: function (server: ZoneServer, client: Client, args: any[]) {
    if (server._dynamicWeatherWorker) {
      hax["removedynamicweather"](server, client, args);
    }
    const choosenTemplate = args[1];
    if (!choosenTemplate) {
      server.sendChatText(
        client,
        "Please define a weather template to use (data/sampleData/weather.json)"
      );
    }else {
      server.changeWeatherWithTemplate(client,choosenTemplate)
    }
  },
  weapon: function (server: ZoneServer, client: Client, args: any[]) {
    const choosenWeapon: string = args[1];
    if (!choosenWeapon) {
      server.sendChatText(
        client,
        "Please define the name of the weapon you wanna use ! see /hax weapon list'"
      );
    } else {
      switch (choosenWeapon.toLowerCase()) {
        case "list":
          server.sendChatText(
            client,
            "Availables weapons : ar, hatchet, torch, empty"
          );
          break;
        case "ar":
          client.character.equipment[
            client.character.equipment.findIndex((x) => x.slotId === 7)
          ].modelName = "Weapon_M16A4_3p.adr";
          server.sendDataToAll("Equipment.SetCharacterEquipment", {
            profileId: 3,
            characterId: client.character.characterId,
            equipmentSlots: client.character.equipment.map((equipment) => {
              return {
                equipmentSlotId: equipment.slotId,
                equipmentSlotData: {
                  equipmentSlotId: equipment.slotId,
                  guid: generateRandomGuid(),
                },
              };
            }),
            attachmentData: client.character.equipment,
          });
          break;
        case "hatchet":
          client.character.equipment[
            client.character.equipment.findIndex((x) => x.slotId === 7)
          ].modelName = "Weapon_Hatchet01_3p.adr";
          server.sendDataToAll("Equipment.SetCharacterEquipment", {
            profileId: 3,
            characterId: client.character.characterId,
            equipmentSlots: client.character.equipment.map((equipment) => {
              return {
                equipmentSlotId: equipment.slotId,
                equipmentSlotData: {
                  equipmentSlotId: equipment.slotId,
                  guid: generateRandomGuid(),
                },
              };
            }),
            attachmentData: client.character.equipment,
          });
          break;
        case "empty":
          client.character.equipment[
            client.character.equipment.findIndex((x) => x.slotId === 7)
          ].modelName = "Weapon_Empty.adr";
          server.sendDataToAll("Equipment.SetCharacterEquipment", {
            profileId: 3,
            characterId: client.character.characterId,
            equipmentSlots: client.character.equipment.map((equipment) => {
              return {
                equipmentSlotId: equipment.slotId,
                equipmentSlotData: {
                  equipmentSlotId: equipment.slotId,
                  guid: generateRandomGuid(),
                },
              };
            }),
            attachmentData: client.character.equipment,
          });
          break;
        case "torch":
          client.character.equipment[
            client.character.equipment.findIndex((x) => x.slotId === 7)
          ].modelName = "Weapon_Torch_3p.adr";
          server.sendDataToAll("Equipment.SetCharacterEquipment", {
            profileId: 3,
            characterId: client.character.characterId,
            equipmentSlots: client.character.equipment.map((equipment) => {
              return {
                equipmentSlotId: equipment.slotId,
                equipmentSlotData: {
                  equipmentSlotId: equipment.slotId,
                  guid: generateRandomGuid(),
                },
              };
            }),
            attachmentData: client.character.equipment,
          });
          break;
        default:
          server.sendChatText(client, "Unknown weapon " + choosenWeapon);
          break;
      }
    }
  },
  outfit: function (server: ZoneServer, client: Client, args: any[]) {
    const choosenOutfit: string = args[1];
    if (!choosenOutfit) {
      server.sendChatText(
        client,
        "Please define the name of the outfit you wanna use ! see /hax outfit list'"
      );
    } else {
      switch (choosenOutfit.toLowerCase()) {
        case "list":
          server.sendChatText(
            client,
            "Availables outfits : Aviator, Cowboy, Jinx, Red"
          );
          break;
        case "aviator":
          client.character.equipment[
            client.character.equipment.findIndex((x) => x.slotId === 1)
          ].modelName = "SurvivorMale_Ivan_AviatorHat_Base.adr";
          client.character.equipment[
            client.character.equipment.findIndex((x) => x.slotId === 3)
          ].modelName = "SurvivorMale_Ivan_Shirt_Base.adr";
          client.character.equipment[
            client.character.equipment.findIndex((x) => x.slotId === 3)
          ].defaultTextureAlias = "Ivan_Tshirt_Army_Green";
          client.character.equipment[
            client.character.equipment.findIndex((x) => x.slotId === 4)
          ].modelName = "SurvivorMale_Ivan_Pants_Base.adr";
          client.character.equipment[
            client.character.equipment.findIndex((x) => x.slotId === 4)
          ].defaultTextureAlias = "Ivan_Pants_Jeans_Black";
          server.sendDataToAll("Equipment.SetCharacterEquipment", {
            profileId: 3,
            characterId: client.character.characterId,
            equipmentSlots: client.character.equipment.map((equipment) => {
              return {
                equipmentSlotId: equipment.slotId,
                equipmentSlotData: {
                  equipmentSlotId: equipment.slotId,
                  guid: generateRandomGuid(),
                },
              };
            }),
            attachmentData: client.character.equipment,
          });
          break;
        case "jinx":
          client.character.equipment[
            client.character.equipment.findIndex((x) => x.slotId === 1)
          ].modelName = "Weapon_Empty.adr";
          client.character.equipment[
            client.character.equipment.findIndex((x) => x.slotId === 3)
          ].modelName = "SurvivorMale_Ivan_Shirt_Base.adr";
          client.character.equipment[
            client.character.equipment.findIndex((x) => x.slotId === 3)
          ].defaultTextureAlias = "Ivan_Tshirt_JINX";
          client.character.equipment[
            client.character.equipment.findIndex((x) => x.slotId === 4)
          ].modelName = "SurvivorMale_Ivan_Pants_Base.adr";
          server.sendDataToAll("Equipment.SetCharacterEquipment", {
            profileId: 3,
            characterId: client.character.characterId,
            equipmentSlots: client.character.equipment.map((equipment) => {
              return {
                equipmentSlotId: equipment.slotId,
                equipmentSlotData: {
                  equipmentSlotId: equipment.slotId,
                  guid: generateRandomGuid(),
                },
              };
            }),
            attachmentData: client.character.equipment,
          });
          break;
        case "cowboy":
          client.character.equipment[
            client.character.equipment.findIndex((x) => x.slotId === 1)
          ].modelName = "SurvivorMale_Ivan_OutbackHat_Base.adr";
          client.character.equipment[
            client.character.equipment.findIndex((x) => x.slotId === 1)
          ].defaultTextureAlias = "Ivan_OutbackHat_LeatherTan";
          client.character.equipment[
            client.character.equipment.findIndex((x) => x.slotId === 3)
          ].modelName = "SurvivorMale_Ivan_Shirt_Base.adr";
          client.character.equipment[
            client.character.equipment.findIndex((x) => x.slotId === 3)
          ].defaultTextureAlias = "Ivan_Tshirt_Navy_Shoulder_Stripes";
          client.character.equipment[
            client.character.equipment.findIndex((x) => x.slotId === 4)
          ].modelName = "SurvivorMale_Ivan_Pants_Base.adr";
          server.sendDataToAll("Equipment.SetCharacterEquipment", {
            profileId: 3,
            characterId: client.character.characterId,
            equipmentSlots: client.character.equipment.map((equipment) => {
              return {
                equipmentSlotId: equipment.slotId,
                equipmentSlotData: {
                  equipmentSlotId: equipment.slotId,
                  guid: generateRandomGuid(),
                },
              };
            }),
            attachmentData: client.character.equipment,
          });
          break;
        case "red":
          client.character.equipment[
            client.character.equipment.findIndex((x) => x.slotId === 1)
          ].modelName = "SurvivorMale_Ivan_Motorcycle_Helmet_Grey.adr";
          client.character.equipment[
            client.character.equipment.findIndex((x) => x.slotId === 1)
          ].defaultTextureAlias = "Ivan_MotorCycle_Helmet_Red";
          client.character.equipment[
            client.character.equipment.findIndex((x) => x.slotId === 3)
          ].modelName = "SurvivorMale_Ivan_Shirt_Base.adr";
          client.character.equipment[
            client.character.equipment.findIndex((x) => x.slotId === 3)
          ].defaultTextureAlias = "Ivan_Tshirt_RAZOR";
          client.character.equipment[
            client.character.equipment.findIndex((x) => x.slotId === 4)
          ].modelName = "SurvivorMale_Ivan_Pants_Base.adr";
          server.sendDataToAll("Equipment.SetCharacterEquipment", {
            profileId: 3,
            characterId: client.character.characterId,
            equipmentSlots: client.character.equipment.map((equipment) => {
              return {
                equipmentSlotId: equipment.slotId,
                equipmentSlotData: {
                  equipmentSlotId: equipment.slotId,
                  guid: generateRandomGuid(),
                },
              };
            }),
            attachmentData: client.character.equipment,
          });
          break;

        default:
          server.sendChatText(client, "Unknown outfit " + choosenOutfit);
          break;
      }
    }
  },
  savecurrentweather: async function (
    server: ZoneServer,
    client: Client,
    args: any[]
  ) {
    if (!args[1]) {
      server.sendChatText(
        client,
        "Please define a name for your weather template '/hax saveCurrentWeather {name}'"
      );
    } else if (
      await this._db?.collection("weathers").findOne({ templateName: this._defaultWeatherTemplate })
    ) {
      server.sendChatText(client, `"${args[1]}" already exist !`);
    } else {
      const { _weather: currentWeather } = server;
      if (currentWeather) {
        currentWeather.templateName = args[1];
        if (!server._soloMode) {
          await server._db?.collection("weathers").insertOne(currentWeather);
        } else {
          console.error("You can't do that in solomode anymore... sorry")
        }
        server.sendChatText(client, `template "${args[1]}" saved !`);
      } else {
        server.sendChatText(client, `Saving current weather failed...`);
        server.sendChatText(client, `plz report this`);
      }
    }
  },
  run: function (server: ZoneServer, client: Client, args: any[]) {
    const speedValue = args[1];
    let speed;
    if (speedValue > 10) {
      server.sendChatText(
        client,
        "To avoid security issue speed > 10 is set to 15",
        true
      );
      speed = 15;
    } else {
      speed = speedValue;
    }
    server.sendChatText(client, "Setting run speed: " + speed, true);
    server.sendData(client, "Command.RunSpeed", {
      runSpeed: speed,
    });
  },
  randomweather: function (server: ZoneServer, client: Client, args: any[]) {
    if (server._dynamicWeatherWorker) {
      clearInterval(server._dynamicWeatherWorker);
      server._dynamicWeatherWorker = null;
      server.sendChatText(client, "Dynamic weather removed !");
    }
    debug("Randomized weather");
    server.sendChatText(client, `Randomized weather`);

    function rnd_number() {
      return Number((Math.random() * 100).toFixed(0));
    }

    const fogEnabled = Math.random() * 3 < 1;
    const rainEnabled = Math.random() * 4 < 1;
    const winterEnabled = Math.random() * 4 < 1;
    const rnd_weather: Weather = {
      name: "sky",
      unknownDword1: rnd_number(),
      unknownDword2: rnd_number(),
      unknownDword3: rnd_number(),
      unknownDword4: rnd_number(),
      fogDensity: fogEnabled ? rnd_number() : 0, // fog intensity
      fogGradient: fogEnabled ? rnd_number() : 0,
      fogFloor: fogEnabled ? rnd_number() : 0,
      unknownDword7: 0,
      rain: rainEnabled ? rnd_number() : 0,
      temp: winterEnabled ? 0 : 40, // 0 : snow map , 40+ : spring map
      skyColor: rnd_number(),
      cloudWeight0: rnd_number(),
      cloudWeight1: rnd_number(),
      cloudWeight2: rnd_number(),
      cloudWeight3: rnd_number(),
      sunAxisX: rnd_number(),
      sunAxisY: rnd_number(),
      sunAxisZ: rnd_number(), // night when 100
      unknownDword18: rnd_number(),
      unknownDword19: rnd_number(),
      unknownDword20: rnd_number(),
      wind: rnd_number(),
      unknownDword22: rnd_number(),
      unknownDword23: rnd_number(),
      unknownDword24: rnd_number(),
      unknownDword25: rnd_number(),
      unknownArray: _.fill(Array(50), {
        unknownDword1: 0,
        unknownDword2: 0,
        unknownDword3: 0,
        unknownDword4: 0,
        unknownDword5: 0,
        unknownDword6: 0,
        unknownDword7: 0,
      }),
    };
    debug(JSON.stringify(rnd_weather));
    server.changeWeather(client, rnd_weather);
  },
  rick: function (server: ZoneServer, client: Client, args: any[]) {
    server.sendDataToAll("ClientExitLaunchUrl", {
      url: "www.youtube.com/watch?v=dQw4w9WgXcQ", // that's a very dangerous command, if it was working....
    });
  },
  titan: function (server: ZoneServer, client: Client, args: any[]) {
    server.sendDataToAll("PlayerUpdate.UpdateScale", {
      characterId: client.character.characterId,
      scale: [20, 20, 20, 1],
    });
    server.sendChatText(client, "TITAN size");
  },
  poutine: function (server: ZoneServer, client: Client, args: any[]) {
    server.sendDataToAll("PlayerUpdate.UpdateScale", {
      characterId: client.character.characterId,
      scale: [20, 5, 20, 1],
    });
    server.sendChatText(client, "The meme become a reality.....");
  },
  rat: function (server: ZoneServer, client: Client, args: any[]) {
    server.sendDataToAll("PlayerUpdate.UpdateScale", {
      characterId: client.character.characterId,
      scale: [0.2, 0.2, 0.2, 1],
    });
    server.sendChatText(client, "Rat size");
  },
  normalsize: function (server: ZoneServer, client: Client, args: any[]) {
    server.sendDataToAll("PlayerUpdate.UpdateScale", {
      characterId: client.character.characterId,
      scale: [1, 1, 1, 1],
    });
    server.sendChatText(client, "Back to normal size");
  },
  godmode: function (server: ZoneServer, client: Client, args: any[]) {
    server.setGodMode(client, !client.character.godMode);
  },
};

export default hax;
