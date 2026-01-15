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

import { ItemClasses, Items } from "../models/enums";
import { ZoneServer2016 } from "../zoneserver";

interface DeathItemDetails {
  damage: number;
  lootItems?: { itemId: Items; count: number }[];
}

export class DeathItemDamageConfig {
  static readonly ITEM_CLASS_CONFIG: { [key: number]: DeathItemDetails } = {
    [ItemClasses.WEAPONS_BOW]: { damage: 350 },
    [ItemClasses.WEAPONS_CROSSBOW]: { damage: 350 },
    [ItemClasses.WEAPONS_GENERIC]: { damage: 350 },
    [ItemClasses.WEAPONS_LONG]: { damage: 350 },
    [ItemClasses.WEAPONS_MELEES]: { damage: 350 },
    [ItemClasses.WEAPONS_MELEES0]: { damage: 350 },
    [ItemClasses.WEAPONS_PISTOL]: { damage: 350 },
    [ItemClasses.BACKPACKS]: {
      damage: 500,
      lootItems: [{ itemId: Items.CLOTH, count: 2 }]
    },
    [ItemClasses.FOOTWEAR]: {
      damage: 800,
      lootItems: [{ itemId: Items.CLOTH, count: 2 }]
    }
  };

  static readonly ITEM_ID_CONFIG: { [key: number]: DeathItemDetails } = {
    [Items.BACKPACK_FRAMED]: {
      damage: 400,
      lootItems: [
        { itemId: Items.CLOTH, count: 2 },
        { itemId: Items.BROKEN_METAL_ITEM, count: 1 }
      ]
    }
  };

  static getConfig(server: ZoneServer2016, itemId: Items): DeathItemDetails {
    const itemDefinition = server.getItemDefinition(itemId);
    const itemClass = itemDefinition?.ITEM_CLASS as ItemClasses | undefined;
    return (
      this.ITEM_ID_CONFIG[itemId] ??
      (itemClass
        ? this.ITEM_CLASS_CONFIG[itemClass]
        : { damage: 350, lootItems: {} })
    );
  }
}
