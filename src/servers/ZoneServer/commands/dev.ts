import {ZoneClient as Client} from "../../ZoneServer/zoneclient";
import { generateCommandList, generateRandomGuid } from "../../../utils/utils";
import { ZoneServer } from "../zoneserver";

const debug = require("debug")("zonepacketHandlers");

const dev: any = {
  list: function (server: ZoneServer, client: Client, args: any[]) {
    const commandObject = this; // necessary tricks
    const commandList = generateCommandList(commandObject,"dev");
    commandList
          .sort((a: string, b: string) => a.localeCompare(b))
          .forEach((command: string) => {
            server.sendChatText(client, `${command}`);
          });
  },
  testpacket: function (server: ZoneServer, client: Client, args: any[]) {
    server.sendData(client, "Target.AddTarget", {
      objects: [
        {
          targetObjectId: client.character.characterId,
          position: client.character.state.position,
          rotation: client.character.state.position,
        },
      ],
    });
  },
  clearspawnedentities: function (server: ZoneServer, client: Client, args: any[]) {
    client.spawnedEntities.forEach((entity:any) => {
      try {
        server.despawnEntity(entity.characterId);
      } catch (error) {
        debug(error)
      }
    });
    client.spawnedEntities = [];
    server.sendChatText(client,"Entities cleared !",true);
    server.worldRoutine(client);
  },
  testnpcmove: function (server: ZoneServer, client: Client, args: any[]) {
    const guid = server.generateGuid();
    const characterId = server.generateGuid();
    const transientId = server.getTransientId(client, characterId);

    const npc: any = {
      characterId: characterId,
      guid: guid,
      transientId: transientId,
      modelId: 9001,
      position: client.character.state.position,
      rotation: client.character.state.lookAt,
      attachedObject: {},
      color: {},
      array5: [{ unknown1: 0 }],
      array17: [{ unknown1: 0 }],
      array18: [{ unknown1: 0 }],
    };
    npc.onReadyCallback = () => {
      server.sendData(client, "PlayerUpdate.SetSpotted", {
        unkArray: [{ guid: client.character.characterId }],
      });
      server.sendData(client, "PlayerUpdate.AggroLevel", {
        characterId: characterId,
        aggroLevel: 1000,
      });
      /* server.sendData(client, "PlayerUpdate.SeekTarget", {
        characterId: characterId,
        TargetCharacterId: client.character.characterId,
      });*/
    };
    server.sendDataToAll("PlayerUpdate.AddLightweightNpc", npc);
    server.sendData(client, "ResourceEvent", {
      eventData: {
        type: 3,
        value: {
          characterId: npc.characterId,
          resourceId: 48, // health
          resourceType: 1,
          initialValue: 500,
          unknownArray1: [],
          unknownArray2: [],
        },
      },
    });
    server._npcs[characterId] = npc; // save npc
  },
  lol: function (server: ZoneServer, client: Client, args: any[]) {
    for (const npcKey in server._npcs) {
      const npc = server._npcs[npcKey];
      server.sendData(client, "Ragdoll.UpdatePose", {
        characterId: npc.characterId,
        positionUpdate: server.createPositionUpdate(
          new Float32Array([10, 10, 10, 1])
        ),
      });
    }
  },
  testmanagedobject: function (
    server: ZoneServer,
    client: Client,
    args: any[]
  ) {
    const vehicleId = generateRandomGuid();
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
      unknownGuid1: vehicleId,
      unknownDword1: 0,
      unknownDword2: 0,
      positionUpdate: server.createPositionUpdate(
        new Float32Array([0, 0, 0, 0]),
        [0, 0, 0, 0]
      ),
      unknownString1: "",
    };

    server.sendData(client, "PlayerUpdate.AddLightweightVehicle", vehicleData);
    server.sendData(client, "PlayerUpdate.ManagedObject", {
      guid: vehicleId,
      characterId: client.character.characterId,
    });
  },
  testnpcrelevance: function (server: ZoneServer, client: Client, args: any[]) {
    const npcs = Object.values(server._npcs).map((npc: any) => {
      return { guid: npc.characterId };
    });
    server.sendData(client, "PlayerUpdate.NpcRelevance", {
      npcs: npcs,
    });
  },
  d: function (server: ZoneServer, client: Client, args: any[]) {
    // quick disconnect
    server.sendData(client, "CharacterSelectSessionResponse", {
      status: 1,
      sessionId: client.loginSessionId,
    });
  },
  testnpc: function (server: ZoneServer, client: Client, args: any[]) {
    const characterId = server.generateGuid();
    server.sendData(client, "PlayerUpdate.AddLightweightNpc", {
      characterId: characterId,
      modelId: 9001,
      transientId: server.getTransientId(client, characterId),
      position: client.character.state.position,
      extraModel: "SurvivorMale_Ivan_AviatorHat_Base.adr",
      attachedObject: {
        unknown1: "0x0000000000000000",
        unknownVector2: client.character.state.position,
        unknownVector3: [0, 0, 0, 0],
        unknown4: 0,
        unknown33: 0,
      },
      color: { r: 0, g: 0, b: 0 },
      array5: [{ unknown1: 0 }],
      array17: [{ unknown1: 0 }],
      array18: [{ unknown1: 0 }],
    });
    /* setInterval(() => {
      server.sendData(client, "PlayerUpdate.SeekTarget", {
        characterId: characterId,
        TargetCharacterId: client.character.characterId,
        position: client.character.state.position,
      });
    }, 500);*/
  },
  testvehicle: function (server: ZoneServer, client: Client, args: any[]) {
    const characterId = server.generateGuid();
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
      unknownGuid1: characterId,
      unknownDword1: 0,
      unknownDword2: 0,
      positionUpdate: server.createPositionUpdate(
        new Float32Array([0, 0, 0, 0]),
        [0, 0, 0, 0]
      ),
      unknownString1: "",
    };

    server.sendData(client, "PlayerUpdate.AddLightweightVehicle", vehicleData);
  },
  findmodel: function (server: ZoneServer, client: Client, args: any[]) {
    const models = require("../../../../data/2015/dataSources/Models.json");
    const wordFilter = args[1];
    if (wordFilter) {
      const result = models.filter((word: any) =>
        word?.MODEL_FILE_NAME?.toLowerCase().includes(wordFilter.toLowerCase())
      );
      server.sendChatText(client, `Found models for ${wordFilter}:`);
      for (let index = 0; index < result.length; index++) {
        const element = result[index];
        server.sendChatText(client, `${element.ID} ${element.MODEL_FILE_NAME}`);
      }
    } else {
      server.sendChatText(client, `missing word filter`);
    }
  },
  reloadpackets: function (server: ZoneServer, client: Client, args: any[]) {
    if (args[1]) {
      server.reloadPackets(client, args[1]);
    } else {
      server.reloadPackets(client);
    }
  },
  reloadmongo: function (server: ZoneServer, client: Client, args: any[]) {
    server._soloMode
      ? server.sendChatText(client, "Can't do that in solomode...")
      : server.reloadMongoData(client);
  },
};

export default dev;
