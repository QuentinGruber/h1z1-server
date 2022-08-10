// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2022 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

export enum Characters {
  MALE_WHITE = 1,
  MALE_WHITE_BALD = 2,
  FEMALE_WHITE_YOUNG = 3,
  FEMALE_WHITE = 4,
  MALE_BLACK = 5,
  FEMALE_BLACK = 6
}

export enum LoadoutIds {
  CHARACTER = 3
}

export enum LoadoutSlots {
  PRIMARY = 1,
  FISTS = 7,
  HEAD = 11,
  ARMOR = 38,
}

export enum EquipSlots {
  HEAD = 1,
  HANDS = 2,
  CHEST = 3,
  LEGS = 4,
  FEET = 5,
  RHAND = 7,
  BACKPACK = 10,
  HAIR = 27,
  FACE = 28,
  EYES = 29,
  ARMOR = 100,
}

export enum EntityTypes {
  INVALID = 0,
  NPC = 1,
  VEHICLE = 2,
  PLAYER = 3,
  OBJECT = 4,
  DOOR = 5,
  EXPLOSIVE = 6,
}

export enum ResourceIds {
  HEALTH = 1,
  HUNGER = 4,
  HYDRATION = 5,
  STAMINA = 6,
  VIRUS = 12,
  BLEEDING = 21,
  COMFORT = 68,
  FUEL = 396,
  CONDITION = 561,
}

export enum ResourceTypes {
  HEALTH = 1,
  HUNGER = 4,
  HYDRATION = 5,
  STAMINA = 6,
  VIRUS = 12,
  BLEEDING = 21,
  COMFORT = 68,
  FUEL = 50,
  CONDITION = 1,
}

export enum Items {
  WEAPON_AR15 = 10,
  WEAPON_AK47 = 2229,
  WEAPON_SHOTGUN = 2663,
  WEAPON_CROWBAR = 82,
  WEAPON_COMBATKNIFE = 84,
  WEAPON_MACHETE01 = 83,
  WEAPON_KATANA = 2961,
  WEAPON_BAT_WOOD = 1724,
  WEAPON_GUITAR = 1733,
  WEAPON_AXE_WOOD = 58,
  WEAPON_AXE_FIRE = 1745,
  WEAPON_HAMMER = 1536,
  WEAPON_HATCHET = 3,
  WEAPON_PIPE = 1448,
  WEAPON_BAT_ALUM = 1721,
  WEAPON_BOW_MAKESHIFT = 113,
  WEAPON_BOW_WOOD = 1720,
  WEAPON_BOW_RECURVE = 1986,
  WEAPON_1911 = 2,
  WEAPON_M9 = 1997,
  WEAPON_308 = 1373,
  WEAPON_BINOCULARS = 1542,
  WEAPON_CROSSBOW = 2246,
  WEAPON_R380 = 1991,
  WEAPON_MOLOTOV = 14,
  WEAPON_MAGNUM = 1718,
  WEAPON_FLASHLIGHT = 1380,
  WEAPON_WRENCH = 1538,
  WEAPON_BRANCH = 1725,
  WEAPON_FISTS = 85,
  AMMO_223 = 1429,
  AMMO_12GA = 1511,
  AMMO_45 = 1428,
  AMMO_9MM = 1998, // TODO = assign it to a spawner
  AMMO_308 = 1469,
  AMMO_380 = 1992,
  AMMO_762 = 2325,
  AMMO_44 = 1719,
  BACKPACK = 1605,
  GAS_CAN = 73,
  FIRST_AID = 2424,
  GROUND_COFFEE = 56, // TODO = expand with more canned food types
  CANNED_FOOD01 = 7,
  WATER_PURE = 1371,
  HELMET_MOTORCYCLE = 2170, // TODO = expand with other default helmet colors
  HAT_CAP = 12, // TODO = expand with other cap colors
  SHIRT_DEFAULT = 2088, // TODO = expand with other default shirts
  PANTS_DEFAULT = 2177, // TODO = expand with other default pants
  CONVEYS_BLUE = 2217, // TODO = expand with other convey colors
  HAT_BEANIE = 2162,
  SUGAR = 57,
  BATTERY = 1696,
  SPARKPLUGS = 1701,
  SALT = 22,
  LIGHTER = 1436,
  WATER_EMPTY = 1353,
  MRE_APPLE = 1402, // TODO = add other MRE types
  FUEL_BIOFUEL = 73,
  WOOD_PLANK = 109,
  METAL_SHEET = 46,
  METAL_SCRAP = 48,
  TARP = 155,
  WOOD_LOG = 16,
  GROUND_TILLER = 1383,
  FERTILIZER = 25,
  SEED_CORN = 1987,
  SEED_WHEAT = 1988,
  BANDAGE = 24,
  BANDAGE_DRESSED = 2214,
  VIAL_EMPTY = 2510,
  SYRINGE_EMPTY = 1508,
  GHILLIE_SUIT = 92,
  HELMET_TACTICAL = 2172,
  RESPIRATOR = 2148,
  NV_GOGGLES = 1700,
  GUNPOWDER = 11,
  LANDMINE = 74,
  KEVLAR_DEFAULT = 2271,
  CLOTH = 23,
  METAL_PIPE = 47,
  HEADLIGHTS_OFFROADER = 9,
  HEADLIGHTS_POLICE = 1730,
  HEADLIGHTS_ATV = 2595,
  HEADLIGHTS_PICKUP = 1728,
  TURBO_OFFROADER = 90,
  TURBO_POLICE = 1731,
  TURBO_ATV = 2727,
  TURBO_PICKUP = 1729,
  GRENADE_SMOKE = 2236,
  GRENADE_FLASH = 2235,
  GRENADE_GAS = 2237,
  GRENADE_HE = 2243,
  MAP = 1985,
  COMPASS = 1441,
  GAUZE = 1751,
  FLARE = 1804,
  BACKPACK_RASTA = 2393,
  WAIST_PACK = 1803
}
