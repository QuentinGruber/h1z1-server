import { LoginClient, LoginServer } from "../../h1z1-server";

new LoginServer(1115).start();

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
setInterval(() => {
  throw new Error("Test timed out!");
}, 15000);
