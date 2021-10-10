import express from 'express'
import { MongoClient } from 'mongodb'
import { workerData, parentPort } from "worker_threads";
import { httpServerMessage } from "types/shared";

function sendMessageToServer(type:string,requestId:number,data:any){
    const message:httpServerMessage =  {type:type,requestId:requestId,data:data}
    parentPort?.postMessage(message);
}

const app = express()
app.use(
  express.urlencoded({
    extended: true,
  }),
);

const { MONGO_URL, SERVER_PORT } = workerData;

const client = new MongoClient(MONGO_URL)
const dbName = "h1server"
const db = client.db(dbName)
client.connect()
let requestCount = 0;
const pendingRequest:any = {};


app.get('/queue', async function (req:any, res:any) {
  const collection = db.collection('servers')
  const serversArray = await collection.find().toArray();
  res.send(JSON.stringify(serversArray))
})

app.get('/ping', async function (req:any, res:any) {
  requestCount++;
  sendMessageToServer("ping",requestCount,null);
  pendingRequest[requestCount] = res;
})


interface CharacterCreateRequest{
    characterObj:string;
}
app.post('/character', async function (req:any, res:any) {
    try {
      const { characterObj } = req.body as CharacterCreateRequest;
      const characterObjJson = JSON.parse(characterObj);
      const collection = db.collection('characters')
      const charactersArray = await collection.findOne({ characterId: characterObjJson.characterId });
      if(!charactersArray){
        await collection.insertOne(characterObjJson);
      }
      res.send(true)
    } catch (error) {
      res.send(false)
    }
  })
 
interface CharacterDeleteRequest{
    characterId: string
    ownerId: string
}
app.delete('/character', async function (req:any, res:any) {
    try {
      const { characterId, ownerId } = req.query as CharacterDeleteRequest;
      const collection = db.collection('characters')
      const charactersArray = await collection.find({ characterId: characterId }).toArray();
      if(charactersArray.length > 1){// dup id ? not good
        res.send(false)
      }
      if(charactersArray[0].ownerId != ownerId){
        res.send(false)
      }
      else{
        await collection.deleteOne({ characterId: characterId })
        res.send(true)
      }
    } catch (error) {
      res.send(false)
    }
  })
app.listen(SERVER_PORT)



parentPort?.on(`message`,(message:httpServerMessage)=>{
    const {type,requestId,data} = message
    switch (type) {
      case "ping":
        pendingRequest[requestId].send(data)
        delete pendingRequest[requestId];
      break;
      default:
        break;
    }
})  