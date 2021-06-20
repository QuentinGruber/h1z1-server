const debug = require("debug")("zonepacketHandlers");
import { Client } from "types/zoneserver";
import { ZoneServer } from "../zoneserver";
const admin: any = {
  shutdown: async function (server: ZoneServer, client: Client, args: any[]) {
    const timeLeft = args[1]?args[1] * 3600000: 0
    const message = args[2]?args[2]:" "
    const startedTime = Date.now();
    server.sendDataToAll("WorldShutdownNotice", {
      timeLeft: timeLeft,
      message: message,
    });/*
    setInterval(async ()=>{
      const currentTimeLeft = timeLeft - ( Date.now() - startedTime ) 
      if(currentTimeLeft < 0){
      server.sendDataToAll("WorldShutdownNotice", {
        timeLeft: 0,
        message: message,
      });
      server.sendDataToAll("CharacterSelectSessionResponse", {
        status: 1,
        sessionId: 0, // TODO: get sessionId from client object
      });
      await server.saveWorld()
      setTimeout(()=> process.exit(0),15000)
    }
    else{
      server.sendDataToAll("WorldShutdownNotice", {
        timeLeft: currentTimeLeft,
        message: message,
      });
    }
    },timeLeft/3)
    */
  },
};

export default admin;
