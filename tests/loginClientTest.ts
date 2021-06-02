import { LoginClient, LoginServer } from "../h1z1-server";
import { Base64 } from "js-base64";

new LoginServer(1115).start();

var client = new LoginClient(
  295110,
  "dev",
  "127.0.0.1",
  1115,
  Base64.toUint8Array("F70IaxuU8C/w7FPXY1ibXw=="), // <- loginkey
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
client.on("characterinfo", (err, res) => {
  console.log(`Get characterinfo`);
  console.log(res);
  setTimeout(() => {
    client.requestCharacterLogin("0x0000000000000001", 1, {
      locale: "EnUS",
      localeId: 1,
      preferredGatewayId: 8,
    });
  }, 2000);
});
client.on("characterlogin", (err, res) => {
  console.log(`Get characterlogin`);
  console.log(res);
  process.exit(0);
});

setInterval(() => {
  throw new Error("Test timed out!");
}, 15000);
