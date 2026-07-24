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
import { Items, MaterialTypes, NpcIds, StringIds } from "../models/enums";
import { Npc } from "./npc";
import { createRaven } from "../jsms/raven.jsm";
import { Factions } from "../jsms/factions";

export class Raven extends Npc {
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
    this.health = 500;
    this.materialType = MaterialTypes.FLESH;
    this.npcMeleeDamage = 0;
    this.npcId = NpcIds.RAVEN;
    this.faction = Factions.PASSIVE;
    this.nameId = StringIds.RAVEN;
    this.rewardItems = [];
    if (!process.env.DISABLE_AI && server.aiEnabled) {
      this.fsm = createRaven(this, server);
      // Add spawn grace period so raven doesn't flee immediately when spawned near player
      (this.fsm as any).fleeCooldown = 10;
    }
  }

  protected addLoot(_server: ZoneServer2016): void {}

  protected onHarvest(server: ZoneServer2016, client: ZoneClient2016): void {}

  protected buildInteractionString(
    server: ZoneServer2016,
    client: ZoneClient2016
  ): void {
    this.sendInteractionString(server, client, StringIds.HARVEST);
  }
}
