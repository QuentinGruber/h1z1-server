import { ZoneClient2016 as Client} from "../classes/zoneclient";
import { ZoneServer2016 } from "../zoneserver";
import { flhash } from "../../../utils/utils";
import { Command, PermissionLevels } from "./types";
import { commands } from "./commands";
import { internalCommands } from "./internalcommands";

export class CommandHandler {
  readonly commands: {[hash: number]: Command} = {};
  readonly internalCommands: {[name: string]: Command} = {};

  constructor() {
    this.indexCommands(commands);
  }

  indexCommands(commands: Array<Command>) {
    commands.forEach((command)=> {
      this.commands[flhash(command.name.toUpperCase())] = command;
    })
    internalCommands.forEach((command)=> {
      this.internalCommands[command.name] = command;
    })
  }

  executeCommand (
    server: ZoneServer2016,
    client: Client,
    packet: any
  ) {
    const hash = packet.data.commandHash,
    args: string[] = packet.data.arguments.toLowerCase().split(" ");
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
      command.execute(server, client, args);
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

  executeInternalCommand (
    server: ZoneServer2016,
    client: Client,
    commandName: string,
    packet: any
  ) {
    if(this.internalCommands[commandName]) {
      const command = this.internalCommands[commandName];
      // temp permissionLevel logic until isAdmin is replaced
      if(
        command.permissionLevel != PermissionLevels.DEFAULT &&
        !client.isAdmin && 
        (server._allowedCommands.length > 0 && !server._allowedCommands.includes(command.name))
      ) {
        server.sendChatText(client, "You don't have access to that.");
        return;
      }
      command.execute(server, client, packet.data);
    }
    else {
      server.sendChatText(client, `Unknown command: ${commandName}`);
    }
  }

  reloadCommands() {
    delete require.cache[require.resolve("./commands")];
    const commands = require("./commands").commands;
    this.indexCommands(commands);
  }
}