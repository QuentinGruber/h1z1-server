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
  const end = funcOnlyString.indexOf(nextKey) -1;
  const functionBody = funcOnlyString.substring(start,end);
  console.log("nouvelle etape : "+keyProvided)
  console.log(functionIndex)
  console.log(keyIndex)
  console.log("suivante: "+nextKey)
  console.log(start)
  console.log(end)
  const aller = functionBody.substring(0,functionBody.lastIndexOf(","))
  if(end == -2 ||keyIndex == -1)
    return "function (server: ZoneServer, client: Client, packet: any) {}"
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
import { _ } from "../../utils/utils";\n
const debug = require("debug")("zonepacketHandlers");\n


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

  packetHandlersFunctionStr += `default:debug(packet);debug('Packet not implemented in packetHandlers');break;}}}`

  fs.writeFileSync(__dirname+"/../src/servers/ZoneServer/zonepackethandlers.ts",packetHandlersFunctionStr)