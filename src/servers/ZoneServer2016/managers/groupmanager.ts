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

enum GroupErrors {
  INVALID = "GroupIsInvalid",
  INVALID_MEMBER = "GroupMemberIsInvalid"
}

export class GroupManager {
  nextGroupId = 1;
  groups: { [groupId: number]: Group } = {};
  pendingInvites: { [characterId: string]: number } = {};

  sendGroupError(server: ZoneServer2016, client: Client, error: GroupErrors) {
    server.sendChatText(client, `[GroupError] ${error}`);
  }

  sendDataToAllOthersInGroup(
    server: ZoneServer2016,
    excludedClient: Client,
    groupId: number,
    packetName: h1z1PacketsType2016,
    obj: zone2016packets
  ) {
    if (!groupId) return;
    const group = this.groups[groupId];
    if (!group) return;
    for (const a of group.members) {
      const client = server.getClientByCharId(a);
      if (
        !client ||
        !client.spawnedEntities.includes(excludedClient.character) ||
        client == excludedClient
      )
        continue;
      server.sendData(client, packetName, obj);
    }
  }

  /**
   * Removes other group member's outlines for the given client
   * @param server
   * @param client
   * @param group
   */
  removeGroupCharacterOutlines(
    server: ZoneServer2016,
    client: Client,
    group: Group
  ) {
    for (const a of group.members) {
      const target = server.getClientByCharId(a);
      if (
        !target ||
        !client.spawnedEntities.includes(target.character) ||
        client == target
      )
        continue;
      server.sendData(
        client,
        "Equipment.SetCharacterEquipment",
        target.character.pGetEquipment()
      );
    }
  }

  removeGroupOutlinesForCharacter(
    server: ZoneServer2016,
    target: Client,
    group: Group
  ) {
    for (const a of group.members) {
      const client = server.getClientByCharId(a);
      if (!client || client == target) continue;
      server.sendData(
        client,
        "Equipment.SetCharacterEquipment",
        target.character.pGetEquipment()
      );
    }
  }

  sendGroupOutlineUpdates(server: ZoneServer2016, group: Group) {
    for (const a of group.members) {
      const client = server.getClientByCharId(a);
      if (!client) continue;
      for (const a of group.members) {
        const target = server.getClientByCharId(a);
        if (
          !target ||
          !client.spawnedEntities.includes(target.character) ||
          client == target
        )
          continue;
        server.sendData(
          client,
          "Equipment.SetCharacterEquipment",
          target.character.pGetEquipment(group.groupId)
        );
      }
    }
  }

  sendAlertToGroup(server: ZoneServer2016, groupId: number, message: string) {
    if (!this.groups[groupId] || message == "") return;

    for (const characterId of this.groups[groupId].members) {
      const client = server.getClientByCharId(characterId);
      if (!client) continue;
      server.sendAlert(client, message);
    }
  }

  sendAlertToAllOthersInGroup(
    server: ZoneServer2016,
    excludedClient: Client,
    groupId: number,
    message: string
  ) {
    if (!this.groups[groupId] || message == "") return;

    for (const characterId of this.groups[groupId].members) {
      const client = server.getClientByCharId(characterId);
      if (!client || client == excludedClient) continue;
      server.sendAlert(client, message);
    }
  }

  createGroup(server: ZoneServer2016, leader: Client) {
    const groupId = this.nextGroupId;
    this.groups[groupId] = {
      groupId: groupId,
      leader: leader.character.characterId,
      members: [leader.character.characterId]
    };
    leader.character.groupId = groupId;

    this.nextGroupId++;
    server.sendChatText(
      leader,
      "Group created. Use /group for a list of commands.",
      true
    );
  }

  disbandGroup(server: ZoneServer2016, groupId: number) {
    const group = this.groups[groupId];
    if (!group) {
      return;
    }

    this.sendAlertToGroup(server, groupId, "Group has been disbanded!");
    for (const characterId of this.groups[groupId].members) {
      const client = server.getClientByCharId(characterId);
      if (!client) continue;
      this.removeGroupMember(server, client, group, true);
    }

    delete this.groups[groupId];
  }

  sendGroupInvite(server: ZoneServer2016, source: Client, target: Client) {
    if (this.pendingInvites[target.character.characterId]) {
      server.sendAlert(
        source,
        `${target.character.name} already has a pending invite!`
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

    const group = this.groups[source.character.groupId];
    if (group && group.leader != source.character.characterId) {
      server.sendAlert(source, "You are not the group leader!");
      return;
    }

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

  handleGroupJoin(
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

    let group = this.groups[source.character.groupId];
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
      this.createGroup(server, source);
    }
    group = this.groups[source.character.groupId];
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

    server.sendAlert(target, "Group joined.");
    delete this.pendingInvites[target.character.characterId];

    this.sendGroupOutlineUpdates(server, group);
  }

  handlePlayerDisconnect(server: ZoneServer2016, client: Client) {
    delete this.pendingInvites[client.character.characterId];

    const groupId = client.character.groupId,
      group = this.groups[groupId];
    if (!group) return;

    this.handleGroupLeave(server, client, group);
  }

  removeGroupMember(
    server: ZoneServer2016,
    client: Client,
    group: Group,
    disband = false
  ) {
    if (!group.members.includes(client.character.characterId)) {
      this.sendGroupError(server, client, GroupErrors.INVALID_MEMBER);
      return;
    }

    client.character.groupId = 0;

    this.removeGroupCharacterOutlines(server, client, group);
    this.removeGroupOutlinesForCharacter(server, client, group);
    //this.sendGroupOutlineUpdates(server, group);

    const idx = group.members.indexOf(client.character.characterId);
    group.members.splice(idx, 1);

    // disband single member / empty group
    if (!disband && group.members.length <= 1) {
      this.disbandGroup(server, group.groupId);
    }

    // re-assign leader if 2+ remaining members
    if (group.leader == client.character.characterId && !disband) {
      const leader = Object.values(group.members)[0],
        leaderClient = server.getClientByCharId(leader);
      group.leader = leader;
      if (leaderClient) {
        this.sendAlertToAllOthersInGroup(
          server,
          leaderClient,
          group.groupId,
          `${leaderClient.character.name} has been made the group leader!`
        );
        server.sendAlert(leaderClient, "You have been made the group leader!");
      }
    }
  }

  handleGroupKick(
    server: ZoneServer2016,
    client: Client,
    target: Client,
    group: Group
  ) {
    if (group.leader != client.character.characterId) {
      server.sendChatText(client, "You are not the group leader.");
      return;
    }

    if (!group.members.includes(target.character.characterId)) {
      server.sendChatText(
        client,
        `${target.character.characterId} is not a member of your group.`
      );
      return;
    }

    server.sendAlert(target, "You have been kicked from the group!");
    this.sendAlertToGroup(
      server,
      client.character.groupId,
      `${target.character.name} has been kicked from the group!`
    );
    this.removeGroupMember(server, target, group);
  }

  handleGroupLeave(server: ZoneServer2016, client: Client, group: Group) {
    server.sendAlert(client, "You have left the group.");
    this.sendAlertToAllOthersInGroup(
      server,
      client,
      group.groupId,
      `${client.character.name} has left the group.`
    );
    this.removeGroupMember(server, client, group);
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

    this.disbandGroup(server, group.groupId);
  }

  handleGroupCommand(
    server: ZoneServer2016,
    client: Client,
    args: Array<string>
  ) {
    if (!args[0]) {
      server.sendChatText(
        client,
        "Missing command, valid commands are: invite, kick, leave, view, disband"
      );
      return;
    }
    const groupId = client.character.groupId,
      group = this.groups[groupId];
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

        this.handleGroupKick(server, client, target, group);
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
