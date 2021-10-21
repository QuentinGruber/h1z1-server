import { LoginClient, LoginServer, ZoneServer } from "../../../h1z1-server";
const zoneServer = new ZoneServer(
  1117,
  new (Buffer as any).from("F70IaxuU8C/w7FPXY1ibXw==", "base64"),
  "mongodb://localhost:27017/",
  1
);
zoneServer._gatewayServer._soeServer._useMultiPackets = false;
zoneServer.start().then(() => {
  new LoginServer(1115, "mongodb://localhost:27017/").start().then(() => {
    setTimeout(() => {
      var client = new LoginClient(
        295110,
        "dev",
        "127.0.0.1",
        1115,
        new (Buffer as any).from("F70IaxuU8C/w7FPXY1ibXw==", "base64"), // <- loginkey
        4851
      );
      client.connect();
      console.log("connect");
      client.on("login", (err, res) => {
        console.log(res);
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
            preferredGatewayId: 8,
          });
        }, 2000);
      });
      client.on("characterinfo", (err, res) => {
        console.log(`Get characterinfo`);
        console.log(res);
        client.requestCharacterCreate();
      });
      client.on("characterlogin", (err, res) => {
        console.log(`Get characterlogin`);
        console.log(res);
        process.exit(0);
      });
    }, 2000);
  });
});

setInterval(() => {
  throw new Error("Test timed out!");
}, 60000);
