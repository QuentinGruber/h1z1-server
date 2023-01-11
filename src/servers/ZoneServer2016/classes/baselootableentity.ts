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

import { ContainerErrors, StringIds } from "../models/enums";
import { ZoneServer2016 } from "../zoneserver";
import { BaseFullCharacter } from "./basefullcharacter";
import { LoadoutContainer } from "./loadoutcontainer";
import { ZoneClient2016 } from "./zoneclient";

export class BaseLootableEntity extends BaseFullCharacter {
  mountedCharacter?: string;
  readonly interactionDistance = 4;
  isLootbag: boolean;
  constructor(
    characterId: string,
    transientId: number,
    actorModelId: number,
    position: Float32Array,
    rotation: Float32Array
  ) {
    super(characterId, transientId, actorModelId, position, rotation);
    this.isLootbag = actorModelId == 9581 || actorModelId == 9391;
  }

  getContainer(): LoadoutContainer | undefined {
    return Object.values(this._containers)[0];
  }

  OnInteractionString(server: ZoneServer2016, client: ZoneClient2016): void {
    server.sendData(client, "Command.InteractionString", {
      guid: this.characterId,
      stringId: StringIds.OPEN,
    });
  }

  OnPlayerSelect(server: ZoneServer2016, client: ZoneClient2016): void {
    if (client.character.characterId == this.mountedCharacter) {
      client.character.dismountContainer(server);
      return;
    }

    if (this.mountedCharacter) {
      server.containerError(client, ContainerErrors.IN_USE);
      return;
    }

    client.character.mountContainer(server, this);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  OnFullCharacterDataRequest(server: ZoneServer2016, client: ZoneClient2016) {
    // do nothing for now
  }
}
