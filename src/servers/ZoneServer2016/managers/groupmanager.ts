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

import { h1z1PacketsType2016 } from "types/packets";
import { GroupUnknown12, zone2016packets } from "types/zone2016packets";
import { Group } from "types/zoneserver";
import { ZoneClient2016 as Client } from "../classes/zoneclient";
import { ZoneServer2016 } from "../zoneserver";
import { DB_COLLECTIONS } from "../../../utils/enums";

enum GroupErrors {
  INVALID = "GroupIsInvalid",
  INVALID_MEMBER = "GroupMemberIsInvalid"
}

export class GroupManager {
  /** "Limbo" for an invite that awaits acceptance or denial */
  pendingInvites: { [characterId: string]: number } = {};
  soloGroups: { [groupId: number]: Group } = {};
  groupSync: { [groupId: number]: number } = {};

  sendGroupError(server: ZoneServer2016, client: Client, error: GroupErrors) {
    server.sendChatText(client, `[GroupError] ${error}`);
  }

  async getGroupMembers(group: Group, server: ZoneServer2016) {
    const members = [];

    for (const [index, member] of Object.values(group.members).entries()) {
      let client = server.getClientByCharId(member);
      if (!client) {
        client = await server.getOfflineClientByCharId(member);
      }
      const character = client?.character;

      if (!client || !character) continue;

      members.push({
        characterId: member,
        inviteData: {
          characterId: member,
          identity: {
            characterFirstName: character?.name,
            unknownQword1: member
          }
        },
        unknownByte1: character.isAlive ? 0 : -1,
        position: character?.state.position,
        rotation: character?.state.rotation,
        memberId: index,
        unknownQword2: member
      });
    }
    return members;
  }

  async syncGroup(
    server: ZoneServer2016,
    groupId: number,
    forceSync: boolean = false
  ) {
    const group = await this.getGroup(server, groupId);
    if (!group) return;
    const now = Date.now();
    const lastSyncTime = this.groupSync[groupId];

    if (!lastSyncTime || lastSyncTime + 5000 <= now || forceSync) {
      this.groupSync[groupId] = now;

      const members = await this.getGroupMembers(group, server);
      const sendData = {
        unknownDword1: group.groupId,
        unknownData1: {
          groupId: group.groupId,
          characterId: group.leader
        },
        members
      };

      this.sendDataToGroup<GroupUnknown12>(
        server,
        group.groupId,
        "Group.Unknown12",
        sendData
      );
    }
  }

  async getGroup(
    server: ZoneServer2016,
    groupId: number
  ): Promise<Group | null> {
    return server._soloMode
      ? this.soloGroups[groupId]
      : await server._db
          .collection(DB_COLLECTIONS.GROUPS)
          .findOne<Group>({ serverId: server._worldId, groupId });
  }

  async getGroupId(
    server: ZoneServer2016,
    client: Client
  ): Promise<number | null> {
    if (server._soloMode) return null;

    const collection = server._db.collection(DB_COLLECTIONS.GROUPS);
    const result = await collection.findOne(
      { serverId: server._worldId, members: client.character.characterId },
      { projection: { groupId: 1, _id: 0 } }
    );
    return result ? result.groupId : null;
  }

  async deleteGroup(server: ZoneServer2016, groupId: number) {
    if (server._soloMode) {
      delete this.soloGroups[groupId];
    } else {
      await server._db
        .collection(DB_COLLECTIONS.GROUPS)
        .deleteOne({ serverId: server._worldId, groupId });
    }
  }

  async sendDataToAllOthersInGroup(
    server: ZoneServer2016,
    excludedClient: Client,
    groupId: number,
    packetName: h1z1PacketsType2016,
    obj: zone2016packets
  ) {
    if (!groupId) return;
    const group = await this.getGroup(server, groupId);
    if (!group) return;
    for (const a of group.members) {
      const client = server.getClientByCharId(a);
      if (
        !client ||
        !client.spawnedEntities.has(excludedClient.character) ||
        client == excludedClient
      )
        continue;
      server.sendData(client, packetName, obj);
    }
  }

  async sendDataToGroup<packet>(
    server: ZoneServer2016,
    groupId: number,
    packetName: h1z1PacketsType2016,
    obj: packet
  ) {
    if (!groupId) return;
    const group = await this.getGroup(server, groupId);
    if (!group) return;
    for (const a of group.members) {
      const client = server.getClientByCharId(a);
      if (!client) continue;
      server.sendData<packet>(client, packetName, obj);
    }
  }

  async sendAlertToGroup(
    server: ZoneServer2016,
    groupId: number,
    message: string
  ) {
    const group = await this.getGroup(server, groupId);
    if (!group || message == "") return;

    for (const characterId of group.members) {
      const client = server.getClientByCharId(characterId);
      if (!client) continue;
      server.sendAlert(client, message);
    }
  }

  async sendAlertToAllOthersInGroup(
    server: ZoneServer2016,
    excludedClient: Client,
    groupId: number,
    message: string
  ) {
    const group = await this.getGroup(server, groupId);
    if (!group) return;

    for (const characterId of group.members) {
      const client = server.getClientByCharId(characterId);
      if (!client || client == excludedClient) continue;
      server.sendAlert(client, message);
    }
  }

  async createGroup(server: ZoneServer2016, leader: Client) {
    const groupId: number = Math.floor(Math.random() * 4294967295); // MAX UINT32
    if (server._soloMode) {
      this.soloGroups[groupId] = {
        groupId: groupId,
        leader: leader.character.characterId,
        members: [leader.character.characterId]
      };
    } else {
      await server._db.collection(DB_COLLECTIONS.GROUPS).insertOne({
        serverId: server._worldId,
        groupId,
        leader: leader.character.characterId,
        members: [leader.character.characterId]
      });
    }
    leader.character.groupId = groupId;

    server.sendChatText(
      leader,
      "Group created. Use /group for a list of commands.",
      true
    );
  }

  async disbandGroup(server: ZoneServer2016, groupId: number) {
    const group = await this.getGroup(server, groupId);
    if (!group) {
      return;
    }

    this.sendAlertToGroup(server, groupId, "Group has been disbanded!");
    for (const characterId of group.members) {
      this.removeGroupMember(server, characterId, groupId, true);
    }

    this.deleteGroup(server, groupId);
  }

  async sendGroupInvite(
    server: ZoneServer2016,
    source: Client,
    target: Client
  ) {
    if (this.pendingInvites[target.character.characterId]) {
      server.sendAlert(
        source,
        `${target.character.name} already has a pending invite!`
      );
      return;
    }

    if (target.character.groupId != 0) {
      server.sendAlert(
        source,
        `${target.character.name} is already in a group!`
      );
      return;
    }

    if (source == target) {
      server.sendAlert(source, "You can't invite yourself to group!");
      return;
    }

    if (
      source.character.groupId &&
      source.character.groupId == target.character.groupId
    ) {
      server.sendAlert(
        source,
        `${target.character.name} is already in the group!`
      );
      return;
    }

    const group = await this.getGroup(server, source.character.groupId);
    if (group && group.members.length >= 12) {
      server.sendAlert(source, "Group limit reached");
      delete this.pendingInvites[target.character.characterId];
      return;
    }
    // if (group && group.leader != source.character.characterId) {
    //   server.sendAlert(source, "You are not the group leader!");
    //   return;
    // }

    this.pendingInvites[target.character.characterId] =
      source.character.groupId;

    server.sendData(target, "Group.Invite", {
      unknownDword1: 1, // should be 1
      unknownDword2: 5,
      unknownDword3: 5,
      inviteData: {
        sourceCharacter: {
          characterId: source.character.characterId,
          identity: {
            characterFirstName: source.character.name,
            characterName: source.character.name
          }
        },
        targetCharacter: {
          characterId: target.character.characterId,
          identity: {
            characterName: target.character.name
          }
        }
      }
    });
  }

  async handleGroupJoin(
    server: ZoneServer2016,
    source: Client,
    target: Client,
    joinState: boolean
  ) {
    const pendingInvite = this.pendingInvites[target.character.characterId];
    if (pendingInvite != source.character.groupId) {
      server.sendAlert(target, "You have no pending invites!");
      return;
    }

    let group = await this.getGroup(server, source.character.groupId);

    if (group && group.members.length >= 12) {
      server.sendAlert(target, "Group limit reached");
      delete this.pendingInvites[target.character.characterId];
      return;
    }

    if (group && source.character.characterId != group.leader) {
      return;
    }

    if (!joinState) {
      server.sendAlert(
        source,
        `${target.character.name} declined your invite.`
      );
      server.sendAlert(target, "Group invite declined.");
      delete this.pendingInvites[target.character.characterId];
      return;
    }
    if (!group) {
      await this.createGroup(server, source);
    }
    group = await this.getGroup(server, source.character.groupId);
    if (!group) {
      server.sendAlert(source, "FAILED TO CREATE GROUP - PLEASE REPORT");
      return;
    }

    this.sendAlertToGroup(
      server,
      source.character.groupId,
      `${target.character.name} joined the group.`
    );
    target.character.groupId = source.character.groupId;
    group.members.push(target.character.characterId);

    if (!server._soloMode) {
      await server._db.collection(DB_COLLECTIONS.GROUPS).updateOne(
        {
          serverId: server._worldId,
          groupId: source.character.groupId
        },
        { $set: { members: group.members } }
      );
    } else {
      this.soloGroups[group.groupId] = group;
    }

    server.sendAlert(target, "Group joined.");
    delete this.pendingInvites[target.character.characterId];

    const leaderClient = server.getClientByCharId(group.leader);
    if (!leaderClient) return;
    const members = await this.getGroupMembers(group, server);
    this.sendDataToGroup(server, group.groupId, "Group.Unknown12", {
      unknownDword1: group.groupId,
      unknownData1: {
        groupId: group.groupId,
        characterId: leaderClient.character.characterId
      },
      unknownString1: leaderClient.character.name,
      members
    });
  }

  async handlePlayerDisconnect(server: ZoneServer2016, client: Client) {
    delete this.pendingInvites[client.character.characterId];
    const groupId = client.character.groupId;
    this.sendAlertToAllOthersInGroup(
      server,
      client,
      groupId,
      `${client.character.name} has disconnected from the game.`
    );
  }

  async removeGroupMember(
    server: ZoneServer2016,
    characterId: string,
    groupId: number,
    disband = false
  ) {
    const client: Client | undefined = server.getClientByCharId(characterId),
      group: Group | null = await this.getGroup(server, groupId);

    if (!group) return;

    if (!group.members.includes(characterId)) {
      if (client) {
        this.sendGroupError(server, client, GroupErrors.INVALID_MEMBER);
      }
      return;
    }

    if (client) {
      client.character.groupId = 0;
      server.sendData(client, "Group.RemoveGroup", {
        unknownDword1: group.groupId,
        groupId: group.groupId
      });
    }
    if (client) {
      for (const a of group.members) {
        setTimeout(() => {
          const groupClient = server.getClientByCharId(a);
          if (groupClient) {
            if (client.spawnedEntities.has(groupClient.character)) {
              server.sendData(client, "Character.RemovePlayer", {
                characterId: groupClient.character.characterId
              });
              setTimeout(() => {
                server.sendData(
                  client,
                  "AddLightweightPc",
                  groupClient.character.pGetLightweightPC(server, groupClient)
                );
              }, 200);
            }
            if (groupClient.spawnedEntities.has(client.character)) {
              server.sendData(groupClient, "Character.RemovePlayer", {
                characterId: characterId
              });
              setTimeout(() => {
                server.sendData(
                  groupClient,
                  "AddLightweightPc",
                  client.character.pGetLightweightPC(server, client)
                );
              }, 200);
            }
          }
        }, 50);
      }
    }
    const idx = group.members.indexOf(characterId);
    group.members.splice(idx, 1);

    this.sendDataToGroup(server, group.groupId, "Group.RemoveGroup", {
      unknownDword1: group.groupId,
      groupId: group.groupId
    });

    if (!server._soloMode) {
      await server._db.collection(DB_COLLECTIONS.GROUPS).updateOne(
        {
          serverId: server._worldId,
          groupId: group.groupId
        },
        { $set: { members: group.members } }
      );
      await server._db.collection(DB_COLLECTIONS.CHARACTERS).updateOne(
        {
          serverId: server._worldId,
          characterId: characterId
        },
        { $set: { groupId: 0 } }
      );
    }

    // disband single member / empty group
    if (!disband && group.members.length <= 1) {
      await this.disbandGroup(server, group.groupId);
    }

    // re-assign leader if 2+ remaining members
    if (group.leader == characterId && !disband) {
      const leader = Object.values(group.members)[0],
        leaderClient = server.getClientByCharId(leader);

      if (!server._soloMode) {
        await server._db.collection(DB_COLLECTIONS.GROUPS).updateOne(
          {
            serverId: server._worldId,
            groupId: group.groupId
          },
          { $set: { leader: leader } }
        );
      }

      group.leader = leader;
      if (leaderClient) {
        this.sendAlertToAllOthersInGroup(
          server,
          leaderClient,
          group.groupId,
          `${leaderClient.character.name} has been made the group leader!`
        );
        server.sendAlert(leaderClient, "You have been made the group leader!");
        this.sendDataToGroup(server, group.groupId, "Group.SetGroupOwner", {
          characterId: leaderClient.character.characterId,
          groupId: group.groupId
        });
      }
    }
    this.syncGroup(server, group.groupId, true);
  }

  handleGroupKick(
    server: ZoneServer2016,
    sourceCharacterId: string,
    targetCharacterId: string,
    group: Group
  ) {
    const sourceClient: Client | undefined =
        server.getClientByCharId(sourceCharacterId),
      targetClient: Client | undefined =
        server.getClientByCharId(targetCharacterId);

    if (group.leader != sourceCharacterId) {
      if (sourceClient) {
        server.sendChatText(sourceClient, "You are not the group leader.");
      }
      return;
    }

    if (!group.members.includes(targetCharacterId)) {
      if (sourceClient && targetClient) {
        server.sendChatText(
          sourceClient,
          `${targetClient.character?.name} is not a member of your group.`
        );
      }
      return;
    }
    if (targetClient) {
      server.sendAlert(targetClient, "You have been kicked from the group!");
      this.sendAlertToGroup(
        server,
        group.groupId,
        `${targetClient.character?.name} has been kicked from the group!`
      );
    }
    this.removeGroupMember(server, targetCharacterId, group.groupId);
  }

  handleGroupLeave(server: ZoneServer2016, client: Client, group: Group) {
    server.sendAlert(client, "You have left the group.");
    this.sendAlertToAllOthersInGroup(
      server,
      client,
      group.groupId,
      `${client.character.name} has left the group.`
    );
    this.removeGroupMember(server, client.character.characterId, group.groupId);
  }

  handleGroupLeader(
    server: ZoneServer2016,
    client: Client,
    group: Group,
    argleader: string
  ) {
    const newleader = argleader;

    if (group.leader == client.character.characterId) {
      const newLeaderClient = server.getClientByNameOrLoginSession(newleader);
      if (!newLeaderClient || !(newLeaderClient instanceof Client)) {
        server.sendChatText(client, "New leader not found.");
        return;
      }

      group.leader = newLeaderClient.character.characterId;

      // Update the database
      if (!server._soloMode) {
        server._db.collection(DB_COLLECTIONS.GROUPS).updateOne(
          {
            serverId: server._worldId,
            groupId: group.groupId
          },
          { $set: { leader: newLeaderClient.character.characterId } }
        );
      }

      // Notify the new leader and the group
      server.sendAlert(newLeaderClient, "You have been made the group leader!");
      this.sendAlertToAllOthersInGroup(
        server,
        newLeaderClient,
        group.groupId,
        `${newLeaderClient.character.name} has been made the group leader!`
      );

      // Update the group UI
      this.sendDataToGroup(server, group.groupId, "Group.SetGroupOwner", {
        characterId: newLeaderClient.character.characterId,
        groupId: group.groupId
      });

      // Sync the group
      this.syncGroup(server, group.groupId, true);
    } else {
      server.sendChatText(client, "You are not the group leader.");
    }
  }

  handleGroupView(server: ZoneServer2016, client: Client, group: Group) {
    server.sendConsoleText(
      client,
      `----------Group Info----------\n| Member Count: ${group.members.length} |`,
      true,
      true
    );
    server.sendConsoleText(
      client,
      `| Members |\n- ${group.members
        .map((characterId) => {
          const client = server.getClientByCharId(characterId);
          if (!client) {
            return "UNDEFINED - REPORT THIS!";
          }
          return group.leader == client.character.characterId
            ? `*${client.character.name}`
            : client.character.name;
        })
        .join("\n- ")}`
    );
  }

  handleGroupDisband(server: ZoneServer2016, client: Client, group: Group) {
    if (group.leader != client.character.characterId) {
      server.sendChatText(client, "You are not the group leader.");
      return;
    }

    this.removeGroupMember(
      server,
      client.character.characterId,
      group.groupId,
      true
    );
    this.disbandGroup(server, group.groupId);
    // For some reason the leader isn't a member anymore while disbanding. So this is a temporary workaround to fix the group UI.
    client.character.groupId = 0;
    server.sendData(client, "Group.RemoveGroup", {
      unknownDword1: group.groupId,
      groupId: group.groupId
    });
  }

  async handleGroupCommand(
    server: ZoneServer2016,
    client: Client,
    args: Array<string | undefined>
  ) {
    if (!args[0]) {
      server.sendChatText(
        client,
        "Missing command, valid commands are: invite, kick, leave, view, disband"
      );
      return;
    }
    const groupId = client.character.groupId;
    const group = await this.getGroup(server, groupId);
    if (!group) return;
    if (args[0] != "invite" && (!groupId || !group)) {
      server.sendChatText(client, "You are not in a group!");
      return;
    }
    switch (args[0]) {
      case "kick":
        if (!args[1]) {
          server.sendChatText(
            client,
            "You must specify a player to be kicked! Usage: /group kick {playername}"
          );
          return;
        }
        const target = server.getClientByNameOrLoginSession(args[1].toString());
        if (server.playerNotFound(client, args[1].toString(), target)) {
          return;
        }
        if (!target || !(target instanceof Client)) {
          server.sendChatText(client, "Client not found.");
          return;
        }

        this.handleGroupKick(
          server,
          client.character.characterId,
          target.character.characterId,
          group
        );
        break;
      case "leader":
        if (!args[1]) {
          server.sendChatText(
            client,
            "You must specify a new leader!  Usage: /group leader {playername}"
          );
          return;
        }
        this.handleGroupLeader(server, client, group, args[1]);
        break;
      case "leave":
        this.handleGroupLeave(server, client, group);
        break;
      case "view":
        this.handleGroupView(server, client, group);
        break;
      case "disband":
        this.handleGroupDisband(server, client, group);
        break;
      case "invite":
        if (!args[1]) {
          server.sendChatText(
            client,
            "You must specify a player to be invited! Usage: /group invite {playername}"
          );
          return;
        }
        const targetClient = server.getClientByNameOrLoginSession(
          args[1].toString()
        );
        if (server.playerNotFound(client, args[1].toString(), targetClient)) {
          return;
        }
        if (!targetClient || !(targetClient instanceof Client)) {
          server.sendChatText(client, "Client not found.");
          return;
        }
        this.sendGroupInvite(server, client, targetClient);
        break;
      default:
        server.sendChatText(
          client,
          "Unknown command, valid commands are: invite, kick, leave, view, disband"
        );
        break;
    }
  }
}
