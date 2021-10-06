import express from 'express'
import { MongoClient } from 'mongodb'
import { workerData } from "worker_threads";

const app = express()
app.use(
  express.urlencoded({
    extended: true,
  }),
);

const { MONGO_URL, SERVER_PORT } = workerData;

const client = new MongoClient(MONGO_URL)
const dbName = "h1server"
console.log(MONGO_URL)
client.connect().then(()=>{
    console.log('Connected successfully to server')
})
const db = client.db(dbName)
app.get('/queue', async function (req:any, res:any) {
  const collection = db.collection('servers')
  const serversArray = await collection.find().toArray();
  res.send(JSON.stringify(serversArray))
})


interface CharacterCreateRequest{
    characterId:string;
    characterObj:string;
}
app.post('/character', async function (req:any, res:any) {
    try {
      const { characterId, characterObj } = req.body as CharacterCreateRequest;
      const collection = db.collection('characters')
      const charactersArray = await collection.findOne({ characterId: characterId });
      if(!charactersArray){
        await collection.insertOne(JSON.parse(characterObj));
      }
      res.send(true)
    } catch (error) {
      res.send(false)
    }
  })
 
app.listen(SERVER_PORT)