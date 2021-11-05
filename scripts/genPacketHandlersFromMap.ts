import PacketHandlersObj from "../src/servers/ZoneServer/zonepackethandlersMap"
import fs from "fs";

const mapFile = fs.readFileSync(__dirname+"/../src/servers/ZoneServer/zonepackethandlersMap.ts").toString()
const funcOnly = mapFile.split("const packetHandlers = {")
funcOnly.shift();
let funcOnlyString = funcOnly[0];
funcOnlyString = funcOnlyString.replace(`export default packetHandlers;`,"")
const PacketHandlersObjKeys = Object.keys(PacketHandlersObj)
function foundBody(keyProvided:string){
  let key;
  if(keyProvided.includes(".")){
    keyProvided = '"' +  keyProvided+'"'
    key = keyProvided+':'
  }
  else{
    key = keyProvided+":"
  }
  const functionIndex = funcOnlyString.indexOf(key);
  const keyIndex = PacketHandlersObjKeys.findIndex(e=> {
    return e == (keyProvided.includes('"')?keyProvided.substring(1,keyProvided.length-1):keyProvided)}
  );
  const nextKey = (PacketHandlersObjKeys[keyIndex+1]?.includes('.')?'"'+PacketHandlersObjKeys[keyIndex+1]+'"':PacketHandlersObjKeys[keyIndex+1])+":"
  const start = functionIndex+key.length+1;
  const end = nextKey !== "undefined:"?funcOnlyString.indexOf(nextKey) -1:funcOnlyString.length -3;
  const functionBody = funcOnlyString.substring(start,end);
  const aller = functionBody.substring(0,functionBody.lastIndexOf(","))
  if(end == -2 ||keyIndex == -1){
    console.log("fail : "+keyProvided)
    console.log("nouvelle etape : "+keyProvided)
    console.log(functionIndex)
    console.log(keyIndex)
    console.log("suivante: "+nextKey)
    console.log(start)
    console.log(end)
    return "function (server: ZoneServer, client: Client, packet: any) {}"
  }
  else
    return aller
}

function camelCaseConvert(text:string){
    if(text.includes(".")){
        const dotIndex = text.indexOf(".");
        text = text.replace(".","");
        const txtArray = [...text];
        txtArray[0] = text[0].toLowerCase();
        txtArray[dotIndex] = text[dotIndex].toUpperCase();
        text = txtArray.join("");
        return text;
    }
    else{
        return text
    }
}

  let packetHandlersFunctionStr = ` 
  import { ZoneClient as Client } from "./classes/zoneclient";\n
import { ZoneServer } from "./zoneserver";\n
const debug = require("debug")("zonepacketHandlers");\n
import { joaat } from "h1emu-core";\n
let hax = require("./commands/hax").default;\n
let dev = require("./commands/dev").default;\n
import admin from "./commands/admin";\n
import {
  _,
  generateRandomGuid,
  Int64String,
  isPosInRadius,
} from "../../utils/utils";\n
const modelToName = require("../../../data/2015/sampleData/ModelToName.json");


export class zonePacketHandlers{
`;

Object.keys(PacketHandlersObj).forEach((key:string) => {
    packetHandlersFunctionStr += `${camelCaseConvert(key)}:any;\n`
  });

  packetHandlersFunctionStr += "constructor(packetHandlerMap:any){"
// create vars from map
Object.keys(PacketHandlersObj).forEach((key:string) => {
    packetHandlersFunctionStr += `this.${camelCaseConvert(key)} = ${foundBody((key))}\n`
  });

packetHandlersFunctionStr += `}processPacket(server:ZoneServer,client:Client,packet:any){\n
    switch(packet.name){\n`
// create switch
  Object.keys(PacketHandlersObj).forEach((key:string) => {
    packetHandlersFunctionStr += `case "${key}":\nthis.${camelCaseConvert(key)}(server,client,packet);\nbreak\n`
  });

  packetHandlersFunctionStr += `default:debug(packet);debug('Packet not implemented in packetHandlers');break;}}`

  packetHandlersFunctionStr += `async reloadCommandCache(){
    delete require.cache[require.resolve("./commands/hax")];
    delete require.cache[require.resolve("./commands/dev")];
    hax = await import("./commands/hax");
    dev = await import("./commands/dev");
  }`
  packetHandlersFunctionStr += `}`


  fs.writeFileSync(__dirname+"/../src/servers/ZoneServer/zonepackethandlers.ts",packetHandlersFunctionStr)