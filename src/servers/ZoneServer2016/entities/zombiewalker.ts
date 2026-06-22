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
  chance,
  generateRandomGuid,
  randomIntFromInterval
} from "../../../utils/utils";
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
import { Factions } from "../jsms/factions";
import { getRandomZombieLoadout } from "../data/loadouts";

export class ZombieWalker extends Npc {
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
    this.npcMeleeDamage = 2500;
    this.npcId = NpcIds.ZOMBIE;
    this.faction = Factions.ZOMBIE;
    this.nameId = StringIds.ZOMBIE_WALKER;
    this.rewardItems = [{ itemDefId: Items.BRAIN_INFECTED, weight: 10 }];
    if (!process.env.DISABLE_AI && server.aiEnabled) {
      this.fsm = createZombie(this, server);
    }
    for (const entry of getRandomZombieLoadout()) {
      this.equipItem(server, server.generateItem(entry.item), false);
    }
  }

  protected addLoot(server: ZoneServer2016): void {
    this.addZombieLoot(server);
  }

  protected addZombieLoot(server: ZoneServer2016) {
    const lootItems: any[] = [];

    const wornLetters = [
      Items.WORN_LETTER_CHURCH_PV,
      Items.WORN_LETTER_LJ_PV,
      Items.WORN_LETTER_MISTY_DAM,
      Items.WORN_LETTER_RADIO,
      Items.WORN_LETTER_RUBY_LAKE,
      Items.WORN_LETTER_TOXIC_LAKE,
      Items.WORN_LETTER_VILLAS,
      Items.WORN_LETTER_WATER_TOWER
    ];
    // Worn letter (4% chance, up to 2)
    if (chance(50)) {
      const randomWornLetter =
        wornLetters[randomIntFromInterval(0, wornLetters.length - 1)];
      const wornLetterItem = server.generateItem(randomWornLetter, 1);
      if (wornLetterItem) {
        lootItems.push(wornLetterItem);
      }
    }

    const GoodammoTypes = [
      Items.AMMO_12GA,
      Items.AMMO_223,
      Items.AMMO_308,
      Items.AMMO_762
    ];
    // Ammo (5% chance)
    if (chance(50)) {
      for (let i = 0; i < 2; i++) {
        const randomAmmo =
          GoodammoTypes[randomIntFromInterval(0, GoodammoTypes.length - 1)];
        const ammoCount = randomIntFromInterval(1, 3);
        const ammoItem = server.generateItem(randomAmmo, ammoCount);
        if (ammoItem) {
          lootItems.push(ammoItem);
        }
      }
    }

    const ammoTypes = [Items.AMMO_380, Items.AMMO_9MM, Items.AMMO_45];
    // Ammo (10% chance)
    if (chance(100)) {
      for (let i = 0; i < ammoTypes.length - 1; i++) {
        const randomAmmo =
          ammoTypes[randomIntFromInterval(0, ammoTypes.length - 1)];
        const ammoCount = randomIntFromInterval(1, 5);
        const ammoItem = server.generateItem(randomAmmo, ammoCount);
        if (ammoItem) {
          lootItems.push(ammoItem);
        }
      }
    }

    const specialItems = [
      Items.WEAPON_BOW_MAKESHIFT,
      Items.BACKPACK_BLUE_ORANGE,
      Items.CRUMPLED_NOTE,
      Items.REFRIGERATOR_NOTE
    ];
    // Special item (15% chance)
    if (chance(150)) {
      for (let i = 0; i < specialItems.length - 1; i++) {
        const randomSpecial =
          specialItems[randomIntFromInterval(0, specialItems.length - 1)];
        const specialItem = server.generateItem(randomSpecial, 1);
        if (specialItem) {
          lootItems.push(specialItem);
        }
      }
    }

    // Cloth (80% chance)
    if (chance(800)) {
      const clothCount = randomIntFromInterval(1, 3);
      const clothItem = server.generateItem(Items.CLOTH, clothCount);
      if (clothItem) {
        lootItems.push(clothItem);
      }
    }

    if (lootItems.length === 0) return;

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
