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

import { Items } from "../models/enums";

export type LoadoutKit = Array<LoadoutKitEntry>;

interface LoadoutKitEntry {
  item: Items;
  count?: number;
}

export const characterDefaultLoadout = [
  { item: Items.WEAPON_FISTS },
  { item: Items.WEAPON_FLASHLIGHT },
  { item: Items.SHIRT_DEFAULT },
  { item: Items.BELT_POUCH },
  { item: Items.PANTS_DEFAULT },
  { item: Items.BOOTS_GRAY_BLUE },
  { item: Items.SKINNING_KNIFE },

  { item: Items.MAP },
  { item: Items.COMPASS_IMPROVISED },
  { item: Items.GAUZE, count: 5 }
];

export const characterKitLoadout = [
  { item: Items.BACKPACK_RASTA },
  { item: Items.WEAPON_308 },
  { item: Items.WEAPON_SHOTGUN },
  { item: Items.WEAPON_AR15 },
  { item: Items.FIRST_AID, count: 10 },
  { item: Items.BANDAGE_DRESSED, count: 10 },
  { item: Items.AMMO_12GA, count: 60 },
  { item: Items.AMMO_308, count: 50 },
  { item: Items.AMMO_223, count: 120 },
  { item: Items.KEVLAR_DEFAULT },
  { item: Items.HELMET_MOTORCYCLE },
  { item: Items.KEVLAR_DEFAULT },
  { item: Items.HELMET_MOTORCYCLE },
  { item: Items.CONVEYS_BLUE }
];
export const characterSkinsLoadout = [
  { item: Items.CAMO_TAN_FLANNEL_SHIRT },
  { item: Items.BLUE_FLANNEL_SHIRT },
  { item: Items.BROWN_FLANNEL_SHIRT },
  { item: Items.GREEN_FLANNEL_SHIRT },
  { item: Items.RED_FLANNEL_SHIRT },
  { item: Items.PAISLEY_FLANNEL_SHIRT },
  { item: Items.CAMO_GREEN_FLANNEL_SHIRT },
  { item: Items.POLICE_SHIRT },
  { item: Items.BASIC_HOODIE },
  { item: Items.BLACK_ORANGE_HOODIE },
  { item: Items.TWITCH_HOODIE },
  { item: Items.BLUE_BLACK_HOODIE },
  { item: Items.DOA_HOODIE },
  { item: Items.PRO_GRAMER_HOODIE },
  { item: Items.PARAMEDIC_UNIFORM },
  { item: Items.DRAGON_LODGE_PARKA },
  { item: Items.FLOWER_PRINT_PANTS },
  { item: Items.POLICE_SLACKS },
  { item: Items.LEGGINGS },
  { item: Items.BONE_LEGGINGS },
  { item: Items.MUSCLE_LEGGINGS },
  { item: Items.PARAMEDIC_SLACKS },
  { item: Items.TWIN_GALAXIES_PANTS },
  { item: Items.STARS_STRIPES_SHORTS },
  { item: Items.AVIATOR_CAP },
  { item: Items.BLACK_BEANIE },
  { item: Items.POLICE_HAT },
  { item: Items.TOXIC_BODY_ARMOR },
  { item: Items.DEAD_END_ARMOR },
  { item: Items.EZW_ARMORED_CHAMPIONSHIP_BELT },
  { item: Items.EZW_ARMORED_SHOULDERPADS },
  { item: Items.POLICE_BODY_ARMOR },
  { item: Items.GORILLA_WARFARE },
  { item: Items.ARACHNID },
  { item: Items.DEFAULT },
  { item: Items.INFERNAL_DEMON_MASK },
  { item: Items.HOLIDAY_HAT },
  { item: Items.MASK_OF_JESTER },
  { item: Items.PATCHWORK_RUDOLPH_HELMET },
  { item: Items.WASTELAND_SKULL_HELMET },
  { item: Items.EZW_SPIKED_HELMET },
  { item: Items.DRAGON_MOTORCYCLE_HELMET },
  { item: Items.CIGAR_HOG_MASK },
  { item: Items.WHITE_UNICORN_FULL_HELMET },
  { item: Items.STAR_SPANGLED_HAT },
  { item: Items.PUMPKIN_MASK },
  { item: Items.SCARECROW_MASK },
  { item: Items.EVIL_CLOWN_GLASSES },
  { item: Items.DEFAULT_GOGGLES },
  { item: Items.WHITE_BIKER_GLASSES },
  { item: Items.STEAMPUNK_GOGGLES },
  { item: Items.HAPPY_SKULL_SCRUBS_SHIRT },
  { item: Items.HAPPY_SKULL_SCRUBS_PANTS },
  { item: Items.PINK_GATORS },
  { item: Items.DOOMED_PUFFY_JACKET },
  { item: Items.MILITARY_DEFAULT },
  { item: Items.RASTA_BACKPACK },
  { item: Items.PINK_SKULLS_SURVIVOR_BACKPACK },
  { item: Items.SNIPER_MILITARY_BACKPACK },
  { item: Items.FULLY_GEARED_EXPLORER_BACKPACK }
];

export const characterVehicleKit = [
  { item: Items.SPARKPLUGS },
  { item: Items.VEHICLE_KEY },
  { item: Items.BATTERY },
  { item: Items.TURBO_OFFROADER },
  { item: Items.TURBO_ATV },
  { item: Items.TURBO_PICKUP },
  { item: Items.TURBO_POLICE },
  { item: Items.HEADLIGHTS_ATV },
  { item: Items.HEADLIGHTS_OFFROADER },
  { item: Items.HEADLIGHTS_PICKUP },
  { item: Items.HEADLIGHTS_POLICE }
];
export const characterBuildKitLoadout = [
  { item: Items.FOUNDATION, count: 10 },
  { item: Items.FOUNDATION_EXPANSION, count: 40 },
  { item: Items.SHELTER, count: 40 },
  { item: Items.SHELTER_LARGE, count: 40 },
  { item: Items.SHELTER_UPPER, count: 40 },
  { item: Items.SHELTER_UPPER_LARGE, count: 40 },
  { item: Items.DOOR_METAL, count: 40 },
  { item: Items.DOOR_WOOD, count: 40 },
  { item: Items.DOOR_BASIC, count: 10 },
  { item: Items.SHACK, count: 10 },
  { item: Items.SHACK_SMALL, count: 10 },
  { item: Items.SHACK_BASIC, count: 10 },
  { item: Items.STRUCTURE_STAIRS, count: 40 },
  { item: Items.STRUCTURE_STAIRS_UPPER, count: 40 },
  { item: Items.FOUNDATION_RAMP, count: 40 },
  { item: Items.FOUNDATION_STAIRS, count: 40 },
  { item: Items.FURNACE, count: 40 },
  { item: Items.STORAGE_BOX, count: 40 },
  { item: Items.LOOKOUT_TOWER, count: 40 },
  { item: Items.METAL_GATE, count: 40 },
  { item: Items.METAL_WALL, count: 40 },
  { item: Items.METAL_WALL_UPPER, count: 40 },
  { item: Items.METAL_DOORWAY, count: 40 },
  { item: Items.GROUND_TAMPER, count: 10 },
  { item: Items.WEAPON_HAMMER_DEMOLITION }
];

export const characterTestKitLoadout = [
  { item: Items.FOUNDATION, count: 10 },
  { item: Items.FOUNDATION_EXPANSION, count: 20 },
  { item: Items.SHELTER, count: 20 },
  { item: Items.SHELTER_LARGE, count: 20 },
  { item: Items.SHELTER_UPPER, count: 20 },
  { item: Items.SHELTER_UPPER_LARGE, count: 20 },
  { item: Items.DOOR_METAL, count: 20 },
  { item: Items.DOOR_WOOD, count: 20 },
  { item: Items.DOOR_BASIC, count: 10 },
  { item: Items.SHACK, count: 10 },
  { item: Items.SHACK_SMALL, count: 10 },
  { item: Items.SHACK_BASIC, count: 10 },
  { item: Items.STRUCTURE_STAIRS, count: 20 },
  { item: Items.STRUCTURE_STAIRS_UPPER, count: 20 },
  { item: Items.FOUNDATION_RAMP, count: 20 },
  { item: Items.FOUNDATION_STAIRS, count: 20 },
  { item: Items.FURNACE, count: 20 },
  { item: Items.STORAGE_BOX, count: 20 },
  { item: Items.LOOKOUT_TOWER, count: 20 },
  { item: Items.METAL_GATE, count: 20 },
  { item: Items.METAL_WALL, count: 20 },
  { item: Items.METAL_WALL_UPPER, count: 20 },
  { item: Items.METAL_DOORWAY, count: 20 },
  { item: Items.GROUND_TAMPER, count: 10 },
  { item: Items.WEAPON_HAMMER_DEMOLITION },
  { item: Items.LIGHTER },
  { item: Items.IED, count: 200 },
  { item: Items.FUEL_ETHANOL, count: 400 }
];

export const vehicleDefaultLoadouts = {
  offroader: [
    { item: Items.CONTAINER_VEHICLE_OFFROADER },
    { item: Items.VEHICLE_MOTOR_OFFROADER },
    { item: Items.VEHICLE_HOTWIRE },
    { item: Items.VEHICLE_HORN }
  ],
  policecar: [
    { item: Items.CONTAINER_VEHICLE_POLICECAR },
    { item: Items.VEHICLE_MOTOR_POLICECAR },
    { item: Items.VEHICLE_HOTWIRE },
    { item: Items.VEHICLE_HORN_POLICECAR },
    { item: Items.VEHICLE_SIREN_POLICECAR }
  ],
  atv: [
    { item: Items.CONTAINER_VEHICLE_ATV },
    { item: Items.VEHICLE_MOTOR_ATV },
    { item: Items.VEHICLE_HOTWIRE },
    { item: Items.VEHICLE_HORN }
  ],
  pickup: [
    { item: Items.CONTAINER_VEHICLE_PICKUP },
    { item: Items.VEHICLE_MOTOR_PICKUP },
    { item: Items.VEHICLE_HOTWIRE },
    { item: Items.VEHICLE_HORN }
  ]
};

export const lootableContainerDefaultLoadouts = {
  storage: [{ item: Items.CONTAINER_STORAGE }],
  furnace: [{ item: Items.CONTAINER_FURNACE }],
  barbeque: [{ item: Items.CONTAINER_BARBEQUE }],
  campfire: [{ item: Items.CONTAINER_CAMPFIRE }],
  lootbag: [{ item: Items.CONTAINER_DROPPED_ITEMS }],
  military_crate: [{ item: Items.CONTAINER_MILITARY_CRATE }],
  bee_box: [{ item: Items.CONTAINER_BEE_BOX }],
  dew_collector: [{ item: Items.CONTAINER_DEW_COLLECTOR }],
  animal_trap: [{ item: Items.CONTAINER_ANIMAL_TRAP }],
  repair_box: [{ item: Items.CONTAINER_REPAIR_BOX }],
  stash: [{ item: Items.CONTAINER_STASH }]
};
