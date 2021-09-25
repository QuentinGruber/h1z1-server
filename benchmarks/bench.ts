import { Worker } from "worker_threads";
import { SOEClient } from "../h1z1-server";

const soeServer = new Worker(`${__dirname}/workers/soeServer.js`);

soeServer.on("message", test);

function test(){
    const soeClient = new Worker(`${__dirname}/workers/soeClient.js`);
    soeClient.postMessage("connect");
    soeClient.on("message",()=>console.log)
}