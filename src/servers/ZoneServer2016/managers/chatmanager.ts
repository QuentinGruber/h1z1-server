// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2025 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

import { ClientMute } from "types/zoneserver";
import { DB_COLLECTIONS } from "../../../utils/enums";
import { ZoneClient2016 as Client } from "../classes/zoneclient";
import { ZoneServer2016 } from "../zoneserver";
import { getDateString } from "../../../utils/utils";
const blacklist = require("../../../..//data/2016/sampleData/blacklisted_words.json");

export class ChatManager {
  sendChatText(
    server: ZoneServer2016,
    client: Client,
    message: string,
    clearChat = false
  ) {
    if (clearChat) {
      server.sendData(client, "Chat.ChatText", {
        message: `\n\n\n\n\n\n`,
        unknownDword1: 0,
        color: [255, 255, 255, 0],
        unknownDword2: 13951728,
        unknownByte3: 0,
        unknownByte4: 1
      });
    }
    server.sendData(client, "Chat.ChatText", {
      message: message,
      unknownDword1: 0,
      color: [255, 255, 255, 0],
      unknownDword2: 13951728,
      unknownByte3: 0,
      unknownByte4: 1
    });
  }
  sendChatTextToAllOthers(
    server: ZoneServer2016,
    client: Client,
    message: string,
    clearChat = false
  ) {
    for (const a in server._clients) {
      if (client != server._clients[a]) {
        this.sendChatText(server, server._clients[a], message, clearChat);
      }
    }
  }
  sendChatTextToAdmins(
    server: ZoneServer2016,
    message: string,
    clearChat = false
  ) {
    for (const a in server._clients) {
      if (server._clients[a].isAdmin) {
        this.sendChatText(server, server._clients[a], message, clearChat);
      }
    }
  }
  sendGlobalChatText(
    server: ZoneServer2016,
    message: string,
    clearChat = false
  ) {
    for (const a in server._clients) {
      this.sendChatText(server, server._clients[a], message, clearChat);
    }
  }
  sendChatToAllInRange(
    server: ZoneServer2016,
    client: Client,
    message: string,
    range: number
  ) {
    const substitutions: Record<string, string> = {
      "@": "a",
      "4": "a",
      "3": "e",
      "1": "i",
      "!": "i",
      "0": "o",
      $: "s"
    };
    const sanitizedMessage: string = message
      .toLowerCase()
      .replace(/[@431!0$]/g, (match) => substitutions[match] || match);
    const detectedWords: string[] = blacklist.filter((word: string) => {
      const regex: RegExp = new RegExp(
        `\\b${word.replace(/[@431!0$]/g, (match) => substitutions[match] || match)}\\b`,
        "i"
      );
      return regex.test(sanitizedMessage);
    });

    if (detectedWords.length > 0) {
      message = "I love you";
    }

    server.sendDataToAllInRange(
      range,
      client.character.state.position,
      "Chat.ChatText",
      {
        message: `${client.character.name}: ${message}`,
        unknownDword1: 0,
        color: [255, 255, 255, 0],
        unknownDword2: 13951728,
        unknownByte3: 0,
        unknownByte4: 1
      }
    );
  }

  muteClient(
    server: ZoneServer2016,
    client: Client,
    reason: string,
    adminName: string,
    timestamp: number
  ) {
    const object: ClientMute = {
      name: client.character.name.toLowerCase() || "",
      muteReason: reason ? reason : "no reason",
      loginSessionId: client.loginSessionId,
      adminName: adminName ? adminName : "",
      expirationDate: 0,
      active: true,
      unmuteAdminName: ""
    };
    if (timestamp) {
      object.expirationDate = timestamp;
    }
    server._db?.collection(DB_COLLECTIONS.MUTED).insertOne(object);
    if (timestamp) {
      server.sendChatText(
        client,
        reason
          ? `You have been muted until: ${getDateString(
              timestamp
            )}. Reason: ${reason}`
          : `You have been muted until: ${getDateString(timestamp)}`
      );
      server.sendChatTextToAllOthers(
        client,
        reason
          ? `${client.character.name} has been muted until: ${getDateString(
              timestamp
            )}. Reason: ${reason}`
          : `${
              client.character.name
            } has been muted until: ${getDateString(timestamp)}`
      );
    } else {
      server.sendChatText(
        client,
        reason
          ? `You have been permanently muted. Reason: ${reason}`
          : "You have been permanently muted."
      );
      server.sendChatTextToAllOthers(
        client,
        reason
          ? `${client.character.name} has been muted! Reason: ${reason}`
          : `${client.character.name} has been muted!`
      );
    }
  }

  async checkMute(server: ZoneServer2016, client: Client): Promise<boolean> {
    const mutedClient = (await server._db
      ?.collection(DB_COLLECTIONS.MUTED)
      .findOne({
        name: client.character.name.toLowerCase(),
        active: true
      })) as unknown as ClientMute;
    if (mutedClient) {
      if (
        mutedClient.expirationDate &&
        mutedClient.expirationDate <= Date.now()
      ) {
        await server._db
          ?.collection(DB_COLLECTIONS.MUTED)
          .findOneAndUpdate(
            { name: client.character.name.toLowerCase(), active: true },
            { $set: { active: false, unmuteAdminName: "SERVER" } }
          );
        server.sendChatText(client, "You have been unmuted!");
        return false;
      }
      return true;
    }
    return false;
  }
}
