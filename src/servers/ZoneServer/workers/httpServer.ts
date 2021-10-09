import express from 'express'
import { MongoClient } from 'mongodb'
import { workerData, parentPort } from "worker_threads";
import { httpServerMessage } from "types/shared";

function sendMessageToServer(type:string,data:any){
    const message:httpServerMessage =  {type:type,data:data}
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


app.get('/queue', async function (req:any, res:any) {
  const collection = db.collection('servers')
  const serversArray = await collection.find().toArray();
  res.send(JSON.stringify(serversArray))
})

app.get('/ping', async function (req:any, res:any) {
  parentPort?.once(`message`,(data:string)=>{
    res.send(data)
  })  
  sendMessageToServer("ping",null);
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
    characterId:string
}
app.delete('/character', async function (req:any, res:any) {
    try {
      const { characterId } = req.body as CharacterDeleteRequest;
      const collection = db.collection('characters')
      const charactersArray = await collection.find({ characterId: characterId }).toArray();
      if(charactersArray.length > 1){// dup id ? not good
        res.send(false)
      }
      await collection.deleteOne({ characterId: characterId })
      res.send(true)
    } catch (error) {
      res.send(false)
    }
  })
app.listen(SERVER_PORT)