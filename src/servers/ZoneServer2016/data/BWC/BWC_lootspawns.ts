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

import { ContainerLootSpawner, LootSpawner } from "types/zoneserver";
import { Items } from "../../models/enums";

const carparts = [
  // NEED TO ADJUST THESE WEIGHTS
  {
    item: Items.BATTERY,
    weight: 5,
    spawnCount: {
      min: 1,
      max: 1
    }
  },
  {
    item: Items.SPARKPLUGS,
    weight: 5,
    spawnCount: {
      min: 1,
      max: 1
    }
  },
  {
    item: Items.HEADLIGHTS_OFFROADER,
    weight: 5,
    spawnCount: {
      min: 1,
      max: 1
    }
  },
  {
    item: Items.HEADLIGHTS_POLICE,
    weight: 5,
    spawnCount: {
      min: 1,
      max: 1
    }
  },
  {
    item: Items.HEADLIGHTS_ATV,
    weight: 5,
    spawnCount: {
      min: 1,
      max: 1
    }
  },
  {
    item: Items.HEADLIGHTS_PICKUP,
    weight: 5,
    spawnCount: {
      min: 1,
      max: 1
    }
  },
  {
    item: Items.TURBO_OFFROADER,
    weight: 5,
    spawnCount: {
      min: 1,
      max: 1
    }
  },
  {
    item: Items.TURBO_POLICE,
    weight: 5,
    spawnCount: {
      min: 1,
      max: 1
    }
  },
  {
    item: Items.TURBO_ATV,
    weight: 5,
    spawnCount: {
      min: 1,
      max: 1
    }
  },
  {
    item: Items.TURBO_PICKUP,
    weight: 5,
    spawnCount: {
      min: 1,
      max: 1
    }
  }
];

export const lootTablesBWC: { [lootSpawner: string]: LootSpawner } = {
  "ItemSpawner_JS_Suburban_All.adr": {
    spawnChance: 20,
    items: [
      {
        item: Items.WEAPON_308,
        weight: 10,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.WEAPON_SHOTGUN,
        weight: 10,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.WEAPON_1911,
        weight: 25,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.WEAPON_M9,
        weight: 25,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.DUCT_TAPE,
        weight: 30,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.TWINE,
        weight: 30,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.SHIRT_DEFAULT,
        weight: 40,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.PANTS_DEFAULT,
        weight: 40,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.CONVEYS_BLUE,
        weight: 30,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.BATTERY,
        weight: 10,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.WEAPON_COMBATKNIFE,
        weight: 40,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.HAT_CAP,
        weight: 40,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.HAT_BEANIE,
        weight: 40,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.HELMET_MOTORCYCLE,
        weight: 30,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.CANNED_FOOD01,
        weight: 30,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.WEAPON_REPAIR_KIT,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.WATER_EMPTY,
        weight: 20,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.WATER_PURE,
        weight: 25,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.AMMO_45,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 4
        }
      },
      {
        item: Items.AMMO_9MM,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 4
        }
      },
      {
        item: Items.AMMO_380,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 4
        }
      },
      {
        item: Items.AMMO_44,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 3
        }
      },
      {
        item: Items.AMMO_223,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 3
        }
      },
      {
        item: Items.AMMO_762,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 3
        }
      },
      {
        item: Items.AMMO_308,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 3
        }
      },
      {
        item: Items.AMMO_12GA,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 3
        }
      },
      {
        item: Items.SPARKPLUGS,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.FIRST_AID,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.WEAPON_BINOCULARS,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.WEAPON_BAT_WOOD,
        weight: 20,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.WEAPON_BAT_ALUM,
        weight: 20,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.BACKPACK_BLUE_ORANGE,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.EMERGENCY_RADIO,
        weight: 5,
        spawnCount: {
          min: 1,
          max: 1
        }
      }
    ]
  },

  "ItemSpawner_JS_Suburban_Small.adr": {
    spawnChance: 20,
    items: [
      {
        item: Items.WEAPON_308,
        weight: 10,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.WEAPON_SHOTGUN,
        weight: 10,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.WEAPON_1911,
        weight: 25,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.WEAPON_M9,
        weight: 25,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.DUCT_TAPE,
        weight: 30,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.TWINE,
        weight: 30,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.SHIRT_DEFAULT,
        weight: 40,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.PANTS_DEFAULT,
        weight: 40,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.CONVEYS_BLUE,
        weight: 30,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.BATTERY,
        weight: 10,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.WEAPON_COMBATKNIFE,
        weight: 40,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.HAT_CAP,
        weight: 40,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.HAT_BEANIE,
        weight: 40,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.HELMET_MOTORCYCLE,
        weight: 30,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.CANNED_FOOD01,
        weight: 30,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.WEAPON_REPAIR_KIT,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.WATER_EMPTY,
        weight: 20,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.WATER_PURE,
        weight: 25,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.AMMO_45,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 4
        }
      },
      {
        item: Items.AMMO_9MM,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 4
        }
      },
      {
        item: Items.AMMO_380,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 4
        }
      },
      {
        item: Items.AMMO_44,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 3
        }
      },
      {
        item: Items.AMMO_223,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 3
        }
      },
      {
        item: Items.AMMO_762,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 3
        }
      },
      {
        item: Items.AMMO_308,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 3
        }
      },
      {
        item: Items.AMMO_12GA,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 3
        }
      },
      {
        item: Items.SPARKPLUGS,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.FIRST_AID,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.WEAPON_BINOCULARS,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.WEAPON_BAT_WOOD,
        weight: 20,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.WEAPON_BAT_ALUM,
        weight: 20,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.BACKPACK_BLUE_ORANGE,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.EMERGENCY_RADIO,
        weight: 5,
        spawnCount: {
          min: 1,
          max: 1
        }
      }
    ]
  },

  "ItemSpawner_JS_Rural_Small.adr": {
    spawnChance: 20,
    items: [
      {
        item: Items.WEAPON_308,
        weight: 10,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.WEAPON_SHOTGUN,
        weight: 10,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.WEAPON_1911,
        weight: 25,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.WEAPON_M9,
        weight: 25,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.DUCT_TAPE,
        weight: 30,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.TWINE,
        weight: 30,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.SHIRT_DEFAULT,
        weight: 40,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.PANTS_DEFAULT,
        weight: 40,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.CONVEYS_BLUE,
        weight: 30,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.BATTERY,
        weight: 10,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.WEAPON_COMBATKNIFE,
        weight: 40,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.HAT_CAP,
        weight: 40,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.HAT_BEANIE,
        weight: 40,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.HELMET_MOTORCYCLE,
        weight: 30,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.CANNED_FOOD01,
        weight: 30,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.CANNED_FOOD02,
        weight: 30,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.CANNED_FOOD03,
        weight: 30,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.CANNED_FOOD04,
        weight: 30,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.CANNED_FOOD05,
        weight: 30,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.WEAPON_REPAIR_KIT,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.WATER_EMPTY,
        weight: 20,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.WATER_PURE,
        weight: 25,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.AMMO_45,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 4
        }
      },
      {
        item: Items.AMMO_9MM,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 4
        }
      },
      {
        item: Items.AMMO_380,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 4
        }
      },
      {
        item: Items.AMMO_44,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 3
        }
      },
      {
        item: Items.AMMO_223,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 3
        }
      },
      {
        item: Items.AMMO_762,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 3
        }
      },
      {
        item: Items.AMMO_308,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 3
        }
      },
      {
        item: Items.AMMO_12GA,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 3
        }
      },
      {
        item: Items.SPARKPLUGS,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.FIRST_AID,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.WEAPON_BINOCULARS,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.WEAPON_BAT_WOOD,
        weight: 20,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.WEAPON_BAT_ALUM,
        weight: 20,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.BACKPACK_BLUE_ORANGE,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.EMERGENCY_RADIO,
        weight: 5,
        spawnCount: {
          min: 1,
          max: 1
        }
      }
    ]
  },

  "ItemSpawner_JS_Rural_All.adr": {
    spawnChance: 20,
    items: [
      {
        item: Items.WEAPON_308,
        weight: 10,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.WEAPON_SHOTGUN,
        weight: 10,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.WEAPON_1911,
        weight: 25,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.WEAPON_M9,
        weight: 25,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.DUCT_TAPE,
        weight: 30,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.TWINE,
        weight: 30,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.SHIRT_DEFAULT,
        weight: 40,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.PANTS_DEFAULT,
        weight: 40,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.CONVEYS_BLUE,
        weight: 30,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.BATTERY,
        weight: 10,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.WEAPON_COMBATKNIFE,
        weight: 40,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.HAT_CAP,
        weight: 40,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.HAT_BEANIE,
        weight: 40,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.HELMET_MOTORCYCLE,
        weight: 30,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.CANNED_FOOD01,
        weight: 30,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.CANNED_FOOD02,
        weight: 30,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.CANNED_FOOD03,
        weight: 30,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.CANNED_FOOD04,
        weight: 30,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.CANNED_FOOD05,
        weight: 30,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.WEAPON_REPAIR_KIT,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.WATER_EMPTY,
        weight: 20,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.WATER_PURE,
        weight: 25,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.AMMO_45,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 4
        }
      },
      {
        item: Items.AMMO_9MM,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 4
        }
      },
      {
        item: Items.AMMO_380,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 4
        }
      },
      {
        item: Items.AMMO_44,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 3
        }
      },
      {
        item: Items.AMMO_223,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 3
        }
      },
      {
        item: Items.AMMO_762,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 3
        }
      },
      {
        item: Items.AMMO_308,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 3
        }
      },
      {
        item: Items.AMMO_12GA,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 3
        }
      },
      {
        item: Items.SPARKPLUGS,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.FIRST_AID,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.WEAPON_BINOCULARS,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.WEAPON_BAT_WOOD,
        weight: 20,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.WEAPON_BAT_ALUM,
        weight: 20,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.BACKPACK_BLUE_ORANGE,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.EMERGENCY_RADIO,
        weight: 5,
        spawnCount: {
          min: 1,
          max: 1
        }
      }
    ]
  },
  // #endregion

  // #region INDUSTRIAL
  "ItemSpawner_JS_Industrial_All.adr": {
    spawnChance: 20,
    items: [
      ...carparts,
      {
        item: Items.DUCT_TAPE,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.WEAPON_CROWBAR,
        weight: 10,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.WEAPON_PICKAXE,
        weight: 10,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.TWINE,
        weight: 10,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.WATER_EMPTY,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.WOOD_PLANK,
        weight: 20,
        spawnCount: {
          min: 1,
          max: 5
        }
      },
      {
        item: Items.METAL_SHEET,
        weight: 10,
        spawnCount: {
          min: 1,
          max: 3
        }
      },
      {
        item: Items.METAL_SCRAP,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 4
        }
      },
      {
        item: Items.METAL_PIPE,
        weight: 10,
        spawnCount: {
          min: 1,
          max: 2
        }
      },
      {
        item: Items.WEAPON_AXE_WOOD,
        weight: 10,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.TARP,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 2
        }
      },
      {
        item: Items.EMERGENCY_RADIO,
        weight: 5,
        spawnCount: {
          min: 1,
          max: 1
        }
      }
    ]
  },

  "ItemSpawner_JS_Industrial_Small.adr": {
    spawnChance: 20,
    items: [
      ...carparts,
      {
        item: Items.DUCT_TAPE,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.WEAPON_CROWBAR,
        weight: 10,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.WEAPON_PICKAXE,
        weight: 10,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.TWINE,
        weight: 10,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.WATER_EMPTY,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.WOOD_PLANK,
        weight: 20,
        spawnCount: {
          min: 1,
          max: 5
        }
      },
      {
        item: Items.METAL_SHEET,
        weight: 10,
        spawnCount: {
          min: 1,
          max: 3
        }
      },
      {
        item: Items.METAL_SCRAP,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 4
        }
      },
      {
        item: Items.METAL_PIPE,
        weight: 10,
        spawnCount: {
          min: 1,
          max: 2
        }
      },
      {
        item: Items.WEAPON_AXE_WOOD,
        weight: 10,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.TARP,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 2
        }
      },
      {
        item: Items.EMERGENCY_RADIO,
        weight: 5,
        spawnCount: {
          min: 1,
          max: 1
        }
      }
    ]
  },
  // #endregion

  // #region COMMERCIAL
  "ItemSpawner_JS_Commercial_All.adr": {
    spawnChance: 20,
    items: [
      {
        item: Items.DUCT_TAPE,
        weight: 5,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.BATTERY,
        weight: 5,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.SPARKPLUGS,
        weight: 5,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.BATTERY,
        weight: 5,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.WATER_EMPTY,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.WATER_STAGNANT,
        weight: 10,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.CANNED_FOOD01,
        weight: 20,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.CANNED_FOOD02,
        weight: 20,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.CANNED_FOOD03,
        weight: 20,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.CANNED_FOOD04,
        weight: 20,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.CANNED_FOOD05,
        weight: 20,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.EMERGENCY_RADIO,
        weight: 5,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.EMERGENCY_RADIO,
        weight: 5,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.MAP,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.COMPASS,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 1
        }
      }
    ]
  },
  "ItemSpawner_JS_Commercial_Small.adr": {
    spawnChance: 20,
    items: [
      {
        item: Items.DUCT_TAPE,
        weight: 5,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.BATTERY,
        weight: 5,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.SPARKPLUGS,
        weight: 5,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.BATTERY,
        weight: 5,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.WATER_EMPTY,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.WATER_STAGNANT,
        weight: 10,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.CANNED_FOOD01,
        weight: 20,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.CANNED_FOOD02,
        weight: 20,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.CANNED_FOOD03,
        weight: 20,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.CANNED_FOOD04,
        weight: 20,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.CANNED_FOOD05,
        weight: 20,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.EMERGENCY_RADIO,
        weight: 5,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.EMERGENCY_RADIO,
        weight: 5,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.MAP,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.COMPASS,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 1
        }
      }
    ]
  },

  // #endregion

  // #region FARM
  "ItemSpawner_JS_Agricultural_All.adr": {
    spawnChance: 20,
    items: [
      {
        item: Items.FERTILIZER,
        weight: 20,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.WEAPON_AXE_WOOD,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.SEED_CORN,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.SEED_WHEAT,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.WEAPON_HATCHET,
        weight: 10,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.WATER_EMPTY,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.SHIRT_DEFAULT,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.PANTS_DEFAULT,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.WEAPON_1911,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.AMMO_45,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 3
        }
      }
    ]
  },

  "ItemSpawner_JS_Agricultural_Small.adr": {
    spawnChance: 20,
    items: [
      {
        item: Items.FERTILIZER,
        weight: 20,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.WEAPON_AXE_WOOD,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.SEED_CORN,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.SEED_WHEAT,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.WEAPON_HATCHET,
        weight: 10,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.WATER_EMPTY,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.SHIRT_DEFAULT,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.PANTS_DEFAULT,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.WEAPON_1911,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.AMMO_45,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 3
        }
      }
    ]
  },
  // #endregion

  // #region MILITARY
  "ItemSpawner_JS_PoliceMilitary_Small.adr": {
    spawnChance: 25,
    items: [
      {
        item: Items.WEAPON_R380,
        weight: 40,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.HELMET_MOTORCYCLE,
        weight: 40,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.HELMET_TACTICAL,
        weight: 35,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.RESPIRATOR,
        weight: 40,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.FIRST_AID,
        weight: 40,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.AMMO_45,
        weight: 35,
        spawnCount: {
          min: 1,
          max: 4
        }
      },
      {
        item: Items.AMMO_9MM,
        weight: 35,
        spawnCount: {
          min: 1,
          max: 4
        }
      },
      {
        item: Items.AMMO_380,
        weight: 35,
        spawnCount: {
          min: 1,
          max: 4
        }
      },
      {
        item: Items.AMMO_44,
        weight: 35,
        spawnCount: {
          min: 1,
          max: 4
        }
      },
      {
        item: Items.AMMO_223,
        weight: 30,
        spawnCount: {
          min: 1,
          max: 3
        }
      },
      {
        item: Items.AMMO_762,
        weight: 30,
        spawnCount: {
          min: 1,
          max: 3
        }
      },
      {
        item: Items.AMMO_308,
        weight: 30,
        spawnCount: {
          min: 1,
          max: 3
        }
      },
      {
        item: Items.AMMO_12GA,
        weight: 30,
        spawnCount: {
          min: 1,
          max: 3
        }
      },
      {
        item: Items.NV_GOGGLES,
        weight: 20,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.MRE_APPLE,
        weight: 40,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.BACKPACK_MILITARY_TAN,
        weight: 35,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.EMERGENCY_RADIO,
        weight: 30,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.KEVLAR_DEFAULT,
        weight: 30,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.WEAPON_AR15,
        weight: 25,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.WEAPON_308,
        weight: 25,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.WEAPON_1911,
        weight: 30,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.WEAPON_MAGNUM,
        weight: 35,
        spawnCount: {
          min: 1,
          max: 1
        }
      }
    ]
  },

  "ItemSpawner_JS_PoliceMilitary_All.adr": {
    spawnChance: 25,
    items: [
      {
        item: Items.WEAPON_R380,
        weight: 40,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.HELMET_MOTORCYCLE,
        weight: 40,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.HELMET_TACTICAL,
        weight: 35,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.RESPIRATOR,
        weight: 40,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.FIRST_AID,
        weight: 40,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.AMMO_45,
        weight: 35,
        spawnCount: {
          min: 1,
          max: 4
        }
      },
      {
        item: Items.AMMO_9MM,
        weight: 35,
        spawnCount: {
          min: 1,
          max: 4
        }
      },
      {
        item: Items.AMMO_380,
        weight: 35,
        spawnCount: {
          min: 1,
          max: 4
        }
      },
      {
        item: Items.AMMO_44,
        weight: 35,
        spawnCount: {
          min: 1,
          max: 4
        }
      },
      {
        item: Items.AMMO_223,
        weight: 30,
        spawnCount: {
          min: 1,
          max: 3
        }
      },
      {
        item: Items.AMMO_762,
        weight: 30,
        spawnCount: {
          min: 1,
          max: 3
        }
      },
      {
        item: Items.AMMO_308,
        weight: 30,
        spawnCount: {
          min: 1,
          max: 3
        }
      },
      {
        item: Items.AMMO_12GA,
        weight: 30,
        spawnCount: {
          min: 1,
          max: 3
        }
      },
      {
        item: Items.NV_GOGGLES,
        weight: 20,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.MRE_APPLE,
        weight: 40,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.BACKPACK_MILITARY_TAN,
        weight: 35,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.EMERGENCY_RADIO,
        weight: 30,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.KEVLAR_DEFAULT,
        weight: 30,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.WEAPON_AR15,
        weight: 25,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.WEAPON_308,
        weight: 25,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.WEAPON_1911,
        weight: 30,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.WEAPON_MAGNUM,
        weight: 35,
        spawnCount: {
          min: 1,
          max: 1
        }
      }
    ]
  }
  // #endregion
};

export const containerLootSpawnersBWC: {
  [lootSpawner: string]: ContainerLootSpawner;
} = {
  // TODO WHEN CONTAINERS WORK
  "Harvestable Vehicle": {
    spawnChance: 40,
    maxItems: 3, // cant be higher than length of items array below
    items: [
      {
        item: Items.METAL_SCRAP,
        weight: 60,
        spawnCount: {
          min: 3,
          max: 7
        }
      },
      {
        item: Items.METAL_SHEET,
        weight: 65,
        spawnCount: {
          min: 2,
          max: 3
        }
      },
      {
        item: Items.METAL_PIPE,
        weight: 30,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.NAIL,
        weight: 40,
        spawnCount: {
          min: 1,
          max: 8
        }
      },
      {
        item: Items.SHARD_METAL,
        weight: 40,
        spawnCount: {
          min: 1,
          max: 7
        }
      },
      {
        item: Items.GUN_REPAIR_KIT,
        weight: 10,
        spawnCount: {
          min: 1,
          max: 1
        }
      }
    ]
  },
  "Harvestable Truck": {
    spawnChance: 40,
    maxItems: 4, // cant be higher than length of items array below
    items: [
      {
        item: Items.METAL_SCRAP,
        weight: 60,
        spawnCount: {
          min: 3,
          max: 7
        }
      },
      {
        item: Items.METAL_SHEET,
        weight: 65,
        spawnCount: {
          min: 2,
          max: 3
        }
      },
      {
        item: Items.METAL_PIPE,
        weight: 30,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.NAIL,
        weight: 40,
        spawnCount: {
          min: 1,
          max: 8
        }
      },
      {
        item: Items.SHARD_METAL,
        weight: 40,
        spawnCount: {
          min: 1,
          max: 7
        }
      },
      {
        item: Items.TARP,
        weight: 40,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.GUN_REPAIR_KIT,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.WEAPON_CROWBAR,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.WEAPON_PICKAXE,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.WEAPON_AXE_WOOD,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.WEAPON_WRENCH,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.WEAPON_AR15,
        weight: 10,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.WEAPON_HAMMER,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.WEAPON_SHOTGUN,
        weight: 10,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.WEAPON_M9,
        weight: 10,
        spawnCount: {
          min: 1,
          max: 1
        }
      }
    ]
  },
  "Wrecked Truck": {
    spawnChance: 100,
    maxItems: 4,
    items: [
      {
        item: Items.METAL_SCRAP,
        weight: 33,
        spawnCount: {
          min: 1,
          max: 2
        }
      },
      {
        item: Items.METAL_SHEET,
        weight: 33,
        spawnCount: {
          min: 1,
          max: 2
        }
      },
      {
        item: Items.TARP,
        weight: 50,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.METAL_PIPE,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 1
        }
      }
    ]
  },
  "Weapons Locker": {
    spawnChance: 20,
    maxItems: 1,
    items: [
      {
        item: Items.WEAPON_AR15,
        weight: 40,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.WEAPON_308,
        weight: 40,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.AMMO_308,
        weight: 40,
        spawnCount: {
          min: 2,
          max: 5
        }
      },
      {
        item: Items.AMMO_223,
        weight: 40,
        spawnCount: {
          min: 2,
          max: 7
        }
      }
    ]
  },
  Locker: {
    spawnChance: 20,
    maxItems: 1,
    items: [
      {
        item: Items.BACKPACK_MILITARY_TAN,
        weight: 25,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.BACKPACK_BLUE_ORANGE,
        weight: 30,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.KEVLAR_DEFAULT,
        weight: 30,
        spawnCount: {
          min: 1,
          max: 1
        }
      }
    ]
  },
  Desk: {
    spawnChance: 40,
    maxItems: 2,
    items: [
      {
        item: Items.CLOTH,
        weight: 50,
        spawnCount: {
          min: 1,
          max: 2
        }
      },
      {
        item: Items.HAT_CAP,
        weight: 50,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.COMPASS,
        weight: 5,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.VEHICLE_KEY,
        weight: 5,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.MAP,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.COMPASS,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 1
        }
      }
    ]
  },
  Cabinets: {
    spawnChance: 40,
    maxItems: 2,
    items: [
      {
        item: Items.CLOTH,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 2
        }
      },
      {
        item: Items.LIGHTER,
        weight: 10,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.AMMO_45,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 2
        }
      },
      {
        item: Items.SALT,
        weight: 13,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.CANNED_FOOD01,
        weight: 30,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.CANNED_FOOD02,
        weight: 30,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.CANNED_FOOD03,
        weight: 30,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.CANNED_FOOD04,
        weight: 30,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.CANNED_FOOD05,
        weight: 30,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.CANNED_FOOD06,
        weight: 30,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.CANNED_FOOD07,
        weight: 30,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.CANNED_FOOD08,
        weight: 30,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.CANNED_FOOD09,
        weight: 30,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.CANNED_FOOD10,
        weight: 30,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.CANNED_FOOD11,
        weight: 30,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.CANNED_FOOD21,
        weight: 30,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.CANNED_FOOD25,
        weight: 30,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.CANNED_FOOD26,
        weight: 30,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.VEHICLE_KEY,
        weight: 5,
        spawnCount: {
          min: 1,
          max: 1
        }
      }
    ]
  },
  "Cabinets Cube": {
    spawnChance: 40,
    maxItems: 1,
    items: [
      {
        item: Items.SALT,
        weight: 20,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.LIGHTER,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.VEHICLE_KEY,
        weight: 5,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.CANNED_FOOD01,
        weight: 30,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.CANNED_FOOD02,
        weight: 30,
        spawnCount: {
          min: 1,
          max: 1
        }
      }
    ]
  },
  Stove: {
    spawnChance: 30,
    maxItems: 1,
    items: [
      {
        item: Items.WOOD_LOG,
        weight: 30,
        spawnCount: {
          min: 1,
          max: 2
        }
      },
      {
        item: Items.CHARCOAL,
        weight: 30,
        spawnCount: {
          min: 1,
          max: 2
        }
      }
    ]
  },
  "Cabinets Kitchen": {
    spawnChance: 40,
    maxItems: 2,
    items: [
      {
        item: Items.SALT,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.SUGAR,
        weight: 20,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.GROUND_COFFEE,
        weight: 30,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.CANNED_FOOD01,
        weight: 30,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.CANNED_FOOD02,
        weight: 30,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.CANNED_FOOD03,
        weight: 30,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.CANNED_FOOD04,
        weight: 30,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.CANNED_FOOD05,
        weight: 30,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.CANNED_FOOD06,
        weight: 30,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.CANNED_FOOD07,
        weight: 30,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.CANNED_FOOD08,
        weight: 30,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.CANNED_FOOD09,
        weight: 30,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.CANNED_FOOD10,
        weight: 30,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.CANNED_FOOD11,
        weight: 30,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.CANNED_FOOD21,
        weight: 30,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.CANNED_FOOD25,
        weight: 30,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.CANNED_FOOD26,
        weight: 30,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.SEED_CORN,
        weight: 25,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.SEED_WHEAT,
        weight: 25,
        spawnCount: {
          min: 1,
          max: 1
        }
      }
    ]
  },
  "Cabinets Bathroom": {
    spawnChance: 40,
    maxItems: 3,
    items: [
      {
        item: Items.ANTIBIOTICS,
        weight: 45,
        spawnCount: {
          min: 1,
          max: 2
        }
      },
      {
        item: Items.IMMUNITY_BOOSTERS,
        weight: 45,
        spawnCount: {
          min: 1,
          max: 2
        }
      },
      {
        item: Items.VITAMINS,
        weight: 45,
        spawnCount: {
          min: 1,
          max: 2
        }
      },
      {
        item: Items.BANDAGE,
        weight: 25,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.FIRST_AID,
        weight: 10,
        spawnCount: {
          min: 1,
          max: 1
        }
      }
    ]
  },
  "Metal Cabinet": {
    spawnChance: 45,
    maxItems: 3,
    items: [
      {
        item: Items.WEAPON_CROWBAR,
        weight: 30,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.METAL_PIPE,
        weight: 30,
        spawnCount: {
          min: 1,
          max: 2
        }
      },
      {
        item: Items.WEAPON_PIPE,
        weight: 30,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.LIGHTER,
        weight: 8,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.WEAPON_WRENCH,
        weight: 30,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.WEAPON_HAMMER_DEMOLITION,
        weight: 30,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.SHIRT_DEFAULT,
        weight: 30,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.WEAPON_SHOTGUN,
        weight: 5,
        spawnCount: {
          min: 1,
          max: 1
        }
      }
    ]
  },
  "Tool Cabinet": {
    spawnChance: 50,
    maxItems: 3,
    items: [
      {
        item: Items.WEAPON_CROWBAR,
        weight: 30,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.WEAPON_PICKAXE,
        weight: 30,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.METAL_PIPE,
        weight: 30,
        spawnCount: {
          min: 1,
          max: 2
        }
      },
      {
        item: Items.WEAPON_PIPE,
        weight: 30,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.LIGHTER,
        weight: 8,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.WEAPON_WRENCH,
        weight: 30,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.WEAPON_HAMMER_DEMOLITION,
        weight: 30,
        spawnCount: {
          min: 1,
          max: 1
        }
      }
    ]
  },
  "Drug Cabinets": {
    spawnChance: 40,
    maxItems: 2,
    items: [
      {
        item: Items.FIRST_AID,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.GAUZE,
        weight: 50,
        spawnCount: {
          min: 1,
          max: 3
        }
      },
      {
        item: Items.BANDAGE_DRESSED,
        weight: 30,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.BANDAGE,
        weight: 50,
        spawnCount: {
          min: 1,
          max: 2
        }
      },
      {
        item: Items.SALINE,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.SYRINGE_EMPTY,
        weight: 20,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.VITAMINS,
        weight: 30,
        spawnCount: {
          min: 1,
          max: 2
        }
      },
      {
        item: Items.ANTIBIOTICS,
        weight: 30,
        spawnCount: {
          min: 1,
          max: 2
        }
      },
      {
        item: Items.IMMUNITY_BOOSTERS,
        weight: 30,
        spawnCount: {
          min: 1,
          max: 2
        }
      }
    ]
  },
  Ambulance: {
    spawnChance: 50,
    maxItems: 4,
    items: [
      {
        item: Items.FIRST_AID,
        weight: 20,
        spawnCount: {
          min: 1,
          max: 2
        }
      },
      {
        item: Items.GAUZE,
        weight: 50,
        spawnCount: {
          min: 1,
          max: 3
        }
      },
      {
        item: Items.BANDAGE_DRESSED,
        weight: 30,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.BANDAGE,
        weight: 50,
        spawnCount: {
          min: 1,
          max: 3
        }
      },
      {
        item: Items.SALINE,
        weight: 20,
        spawnCount: {
          min: 1,
          max: 2
        }
      }
    ]
  },
  "Medical Station": {
    spawnChance: 40,
    maxItems: 2,
    items: [
      {
        item: Items.FIRST_AID,
        weight: 40,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.GAUZE,
        weight: 10,
        spawnCount: {
          min: 1,
          max: 3
        }
      },
      {
        item: Items.BANDAGE_DRESSED,
        weight: 10,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.BANDAGE,
        weight: 10,
        spawnCount: {
          min: 1,
          max: 2
        }
      },
      {
        item: Items.SALINE,
        weight: 5,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.SYRINGE_EMPTY,
        weight: 10,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.VITAMINS,
        weight: 10,
        spawnCount: {
          min: 1,
          max: 2
        }
      },
      {
        item: Items.ANTIBIOTICS,
        weight: 10,
        spawnCount: {
          min: 1,
          max: 2
        }
      },
      {
        item: Items.IMMUNITY_BOOSTERS,
        weight: 10,
        spawnCount: {
          min: 1,
          max: 2
        }
      }
    ]
  },
  "Hospital Desk": {
    spawnChance: 40,
    maxItems: 3,
    items: [
      {
        item: Items.EMPTY_SPECIMEN_BAG,
        weight: 10,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.GAUZE,
        weight: 10,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.BANDAGE_DRESSED,
        weight: 10,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.BANDAGE,
        weight: 10,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.SYRINGE_EMPTY,
        weight: 10,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.VITAMINS,
        weight: 10,
        spawnCount: {
          min: 1,
          max: 2
        }
      },
      {
        item: Items.ANTIBIOTICS,
        weight: 10,
        spawnCount: {
          min: 1,
          max: 2
        }
      },
      {
        item: Items.IMMUNITY_BOOSTERS,
        weight: 10,
        spawnCount: {
          min: 1,
          max: 2
        }
      },
      {
        item: Items.CRACKED_CLIPBOARD,
        weight: 5,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.DEAD_CELL_PHONE,
        weight: 3,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.DOCTORS_FILE,
        weight: 3,
        spawnCount: {
          min: 1,
          max: 1
        }
      }
    ]
  },
  "Hospital Cabinets": {
    spawnChance: 100,
    maxItems: 3,
    items: [
      {
        item: Items.GAUZE,
        weight: 10,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.DOCTORS_MEMO,
        weight: 10,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.WEAK_CELL_PHONE_BATTERY,
        weight: 10,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.WEICHS_WALLET,
        weight: 4,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.WEICHS_REPORT,
        weight: 4,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.KLAVISK_NOTE,
        weight: 4,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.BANDAGE_DRESSED,
        weight: 10,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.BANDAGE,
        weight: 10,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.SYRINGE_EMPTY,
        weight: 10,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.VITAMINS,
        weight: 10,
        spawnCount: {
          min: 1,
          max: 3
        }
      }
    ]
  },
  "Hospital Refrigerator": {
    spawnChance: 100,
    maxItems: 2,
    items: [
      {
        item: Items.SYRINGE_H1Z1_REDUCER,
        weight: 10,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.REFRIGERATOR_NOTE,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.SYRINGE_INFECTED_BLOOD,
        weight: 10,
        spawnCount: {
          min: 1,
          max: 1
        }
      }
    ]
  },
  "Grossing Station": {
    spawnChance: 100,
    maxItems: 2,
    items: [
      {
        item: Items.SYRINGE_H1Z1_REDUCER,
        weight: 10,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.SYRINGE_INFECTED_BLOOD,
        weight: 10,
        spawnCount: {
          min: 1,
          max: 1
        }
      }
    ]
  },
  Dumpster: {
    spawnChance: 100,
    maxItems: 3,
    items: [
      {
        item: Items.CLOTH,
        weight: 35,
        spawnCount: {
          min: 1,
          max: 3
        }
      },
      {
        item: Items.TWINE,
        weight: 25,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.FERTILIZER,
        weight: 10,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.CHARCOAL,
        weight: 25,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.WATER_EMPTY,
        weight: 25,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.ANIMAL_FAT,
        weight: 25,
        spawnCount: {
          min: 1,
          max: 2
        }
      }
    ]
  },
  "Garbage Can": {
    spawnChance: 40,
    maxItems: 3,
    items: [
      {
        item: Items.CLOTH,
        weight: 50,
        spawnCount: {
          min: 1,
          max: 3
        }
      },
      {
        item: Items.TWINE,
        weight: 25,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.FERTILIZER,
        weight: 5,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.CHARCOAL,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.WATER_EMPTY,
        weight: 25,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.ANIMAL_FAT,
        weight: 10,
        spawnCount: {
          min: 1,
          max: 2
        }
      },
      {
        item: Items.METAL_SCRAP,
        weight: 3,
        spawnCount: {
          min: 1,
          max: 2
        }
      },
      {
        item: Items.MEAT_ROTTEN,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 0
        }
      }
    ]
  },
  "File Cabinet": {
    spawnChance: 40,
    maxItems: 5,
    items: [
      {
        item: Items.LIGHTER,
        weight: 10,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.SUGAR,
        weight: 25,
        spawnCount: {
          min: 1,
          max: 2
        }
      },
      {
        item: Items.AMMO_380,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 2
        }
      },
      {
        item: Items.AMMO_44,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.LOCKER_KEY_F1,
        weight: 5,
        spawnCount: {
          min: 1,
          max: 1
        }
      }
    ]
  },
  Fridge: {
    spawnChance: 40,
    maxItems: 2,
    items: [
      {
        item: Items.CANNED_FOOD01,
        weight: 30,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.REFRIGERATOR_NOTE,
        weight: 3,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.WATER_STAGNANT,
        weight: 20,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.MEAT_ROTTEN,
        weight: 40,
        spawnCount: {
          min: 1,
          max: 1
        }
      }
    ]
  },
  Cooler: {
    spawnChance: 40,
    maxItems: 2,
    items: [
      {
        item: Items.CANNED_FOOD01,
        weight: 30,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.WATER_STAGNANT,
        weight: 20,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.MEAT_ROTTEN,
        weight: 30,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.WATER_PURE,
        weight: 30,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.WATER_STAGNANT,
        weight: 30,
        spawnCount: {
          min: 1,
          max: 1
        }
      }
    ]
  },
  "Gas Pump": {
    spawnChance: 20,
    maxItems: 2,
    items: [
      {
        item: Items.FUEL_BIOFUEL,
        weight: 30,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.FUEL_ETHANOL,
        weight: 20,
        spawnCount: {
          min: 1,
          max: 1
        }
      }
    ]
  },
  Ottoman: {
    spawnChance: 40,
    maxItems: 3,
    items: [
      {
        item: Items.SHIRT_DEFAULT,
        weight: 50,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.PANTS_DEFAULT,
        weight: 50,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.CLOTH,
        weight: 50,
        spawnCount: {
          min: 1,
          max: 4
        }
      },
      {
        item: Items.HAT_CAP,
        weight: 50,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.WEAPON_FLASHLIGHT,
        weight: 50,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.TWINE,
        weight: 50,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.VEHICLE_KEY,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 1
        }
      }
    ]
  },
  Wood: {
    spawnChance: 40,
    maxItems: 3,
    items: [
      {
        item: Items.WOOD_LOG,
        weight: 50,
        spawnCount: {
          min: 4,
          max: 8
        }
      },
      {
        item: Items.WOOD_PLANK,
        weight: 50,
        spawnCount: {
          min: 4,
          max: 12
        }
      },
      {
        item: Items.WOOD_STICK,
        weight: 50,
        spawnCount: {
          min: 4,
          max: 16
        }
      }
    ]
  },
  "Duffel Bag": {
    spawnChance: 44,
    maxItems: 3,
    items: [
      {
        item: Items.WEAPON_1911,
        weight: 7,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.WEAPON_R380,
        weight: 7,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.WEAPON_COMBATKNIFE,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.AMMO_45,
        weight: 10,
        spawnCount: {
          min: 1,
          max: 3
        }
      },
      {
        item: Items.AMMO_380,
        weight: 10,
        spawnCount: {
          min: 1,
          max: 3
        }
      },
      {
        item: Items.SHIRT_DEFAULT,
        weight: 20,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.PANTS_DEFAULT,
        weight: 20,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.MAP,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 3
        }
      },
      {
        item: Items.COMPASS,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 1
        }
      }
    ]
  },
  Dresser: {
    spawnChance: 40,
    maxItems: 3,
    items: [
      {
        item: Items.MAP,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.COMPASS,
        weight: 10,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.SHIRT_DEFAULT,
        weight: 50,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.PANTS_DEFAULT,
        weight: 50,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.CLOTH,
        weight: 50,
        spawnCount: {
          min: 1,
          max: 4
        }
      },
      {
        item: Items.HAT_CAP,
        weight: 50,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.TWINE,
        weight: 50,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.VEHICLE_KEY,
        weight: 10,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.COMPASS,
        weight: 10,
        spawnCount: {
          min: 1,
          max: 1
        }
      }
    ]
  },
  Armoire: {
    spawnChance: 40,
    maxItems: 3,
    items: [
      {
        item: Items.SHIRT_DEFAULT,
        weight: 50,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.PANTS_DEFAULT,
        weight: 50,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.CLOTH,
        weight: 50,
        spawnCount: {
          min: 1,
          max: 4
        }
      },
      {
        item: Items.HAT_CAP,
        weight: 50,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.TWINE,
        weight: 50,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.WEAPON_308,
        weight: 5,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.WEAPON_SHOTGUN,
        weight: 5,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.AMMO_308,
        weight: 5,
        spawnCount: {
          min: 2,
          max: 3
        }
      },
      {
        item: Items.AMMO_12GA,
        weight: 5,
        spawnCount: {
          min: 2,
          max: 3
        }
      },
      {
        item: Items.WAIST_PACK,
        weight: 30,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.MAP,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.COMPASS,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 1
        }
      }
    ]
  },
  // used for crate props
  Crate_buffed: {
    spawnChance: 60,
    maxItems: 1,
    items: [
      {
        item: Items.FERTILIZER,
        weight: 25,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.WOOD_PLANK,
        weight: 20,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.CLOTH,
        weight: 15,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.CANNED_FOOD01,
        weight: 10,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.WATER_PURE,
        weight: 10,
        spawnCount: {
          min: 1,
          max: 1
        }
      }
    ]
  },
  Crate: {
    spawnChance: 50,
    maxItems: 1,
    items: [
      {
        item: Items.WOOD_PLANK,
        weight: 50,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.CANNED_FOOD01,
        weight: 10,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.WATER_PURE,
        weight: 10,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.CLOTH,
        weight: 10,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.FERTILIZER,
        weight: 5,
        spawnCount: {
          min: 1,
          max: 1
        }
      }
    ]
  },

  // airdrops
  Farmer: {
    spawnChance: 100,
    maxItems: 1,
    items: [
      {
        item: Items.GROUND_TILLER,
        weight: 1,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.GROUND_TILLER,
        weight: 1,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.GROUND_TILLER,
        weight: 1,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.GROUND_TILLER,
        weight: 1,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.GROUND_TAMPER,
        weight: 1,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.SEED_CORN,
        weight: 1,
        spawnCount: {
          min: 10,
          max: 10
        }
      },
      {
        item: Items.SEED_WHEAT,
        weight: 1,
        spawnCount: {
          min: 10,
          max: 10
        }
      },
      {
        item: Items.FERTILIZER,
        weight: 1,
        spawnCount: {
          min: 15,
          max: 15
        }
      },
      {
        item: Items.COMPASS,
        weight: 1,
        spawnCount: {
          min: 1,
          max: 1
        }
      }
    ]
  },
  Demolitioner: {
    spawnChance: 100,
    maxItems: 1,
    items: [
      {
        item: Items.WEAPON_HAMMER_DEMOLITION,
        weight: 1,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.IED,
        weight: 1,
        spawnCount: {
          min: 20,
          max: 20
        }
      },
      {
        item: Items.FUEL_ETHANOL,
        weight: 1,
        spawnCount: {
          min: 20,
          max: 20
        }
      },
      {
        item: Items.LIGHTER,
        weight: 1,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.COMPASS,
        weight: 1,
        spawnCount: {
          min: 1,
          max: 1
        }
      }
    ]
  },
  Medic: {
    spawnChance: 100,
    maxItems: 1,
    items: [
      {
        item: Items.GAUZE,
        weight: 1,
        spawnCount: {
          min: 25,
          max: 25
        }
      },
      {
        item: Items.BANDAGE_DRESSED,
        weight: 1,
        spawnCount: {
          min: 15,
          max: 15
        }
      },
      {
        item: Items.FIRST_AID,
        weight: 1,
        spawnCount: {
          min: 10,
          max: 10
        }
      },
      {
        item: Items.LOCKER_KEY_F1,
        weight: 1,
        spawnCount: {
          min: 5,
          max: 5
        }
      },
      {
        item: Items.LOCKER_KEY_F2,
        weight: 1,
        spawnCount: {
          min: 5,
          max: 5
        }
      },
      {
        item: Items.LOCKER_KEY_F3,
        weight: 1,
        spawnCount: {
          min: 5,
          max: 5
        }
      },
      {
        item: Items.LOCKER_KEY_F4,
        weight: 1,
        spawnCount: {
          min: 5,
          max: 5
        }
      },
      {
        item: Items.COMPASS,
        weight: 1,
        spawnCount: {
          min: 1,
          max: 1
        }
      }
    ]
  },
  Builder: {
    spawnChance: 100,
    maxItems: 1,
    items: [
      {
        item: Items.METAL_SCRAP,
        weight: 1,
        spawnCount: {
          min: 50,
          max: 50
        }
      },
      {
        item: Items.WOOD_LOG,
        weight: 1,
        spawnCount: {
          min: 50,
          max: 50
        }
      },
      {
        item: Items.WEAPON_AXE_WOOD,
        weight: 1,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.WEAPON_CROWBAR,
        weight: 1,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.WEAPON_HAMMER,
        weight: 1,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.SHACK,
        weight: 1,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.WORKBENCH,
        weight: 1,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.COMPASS,
        weight: 1,
        spawnCount: {
          min: 1,
          max: 1
        }
      }
    ]
  },
  Fighter: {
    spawnChance: 100,
    maxItems: 1,
    items: [
      {
        item: Items.WEAPON_SHOTGUN,
        weight: 1,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.WEAPON_AK47,
        weight: 1,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.AMMO_762,
        weight: 1,
        spawnCount: {
          min: 50,
          max: 50
        }
      },
      {
        item: Items.AMMO_12GA,
        weight: 1,
        spawnCount: {
          min: 15,
          max: 15
        }
      },
      {
        item: Items.COMPASS,
        weight: 1,
        spawnCount: {
          min: 1,
          max: 1
        }
      }
    ]
  },
  Supplier: {
    spawnChance: 100,
    maxItems: 1,
    items: [
      {
        item: Items.SANDWICH_DEER,
        weight: 1,
        spawnCount: {
          min: 3,
          max: 3
        }
      },
      {
        item: Items.SANDWICH_BEAR,
        weight: 1,
        spawnCount: {
          min: 3,
          max: 3
        }
      },
      {
        item: Items.SANDWICH_RABBIT,
        weight: 1,
        spawnCount: {
          min: 3,
          max: 3
        }
      },
      {
        item: Items.SANDWICH_WOLF,
        weight: 1,
        spawnCount: {
          min: 3,
          max: 3
        }
      },
      {
        item: Items.WATER_PURE,
        weight: 1,
        spawnCount: {
          min: 15,
          max: 15
        }
      },
      {
        item: Items.MOONSHINE,
        weight: 1,
        spawnCount: {
          min: 10,
          max: 10
        }
      },
      {
        item: Items.SKINNING_KNIFE,
        weight: 1,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.COMPASS,
        weight: 1,
        spawnCount: {
          min: 1,
          max: 1
        }
      }
    ]
  },
  Hospital: {
    spawnChance: 0,
    maxItems: 1,
    items: [
      {
        item: Items.BANDAGE,
        weight: 1,
        spawnCount: {
          min: 1,
          max: 1
        }
      },
      {
        item: Items.AMMO_45,
        weight: 1,
        spawnCount: {
          min: 6,
          max: 12
        }
      },
      {
        item: Items.AMMO_12GA,
        weight: 1,
        spawnCount: {
          min: 4,
          max: 8
        }
      },
      {
        item: Items.PAINKILLERS,
        weight: 1,
        spawnCount: {
          min: 2,
          max: 2
        }
      },
      {
        item: Items.ADRENALINE_SHOT,
        weight: 1,
        spawnCount: {
          min: 2,
          max: 2
        }
      }
    ]
  }
};
