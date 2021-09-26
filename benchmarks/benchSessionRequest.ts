import { LoginServer, SOEClient, SOEServer } from "../h1z1-server";
const cryptoKey = Buffer.from("F70IaxuU8C/w7FPXY1ibXw==", "base64");
const numberOfClient = 5;

(async function benchSessionRequest() {
  new SOEServer("test", 1115, cryptoKey, 0).start(0, 0, 2, 512);
  for (let index = 0; index < numberOfClient; index++) {
    const client: any = new SOEClient(
      "",
      "127.0.0.1",
      1115,
      cryptoKey,
      9994 + index
    );
    setTimeout(() => {
      console.time(`Client#${index}-sessionRequest`);
      client.connect();
    }, 500);
    client.on("connect", () => {
      console.timeEnd(`Client#${index}-sessionRequest`);
    });
  }
})();
