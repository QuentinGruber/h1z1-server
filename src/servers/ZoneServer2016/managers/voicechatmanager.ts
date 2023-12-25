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

import { h1z1PacketsType2016 } from "types/packets";
import { zone2016packets } from "types/zone2016packets";
import { Group } from "types/zoneserver";
import { ZoneClient2016 as Client } from "../classes/zoneclient";
import { ZoneServer2016 } from "../zoneserver";

export class VoiceChatManager {
  /* MANAGED BY CONFIGMANAGER */
  useVoiceChatV2!: boolean;
  joinVoiceChatOnConnect!: boolean;
  serverId!: number;
  serverAccessToken!: string;

  sendVoiceChatError(server: ZoneServer2016, client: Client, error: string) {
    server.sendChatText(client, `[Voicechat Error] ${error}`);
  }
  handleVoiceChatInit(server: ZoneServer2016, client: Client) {
    if (!this.useVoiceChatV2) {
      server.sendChatText(client, `voicechat is disabled in the configuration`);
    }
    server.sendChatText(client, `connecting to voice chat`);
    if (!client.isInVoiceChat) {
      server.sendData(client, "H1emu.VoiceInit", {});
      setTimeout(() => {
        client.voiceChatTimer = setInterval(() => {
          const { position, rotation, yaw } = client.character.state;

          server.sendData(client, "H1emu.VoiceState", {
            message: JSON.stringify({
              name: client.character.name,
              world: this.serverId,
              instance: 1, // somebody else can implement radio logic using this. It's implemented serverside already
              // +10 to make it a radio channel, so radio chan 1 is instance: 11, chan 2 instance 12 etc etc
              loc: [
                position[0].toFixed(2),
                position[1].toFixed(2),
                position[2].toFixed(2)
              ],
              heading: yaw.toFixed(2)
            })
          });
        }, 1000);
        client.isInVoiceChat = true;
      }, 2000);
    } else {
      server.sendChatText(
        client,
        `already initialized, please run /vc leave before retrying`
      );
    }
  }
  handleVoiceChatDisconnect(server: ZoneServer2016, client: Client) {
    server.sendChatText(client, `disconnecting from voicechat`);
    client.isInVoiceChat = false;
    //client.voiceChatTimer = null;
    clearInterval(client.voiceChatTimer);
  }

  handleVoiceChatCommand(
    server: ZoneServer2016,
    client: Client,
    args: Array<string>
  ) {
    if (!args[0]) {
      server.sendChatText(
        client,
        "Missing command, valid commands are: status, join, leave"
      );
      return;
    }
    if (args[0] == "leave" && !client.isInVoiceChat) {
      server.sendChatText(client, "You have already left.");
      return;
    }
    switch (args[0]) {
      case "status":
        server.sendChatText(
          client,
          `isInVoiceChat: ${client.isInVoiceChat ? "allegedly" : "no"}`
        );
        break;
      case "join":
        this.handleVoiceChatInit(server, client);
        break;
      case "leave":
        this.handleVoiceChatDisconnect(server, client);
        break;
      default:
        server.sendChatText(
          client,
          "Unknown command, valid commands are: status, join, leave"
        );
        break;
    }
  }
  handleVoiceChatAdminCommand(
    server: ZoneServer2016,
    client: Client,
    args: Array<string>
  ) {
    if (!args[0]) {
      server.sendChatText(
        client,
        "Missing command, valid commands are: status, list, mute, unmute"
      );
      return;
    }
    if (args[0] == "leave" && !client.isInVoiceChat) {
      server.sendChatText(client, "You have already left.");
      return;
    }
    switch (args[0]) {
      case "status":
        server.sendChatText(client, `not implemented yet`);
        break;
      case "list":
        server.sendChatText(client, `not implemented yet`);
        break;
      case "mute":
        server.sendChatText(client, `not implemented yet`);
        break;
      case "unmute":
        server.sendChatText(client, `not implemented yet`);
        break;
      default:
        server.sendChatText(
          client,
          "Unknown command, valid commands are: status, list, mute, unmute"
        );
        break;
    }
  }
}
