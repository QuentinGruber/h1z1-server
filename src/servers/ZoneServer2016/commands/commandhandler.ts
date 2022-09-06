import { ZoneClient2016 as Client} from "../classes/zoneclient";
import { ZoneServer2016 } from "../zoneserver";
import { flhash } from "../../../utils/utils";
import { Command, PermissionLevels } from "./types";
import { commands } from "./commands";

export class CommandHandler {
  readonly commands: {[hash: number]: Command} = {}
  constructor() {
    this.indexCommands(commands);
  }

  indexCommands(commands: Array<Command>) {
    commands.forEach((command)=> {
      this.commands[flhash(command.name.toUpperCase())] = command;
    })
  }

  executeCommand (
    server: ZoneServer2016,
    client: Client,
    packet: any
  ) {
    const hash = packet.data.commandHash;
    if(this.commands[hash]) {
      const command = this.commands[hash];
      // temp permissionLevel logic until isAdmin is replaced
      if(
        command.permissionLevel != PermissionLevels.DEFAULT &&
        !client.isAdmin && 
        (server._allowedCommands.length > 0 && !server._allowedCommands.includes(command.name))
      ) {
        server.sendChatText(client, "You don't have access to that.");
        return;
      }
      command.execute(server, client, packet);
    }
    else if(hash == flhash("HELP")) {
      server.sendChatText(
        client,
        `Command list: \n/${Object.values(this.commands).map((command)=> {
          return command.name
        }).join("\n/")}`
      );
    }
    else {
      server.sendChatText(client, `Unknown command, hash: ${hash}`);
    }
  }

  reloadCommands() {
    delete require.cache[require.resolve("./commands")];
    const commands = require("./commands").commands;
    this.indexCommands(commands);
  }
}