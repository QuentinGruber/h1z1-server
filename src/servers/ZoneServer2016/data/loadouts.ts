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

import { Items } from "../models/enums";

export type LoadoutKit = Array<LoadoutKitEntry>;

interface LoadoutKitEntry {
  item: Items;
  count?: number;
}

export const characterDefaultLoadout = [
  { item: Items.WEAPON_FISTS },
  { item: Items.SHIRT_DEFAULT },
  { item: Items.WAIST_PACK },
  { item: Items.PANTS_DEFAULT },

  { item: Items.MAP },
  { item: Items.COMPASS },
  { item: Items.GAUZE, count: 5 },
  { item: Items.FLARE },
  { item: Items.LIGHTER },
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
  { item: Items.CONVEYS_BLUE },
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
  { item: Items.WEAPON_HAMMER_DEMOLITION },
];

export const vehicleDefaultLoadouts = {
  offroader: [
    { item: Items.CONTAINER_VEHICLE_OFFROADER },
    { item: Items.VEHICLE_MOTOR_OFFROADER },
    { item: Items.VEHICLE_HOTWIRE },
    { item: Items.VEHICLE_HORN },
  ],
  policecar: [
    { item: Items.CONTAINER_VEHICLE_POLICECAR },
    { item: Items.VEHICLE_MOTOR_POLICECAR },
    { item: Items.VEHICLE_HOTWIRE },
    { item: Items.VEHICLE_HORN_POLICECAR },
    { item: Items.VEHICLE_SIREN_POLICECAR },
  ],
  atv: [
    { item: Items.CONTAINER_VEHICLE_ATV },
    { item: Items.VEHICLE_MOTOR_ATV },
    { item: Items.VEHICLE_HOTWIRE },
    { item: Items.VEHICLE_HORN },
  ],
  pickup: [
    { item: Items.CONTAINER_VEHICLE_PICKUP },
    { item: Items.VEHICLE_MOTOR_PICKUP },
    { item: Items.VEHICLE_HOTWIRE },
    { item: Items.VEHICLE_HORN },
  ],
};
