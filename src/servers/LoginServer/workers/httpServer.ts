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
app.get('/servers', async function (req:any, res:any) {
  const collection = db.collection('servers')
  const serversArray = await collection.find().toArray();
  res.send(JSON.stringify(serversArray))
})

app.get('/ping', async function (req:any, res:any) {
  res.send("pong")
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