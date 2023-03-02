import { LoginClient, LoginServer } from "../../h1z1-server";

const loginServer = new LoginServer(1115);
loginServer._soeServer._crcSeed = 0;
loginServer.start();
loginServer._soeServer._waitQueueTimeMs = 0;

setTimeout(() => {
  var client = new LoginClient(
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
        preferredGatewayId: 8,
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
}, 15000);
