import { HealTypes, Items, ItemUseOptions } from "../models/enums";
import { ItemUseOption } from "types/zoneserver";
export const UseOptions: { [itemDefinitionIds: number]: ItemUseOption } = {
  //----------Eat-------------//
  1: {
    itemDef: Items.BLACKBERRY,
    type: ItemUseOptions.EAT,
    timeout: 600,
    eatCount: 200,
    drinkCount: 200,
    givetrash: 0
  },
  2: {
    itemDef: Items.CANNED_FOOD01,
    type: ItemUseOptions.EAT,
    timeout: 1000,
    eatCount: 4000,
    givetrash: 48
  },
  100: {
    itemDef: Items.CANNED_FOOD02,
    type: ItemUseOptions.EAT,
    timeout: 1000,
    eatCount: 4000,
    givetrash: 48
  },
  101: {
    itemDef: Items.CANNED_FOOD03,
    type: ItemUseOptions.EAT,
    timeout: 1000,
    eatCount: 4000,
    givetrash: 48
  },
  102: {
    itemDef: Items.CANNED_FOOD04,
    type: ItemUseOptions.EAT,
    timeout: 1000,
    eatCount: 4000,
    givetrash: 48
  },
  103: {
    itemDef: Items.CANNED_FOOD05,
    type: ItemUseOptions.EAT,
    timeout: 1000,
    eatCount: 4000,
    givetrash: 48
  },
  104: {
    itemDef: Items.CANNED_FOOD06,
    type: ItemUseOptions.EAT,
    timeout: 1000,
    eatCount: 4000,
    givetrash: 48
  },
  105: {
    itemDef: Items.CANNED_FOOD07,
    type: ItemUseOptions.EAT,
    timeout: 1000,
    eatCount: 4000,
    givetrash: 48
  },
  106: {
    itemDef: Items.CANNED_FOOD08,
    type: ItemUseOptions.EAT,
    timeout: 1000,
    eatCount: 4000,
    givetrash: 48
  },
  107: {
    itemDef: Items.CANNED_FOOD09,
    type: ItemUseOptions.EAT,
    timeout: 1000,
    eatCount: 4000,
    givetrash: 48
  },
  108: {
    itemDef: Items.CANNED_FOOD10,
    type: ItemUseOptions.EAT,
    timeout: 1000,
    eatCount: 4000,
    givetrash: 48
  },
  109: {
    itemDef: Items.CANNED_FOOD11,
    type: ItemUseOptions.EAT,
    timeout: 1000,
    eatCount: 4000,
    givetrash: 48
  },
  121: {
    itemDef: Items.CANNED_FOOD21,
    type: ItemUseOptions.EAT,
    timeout: 1000,
    eatCount: 4000,
    givetrash: 48
  },
  123: {
    itemDef: Items.CANNED_FOOD25,
    type: ItemUseOptions.EAT,
    timeout: 1000,
    eatCount: 4000,
    givetrash: 48
  },
  124: {
    itemDef: Items.CANNED_FOOD26,
    type: ItemUseOptions.EAT,
    timeout: 1000,
    eatCount: 4000,
    givetrash: 48
  },
  3: {
    itemDef: Items.MRE_APPLE,
    type: ItemUseOptions.EAT,
    timeout: 1000,
    eatCount: 6000,
    drinkCount: 6000
  },
  110: {
    itemDef: Items.MRE01,
    type: ItemUseOptions.EAT,
    timeout: 1000,
    eatCount: 4000,
    drinkCount: 6000
  },
  111: {
    itemDef: Items.MRE02,
    type: ItemUseOptions.EAT,
    timeout: 1000,
    eatCount: 4000,
    drinkCount: 6000
  },
  112: {
    itemDef: Items.MRE03,
    type: ItemUseOptions.EAT,
    timeout: 1000,
    eatCount: 4000,
    drinkCount: 6000
  },
  113: {
    itemDef: Items.MRE04,
    type: ItemUseOptions.EAT,
    timeout: 1000,
    eatCount: 4000,
    drinkCount: 6000
  },
  114: {
    itemDef: Items.MRE05,
    type: ItemUseOptions.EAT,
    timeout: 1000,
    eatCount: 4000,
    drinkCount: 6000
  },
  116: {
    itemDef: Items.MRE06,
    type: ItemUseOptions.EAT,
    timeout: 1000,
    eatCount: 4000,
    drinkCount: 6000
  },
  117: {
    itemDef: Items.MRE07,
    type: ItemUseOptions.EAT,
    timeout: 1000,
    eatCount: 4000,
    drinkCount: 6000
  },
  118: {
    itemDef: Items.MRE08,
    type: ItemUseOptions.EAT,
    timeout: 1000,
    eatCount: 4000,
    drinkCount: 6000
  },
  119: {
    itemDef: Items.MRE09,
    type: ItemUseOptions.EAT,
    timeout: 1000,
    eatCount: 4000,
    drinkCount: 6000
  },
  120: {
    itemDef: Items.MRE10,
    type: ItemUseOptions.EAT,
    timeout: 1000,
    eatCount: 4000,
    drinkCount: 6000
  },
  115: {
    itemDef: Items.MRE11,
    type: ItemUseOptions.EAT,
    timeout: 1000,
    eatCount: 4000,
    drinkCount: 6000
  },
  122: {
    itemDef: Items.MRE12,
    type: ItemUseOptions.EAT,
    timeout: 1000,
    eatCount: 4000,
    drinkCount: 6000
  },
  4: {
    itemDef: Items.MEAT_ROTTEN,
    type: ItemUseOptions.EAT,
    timeout: 1000,
    eatCount: 1000
  },
  19: {
    itemDef: Items.MEAT_BEAR,
    type: ItemUseOptions.EAT,
    timeout: 1000,
    eatCount: 2000
  },
  20: {
    itemDef: Items.MEAT_RABBIT,
    type: ItemUseOptions.EAT,
    timeout: 1000,
    eatCount: 2000
  },
  21: {
    itemDef: Items.MEAT_VENISON,
    type: ItemUseOptions.EAT,
    timeout: 1000,
    eatCount: 2000
  },
  22: {
    itemDef: Items.MEAT_WOLF,
    type: ItemUseOptions.EAT,
    timeout: 1000,
    eatCount: 2000
  },
  23: {
    itemDef: Items.STEAK_BEAR,
    type: ItemUseOptions.EAT,
    timeout: 1000,
    eatCount: 4000
  },
  24: {
    itemDef: Items.STEAK_DEER,
    type: ItemUseOptions.EAT,
    timeout: 1000,
    eatCount: 4000
  },
  25: {
    itemDef: Items.STEAK_BEAR,
    type: ItemUseOptions.EAT,
    timeout: 1000,
    eatCount: 4000
  },
  26: {
    itemDef: Items.STEAK_RABBIT,
    type: ItemUseOptions.EAT,
    timeout: 1000,
    eatCount: 4000
  },
  27: {
    itemDef: Items.STEAK_WOLF,
    type: ItemUseOptions.EAT,
    timeout: 1000,
    eatCount: 4000
  },
  28: {
    itemDef: Items.SURVIVAL_BREAD,
    type: ItemUseOptions.EAT,
    timeout: 1000,
    eatCount: 6000
  },
  29: {
    itemDef: Items.SANDWICH_BEAR,
    type: ItemUseOptions.EAT,
    timeout: 1000,
    eatCount: 10000
  },
  30: {
    itemDef: Items.SANDWICH_DEER,
    type: ItemUseOptions.EAT,
    timeout: 1000,
    eatCount: 10000
  },
  31: {
    itemDef: Items.SANDWICH_RABBIT,
    type: ItemUseOptions.EAT,
    timeout: 1000,
    eatCount: 10000
  },
  32: {
    itemDef: Items.SANDWICH_WOLF,
    type: ItemUseOptions.EAT,
    timeout: 1000,
    eatCount: 10000
  },
  36: {
    itemDef: Items.BLACKBERRY_HANDFUL,
    type: ItemUseOptions.EAT,
    timeout: 1000,
    eatCount: 2000,
    drinkCount: 2000
  },
  37: {
    itemDef: Items.BLACKBERRY_PIE,
    type: ItemUseOptions.EAT,
    timeout: 2000,
    eatCount: 10000,
    drinkCount: 4000
  },
  39: {
    itemDef: Items.CORN_ROASTED,
    type: ItemUseOptions.EAT,
    timeout: 1000,
    eatCount: 4000
  },
  40: {
    itemDef: Items.HONEY,
    type: ItemUseOptions.EAT,
    timeout: 1000,
    eatCount: 3000,
    drinkCount: 4000,
    staminaCount: 200,
    givetrash: Items.WATER_EMPTY
  },
  49: {
    itemDef: Items.HONEYCOMB,
    type: ItemUseOptions.EAT,
    timeout: 1000,
    eatCount: 4000,
    drinkCount: 3000,
    staminaCount: 300
  },
  46: {
    itemDef: Items.SURVIVAL_BORSCHT,
    type: ItemUseOptions.EAT,
    timeout: 1000,
    eatCount: 2000,
    drinkCount: 6000
  },
  48: {
    itemDef: Items.BLACKBERRY_PIE_SLICE,
    type: ItemUseOptions.EAT,
    timeout: 1000,
    eatCount: 2500,
    drinkCount: 1000
  },

  //----------Use Medical-------------//
  5: {
    itemDef: Items.FIRST_AID,
    type: ItemUseOptions.USE_MEDICAL,
    timeout: 5000,
    healCount: 99,
    healType: HealTypes.MEDKIT,
    bandagingCount: 120
  },
  6: {
    itemDef: Items.BANDAGE,
    type: ItemUseOptions.USE_MEDICAL,
    timeout: 1000,
    healCount: 9,
    bandagingCount: 40,
    healType: HealTypes.BANDAGE
  },
  7: {
    itemDef: Items.GAUZE,
    type: ItemUseOptions.USE_MEDICAL,
    timeout: 1000,
    healCount: 9,
    bandagingCount: 40,
    healType: HealTypes.BANDAGE
  },
  8: {
    itemDef: Items.BANDAGE_DRESSED,
    type: ItemUseOptions.USE_MEDICAL,
    timeout: 1000,
    healCount: 30,
    healType: HealTypes.BANDAGE,
    bandagingCount: 40
  },
  42: {
    itemDef: Items.COLD_MEDICINE,
    type: ItemUseOptions.USE_MEDICAL,
    healType: HealTypes.OTHER,
    timeout: 300
  },
  43: {
    itemDef: Items.ANTIBIOTICS,
    type: ItemUseOptions.USE_MEDICAL,
    healType: HealTypes.OTHER,
    timeout: 300
  },
  44: {
    itemDef: Items.VITAMINS,
    type: ItemUseOptions.USE_MEDICAL,
    healType: HealTypes.OTHER,
    timeout: 300
  },
  45: {
    itemDef: Items.IMMUNITY_BOOSTERS,
    type: ItemUseOptions.USE_MEDICAL,
    healType: HealTypes.OTHER,
    timeout: 300
  },

  //----------Ignite-------------//
  9: {
    itemDef: Items.LIGHTER,
    type: ItemUseOptions.IGNITE,
    timeout: 100
  },
  10: {
    itemDef: Items.BOW_DRILL,
    type: ItemUseOptions.IGNITE,
    timeout: 15000
  },

  //----------Drink-------------//
  11: {
    itemDef: Items.WATER_DIRTY,
    type: ItemUseOptions.DRINK,
    timeout: 1000,
    drinkCount: 1000,
    givetrash: Items.WATER_EMPTY
  },
  12: {
    itemDef: Items.WATER_STAGNANT,
    type: ItemUseOptions.DRINK,
    timeout: 1000,
    drinkCount: 2000,
    givetrash: Items.WATER_EMPTY
  },
  13: {
    itemDef: Items.WATER_PURE,
    type: ItemUseOptions.DRINK,
    timeout: 1000,
    drinkCount: 4000,
    givetrash: Items.WATER_EMPTY
  },
  33: {
    itemDef: Items.BLACKBERRY_JUICE,
    type: ItemUseOptions.DRINK,
    timeout: 1000,
    eatCount: 2000,
    drinkCount: 6000,
    givetrash: Items.WATER_EMPTY
  },
  34: {
    itemDef: Items.COFFEE,
    type: ItemUseOptions.DRINK,
    timeout: 1000,
    drinkCount: 4000,
    staminaCount: 300,
    givetrash: Items.WATER_EMPTY
  },
  35: {
    itemDef: Items.COFFEE_SUGAR,
    type: ItemUseOptions.DRINK,
    timeout: 1000,
    drinkCount: 4000,
    staminaCount: 400,
    givetrash: Items.WATER_EMPTY
  },

  38: {
    itemDef: Items.STEW_RABBIT,
    type: ItemUseOptions.DRINK,
    timeout: 1000,
    eatCount: 5000,
    drinkCount: 5000,
    givetrash: Items.WATER_EMPTY
  },
  41: {
    itemDef: Items.MOONSHINE,
    type: ItemUseOptions.DRINK,
    timeout: 1000,
    drinkCount: 3000
  },

  //----------Refuel-------------//
  14: {
    itemDef: Items.FUEL_BIOFUEL,
    type: ItemUseOptions.REFUEL,
    timeout: 3000,
    refuelCount: 2500
  },
  15: {
    itemDef: Items.FUEL_ETHANOL,
    type: ItemUseOptions.REFUEL,
    timeout: 3000,
    refuelCount: 5000
  },

  //-----------------Slice------------------//
  47: {
    itemDef: Items.BLACKBERRY_PIE,
    type: ItemUseOptions.SLICE,
    timeout: 3000
  },

  //----------Generic USE option------------//
  16: {
    itemDef: Items.FERTILIZER,
    type: ItemUseOptions.USE,
    timeout: 1000
  },
  17: {
    itemDef: Items.WATER_EMPTY,
    type: ItemUseOptions.USE,
    timeout: 1000
  },
  18: {
    itemDef: Items.SWIZZLE,
    type: ItemUseOptions.USE,
    timeout: 1000
  },

  //----------Repair------------//
  125: {
    itemDef: Items.WEAPON_REPAIR_KIT,
    type: ItemUseOptions.REPAIR,
    timeout: 10000
  },
  126: {
    itemDef: Items.GUN_REPAIR_KIT,
    type: ItemUseOptions.REPAIR,
    timeout: 10000
  }
};
