// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2024 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

import { MongoClient } from "mongodb";
import { httpServerMessage } from "types/shared";
import { parentPort, workerData } from "node:worker_threads";
import http from "node:http";
import https from "node:https";
import { DB_COLLECTIONS } from "../../../utils/enums";
import { DB_NAME } from "../../../utils/constants";
function sendMessageToServer(type: string, requestId: number, data: any) {
  const message: httpServerMessage = {
    type: type,
    requestId: requestId,
    data: data
  };
  parentPort?.postMessage(message);
}

const { MONGO_URL, SERVER_PORT, HTTPS_PORT, SSL_KEY, SSL_CERT } = workerData;
const sslOptions = {
  key: SSL_KEY,
  cert: SSL_CERT
};

const client = new MongoClient(MONGO_URL, {
  maxPoolSize: 5
});
const dbName = DB_NAME;
const db = client.db(dbName);
client.connect();
let requestCount = 0;
const pendingRequest: any = {};

function parseQueryString(queryString: string) {
  const queryObject: any = {};
  const elementArray = queryString.split("&");
  elementArray.forEach((element: string) => {
    const [key, value] = element.split("=");
    queryObject[key] = value;
  });
  return queryObject;
}
async function handleRequest(
  req: http.IncomingMessage,
  res: http.ServerResponse
) {
  res.setHeader("Access-Control-Allow-Origin", "*"); // Allow all origins
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS"); // Allow specified methods
  res.setHeader("Access-Control-Allow-Headers", "Content-Type"); // Allow specified headers
  if (req.method === "OPTIONS") {
    res.writeHead(204); // No Content response
    res.end();
    return;
  }
  const url = req.url ? req.url.substr(1, req.url.length - 1) : "";
  const [path, queryString] = url.split("?");
  const queryObject: any = queryString ? parseQueryString(queryString) : null;
  switch (path) {
    case "servers": {
      const collection = db.collection(DB_COLLECTIONS.SERVERS);
      const serversArray = await collection.find().toArray();
      serversArray.forEach((server) => {
        delete server.serverAddress;
      });
      res.writeHead(200, { "Content-Type": "text/json" });
      res.write(JSON.stringify(serversArray));
      res.end();
      break;
    }
    case "ping": {
      requestCount++;
      sendMessageToServer("ping", requestCount, null);
      pendingRequest[requestCount] = res;
      break;
    }
    case "pingzone": {
      requestCount++;
      sendMessageToServer(
        "pingzone",
        requestCount,
        Number(queryObject?.serverId)
      );
      pendingRequest[requestCount] = res;
      break;
    }
    case "isverified": {
      if (!queryObject) {
        res.writeHead(500);
        res.end();
        break;
      }
      let { authKey } = queryObject;
      if (authKey) {
        authKey = decodeURIComponent(authKey);
        const collection = db.collection(DB_COLLECTIONS.AUTHKEYS);

        const result = await collection.findOne({ authKey });
        if (result) {
          res.writeHead(200);
          res.end();
        } else {
          res.writeHead(401);
          res.end();
        }
      }
      break;
    }
    default:
      res.writeHead(404, { "Content-Type": "text/json" });
      res.end();
      break;
  }
}
const agent = new http.Agent({
  keepAlive: true,
  maxSockets: 45
});
http.request({
  agent: agent,
  method: "GET",
  hostname: "localhost",
  port: SERVER_PORT
});
const httpServer = http.createServer().listen(SERVER_PORT);
console.log(`Http server listening on ${SERVER_PORT}`);
httpServer.on("request", handleRequest);
httpServer.on("error", (error) => {
  console.error(error);
});

if (HTTPS_PORT) {
  const httpsAgent = new https.Agent({
    keepAlive: true,
    maxSockets: 45
  });
  https.request({
    agent: httpsAgent,
    method: "GET",
    hostname: "localhost",
    port: HTTPS_PORT
  });
  const httpsServer = https.createServer(sslOptions).listen(HTTPS_PORT);
  console.log(`Https server listening on ${HTTPS_PORT}`);
  httpsServer.on("request", handleRequest);
  httpsServer.on("error", (error) => {
    console.error(error);
  });
}
parentPort?.on(`message`, (message: httpServerMessage) => {
  const { type, requestId, data } = message;
  switch (type) {
    case "pingzone": {
      const res = pendingRequest[requestId];
      if (data === "pong") {
        res.writeHead(200, { "Content-Type": "text/json" });
        res.write(data);
      } else {
        res.writeHead(404, { "Content-Type": "text/json" });
      }
      res.end();
      delete pendingRequest[requestId];
      break;
    }
    case "ping":
      const res = pendingRequest[requestId];
      res.writeHead(200, { "Content-Type": "text/json" });
      res.write(data);
      res.end();
      delete pendingRequest[requestId];
      break;
    default:
      break;
  }
});
