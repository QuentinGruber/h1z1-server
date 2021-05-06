const debug = require("debug")("zonepacketHandlers");

const dev = {
  testpacket: function (server, client, args) {
    const packetName = args[1];
    server.sendData(client, packetName, {});
  },
  testNpc: function (server, client, args) {
    const characterId = server.generateGuid();
    server.sendData(client, "PlayerUpdate.AddLightweightNpc", {
      characterId: characterId,
      modelId: 9001,
      transientId: server.getTransientId(client, characterId),
      position: client.character.state.position,
      attachedObject:{
        unknown1:"0x0000000000000000",
        unknownVector2:client.character.state.position,
        unknownVector3:[0,0,0,0],
        unknown4:0,
        unknown33:0
      },
      color:{r:0,g:0,b:0},
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
  testVehicle: function (server, client, args) {
    const characterId = server.generateGuid();
    const vehicleData = {
      npcData: {
        unknownString0: "",
        guid: characterId,
        transientId: server.getTransientId(client, characterId),
        nameId: 12,
        unknownDword2: 0,
        unknownDword3: 0,
        unknownByte1: 0,
        modelId: 7225,
        scale: [1, 1, 1, 1],
        unknownString1: "",
        unknownString2: "",
        unknownDword5: 0,
        unknownDword6: 0,
        position: client.character.state.position,
        unknownVector1: [0, 0, 0, 0],
        rotation: [0, 0, 0, 1],
        unknownDword7: 0,
        unknownFloat1: 3,
        unknownString3: "",
        unknownString4: "",
        unknownString5: "",
        vehicleId: 3,
        unknownDword9: 0,
        npcDefinitionId: 2,
        unknownByte2: 2,
        profileId: 3,
        unknownBoolean1: false,
        unknownData1: {
          unknownByte1: 16,
          unknownByte2: 9,
          unknownByte3: 0,
        },
        unknownByte6: 0,
        unknownDword11: 0,
        unknownGuid1: "0x0000000000000000",
        unknownData2: {
          unknownGuid1: "0x0000000000000000",
        },
        unknownDword12: 0,
        unknownDword13: 0,
        unknownDword14: 0,
        unknownByte7: 0,
        unknownArray1: [],
        array5: [{ unknown1: 0 }],
        array17: [{ unknown1: 0 }],
        array18: [{ unknown1: 0 }],
      },
      unknownGuid1: characterId,
      unknownDword1: 0,
      unknownDword2: 0,
      positionUpdate: server.createPositionUpdate([0, 0, 0, 0], [0, 0, 0, 0]),
      unknownString1: "",
    };

    server.sendData(client, "PlayerUpdate.AddLightweightVehicle", vehicleData);
  },
  findModel: function (server, client, args) {
    const models = require("../../../../data/dataSources/Models.json");
    const wordFilter = args[1];
    if (wordFilter) {
      const result = models.filter((word) =>
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
  reloadPackets: function (server, client, args) {
    if (args[1]) {
      server.reloadPackets(client, args[1]);
    } else {
      server.reloadPackets(client);
    }
  },
  reloadMongo: function (server, client, args) {
    server._soloMode
      ? server.sendChatText(client, "Can't do that in solomode...")
      : server.reloadMongoData(client);
  },
};

export default dev;
