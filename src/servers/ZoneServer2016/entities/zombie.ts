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

import { Npc } from "./npc";
import { ZoneServer2016 } from "../zoneserver";
import { Items, MaterialTypes, StringIds } from "../models/enums";
import { ZoneClient2016 } from "../classes/zoneclient";

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
    if (this.isAlive && client.character.hasItem(Items.SYRINGE_EMPTY)) {
      switch (this.actorModelId) {
        case 9510:
        case 9634:
          this.sendInteractionString(server, client, StringIds.EXTRACT_BLOOD);
          break;
      }
    }
  }

  OnPlayerSelect(server: ZoneServer2016, client: ZoneClient2016) {
    if (!this.isAlive) {
      switch (this.actorModelId) {
        case 9510:
        case 9634:
          const item = client.character.getItemById(Items.SYRINGE_EMPTY);
          if (item && server.removeInventoryItem(client.character, item)) {
            server.utilizeHudTimer(client, 60, 5000, 0, () => {
              client.character.lootContainerItem(
                server,
                server.generateItem(Items.SYRINGE_INFECTED_BLOOD)
              );
            });
          }
          break;
      }
    }
  }
}
