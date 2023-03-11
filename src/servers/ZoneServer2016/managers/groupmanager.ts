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

import { Group } from "types/zoneserver";
import { ZoneClient2016 as Client} from "../classes/zoneclient";
import { ZoneServer2016 } from "../zoneserver";

export class GroupManager {
  nextGroupId = 1;
  groups: {[groupId: number]: Group} = {};
  constructor() {

  }

  createGroup(server: ZoneServer2016, leader: Client, member: Client) {
    this.groups[this.nextGroupId] = {
      groupId: this.nextGroupId,
      leader: leader.character.characterId,
      members: [member.character.characterId]
    }
    this.nextGroupId++;
    server.sendChatText(leader, "Group created!", true);
  }

  sendAlertToGroup(server: ZoneServer2016, groupId: number, message: string) {
    if(!this.groups[groupId]) return;

    for(const characterId of this.groups[groupId].members) {
      const client = server.getClientByCharId(characterId);
      if(!client) continue;
      server.sendAlert(client, message);
    }
  }

  sendGroupInvite(server: ZoneServer2016, source: Client, target: Client) {
    server.sendData(target, "Group.Invite", {
      unknownDword1: 1, // should be 1
      unknownDword2: 5,
      unknownDword3: 5,
      inviteData: {
        sourceCharacter: {
          characterId: source.character.characterId,
          identity: {
            characterFirstName: source.character.name,
            characterName: source.character.name,
          },
        },
        targetCharacter: {
          characterId: target.character.characterId,
          identity: {
            characterName: target.character.name,
          },
        },
      },
    });
  }

  handleGroupJoin(server: ZoneServer2016, source: Client, target: Client, joinState: Boolean) {
    if(!joinState) {
      server.sendAlert(source, `${target.character.name} declined your invite!`);
      server.sendAlert(target, "Group invite declined!");
      return;
    }
    this.sendAlertToGroup(server, source.character.groupId, `${target.character.name} joined the group!`)
    server.sendAlert(target, "Group joined!");

    /*
    server.sendData(target, "Group.Join", {
      unknownDword1: 1, // should be 1
      unknownDword2: 1,
      joinState: 1,
      unknownDword3: 1,
      inviteData: {
        sourceCharacter: {
          characterId: source.character.characterId,
          identity: {
            characterFirstName: source.character.name,
            characterName: source.character.name,
          },
        },
        targetCharacter: {
          characterId: target.character.characterId,
          identity: {
            characterName: target.character.name,
          },
        },
      },
    });
    */
  }

  removeGroupMember(server: ZoneServer2016, client: Client) {
    const groupId = client.character.groupId,
    group = this.groups[groupId];
    if(!groupId || !group) return;
    if(!group.members.includes(client.character.characterId)) return;
    const idx = group.members.indexOf(client.character.characterId);
    group.members.splice(idx, 1);
    client.character.groupId = 0;
    
    // TODO: clear glowing effect for all clients, as well as kicked client

  }

  handleGroupKick(server: ZoneServer2016, client: Client, target: Client) {
    target.character.groupId = 0;
    server.sendAlert(target, "")
  }

  handleGroupLeave(server: ZoneServer2016, client: Client) {

  }

  handleGroupView(server: ZoneServer2016, client: Client) {

  }

  handleGroupCommand(server: ZoneServer2016, client: Client, args: Array<string>) {
    if(!args[0]) {
      server.sendChatText(client, "Missing argument, valid arguments are: kick, leave, view");
      return;
    }
    switch(args[0]) {
      case "kick":
        if(!args[1]) {
          server.sendChatText(client, "You must specify a player to be kicked! Usage: /group kick {playername}");
          return;
        }
        const target = server.getClientByNameOrLoginSession(
          args[1].toString()
        );
        if (server.playerNotFound(client, args[0].toString(), target)) {
          return;
        }
        if (!target || !(target instanceof Client)) {
          server.sendChatText(client, "Client not found.");
          return;
        }

        this.handleGroupKick(server, client, target);
        break;
      case "leave":
        this.handleGroupLeave(server, client);
        break;
      case "view":
        this.handleGroupView(server, client);
        break;
    }
  }
}