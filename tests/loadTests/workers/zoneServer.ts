import { parentPort } from "worker_threads";
import { ZoneServer } from "../../../h1z1-server";
import { Base64 } from "js-base64";

async function setup() {
  await new ZoneServer(
    1117,
    Base64.toUint8Array("F70IaxuU8C/w7FPXY1ibXw==")
  ).start();
  parentPort.postMessage("started");
}

setup();
