const debug = require("debug")("zonepacketHandlers");
import { Client } from "types/zoneserver";
import { ZoneServer } from "../zoneserver";

async function shutdown(server:any,startedTime:number,timeLeft:number,message:string) {
  const timeLeftMs = timeLeft * 1000;
  const currentTimeLeft = timeLeftMs - ( Date.now() - startedTime ) 
  if(currentTimeLeft < 0){
  server.sendDataToAll("WorldShutdownNotice", {
    timeLeft: 0,
    message: message,
  });
  server.sendDataToAll("CharacterSelectSessionResponse", {
    status: 1,
    sessionId: "0", // TODO: get sessionId from client object
  });
  await server.saveWorld()
}
else{
  server.sendDataToAll("WorldShutdownNotice", {
    timeLeft: currentTimeLeft / 1000,
    message: message,
  });
  setTimeout(()=>shutdown(server,startedTime,timeLeft,message),timeLeftMs/5)
}
}
const admin: any = {
  shutdown: async function (server: ZoneServer, client: Client, args: any[]) {
    const timeLeft = args[1]?args[1]: 0;
    const message = args[2]?args[2]:" ";
    const startedTime = Date.now();
    shutdown(server,startedTime,timeLeft,message)
  },
};

export default admin;
