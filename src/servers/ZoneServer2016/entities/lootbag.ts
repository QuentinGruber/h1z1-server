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

import { BaseLootableEntity } from "./baselootableentity";
import { ZoneServer2016 } from "../zoneserver";
import { lootableContainerDefaultLoadouts } from "../data/loadouts";
import { ZoneClient2016 } from "../classes/zoneclient";
import { ModelIds, StringIds } from "../models/enums";

export class Lootbag extends BaseLootableEntity {
  /** Time (milliseconds) when the lootbag is created */
  creationTime = Date.now();

  /** Returns true if the player can transfer items to the lootbag */
  canAcceptItems = false;
  loadoutId = 5;
  constructor(
    characterId: string,
    transientId: number,
    actorModelId: number,
    position: Float32Array,
    rotation: Float32Array,
    server: ZoneServer2016
  ) {
    super(characterId, transientId, actorModelId, position, rotation, server);
    const container = this.getContainer();
    if (container) container.canAcceptItems = false;
    this.flags.noCollide = 1;
    this.npcRenderDistance =
      this.actorModelId != ModelIds.MILITARY_CRATE ? 50 : 200;
    this.defaultLoadout =
      this.actorModelId != ModelIds.MILITARY_CRATE
        ? lootableContainerDefaultLoadouts.lootbag
        : lootableContainerDefaultLoadouts.military_crate;
    this.equipLoadout(server);
    this.useSimpleStruct = false;
  }

  OnInteractionString(server: ZoneServer2016, client: ZoneClient2016) {
    if (client.searchedProps.includes(this)) {
      server.sendData(client, "Command.InteractionString", {
        guid: this.characterId,
        stringId: StringIds.OPEN
      });
    } else {
      server.sendData(client, "Command.InteractionString", {
        guid: this.characterId,
        stringId: StringIds.SEARCH
      });
    }
  }
  /* eslint-disable @typescript-eslint/no-unused-vars */
  OnPlayerSelect(
    server: ZoneServer2016,
    client: ZoneClient2016,
    isInstant?: boolean
    /* eslint-enable @typescript-eslint/no-unused-vars */
  ) {
    if (!client.searchedProps.includes(this)) {
      server.utilizeHudTimer(
        client,
        server.getItemDefinition(this._containers["31"].itemDefinitionId)
          ?.NAME_ID ?? 0,
        this.actorModelId != ModelIds.MILITARY_CRATE ? 0 : 10000,
        0,
        () => {
          super.OnPlayerSelect(server, client);
          client.searchedProps.push(this);
        }
      );
    } else {
      super.OnPlayerSelect(server, client);
    }
  }

  destroy(server: ZoneServer2016): boolean {
    return server.deleteEntity(this.characterId, server._lootbags);
  }
}
