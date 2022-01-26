import { ZoneServer, ZoneClient, LoginServer } from "../../../h1z1-server";

const character = {
  characterId: "0x3bc1e27032c82ed6",
  serverId: 1,
  lastLoginDate: "0x0000000053da0a5b",
  nullField: 0,
  status: 1,
  payload: {
    name: "cool",
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
  ownerId: "someone",
  position: {
    "0": -41.59000015258789,
    "1": 16.1200008392334,
    "2": -72.55999755859375,
    "3": 0,
  },
  rotation: {
    "0": 0,
    "1": 0.9978362321853638,
    "2": 0,
    "3": 0.06574886292219162,
  },
};

async function test() {
  const zoneServer = new ZoneServer(
    1117,
    new (Buffer as any).from("F70IaxuU8C/w7FPXY1ibXw==", "base64"),
    "mongodb://localhost:27017/",
    1
  );
  zoneServer._loginServerInfo.address = "127.0.0.1";
  await zoneServer.start();

  setTimeout(async () => {
    await zoneServer._db.collection("characters").insertOne(character);
    //await zoneServer._db.collection("user-sessions").insertOne(usersession);
    var client = new ZoneClient(
      "127.0.0.1",
      1117,
      Buffer.from("F70IaxuU8C/w7FPXY1ibXw==", "base64"),
      character.characterId,
      character.ownerId,
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
  setTimeout(() => {
    throw new Error("Test timed out!");
  }, 15000);
}

const loginServer = new LoginServer(1115, "mongodb://localhost:27017/");
loginServer._enableHttpServer = false; // note: if i want to enable it and test routes , i need to change port 80 to something superior at 1024

loginServer.start().then(test);
