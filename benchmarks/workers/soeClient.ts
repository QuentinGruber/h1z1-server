import { parentPort } from "worker_threads";
import { SOEClient } from "../../h1z1-server";

const cryptoKey = Buffer.from("F70IaxuU8C/w7FPXY1ibXw==", "base64");

const soeClient: any = new SOEClient(
  "test",
  "127.0.0.1",
  1115,
  cryptoKey,
  8889
);
parentPort.on("message", (action) => {
  switch (action) {
    case "connect":
      console.log("goooo");
      soeClient.connect();
      break;

    default:
      break;
  }
});

soeClient.on("connect", () => {
  parentPort.postMessage("ok");
});
