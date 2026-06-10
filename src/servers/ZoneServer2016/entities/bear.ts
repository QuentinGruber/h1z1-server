// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2026 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

import { ZoneServer2016 } from "../zoneserver";
import { ZoneClient2016 } from "../classes/zoneclient";
import {
  Items,
  MaterialTypes,
  ModelIds,
  NpcIds,
  StringIds
} from "../models/enums";
import { Npc } from "./npc";
import { createBear } from "../jsms/bear.jsm";

export class Bear extends Npc {
  constructor(
    characterId: string,
    transientId: number,
    position: Float32Array,
    rotation: Float32Array,
    server: ZoneServer2016,
    spawnerId: number = 0
  ) {
    super(
      characterId,
      transientId,
      ModelIds.BEAR,
      position,
      rotation,
      server,
      spawnerId
    );
    this.materialType = MaterialTypes.FLESH;
    this.npcMeleeDamage = 4000;
    this.npcId = NpcIds.BEAR;
    this.nameId = StringIds.BEAR;
    this.rewardItems = [
      { itemDefId: Items.MEAT_BEAR, weight: 40 },
      { itemDefId: Items.ANIMAL_FAT, weight: 20 }
    ];
    if (!process.env.DISABLE_AI && server.aiEnabled) {
      this.fsm = createBear(this, server);
    }
  }

  protected addLoot(server: ZoneServer2016): void {
    server.worldObjectManager.createLootbag(server, this);
  }

  protected onHarvest(server: ZoneServer2016, client: ZoneClient2016): void {
    this.triggerAwards(server, client, this.rewardItems);
  }

  protected buildInteractionString(
    server: ZoneServer2016,
    client: ZoneClient2016
  ): void {
    this.sendInteractionString(server, client, StringIds.HARVEST);
  }
}
