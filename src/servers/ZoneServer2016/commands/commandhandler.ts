import { ZoneClient2016 as Client} from "../classes/zoneclient";
import { ZoneServer2016 } from "../zoneserver";
import { flhash } from "../../../utils/utils";
import { Command } from "./types";
import { commands } from "./commands";

export class CommandHandler {
  private commands: {[hash: number]: Command} = {}
  constructor() {
    commands.forEach((command)=> {
      this.commands[flhash(command.name.toUpperCase())] = command;
    })
    console.log(this.commands);
  }

  executeCommand (
    server: ZoneServer2016,
    client: Client,
    packet: any
  ) {
    const hash = packet.data.commandHash;
    if(this.commands[hash.toString()]) {
      // todo: check permissionLevel
      this.commands[hash].execute(server, client, packet);
    }
    else if(hash == flhash("HELP")) {
      server.sendChatText(client, "TODO");
    }
    else {
      server.sendChatText(client, `Unknown command, hash: ${hash}`);
    }
  }
}