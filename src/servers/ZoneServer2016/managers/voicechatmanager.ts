// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2026 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================
import { ZoneClient2016 as Client } from "../classes/zoneclient";
import { ZoneServer2016 } from "../zoneserver";

export class VoiceChatManager {
  /* MANAGED BY CONFIGMANAGER */
  useVoiceChatV2!: boolean;
  joinVoiceChatOnConnect!: boolean;
  serverAccessToken!: string;

  sendVoiceChatError(server: ZoneServer2016, client: Client, error: string) {
    server.sendChatText(client, `[Voicechat Error] ${error}`);
  }
  sendVoiceChatState(
    server: ZoneServer2016,
    client: Client,
    instance: number = 1
  ) {
    server.sendData(client, "H1emu.VoiceState", {
      message: JSON.stringify({
        name: client.character.name,
        world: server._worldId,
        instance: instance // somebody else can implement radio logic using this. It's implemented serverside already
        // +10 to make it a radio channel, so radio chan 1 is instance: 11, chan 2 instance 12 etc etc
      })
    });
    server.sendData(client, "UpdateWeatherData", server.weatherManager.weather);
  }
  handleVoiceChatInit(server: ZoneServer2016, client: Client) {
    if (!this.useVoiceChatV2) {
      server.sendChatText(client, `voicechat is disabled in the configuration`);
    }
    server.sendChatText(client, `connecting to voice chat`);
    if (!client.isInVoiceChat) {
      server.sendData(client, "H1emu.VoiceInit", {});
      setTimeout(() => {
        this.sendVoiceChatState(server, client);
        client.voiceChatTimer = setInterval(() => {
          this.sendVoiceChatState(server, client);
        }, 20000);
        client.isInVoiceChat = true;
      }, 4000);
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
