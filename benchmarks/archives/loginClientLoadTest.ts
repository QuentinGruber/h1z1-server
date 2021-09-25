import { LoginClient } from "../../h1z1-server";

import { Worker } from "worker_threads";
const loginServer = new Worker(`${__dirname}/workers/loginServer.js`);
loginServer.on("message", ()=>setTimeout(testLoad,100));

function testLoad() {
    for (let index = 0; index < 100; index++) {
      const client = new LoginClient(
        295110,
        "dev",
        "127.0.0.1",
        1115,
        Buffer.from("F70IaxuU8C/w7FPXY1ibXw==", "base64"), // <- loginkey
        4851 + index
      );
      console.time("FullLogin" + index);
      queueMicrotask(()=>client.connect())
      client.on("login", (err, res) => {
        if (res.loggedIn) {
          client.requestServerList();
        }
      });
      client.on("serverlist", (err, res) => {
        client.requestCharacterInfo();
      });
      client.on("charactercreate", (err, res) => {
          client.requestCharacterLogin(res.characterId, 1, {
            locale: "EnUS",
            localeId: 1,
            preferredGatewayId: 8,
          });
      });
      client.on("characterinfo", (err, res) => {
        client.requestCharacterCreate();
      });
      client.on("characterlogin", (err, res) => {
        console.timeEnd("FullLogin" + index);
      });
    }
}
