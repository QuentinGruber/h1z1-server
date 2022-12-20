import { ContainerLootSpawner, LootSpawner } from "types/zoneserver";
import { Items } from "../models/enums";

const carparts = [
  // NEED TO ADJUST THESE WEIGHTS
  {
    item: Items.BATTERY,
    weight: 100,
    spawnCount: {
      min: 1,
      max: 1,
    },
  },
  {
    item: Items.SPARKPLUGS,
    weight: 100,
    spawnCount: {
      min: 1,
      max: 1,
    },
  },
  {
    item: Items.HEADLIGHTS_OFFROADER,
    weight: 100,
    spawnCount: {
      min: 1,
      max: 1,
    },
  },
  {
    item: Items.HEADLIGHTS_POLICE,
    weight: 100,
    spawnCount: {
      min: 1,
      max: 1,
    },
  },
  {
    item: Items.HEADLIGHTS_ATV,
    weight: 100,
    spawnCount: {
      min: 1,
      max: 1,
    },
  },
  {
    item: Items.HEADLIGHTS_PICKUP,
    weight: 100,
    spawnCount: {
      min: 1,
      max: 1,
    },
  },
  {
    item: Items.TURBO_OFFROADER,
    weight: 100,
    spawnCount: {
      min: 1,
      max: 1,
    },
  },
  {
    item: Items.TURBO_POLICE,
    weight: 100,
    spawnCount: {
      min: 1,
      max: 1,
    },
  },
  {
    item: Items.TURBO_ATV,
    weight: 100,
    spawnCount: {
      min: 1,
      max: 1,
    },
  },
  {
    item: Items.TURBO_PICKUP,
    weight: 100,
    spawnCount: {
      min: 1,
      max: 1,
    },
  },
];

export const lootTables: { [lootSpawner: string]: LootSpawner } = {
  // #region AR15
  "ItemSpawner_Weapon_M16A4.adr": {
    spawnChance: 50,
    items: [
      {
        item: Items.WEAPON_AR15,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
    ],
  },
  "ItemSpawner_AmmoBox02_M16A4.adr": {
    spawnChance: 50,
    items: [
      {
        item: Items.AMMO_223,
        weight: 100,
        spawnCount: {
          min: 5,
          max: 10,
        },
      },
    ],
  },
  "ItemSpawner_AmmoBox02.adr": {
    spawnChance: 50,
    items: [
      {
        item: Items.AMMO_223,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 5,
        },
      },
    ],
  },
  // #endregion

  // #region SHOTGUN
  "ItemSpawner_Weapon_PumpShotgun01.adr": {
    spawnChance: 50,
    items: [
      {
        item: Items.WEAPON_SHOTGUN,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
    ],
  },
  "ItemSpawner_AmmoBox02_12GaShotgun.adr": {
    spawnChance: 50,
    items: [
      {
        item: Items.AMMO_12GA,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 3,
        },
      },
    ],
  },
  // #endregion

  // #region TOOLS
  "ItemSpawner_Weapon_Crowbar01.adr": {
    spawnChance: 50,
    items: [
      {
        item: Items.WEAPON_CROWBAR,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
    ],
  },
  "ItemSpawner_Weapon_CombatKnife01.adr": {
    spawnChance: 50,
    items: [
      {
        item: Items.WEAPON_COMBATKNIFE,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
    ],
  },
  "ItemSpawner_Weapon_Machete01.adr": {
    spawnChance: 50,
    items: [
      {
        item: Items.WEAPON_MACHETE01,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
      {
        // did not spawn in this game version but why not
        item: Items.WEAPON_KATANA,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
    ],
  },
  "ItemSpawner_Weapon_Bat01.adr": {
    spawnChance: 50,
    items: [
      {
        item: Items.WEAPON_BAT_WOOD,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
    ],
  },
  "ItemSpawner_Weapon_Guitar01.adr": {
    spawnChance: 50,
    items: [
      {
        item: Items.WEAPON_GUITAR,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
    ],
  },
  "ItemSpawner_Weapon_WoodAxe01.adr": {
    spawnChance: 50,
    items: [
      {
        item: Items.WEAPON_AXE_WOOD,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
    ],
  },
  "ItemSpawner_Weapon_FireAxe01.adr": {
    spawnChance: 50,
    items: [
      {
        item: Items.WEAPON_AXE_FIRE,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
    ],
  },
  "ItemSpawner_Weapon_ClawHammer01.adr": {
    spawnChance: 50,
    items: [
      {
        item: Items.WEAPON_HAMMER,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
    ],
  },
  "ItemSpawner_Weapon_Hatchet01.adr": {
    spawnChance: 50,
    items: [
      {
        item: Items.WEAPON_HATCHET,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
    ],
  },
  "ItemSpawner_Weapon_Pipe01.adr": {
    spawnChance: 50,
    items: [
      {
        item: Items.WEAPON_PIPE,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
    ],
  },
  "ItemSpawner_Weapon_Bat02.adr": {
    spawnChance: 50,
    items: [
      {
        item: Items.WEAPON_BAT_ALUM,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
    ],
  },
  "ItemSpawner_Weapon_Bow.adr": {
    spawnChance: 50,
    items: [
      {
        item: Items.WEAPON_BOW_MAKESHIFT,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
    ],
  },
  // #endregion

  // #region PISTOLS
  "ItemSpawner_Weapon_45Auto.adr": {
    spawnChance: 100,
    items: [
      {
        item: Items.WEAPON_1911,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
    ],
  },
  "ItemSpawner_Weapon_M9Auto.adr": {
    // need to find 9MM ammo spawner
    spawnChance: 100,
    items: [
      {
        item: Items.WEAPON_M9,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
    ],
  },
  "ItemSpawner_AmmoBox02_1911.adr": {
    spawnChance: 100,
    items: [
      {
        item: Items.AMMO_45,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 5,
        },
      },
    ],
  },
  // #endregion

  // #region 308 RIFLE
  "ItemSpawner_Weapon_M24.adr": {
    spawnChance: 50,
    items: [
      {
        item: Items.WEAPON_308,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
    ],
  },
  "ItemSpawner_AmmoBox02_308Rifle.adr": {
    spawnChance: 50,
    items: [
      {
        item: Items.AMMO_308,
        weight: 100,
        spawnCount: {
          min: 2,
          max: 4,
        },
      },
    ],
  },
  // #endregion

  // #region CONSUMABLES
  "ItemSpawner_FirstAidKit.adr": {
    spawnChance: 50,
    items: [
      {
        item: Items.FIRST_AID,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
    ],
  },
  "ItemSpawner_CannedFood.adr": {
    spawnChance: 50,
    items: [
      {
        item: Items.GROUND_COFFEE,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
      {
        item: Items.CANNED_FOOD01,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
    ],
  },
  "ItemSpawner_WaterContainer_Small_Purified.adr": {
    spawnChance: 50,
    items: [
      {
        item: Items.WATER_PURE,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
    ],
  },
  // #endregion

  // #region CLOTHING
  "ItemSpawner_Clothes_MotorcycleHelmet.adr": {
    spawnChance: 50,
    items: [
      {
        item: Items.HELMET_MOTORCYCLE,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
    ],
  },
  "ItemSpawner_Clothes_BaseballCap.adr": {
    spawnChance: 50,
    items: [
      {
        item: Items.HAT_CAP,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
    ],
  },
  "ItemSpawner_Clothes_FoldedShirt.adr": {
    spawnChance: 50,
    items: [
      {
        item: Items.SHIRT_DEFAULT,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
      {
        item: Items.PANTS_DEFAULT,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
    ],
  },
  "ItemSpawner_Clothes_Beanie.adr": {
    spawnChance: 50,
    items: [
      {
        item: Items.HAT_BEANIE,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
    ],
  },
  // #endregion

  // #region RESIDENTIAL
  "ItemSpawnerResidential_Tier00.adr": {
    spawnChance: 30,
    items: [
      {
        item: Items.DUCT_TAPE,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
      {
        item: Items.TWINE,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
      {
        item: Items.SUGAR,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
      {
        item: Items.SHIRT_DEFAULT,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
      {
        item: Items.PANTS_DEFAULT,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
      {
        item: Items.CONVEYS_BLUE,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
      {
        item: Items.BATTERY,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
      {
        item: Items.WEAPON_COMBATKNIFE,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
      {
        item: Items.HAT_CAP,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
      {
        item: Items.HAT_BEANIE,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
      {
        item: Items.HELMET_MOTORCYCLE,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
      {
        item: Items.CANNED_FOOD01,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
      {
        item: Items.SALT,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
      {
        item: Items.LIGHTER,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
      {
        item: Items.WATER_EMPTY,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
      {
        item: Items.WATER_PURE,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
      {
        item: Items.AMMO_45,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 5,
        },
      },
      {
        item: Items.AMMO_9MM,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 5,
        },
      },
      {
        item: Items.AMMO_380,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 5,
        },
      },
      {
        item: Items.AMMO_44,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 5,
        },
      },
      {
        item: Items.AMMO_223,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 5,
        },
      },
      {
        item: Items.AMMO_762,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 5,
        },
      },
      {
        item: Items.AMMO_308,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 3,
        },
      },
      {
        item: Items.AMMO_12GA,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 3,
        },
      },
      {
        item: Items.SPARKPLUGS,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
      {
        item: Items.FIRST_AID,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
      {
        item: Items.WEAPON_BINOCULARS,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
      {
        item: Items.WEAPON_BAT_WOOD,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
      {
        item: Items.WEAPON_BAT_ALUM,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
      {
        item: Items.BACKPACK_MILITARY_TAN,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
      {
        item: Items.BACKPACK_MILITARY_TAN,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
    ],
  },
  // #endregion

  // #region RARE
  "ItemSpawnerRare_Tier00.adr": {
    spawnChance: 50,
    items: [
      {
        item: Items.AMMO_45,
        weight: 100,
        spawnCount: {
          min: 3,
          max: 8,
        },
      },
      {
        item: Items.AMMO_9MM,
        weight: 100,
        spawnCount: {
          min: 3,
          max: 8,
        },
      },
      {
        item: Items.AMMO_380,
        weight: 100,
        spawnCount: {
          min: 3,
          max: 8,
        },
      },
      {
        item: Items.AMMO_44,
        weight: 100,
        spawnCount: {
          min: 2,
          max: 8,
        },
      },
      {
        item: Items.AMMO_223,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 8,
        },
      },
      {
        item: Items.AMMO_762,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 8,
        },
      },
      {
        item: Items.AMMO_308,
        weight: 100,
        spawnCount: {
          min: 2,
          max: 5,
        },
      },
      {
        item: Items.AMMO_12GA,
        weight: 100,
        spawnCount: {
          min: 2,
          max: 5,
        },
      },
      {
        item: Items.WEAPON_1911,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
      {
        item: Items.WEAPON_M9,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
      {
        item: Items.WEAPON_R380,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
      {
        item: Items.WEAPON_MAGNUM,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
      {
        item: Items.WEAPON_308,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
      {
        item: Items.WEAPON_SHOTGUN,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
      {
        item: Items.WEAPON_AR15,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
      {
        item: Items.WEAPON_AK47,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
    ],
  },
  // #endregion

  // #region INDUSTRIAL
  "ItemSpawnerIndustrial_Tier00.adr": {
    spawnChance: 30,
    items: [
      ...carparts,
      {
        item: Items.DUCT_TAPE,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
      {
        item: Items.TWINE,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
      {
        item: Items.WATER_EMPTY,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
      {
        item: Items.WOOD_PLANK,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 5,
        },
      },
      {
        item: Items.METAL_SHEET,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 3,
        },
      },
      {
        item: Items.METAL_SCRAP,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 4,
        },
      },
      {
        item: Items.WEAPON_PIPE,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 2,
        },
      },
      {
        item: Items.WEAPON_AXE_WOOD,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
      {
        item: Items.TARP,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 2,
        },
      },
    ],
  },
  // #endregion

  // #region WORLD
  "ItemSpawnerWorld_Tier00.adr": {
    spawnChance: 30,
    items: [
      {
        item: Items.WEAPON_MACHETE01,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
      {
        item: Items.WATER_EMPTY,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
      {
        item: Items.WATER_PURE,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
      {
        item: Items.SHIRT_DEFAULT,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
      {
        item: Items.PANTS_DEFAULT,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
      {
        item: Items.CONVEYS_BLUE,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
      {
        item: Items.WEAPON_HATCHET,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
      {
        item: Items.HAT_CAP,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
      {
        item: Items.HAT_BEANIE,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
      {
        item: Items.HELMET_MOTORCYCLE,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
      {
        item: Items.CANNED_FOOD01,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
    ],
  },
  // #endregion

  // #region COMMERCIAL
  "ItemSpawnerCommercial_Tier00.adr": {
    spawnChance: 30,
    items: [
      {
        item: Items.DUCT_TAPE,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
      {
        item: Items.TWINE,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
      {
        item: Items.BATTERY,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
      {
        item: Items.SPARKPLUGS,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
      {
        item: Items.WATER_EMPTY,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
      {
        item: Items.WATER_PURE,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
      {
        item: Items.HELMET_MOTORCYCLE,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
      {
        item: Items.SUGAR,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
      {
        item: Items.SALT,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
      {
        item: Items.CANNED_FOOD01,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
    ],
  },
  // #endregion

  // #region FARM
  "ItemSpawnerFarm.adr": {
    spawnChance: 30,
    items: [
      {
        item: Items.FERTILIZER,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
      {
        item: Items.WEAPON_AXE_WOOD,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
      {
        item: Items.SEED_CORN,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
      {
        item: Items.SEED_WHEAT,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
      {
        item: Items.WEAPON_HATCHET,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
      {
        item: Items.WATER_EMPTY,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
      {
        item: Items.GROUND_TILLER,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
    ],
  },
  // #endregion

  // #region HOSPITAL
  "ItemSpawnerHospital.adr": {
    spawnChance: 40,
    items: [
      {
        item: Items.FIRST_AID,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
      {
        item: Items.MRE_APPLE,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
      {
        item: Items.BANDAGE,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 2,
        },
      },
      {
        item: Items.VIAL_EMPTY,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 2,
        },
      },
      {
        item: Items.SYRINGE_EMPTY,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 2,
        },
      },
      {
        item: Items.SHIRT_DEFAULT,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
      {
        item: Items.PANTS_DEFAULT,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
      {
        item: Items.WATER_PURE,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
      {
        item: Items.WATER_EMPTY,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
      {
        item: Items.CLOTH,
        weight: 100,
        spawnCount: {
          min: 2,
          max: 5,
        },
      },
    ],
  },
  // #endregion

  // #region MILITARY
  "ItemSpawner_Z1_MilitaryBase_MotorPool.adr": {
    spawnChance: 50,
    items: [
      // COMMON
      {
        item: Items.DUCT_TAPE,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
      {
        item: Items.WEAPON_BINOCULARS,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
      {
        item: Items.WEAPON_COMBATKNIFE,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
      {
        item: Items.FLARE,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
      {
        item: Items.METAL_SCRAP,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
      {
        item: Items.CLOTH,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 5,
        },
      },
      {
        item: Items.WEAPON_FLASHLIGHT,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
      {
        item: Items.TARP,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 2,
        },
      },
      {
        item: Items.MRE_APPLE,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
      {
        item: Items.BACKPACK_MILITARY_TAN,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
    ],
  },
  "ItemSpawner_Z1_MilitaryBase_Tents1.adr": {
    spawnChance: 30,
    items: [
      // UNCOMMON
      {
        item: Items.WEAPON_CROSSBOW,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
      {
        item: Items.WEAPON_R380,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
      {
        item: Items.GHILLIE_SUIT,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
      {
        item: Items.HELMET_MOTORCYCLE,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
      {
        item: Items.HELMET_TACTICAL,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
      {
        item: Items.RESPIRATOR,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
      {
        item: Items.FIRST_AID,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
      {
        item: Items.AMMO_45,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 10,
        },
      },
      {
        item: Items.AMMO_9MM,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 10,
        },
      },
      {
        item: Items.AMMO_380,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 10,
        },
      },
      {
        item: Items.AMMO_44,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 10,
        },
      },
      {
        item: Items.AMMO_223,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 10,
        },
      },
      {
        item: Items.AMMO_762,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 10,
        },
      },
      {
        item: Items.AMMO_308,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 10,
        },
      },
      {
        item: Items.AMMO_12GA,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 10,
        },
      },
      {
        item: Items.NV_GOGGLES,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
      {
        item: Items.MRE_APPLE,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
      {
        item: Items.BACKPACK_MILITARY_TAN,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
    ],
  },
  "ItemSpawner_Z1_MilitaryBase_Tents2.adr": {
    spawnChance: 50,
    items: [
      // RARE
      {
        item: Items.WEAPON_MOLOTOV,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
      {
        item: Items.WEAPON_MAGNUM,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
      {
        item: Items.AMMO_308,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 5,
        },
      },
      {
        item: Items.AMMO_12GA,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 6,
        },
      },
      {
        item: Items.GUNPOWDER,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
      {
        item: Items.LANDMINE,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
      {
        item: Items.KEVLAR_DEFAULT,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
      {
        item: Items.BACKPACK_MILITARY_TAN,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
    ],
  },
  "ItemSpawner_Z1_MilitaryBase_Hangar.adr": {
    spawnChance: 50,
    items: [
      // INDUSTRIAL
      ...carparts,
      {
        item: Items.DUCT_TAPE,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
      {
        item: Items.METAL_SHEET,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 3,
        },
      },
      {
        item: Items.METAL_SCRAP,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 4,
        },
      },
      {
        item: Items.WEAPON_PIPE,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 2,
        },
      },
      {
        item: Items.WEAPON_CROWBAR,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
      {
        item: Items.WEAPON_HAMMER,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
      {
        item: Items.FUEL_BIOFUEL,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
      {
        item: Items.WEAPON_WRENCH,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
    ],
  },
  "ItemSpawner_Weapon_GrenadeSmoke.adr": {
    spawnChance: 50,
    items: [
      {
        item: Items.GRENADE_SMOKE,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
    ],
  },
  "ItemSpawner_Weapon_GrenadeFlashbang.adr": {
    spawnChance: 50,
    items: [
      {
        item: Items.GRENADE_FLASH,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
    ],
  },
  "ItemSpawner_Weapon_GrenadeGas.adr": {
    spawnChance: 50,
    items: [
      {
        item: Items.GRENADE_GAS,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
    ],
  },
  "ItemSpawner_Weapon_GrenadeHE.adr": {
    spawnChance: 50,
    items: [
      {
        item: Items.GRENADE_HE,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
    ],
  },
  // #endregion

  // #region MISC
  "ItemSpawner_BackpackOnGround001.adr": {
    spawnChance: 50,
    items: [
      {
        item: Items.BACKPACK_MILITARY_TAN,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
    ],
  },
  "ItemSpawner_GasCan01.adr": {
    spawnChance: 50,
    items: [
      {
        item: Items.FUEL_BIOFUEL,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 1,
        },
      },
    ],
  },
  "ItemSpawner_Log01.adr": {
    spawnChance: 50,
    items: [
      {
        item: Items.WOOD_LOG,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 4,
        },
      },
    ],
  },
  // #endregion
};

export const containerLootSpawners: {
  [lootSpawner: string]: ContainerLootSpawner;
} = {
  // TODO WHEN CONTAINERS WORK
  "test-container": {
    spawnChance: 100,
    maxItems: 5,
    items: [
      {
        item: Items.AMMO_223,
        weight: 100,
        spawnCount: {
          min: 1,
          max: 5,
        },
      },
    ],
  },
};
