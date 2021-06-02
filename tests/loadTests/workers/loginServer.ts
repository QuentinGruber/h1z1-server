
import { parentPort } from "worker_threads";
import { LoginServer } from "../../../h1z1-server"



async function setup() {
    await (new LoginServer(1115)).start()
    parentPort.postMessage("started");
}

setup();