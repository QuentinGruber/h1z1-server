import { LoginClient, LoginServer } from "../h1z1-server";
import { ZoneServer, ZoneClient } from "../../h1z1-server";
import { getAppDataFolderPath } from "../out/utils/utils";
import fs from "fs";
const cryptoKey = Buffer.from("F70IaxuU8C/w7FPXY1ibXw==", "base64");
const numberOfClient = 10;

(async function benchFullLogin() {
  new ZoneServer(1117, cryptoKey).start();

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
    ])
  );

  for (let index = 0; index < numberOfClient; index++) {
    const client = new ZoneClient(
      "127.0.0.1",
      1117,
      cryptoKey,
      "0x69cf9098124bdb33",
      "0",
      "",
      "",
      6457 + index
    );
    setTimeout(() => {
      console.time(`Client#${index}-fullLoginZone`);
      client.connect();
    }, 2000);
    client.on("ZoneDoneSendingInitialData", (err, res) => {
      console.timeEnd(`Client#${index}-fullLoginZone`);
    });
  }
})();
