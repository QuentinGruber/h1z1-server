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

import { Recipe, smeltRecipe } from "types/zoneserver";
import { FilterIds, Items } from "../models/enums";
export const smeltingData: { [recipeId: number]: smeltRecipe } = {
  1: {
    filterId: FilterIds.COOKING,
    rewardId: Items.BLACKBERRY_PIE,
    components: [
      {
        itemDefinitionId: Items.SUGAR,
        requiredAmount: 1
      },
      {
        itemDefinitionId: Items.BLACKBERRY,
        requiredAmount: 8
      },
      {
        itemDefinitionId: Items.FLOUR,
        requiredAmount: 1
      }
    ]
  },
  2: {
    filterId: FilterIds.COOKING,
    rewardId: Items.COFFEE,
    components: [
      {
        itemDefinitionId: Items.GROUND_COFFEE,
        requiredAmount: 1
      },
      {
        itemDefinitionId: Items.WATER_PURE,
        requiredAmount: 1
      }
    ]
  },
  3: {
    filterId: FilterIds.COOKING,
    rewardId: Items.STEAK_RABBIT,
    components: [
      {
        itemDefinitionId: Items.MEAT_RABBIT,
        requiredAmount: 1
      }
    ]
  },
  4: {
    filterId: FilterIds.COOKING,
    rewardId: Items.JERKY_DEER,
    components: [
      {
        itemDefinitionId: Items.MEAT_VENISON,
        requiredAmount: 1
      },
      {
        itemDefinitionId: Items.SALT,
        requiredAmount: 1
      }
    ]
  },
  5: {
    filterId: FilterIds.COOKING,
    rewardId: Items.STEAK_DEER,
    components: [
      {
        itemDefinitionId: Items.MEAT_VENISON,
        requiredAmount: 1
      }
    ]
  },
  6: {
    filterId: FilterIds.COOKING,
    rewardId: Items.WATER_PURE,
    components: [
      {
        itemDefinitionId: Items.WATER_STAGNANT,
        requiredAmount: 1
      }
    ]
  },
  7: {
    filterId: FilterIds.COOKING,
    rewardId: Items.WATER_PURE,
    components: [
      {
        itemDefinitionId: Items.WATER_DIRTY,
        requiredAmount: 1
      }
    ]
  },
  8: {
    filterId: FilterIds.COOKING,
    rewardId: Items.STEW_RABBIT,
    components: [
      {
        itemDefinitionId: Items.SALT,
        requiredAmount: 1
      },
      {
        itemDefinitionId: Items.STEAK_RABBIT,
        requiredAmount: 1
      },
      {
        itemDefinitionId: Items.WATER_PURE,
        requiredAmount: 1
      }
    ]
  },
  9: {
    filterId: FilterIds.COOKING,
    rewardId: Items.CORN_ROASTED,
    components: [
      {
        itemDefinitionId: Items.CORN,
        requiredAmount: 1
      }
    ]
  },
  10: {
    filterId: FilterIds.COOKING,
    rewardId: Items.SURVIVAL_BORSCHT,
    components: [
      {
        itemDefinitionId: Items.CANNED_FOOD01,
        requiredAmount: 1
      },
      {
        itemDefinitionId: Items.SALT,
        requiredAmount: 1
      },
      {
        itemDefinitionId: Items.WATER_PURE,
        requiredAmount: 1
      }
    ]
  },
  11: {
    filterId: FilterIds.COOKING,
    rewardId: Items.SURVIVAL_BREAD,
    components: [
      {
        itemDefinitionId: Items.WATER_PURE,
        requiredAmount: 1
      },
      {
        itemDefinitionId: Items.YEAST,
        requiredAmount: 1
      },
      {
        itemDefinitionId: Items.FLOUR,
        requiredAmount: 1
      }
    ]
  },
  12: {
    filterId: FilterIds.COOKING,
    rewardId: Items.SWIZZLE,
    components: [
      {
        itemDefinitionId: Items.SUGAR,
        requiredAmount: 1
      },
      {
        itemDefinitionId: Items.WATER_PURE,
        requiredAmount: 1
      },
      {
        itemDefinitionId: Items.COLD_MEDICINE,
        requiredAmount: 1
      }
    ]
  },
  13: {
    filterId: FilterIds.COOKING,
    rewardId: Items.STEAK_WOLF,
    components: [
      {
        itemDefinitionId: Items.MEAT_WOLF,
        requiredAmount: 1
      }
    ]
  },
  14: {
    filterId: FilterIds.COOKING,
    rewardId: Items.FUEL_BIOFUEL,
    components: [
      {
        itemDefinitionId: Items.WATER_EMPTY,
        requiredAmount: 1
      },
      {
        itemDefinitionId: Items.ANIMAL_FAT,
        requiredAmount: 1
      }
    ]
  },
  42: {
    filterId: FilterIds.COOKING,
    rewardId: Items.STEAK_BEAR,
    components: [
      {
        itemDefinitionId: Items.MEAT_BEAR,
        requiredAmount: 1
      }
    ]
  },
  // disabled for now, need to fix requiredAmount for smelting - Meme
  /*
  14: {
    filterId: FilterIds.FURNACE,
    rewardId: Items.METAL_BAR,
    components: [
      {
        itemDefinitionId: Items.NAIL,
        requiredAmount: 4,
      },
    ],
  },*/
  15: {
    filterId: FilterIds.FURNACE,
    rewardId: Items.METAL_BAR,
    components: [
      {
        itemDefinitionId: Items.METAL_SCRAP,
        requiredAmount: 1
      }
    ]
  },
  16: {
    filterId: FilterIds.FURNACE,
    rewardId: Items.METAL_BAR,
    components: [
      {
        itemDefinitionId: Items.BROKEN_METAL_ITEM,
        requiredAmount: 1
      }
    ]
  },
  17: {
    filterId: FilterIds.FURNACE,
    rewardId: Items.METAL_BAR,
    components: [
      {
        itemDefinitionId: Items.WEAPON_1911,
        requiredAmount: 1
      }
    ]
  },
  18: {
    filterId: FilterIds.FURNACE,
    rewardId: Items.METAL_BAR,
    components: [
      {
        itemDefinitionId: Items.WEAPON_308,
        requiredAmount: 1
      }
    ]
  },
  19: {
    filterId: FilterIds.FURNACE,
    rewardId: Items.METAL_BAR,
    components: [
      {
        itemDefinitionId: Items.WEAPON_AK47,
        requiredAmount: 1
      }
    ]
  },
  20: {
    filterId: FilterIds.FURNACE,
    rewardId: Items.METAL_BAR,
    components: [
      {
        itemDefinitionId: Items.WEAPON_AK47_MODIFIED,
        requiredAmount: 1
      }
    ]
  },
  21: {
    filterId: FilterIds.FURNACE,
    rewardId: Items.METAL_BAR,
    components: [
      {
        itemDefinitionId: Items.WEAPON_AR15,
        requiredAmount: 1
      }
    ]
  },
  22: {
    filterId: FilterIds.FURNACE,
    rewardId: Items.METAL_BAR,
    components: [
      {
        itemDefinitionId: Items.WEAPON_AXE_FIRE,
        requiredAmount: 1
      }
    ]
  },
  23: {
    filterId: FilterIds.FURNACE,
    rewardId: Items.METAL_BAR,
    components: [
      {
        itemDefinitionId: Items.WEAPON_AXE_WOOD,
        requiredAmount: 1
      }
    ]
  },
  24: {
    filterId: FilterIds.FURNACE,
    rewardId: Items.METAL_BAR,
    components: [
      {
        itemDefinitionId: Items.WEAPON_BAT_ALUM,
        requiredAmount: 1
      }
    ]
  },
  25: {
    filterId: FilterIds.FURNACE,
    rewardId: Items.METAL_BAR,
    components: [
      {
        itemDefinitionId: Items.WEAPON_BLAZE,
        requiredAmount: 1
      }
    ]
  },
  26: {
    filterId: FilterIds.FURNACE,
    rewardId: Items.METAL_BAR,
    components: [
      {
        itemDefinitionId: Items.WEAPON_COMBATKNIFE,
        requiredAmount: 1
      }
    ]
  },
  27: {
    filterId: FilterIds.FURNACE,
    rewardId: Items.METAL_BAR,
    components: [
      {
        itemDefinitionId: Items.WEAPON_CROWBAR,
        requiredAmount: 1
      }
    ]
  },
  28: {
    filterId: FilterIds.FURNACE,
    rewardId: Items.METAL_BAR,
    components: [
      {
        itemDefinitionId: Items.WEAPON_FROSTBITE,
        requiredAmount: 1
      }
    ]
  },
  29: {
    filterId: FilterIds.FURNACE,
    rewardId: Items.METAL_BAR,
    components: [
      {
        itemDefinitionId: Items.WEAPON_HAMMER,
        requiredAmount: 1
      }
    ]
  },
  30: {
    filterId: FilterIds.FURNACE,
    rewardId: Items.METAL_BAR,
    components: [
      {
        itemDefinitionId: Items.WEAPON_HAMMER_DEMOLITION,
        requiredAmount: 1
      }
    ]
  },
  31: {
    filterId: FilterIds.FURNACE,
    rewardId: Items.METAL_BAR,
    components: [
      {
        itemDefinitionId: Items.WEAPON_HATCHET,
        requiredAmount: 1
      }
    ]
  },
  32: {
    filterId: FilterIds.FURNACE,
    rewardId: Items.METAL_BAR,
    components: [
      {
        itemDefinitionId: Items.WEAPON_HATCHET_MAKESHIFT,
        requiredAmount: 1
      }
    ]
  },
  33: {
    filterId: FilterIds.FURNACE,
    rewardId: Items.METAL_BAR,
    components: [
      {
        itemDefinitionId: Items.WEAPON_KATANA,
        requiredAmount: 1
      }
    ]
  },
  34: {
    filterId: FilterIds.FURNACE,
    rewardId: Items.METAL_BAR,
    components: [
      {
        itemDefinitionId: Items.WEAPON_M9,
        requiredAmount: 1
      }
    ]
  },
  35: {
    filterId: FilterIds.FURNACE,
    rewardId: Items.METAL_BAR,
    components: [
      {
        itemDefinitionId: Items.WEAPON_MACHETE01,
        requiredAmount: 1
      }
    ]
  },
  36: {
    filterId: FilterIds.FURNACE,
    rewardId: Items.METAL_BAR,
    components: [
      {
        itemDefinitionId: Items.WEAPON_MAGNUM,
        requiredAmount: 1
      }
    ]
  },
  37: {
    filterId: FilterIds.FURNACE,
    rewardId: Items.METAL_BAR,
    components: [
      {
        itemDefinitionId: Items.WEAPON_PIPE,
        requiredAmount: 1
      }
    ]
  },
  38: {
    filterId: FilterIds.FURNACE,
    rewardId: Items.METAL_BAR,
    components: [
      {
        itemDefinitionId: Items.WEAPON_REAPER,
        requiredAmount: 1
      }
    ]
  },
  39: {
    filterId: FilterIds.FURNACE,
    rewardId: Items.METAL_BAR,
    components: [
      {
        itemDefinitionId: Items.WEAPON_SHOTGUN,
        requiredAmount: 1
      }
    ]
  },
  40: {
    filterId: FilterIds.FURNACE,
    rewardId: Items.METAL_BAR,
    components: [
      {
        itemDefinitionId: Items.WEAPON_WRENCH,
        requiredAmount: 1
      }
    ]
  },
  41: {
    filterId: FilterIds.FURNACE,
    rewardId: Items.METAL_BAR,
    components: [
      {
        itemDefinitionId: Items.METAL_PIPE,
        requiredAmount: 1
      }
    ]
  }
};

export const recipes: { [recipeId: number]: Recipe } = {
  [Items.AMMO_223]: {
    filterId: FilterIds.WEAPONS,
    components: [
      {
        itemDefinitionId: Items.SHARD_METAL,
        requiredAmount: 1
      },
      {
        itemDefinitionId: Items.ALLOY_LEAD,
        requiredAmount: 2
      },
      {
        itemDefinitionId: Items.SHARD_BRASS,
        requiredAmount: 3
      },
      {
        itemDefinitionId: Items.GUNPOWDER_REFINED,
        requiredAmount: 2
      }
    ],
    requireWeaponWorkbench: true
  },
  [Items.AMMO_308]: {
    filterId: FilterIds.WEAPONS,
    components: [
      {
        itemDefinitionId: Items.SHARD_METAL,
        requiredAmount: 1
      },
      {
        itemDefinitionId: Items.ALLOY_LEAD,
        requiredAmount: 2
      },
      {
        itemDefinitionId: Items.SHARD_BRASS,
        requiredAmount: 3
      },
      {
        itemDefinitionId: Items.GUNPOWDER_REFINED,
        requiredAmount: 4
      }
    ],
    requireWeaponWorkbench: true
  },
  [Items.AMMO_380]: {
    filterId: FilterIds.WEAPONS,
    components: [
      {
        itemDefinitionId: Items.ALLOY_LEAD,
        requiredAmount: 1
      },
      {
        itemDefinitionId: Items.SHARD_BRASS,
        requiredAmount: 1
      },
      {
        itemDefinitionId: Items.GUNPOWDER_REFINED,
        requiredAmount: 1
      }
    ],
    requireWeaponWorkbench: true
  },
  [Items.AMMO_44]: {
    filterId: FilterIds.WEAPONS,
    components: [
      {
        itemDefinitionId: Items.SHARD_METAL,
        requiredAmount: 1
      },
      {
        itemDefinitionId: Items.ALLOY_LEAD,
        requiredAmount: 2
      },
      {
        itemDefinitionId: Items.SHARD_BRASS,
        requiredAmount: 1
      },
      {
        itemDefinitionId: Items.GUNPOWDER_REFINED,
        requiredAmount: 2
      }
    ],
    requireWeaponWorkbench: true
  },
  [Items.AMMO_45]: {
    filterId: FilterIds.WEAPONS,
    components: [
      {
        itemDefinitionId: Items.ALLOY_LEAD,
        requiredAmount: 1
      },
      {
        itemDefinitionId: Items.SHARD_BRASS,
        requiredAmount: 2
      },
      {
        itemDefinitionId: Items.GUNPOWDER_REFINED,
        requiredAmount: 2
      }
    ],
    requireWeaponWorkbench: true
  },
  [Items.AMMO_12GA]: {
    filterId: FilterIds.WEAPONS,
    components: [
      {
        itemDefinitionId: Items.SHARD_PLASTIC,
        requiredAmount: 2
      },
      {
        itemDefinitionId: Items.ALLOY_LEAD,
        requiredAmount: 2
      },
      {
        itemDefinitionId: Items.SHARD_BRASS,
        requiredAmount: 2
      },
      {
        itemDefinitionId: Items.GUNPOWDER_REFINED,
        requiredAmount: 4
      }
    ],
    requireWeaponWorkbench: true
  },
  [Items.AMMO_762]: {
    filterId: FilterIds.WEAPONS,
    components: [
      {
        itemDefinitionId: Items.SHARD_METAL,
        requiredAmount: 1
      },
      {
        itemDefinitionId: Items.ALLOY_LEAD,
        requiredAmount: 3
      },
      {
        itemDefinitionId: Items.SHARD_BRASS,
        requiredAmount: 2
      },
      {
        itemDefinitionId: Items.GUNPOWDER_REFINED,
        requiredAmount: 2
      }
    ],
    requireWeaponWorkbench: true
  },
  [Items.AMMO_9MM]: {
    filterId: FilterIds.WEAPONS,
    components: [
      {
        itemDefinitionId: Items.ALLOY_LEAD,
        requiredAmount: 2
      },
      {
        itemDefinitionId: Items.SHARD_BRASS,
        requiredAmount: 1
      },
      {
        itemDefinitionId: Items.GUNPOWDER_REFINED,
        requiredAmount: 1
      }
    ],
    requireWeaponWorkbench: true
  },
  [Items.WEAPON_BLAZE]: {
    filterId: FilterIds.WEAPONS,
    components: [
      {
        itemDefinitionId: Items.WEAPON_AR15,
        requiredAmount: 1
      },
      {
        itemDefinitionId: Items.PROTOTYPE_MECHANISM,
        requiredAmount: 1
      },
      {
        itemDefinitionId: Items.PROTOTYPE_TRIGGER_ASSEMBLY,
        requiredAmount: 1
      },
      {
        itemDefinitionId: Items.PROTOTYPE_RECEIVER,
        requiredAmount: 1
      }
    ]
  },
  [Items.WEAPON_FROSTBITE]: {
    filterId: FilterIds.WEAPONS,
    components: [
      {
        itemDefinitionId: Items.WEAPON_AK47,
        requiredAmount: 1
      },
      {
        itemDefinitionId: Items.PROTOTYPE_MECHANISM,
        requiredAmount: 1
      },
      {
        itemDefinitionId: Items.PROTOTYPE_TRIGGER_ASSEMBLY,
        requiredAmount: 1
      },
      {
        itemDefinitionId: Items.PROTOTYPE_RECEIVER,
        requiredAmount: 1
      }
    ]
  },
  [Items.WEAPON_NAGAFENS_RAGE]: {
    filterId: FilterIds.WEAPONS,
    components: [
      {
        itemDefinitionId: Items.WEAPON_SHOTGUN,
        requiredAmount: 1
      },
      {
        itemDefinitionId: Items.PROTOTYPE_MECHANISM,
        requiredAmount: 1
      },
      {
        itemDefinitionId: Items.PROTOTYPE_TRIGGER_ASSEMBLY,
        requiredAmount: 1
      },
      {
        itemDefinitionId: Items.PROTOTYPE_RECEIVER,
        requiredAmount: 1
      }
    ]
  },
  [Items.WEAPON_PURGE]: {
    filterId: FilterIds.WEAPONS,
    components: [
      {
        itemDefinitionId: Items.WEAPON_M9,
        requiredAmount: 1
      },
      {
        itemDefinitionId: Items.PROTOTYPE_MECHANISM,
        requiredAmount: 1
      },
      {
        itemDefinitionId: Items.PROTOTYPE_TRIGGER_ASSEMBLY,
        requiredAmount: 1
      },
      {
        itemDefinitionId: Items.PROTOTYPE_RECEIVER,
        requiredAmount: 1
      }
    ]
  },
  [Items.WEAPON_REAPER]: {
    filterId: FilterIds.WEAPONS,
    components: [
      {
        itemDefinitionId: Items.WEAPON_308,
        requiredAmount: 1
      },
      {
        itemDefinitionId: Items.PROTOTYPE_MECHANISM,
        requiredAmount: 1
      },
      {
        itemDefinitionId: Items.PROTOTYPE_TRIGGER_ASSEMBLY,
        requiredAmount: 1
      },
      {
        itemDefinitionId: Items.PROTOTYPE_RECEIVER,
        requiredAmount: 1
      }
    ]
  },
  [Items.AIRDROP_CODE]: {
    filterId: FilterIds.SURVIVAL,
    components: [
      {
        itemDefinitionId: Items.CODED_MESSAGE,
        requiredAmount: 4
      }
    ]
  },
  [Items.ANIMAL_TRAP]: {
    filterId: FilterIds.SURVIVAL,
    components: [
      {
        itemDefinitionId: Items.WOOD_PLANK,
        requiredAmount: 4
      },
      {
        itemDefinitionId: Items.WOOD_STICK,
        requiredAmount: 1
      },
      {
        itemDefinitionId: Items.NAIL,
        requiredAmount: 4
      }
    ]
  },
  [Items.BACKPACK_FRAME]: {
    filterId: FilterIds.COMPONENT,
    components: [
      {
        itemDefinitionId: Items.METAL_BRACKET,
        requiredAmount: 3
      },
      {
        itemDefinitionId: Items.WOOD_STICK,
        requiredAmount: 3
      },
      {
        itemDefinitionId: Items.NAIL,
        requiredAmount: 3
      }
    ]
  },
  [Items.BANDAGE]: {
    filterId: FilterIds.SURVIVAL,
    components: [
      {
        itemDefinitionId: Items.CLOTH,
        requiredAmount: 2
      }
    ]
  },
  [Items.BARBED_WIRE]: {
    filterId: FilterIds.SURVIVAL,
    components: [
      {
        itemDefinitionId: Items.WOOD_PLANK,
        requiredAmount: 4
      },
      {
        itemDefinitionId: Items.SHARD_METAL,
        requiredAmount: 16
      }
    ]
  },
  [Items.BARBEQUE]: {
    filterId: FilterIds.HOUSING,
    components: [
      {
        itemDefinitionId: Items.METAL_PIPE,
        requiredAmount: 3
      },
      {
        itemDefinitionId: Items.METAL_SCRAP,
        requiredAmount: 8
      }
    ]
  },
  [Items.BANDANA_BASIC]: {
    filterId: FilterIds.SURVIVAL,
    components: [
      {
        itemDefinitionId: Items.CLOTH,
        requiredAmount: 2
      }
    ]
  },
  [Items.SHACK_BASIC]: {
    filterId: FilterIds.HOUSING,
    components: [
      {
        itemDefinitionId: Items.WOOD_PLANK,
        requiredAmount: 20
      },
      {
        itemDefinitionId: Items.WOOD_STICK,
        requiredAmount: 10
      }
    ]
  },
  [Items.DOOR_BASIC]: {
    filterId: FilterIds.HOUSING,
    components: [
      {
        itemDefinitionId: Items.WOOD_PLANK,
        requiredAmount: 3
      },
      {
        itemDefinitionId: Items.WOOD_STICK,
        requiredAmount: 5
      }
    ]
  },
  [Items.SANDWICH_BEAR]: {
    filterId: FilterIds.SURVIVAL,
    components: [
      {
        itemDefinitionId: Items.STEAK_BEAR,
        requiredAmount: 1
      },
      {
        itemDefinitionId: Items.SURVIVAL_BREAD,
        requiredAmount: 2
      }
    ]
  },
  [Items.STEAK_BEAR]: {
    filterId: FilterIds.COOKING,
    components: [
      {
        itemDefinitionId: Items.MEAT_BEAR,
        requiredAmount: 1
      }
    ]
  },
  [Items.BEE_BOX]: {
    filterId: FilterIds.HOUSING,
    components: [
      {
        itemDefinitionId: Items.WOOD_PLANK,
        requiredAmount: 4
      },
      {
        itemDefinitionId: Items.NAIL,
        requiredAmount: 4
      },
      {
        itemDefinitionId: Items.METAL_BRACKET,
        requiredAmount: 4
      },
      {
        itemDefinitionId: Items.TARP,
        requiredAmount: 1
      }
    ]
  },
  [Items.FUEL_BIOFUEL]: {
    filterId: FilterIds.COOKING,
    components: [
      {
        itemDefinitionId: Items.WATER_EMPTY,
        requiredAmount: 1
      },
      {
        itemDefinitionId: Items.ANIMAL_FAT,
        requiredAmount: 1
      }
    ]
  },
  [Items.BLACKBERRY_JUICE]: {
    filterId: FilterIds.SURVIVAL,
    components: [
      {
        itemDefinitionId: Items.BLACKBERRY,
        requiredAmount: 5
      },
      {
        itemDefinitionId: Items.WATER_PURE,
        requiredAmount: 1
      }
    ]
  },
  [Items.BLACKBERRY_PIE]: {
    filterId: FilterIds.COOKING,
    components: [
      {
        itemDefinitionId: Items.SUGAR,
        requiredAmount: 1
      },
      {
        itemDefinitionId: Items.BLACKBERRY,
        requiredAmount: 8
      },
      {
        itemDefinitionId: Items.FLOUR,
        requiredAmount: 1
      }
    ]
  },
  [Items.BOW_DRILL]: {
    filterId: FilterIds.SURVIVAL,
    components: [
      {
        itemDefinitionId: Items.CLOTH,
        requiredAmount: 1
      },
      {
        itemDefinitionId: Items.WOOD_PLANK,
        requiredAmount: 1
      },
      {
        itemDefinitionId: Items.WOOD_STICK,
        requiredAmount: 1
      }
    ]
  },
  [Items.CAMPFIRE]: {
    filterId: FilterIds.SURVIVAL,
    components: [
      {
        itemDefinitionId: Items.WOOD_LOG,
        requiredAmount: 2
      }
    ]
  },
  [Items.CANDLE]: {
    filterId: FilterIds.HOUSING,
    components: [
      {
        itemDefinitionId: Items.CLOTH,
        requiredAmount: 1
      },
      {
        itemDefinitionId: Items.WAX,
        requiredAmount: 2
      }
    ]
  },
  [Items.PHONE_CHARGED]: {
    filterId: FilterIds.SURVIVAL,
    components: [
      {
        itemDefinitionId: Items.PHONE_DEAD,
        requiredAmount: 1
      },
      {
        itemDefinitionId: Items.PHONE_BATTERY,
        requiredAmount: 3
      }
    ]
  },
  [Items.COFFEE]: {
    filterId: FilterIds.COOKING,
    components: [
      {
        itemDefinitionId: Items.GROUND_COFFEE,
        requiredAmount: 1
      },
      {
        itemDefinitionId: Items.WATER_PURE,
        requiredAmount: 1
      }
    ]
  },
  [Items.COFFEE_SUGAR]: {
    filterId: FilterIds.SURVIVAL,
    components: [
      {
        itemDefinitionId: Items.COFFEE,
        requiredAmount: 1
      },
      {
        itemDefinitionId: Items.SUGAR,
        requiredAmount: 1
      }
    ]
  },
  [Items.WEAPON_COMBATKNIFE]: {
    filterId: FilterIds.WEAPONS,
    components: [
      {
        itemDefinitionId: Items.METAL_SHEET,
        requiredAmount: 1
      },
      {
        itemDefinitionId: Items.WOOD_STICK,
        requiredAmount: 1
      }
    ],
    requireWorkbench: true
  },
  [Items.STEAK_RABBIT]: {
    filterId: FilterIds.COOKING,
    components: [
      {
        itemDefinitionId: Items.MEAT_RABBIT,
        requiredAmount: 1
      }
    ]
  },
  [Items.CORN_MASH]: {
    filterId: FilterIds.SURVIVAL,
    components: [
      {
        itemDefinitionId: Items.CORN,
        requiredAmount: 1
      },
      {
        itemDefinitionId: Items.WATER_PURE,
        requiredAmount: 1
      },
      {
        itemDefinitionId: Items.YEAST,
        requiredAmount: 1
      }
    ]
  },
  [Items.FOUNDATION]: {
    filterId: FilterIds.SURVIVAL,
    components: [
      {
        itemDefinitionId: Items.WOOD_LOG,
        requiredAmount: 4
      },
      {
        itemDefinitionId: Items.WOOD_PLANK,
        requiredAmount: 16
      },
      {
        itemDefinitionId: Items.NAIL,
        requiredAmount: 20
      },
      {
        itemDefinitionId: Items.METAL_BRACKET,
        requiredAmount: 8
      }
    ]
  },
  [Items.JERKY_DEER]: {
    filterId: FilterIds.COOKING,
    components: [
      {
        itemDefinitionId: Items.MEAT_VENISON,
        requiredAmount: 1
      },
      {
        itemDefinitionId: Items.SALT,
        requiredAmount: 1
      }
    ]
  },
  [Items.SANDWICH_DEER]: {
    filterId: FilterIds.SURVIVAL,
    components: [
      {
        itemDefinitionId: Items.STEAK_DEER,
        requiredAmount: 1
      },
      {
        itemDefinitionId: Items.SURVIVAL_BREAD,
        requiredAmount: 1
      }
    ]
  },
  [Items.DEER_SCENT]: {
    filterId: FilterIds.SURVIVAL,
    components: [
      {
        itemDefinitionId: Items.CLOTH,
        requiredAmount: 1
      },
      {
        itemDefinitionId: Items.DEER_BLADDER,
        requiredAmount: 1
      }
    ]
  },
  [Items.STEAK_DEER]: {
    filterId: FilterIds.COOKING,
    components: [
      {
        itemDefinitionId: Items.MEAT_VENISON,
        requiredAmount: 1
      }
    ]
  },
  [Items.WEAPON_HAMMER_DEMOLITION]: {
    filterId: FilterIds.WEAPONS,
    components: [
      {
        itemDefinitionId: Items.METAL_PIPE,
        requiredAmount: 1
      }
    ]
  },
  [Items.DEW_COLLECTOR]: {
    filterId: FilterIds.HOUSING,
    components: [
      {
        itemDefinitionId: Items.WOOD_PLANK,
        requiredAmount: 4
      },
      {
        itemDefinitionId: Items.WOOD_STICK,
        requiredAmount: 4
      },
      {
        itemDefinitionId: Items.TARP,
        requiredAmount: 1
      }
    ]
  },
  [Items.BANDAGE_DRESSED]: {
    filterId: FilterIds.SURVIVAL,
    bundleCount: 5,
    leftOverItems: [Items.WATER_EMPTY],
    components: [
      {
        itemDefinitionId: Items.BANDAGE,
        requiredAmount: 5
      },
      {
        itemDefinitionId: Items.HONEY,
        requiredAmount: 1
      }
    ]
  },
  [Items.FUEL_ETHANOL]: {
    filterId: FilterIds.WEAPONS,
    components: [
      {
        itemDefinitionId: Items.CORN,
        requiredAmount: 1
      },
      {
        itemDefinitionId: Items.WATER_PURE,
        requiredAmount: 1
      },
      {
        itemDefinitionId: Items.YEAST,
        requiredAmount: 1
      }
    ]
  },
  [Items.WEAPON_TORCH_ETHANOL]: {
    filterId: FilterIds.WEAPONS,
    components: [
      {
        itemDefinitionId: Items.CLOTH,
        requiredAmount: 1
      },
      {
        itemDefinitionId: Items.WOOD_STICK,
        requiredAmount: 1
      },
      {
        itemDefinitionId: Items.FUEL_ETHANOL,
        requiredAmount: 1
      }
    ]
  },
  [Items.AMMO_ARROW_EXPLOSIVE]: {
    filterId: FilterIds.WEAPONS,
    bundleCount: 10,
    components: [
      {
        itemDefinitionId: Items.AMMO_ARROW,
        requiredAmount: 10
      },
      {
        itemDefinitionId: Items.DUCT_TAPE,
        requiredAmount: 1
      },
      {
        itemDefinitionId: Items.AMMO_12GA,
        requiredAmount: 10
      }
    ]
  },
  [Items.GLOVES_FINGERLESS]: {
    filterId: FilterIds.SURVIVAL,
    components: [
      {
        itemDefinitionId: Items.CLOTH,
        requiredAmount: 2
      },
      {
        itemDefinitionId: Items.SHARD_METAL,
        requiredAmount: 2
      }
    ]
  },
  [Items.TRAP_FIRE]: {
    filterId: FilterIds.WEAPONS,
    components: [
      {
        itemDefinitionId: Items.WEAPON_MOLOTOV,
        requiredAmount: 3
      },
      {
        itemDefinitionId: Items.TRAP_IGNITION_KIT,
        requiredAmount: 1
      }
    ]
  },

  [Items.FIRST_AID]: {
    filterId: FilterIds.SURVIVAL,
    components: [
      {
        itemDefinitionId: Items.BANDAGE,
        requiredAmount: 1
      },
      {
        itemDefinitionId: Items.SALINE,
        requiredAmount: 1
      }
    ]
  },
  [Items.AMMO_ARROW_FLAMING]: {
    filterId: FilterIds.WEAPONS,
    bundleCount: 10,
    components: [
      {
        itemDefinitionId: Items.CLOTH,
        requiredAmount: 2
      },
      {
        itemDefinitionId: Items.FUEL_BIOFUEL,
        requiredAmount: 1
      },
      {
        itemDefinitionId: Items.AMMO_ARROW,
        requiredAmount: 10
      }
    ]
  },
  [Items.FLARE]: {
    filterId: FilterIds.SURVIVAL,
    components: [
      {
        itemDefinitionId: Items.CLOTH,
        requiredAmount: 1
      },
      {
        itemDefinitionId: Items.FERTILIZER,
        requiredAmount: 1
      },
      {
        itemDefinitionId: Items.SUGAR,
        requiredAmount: 1
      }
    ]
  },
  [Items.TRAP_FLASH]: {
    filterId: FilterIds.WEAPONS,
    components: [
      {
        itemDefinitionId: Items.GRENADE_FLASH,
        requiredAmount: 3
      },
      {
        itemDefinitionId: Items.TRAP_IGNITION_KIT,
        requiredAmount: 1
      }
    ]
  },
  [Items.FLOUR]: {
    filterId: FilterIds.SURVIVAL,
    components: [
      {
        itemDefinitionId: Items.WHEAT,
        requiredAmount: 1
      }
    ]
  },
  [Items.FOUNDATION_EXPANSION]: {
    filterId: FilterIds.HOUSING,
    components: [
      {
        itemDefinitionId: Items.WOOD_LOG,
        requiredAmount: 2
      },
      {
        itemDefinitionId: Items.WOOD_PLANK,
        requiredAmount: 8
      },
      {
        itemDefinitionId: Items.NAIL,
        requiredAmount: 4
      },
      {
        itemDefinitionId: Items.METAL_BRACKET,
        requiredAmount: 4
      }
    ]
  },
  [Items.FOUNDATION_RAMP]: {
    filterId: FilterIds.HOUSING,
    components: [
      {
        itemDefinitionId: Items.WOOD_PLANK,
        requiredAmount: 12
      },
      {
        itemDefinitionId: Items.NAIL,
        requiredAmount: 20
      },
      {
        itemDefinitionId: Items.METAL_BRACKET,
        requiredAmount: 4
      }
    ]
  },
  [Items.FOUNDATION_STAIRS]: {
    filterId: FilterIds.HOUSING,
    components: [
      {
        itemDefinitionId: Items.WOOD_PLANK,
        requiredAmount: 20
      },
      {
        itemDefinitionId: Items.NAIL,
        requiredAmount: 12
      },
      {
        itemDefinitionId: Items.METAL_BRACKET,
        requiredAmount: 4
      }
    ]
  },
  [Items.BACKPACK_FRAMED]: {
    filterId: FilterIds.SURVIVAL,
    components: [
      {
        itemDefinitionId: Items.CLOTH,
        requiredAmount: 8
      },
      {
        itemDefinitionId: Items.TWINE,
        requiredAmount: 1
      },
      {
        itemDefinitionId: Items.BACKPACK_FRAME,
        requiredAmount: 1
      }
    ]
  },
  [Items.FURNACE]: {
    filterId: FilterIds.HOUSING,
    components: [
      {
        itemDefinitionId: Items.METAL_SCRAP,
        requiredAmount: 8
      },
      {
        itemDefinitionId: Items.METAL_BRACKET,
        requiredAmount: 1
      }
    ]
  },
  [Items.TRAP_GAS]: {
    filterId: FilterIds.WEAPONS,
    components: [
      {
        itemDefinitionId: Items.GRENADE_GAS,
        requiredAmount: 3
      },
      {
        itemDefinitionId: Items.TRAP_IGNITION_KIT,
        requiredAmount: 1
      }
    ]
  },
  [Items.GROUND_TAMPER]: {
    filterId: FilterIds.HOUSING,
    components: [
      {
        itemDefinitionId: Items.METAL_SHEET,
        requiredAmount: 2
      },
      {
        itemDefinitionId: Items.NAIL,
        requiredAmount: 4
      },
      {
        itemDefinitionId: Items.METAL_BRACKET,
        requiredAmount: 2
      },
      {
        itemDefinitionId: Items.WEAPON_BRANCH,
        requiredAmount: 1
      }
    ]
  },
  [Items.GROUND_TILLER]: {
    filterId: FilterIds.HOUSING,
    components: [
      {
        itemDefinitionId: Items.METAL_PIPE,
        requiredAmount: 1
      },
      {
        itemDefinitionId: Items.WOOD_STICK,
        requiredAmount: 1
      },
      {
        itemDefinitionId: Items.SHARD_METAL,
        requiredAmount: 4
      }
    ]
  },

  // probably subject to change in the future
  [Items.GUN_PART]: {
    filterId: FilterIds.WEAPONS,
    bundleCount: 4,
    components: [
      {
        itemDefinitionId: Items.WEAPON_AR15,
        requiredAmount: 1
      }
    ]
  },

  [Items.REPAIR_KIT_GUN]: {
    filterId: FilterIds.WEAPONS,
    components: [
      {
        itemDefinitionId: Items.GUN_PART,
        requiredAmount: 2
      }
    ]
  },
  [Items.UPGRADE_KIT_GUN]: {
    filterId: FilterIds.WEAPONS,
    components: [
      {
        itemDefinitionId: Items.SHARD_METAL,
        requiredAmount: 5
      },
      {
        itemDefinitionId: Items.REPAIR_KIT_GUN,
        requiredAmount: 1
      }
    ]
  },
  [Items.GUNPOWDER]: {
    filterId: FilterIds.COMPONENT,
    components: [
      {
        itemDefinitionId: Items.FERTILIZER,
        requiredAmount: 1
      },
      {
        itemDefinitionId: Items.CHARCOAL,
        requiredAmount: 1
      }
    ]
  },
  [Items.WEAPON_HAMMER]: {
    filterId: FilterIds.WEAPONS,
    components: [
      {
        itemDefinitionId: Items.METAL_BAR,
        requiredAmount: 1
      },
      {
        itemDefinitionId: Items.WOOD_STICK,
        requiredAmount: 1
      }
    ]
  },
  [Items.HAND_SHOVEL]: {
    filterId: FilterIds.SURVIVAL,
    components: [
      {
        itemDefinitionId: Items.METAL_SHEET,
        requiredAmount: 1
      },
      {
        itemDefinitionId: Items.WOOD_STICK,
        requiredAmount: 1
      }
    ]
  },
  [Items.BLACKBERRY_HANDFUL]: {
    filterId: FilterIds.SURVIVAL,
    components: [
      {
        itemDefinitionId: Items.BLACKBERRY,
        requiredAmount: 10
      }
    ]
  },
  [Items.ANTI_VIRAL_BOTTLE]: {
    filterId: FilterIds.COMPONENT,
    components: [
      {
        itemDefinitionId: Items.HANDWRITTEN_NOTE_CAROLINE,
        requiredAmount: 1
      },
      {
        itemDefinitionId: Items.ANTI_VIRAL_BOTTLE_EMPTY,
        requiredAmount: 3
      }
    ]
  },
  [Items.IED]: {
    filterId: FilterIds.WEAPONS,
    components: [
      {
        itemDefinitionId: Items.CLOTH,
        requiredAmount: 1
      },
      {
        itemDefinitionId: Items.LANDMINE,
        requiredAmount: 1
      }
    ],
    requireWorkbench: true
  },
  [Items.COMPASS_IMPROVISED]: {
    filterId: FilterIds.SURVIVAL,
    components: [
      {
        itemDefinitionId: Items.SHARD_METAL,
        requiredAmount: 1
      },
      {
        itemDefinitionId: Items.WATER_PURE,
        requiredAmount: 1
      }
    ]
  },
  [Items.SKINNING_KNIFE]: {
    filterId: FilterIds.SURVIVAL,
    components: [
      {
        itemDefinitionId: Items.METAL_SCRAP,
        requiredAmount: 3
      },
      {
        itemDefinitionId: Items.WOOD_STICK,
        requiredAmount: 1
      }
    ]
  },
  [Items.LANDMINE]: {
    filterId: FilterIds.WEAPONS,
    components: [
      {
        itemDefinitionId: Items.GUNPOWDER,
        requiredAmount: 1
      },
      {
        itemDefinitionId: Items.METAL_SHEET,
        requiredAmount: 1
      },
      {
        itemDefinitionId: Items.SHARD_METAL,
        requiredAmount: 1
      }
    ],
    requireWorkbench: true
  },
  [Items.SHELTER_LARGE]: {
    filterId: FilterIds.HOUSING,
    components: [
      {
        itemDefinitionId: Items.METAL_SHEET,
        requiredAmount: 8
      },
      {
        itemDefinitionId: Items.WOOD_PLANK,
        requiredAmount: 8
      },
      {
        itemDefinitionId: Items.NAIL,
        requiredAmount: 16
      },
      {
        itemDefinitionId: Items.METAL_BRACKET,
        requiredAmount: 8
      }
    ]
  },
  [Items.LOOKOUT_TOWER]: {
    filterId: FilterIds.HOUSING,
    components: [
      {
        itemDefinitionId: Items.METAL_SHEET,
        requiredAmount: 4
      },
      {
        itemDefinitionId: Items.WOOD_PLANK,
        requiredAmount: 20
      },
      {
        itemDefinitionId: Items.NAIL,
        requiredAmount: 40
      }
    ]
  },
  [Items.WEAPON_MACHETE01]: {
    filterId: FilterIds.WEAPONS,
    components: [
      {
        itemDefinitionId: Items.METAL_SHEET,
        requiredAmount: 2
      },
      {
        itemDefinitionId: Items.WOOD_PLANK,
        requiredAmount: 2
      }
    ],
    requireWorkbench: true
  },
  [Items.WEAPON_BOW_MAKESHIFT]: {
    filterId: FilterIds.WEAPONS,
    components: [
      {
        itemDefinitionId: Items.CLOTH,
        requiredAmount: 1
      },
      {
        itemDefinitionId: Items.WOOD_STICK,
        requiredAmount: 1
      }
    ]
  },
  [Items.WEAPON_HATCHET_MAKESHIFT]: {
    filterId: FilterIds.WEAPONS,
    components: [
      {
        itemDefinitionId: Items.METAL_SCRAP,
        requiredAmount: 1
      },
      {
        itemDefinitionId: Items.WOOD_STICK,
        requiredAmount: 1
      }
    ]
  },
  [Items.METAL_BAR]: {
    filterId: FilterIds.FURNACE,
    components: [
      {
        itemDefinitionId: Items.METAL_SCRAP,
        requiredAmount: 1
      }
    ]
  },
  [Items.METAL_BRACKET]: {
    filterId: FilterIds.COMPONENT,
    components: [
      {
        itemDefinitionId: Items.METAL_SCRAP,
        requiredAmount: 1
      }
    ]
  },
  [Items.DOOR_METAL]: {
    filterId: FilterIds.HOUSING,
    components: [
      {
        itemDefinitionId: Items.METAL_SHEET,
        requiredAmount: 2
      },
      {
        itemDefinitionId: Items.METAL_BRACKET,
        requiredAmount: 2
      }
    ]
  },
  [Items.METAL_DOORWAY]: {
    filterId: FilterIds.HOUSING,
    components: [
      {
        itemDefinitionId: Items.METAL_SHEET,
        requiredAmount: 4
      },
      {
        itemDefinitionId: Items.WOOD_PLANK,
        requiredAmount: 4
      },
      {
        itemDefinitionId: Items.METAL_BRACKET,
        requiredAmount: 2
      }
    ]
  },
  [Items.METAL_GATE]: {
    filterId: FilterIds.HOUSING,
    components: [
      {
        itemDefinitionId: Items.METAL_SHEET,
        requiredAmount: 2
      },
      {
        itemDefinitionId: Items.WOOD_PLANK,
        requiredAmount: 2
      },
      {
        itemDefinitionId: Items.METAL_BRACKET,
        requiredAmount: 2
      }
    ]
  },
  [Items.SHARD_METAL]: {
    filterId: FilterIds.COMPONENT,
    bundleCount: 4,
    components: [
      {
        itemDefinitionId: Items.METAL_SCRAP,
        requiredAmount: 1
      }
    ]
  },
  [Items.METAL_SHEET]: {
    filterId: FilterIds.COMPONENT,
    components: [
      {
        itemDefinitionId: Items.METAL_BAR,
        requiredAmount: 2
      }
    ],
    requireWorkbench: true
  },
  [Items.METAL_WALL]: {
    filterId: FilterIds.HOUSING,
    components: [
      {
        itemDefinitionId: Items.METAL_SHEET,
        requiredAmount: 4
      },
      {
        itemDefinitionId: Items.WOOD_PLANK,
        requiredAmount: 4
      }
    ]
  },
  [Items.WEAPON_AK47_MODIFIED]: {
    filterId: FilterIds.WEAPONS,
    components: [
      {
        itemDefinitionId: Items.WEAPON_AK47,
        requiredAmount: 1
      },
      {
        itemDefinitionId: Items.UPGRADE_KIT_GUN,
        requiredAmount: 1
      }
    ]
  },
  [Items.WEAPON_MOLOTOV]: {
    filterId: FilterIds.WEAPONS,
    components: [
      {
        itemDefinitionId: Items.CLOTH,
        requiredAmount: 1
      },
      {
        itemDefinitionId: Items.MOONSHINE,
        requiredAmount: 1
      }
    ]
  },
  [Items.NAIL]: {
    filterId: FilterIds.COMPONENT,
    bundleCount: 4,
    components: [
      {
        itemDefinitionId: Items.SHARD_METAL,
        requiredAmount: 1
      }
    ]
  },
  [Items.FLARE_PARACHUTE]: {
    filterId: FilterIds.SURVIVAL,
    components: [
      {
        itemDefinitionId: Items.CLOTH,
        requiredAmount: 1
      },
      {
        itemDefinitionId: Items.FLARE,
        requiredAmount: 1
      }
    ]
  },
  [Items.METAL_PIPE]: {
    filterId: FilterIds.COMPONENT,
    components: [
      {
        itemDefinitionId: Items.METAL_SHEET,
        requiredAmount: 2
      }
    ],
    requireWorkbench: true
  },
  [Items.SHARD_PLASTIC]: {
    filterId: FilterIds.COMPONENT,
    bundleCount: 5,
    components: [
      {
        itemDefinitionId: Items.WATER_EMPTY,
        requiredAmount: 1
      }
    ]
  },
  [Items.ARMOR_PLATED]: {
    filterId: FilterIds.SURVIVAL,
    components: [
      {
        itemDefinitionId: Items.CLOTH,
        requiredAmount: 10
      },
      {
        itemDefinitionId: Items.METAL_SHEET,
        requiredAmount: 6
      },
      {
        itemDefinitionId: Items.WOOD_PLANK,
        requiredAmount: 6
      },
      {
        itemDefinitionId: Items.DUCT_TAPE,
        requiredAmount: 1
      }
    ]
  },
  // TODO: find PUNJI_STICK_ROW def for 20 sticks
  [Items.PUNJI_STICKS]: {
    filterId: FilterIds.SURVIVAL,
    components: [
      {
        itemDefinitionId: Items.WOOD_STICK,
        requiredAmount: 8
      }
    ]
  },
  [Items.WATER_PURE]: {
    filterId: FilterIds.COOKING,
    components: [
      {
        itemDefinitionId: Items.WATER_STAGNANT,
        requiredAmount: 1
      }
    ]
  },
  [Items.SANDWICH_RABBIT]: {
    filterId: FilterIds.SURVIVAL,
    components: [
      {
        itemDefinitionId: Items.STEAK_RABBIT,
        requiredAmount: 1
      },
      {
        itemDefinitionId: Items.SURVIVAL_BREAD,
        requiredAmount: 1
      }
    ]
  },
  [Items.STEW_RABBIT]: {
    filterId: FilterIds.COOKING,
    components: [
      {
        itemDefinitionId: Items.SALT,
        requiredAmount: 1
      },
      {
        itemDefinitionId: Items.STEAK_RABBIT,
        requiredAmount: 1
      },
      {
        itemDefinitionId: Items.WATER_PURE,
        requiredAmount: 1
      }
    ]
  },
  [Items.REPAIR_BOX]: {
    filterId: FilterIds.HOUSING,
    components: [
      {
        itemDefinitionId: Items.WOOD_PLANK,
        requiredAmount: 8
      },
      {
        itemDefinitionId: Items.NAIL,
        requiredAmount: 6
      },
      {
        itemDefinitionId: Items.METAL_BRACKET,
        requiredAmount: 6
      }
    ]
  },
  [Items.RIGGED_LIGHT]: {
    filterId: FilterIds.SURVIVAL,
    components: [
      {
        itemDefinitionId: Items.HEADLIGHTS_OFFROADER,
        requiredAmount: 1
      },
      {
        itemDefinitionId: Items.BATTERY,
        requiredAmount: 1
      }
    ]
  },
  [Items.CORN_ROASTED]: {
    filterId: FilterIds.COOKING,
    components: [
      {
        itemDefinitionId: Items.CORN,
        requiredAmount: 1
      }
    ]
  },
  [Items.SALINE]: {
    filterId: FilterIds.COMPONENT,
    components: [
      {
        itemDefinitionId: Items.SALT,
        requiredAmount: 1
      },
      {
        itemDefinitionId: Items.WATER_PURE,
        requiredAmount: 1
      }
    ]
  },
  [Items.BACKPACK_SATCHEL]: {
    filterId: FilterIds.SURVIVAL,
    components: [
      {
        itemDefinitionId: Items.CLOTH,
        requiredAmount: 6
      }
    ]
  },
  [Items.GRENADE_SCREAM]: {
    filterId: FilterIds.WEAPONS,
    components: [
      {
        itemDefinitionId: Items.GRENADE_SONIC_BROKEN,
        requiredAmount: 1
      },
      {
        itemDefinitionId: Items.VIAL_H1Z1_B_PLASMA,
        requiredAmount: 1
      }
    ]
  },
  [Items.SHACK]: {
    filterId: FilterIds.HOUSING,
    components: [
      {
        itemDefinitionId: Items.METAL_SHEET,
        requiredAmount: 2
      },
      {
        itemDefinitionId: Items.WOOD_PLANK,
        requiredAmount: 8
      },
      {
        itemDefinitionId: Items.NAIL,
        requiredAmount: 16
      }
    ]
  },
  [Items.SHELTER]: {
    filterId: FilterIds.HOUSING,
    components: [
      {
        itemDefinitionId: Items.METAL_SHEET,
        requiredAmount: 8
      },
      {
        itemDefinitionId: Items.WOOD_PLANK,
        requiredAmount: 8
      },
      {
        itemDefinitionId: Items.NAIL,
        requiredAmount: 16
      }
    ]
  },
  [Items.TRAP_SHOCK]: {
    filterId: FilterIds.WEAPONS,
    components: [
      {
        itemDefinitionId: Items.METAL_SHEET,
        requiredAmount: 5
      },
      {
        itemDefinitionId: Items.BARBED_WIRE,
        requiredAmount: 3
      },
      {
        itemDefinitionId: Items.TRAP_IGNITION_KIT,
        requiredAmount: 1
      },
      {
        itemDefinitionId: Items.BATTERIES_AA,
        requiredAmount: 2
      }
    ]
  },

  // MEDICAL SKINS HERE TODO

  [Items.SLEEPING_MAT]: {
    filterId: FilterIds.SURVIVAL,
    components: [
      {
        itemDefinitionId: Items.CLOTH,
        requiredAmount: 10
      },
      {
        itemDefinitionId: Items.TARP,
        requiredAmount: 1
      }
    ]
  },
  // disabled for now as crashes game client
  /*[Items.SHACK_SMALL]: {
    filterId: FilterIds.HOUSING,
    components: [
      {
        itemDefinitionId: Items.WOOD_PLANK,
        requiredAmount: 4,
      },
      {
        itemDefinitionId: Items.NAIL,
        requiredAmount: 4,
      },
      {
        itemDefinitionId: Items.METAL_BRACKET,
        requiredAmount: 2,
      },
    ],
  },*/
  [Items.FLARE_SMOKE]: {
    filterId: FilterIds.SURVIVAL,
    components: [
      {
        itemDefinitionId: Items.CLOTH,
        requiredAmount: 1
      },
      {
        itemDefinitionId: Items.FERTILIZER,
        requiredAmount: 1
      },
      {
        itemDefinitionId: Items.SUGAR,
        requiredAmount: 1
      }
    ]
  },
  [Items.SNARE]: {
    filterId: FilterIds.SURVIVAL,
    components: [
      {
        itemDefinitionId: Items.METAL_SHEET,
        requiredAmount: 1
      },
      {
        itemDefinitionId: Items.SHARD_METAL,
        requiredAmount: 8
      }
    ],
    requireWorkbench: true
  },
  [Items.STORAGE_BOX]: {
    filterId: FilterIds.HOUSING,
    components: [
      {
        itemDefinitionId: Items.WOOD_PLANK,
        requiredAmount: 6
      },
      {
        itemDefinitionId: Items.NAIL,
        requiredAmount: 4
      },
      {
        itemDefinitionId: Items.METAL_BRACKET,
        requiredAmount: 4
      }
    ]
  },
  [Items.STRUCTURE_STAIRS]: {
    filterId: FilterIds.HOUSING,
    components: [
      {
        itemDefinitionId: Items.WOOD_PLANK,
        requiredAmount: 12
      },
      {
        itemDefinitionId: Items.NAIL,
        requiredAmount: 8
      },
      {
        itemDefinitionId: Items.METAL_BRACKET,
        requiredAmount: 4
      }
    ]
  },
  [Items.SURVIVAL_BORSCHT]: {
    filterId: FilterIds.COOKING,
    components: [
      {
        itemDefinitionId: Items.CANNED_FOOD01,
        requiredAmount: 1
      },
      {
        itemDefinitionId: Items.SALT,
        requiredAmount: 1
      },
      {
        itemDefinitionId: Items.WATER_PURE,
        requiredAmount: 1
      }
    ]
  },
  [Items.SURVIVAL_BREAD]: {
    filterId: FilterIds.COOKING,
    components: [
      {
        itemDefinitionId: Items.WATER_PURE,
        requiredAmount: 1
      },
      {
        itemDefinitionId: Items.YEAST,
        requiredAmount: 1
      },
      {
        itemDefinitionId: Items.FLOUR,
        requiredAmount: 1
      }
    ]
  },
  [Items.SWIZZLE]: {
    filterId: FilterIds.COOKING,
    components: [
      {
        itemDefinitionId: Items.SUGAR,
        requiredAmount: 1
      },
      {
        itemDefinitionId: Items.WATER_PURE,
        requiredAmount: 1
      },
      {
        itemDefinitionId: Items.COLD_MEDICINE,
        requiredAmount: 1
      }
    ]
  },
  [Items.SYRINGE_H1Z1_REDUCER]: {
    filterId: FilterIds.SURVIVAL,
    components: [
      {
        itemDefinitionId: Items.SYRINGE_EMPTY,
        requiredAmount: 1
      },
      {
        itemDefinitionId: Items.VIAL_H1Z1_REDUCER,
        requiredAmount: 1
      }
    ]
  },
  [Items.GHILLIE_SUIT_TAN]: {
    filterId: FilterIds.SURVIVAL,
    components: [
      {
        itemDefinitionId: Items.CLOTH,
        requiredAmount: 20
      },
      {
        itemDefinitionId: Items.DUCT_TAPE,
        requiredAmount: 2
      },
      {
        itemDefinitionId: Items.TWINE,
        requiredAmount: 4
      }
    ]
  },
  [Items.WEAPON_TORCH]: {
    filterId: FilterIds.WEAPONS,
    components: [
      {
        itemDefinitionId: Items.CLOTH,
        requiredAmount: 1
      },
      {
        itemDefinitionId: Items.ANIMAL_FAT,
        requiredAmount: 1
      },
      {
        itemDefinitionId: Items.WEAPON_BRANCH,
        requiredAmount: 1
      }
    ]
  },
  [Items.TRAP_IGNITION_KIT]: {
    filterId: FilterIds.COMPONENT,
    components: [
      {
        itemDefinitionId: Items.GUNPOWDER,
        requiredAmount: 2
      },
      {
        itemDefinitionId: Items.WOOD_STICK,
        requiredAmount: 5
      },
      {
        itemDefinitionId: Items.SHARD_METAL,
        requiredAmount: 12
      },
      {
        itemDefinitionId: Items.TWINE,
        requiredAmount: 2
      }
    ]
  },
  [Items.SHELTER_UPPER_LARGE]: {
    filterId: FilterIds.HOUSING,
    components: [
      {
        itemDefinitionId: Items.METAL_SHEET,
        requiredAmount: 6
      },
      {
        itemDefinitionId: Items.WOOD_PLANK,
        requiredAmount: 8
      },
      {
        itemDefinitionId: Items.NAIL,
        requiredAmount: 16
      },
      {
        itemDefinitionId: Items.METAL_BRACKET,
        requiredAmount: 8
      }
    ]
  },
  [Items.SHELTER_UPPER]: {
    filterId: FilterIds.HOUSING,
    components: [
      {
        itemDefinitionId: Items.METAL_SHEET,
        requiredAmount: 6
      },
      {
        itemDefinitionId: Items.NAIL,
        requiredAmount: 16
      },
      {
        itemDefinitionId: Items.METAL_BRACKET,
        requiredAmount: 8
      }
    ]
  },
  [Items.STRUCTURE_STAIRS_UPPER]: {
    filterId: FilterIds.HOUSING,
    components: [
      {
        itemDefinitionId: Items.WOOD_PLANK,
        requiredAmount: 8
      },
      {
        itemDefinitionId: Items.WOOD_STICK,
        requiredAmount: 8
      },
      {
        itemDefinitionId: Items.NAIL,
        requiredAmount: 8
      },
      {
        itemDefinitionId: Items.METAL_BRACKET,
        requiredAmount: 4
      }
    ]
  },
  [Items.METAL_WALL_UPPER]: {
    filterId: FilterIds.HOUSING,
    components: [
      {
        itemDefinitionId: Items.METAL_SHEET,
        requiredAmount: 4
      },
      {
        itemDefinitionId: Items.WOOD_PLANK,
        requiredAmount: 4
      }
    ]
  },

  [Items.WORKBENCH_WEAPON]: {
    filterId: FilterIds.HOUSING,
    components: [
      {
        itemDefinitionId: Items.METAL_SHEET,
        requiredAmount: 2
      },
      {
        itemDefinitionId: Items.METAL_SCRAP,
        requiredAmount: 4
      },
      {
        itemDefinitionId: Items.WOOD_PLANK,
        requiredAmount: 4
      },
      {
        itemDefinitionId: Items.WATER_EMPTY,
        requiredAmount: 1
      }
    ]
  },
  [Items.SANDWICH_WOLF]: {
    filterId: FilterIds.SURVIVAL,
    components: [
      {
        itemDefinitionId: Items.STEAK_WOLF,
        requiredAmount: 1
      },
      {
        itemDefinitionId: Items.SURVIVAL_BREAD,
        requiredAmount: 1
      }
    ]
  },
  [Items.STEAK_WOLF]: {
    filterId: FilterIds.COOKING,
    components: [
      {
        itemDefinitionId: Items.MEAT_WOLF,
        requiredAmount: 1
      }
    ]
  },
  [Items.WOOD_PLANK]: {
    filterId: FilterIds.COMPONENT,
    bundleCount: 2,
    components: [
      {
        itemDefinitionId: Items.WOOD_LOG,
        requiredAmount: 1
      }
    ]
  },
  [Items.WEAPON_SPEAR]: {
    filterId: FilterIds.WEAPONS,
    components: [
      {
        itemDefinitionId: Items.SHARD_METAL,
        requiredAmount: 1
      },
      {
        itemDefinitionId: Items.WEAPON_BRANCH,
        requiredAmount: 1
      }
    ]
  },
  [Items.WOOD_STICK]: {
    filterId: FilterIds.COMPONENT,
    bundleCount: 2,
    components: [
      {
        itemDefinitionId: Items.WOOD_PLANK,
        requiredAmount: 1
      }
    ]
  },
  [Items.AMMO_ARROW]: {
    filterId: FilterIds.WEAPONS,
    components: [
      {
        itemDefinitionId: Items.WOOD_STICK,
        requiredAmount: 1
      }
    ]
  },
  [Items.BARRICADE]: {
    filterId: FilterIds.SURVIVAL,
    components: [
      {
        itemDefinitionId: Items.WOOD_PLANK,
        requiredAmount: 6
      },
      {
        itemDefinitionId: Items.NAIL,
        requiredAmount: 12
      }
    ]
  },
  [Items.ARMOR_WOODEN]: {
    filterId: FilterIds.SURVIVAL,
    components: [
      {
        itemDefinitionId: Items.CLOTH,
        requiredAmount: 10
      },
      {
        itemDefinitionId: Items.WOOD_PLANK,
        requiredAmount: 6
      },
      {
        itemDefinitionId: Items.DUCT_TAPE,
        requiredAmount: 1
      }
    ]
  },
  [Items.WEAPON_BOW_WOOD]: {
    filterId: FilterIds.WEAPONS,
    components: [
      {
        itemDefinitionId: Items.CLOTH,
        requiredAmount: 1
      },
      {
        itemDefinitionId: Items.WOOD_STICK,
        requiredAmount: 2
      },
      {
        itemDefinitionId: Items.TWINE,
        requiredAmount: 1
      }
    ]
  },
  [Items.DOOR_WOOD]: {
    filterId: FilterIds.HOUSING,
    components: [
      {
        itemDefinitionId: Items.WOOD_PLANK,
        requiredAmount: 4
      },
      {
        itemDefinitionId: Items.NAIL,
        requiredAmount: 2
      },
      {
        itemDefinitionId: Items.METAL_BRACKET,
        requiredAmount: 2
      }
    ]
  },
  [Items.WORKBENCH]: {
    filterId: FilterIds.HOUSING,
    components: [
      {
        itemDefinitionId: Items.WOOD_PLANK,
        requiredAmount: 4
      },
      {
        itemDefinitionId: Items.WOOD_STICK,
        requiredAmount: 4
      },
      {
        itemDefinitionId: Items.NAIL,
        requiredAmount: 8
      },
      {
        itemDefinitionId: Items.METAL_BRACKET,
        requiredAmount: 4
      }
    ]
  },
  [Items.YEAST]: {
    filterId: FilterIds.COMPONENT,
    bundleCount: 2,
    leftOverItems: [Items.WATER_EMPTY],
    components: [
      {
        itemDefinitionId: Items.SUGAR,
        requiredAmount: 1
      },
      {
        itemDefinitionId: Items.WATER_PURE,
        requiredAmount: 1
      },
      {
        itemDefinitionId: Items.WHEAT,
        requiredAmount: 1
      }
    ]
  },

  /* CUSTOM */

  [Items.WEAPON_REPAIR_KIT]: {
    filterId: FilterIds.SURVIVAL,
    components: [
      {
        itemDefinitionId: Items.DUCT_TAPE,
        requiredAmount: 2
      },
      {
        itemDefinitionId: Items.TWINE,
        requiredAmount: 2
      },
      {
        itemDefinitionId: Items.SHARD_METAL,
        requiredAmount: 8
      }
    ]
  }
};
