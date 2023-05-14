import { LoginClient, LoginServer, ZoneServer } from "../../../h1z1-server";

const loginServer = new LoginServer(1115, "mongodb://localhost:27017/");
loginServer._enableHttpServer = false; // note: if i want to enable it and test routes , i need to change port 80 to something superior at 1024
loginServer._soeServer._waitQueueTimeMs = 0;
loginServer._soeServer._crcSeed = 0;
loginServer.start().then(() => {
  const zoneServer = new ZoneServer(
    1117,
    Buffer.from("F70IaxuU8C/w7FPXY1ibXw==", "base64"),
    "mongodb://localhost:27017/",
    1
  );
  //@ts-ignore
  zoneServer._gatewayServer._waitQueueTimeMs = 0;
  zoneServer._loginServerInfo.address = "127.0.0.1";

  zoneServer.start().then(() => {
    setTimeout(() => {
      const client = new LoginClient(
        295110,
        "dev",
        "127.0.0.1",
        1115,
        Buffer.from("F70IaxuU8C/w7FPXY1ibXw==", "base64"), // <- loginkey
        4851
      );
      client.connect();
      console.log("connect");
      client.on("login", (err, res) => {
        if (res.loggedIn) {
          client.requestServerList();
        }
      });
      client.on("serverlist", (err, res) => {
        console.log(`Get a serverlist of ${res.servers.length} servers`);
        client.requestCharacterInfo();
      });
      client.on("charactercreate", (err, res) => {
        setTimeout(() => {
          client.requestCharacterLogin(res.characterId, 1, {
            locale: "EnUS",
            localeId: 1,
            preferredGatewayId: 8
          });
        }, 2000);
      });
      client.on("characterinfo", (err, res) => {
        console.log(`Get characterinfo`);
        client.requestCharacterCreate();
      });
      client.on("characterlogin", (err, res) => {
        console.log(`Get characterlogin`);
        process.exit(0);
      });
    }, 2000);
    setInterval(() => {
      throw new Error("Test timed out!");
    }, 60000);
  });
});
