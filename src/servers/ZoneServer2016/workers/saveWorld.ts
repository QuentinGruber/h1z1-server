import { parentPort, workerData } from "worker_threads";
import { MongoClient } from "mongodb";

async function connecToMongo() {
  const { mongoAddress } = workerData;

  const mongoClient = new MongoClient(mongoAddress);

  try {
    await mongoClient.connect();
  } catch (e) {
    throw console.log("[ERROR]Unable to connect to mongo server");
  }
  return mongoClient.db("h1server");
}

async function saveWorld() {
  const { worldId, worldSave } = workerData;
  const db = await connecToMongo();
  await db
    ?.collection("worlds")
    .updateOne({ worldId: worldId }, { $set: JSON.parse(worldSave) });
  parentPort?.postMessage("World saved!");
  process.exit(0);
}

saveWorld();
