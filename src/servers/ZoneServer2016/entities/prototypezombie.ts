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
import { generateRandomGuid } from "../../../utils/utils";
import {
  Items,
  MaterialTypes,
  ModelIds,
  NpcIds,
  StringIds
} from "../models/enums";
import { Npc } from "./npc";
import { LoadoutContainer } from "../classes/loadoutcontainer";
import { Lootbag } from "./lootbag";
import { createZombie } from "../jsms/zombie.jsm";
import { getSpecifiedZombieLoadout } from "../data/loadouts";

export class PrototypeZombie extends Npc {
  constructor(
    characterId: string,
    transientId: number,
    actorModelId: number,
    position: Float32Array,
    rotation: Float32Array,
    server: ZoneServer2016,
    spawnerId: number = 0,
    prototypeNpcId: number = NpcIds.ZOMBIE
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
    this.health = 30000;
    this.materialType = MaterialTypes.ZOMBIE;
    this.npcMeleeDamage = 5000;
    this.npcId = prototypeNpcId;
    this.nameId = StringIds.ZOMBIE_WALKER;
    this.rewardItems = [{ itemDefId: Items.BRAIN_INFECTED, weight: 10 }];
    if (!process.env.DISABLE_AI && server.aiEnabled) {
      this.fsm = createZombie(this, server);
    }
    switch (this.npcId) {
      case NpcIds.PROTOTYPE_ASSAULT_ZOMBIE: {
        for (const entry of getSpecifiedZombieLoadout("Assault")) {
          this.equipItem(server, server.generateItem(entry.item), false);
        }
        break;
      }
      case NpcIds.PROTOTYPE_HUNTER_ZOMBIE: {
        for (const entry of getSpecifiedZombieLoadout("Hunter")) {
          this.equipItem(server, server.generateItem(entry.item), false);
        }
        break;
      }
      case NpcIds.PROTOTYPE_SNIPER_ZOMBIE: {
        for (const entry of getSpecifiedZombieLoadout("Sniper")) {
          this.equipItem(server, server.generateItem(entry.item), false);
        }
        break;
      }
    }
  }

  protected addLoot(server: ZoneServer2016): void {
    this.addZombieLoot(server);
  }

  protected addZombieLoot(server: ZoneServer2016) {
    const lootMap: Record<number, number> = {
      [NpcIds.PROTOTYPE_ASSAULT_ZOMBIE]: Items.PROTOTYPE_MECHANISM,
      [NpcIds.PROTOTYPE_HUNTER_ZOMBIE]: Items.PROTOTYPE_RECEIVER,
      [NpcIds.PROTOTYPE_SNIPER_ZOMBIE]: Items.PROTOTYPE_TRIGGER_ASSEMBLY
    };

    const itemId = lootMap[this.npcId];
    if (!itemId) return;

    const item = server.generateItem(itemId, 1);
    if (!item) return;

    const lootItems: any[] = [item];

    const characterId = generateRandomGuid();
    const lootbag = new Lootbag(
      characterId,
      server.getTransientId(characterId),
      ModelIds.LOOT_BAG_CLEAN,
      new Float32Array([
        this.state.position[0] + 0.7,
        this.state.position[1],
        this.state.position[2] + 0.7
      ]),
      new Float32Array([0, 0, 0, 0]),
      server
    );
    const container = lootbag.getContainer();

    for (const item of lootItems) {
      server.addContainerItem(lootbag, item, container as LoadoutContainer);
    }

    server._lootbags[characterId] = lootbag;
  }

  protected onHarvest(server: ZoneServer2016, client: ZoneClient2016): void {
    const emptySyringe = client.character.getItemById(Items.SYRINGE_EMPTY);
    if (emptySyringe) {
      client.character.lootContainerItem(
        server,
        server.generateItem(Items.SYRINGE_INFECTED_BLOOD)
      );
      server.removeInventoryItem(client.character, emptySyringe);
      return;
    }
    this.triggerAwards(server, client, this.rewardItems);
  }

  protected buildInteractionString(
    server: ZoneServer2016,
    client: ZoneClient2016
  ): void {
    if (client.character.hasItem(Items.SYRINGE_EMPTY)) {
      this.sendInteractionString(server, client, StringIds.EXTRACT_BLOOD);
      return;
    }
    this.sendInteractionString(server, client, StringIds.HARVEST);
  }
}
