import {LoginClient , LoginServer} from "../../h1z1-server";
import { Base64 } from "js-base64";


new LoginServer(1115).start();


for (let index = 0; index < 100; index++) {
  const client = new LoginClient(
    295110,
    "dev",
    "127.0.0.1",
    1115,
    Base64.toUint8Array("F70IaxuU8C/w7FPXY1ibXw=="), // <- loginkey
    4851+index
  );
  console.time("FullLogin"+index)
  client.connect();
  client.on("login", (err,res) => {
    if (res.loggedIn) {
      client.requestServerList()
    }
  });
  client.on("serverlist", (err,res) => {
    client.requestCharacterInfo()
  });
  client.on("characterinfo", (err,res) => {
    client.requestCharacterLogin("0x0000000000000001",1,{locale:"EnUS",localeId:1,preferredGatewayId:8})
  });
  client.on("characterlogin", (err,res) => {
      console.timeEnd("FullLogin"+index)
    });
}