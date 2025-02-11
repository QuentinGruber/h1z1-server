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

import { Items } from "../models/enums";
import { ZoneServer2016 } from "../zoneserver";
import { LootableProp } from "./lootableprop";
import { chance } from "../../../utils/utils";

export class TreasureChest extends LootableProp {
  /** Id of the worn letter that corresponds to the correct TreasureChest */
  requiredItemId: number = 0;

  /** Determines what items will spawn in the TreasureChest */
  rewardItems: number[] = [];

  /** Id of the chest container to spawn the items at */
  spawnerId: number;

  /** Time alloted before the Treasure Chest clears its contents */
  clearChestTimer?: NodeJS.Timeout;

  constructor(
    characterId: string,
    transientId: number,
    actorModelId: number,
    position: Float32Array,
    rotation: Float32Array,
    server: ZoneServer2016,
    scale: Float32Array,
    spawnerId: number,
    renderDistance: number
  ) {
    super(
      characterId,
      transientId,
      actorModelId,
      position,
      rotation,
      server,
      new Float32Array([1, 1, 1, 1]),
      0,
      renderDistance
    );
    this.spawnerId = spawnerId;
    this.getTaskPropData();
  }

  getRewardItemCount(itemId: number): number {
    switch (itemId) {
      case Items.AMMO_223:
        return 24;
      case Items.AMMO_12GA:
        return 12;
    }
    return 1;
  }

  getTaskPropData(): void {
    switch (this.spawnerId) {
      case Items.CHEST_CHURCH_PV:
        this.requiredItemId = Items.WORN_LETTER_CHURCH_PV;
        break;
      case Items.CHEST_MISTY_DAM:
        this.requiredItemId = Items.WORN_LETTER_MISTY_DAM;
        break;
      case Items.CHEST_RUBY_LAKE:
        this.requiredItemId = Items.WORN_LETTER_RUBY_LAKE;
        break;
      case Items.CHEST_WATER_TOWER:
        this.requiredItemId = Items.WORN_LETTER_WATER_TOWER;
        break;
      case Items.CHEST_TOXIC_LAKE:
        this.requiredItemId = Items.WORN_LETTER_TOXIC_LAKE;
        break;
      case Items.CHEST_RADIO:
        this.requiredItemId = Items.WORN_LETTER_RADIO;
        break;
      case Items.CHEST_LJ_PV:
        this.requiredItemId = Items.WORN_LETTER_LJ_PV;
        break;
      case Items.CHEST_VILLAS:
        this.requiredItemId = Items.WORN_LETTER_VILLAS;
        break;
    }

    this.rewardItems = [
      Items.BACKPACK_MILITARY_GREEN_CAMO,
      Items.COMPASS,
      Items.ALL_PURPOSE_GOGGLES,
      Items.AMMO_223,
      Items.MRE01,
      Items.AMMO_12GA
    ];
  }

  triggerRewards(server: ZoneServer2016) {
    if (!this.requiredItemId) return;
    const removedItem = this.getItemById(this.requiredItemId);
    if (!removedItem) return;

    const rewardItems = this.rewardItems;
    if (Math.random() < 0.5) {
      rewardItems.push(Items.WEAPON_SHOTGUN);
    } else {
      rewardItems.push(Items.WEAPON_AR15);
    }

    const itemsPassed = rewardItems.map((item) => ({
      itemDefinitionId: item,
      count: this.getRewardItemCount(item)
    }));

    if (!server.removeInventoryItem(this, removedItem, 1)) return;
    itemsPassed.forEach(
      (itemInstance: { itemDefinitionId: number; count: number }) => {
        const item = server.generateItem(
          itemInstance.itemDefinitionId,
          itemInstance.count,
          true
        );
        this.lootContainerItem(server, item, itemInstance.count, false);
      }
    );
    const rewards = server.rewardManager.rewards;
    for (const reward of rewards) {
      if (chance(100) && reward.dropChances > 0) {
        const item = server.generateItem(reward.itemId, 1, true);
        if (!item) return;
        this.lootContainerItem(server, item, item?.stackCount, false);
      }
    }
  }
}
