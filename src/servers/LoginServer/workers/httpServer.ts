import express from "express";
import { MongoClient } from "mongodb";
import { httpServerMessage } from "types/shared";
import { parentPort, workerData } from "worker_threads";

function sendMessageToServer(type: string, requestId: number, data: any) {
  const message: httpServerMessage = {
    type: type,
    requestId: requestId,
    data: data,
  };
  parentPort?.postMessage(message);
}

const app = express();
app.use(express.json());

const { MONGO_URL, SERVER_PORT } = workerData;

const client = new MongoClient(MONGO_URL);
const dbName = "h1server";
const db = client.db(dbName);
client.connect();
let requestCount = 0;
const pendingRequest: any = {};

app.get("/servers", async function (req: any, res: any) {
  const collection = db.collection("servers");
  const serversArray = await collection.find().toArray();
  res.send(JSON.stringify(serversArray));
});

app.get("/ping", async function (req: any, res: any) {
  requestCount++;
  sendMessageToServer("ping", requestCount, null);
  pendingRequest[requestCount] = res;
});


app.get("/pingzone", async function (req: any, res: any) {
  requestCount++;
  sendMessageToServer("pingzone", requestCount, req.query.serverId);
  pendingRequest[requestCount] = res;
});

app.listen(SERVER_PORT);

parentPort?.on(`message`, (message: httpServerMessage) => {
  const { type, requestId, data } = message;
  switch (type) {
    case "pingzone":{
      if(data === "pong")
        pendingRequest[requestId].send(data)
      else {
        pendingRequest[requestId].sendStatus(404)
      }
    }
    case "ping":
      pendingRequest[requestId].send(data);
      delete pendingRequest[requestId];
      break;
    default:
      break;
  }
});
