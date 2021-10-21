import { parentPort } from "worker_threads";
import { ZoneServer } from "../../h1z1-server";

async function setup() {
  await new ZoneServer(
    1117,
    Buffer.from("F70IaxuU8C/w7FPXY1ibXw==", "base64")
  ).start();
  parentPort.postMessage("started");
}

setup();
