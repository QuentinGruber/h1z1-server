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

import { Items, StringIds } from "../models/enums";
import { ZoneServer2016 } from "../zoneserver";
import { ZoneClient2016 } from "../classes/zoneclient";
import { TaskProp } from "./taskprop";

export class TreasureChest extends TaskProp {
  requiredItemId: number = 0;
  rewardChest: Items;
  rewardItems: number[] = [];
  constructor(
    characterId: string,
    transientId: number,
    actorModelId: number,
    position: Float32Array,
    rotation: Float32Array,
    server: ZoneServer2016,
    scale: Float32Array,
    zoneId: number,
    renderDistance: number,
    actorModel: string,
    rewardChest: number
  ) {
    super(
      characterId,
      transientId,
      actorModelId,
      position,
      rotation,
      server,
      scale,
      zoneId,
      renderDistance,
      actorModel
    );
    this.rewardChest = rewardChest;
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
    switch (this.rewardChest) {
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

  OnInteractionString(server: ZoneServer2016, client: ZoneClient2016) {
    if (client.character.hasItem(this.requiredItemId)) {
      server.sendData(client, "Command.InteractionString", {
        guid: this.characterId,
        stringId: StringIds.OPEN
      });
    }
  }

  OnPlayerSelect(server: ZoneServer2016, client: ZoneClient2016) {
    if (!this.requiredItemId) return;
    const removedItem = client.character.getItemById(this.requiredItemId);
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
    server.taskOption(client, 1000, this.nameId, removedItem, itemsPassed);
  }
}
