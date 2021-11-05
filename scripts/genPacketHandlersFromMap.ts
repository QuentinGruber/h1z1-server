import PacketHandlersObj from "../src/servers/ZoneServer/zonepackethandlersMap"
import fs from "fs";


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
  import { ZoneClient } from "./classes/zoneclient";\n
import { ZoneServer } from "./zoneserver";\n
const debug = require("debug")("zonepacketHandlers");\n

export class zonePacketHandlers{
`;

Object.keys(PacketHandlersObj).forEach((key:string) => {
    packetHandlersFunctionStr += `${camelCaseConvert(key)}:any;\n`
  });

  packetHandlersFunctionStr += "constructor(packetHandlerMap:any){"
// create vars from map
Object.keys(PacketHandlersObj).forEach((key:string) => {
    packetHandlersFunctionStr += `this.${camelCaseConvert(key)} = packetHandlerMap["${key}"];\n`
  });

packetHandlersFunctionStr += `}processPacket(server:ZoneServer,client:ZoneClient,packet:any){\n
    switch(packet.name){\n`
// create switch
  Object.keys(PacketHandlersObj).forEach((key:string) => {
    packetHandlersFunctionStr += `case "${key}":\nthis.${camelCaseConvert(key)}(server,client,packet);\nbreak\n`
  });

  packetHandlersFunctionStr += `default:debug(packet);debug('Packet not implemented in packetHandlers');break;}}}`
  fs.writeFileSync(__dirname+"/../src/servers/ZoneServer/zonepackethandlers.ts",packetHandlersFunctionStr)