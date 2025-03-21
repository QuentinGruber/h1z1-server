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

import { ContainerErrors, ModelIds, StringIds } from "../models/enums";
import { ZoneServer2016 } from "../zoneserver";
import { BaseFullCharacter } from "./basefullcharacter";
import { LoadoutContainer } from "../classes/loadoutcontainer";
import { ZoneClient2016 } from "../classes/zoneclient";

export abstract class BaseLootableEntity extends BaseFullCharacter {
  /** The current character interacting with the BaseLootableEntity */
  mountedCharacter?: string;

  /** Distance (H1Z1 meters) at which the player can interact with the BaseLootableEntity */
  interactionDistance = 4;

  /** Determines if the entity BaseLootableEntity should be a lootbag,
   * Returns true if the modelId is included in the array below
   */
  isLootbag: boolean;

  /** Used to determine whether the modelId should spawn loot when the global respawns occur,
   * Returns false if the modelId is not included in the array below
   */
  shouldSpawnLoot: boolean;

  constructor(
    characterId: string,
    transientId: number,
    actorModelId: number,
    position: Float32Array,
    rotation: Float32Array,
    server: ZoneServer2016
  ) {
    super(characterId, transientId, actorModelId, position, rotation, server);
    this.isLootbag = [
      ModelIds.LOOT_BAG_LARGE,
      ModelIds.BURLAP_BAG_LARGE
    ].includes(actorModelId);
    this.useSimpleStruct = true;
    this.shouldSpawnLoot = ![
      ModelIds.HOSPITAL_LAB_WORKBENCH,
      ModelIds.TREASURE_CHEST,
      ModelIds.CAMPFIRE,
      ModelIds.FURNACE,
      ModelIds.HAND_SHOVEL
    ].includes(actorModelId);
  }

  getContainer(): LoadoutContainer | undefined {
    return Object.values(this._containers)[0];
  }

  OnInteractionString(server: ZoneServer2016, client: ZoneClient2016): void {
    server.sendData(client, "Command.InteractionString", {
      guid: this.characterId,
      stringId: StringIds.OPEN
    });
  }
  /* eslint-disable @typescript-eslint/no-unused-vars */
  OnPlayerSelect(
    server: ZoneServer2016,
    client: ZoneClient2016,
    isInstant?: boolean
    /* eslint-enable @typescript-eslint/no-unused-vars */
  ): void {
    if (client.character.characterId == this.mountedCharacter) {
      client.character.dismountContainer(server);
      delete this.mountedCharacter; // the check below wont fix container if characterId is the same
      return; // as the one that opened it, so just to be sure we delete it here
    }

    if (this.mountedCharacter) {
      if (!server.getClientByCharId(this.mountedCharacter)) {
        delete this.mountedCharacter;
      } else {
        server.containerError(client, ContainerErrors.IN_USE);
        return;
      }
    }

    client.character.mountContainer(server, this);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  OnFullCharacterDataRequest(server: ZoneServer2016, client: ZoneClient2016) {
    // do nothing for now
  }
}
