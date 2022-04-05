import { ZoneServer, ZoneClient } from "../../h1z1-server";
import { getAppDataFolderPath } from "../../out/utils/utils";
import fs from "fs";
const zoneServer = new ZoneServer(
  1117,
  Buffer.from("F70IaxuU8C/w7FPXY1ibXw==", "base64")
);
zoneServer._gatewayServer._crcLength = 2
zoneServer.start();

fs.writeFileSync(
  `${getAppDataFolderPath()}/single_player_characters.json`,
  JSON.stringify([
    {
      characterId: "0x69cf9098124bdb33",
      serverId: 1,
      lastLoginDate: "0x0000000053da0a5b",
      nullField: 0,
      status: 1,
      payload: {
        name: "test",
        empireId: 2,
        battleRank: 100,
        nextBattleRankPercent: 0,
        headId: 1,
        modelId: 9240,
        gender: 1,
        profileId: 4,
        unknownDword1: 1,
        loadoutData: {
          loadoutId: 3,
          unknownData1: { unknownDword1: 22, unknownByte1: 1 },
          unknownDword1: 0,
          unknownData2: { unknownDword1: 0, loadoutName: "" },
          tintItemId: 0,
          unknownDword2: 0,
          decalItemId: 0,
          loadoutSlots: [],
        },
        attachmentDefinitions: [],
        lastUseDate: "0x0000000053da0a5b",
      },
    },
    {
      characterId: "0x01c339062a639939",
      serverId: 1,
      lastLoginDate: "0x0000000053da0a5b",
      nullField: 0,
      status: 1,
      payload: {
        name: "test",
        empireId: 2,
        battleRank: 100,
        nextBattleRankPercent: 0,
        headId: 1,
        modelId: 9240,
        gender: 1,
        profileId: 4,
        unknownDword1: 1,
        loadoutData: {
          loadoutId: 3,
          unknownData1: { unknownDword1: 22, unknownByte1: 1 },
          unknownDword1: 0,
          unknownData2: { unknownDword1: 0, loadoutName: "" },
          tintItemId: 0,
          unknownDword2: 0,
          decalItemId: 0,
          loadoutSlots: [],
        },
        attachmentDefinitions: [],
        lastUseDate: "0x0000000053da0a5b",
      },
    },
    {
      characterId: "0x3e06ed7da6ac3ec6",
      serverId: 1,
      lastLoginDate: "0x0000000053da0a5b",
      nullField: 0,
      status: 1,
      payload: {
        name: "test",
        empireId: 2,
        battleRank: 100,
        nextBattleRankPercent: 0,
        headId: 1,
        modelId: 9240,
        gender: 1,
        profileId: 4,
        unknownDword1: 1,
        loadoutData: {
          loadoutId: 3,
          unknownData1: { unknownDword1: 22, unknownByte1: 1 },
          unknownDword1: 0,
          unknownData2: { unknownDword1: 0, loadoutName: "" },
          tintItemId: 0,
          unknownDword2: 0,
          decalItemId: 0,
          loadoutSlots: [],
        },
        attachmentDefinitions: [],
        lastUseDate: "0x0000000053da0a5b",
      },
    },
    {
      characterId: "0xabb486d33e35802b",
      serverId: 1,
      lastLoginDate: "0x0000000053da0a5b",
      nullField: 0,
      status: 1,
      payload: {
        name: "test",
        empireId: 2,
        battleRank: 100,
        nextBattleRankPercent: 0,
        headId: 1,
        modelId: 9240,
        gender: 1,
        profileId: 4,
        unknownDword1: 1,
        loadoutData: {
          loadoutId: 3,
          unknownData1: { unknownDword1: 22, unknownByte1: 1 },
          unknownDword1: 0,
          unknownData2: { unknownDword1: 0, loadoutName: "" },
          tintItemId: 0,
          unknownDword2: 0,
          decalItemId: 0,
          loadoutSlots: [],
        },
        attachmentDefinitions: [],
        lastUseDate: "0x0000000053da0a5b",
      },
    },
    {
      characterId: "0x2c3701b93e57bf22",
      serverId: 1,
      lastLoginDate: "0x0000000053da0a5b",
      nullField: 0,
      status: 1,
      payload: {
        name: "test",
        empireId: 2,
        battleRank: 100,
        nextBattleRankPercent: 0,
        headId: 1,
        modelId: 9240,
        gender: 1,
        profileId: 4,
        unknownDword1: 1,
        loadoutData: {
          loadoutId: 3,
          unknownData1: { unknownDword1: 22, unknownByte1: 1 },
          unknownDword1: 0,
          unknownData2: { unknownDword1: 0, loadoutName: "" },
          tintItemId: 0,
          unknownDword2: 0,
          decalItemId: 0,
          loadoutSlots: [],
        },
        attachmentDefinitions: [],
        lastUseDate: "0x0000000053da0a5b",
      },
    },
    {
      characterId: "0xa633a32d701a2ff1",
      serverId: 1,
      lastLoginDate: "0x0000000053da0a5b",
      nullField: 0,
      status: 1,
      payload: {
        name: "test",
        empireId: 2,
        battleRank: 100,
        nextBattleRankPercent: 0,
        headId: 1,
        modelId: 9240,
        gender: 1,
        profileId: 4,
        unknownDword1: 1,
        loadoutData: {
          loadoutId: 3,
          unknownData1: { unknownDword1: 22, unknownByte1: 1 },
          unknownDword1: 0,
          unknownData2: { unknownDword1: 0, loadoutName: "" },
          tintItemId: 0,
          unknownDword2: 0,
          decalItemId: 0,
          loadoutSlots: [],
        },
        attachmentDefinitions: [],
        lastUseDate: "0x0000000053da0a5b",
      },
    },
  ])
);

setTimeout(() => {
  var client = new ZoneClient(
    "127.0.0.1",
    1117,
    Buffer.from("F70IaxuU8C/w7FPXY1ibXw==", "base64"),
    "0x69cf9098124bdb33",
    "0",
    "ClientProtocol_860",
    "",
    6457
  );
  client.connect();
  client.on("connect", (err, res) => {
    console.log("connect");
  });
  client.on("ZoneDoneSendingInitialData", (err, res) => {
    console.log("ZoneDoneSendingInitialData");
    process.exit(0);
  });
}, 2000);

setInterval(() => {
  throw new Error("Test timed out!");
}, 60000);
