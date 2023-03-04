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

import { ClientMute } from "types/zoneserver";
import { DB_COLLECTIONS } from "utils/enums";
import { ZoneClient2016 as Client } from "../classes/zoneclient";
import { ZoneServer2016 } from "../zoneserver";

export class ChatManager {
  sendChatText(
    server: ZoneServer2016,
    client: Client,
    message: string,
    clearChat = false
  ) {
    if (clearChat) {
      for (let index = 0; index <= 6; index++) {
        server.sendData(client, "Chat.ChatText", {
          message: " ",
          unknownDword1: 0,
          color: [255, 255, 255, 0],
          unknownDword2: 13951728,
          unknownByte3: 0,
          unknownByte4: 1,
        });
      }
    }
    server.sendData(client, "Chat.ChatText", {
      message: message,
      unknownDword1: 0,
      color: [255, 255, 255, 0],
      unknownDword2: 13951728,
      unknownByte3: 0,
      unknownByte4: 1,
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
        unknownByte4: 1,
      }
    );
  }

  sendChatToAllWithRadio(
    server: ZoneServer2016,
    client: Client,
    message: string
  ) {
    for (const a in server._clients) {
      const c = server._clients[a];
      if (c.radio) {
        server.sendData(c, "Chat.ChatText", {
          message: `[RADIO: ${client.character.name}]: ${message}`,
          unknownDword1: 0,
          color: [255, 255, 255, 0],
          unknownDword2: 13951728,
          unknownByte3: 0,
          unknownByte4: 1,
        });
      }
    }
  }
  sendPlayerNotFound(
    server: ZoneServer2016,
    client: Client,
    inputString: string,
    possibleClient: string
  ) {
    server.sendChatText(
      client,
      `Could not find player "${inputString.toLowerCase()}", did you mean "${possibleClient}"?`
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
      name: client.character.name || "",
      muteReason: reason ? reason : "no reason",
      loginSessionId: client.loginSessionId,
      adminName: adminName ? adminName : "",
      expirationDate: 0,
      active: true,
      unmuteAdminName: "",
    };
    if (timestamp) {
      object.expirationDate = timestamp;
    }
    server._db?.collection(DB_COLLECTIONS.MUTED).insertOne(object);
    if (timestamp) {
      server.sendChatText(
        client,
        reason
          ? `You have been muted until: ${server.getDateString(
              timestamp
            )}. Reason: ${reason}`
          : `You have been muted until: ${server.getDateString(timestamp)}`
      );
      server.sendChatTextToAllOthers(
        client,
        reason
          ? `${
              client.character.name
            } has been muted until: ${server.getDateString(
              timestamp
            )}. Reason: ${reason}`
          : `${
              client.character.name
            } has been muted until: ${server.getDateString(timestamp)}`
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
}
