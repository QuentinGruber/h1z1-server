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
  //groups: {[groupId: number]: Group};
  constructor() {

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

  handleGroupJoin(server: ZoneServer2016, source: Client, target: Client) {
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
  }
}