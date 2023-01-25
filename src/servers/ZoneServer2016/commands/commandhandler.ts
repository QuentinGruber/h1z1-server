// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2023 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

import { ZoneClient2016 as Client } from "../classes/zoneclient";
import { ZoneServer2016 } from "../zoneserver";
import { flhash, logClientActionToMongo } from "../../../utils/utils";
import { Command, PermissionLevels } from "./types";
import { commands } from "./commands";
import { internalCommands } from "./internalcommands";
import { DB_COLLECTIONS } from "../../../utils/enums";
import { Collection } from "mongodb";

export class CommandHandler {
  readonly commands: { [hash: number]: Command } = {};
  readonly internalCommands: { [name: string]: Command } = {};

  constructor() {
    this.indexCommands(commands, internalCommands);
  }

  private clientHasCommandPermission(
    server: ZoneServer2016,
    client: Client,
    command: Command
  ) {
    return (
      command.permissionLevel == PermissionLevels.DEFAULT ||
      client.isAdmin || // temp permissionLevel logic until isAdmin is replaced
      server._allowedCommands.includes(command.name)
    );
  }

  private indexCommands(
    commands: Array<Command>,
    internalCommands: Array<Command>
  ) {
    commands.forEach((command) => {
      this.commands[flhash(command.name.toUpperCase())] = command;
    });
    internalCommands.forEach((command) => {
      this.internalCommands[command.name] = command;
    });
  }

  executeCommand(server: ZoneServer2016, client: Client, packet: any) {
    if (
      !server.hookManager.checkHook(
        "OnClientExecuteCommand",
        client,
        packet.data.commandHash,
        packet.data.arguments
      )
    ) {
      return;
    }
    const hash = packet.data.commandHash,
      args: string[] = packet.data.arguments.toLowerCase().split(" ");
    if (this.commands[hash]) {
      const command = this.commands[hash];
      if (!server._soloMode) {
        logClientActionToMongo(
          server._db?.collection(DB_COLLECTIONS.COMMAND_USED) as Collection,
          client,
          server._worldId,
          { name: command.name, permissionLevel: command.permissionLevel, args }
        );
      }
      if (!this.clientHasCommandPermission(server, client, command)) {
        server.sendChatText(client, "You don't have access to that.");
        return;
      }
      command.execute(server, client, args);
    } else if (hash == flhash("HELP")) {
      server.sendChatText(
        client,
        `Command list: \n/${Object.values(this.commands)
          .filter((command) =>
            this.clientHasCommandPermission(server, client, command)
          )
          .map((command) => {
            return command.name;
          })
          .join("\n/")}`
      );
    } else {
      server.sendChatText(client, `Unknown command, hash: ${hash}`);
    }
  }

  executeInternalCommand(
    server: ZoneServer2016,
    client: Client,
    commandName: string,
    packet: any
  ) {
    if (
      !server.hookManager.checkHook(
        "OnClientExecuteInternalCommand",
        client,
        packet.data
      )
    ) {
      return;
    }
    if (this.internalCommands[commandName]) {
      const command = this.internalCommands[commandName];
      if (!server._soloMode) {
        logClientActionToMongo(
          server._db?.collection(DB_COLLECTIONS.COMMAND_USED) as Collection,
          client,
          server._worldId,
          { name: command.name, permissionLevel: command.permissionLevel }
        );
      }
      if (!this.clientHasCommandPermission(server, client, command)) {
        server.sendChatText(client, "You don't have access to that.");
        return;
      }
      command.execute(server, client, packet.data);
    } else {
      server.sendChatText(client, `Unknown command: ${commandName}`);
    }
  }

  reloadCommands() {
    delete require.cache[require.resolve("./commands")];
    delete require.cache[require.resolve("./internalCommands")];
    const commands = require("./commands").commands,
      internalCommands = require("./internalCommands").internalCommands;
    this.indexCommands(commands, internalCommands);
  }
}
