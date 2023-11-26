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

import { Npc } from "./npc";
import { ZoneServer2016 } from "../zoneserver";
import { Items, MaterialTypes, StringIds } from "../models/enums";
import { ZoneClient2016 } from "../classes/zoneclient";
import { CommandInteractionString } from "types/zone2016packets";

export class Zombie extends Npc {
  constructor(
    characterId: string,
    transientId: number,
    actorModelId: number,
    position: Float32Array,
    rotation: Float32Array,
    server: ZoneServer2016,
    spawnerId: number = 0
  ) {
    super(
      characterId,
      transientId,
      actorModelId,
      position,
      rotation,
      server,
      spawnerId
    );
    this.materialType = MaterialTypes.ZOMBIE;
  }

  OnInteractionString(server: ZoneServer2016, client: ZoneClient2016) {
    if (!this.isAlive) {
      switch (this.actorModelId) {
        case 9510:
        case 9634:
          this.sendInteractionString(server, client, client.character.hasItem(Items.SYRINGE_EMPTY) ?
            StringIds.EXTRACT_BLOOD : StringIds.HARVEST);
          break;
      }
    }
  }

  OnPlayerSelect(
    server: ZoneServer2016,
    client: ZoneClient2016,
  ) {
    switch (this.actorModelId) {
      case 9510:
      case 9634:
        server.utilizeHudTimer(client, 60, 5000, 0, () => {
          const item = client.character.getItemById(Items.SYRINGE_EMPTY);
          
          if (!item) {
            if (server.deleteEntity(this.characterId, server._npcs)) {
              client.character.lootContainerItem(server, server.generateItem(Items.BRAIN_INFECTED));
            }
            return;
          }

          if (server.removeInventoryItem(client.character, item)) {
            client.character.lootContainerItem(server, server.generateItem(Items.SYRINGE_INFECTED_BLOOD));
          }
        });
        break;
    }
  }
}
