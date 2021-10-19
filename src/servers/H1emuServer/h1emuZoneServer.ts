import { H1emuClient } from "./shared/h1emuclient";
import { H1emuServer } from "./shared/h1emuserver";
const debug = require("debug")("H1emuServer");

export class H1emuZoneServer extends H1emuServer{
  _loginServerInfo: any;
  constructor(serverPort?:number){
    super(serverPort)
    this.messageHandler = (messageType:string,data:Buffer,client:H1emuClient):void => {
      switch(messageType) {
        case "incomingPacket":
          const packet = this._protocol.parse(data);
          console.log(packet)
          if (!packet) return;
          switch(packet.name) {
            case "Ping":
              client.lastPing = Date.now();
              break;
            case "SessionReply":{
              debug(`Received session reply from ${client.address}:${client.port}`);
              if(client.clientId !== `${this._loginServerInfo.address}:${this._loginServerInfo.port}`) {
                // blocks unknown sessionreplies
                debug(`LoginConnection refused: Unknown login address / port`);
                return;
              };
              if(client.session) {
                // ignores sessionreplies with an already open session
                debug(`LoginConnection already had open session, ignoring SessionReply`);
                return;
              }
              if( packet.data.status === 1 ){
                client.session = true;
                this._pingTimer = setTimeout(
                  () => {this.ping(client);this._pingTimer.refresh();},
                  this._pingTime
                );
                this.emit("session", null, client, packet.data.status);
              }
              else{
                debug(`LoginConnection refused: Zone not whitelisted`);
                this.emit("sessionfailed", null, client, packet.data.status);
              }
              break;
            }
            default:
              this.emit("data", null, client, packet);
              break;
          }
          break;
        default:
          debug(`Unknown message type ${messageType}`)
          break;
      }
    }
    this.ping = (client:H1emuClient)=> {
      super.ping(client);
      if(Date.now() > client.lastPing + this._pingTimeout) {
        this.emit("disconnect", null, client, 1);
        delete this._clients[client.clientId];
        clearTimeout(this._pingTimer)
      }
    }
  }
  connect(serverInfo: any, obj: any){
    this._loginServerInfo = serverInfo;
    this.sendData(serverInfo as H1emuClient, "SessionRequest", obj)
  }
}