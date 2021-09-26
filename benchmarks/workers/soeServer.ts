import { parentPort } from "worker_threads";
import { SOEServer } from "../../h1z1-server";

async function setup() {
  new SOEServer(
    "test",
    1115,
    Buffer.from("F70IaxuU8C/w7FPXY1ibXw==", "base64"),
    0,
    false
  ).start(0, 0, 2, 512);
  parentPort.postMessage("started");
}

setup();
