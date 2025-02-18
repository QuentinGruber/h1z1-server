// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2024 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

import { ZoneServer2016 } from "../zoneserver";
import { ZoneClient2016 as Client } from "../classes/zoneclient";
import { DB_COLLECTIONS } from "../../../utils/enums";

export class ClanManager {
  async handleClanCommand(
    server: ZoneServer2016,
    client: Client,
    args: Array<string>
  ) {
    if (args.length === 0) {
      server.sendChatText(
        client,
        "Usage: /clan <create|join|accept|yes|decline|no|leave|disband|cancel|test> [arguments]"
      );
      return;
    }

    const subCommand = args[0].toLowerCase();
    const clansCollection = server._db?.collection(DB_COLLECTIONS.CLANS);

    // In-memory join requests with expiration
    if (!server._joinRequests) {
      server._joinRequests = new Map();
    }
    const joinRequests = server._joinRequests;

    const currentClan = await server.getPlayerClan(
      client.character.characterId
    );

    const isOwner =
      currentClan?.owner.includes(client.character.characterId) ?? false;

    switch (subCommand) {
      case "create":
        if (args.length < 2) {
          server.sendChatText(client, "Usage: /clan create <tag>");
          return;
        }
        const createTag = args[1];

        if (createTag.length < 2 || createTag.length > 5) {
          server.sendChatText(
            client,
            "Clan tag must be between 2 and 5 characters."
          );
          return;
        }

        // Check if the player is already in a clan
        const existingClanCreate = await server.getPlayerClan(
          client.character.characterId
        );
        if (existingClanCreate) {
          server.sendChatText(
            client,
            "You are already in a clan. Leave your current clan before creating a new one."
          );
          return;
        }

        // Create the new clan
        await clansCollection.insertOne({
          tag: createTag,
          owner: client.character.characterId,
          members: [client.character.characterId]
        });
        server.sendChatText(client, `Clan ${createTag} created successfully.`);
        break;

      case "join":
        if (args.length < 2) {
          server.sendChatText(client, "Usage: /clan join <tag>");
          return;
        }
        const joinTag = args[1];

        // Check if the player is already in a clan
        const existingClanJoin = await server.getPlayerClan(
          client.character.characterId
        );
        if (existingClanJoin) {
          server.sendChatText(
            client,
            "You are already in a clan. Leave your current clan before requesting to join a new one."
          );
          return;
        }

        // Check if the clan exists
        const targetClan = await clansCollection.findOne({ tag: joinTag });
        if (!targetClan) {
          server.sendChatText(client, `Clan ${joinTag} does not exist.`);
          return;
        }

        // Check if the client has already sent a join request
        if (joinRequests.has(client.character.characterId)) {
          server.sendChatText(
            client,
            "You have already sent a join request. Please wait for it to be processed."
          );
          return;
        }

        // Add a join request to in-memory storage
        joinRequests.set(client.character.characterId, {
          clanTag: joinTag,
          characterId: client.character.characterId,
          characterName: client.character.name,
          timestamp: Date.now()
        });

        // Notify the clan owner
        const ownerClient = server.getClientByCharId(targetClan.owner);
        if (ownerClient) {
          server.sendChatText(
            ownerClient,
            `${client.character.name} has requested to join your clan (${joinTag}). Use /clan accept <name> or /clan yes <name> to accept.`
          );
        }

        server.sendChatText(
          client,
          `Your request to join clan ${joinTag} has been sent. It will expire in 2 minutes.`
        );

        // Schedule request removal after 2 minutes
        setTimeout(
          () => {
            if (
              joinRequests.get(client.character.characterId)?.clanTag ===
              joinTag
            ) {
              joinRequests.delete(client.character.characterId);
              server.sendChatText(
                client,
                `Your join request to clan ${joinTag} has expired.`
              );
            }
          },
          2 * 60 * 1000
        );

        break;

      case "accept":
      case "yes":
        if (args.length < 2) {
          server.sendChatText(
            client,
            "Usage: /clan accept <name> or /clan yes <name>"
          );
          return;
        }

        if (!isOwner) {
          server.sendChatText(
            client,
            "You are not the owner of the clan. Only the owner can accept members."
          );
          return;
        }

        const acceptName = args[1];
        const joinRequest = Array.from(joinRequests.values()).find(
          (request: any) =>
            request.clanTag === currentClan?.tag &&
            request.characterName === acceptName
        );

        if (!joinRequest) {
          server.sendChatText(
            client,
            `No valid join request from ${acceptName} found for your clan.`
          );
          return;
        }

        // Add the player to the clan
        await clansCollection.updateOne(
          { tag: currentClan?.tag ?? "" },
          { $addToSet: { members: joinRequest.characterId } }
        );

        // Remove the join request from memory
        joinRequests.delete(joinRequest.characterId);

        // Notify the new member
        const newMemberClient = server.getClientByCharId(
          joinRequest.characterId
        );
        if (newMemberClient) {
          server.sendChatText(
            newMemberClient,
            `Your request to join clan ${currentClan?.tag ?? ""} has been accepted.`
          );
        }

        server.sendChatText(
          client,
          `${acceptName} has been added to your clan.`
        );
        break;

      case "decline":
      case "no":
        if (args.length < 2) {
          server.sendChatText(
            client,
            "Usage: /clan decline <name> or /clan no <name>"
          );
          return;
        }

        if (!isOwner) {
          server.sendChatText(
            client,
            "You are not the owner of the clan. Only the owner can decline members."
          );
          return;
        }

        const declineName = args[1];
        const declineRequest = Array.from(joinRequests.values()).find(
          (request: any) =>
            request.clanTag === currentClan?.tag &&
            request.characterName === declineName
        );

        if (!declineRequest) {
          server.sendChatText(
            client,
            `No valid join request from ${declineName} found for your clan.`
          );
          return;
        }

        // Remove the join request from memory
        joinRequests.delete(declineRequest.characterId);

        // Notify the declined member
        const declinedMemberClient = server.getClientByCharId(
          declineRequest.characterId
        );
        if (declinedMemberClient) {
          server.sendChatText(
            declinedMemberClient,
            `Your request to join clan ${currentClan?.tag ?? ""} has been declined.`
          );
        }

        server.sendChatText(
          client,
          `${declineName}'s request to join your clan has been declined.`
        );
        break;

      case "cancel":
        // Check if the client has a pending join request
        if (!joinRequests.has(client.character.characterId)) {
          server.sendChatText(
            client,
            "You have no pending join request to cancel."
          );
          return;
        }

        // Remove the join request from memory
        joinRequests.delete(client.character.characterId);

        server.sendChatText(client, "Your join request has been cancelled.");
        break;

      case "leave":
        if (isOwner) {
          // Owner cannot leave the clan without disbanding it
          server.sendChatText(
            client,
            "You are the owner of the clan. Use /clan disband to disband the clan before leaving."
          );
          return;
        }
        // If not the owner, simply leave the clan
        await clansCollection.updateOne(
          { tag: currentClan?.tag ?? "" },
          { $pull: { members: client.character.characterId } as any }
        );
        server.sendChatText(client, "You have left the clan successfully.");
        break;

      case "disband":
        if (!isOwner) {
          server.sendChatText(
            client,
            "You are not the owner of the clan. Only the owner can disband the clan."
          );
          return;
        }
        // Delete the clan regardless of the number of members
        await clansCollection.deleteOne({
          owner: client.character.characterId
        });

        server.sendChatText(client, "Clan disbanded successfully.");
        break;
      default:
        server.sendChatText(
          client,
          "Unknown subcommand. Usage: /clan <create|join|accept|yes|decline|no|leave|disband|cancel|test> [arguments]"
        );
        break;
    }
  }
}
