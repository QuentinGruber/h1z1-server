import PacketHandlersObj from "../src/servers/ZoneServer/zonepackethandlersMap"
import fs from "fs";
  let packetHandlersFunctionStr = ` 
  import { ZoneClient } from "./classes/zoneclient";\n
import { ZoneServer } from "./zoneserver";\n
import packetHandlerMap from "./zonepackethandlersMap";\n
const debug = require("debug")("zonepacketHandlers");\n
`;

function camelCaseConvert(text:string){
    if(text.includes(".")){
        const dotIndex = text.indexOf(".");
        text = text.replace(".","");
        const txtArray = [...text];
        txtArray[0] = text[0].toLowerCase();
        txtArray[dotIndex] = text[dotIndex].toUpperCase();
        text = txtArray.join("");
        console.log(txtArray)
        return text;
    }
    else{
        return text
    }
}

// create vars from map
Object.keys(PacketHandlersObj).forEach((key:string) => {
    packetHandlersFunctionStr += `const ${camelCaseConvert(key)} = packetHandlerMap["${key}"];\n`
  });

packetHandlersFunctionStr += `export function packetHandlerSwitch(server:ZoneServer,client:ZoneClient,packet:any){\n
    switch(packet.name){\n`
// create switch
  Object.keys(PacketHandlersObj).forEach((key:string) => {
    const entireFunction = (PacketHandlersObj as any)[key].toString();
    const functionBody = entireFunction.slice(entireFunction.indexOf("{"), entireFunction.lastIndexOf("}")+1);
    packetHandlersFunctionStr += `case "${key}":\n${camelCaseConvert(key)}(server,client,packet);\nbreak\n`
  });

  packetHandlersFunctionStr += `default:debug(packet);debug('Packet not implemented in packetHandlers');break;}}exports.packetHandlerSwitch = packetHandlerSwitch;`
  fs.writeFileSync(__dirname+"/../src/servers/ZoneServer/zonepackethandlers.ts",packetHandlersFunctionStr)