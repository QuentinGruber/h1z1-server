import { FilterIds, Items } from "../enums"

export const recipes = {
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
      },
    ]
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
      },
    ]
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
      },
    ]
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
      },
    ]
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
      },
    ]
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
      },
    ]
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
      },
    ]
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
      },
    ]
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
      },
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
      },
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
      },
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
      },
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
      },
    ]
  },
  [Items.AIRDROP_CODE]: {
    filterId: FilterIds.SURVIVAL,
    components: [
      {
        itemDefinitionId: Items.CODED_MESSAGE,
        requiredAmount: 4
      },
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
      },
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
      },
    ]
  },
  [Items.BANDAGE]: {
    filterId: FilterIds.SURVIVAL,
    components: [
      {
        itemDefinitionId: Items.CLOTH,
        requiredAmount: 2
      },
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
      },
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
      },
    ]
  },
  [Items.BANDANA_BASIC]: {
    filterId: FilterIds.SURVIVAL,
    components: [
      {
        itemDefinitionId: Items.CLOTH,
        requiredAmount: 2
      },
    ]
  },
  [Items.BASIC_SHACK]: {
    filterId: FilterIds.HOUSING,
    components: [
      {
        itemDefinitionId: Items.WOOD_PLANK,
        requiredAmount: 20
      },
      {
        itemDefinitionId: Items.WOOD_STICK,
        requiredAmount: 10
      },
    ]
  },
  [Items.BASIC_SHACK_DOOR]: {
    filterId: FilterIds.HOUSING,
    components: [
      {
        itemDefinitionId: Items.WOOD_PLANK,
        requiredAmount: 3
      },
      {
        itemDefinitionId: Items.WOOD_STICK,
        requiredAmount: 5
      },
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
      },
    ]
  },
  [Items.STEAK_BEAR]: {
    filterId: FilterIds.SURVIVAL,
    components: [
      {
        itemDefinitionId: Items.MEAT_BEAR,
        requiredAmount: 1
      },
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
      },
    ]
  },
  [Items.FUEL_BIOFUEL]: {
    filterId: FilterIds.WEAPONS,
    components: [
      {
        itemDefinitionId: Items.ANIMAL_FAT,
        requiredAmount: 1
      },
      {
        itemDefinitionId: Items.WATER_EMPTY,
        requiredAmount: 1
      },
    ]
  },
  [Items.BLACKBERRY_JUICE]: {
    filterId: FilterIds.SURVIVAL,
    components: [
      {
        itemDefinitionId: Items.BLACKBERRY,
        requiredAmount: 1
      },
      {
        itemDefinitionId: Items.WATER_EMPTY,
        requiredAmount: 1
      },
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
      },
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
      },
    ]
  },
  [Items.CAMPFIRE]: {
    filterId: FilterIds.SURVIVAL,
    components: [
      {
        itemDefinitionId: Items.WOOD_LOG,
        requiredAmount: 2
      },
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
      },
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
      },
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
      },
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
      },
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
      },
    ]
  },
  [Items.STEAK_RABBIT]: {
    filterId: FilterIds.COOKING,
    components: [
      {
        itemDefinitionId: Items.MEAT_RABBIT,
        requiredAmount: 1
      },
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
      },
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
      },
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
      },
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
      },
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
      },
    ]
  },
  [Items.STEAK_DEER]: {
    filterId: FilterIds.COOKING,
    components: [
      {
        itemDefinitionId: Items.MEAT_VENISON,
        requiredAmount: 1
      },
    ]
  },
  [Items.WEAPON_HAMMER_DEMOLITION]: {
    filterId: FilterIds.WEAPONS,
    components: [
      {
        itemDefinitionId: Items.METAL_PIPE,
        requiredAmount: 1
      },
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
      },
    ]
  },
  [Items.BANDAGE_DRESSED]: {
    filterId: FilterIds.SURVIVAL,
    components: [
      {
        itemDefinitionId: Items.BANDAGE,
        requiredAmount: 5
      },
      {
        itemDefinitionId: Items.HONEY,
        requiredAmount: 1
      },
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
      },
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
      },
    ]
  },
  [Items.AMMO_ARROW_EXPLOSIVE]: {
    filterId: FilterIds.WEAPONS,
    craftAmount: 10,
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
      },
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
      },
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
      },
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
      },
    ]
  },
  [Items.AMMO_ARROW_FLAMING]: {
    filterId: FilterIds.WEAPONS,
    craftAmount: 10,
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
      },
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
      },
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
      },
    ]
  },
  [Items.FLOUR]: {
    filterId: FilterIds.SURVIVAL,
    components: [
      {
        itemDefinitionId: Items.WHEAT,
        requiredAmount: 1
      },
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
      },
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
      },
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
      },
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
      },
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
      },
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
      },
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
      },
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
      },
    ]
  },
  // TODO
  /*
  [Items.GUN_PART]: {
    filterId: FilterIds.COMPONENT,
    components: [
      {
        itemDefinitionId: Items.WEAPON_1911,
        requiredAmount: 1
      },
    ]
  },
  */
  [Items.REPAIR_KIT_GUN]: {
    filterId: FilterIds.WEAPONS,
    components: [
      {
        itemDefinitionId: Items.GUN_PART,
        requiredAmount: 2
      },
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
      },
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
      },
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
      },
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
      },
    ]
  },
  [Items.BLACKBERRY_HANDFUL]: {
    filterId: FilterIds.SURVIVAL,
    components: [
      {
        itemDefinitionId: Items.BLACKBERRY,
        requiredAmount: 10
      },
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
      },
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
      },
    ]
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
      },
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
      },
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
      },
    ]
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
      },
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
      },
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
      },
    ]
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
      },
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
      },
    ]
  },
  [Items.METAL_BAR]: {
    filterId: FilterIds.FURNACE,
    components: [
      {
        itemDefinitionId: Items.METAL_SCRAP,
        requiredAmount: 1
      },
    ]
  },
  [Items.METAL_BRACKET]: {
    filterId: FilterIds.COMPONENT,
    components: [
      {
        itemDefinitionId: Items.METAL_SCRAP,
        requiredAmount: 1
      },
    ]
  },
  [Items.METAL_DOOR]: {
    filterId: FilterIds.HOUSING,
    components: [
      {
        itemDefinitionId: Items.METAL_SHEET,
        requiredAmount: 2
      },
      {
        itemDefinitionId: Items.METAL_BRACKET,
        requiredAmount: 2
      },
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
      },
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
      },
    ]
  },
  [Items.SHARD_METAL]: {
    filterId: FilterIds.COMPONENT,
    components: [
      {
        itemDefinitionId: Items.METAL_SCRAP,
        requiredAmount: 1
      },
    ]
  },
  [Items.METAL_SHEET]: {
    filterId: FilterIds.COMPONENT,
    components: [
      {
        itemDefinitionId: Items.METAL_BAR,
        requiredAmount: 2
      },
    ]
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
      },
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
      },
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
      },
    ]
  },









  [Items.NAIL]: {
    filterId: FilterIds.COMPONENT,
    components: [
      {
        itemDefinitionId: Items.SHARD_METAL,
        requiredAmount: 1
      },
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
      },
    ]
  },
  [Items.METAL_PIPE]: {
    filterId: FilterIds.COMPONENT,
    components: [
      {
        itemDefinitionId: Items.METAL_SHEET,
        requiredAmount: 2
      },
    ]
  },
  [Items.SHARD_PLASTIC]: {
    filterId: FilterIds.COMPONENT,
    components: [
      {
        itemDefinitionId: Items.WATER_EMPTY,
        requiredAmount: 3
      },
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
      },
    ]
  },
  // TODO: Implement this once it's found in itemdefinitions
  /*
  [Items.PUNJI_STICK_ROW]: {
    filterId: FilterIds.,
    components: [
      {
        itemDefinitionId: Items.WOOD_STICK,
        requiredAmount: 20
      },
    ]
  },
  */
  [Items.PUNJI_STICKS]: {
    filterId: FilterIds.SURVIVAL,
    components: [
      {
        itemDefinitionId: Items.WOOD_STICK,
        requiredAmount: 8
      },
    ]
  },
  [Items.WATER_PURE]: {
    filterId: FilterIds.COOKING,
    components: [
      {
        itemDefinitionId: Items.WATER_STAGNANT,
        requiredAmount: 1
      },
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
      },
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
      },
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
      },
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
      },
    ]
  },
  [Items.CORN_ROASTED]: {
    filterId: FilterIds.COOKING,
    components: [
      {
        itemDefinitionId: Items.CORN,
        requiredAmount: 1
      },
    ]
  },


  "3": {
    "unknownDword1": 0,
    "descriptionId": 588,
    "unknownDword2": 1,
    "bundleCount": 0,
    "membersOnly": false,
    "filterId": 5,
    "components": [
      {
        "unknownDword1": 0,
        "nameId": 631,
        "iconId": 77,
        "unknownDword2": 0,
        "requiredAmount": 1,
        "unknownQword1": "0x0000000000000000",
        "unknownDword3": 0,
        "itemDefinitionId": 111
      },
      {
        "unknownDword1": 0,
        "nameId": 2,
        "iconId": 39,
        "unknownDword2": 0,
        "requiredAmount": 1,
        "unknownQword1": "0x0000000000000000",
        "unknownDword3": 0,
        "itemDefinitionId": 48
      }
    ],
    "itemDefinitionId": 3
  },
  "4": {
    "unknownDword1": 0,
    "descriptionId": 1029,
    "unknownDword2": 1,
    "bundleCount": 0,
    "membersOnly": false,
    "filterId": 7,
    "components": [
      {
        "unknownDword1": 0,
        "nameId": 47,
        "iconId": 32,
        "unknownDword2": 0,
        "requiredAmount": 1,
        "unknownQword1": "0x0000000000000000",
        "unknownDword3": 0,
        "itemDefinitionId": 25
      },
      {
        "unknownDword1": 0,
        "nameId": 49,
        "iconId": 22,
        "unknownDword2": 0,
        "requiredAmount": 1,
        "unknownQword1": "0x0000000000000000",
        "unknownDword3": 0,
        "itemDefinitionId": 23
      },
      {
        "unknownDword1": 0,
        "nameId": 11,
        "iconId": 19,
        "unknownDword2": 0,
        "requiredAmount": 1,
        "unknownQword1": "0x0000000000000000",
        "unknownDword3": 0,
        "itemDefinitionId": 57
      }
    ],
    "itemDefinitionId": 4
  },
  "5": {
    "unknownDword1": 0,
    "descriptionId": 592,
    "unknownDword2": 1,
    "bundleCount": 0,
    "membersOnly": false,
    "filterId": 7,
    "components": [
      {
        "unknownDword1": 0,
        "nameId": 631,
        "iconId": 77,
        "unknownDword2": 0,
        "requiredAmount": 1,
        "unknownQword1": "0x0000000000000000",
        "unknownDword3": 0,
        "itemDefinitionId": 111
      },
      {
        "unknownDword1": 0,
        "nameId": 49,
        "iconId": 22,
        "unknownDword2": 0,
        "requiredAmount": 1,
        "unknownQword1": "0x0000000000000000",
        "unknownDword3": 0,
        "itemDefinitionId": 23
      },
      {
        "unknownDword1": 0,
        "nameId": 252,
        "iconId": 169,
        "unknownDword2": 0,
        "requiredAmount": 1,
        "unknownQword1": "0x0000000000000000",
        "unknownDword3": 0,
        "itemDefinitionId": 72
      }
    ],
    "itemDefinitionId": 5
  },
  "18": {
    "unknownDword1": 0,
    "descriptionId": 642,
    "unknownDword2": 1,
    "bundleCount": 0,
    "membersOnly": false,
    "filterId": 2,
    "components": [
      {
        "unknownDword1": 0,
        "nameId": 44,
        "iconId": 13,
        "unknownDword2": 0,
        "requiredAmount": 1,
        "unknownQword1": "0x0000000000000000",
        "unknownDword3": 0,
        "itemDefinitionId": 17
      }
    ],
    "itemDefinitionId": 18
  },
  "26": {
    "unknownDword1": 0,
    "descriptionId": 1239,
    "unknownDword2": 1,
    "bundleCount": 0,
    "membersOnly": false,
    "filterId": 2,
    "components": [
      {
        "unknownDword1": 0,
        "nameId": 43,
        "iconId": 16,
        "unknownDword2": 0,
        "requiredAmount": 2,
        "unknownQword1": "0x0000000000000000",
        "unknownDword3": 0,
        "itemDefinitionId": 16
      }
    ],
    "itemDefinitionId": 26
  },
  "77": {
    "unknownDword1": 0,
    "descriptionId": 329,
    "unknownDword2": 1,
    "bundleCount": 0,
    "membersOnly": false,
    "filterId": 7,
    "components": [
      {
        "unknownDword1": 0,
        "nameId": 1048,
        "iconId": 99,
        "unknownDword2": 0,
        "requiredAmount": 1,
        "unknownQword1": "0x0000000000000000",
        "unknownDword3": 0,
        "itemDefinitionId": 1371
      },
      {
        "unknownDword1": 0,
        "nameId": 51,
        "iconId": 18,
        "unknownDword2": 0,
        "requiredAmount": 1,
        "unknownQword1": "0x0000000000000000",
        "unknownDword3": 0,
        "itemDefinitionId": 22
      }
    ],
    "itemDefinitionId": 77
  },
  "78": {
    "unknownDword1": 0,
    "descriptionId": 331,
    "unknownDword2": 1,
    "bundleCount": 0,
    "membersOnly": false,
    "filterId": 7,
    "components": [
      {
        "unknownDword1": 0,
        "nameId": 53,
        "iconId": 21,
        "unknownDword2": 0,
        "requiredAmount": 1,
        "unknownQword1": "0x0000000000000000",
        "unknownDword3": 0,
        "itemDefinitionId": 24
      },
      {
        "unknownDword1": 0,
        "nameId": 328,
        "iconId": 3,
        "unknownDword2": 0,
        "requiredAmount": 1,
        "unknownQword1": "0x0000000000000000",
        "unknownDword3": 0,
        "itemDefinitionId": 77
      }
    ],
    "itemDefinitionId": 78
  },
  "81": {
    "unknownDword1": 0,
    "descriptionId": 349,
    "unknownDword2": 1,
    "bundleCount": 0,
    "membersOnly": false,
    "filterId": 6,
    "components": [
      {
        "unknownDword1": 0,
        "nameId": 666,
        "iconId": 162,
        "unknownDword2": 0,
        "requiredAmount": 2,
        "unknownQword1": "0x0000000000000000",
        "unknownDword3": 0,
        "itemDefinitionId": 141
      },
      {
        "unknownDword1": 0,
        "nameId": 57,
        "iconId": 29,
        "unknownDword2": 0,
        "requiredAmount": 2,
        "unknownQword1": "0x0000000000000000",
        "unknownDword3": 0,
        "itemDefinitionId": 46
      }
    ],
    "itemDefinitionId": 81
  },
  "89": {
    "unknownDword1": 0,
    "descriptionId": 591,
    "unknownDword2": 1,
    "bundleCount": 0,
    "membersOnly": false,
    "filterId": 6,
    "components": [
      {
        "unknownDword1": 0,
        "nameId": 629,
        "iconId": 44,
        "unknownDword2": 0,
        "requiredAmount": 4,
        "unknownQword1": "0x0000000000000000",
        "unknownDword3": 0,
        "itemDefinitionId": 109
      },
      {
        "unknownDword1": 0,
        "nameId": 666,
        "iconId": 162,
        "unknownDword2": 0,
        "requiredAmount": 1,
        "unknownQword1": "0x0000000000000000",
        "unknownDword3": 0,
        "itemDefinitionId": 141
      },
      {
        "unknownDword1": 0,
        "nameId": 654,
        "iconId": 163,
        "unknownDword2": 0,
        "requiredAmount": 1,
        "unknownQword1": "0x0000000000000000",
        "unknownDword3": 0,
        "itemDefinitionId": 135
      }
    ],
    "itemDefinitionId": 89
  },
  "109": {
    "unknownDword1": 0,
    "descriptionId": 1026,
    "unknownDword2": 1,
    "bundleCount": 0,
    "membersOnly": false,
    "filterId": 8,
    "components": [
      {
        "unknownDword1": 0,
        "nameId": 43,
        "iconId": 16,
        "unknownDword2": 0,
        "requiredAmount": 1,
        "unknownQword1": "0x0000000000000000",
        "unknownDword3": 0,
        "itemDefinitionId": 16
      }
    ],
    "itemDefinitionId": 109
  },
  "111": {
    "unknownDword1": 0,
    "descriptionId": 1026,
    "unknownDword2": 1,
    "bundleCount": 0,
    "membersOnly": false,
    "filterId": 8,
    "components": [
      {
        "unknownDword1": 0,
        "nameId": 629,
        "iconId": 44,
        "unknownDword2": 0,
        "requiredAmount": 1,
        "unknownQword1": "0x0000000000000000",
        "unknownDword3": 0,
        "itemDefinitionId": 109
      }
    ],
    "itemDefinitionId": 111
  },
  "112": {
    "unknownDword1": 0,
    "descriptionId": 1220,
    "unknownDword2": 1,
    "bundleCount": 0,
    "membersOnly": false,
    "filterId": 5,
    "components": [
      {
        "unknownDword1": 0,
        "nameId": 631,
        "iconId": 77,
        "unknownDword2": 0,
        "requiredAmount": 1,
        "unknownQword1": "0x0000000000000000",
        "unknownDword3": 0,
        "itemDefinitionId": 111
      }
    ],
    "itemDefinitionId": 112
  },
  "122": {
    "unknownDword1": 0,
    "descriptionId": 646,
    "unknownDword2": 1,
    "bundleCount": 0,
    "membersOnly": false,
    "filterId": 6,
    "components": [
      {
        "unknownDword1": 0,
        "nameId": 654,
        "iconId": 163,
        "unknownDword2": 0,
        "requiredAmount": 4,
        "unknownQword1": "0x0000000000000000",
        "unknownDword3": 0,
        "itemDefinitionId": 135
      },
      {
        "unknownDword1": 0,
        "nameId": 629,
        "iconId": 44,
        "unknownDword2": 0,
        "requiredAmount": 2,
        "unknownQword1": "0x0000000000000000",
        "unknownDword3": 0,
        "itemDefinitionId": 109
      }
    ],
    "itemDefinitionId": 122
  },
  "150": {
    "unknownDword1": 0,
    "descriptionId": 687,
    "unknownDword2": 1,
    "bundleCount": 0,
    "membersOnly": false,
    "filterId": 6,
    "components": [
      {
        "unknownDword1": 0,
        "nameId": 629,
        "iconId": 44,
        "unknownDword2": 0,
        "requiredAmount": 4,
        "unknownQword1": "0x0000000000000000",
        "unknownDword3": 0,
        "itemDefinitionId": 109
      },
      {
        "unknownDword1": 0,
        "nameId": 654,
        "iconId": 163,
        "unknownDword2": 0,
        "requiredAmount": 8,
        "unknownQword1": "0x0000000000000000",
        "unknownDword3": 0,
        "itemDefinitionId": 135
      },
      {
        "unknownDword1": 0,
        "nameId": 57,
        "iconId": 29,
        "unknownDword2": 0,
        "requiredAmount": 2,
        "unknownQword1": "0x0000000000000000",
        "unknownDword3": 0,
        "itemDefinitionId": 46
      }
    ],
    "itemDefinitionId": 150
  },
  "154": {
    "unknownDword1": 0,
    "descriptionId": 687,
    "unknownDword2": 1,
    "bundleCount": 0,
    "membersOnly": false,
    "filterId": 6,
    "components": [
      {
        "unknownDword1": 0,
        "nameId": 629,
        "iconId": 44,
        "unknownDword2": 0,
        "requiredAmount": 4,
        "unknownQword1": "0x0000000000000000",
        "unknownDword3": 0,
        "itemDefinitionId": 109
      },
      {
        "unknownDword1": 0,
        "nameId": 631,
        "iconId": 77,
        "unknownDword2": 0,
        "requiredAmount": 8,
        "unknownQword1": "0x0000000000000000",
        "unknownDword3": 0,
        "itemDefinitionId": 111
      },
      {
        "unknownDword1": 0,
        "nameId": 666,
        "iconId": 162,
        "unknownDword2": 0,
        "requiredAmount": 4,
        "unknownQword1": "0x0000000000000000",
        "unknownDword3": 0,
        "itemDefinitionId": 141
      },
      {
        "unknownDword1": 0,
        "nameId": 654,
        "iconId": 163,
        "unknownDword2": 0,
        "requiredAmount": 8,
        "unknownQword1": "0x0000000000000000",
        "unknownDword3": 0,
        "itemDefinitionId": 135
      }
    ],
    "itemDefinitionId": 154
  },
  "1343": {
    "unknownDword1": 0,
    "descriptionId": 595,
    "unknownDword2": 1,
    "bundleCount": 0,
    "membersOnly": false,
    "filterId": 2,
    "components": [
      {
        "unknownDword1": 0,
        "nameId": 935,
        "iconId": 13,
        "unknownDword2": 0,
        "requiredAmount": 1,
        "unknownQword1": "0x0000000000000000",
        "unknownDword3": 0,
        "itemDefinitionId": 1342
      }
    ],
    "itemDefinitionId": 1343
  },
  "1379": {
    "unknownDword1": 0,
    "descriptionId": 595,
    "unknownDword2": 1,
    "bundleCount": 0,
    "membersOnly": false,
    "filterId": 7,
    "components": [
      {
        "unknownDword1": 0,
        "nameId": 1048,
        "iconId": 99,
        "unknownDword2": 0,
        "requiredAmount": 1,
        "unknownQword1": "0x0000000000000000",
        "unknownDword3": 0,
        "itemDefinitionId": 1371
      },
      {
        "unknownDword1": 0,
        "nameId": 51,
        "iconId": 18,
        "unknownDword2": 0,
        "requiredAmount": 1,
        "unknownQword1": "0x0000000000000000",
        "unknownDword3": 0,
        "itemDefinitionId": 22
      },
      {
        "unknownDword1": 0,
        "nameId": 23,
        "iconId": 2,
        "unknownDword2": 0,
        "requiredAmount": 1,
        "unknownQword1": "0x0000000000000000",
        "unknownDword3": 0,
        "itemDefinitionId": 7
      }
    ],
    "itemDefinitionId": 1379
  },
  "1415": {
    "unknownDword1": 0,
    "descriptionId": 1154,
    "unknownDword2": 1,
    "bundleCount": 0,
    "membersOnly": false,
    "filterId": 7,
    "components": [
      {
        "unknownDword1": 0,
        "nameId": 634,
        "iconId": 86,
        "unknownDword2": 0,
        "requiredAmount": 1,
        "unknownQword1": "0x0000000000000000",
        "unknownDword3": 0,
        "itemDefinitionId": 114
      },
      {
        "unknownDword1": 0,
        "nameId": 57,
        "iconId": 29,
        "unknownDword2": 0,
        "requiredAmount": 1,
        "unknownQword1": "0x0000000000000000",
        "unknownDword3": 0,
        "itemDefinitionId": 46
      }
    ],
    "itemDefinitionId": 1415
  },
  "1417": {
    "unknownDword1": 0,
    "descriptionId": 1243,
    "unknownDword2": 1,
    "bundleCount": 0,
    "membersOnly": false,
    "filterId": 7,
    "components": [
      {
        "unknownDword1": 0,
        "nameId": 628,
        "iconId": 100,
        "unknownDword2": 0,
        "requiredAmount": 1,
        "unknownQword1": "0x0000000000000000",
        "unknownDword3": 0,
        "itemDefinitionId": 107
      }
    ],
    "itemDefinitionId": 1417
  },
  "1432": {
    "unknownDword1": 0,
    "descriptionId": 1173,
    "unknownDword2": 1,
    "bundleCount": 0,
    "membersOnly": false,
    "filterId": 7,
    "components": [
      {
        "unknownDword1": 0,
        "nameId": 49,
        "iconId": 22,
        "unknownDword2": 0,
        "requiredAmount": 6,
        "unknownQword1": "0xFFFFFFFFFFFFFFFF",
        "unknownDword3": 0,
        "itemDefinitionId": 23
      }
    ],
    "itemDefinitionId": 1432
  },
  "1433": {
    "unknownDword1": 0,
    "descriptionId": 1180,
    "unknownDword2": 1,
    "bundleCount": 0,
    "membersOnly": false,
    "filterId": 6,
    "components": [
      {
        "unknownDword1": 0,
        "nameId": 629,
        "iconId": 44,
        "unknownDword2": 0,
        "requiredAmount": 8,
        "unknownQword1": "0x0000000000000000",
        "unknownDword3": 0,
        "itemDefinitionId": 109
      },
      {
        "unknownDword1": 0,
        "nameId": 654,
        "iconId": 163,
        "unknownDword2": 0,
        "requiredAmount": 17,
        "unknownQword1": "0x0000000000000000",
        "unknownDword3": 0,
        "itemDefinitionId": 135
      },
      {
        "unknownDword1": 0,
        "nameId": 57,
        "iconId": 29,
        "unknownDword2": 0,
        "requiredAmount": 2,
        "unknownQword1": "0x0000000000000000",
        "unknownDword3": 0,
        "itemDefinitionId": 46
      }
    ],
    "itemDefinitionId": 1433
  },
  "1435": {
    "unknownDword1": 0,
    "descriptionId": 1181,
    "unknownDword2": 1,
    "bundleCount": 0,
    "membersOnly": false,
    "filterId": 6,
    "components": [
      {
        "unknownDword1": 0,
        "nameId": 629,
        "iconId": 44,
        "unknownDword2": 0,
        "requiredAmount": 4,
        "unknownQword1": "0x0000000000000000",
        "unknownDword3": 0,
        "itemDefinitionId": 109
      },
      {
        "unknownDword1": 0,
        "nameId": 654,
        "iconId": 163,
        "unknownDword2": 0,
        "requiredAmount": 2,
        "unknownQword1": "0x0000000000000000",
        "unknownDword3": 0,
        "itemDefinitionId": 135
      },
      {
        "unknownDword1": 0,
        "nameId": 666,
        "iconId": 162,
        "unknownDword2": 0,
        "requiredAmount": 2,
        "unknownQword1": "0x0000000000000000",
        "unknownDword3": 0,
        "itemDefinitionId": 141
      }
    ],
    "itemDefinitionId": 1435
  },
  "1440": {
    "unknownDword1": 0,
    "descriptionId": 1180,
    "unknownDword2": 1,
    "bundleCount": 0,
    "membersOnly": false,
    "filterId": 6,
    "components": [
      {
        "unknownDword1": 0,
        "nameId": 629,
        "iconId": 44,
        "unknownDword2": 0,
        "requiredAmount": 4,
        "unknownQword1": "0x0000000000000000",
        "unknownDword3": 0,
        "itemDefinitionId": 109
      },
      {
        "unknownDword1": 0,
        "nameId": 654,
        "iconId": 163,
        "unknownDword2": 0,
        "requiredAmount": 4,
        "unknownQword1": "0x0000000000000000",
        "unknownDword3": 0,
        "itemDefinitionId": 135
      },
      {
        "unknownDword1": 0,
        "nameId": 666,
        "iconId": 162,
        "unknownDword2": 0,
        "requiredAmount": 2,
        "unknownQword1": "0x0000000000000000",
        "unknownDword3": 0,
        "itemDefinitionId": 141
      }
    ],
    "itemDefinitionId": 1440
  },
  "1445": {
    "unknownDword1": 0,
    "descriptionId": 1000,
    "unknownDword2": 1,
    "bundleCount": 0,
    "membersOnly": false,
    "filterId": 7,
    "components": [
      {
        "unknownDword1": 0,
        "nameId": 1184,
        "iconId": 42,
        "unknownDword2": 0,
        "requiredAmount": 1,
        "unknownQword1": "0x0000000000000000",
        "unknownDword3": 0,
        "itemDefinitionId": 1438
      },
      {
        "unknownDword1": 0,
        "nameId": 1048,
        "iconId": 99,
        "unknownDword2": 0,
        "requiredAmount": 1,
        "unknownQword1": "0x0000000000000000",
        "unknownDword3": 0,
        "itemDefinitionId": 1371
      },
      {
        "unknownDword1": 0,
        "nameId": 11,
        "iconId": 19,
        "unknownDword2": 0,
        "requiredAmount": 1,
        "unknownQword1": "0x0000000000000000",
        "unknownDword3": 0,
        "itemDefinitionId": 57
      }
    ],
    "itemDefinitionId": 1445
  },
  "1448": {
    "unknownDword1": 0,
    "descriptionId": 1248,
    "unknownDword2": 1,
    "bundleCount": 0,
    "membersOnly": false,
    "filterId": 5,
    "components": [
      {
        "unknownDword1": 0,
        "nameId": 54,
        "iconId": 40,
        "unknownDword2": 0,
        "requiredAmount": 1,
        "unknownQword1": "0x0000000000000000",
        "unknownDword3": 0,
        "itemDefinitionId": 39
      },
      {
        "unknownDword1": 0,
        "nameId": 58,
        "iconId": 30,
        "unknownDword2": 0,
        "requiredAmount": 1,
        "unknownQword1": "0x0000000000000000",
        "unknownDword3": 0,
        "itemDefinitionId": 47
      }
    ],
    "itemDefinitionId": 1448
  },
  "1456": {
    "unknownDword1": 0,
    "descriptionId": 1252,
    "unknownDword2": 1,
    "bundleCount": 0,
    "membersOnly": false,
    "filterId": 7,
    "components": [
      {
        "unknownDword1": 0,
        "nameId": 1250,
        "iconId": 42,
        "unknownDword2": 0,
        "requiredAmount": 1,
        "unknownQword1": "0x0000000000000000",
        "unknownDword3": 0,
        "itemDefinitionId": 1455
      },
      {
        "unknownDword1": 0,
        "nameId": 1048,
        "iconId": 99,
        "unknownDword2": 0,
        "requiredAmount": 1,
        "unknownQword1": "0x0000000000000000",
        "unknownDword3": 0,
        "itemDefinitionId": 1371
      }
    ],
    "itemDefinitionId": 1456
  },
  "1458": {
    "unknownDword1": 0,
    "descriptionId": 1109,
    "unknownDword2": 1,
    "bundleCount": 0,
    "membersOnly": false,
    "filterId": 7,
    "components": [
      {
        "unknownDword1": 0,
        "nameId": 936,
        "iconId": 15,
        "unknownDword2": 0,
        "requiredAmount": 1,
        "unknownQword1": "0x0000000000000000",
        "unknownDword3": 0,
        "itemDefinitionId": 1343
      },
      {
        "unknownDword1": 0,
        "nameId": 1251,
        "iconId": 170,
        "unknownDword2": 0,
        "requiredAmount": 1,
        "unknownQword1": "0x0000000000000000",
        "unknownDword3": 0,
        "itemDefinitionId": 1456
      }
    ],
    "itemDefinitionId": 1458
  },
  "1538": {
    "unknownDword1": 0,
    "descriptionId": 1474,
    "unknownDword2": 1,
    "bundleCount": 0,
    "membersOnly": false,
    "filterId": 6,
    "components": [
      {
        "unknownDword1": 0,
        "nameId": 631,
        "iconId": 77,
        "unknownDword2": 0,
        "requiredAmount": 1,
        "unknownQword1": "0x0000000000000000",
        "unknownDword3": 0,
        "itemDefinitionId": 111
      },
      {
        "unknownDword1": 0,
        "nameId": 54,
        "iconId": 40,
        "unknownDword2": 0,
        "requiredAmount": 2,
        "unknownQword1": "0x0000000000000000",
        "unknownDword3": 0,
        "itemDefinitionId": 39
      }
    ],
    "itemDefinitionId": 1538
  },
  "1672": {
    "unknownDword1": 0,
    "descriptionId": 1483,
    "unknownDword2": 1,
    "bundleCount": 0,
    "membersOnly": false,
    "filterId": 7,
    "components": [
      {
        "unknownDword1": 0,
        "nameId": 47,
        "iconId": 32,
        "unknownDword2": 0,
        "requiredAmount": 1,
        "unknownQword1": "0x0000000000000000",
        "unknownDword3": 0,
        "itemDefinitionId": 25
      },
      {
        "unknownDword1": 0,
        "nameId": 49,
        "iconId": 22,
        "unknownDword2": 0,
        "requiredAmount": 1,
        "unknownQword1": "0x0000000000000000",
        "unknownDword3": 0,
        "itemDefinitionId": 23
      },
      {
        "unknownDword1": 0,
        "nameId": 11,
        "iconId": 19,
        "unknownDword2": 0,
        "requiredAmount": 1,
        "unknownQword1": "0x0000000000000000",
        "unknownDword3": 0,
        "itemDefinitionId": 57
      }
    ],
    "itemDefinitionId": 1672
  },
}