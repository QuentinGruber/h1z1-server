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
  },
  43: {
    filterId: FilterIds.FURNACE,
    rewardId: Items.METAL_BAR,
    components: [
      {
        itemDefinitionId: Items.WEAPON_R380,
        requiredAmount: 1
      }
    ]
  },
  44: {
    filterId: FilterIds.FURNACE,
    rewardId: Items.METAL_BAR,
    components: [
      {
        itemDefinitionId: Items.WEAPON_GREENWOOD_SNIPER,
        requiredAmount: 1
      }
    ]
  },
  45: {
    filterId: FilterIds.FURNACE,
    rewardId: Items.METAL_BAR,
    components: [
      {
        itemDefinitionId: Items.WEAPON_PATRIOTIC_SNIPER,
        requiredAmount: 1
      }
    ]
  },
  46: {
    filterId: FilterIds.FURNACE,
    rewardId: Items.METAL_BAR,
    components: [
      {
        itemDefinitionId: Items.WEAPON_H1EMU_SNIPER,
        requiredAmount: 1
      }
    ]
  },
  47: {
    filterId: FilterIds.FURNACE,
    rewardId: Items.METAL_BAR,
    components: [
      {
        itemDefinitionId: Items.WEAPON_H1EMU_AR,
        requiredAmount: 1
      }
    ]
  },
  48: {
    filterId: FilterIds.FURNACE,
    rewardId: Items.METAL_BAR,
    components: [
      {
        itemDefinitionId: Items.WEAPON_ROSE_GARDEN_SHOTGUN,
        requiredAmount: 1
      }
    ]
  },
  49: {
    filterId: FilterIds.FURNACE,
    rewardId: Items.METAL_BAR,
    components: [
      {
        itemDefinitionId: Items.WEAPON_PATRIOTIC_AR,
        requiredAmount: 1
      }
    ]
  },
  50: {
    filterId: FilterIds.FURNACE,
    rewardId: Items.METAL_BAR,
    components: [
      {
        itemDefinitionId: Items.WEAPON_NINJA_AR,
        requiredAmount: 1
      }
    ]
  },
  51: {
    filterId: FilterIds.FURNACE,
    rewardId: Items.METAL_BAR,
    components: [
      {
        itemDefinitionId: Items.WEAPON_MERCENARY_AR,
        requiredAmount: 1
      }
    ]
  },
  52: {
    filterId: FilterIds.FURNACE,
    rewardId: Items.METAL_BAR,
    components: [
      {
        itemDefinitionId: Items.WEAPON_COMBAT_SHOTGUN,
        requiredAmount: 1
      }
    ]
  },
  53: {
    filterId: FilterIds.FURNACE,
    rewardId: Items.METAL_BAR,
    components: [
      {
        itemDefinitionId: Items.WEAPON_INFERNAL_SHOTGUN,
        requiredAmount: 1
      }
    ]
  },
  54: {
    filterId: FilterIds.FURNACE,
    rewardId: Items.METAL_BAR,
    components: [
      {
        itemDefinitionId: Items.WEAPON_SHALLOW_M1911A1,
        requiredAmount: 1
      }
    ]
  },
  55: {
    filterId: FilterIds.FURNACE,
    rewardId: Items.METAL_BAR,
    components: [
      {
        itemDefinitionId: Items.WEAPON_SHALLOW_SNIPER,
        requiredAmount: 1
      }
    ]
  },
  56: {
    filterId: FilterIds.FURNACE,
    rewardId: Items.METAL_BAR,
    components: [
      {
        itemDefinitionId: Items.WEAPON_PREDATOR_SNIPER,
        requiredAmount: 1
      }
    ]
  },
  57: {
    filterId: FilterIds.FURNACE,
    rewardId: Items.METAL_BAR,
    components: [
      {
        itemDefinitionId: Items.WEAPON_PREDATOR_SHOTGUN,
        requiredAmount: 1
      }
    ]
  },
  58: {
    filterId: FilterIds.FURNACE,
    rewardId: Items.METAL_BAR,
    components: [
      {
        itemDefinitionId: Items.WEAPON_PREDATOR_AR,
        requiredAmount: 1
      }
    ]
  },
  59: {
    filterId: FilterIds.FURNACE,
    rewardId: Items.METAL_BAR,
    components: [
      {
        itemDefinitionId: Items.WEAPON_ANODIZED_AR,
        requiredAmount: 1
      }
    ]
  },
  60: {
    filterId: FilterIds.FURNACE,
    rewardId: Items.METAL_BAR,
    components: [
      {
        itemDefinitionId: Items.WEAPON_LIGHTNING_AR,
        requiredAmount: 1
      }
    ]
  },
  61: {
    filterId: FilterIds.FURNACE,
    rewardId: Items.METAL_BAR,
    components: [
      {
        itemDefinitionId: Items.WEAPON_IREZUMI_AR,
        requiredAmount: 1
      }
    ]
  },
  62: {
    filterId: FilterIds.FURNACE,
    rewardId: Items.METAL_BAR,
    components: [
      {
        itemDefinitionId: Items.WEAPON_NEKO_CHAN_SHOTGUN,
        requiredAmount: 1
      }
    ]
  },
  63: {
    filterId: FilterIds.FURNACE,
    rewardId: Items.METAL_BAR,
    components: [
      {
        itemDefinitionId: Items.WEAPON_KUROMU_M9,
        requiredAmount: 1
      }
    ]
  },
  64: {
    filterId: FilterIds.FURNACE,
    rewardId: Items.METAL_BAR,
    components: [
      {
        itemDefinitionId: Items.WEAPON_HEAVY_ASSAULT_MAGNUM,
        requiredAmount: 1
      }
    ]
  },
  65: {
    filterId: FilterIds.FURNACE,
    rewardId: Items.METAL_BAR,
    components: [
      {
        itemDefinitionId: Items.WEAPON_NEKO_CHAN_R380,
        requiredAmount: 1
      }
    ]
  },
  66: {
    filterId: FilterIds.FURNACE,
    rewardId: Items.METAL_BAR,
    components: [
      {
        itemDefinitionId: Items.WEAPON_KUROMU_MAGNUM,
        requiredAmount: 1
      }
    ]
  },
  67: {
    filterId: FilterIds.FURNACE,
    rewardId: Items.METAL_BAR,
    components: [
      {
        itemDefinitionId: Items.WEAPON_RAINBOW_SWIRL_SNIPER,
        requiredAmount: 1
      }
    ]
  },
  68: {
    filterId: FilterIds.FURNACE,
    rewardId: Items.METAL_BAR,
    components: [
      {
        itemDefinitionId: Items.WEAPON_RAINBOW_SWIRL_AK47,
        requiredAmount: 1
      }
    ]
  },
  69: {
    filterId: FilterIds.FURNACE,
    rewardId: Items.METAL_BAR,
    components: [
      {
        itemDefinitionId: Items.WEAPON_RAINBOW_SWIRL_AR,
        requiredAmount: 1
      }
    ]
  },
  70: {
    filterId: FilterIds.FURNACE,
    rewardId: Items.METAL_BAR,
    components: [
      {
        itemDefinitionId: Items.WEAPON_RAINBOW_SWIRL_SHOTGUN,
        requiredAmount: 1
      }
    ]
  },
  71: {
    filterId: FilterIds.FURNACE,
    rewardId: Items.METAL_BAR,
    components: [
      {
        itemDefinitionId: Items.WEAPON_GRAFFITI_SNIPER,
        requiredAmount: 1
      }
    ]
  },
  72: {
    filterId: FilterIds.FURNACE,
    rewardId: Items.METAL_BAR,
    components: [
      {
        itemDefinitionId: Items.WEAPON_TIGER_BLOOD_SHOTGUN,
        requiredAmount: 1
      }
    ]
  },
  73: {
    filterId: FilterIds.FURNACE,
    rewardId: Items.METAL_BAR,
    components: [
      {
        itemDefinitionId: Items.WEAPON_DESERT_WARFARE_AK,
        requiredAmount: 1
      }
    ]
  },
  74: {
    filterId: FilterIds.FURNACE,
    rewardId: Items.METAL_BAR,
    components: [
      {
        itemDefinitionId: Items.WEAPON_GRIMMMZ_AR,
        requiredAmount: 1
      }
    ]
  },
  75: {
    filterId: FilterIds.FURNACE,
    rewardId: Items.METAL_BAR,
    components: [
      {
        itemDefinitionId: Items.WEAPON_TOXIC_COMBATKNIFE,
        requiredAmount: 1
      }
    ]
  },
  // Not addded "Modified Toxic AK-47"
  /*
  76: {
    filterId: FilterIds.FURNACE,
    rewardId: Items.METAL_BAR,
    components: [
      {
        itemDefinitionId: 2483,
        requiredAmount: 1
      }
    ]
  },*/
  77: {
    filterId: FilterIds.FURNACE,
    rewardId: Items.METAL_BAR,
    components: [
      {
        itemDefinitionId: Items.WEAPON_TOXIC_AK47,
        requiredAmount: 1
      }
    ]
  },
  78: {
    filterId: FilterIds.FURNACE,
    rewardId: Items.METAL_BAR,
    components: [
      {
        itemDefinitionId: Items.WEAPON_TOXIC_SHOTGUN,
        requiredAmount: 1
      }
    ]
  },
  79: {
    filterId: FilterIds.FURNACE,
    rewardId: Items.METAL_BAR,
    components: [
      {
        itemDefinitionId: Items.WEAPON_SHOWDOWN_AR,
        requiredAmount: 1
      }
    ]
  },
  80: {
    filterId: FilterIds.FURNACE,
    rewardId: Items.METAL_BAR,
    components: [
      {
        itemDefinitionId: Items.WEAPON_WILDSTYLE_AK47,
        requiredAmount: 1
      }
    ]
  },
  81: {
    filterId: FilterIds.FURNACE,
    rewardId: Items.METAL_BAR,
    components: [
      {
        itemDefinitionId: Items.WEAPON_WILDSTYLE_AR,
        requiredAmount: 1
      }
    ]
  },
  82: {
    filterId: FilterIds.FURNACE,
    rewardId: Items.METAL_BAR,
    components: [
      {
        itemDefinitionId: Items.WEAPON_WILDSTYLE_SHOTGUN,
        requiredAmount: 1
      }
    ]
  },
  83: {
    filterId: FilterIds.FURNACE,
    rewardId: Items.METAL_BAR,
    components: [
      {
        itemDefinitionId: Items.CANNED_FOOD01,
        requiredAmount: 1
      }
    ]
  },
  84: {
    filterId: FilterIds.FURNACE,
    rewardId: Items.METAL_BAR,
    components: [
      {
        itemDefinitionId: Items.CANNED_FOOD02,
        requiredAmount: 1
      }
    ]
  },
  85: {
    filterId: FilterIds.FURNACE,
    rewardId: Items.METAL_BAR,
    components: [
      {
        itemDefinitionId: Items.CANNED_FOOD03,
        requiredAmount: 1
      }
    ]
  },
  86: {
    filterId: FilterIds.FURNACE,
    rewardId: Items.METAL_BAR,
    components: [
      {
        itemDefinitionId: Items.CANNED_FOOD04,
        requiredAmount: 1
      }
    ]
  },
  87: {
    filterId: FilterIds.FURNACE,
    rewardId: Items.METAL_BAR,
    components: [
      {
        itemDefinitionId: Items.CANNED_FOOD05,
        requiredAmount: 1
      }
    ]
  },
  88: {
    filterId: FilterIds.FURNACE,
    rewardId: Items.METAL_BAR,
    components: [
      {
        itemDefinitionId: Items.CANNED_FOOD06,
        requiredAmount: 1
      }
    ]
  },
  89: {
    filterId: FilterIds.FURNACE,
    rewardId: Items.METAL_BAR,
    components: [
      {
        itemDefinitionId: Items.CANNED_FOOD07,
        requiredAmount: 1
      }
    ]
  },
  90: {
    filterId: FilterIds.FURNACE,
    rewardId: Items.METAL_BAR,
    components: [
      {
        itemDefinitionId: Items.CANNED_FOOD08,
        requiredAmount: 1
      }
    ]
  },
  91: {
    filterId: FilterIds.FURNACE,
    rewardId: Items.METAL_BAR,
    components: [
      {
        itemDefinitionId: Items.CANNED_FOOD09,
        requiredAmount: 1
      }
    ]
  },
  92: {
    filterId: FilterIds.FURNACE,
    rewardId: Items.METAL_BAR,
    components: [
      {
        itemDefinitionId: Items.CANNED_FOOD10,
        requiredAmount: 1
      }
    ]
  },
  93: {
    filterId: FilterIds.FURNACE,
    rewardId: Items.METAL_BAR,
    components: [
      {
        itemDefinitionId: Items.CANNED_FOOD11,
        requiredAmount: 1
      }
    ]
  },
  94: {
    filterId: FilterIds.FURNACE,
    rewardId: Items.METAL_BAR,
    components: [
      {
        itemDefinitionId: Items.CANNED_FOOD21,
        requiredAmount: 1
      }
    ]
  },
  95: {
    filterId: FilterIds.FURNACE,
    rewardId: Items.METAL_BAR,
    components: [
      {
        itemDefinitionId: Items.CANNED_FOOD25,
        requiredAmount: 1
      }
    ]
  },
  96: {
    filterId: FilterIds.FURNACE,
    rewardId: Items.METAL_BAR,
    components: [
      {
        itemDefinitionId: Items.CANNED_FOOD26,
        requiredAmount: 1
      }
    ]
  }
};

export const recipes: { [recipeId: number]: Recipe } = {
  1001: {
    rewardId: Items.AMMO_223,
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
  1002: {
    rewardId: Items.AMMO_308,
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
  1003: {
    rewardId: Items.AMMO_380,
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
  1004: {
    rewardId: Items.AMMO_44,
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
  1005: {
    rewardId: Items.AMMO_45,
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
  1006: {
    rewardId: Items.AMMO_12GA,
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
  1134: {
    rewardId: Items.AMMO_762,
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
  1135: {
    rewardId: Items.AMMO_9MM,
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
  1007: {
    rewardId: Items.WEAPON_BLAZE,
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
    ],
    requireWeaponWorkbench: true
  },
  1008: {
    rewardId: Items.WEAPON_FROSTBITE,
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
    ],
    requireWeaponWorkbench: true
  },
  1009: {
    rewardId: Items.WEAPON_NAGAFENS_RAGE,
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
    ],
    requireWeaponWorkbench: true
  },
  1010: {
    rewardId: Items.WEAPON_PURGE,
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
    ],
    requireWeaponWorkbench: true
  },
  1011: {
    rewardId: Items.WEAPON_REAPER,
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
    ],
    requireWeaponWorkbench: true
  },
  1012: {
    rewardId: Items.AIRDROP_CODE,
    filterId: FilterIds.SURVIVAL,
    components: [
      {
        itemDefinitionId: Items.CODED_MESSAGE,
        requiredAmount: 4
      }
    ]
  },
  1013: {
    rewardId: Items.ANIMAL_TRAP,
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
  1014: {
    rewardId: Items.BACKPACK_FRAME,
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
  1138: {
    rewardId: Items.BANDAGE,
    filterId: FilterIds.SURVIVAL,
    components: [
      {
        itemDefinitionId: Items.CLOTH,
        requiredAmount: 2
      }
    ]
  },
  1015: {
    rewardId: Items.BARBED_WIRE,
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
  1016: {
    rewardId: Items.BARBEQUE,
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
  1017: {
    rewardId: Items.BANDANA_BASIC,
    filterId: FilterIds.SURVIVAL,
    components: [
      {
        itemDefinitionId: Items.CLOTH,
        requiredAmount: 2
      }
    ]
  },
  1018: {
    rewardId: Items.SHACK_BASIC,
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
  1019: {
    rewardId: Items.DOOR_BASIC,
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
  1020: {
    rewardId: Items.SANDWICH_BEAR,
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
  1021: {
    rewardId: Items.STEAK_BEAR,
    filterId: FilterIds.COOKING,
    components: [
      {
        itemDefinitionId: Items.MEAT_BEAR,
        requiredAmount: 1
      }
    ]
  },
  1022: {
    rewardId: Items.BEE_BOX,
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
  1023: {
    rewardId: Items.FUEL_BIOFUEL,
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
  1024: {
    rewardId: Items.BLACKBERRY_JUICE,
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
  1025: {
    rewardId: Items.BLACKBERRY_PIE,
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
  1026: {
    rewardId: Items.BOW_DRILL,
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
  1027: {
    rewardId: Items.CAMPFIRE,
    filterId: FilterIds.SURVIVAL,
    components: [
      {
        itemDefinitionId: Items.WOOD_LOG,
        requiredAmount: 2
      }
    ]
  },
  1028: {
    rewardId: Items.CANDLE,
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
  1029: {
    rewardId: Items.PHONE_CHARGED,
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
  1030: {
    rewardId: Items.COFFEE,
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
  1031: {
    rewardId: Items.COFFEE_SUGAR,
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
  1032: {
    rewardId: Items.WEAPON_COMBATKNIFE,
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
  1033: {
    rewardId: Items.STEAK_RABBIT,
    filterId: FilterIds.COOKING,
    components: [
      {
        itemDefinitionId: Items.MEAT_RABBIT,
        requiredAmount: 1
      }
    ]
  },
  1034: {
    rewardId: Items.CORN_MASH,
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
  1035: {
    rewardId: Items.FOUNDATION,
    filterId: FilterIds.HOUSING,
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
  1036: {
    rewardId: Items.JERKY_DEER,
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
  1037: {
    rewardId: Items.SANDWICH_DEER,
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
  1038: {
    rewardId: Items.DEER_SCENT,
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
  1039: {
    rewardId: Items.STEAK_DEER,
    filterId: FilterIds.COOKING,
    components: [
      {
        itemDefinitionId: Items.MEAT_VENISON,
        requiredAmount: 1
      }
    ]
  },
  1040: {
    rewardId: Items.WEAPON_HAMMER_DEMOLITION,
    filterId: FilterIds.WEAPONS,
    components: [
      {
        itemDefinitionId: Items.METAL_PIPE,
        requiredAmount: 1
      }
    ]
  },
  1041: {
    rewardId: Items.DEW_COLLECTOR,
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
  1042: {
    rewardId: Items.BANDAGE_DRESSED,
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
  1043: {
    rewardId: Items.FUEL_ETHANOL,
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
  1044: {
    rewardId: Items.WEAPON_TORCH_ETHANOL,
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
  1045: {
    rewardId: Items.AMMO_ARROW_EXPLOSIVE,
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
  1046: {
    rewardId: Items.GLOVES_FINGERLESS,
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
  1047: {
    rewardId: Items.TRAP_FIRE,
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

  1048: {
    rewardId: Items.FIRST_AID,
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
  1049: {
    rewardId: Items.AMMO_ARROW_FLAMING,
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
  1050: {
    rewardId: Items.FLARE,
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
  1051: {
    rewardId: Items.TRAP_FLASH,
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
  1052: {
    rewardId: Items.FLOUR,
    filterId: FilterIds.SURVIVAL,
    components: [
      {
        itemDefinitionId: Items.WHEAT,
        requiredAmount: 1
      }
    ]
  },
  1053: {
    rewardId: Items.FOUNDATION_EXPANSION,
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
  1054: {
    rewardId: Items.FOUNDATION_RAMP,
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
  1055: {
    rewardId: Items.FOUNDATION_STAIRS,
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
  1056: {
    rewardId: Items.BACKPACK_FRAMED,
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
  1057: {
    rewardId: Items.FURNACE,
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
  1058: {
    rewardId: Items.TRAP_GAS,
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
  1059: {
    rewardId: Items.GROUND_TAMPER,
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
  1060: {
    rewardId: Items.GROUND_TILLER,
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

  1061: {
    rewardId: Items.REPAIR_KIT_GUN,
    filterId: FilterIds.WEAPONS,
    components: [
      {
        itemDefinitionId: Items.GUN_PART,
        requiredAmount: 2
      }
    ]
  },
  1062: {
    rewardId: Items.UPGRADE_KIT_GUN,
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
  1063: {
    rewardId: Items.GUNPOWDER,
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
  1064: {
    rewardId: Items.WEAPON_HAMMER,
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
  1065: {
    rewardId: Items.HAND_SHOVEL,
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
  1066: {
    rewardId: Items.BLACKBERRY_HANDFUL,
    filterId: FilterIds.SURVIVAL,
    components: [
      {
        itemDefinitionId: Items.BLACKBERRY,
        requiredAmount: 10
      }
    ]
  },
  1067: {
    rewardId: Items.ANTI_VIRAL_BOTTLE,
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
  1068: {
    rewardId: Items.IED,
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
  1069: {
    rewardId: Items.COMPASS_IMPROVISED,
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
  1070: {
    rewardId: Items.SKINNING_KNIFE,
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
  1071: {
    rewardId: Items.LANDMINE,
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
  1072: {
    rewardId: Items.SHELTER_LARGE,
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
  1073: {
    rewardId: Items.LOOKOUT_TOWER,
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
  1074: {
    rewardId: Items.WEAPON_MACHETE01,
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
  1075: {
    rewardId: Items.WEAPON_BOW_MAKESHIFT,
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
  1076: {
    rewardId: Items.WEAPON_HATCHET_MAKESHIFT,
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
  1077: {
    rewardId: Items.METAL_BAR,
    filterId: FilterIds.FURNACE,
    components: [
      {
        itemDefinitionId: Items.METAL_SCRAP,
        requiredAmount: 1
      }
    ]
  },
  1078: {
    rewardId: Items.METAL_BRACKET,
    filterId: FilterIds.COMPONENT,
    components: [
      {
        itemDefinitionId: Items.METAL_SCRAP,
        requiredAmount: 1
      }
    ]
  },
  1079: {
    rewardId: Items.DOOR_METAL,
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
  1080: {
    rewardId: Items.METAL_DOORWAY,
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
  1081: {
    rewardId: Items.METAL_GATE,
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
  1082: {
    rewardId: Items.SHARD_METAL,
    filterId: FilterIds.COMPONENT,
    bundleCount: 4,
    components: [
      {
        itemDefinitionId: Items.METAL_SCRAP,
        requiredAmount: 1
      }
    ]
  },
  1083: {
    rewardId: Items.METAL_SHEET,
    filterId: FilterIds.COMPONENT,
    components: [
      {
        itemDefinitionId: Items.METAL_BAR,
        requiredAmount: 2
      }
    ],
    requireWorkbench: true
  },
  1084: {
    rewardId: Items.METAL_WALL,
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
  1085: {
    rewardId: Items.WEAPON_AK47_MODIFIED,
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
    ],
    requireWeaponWorkbench: true
  },
  1086: {
    rewardId: Items.WEAPON_MOLOTOV,
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
  1087: {
    rewardId: Items.NAIL,
    filterId: FilterIds.COMPONENT,
    bundleCount: 4,
    components: [
      {
        itemDefinitionId: Items.SHARD_METAL,
        requiredAmount: 1
      }
    ]
  },
  1088: {
    rewardId: Items.FLARE_PARACHUTE,
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
  1089: {
    rewardId: Items.METAL_PIPE,
    filterId: FilterIds.COMPONENT,
    components: [
      {
        itemDefinitionId: Items.METAL_SHEET,
        requiredAmount: 2
      }
    ],
    requireWorkbench: true
  },
  1090: {
    rewardId: Items.SHARD_PLASTIC,
    filterId: FilterIds.COMPONENT,
    bundleCount: 5,
    components: [
      {
        itemDefinitionId: Items.WATER_EMPTY,
        requiredAmount: 1
      }
    ]
  },
  1091: {
    rewardId: Items.ARMOR_PLATED,
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
  1092: {
    rewardId: Items.PUNJI_STICKS,
    filterId: FilterIds.SURVIVAL,
    components: [
      {
        itemDefinitionId: Items.WOOD_STICK,
        requiredAmount: 8
      }
    ]
  },
  1093: {
    rewardId: Items.WATER_PURE,
    filterId: FilterIds.COOKING,
    components: [
      {
        itemDefinitionId: Items.WATER_STAGNANT,
        requiredAmount: 1
      }
    ]
  },
  1094: {
    rewardId: Items.SANDWICH_RABBIT,
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
  1095: {
    rewardId: Items.STEW_RABBIT,
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
  1096: {
    rewardId: Items.REPAIR_BOX,
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
  1097: {
    rewardId: Items.RIGGED_LIGHT,
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
  1098: {
    rewardId: Items.CORN_ROASTED,
    filterId: FilterIds.COOKING,
    components: [
      {
        itemDefinitionId: Items.CORN,
        requiredAmount: 1
      }
    ]
  },
  1099: {
    rewardId: Items.SALINE,
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
  1100: {
    rewardId: Items.BACKPACK_SATCHEL,
    filterId: FilterIds.SURVIVAL,
    components: [
      {
        itemDefinitionId: Items.CLOTH,
        requiredAmount: 6
      }
    ]
  },
  1101: {
    rewardId: Items.GRENADE_SCREAM,
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
  1102: {
    rewardId: Items.SHACK,
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
  1103: {
    rewardId: Items.SHELTER,
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
  1104: {
    rewardId: Items.TRAP_SHOCK,
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

  1105: {
    rewardId: Items.SLEEPING_MAT,
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
  1106: {
    rewardId: Items.FLARE_SMOKE,
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
  1107: {
    rewardId: Items.SNARE,
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
  1108: {
    rewardId: Items.STORAGE_BOX,
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
  1109: {
    rewardId: Items.STRUCTURE_STAIRS,
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
  1110: {
    rewardId: Items.SURVIVAL_BORSCHT,
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
  1111: {
    rewardId: Items.SURVIVAL_BREAD,
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
  1112: {
    rewardId: Items.SWIZZLE,
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
  1113: {
    rewardId: Items.SYRINGE_H1Z1_REDUCER,
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
  1114: {
    rewardId: Items.GHILLIE_SUIT_TAN,
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
  1115: {
    rewardId: Items.WEAPON_TORCH,
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
  1116: {
    rewardId: Items.TRAP_IGNITION_KIT,
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
  1117: {
    rewardId: Items.SHELTER_UPPER_LARGE,
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
  1118: {
    rewardId: Items.SHELTER_UPPER,
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
  1119: {
    rewardId: Items.STRUCTURE_STAIRS_UPPER,
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
  1120: {
    rewardId: Items.METAL_WALL_UPPER,
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

  1121: {
    rewardId: Items.WORKBENCH_WEAPON,
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
  1122: {
    rewardId: Items.SANDWICH_WOLF,
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
  1123: {
    rewardId: Items.STEAK_WOLF,
    filterId: FilterIds.COOKING,
    components: [
      {
        itemDefinitionId: Items.MEAT_WOLF,
        requiredAmount: 1
      }
    ]
  },
  1124: {
    rewardId: Items.WOOD_PLANK,
    filterId: FilterIds.COMPONENT,
    bundleCount: 2,
    components: [
      {
        itemDefinitionId: Items.WOOD_LOG,
        requiredAmount: 1
      }
    ]
  },
  1125: {
    rewardId: Items.WEAPON_SPEAR,
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
  1126: {
    rewardId: Items.WOOD_STICK,
    filterId: FilterIds.COMPONENT,
    bundleCount: 2,
    components: [
      {
        itemDefinitionId: Items.WOOD_PLANK,
        requiredAmount: 1
      }
    ]
  },
  1127: {
    rewardId: Items.AMMO_ARROW,
    filterId: FilterIds.WEAPONS,
    components: [
      {
        itemDefinitionId: Items.WOOD_STICK,
        requiredAmount: 1
      }
    ]
  },
  1128: {
    rewardId: Items.BARRICADE,
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
  1129: {
    rewardId: Items.ARMOR_WOODEN,
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
  1130: {
    rewardId: Items.WEAPON_BOW_WOOD,
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
  1131: {
    rewardId: Items.DOOR_WOOD,
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
  1132: {
    rewardId: Items.WORKBENCH,
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
  1133: {
    rewardId: Items.YEAST,
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

  1136: {
    rewardId: Items.WEAPON_REPAIR_KIT,
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
  },
  1137: {
    rewardId: Items.AIO_COLD_MEDICINE,
    filterId: FilterIds.SURVIVAL,
    components: [
      {
        itemDefinitionId: Items.VITAMINS,
        requiredAmount: 2
      },
      {
        itemDefinitionId: Items.IMMUNITY_BOOSTERS,
        requiredAmount: 2
      },
      {
        itemDefinitionId: Items.ANTIBIOTICS,
        requiredAmount: 2
      }
    ]
  },
  1139: {
    rewardId: Items.GUN_PART,
    filterId: FilterIds.WEAPONS,
    bundleCount: 2,
    components: [
      {
        itemDefinitionId: Items.WEAPON_AK47,
        requiredAmount: 1
      }
    ],
    requireWeaponWorkbench: true
  },
  1140: {
    rewardId: Items.GUN_PART,
    filterId: FilterIds.WEAPONS,
    bundleCount: 2,
    components: [
      {
        itemDefinitionId: Items.WEAPON_AK47_MODIFIED,
        requiredAmount: 1
      }
    ],
    requireWeaponWorkbench: true
  },
  1141: {
    rewardId: Items.GUN_PART,
    filterId: FilterIds.WEAPONS,
    bundleCount: 2,
    components: [
      {
        itemDefinitionId: Items.WEAPON_308,
        requiredAmount: 1
      }
    ],
    requireWeaponWorkbench: true
  },
  1142: {
    rewardId: Items.GUN_PART,
    filterId: FilterIds.WEAPONS,
    bundleCount: 2,
    components: [
      {
        itemDefinitionId: Items.WEAPON_AR15,
        requiredAmount: 1
      }
    ],
    requireWeaponWorkbench: true
  },
  1143: {
    rewardId: Items.GUN_PART,
    filterId: FilterIds.WEAPONS,
    bundleCount: 2,
    components: [
      {
        itemDefinitionId: Items.WEAPON_SHOTGUN,
        requiredAmount: 1
      }
    ],
    requireWeaponWorkbench: true
  },
  // pistols
  1144: {
    rewardId: Items.GUN_PART,
    filterId: FilterIds.WEAPONS,
    bundleCount: 1,
    components: [
      {
        itemDefinitionId: Items.WEAPON_M9,
        requiredAmount: 1
      }
    ],
    requireWeaponWorkbench: true
  },
  1145: {
    rewardId: Items.GUN_PART,
    filterId: FilterIds.WEAPONS,
    bundleCount: 1,
    components: [
      {
        itemDefinitionId: Items.WEAPON_1911,
        requiredAmount: 1
      }
    ],
    requireWeaponWorkbench: true
  },
  1146: {
    rewardId: Items.GUN_PART,
    filterId: FilterIds.WEAPONS,
    bundleCount: 1,
    components: [
      {
        itemDefinitionId: Items.WEAPON_MAGNUM,
        requiredAmount: 1
      }
    ],
    requireWeaponWorkbench: true
  },
  1147: {
    rewardId: Items.GUN_PART,
    filterId: FilterIds.WEAPONS,
    bundleCount: 1,
    components: [
      {
        itemDefinitionId: Items.WEAPON_R380,
        requiredAmount: 1
      }
    ],
    requireWeaponWorkbench: true
  },
  1148: {
    rewardId: Items.GRENADE_SCREAM,
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
};
