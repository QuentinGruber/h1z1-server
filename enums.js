"use strict";
// ======================================================================
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Skins_Glasses = exports.Skins_Military = exports.Skins_Kevlar = exports.Skins_MotorHelmet = exports.Skins_Cap = exports.Skins_Beanie = exports.Skins_Pants = exports.Skins_Shirt = exports.Items = exports.ResourceTypes = exports.ResourceIds = exports.EntityTypes = exports.EquipSlots = exports.LoadoutSlots = exports.LoadoutIds = exports.Characters = exports.VehicleIds = exports.ItemClasses = exports.FilterIds = exports.ContainerErrors = exports.MovementModifiers = exports.StringIds = exports.ConstructionPermissionIds = exports.ConstructionErrors = exports.ItemUseOptions = exports.Stances = void 0;
var Stances;
(function (Stances) {
    Stances[Stances["STANDING"] = 1089] = "STANDING";
    Stances[Stances["MOVE_STANDING_SPRINTING"] = 66565] = "MOVE_STANDING_SPRINTING";
    Stances[Stances["MOVE_STANDING_FORWARD"] = 66561] = "MOVE_STANDING_FORWARD";
    Stances[Stances["MOVE_STANDING_BACKWARDS"] = 33793] = "MOVE_STANDING_BACKWARDS";
    Stances[Stances["MOVE_STANDING_LEFT"] = 132097] = "MOVE_STANDING_LEFT";
    Stances[Stances["MOVE_STANDING_RIGHT"] = 263169] = "MOVE_STANDING_RIGHT";
    Stances[Stances["CROUCHING"] = 1091] = "CROUCHING";
    Stances[Stances["MOVE_CROUCHING_FORWARD"] = 66563] = "MOVE_CROUCHING_FORWARD";
    Stances[Stances["MOVE_CROUCHING_BACKWARDS"] = 33795] = "MOVE_CROUCHING_BACKWARDS";
    Stances[Stances["MOVE_CROUCHING_LEFT"] = 132099] = "MOVE_CROUCHING_LEFT";
    Stances[Stances["MOVE_CROUCHING_RIGHT"] = 263171] = "MOVE_CROUCHING_RIGHT";
    Stances[Stances["PRONING"] = 5185] = "PRONING";
    Stances[Stances["MOVE_PRONING_FORWARD"] = 70657] = "MOVE_PRONING_FORWARD";
    Stances[Stances["MOVE_PRONING_BACKWARDS"] = 37889] = "MOVE_PRONING_BACKWARDS";
    Stances[Stances["MOVE_PRONING_LEFT"] = 136193] = "MOVE_PRONING_LEFT";
    Stances[Stances["MOVE_PRONING_RIGHT"] = 267265] = "MOVE_PRONING_RIGHT";
    Stances[Stances["JUMPING_STANDING"] = 1105] = "JUMPING_STANDING";
    Stances[Stances["JUMPING_FORWARD_SPRINTING"] = 66581] = "JUMPING_FORWARD_SPRINTING";
    Stances[Stances["JUMPING_WORWARD"] = 66577] = "JUMPING_WORWARD";
    Stances[Stances["JUMPING_BACKWARDS"] = 33809] = "JUMPING_BACKWARDS";
    Stances[Stances["JUMPING_LEFT"] = 132113] = "JUMPING_LEFT";
    Stances[Stances["JUMPING_RIGHT"] = 263185] = "JUMPING_RIGHT";
    Stances[Stances["JUMPING_FORWARD_LEFT"] = 197649] = "JUMPING_FORWARD_LEFT";
    Stances[Stances["JUMPING_FORWARD_LEFT_SPRINTING"] = 197653] = "JUMPING_FORWARD_LEFT_SPRINTING";
    Stances[Stances["JUMPING_FORWARD_RIGHT"] = 328721] = "JUMPING_FORWARD_RIGHT";
    Stances[Stances["JUMPING_FORWARD_RIGHT_SPRINTING"] = 328725] = "JUMPING_FORWARD_RIGHT_SPRINTING";
    Stances[Stances["JUMPING_BACKWARDS_LEFT"] = 164881] = "JUMPING_BACKWARDS_LEFT";
    Stances[Stances["JUMPING_BACKWARDS_RIGHT"] = 295953] = "JUMPING_BACKWARDS_RIGHT";
    Stances[Stances["SITTING"] = 525377] = "SITTING";
    Stances[Stances["STANCE_XS"] = 525393] = "STANCE_XS";
    Stances[Stances["STANCE_XS_FP"] = 2622545] = "STANCE_XS_FP";
    // havent seen this stance anywhere else than during XS glitching
})(Stances = exports.Stances || (exports.Stances = {}));
var ItemUseOptions;
(function (ItemUseOptions) {
    ItemUseOptions[ItemUseOptions["EAT"] = 1] = "EAT";
    ItemUseOptions[ItemUseOptions["DRINK"] = 2] = "DRINK";
    ItemUseOptions[ItemUseOptions["USE"] = 3] = "USE";
    ItemUseOptions[ItemUseOptions["DROP"] = 4] = "DROP";
    ItemUseOptions[ItemUseOptions["SHRED"] = 6] = "SHRED";
    ItemUseOptions[ItemUseOptions["UNLOAD"] = 7] = "UNLOAD";
    ItemUseOptions[ItemUseOptions["IGNITE"] = 11] = "IGNITE";
    ItemUseOptions[ItemUseOptions["REFUEL"] = 17] = "REFUEL";
    ItemUseOptions[ItemUseOptions["SLICE"] = 18] = "SLICE";
    ItemUseOptions[ItemUseOptions["USE_MEDICAL"] = 52] = "USE_MEDICAL";
    ItemUseOptions[ItemUseOptions["EQUIP"] = 60] = "EQUIP";
    ItemUseOptions[ItemUseOptions["DROP_BATTERY"] = 73] = "DROP_BATTERY";
    ItemUseOptions[ItemUseOptions["DROP_SPARKS"] = 79] = "DROP_SPARKS";
    ItemUseOptions[ItemUseOptions["SALVAGE"] = 87] = "SALVAGE";
})(ItemUseOptions = exports.ItemUseOptions || (exports.ItemUseOptions = {}));
var ConstructionErrors;
(function (ConstructionErrors) {
    ConstructionErrors["UNKNOWN"] = "Unknown";
    ConstructionErrors["OVERLAP"] = "Construction overlap";
    ConstructionErrors["BUILD_PERMISSION"] = "No build permission";
    ConstructionErrors["DEMOLISH_PERMISSION"] = "No demolish permission";
    ConstructionErrors["UNKNOWN_PARENT"] = "Unknown parent";
    ConstructionErrors["UNKNOWN_SLOT"] = "Unknown slot";
    ConstructionErrors["UNKNOWN_CONSTRUCTION"] = "Unknown construction item";
    ConstructionErrors["OUT_OF_RANGE"] = "Out of range";
    ConstructionErrors["STACKED"] = "Construction stacked";
})(ConstructionErrors = exports.ConstructionErrors || (exports.ConstructionErrors = {}));
var ConstructionPermissionIds;
(function (ConstructionPermissionIds) {
    ConstructionPermissionIds[ConstructionPermissionIds["BUILD"] = 1] = "BUILD";
    ConstructionPermissionIds[ConstructionPermissionIds["DEMOLISH"] = 2] = "DEMOLISH";
    ConstructionPermissionIds[ConstructionPermissionIds["CONTAINERS"] = 3] = "CONTAINERS";
    ConstructionPermissionIds[ConstructionPermissionIds["VISIT"] = 4] = "VISIT";
})(ConstructionPermissionIds = exports.ConstructionPermissionIds || (exports.ConstructionPermissionIds = {}));
var StringIds;
(function (StringIds) {
    StringIds[StringIds["TAKE_ITEM"] = 29] = "TAKE_ITEM";
    StringIds[StringIds["OPEN"] = 31] = "OPEN";
    StringIds[StringIds["SEARCH"] = 1191] = "SEARCH";
    StringIds[StringIds["OPEN_AND_LOCK"] = 8944] = "OPEN_AND_LOCK";
    StringIds[StringIds["UNDO_PLACEMENT"] = 12001] = "UNDO_PLACEMENT";
    StringIds[StringIds["OPEN_TARGET"] = 12156] = "OPEN_TARGET";
    StringIds[StringIds["PERMISSIONS_TARGET"] = 12982] = "PERMISSIONS_TARGET";
    StringIds[StringIds["OFFROADER"] = 16] = "OFFROADER";
    StringIds[StringIds["PICKUP_TRUCK"] = 12537] = "PICKUP_TRUCK";
    StringIds[StringIds["ATV"] = 12552] = "ATV";
    StringIds[StringIds["POLICE_CAR"] = 12538] = "POLICE_CAR";
    StringIds[StringIds["CORN"] = 628] = "CORN";
    StringIds[StringIds["WHEAT"] = 1184] = "WHEAT";
    StringIds[StringIds["USE_IGNITABLE"] = 9224] = "USE_IGNITABLE";
})(StringIds = exports.StringIds || (exports.StringIds = {}));
var MovementModifiers;
(function (MovementModifiers) {
    MovementModifiers[MovementModifiers["RESTED"] = 1.1] = "RESTED";
    MovementModifiers[MovementModifiers["SWIZZLE"] = 1.1] = "SWIZZLE";
    MovementModifiers[MovementModifiers["SNARED"] = 0.5] = "SNARED";
    MovementModifiers[MovementModifiers["BOOTS"] = 1.15] = "BOOTS";
})(MovementModifiers = exports.MovementModifiers || (exports.MovementModifiers = {}));
var ContainerErrors;
(function (ContainerErrors) {
    ContainerErrors[ContainerErrors["NONE"] = 0] = "NONE";
    ContainerErrors[ContainerErrors["IN_USE"] = 1] = "IN_USE";
    ContainerErrors[ContainerErrors["WRONG_ITEM_TYPE"] = 2] = "WRONG_ITEM_TYPE";
    ContainerErrors[ContainerErrors["UNKNOWN_CONTAINER"] = 3] = "UNKNOWN_CONTAINER";
    ContainerErrors[ContainerErrors["UNKNOWN_SLOT"] = 4] = "UNKNOWN_SLOT";
    ContainerErrors[ContainerErrors["NO_ITEM_IN_SLOT"] = 5] = "NO_ITEM_IN_SLOT";
    ContainerErrors[ContainerErrors["INTERACTION_VALIDATION"] = 6] = "INTERACTION_VALIDATION";
    ContainerErrors[ContainerErrors["UNKNOWN"] = 99] = "UNKNOWN";
    // custom errors
    ContainerErrors[ContainerErrors["DOES_NOT_ACCEPT_ITEMS"] = 7] = "DOES_NOT_ACCEPT_ITEMS";
    ContainerErrors[ContainerErrors["NOT_MUTABLE"] = 8] = "NOT_MUTABLE";
    ContainerErrors[ContainerErrors["NOT_CONSTRUCTED"] = 9] = "NOT_CONSTRUCTED";
    ContainerErrors[ContainerErrors["NO_SPACE"] = 10] = "NO_SPACE";
    ContainerErrors[ContainerErrors["INVALID_LOADOUT_SLOT"] = 11] = "INVALID_LOADOUT_SLOT";
    ContainerErrors[ContainerErrors["NO_PERMISSION"] = 12] = "NO_PERMISSION";
    ContainerErrors[ContainerErrors["UNACCEPTED_ITEM"] = 13] = "UNACCEPTED_ITEM";
})(ContainerErrors = exports.ContainerErrors || (exports.ContainerErrors = {}));
var FilterIds;
(function (FilterIds) {
    FilterIds[FilterIds["COOKING"] = 2] = "COOKING";
    FilterIds[FilterIds["FURNACE"] = 4] = "FURNACE";
    FilterIds[FilterIds["WEAPONS"] = 5] = "WEAPONS";
    FilterIds[FilterIds["HOUSING"] = 6] = "HOUSING";
    FilterIds[FilterIds["SURVIVAL"] = 7] = "SURVIVAL";
    FilterIds[FilterIds["COMPONENT"] = 8] = "COMPONENT";
    FilterIds[FilterIds["DEW_COLLECTOR"] = 9] = "DEW_COLLECTOR";
    FilterIds[FilterIds["ANIMAL_TRAP"] = 10] = "ANIMAL_TRAP";
})(FilterIds = exports.FilterIds || (exports.FilterIds = {}));
var ItemClasses;
(function (ItemClasses) {
    ItemClasses[ItemClasses["WEAPONS_LONG"] = 25036] = "WEAPONS_LONG";
    ItemClasses[ItemClasses["WEAPONS_PISTOL"] = 4096] = "WEAPONS_PISTOL";
    ItemClasses[ItemClasses["WEAPONS_MELEES"] = 4098] = "WEAPONS_MELEES";
    ItemClasses[ItemClasses["WEAPONS_MELEES0"] = 25037] = "WEAPONS_MELEES0";
    ItemClasses[ItemClasses["WEAPONS_GENERIC"] = 25054] = "WEAPONS_GENERIC";
    ItemClasses[ItemClasses["WEAPONS_CROSSBOW"] = 25047] = "WEAPONS_CROSSBOW";
    ItemClasses[ItemClasses["WEAPONS_BOW"] = 25038] = "WEAPONS_BOW";
})(ItemClasses = exports.ItemClasses || (exports.ItemClasses = {}));
var VehicleIds;
(function (VehicleIds) {
    VehicleIds[VehicleIds["OFFROADER"] = 1] = "OFFROADER";
    VehicleIds[VehicleIds["PICKUP"] = 2] = "PICKUP";
    VehicleIds[VehicleIds["POLICECAR"] = 3] = "POLICECAR";
    VehicleIds[VehicleIds["ATV"] = 5] = "ATV";
    VehicleIds[VehicleIds["PARACHUTE"] = 13] = "PARACHUTE";
    VehicleIds[VehicleIds["SPECTATE"] = 1337] = "SPECTATE";
})(VehicleIds = exports.VehicleIds || (exports.VehicleIds = {}));
var Characters;
(function (Characters) {
    Characters[Characters["MALE_WHITE"] = 1] = "MALE_WHITE";
    Characters[Characters["MALE_WHITE_BALD"] = 2] = "MALE_WHITE_BALD";
    Characters[Characters["FEMALE_WHITE_YOUNG"] = 3] = "FEMALE_WHITE_YOUNG";
    Characters[Characters["FEMALE_WHITE"] = 4] = "FEMALE_WHITE";
    Characters[Characters["MALE_BLACK"] = 5] = "MALE_BLACK";
    Characters[Characters["FEMALE_BLACK"] = 6] = "FEMALE_BLACK";
})(Characters = exports.Characters || (exports.Characters = {}));
var LoadoutIds;
(function (LoadoutIds) {
    LoadoutIds[LoadoutIds["CHARACTER"] = 3] = "CHARACTER";
    LoadoutIds[LoadoutIds["VEHICLE_OFFROADER"] = 4] = "VEHICLE_OFFROADER";
    LoadoutIds[LoadoutIds["VEHICLE_PICKUP"] = 6] = "VEHICLE_PICKUP";
    LoadoutIds[LoadoutIds["VEHICLE_POLICECAR"] = 8] = "VEHICLE_POLICECAR";
    LoadoutIds[LoadoutIds["VEHICLE_ATV"] = 14] = "VEHICLE_ATV";
})(LoadoutIds = exports.LoadoutIds || (exports.LoadoutIds = {}));
var LoadoutSlots;
(function (LoadoutSlots) {
    LoadoutSlots[LoadoutSlots["PRIMARY"] = 1] = "PRIMARY";
    LoadoutSlots[LoadoutSlots["SECONDARY"] = 3] = "SECONDARY";
    LoadoutSlots[LoadoutSlots["TERTIARY"] = 4] = "TERTIARY";
    LoadoutSlots[LoadoutSlots["FISTS"] = 7] = "FISTS";
    LoadoutSlots[LoadoutSlots["HEAD"] = 11] = "HEAD";
    LoadoutSlots[LoadoutSlots["ARMOR"] = 38] = "ARMOR";
    LoadoutSlots[LoadoutSlots["RADIO"] = 39] = "RADIO";
    LoadoutSlots[LoadoutSlots["ITEM2"] = 41] = "ITEM2";
})(LoadoutSlots = exports.LoadoutSlots || (exports.LoadoutSlots = {}));
var EquipSlots;
(function (EquipSlots) {
    EquipSlots[EquipSlots["HEAD"] = 1] = "HEAD";
    EquipSlots[EquipSlots["HANDS"] = 2] = "HANDS";
    EquipSlots[EquipSlots["CHEST"] = 3] = "CHEST";
    EquipSlots[EquipSlots["LEGS"] = 4] = "LEGS";
    EquipSlots[EquipSlots["FEET"] = 5] = "FEET";
    EquipSlots[EquipSlots["RHAND"] = 7] = "RHAND";
    EquipSlots[EquipSlots["BACKPACK"] = 10] = "BACKPACK";
    EquipSlots[EquipSlots["HAIR"] = 27] = "HAIR";
    EquipSlots[EquipSlots["FACE"] = 28] = "FACE";
    EquipSlots[EquipSlots["EYES"] = 29] = "EYES";
    EquipSlots[EquipSlots["ARMOR"] = 100] = "ARMOR";
})(EquipSlots = exports.EquipSlots || (exports.EquipSlots = {}));
var EntityTypes;
(function (EntityTypes) {
    EntityTypes[EntityTypes["INVALID"] = 0] = "INVALID";
    EntityTypes[EntityTypes["NPC"] = 1] = "NPC";
    EntityTypes[EntityTypes["VEHICLE"] = 2] = "VEHICLE";
    EntityTypes[EntityTypes["PLAYER"] = 3] = "PLAYER";
    EntityTypes[EntityTypes["OBJECT"] = 4] = "OBJECT";
    EntityTypes[EntityTypes["DOOR"] = 5] = "DOOR";
    EntityTypes[EntityTypes["EXPLOSIVE"] = 6] = "EXPLOSIVE";
    EntityTypes[EntityTypes["CONSTRUCTION_FOUNDATION"] = 7] = "CONSTRUCTION_FOUNDATION";
    EntityTypes[EntityTypes["CONSTRUCTION_DOOR"] = 8] = "CONSTRUCTION_DOOR";
    EntityTypes[EntityTypes["CONSTRUCTION_SIMPLE"] = 9] = "CONSTRUCTION_SIMPLE";
    EntityTypes[EntityTypes["LOOTABLE_CONSTRUCTION"] = 10] = "LOOTABLE_CONSTRUCTION";
    EntityTypes[EntityTypes["LOOTABLE_PROP"] = 11] = "LOOTABLE_PROP";
    EntityTypes[EntityTypes["WORLD_LOOTABLE_CONSTRUCTION"] = 12] = "WORLD_LOOTABLE_CONSTRUCTION";
    EntityTypes[EntityTypes["WORLD_CONSTRUCTION_SIMPLE"] = 13] = "WORLD_CONSTRUCTION_SIMPLE";
    EntityTypes[EntityTypes["PLANT"] = 14] = "PLANT";
    EntityTypes[EntityTypes["TRAP"] = 15] = "TRAP";
    EntityTypes[EntityTypes["TASK_PROP"] = 16] = "TASK_PROP";
    EntityTypes[EntityTypes["CRATE"] = 17] = "CRATE";
    EntityTypes[EntityTypes["DESTROYABLE"] = 18] = "DESTROYABLE";
})(EntityTypes = exports.EntityTypes || (exports.EntityTypes = {}));
var ResourceIds;
(function (ResourceIds) {
    ResourceIds[ResourceIds["HEALTH"] = 1] = "HEALTH";
    ResourceIds[ResourceIds["HUNGER"] = 4] = "HUNGER";
    ResourceIds[ResourceIds["HYDRATION"] = 5] = "HYDRATION";
    ResourceIds[ResourceIds["STAMINA"] = 6] = "STAMINA";
    ResourceIds[ResourceIds["VIRUS"] = 12] = "VIRUS";
    ResourceIds[ResourceIds["BLEEDING"] = 21] = "BLEEDING";
    ResourceIds[ResourceIds["COMFORT"] = 68] = "COMFORT";
    ResourceIds[ResourceIds["FUEL"] = 396] = "FUEL";
    ResourceIds[ResourceIds["CONDITION"] = 561] = "CONDITION";
    ResourceIds[ResourceIds["CONSTRUCTION_CONDITION"] = 567] = "CONSTRUCTION_CONDITION";
})(ResourceIds = exports.ResourceIds || (exports.ResourceIds = {}));
var ResourceTypes;
(function (ResourceTypes) {
    ResourceTypes[ResourceTypes["HEALTH"] = 1] = "HEALTH";
    ResourceTypes[ResourceTypes["HUNGER"] = 4] = "HUNGER";
    ResourceTypes[ResourceTypes["HYDRATION"] = 5] = "HYDRATION";
    ResourceTypes[ResourceTypes["STAMINA"] = 6] = "STAMINA";
    ResourceTypes[ResourceTypes["VIRUS"] = 12] = "VIRUS";
    ResourceTypes[ResourceTypes["BLEEDING"] = 21] = "BLEEDING";
    ResourceTypes[ResourceTypes["COMFORT"] = 68] = "COMFORT";
    ResourceTypes[ResourceTypes["FUEL"] = 50] = "FUEL";
    ResourceTypes[ResourceTypes["CONDITION"] = 1] = "CONDITION";
})(ResourceTypes = exports.ResourceTypes || (exports.ResourceTypes = {}));
var Items;
(function (Items) {
    //#region WEAPONS
    Items[Items["WEAPON_AR15"] = 10] = "WEAPON_AR15";
    Items[Items["WEAPON_AK47"] = 2229] = "WEAPON_AK47";
    Items[Items["WEAPON_SHOTGUN"] = 2663] = "WEAPON_SHOTGUN";
    Items[Items["WEAPON_CROWBAR"] = 82] = "WEAPON_CROWBAR";
    Items[Items["WEAPON_COMBATKNIFE"] = 84] = "WEAPON_COMBATKNIFE";
    Items[Items["WEAPON_MACHETE01"] = 83] = "WEAPON_MACHETE01";
    Items[Items["WEAPON_KATANA"] = 2961] = "WEAPON_KATANA";
    Items[Items["WEAPON_BAT_WOOD"] = 1724] = "WEAPON_BAT_WOOD";
    Items[Items["WEAPON_GUITAR"] = 1733] = "WEAPON_GUITAR";
    Items[Items["WEAPON_AXE_WOOD"] = 58] = "WEAPON_AXE_WOOD";
    Items[Items["WEAPON_AXE_FIRE"] = 1745] = "WEAPON_AXE_FIRE";
    Items[Items["WEAPON_HAMMER"] = 1536] = "WEAPON_HAMMER";
    Items[Items["WEAPON_HATCHET"] = 3] = "WEAPON_HATCHET";
    Items[Items["WEAPON_PIPE"] = 1448] = "WEAPON_PIPE";
    Items[Items["WEAPON_BAT_ALUM"] = 1721] = "WEAPON_BAT_ALUM";
    Items[Items["WEAPON_BOW_MAKESHIFT"] = 113] = "WEAPON_BOW_MAKESHIFT";
    Items[Items["WEAPON_BOW_WOOD"] = 1720] = "WEAPON_BOW_WOOD";
    Items[Items["WEAPON_BOW_RECURVE"] = 1986] = "WEAPON_BOW_RECURVE";
    Items[Items["WEAPON_1911"] = 2] = "WEAPON_1911";
    Items[Items["WEAPON_M9"] = 1997] = "WEAPON_M9";
    Items[Items["WEAPON_308"] = 1373] = "WEAPON_308";
    Items[Items["WEAPON_BINOCULARS"] = 1542] = "WEAPON_BINOCULARS";
    Items[Items["WEAPON_CROSSBOW"] = 2246] = "WEAPON_CROSSBOW";
    Items[Items["WEAPON_R380"] = 1991] = "WEAPON_R380";
    Items[Items["WEAPON_MOLOTOV"] = 14] = "WEAPON_MOLOTOV";
    Items[Items["WEAPON_MAGNUM"] = 1718] = "WEAPON_MAGNUM";
    Items[Items["WEAPON_FLASHLIGHT"] = 1380] = "WEAPON_FLASHLIGHT";
    Items[Items["WEAPON_WRENCH"] = 1538] = "WEAPON_WRENCH";
    Items[Items["WEAPON_BRANCH"] = 1725] = "WEAPON_BRANCH";
    Items[Items["WEAPON_FISTS"] = 85] = "WEAPON_FISTS";
    Items[Items["WEAPON_FROSTBITE"] = 3445] = "WEAPON_FROSTBITE";
    Items[Items["WEAPON_BLAZE"] = 3446] = "WEAPON_BLAZE";
    Items[Items["WEAPON_NAGAFENS_RAGE"] = 3448] = "WEAPON_NAGAFENS_RAGE";
    Items[Items["WEAPON_PURGE"] = 3449] = "WEAPON_PURGE";
    Items[Items["WEAPON_REAPER"] = 3450] = "WEAPON_REAPER";
    Items[Items["WEAPON_HAMMER_DEMOLITION"] = 1903] = "WEAPON_HAMMER_DEMOLITION";
    Items[Items["WEAPON_TORCH"] = 5] = "WEAPON_TORCH";
    Items[Items["WEAPON_TORCH_ETHANOL"] = 1389] = "WEAPON_TORCH_ETHANOL";
    Items[Items["WEAPON_HATCHET_MAKESHIFT"] = 1708] = "WEAPON_HATCHET_MAKESHIFT";
    Items[Items["WEAPON_AK47_MODIFIED"] = 2399] = "WEAPON_AK47_MODIFIED";
    Items[Items["WEAPON_SPEAR"] = 1382] = "WEAPON_SPEAR";
    Items[Items["WEAPON_REMOVER"] = 1776] = "WEAPON_REMOVER";
    //#endregion
    //#region AMMO
    Items[Items["AMMO_223"] = 1429] = "AMMO_223";
    Items[Items["AMMO_12GA"] = 1511] = "AMMO_12GA";
    Items[Items["AMMO_45"] = 1428] = "AMMO_45";
    Items[Items["AMMO_9MM"] = 1998] = "AMMO_9MM";
    Items[Items["AMMO_308"] = 1469] = "AMMO_308";
    Items[Items["AMMO_380"] = 1992] = "AMMO_380";
    Items[Items["AMMO_762"] = 2325] = "AMMO_762";
    Items[Items["AMMO_44"] = 1719] = "AMMO_44";
    Items[Items["AMMO_ARROW"] = 112] = "AMMO_ARROW";
    Items[Items["AMMO_ARROW_EXPLOSIVE"] = 138] = "AMMO_ARROW_EXPLOSIVE";
    Items[Items["AMMO_ARROW_FLAMING"] = 1434] = "AMMO_ARROW_FLAMING";
    //#endregion
    //#region PERISHABLE
    Items[Items["ANTIBIOTICS"] = 1388] = "ANTIBIOTICS";
    Items[Items["VITAMINS"] = 1512] = "VITAMINS";
    Items[Items["IMMUNITY_BOOSTERS"] = 1471] = "IMMUNITY_BOOSTERS";
    Items[Items["FIRST_AID"] = 78] = "FIRST_AID";
    Items[Items["BANDAGE"] = 24] = "BANDAGE";
    Items[Items["BANDAGE_DRESSED"] = 2214] = "BANDAGE_DRESSED";
    Items[Items["GAUZE"] = 1751] = "GAUZE";
    Items[Items["SWIZZLE"] = 1709] = "SWIZZLE";
    Items[Items["GROUND_COFFEE"] = 56] = "GROUND_COFFEE";
    Items[Items["CANNED_FOOD01"] = 7] = "CANNED_FOOD01";
    Items[Items["BLACKBERRY"] = 105] = "BLACKBERRY";
    Items[Items["BLACKBERRY_JUICE"] = 1361] = "BLACKBERRY_JUICE";
    Items[Items["BLACKBERRY_PIE"] = 1706] = "BLACKBERRY_PIE";
    Items[Items["BLACKBERRY_PIE_SLICE"] = 1726] = "BLACKBERRY_PIE_SLICE";
    Items[Items["BLACKBERRY_HANDFUL"] = 3214] = "BLACKBERRY_HANDFUL";
    Items[Items["WATER_PURE"] = 1371] = "WATER_PURE";
    Items[Items["WATER_STAGNANT"] = 1535] = "WATER_STAGNANT";
    Items[Items["WATER_DIRTY"] = 1368] = "WATER_DIRTY";
    Items[Items["MRE_APPLE"] = 1402] = "MRE_APPLE";
    Items[Items["SANDWICH_BEAR"] = 1459] = "SANDWICH_BEAR";
    Items[Items["STEAK_BEAR"] = 1451] = "STEAK_BEAR";
    Items[Items["SURVIVAL_BREAD"] = 1456] = "SURVIVAL_BREAD";
    Items[Items["MEAT_BEAR"] = 1450] = "MEAT_BEAR";
    Items[Items["COFFEE"] = 55] = "COFFEE";
    Items[Items["COFFEE_SUGAR"] = 71] = "COFFEE_SUGAR";
    Items[Items["STEAK_RABBIT"] = 117] = "STEAK_RABBIT";
    Items[Items["MEAT_RABBIT"] = 116] = "MEAT_RABBIT";
    Items[Items["SANDWICH_RABBIT"] = 1457] = "SANDWICH_RABBIT";
    Items[Items["STEW_RABBIT"] = 118] = "STEW_RABBIT";
    Items[Items["CORN"] = 107] = "CORN";
    Items[Items["CORN_ROASTED"] = 1387] = "CORN_ROASTED";
    Items[Items["JERKY_DEER"] = 21] = "JERKY_DEER";
    Items[Items["MEAT_VENISON"] = 20] = "MEAT_VENISON";
    Items[Items["SANDWICH_DEER"] = 1460] = "SANDWICH_DEER";
    Items[Items["STEAK_DEER"] = 61] = "STEAK_DEER";
    Items[Items["HONEY"] = 2192] = "HONEY";
    Items[Items["MOONSHINE"] = 1386] = "MOONSHINE";
    Items[Items["COLD_MEDICINE"] = 1742] = "COLD_MEDICINE";
    Items[Items["SURVIVAL_BORSCHT"] = 1379] = "SURVIVAL_BORSCHT";
    Items[Items["SANDWICH_WOLF"] = 1458] = "SANDWICH_WOLF";
    Items[Items["STEAK_WOLF"] = 1343] = "STEAK_WOLF";
    Items[Items["MEAT_WOLF"] = 1342] = "MEAT_WOLF";
    Items[Items["MEAT_ROTTEN"] = 1381] = "MEAT_ROTTEN";
    //#endregion
    //#region CONSTRUCTION
    Items[Items["GROUND_TAMPER"] = 124] = "GROUND_TAMPER";
    Items[Items["SHACK"] = 1433] = "SHACK";
    Items[Items["SHACK_SMALL"] = 1440] = "SHACK_SMALL";
    Items[Items["SHACK_BASIC"] = 1468] = "SHACK_BASIC";
    Items[Items["SHELTER"] = 150] = "SHELTER";
    Items[Items["SHELTER_LARGE"] = 153] = "SHELTER_LARGE";
    Items[Items["SHELTER_UPPER_LARGE"] = 1897] = "SHELTER_UPPER_LARGE";
    Items[Items["SHELTER_UPPER"] = 1898] = "SHELTER_UPPER";
    Items[Items["FOUNDATION"] = 1378] = "FOUNDATION";
    Items[Items["FOUNDATION_EXPANSION"] = 2336] = "FOUNDATION_EXPANSION";
    Items[Items["FOUNDATION_RAMP"] = 2269] = "FOUNDATION_RAMP";
    Items[Items["FOUNDATION_STAIRS"] = 2270] = "FOUNDATION_STAIRS";
    Items[Items["METAL_GATE"] = 148] = "METAL_GATE";
    Items[Items["DOOR_METAL"] = 1881] = "DOOR_METAL";
    Items[Items["DOOR_WOOD"] = 1435] = "DOOR_WOOD";
    Items[Items["METAL_WALL"] = 149] = "METAL_WALL";
    Items[Items["METAL_WALL_UPPER"] = 1896] = "METAL_WALL_UPPER";
    Items[Items["DOOR_BASIC"] = 1470] = "DOOR_BASIC";
    Items[Items["LANDMINE"] = 74] = "LANDMINE";
    Items[Items["IED"] = 1699] = "IED";
    Items[Items["PUNJI_STICKS"] = 98] = "PUNJI_STICKS";
    //PUNJI_STICK_ROW = // NEED TO FIND THIS IN ITEM DEFINITIONS
    Items[Items["SNARE"] = 1415] = "SNARE";
    Items[Items["ANIMAL_TRAP"] = 91] = "ANIMAL_TRAP";
    Items[Items["BARBED_WIRE"] = 108] = "BARBED_WIRE";
    Items[Items["BARBEQUE"] = 1447] = "BARBEQUE";
    Items[Items["BEE_BOX"] = 2034] = "BEE_BOX";
    Items[Items["CAMPFIRE"] = 15] = "CAMPFIRE";
    Items[Items["CANDLE"] = 1904] = "CANDLE";
    Items[Items["DEW_COLLECTOR"] = 97] = "DEW_COLLECTOR";
    Items[Items["FURNACE"] = 64] = "FURNACE";
    Items[Items["LOOKOUT_TOWER"] = 2272] = "LOOKOUT_TOWER";
    Items[Items["METAL_DOORWAY"] = 1969] = "METAL_DOORWAY";
    Items[Items["REPAIR_BOX"] = 2792] = "REPAIR_BOX";
    Items[Items["SLEEPING_MAT"] = 51] = "SLEEPING_MAT";
    Items[Items["STORAGE_BOX"] = 1982] = "STORAGE_BOX";
    Items[Items["STRUCTURE_STAIRS"] = 154] = "STRUCTURE_STAIRS";
    Items[Items["STRUCTURE_STAIRS_UPPER"] = 1900] = "STRUCTURE_STAIRS_UPPER";
    Items[Items["WORKBENCH"] = 1891] = "WORKBENCH";
    Items[Items["WORKBENCH_WEAPON"] = 3778] = "WORKBENCH_WEAPON";
    Items[Items["BARRICADE"] = 122] = "BARRICADE";
    //#endregion
    //#region COMPONENT
    Items[Items["SHARD_METAL"] = 114] = "SHARD_METAL";
    Items[Items["SHARD_BRASS"] = 3780] = "SHARD_BRASS";
    Items[Items["SHARD_PLASTIC"] = 3775] = "SHARD_PLASTIC";
    Items[Items["GUNPOWDER_REFINED"] = 3805] = "GUNPOWDER_REFINED";
    Items[Items["ALLOY_LEAD"] = 3779] = "ALLOY_LEAD";
    Items[Items["PROTOTYPE_MECHANISM"] = 3455] = "PROTOTYPE_MECHANISM";
    Items[Items["PROTOTYPE_TRIGGER_ASSEMBLY"] = 3456] = "PROTOTYPE_TRIGGER_ASSEMBLY";
    Items[Items["PROTOTYPE_RECEIVER"] = 3457] = "PROTOTYPE_RECEIVER";
    Items[Items["NAIL"] = 135] = "NAIL";
    Items[Items["BACKPACK_FRAME"] = 1466] = "BACKPACK_FRAME";
    Items[Items["METAL_BRACKET"] = 141] = "METAL_BRACKET";
    Items[Items["ANIMAL_FAT"] = 72] = "ANIMAL_FAT";
    Items[Items["FLOUR"] = 1455] = "FLOUR";
    Items[Items["WAX"] = 2193] = "WAX";
    Items[Items["PHONE_DEAD"] = 2635] = "PHONE_DEAD";
    Items[Items["PHONE_BATTERY"] = 2637] = "PHONE_BATTERY";
    Items[Items["PHONE_CHARGED"] = 2636] = "PHONE_CHARGED";
    Items[Items["CORN_MASH"] = 1385] = "CORN_MASH";
    Items[Items["YEAST"] = 1445] = "YEAST";
    Items[Items["DEER_SCENT"] = 1462] = "DEER_SCENT";
    Items[Items["DEER_BLADDER"] = 1463] = "DEER_BLADDER";
    Items[Items["DUCT_TAPE"] = 134] = "DUCT_TAPE";
    Items[Items["TRAP_IGNITION_KIT"] = 2831] = "TRAP_IGNITION_KIT";
    Items[Items["SALINE"] = 77] = "SALINE";
    Items[Items["WHEAT"] = 1438] = "WHEAT";
    Items[Items["TWINE"] = 142] = "TWINE";
    Items[Items["GUN_PART"] = 1890] = "GUN_PART";
    Items[Items["REPAIR_KIT_GUN"] = 1895] = "REPAIR_KIT_GUN";
    Items[Items["UPGRADE_KIT_GUN"] = 2419] = "UPGRADE_KIT_GUN";
    Items[Items["CHARCOAL"] = 26] = "CHARCOAL";
    Items[Items["METAL_BAR"] = 39] = "METAL_BAR";
    Items[Items["ANTI_VIRAL_BOTTLE"] = 2671] = "ANTI_VIRAL_BOTTLE";
    Items[Items["HANDWRITTEN_NOTE_CAROLINE"] = 2611] = "HANDWRITTEN_NOTE_CAROLINE";
    Items[Items["ANTI_VIRAL_BOTTLE_EMPTY"] = 2612] = "ANTI_VIRAL_BOTTLE_EMPTY";
    Items[Items["GRENADE_SONIC_BROKEN"] = 3040] = "GRENADE_SONIC_BROKEN";
    Items[Items["VIAL_H1Z1_B_PLASMA"] = 3041] = "VIAL_H1Z1_B_PLASMA";
    Items[Items["VIAL_H1Z1_REDUCER"] = 2498] = "VIAL_H1Z1_REDUCER";
    Items[Items["BATTERIES_AA"] = 2833] = "BATTERIES_AA";
    Items[Items["BRAIN_TREATED"] = 2643] = "BRAIN_TREATED";
    Items[Items["BRAIN_INFECTED"] = 2642] = "BRAIN_INFECTED";
    Items[Items["SYRINGE_INFECTED_BLOOD"] = 1510] = "SYRINGE_INFECTED_BLOOD";
    Items[Items["EMPTY_SPECIMEN_BAG"] = 2641] = "EMPTY_SPECIMEN_BAG";
    //#endregion
    Items[Items["TRAP_FIRE"] = 2812] = "TRAP_FIRE";
    Items[Items["TRAP_FLASH"] = 2810] = "TRAP_FLASH";
    Items[Items["TRAP_GAS"] = 2811] = "TRAP_GAS";
    Items[Items["TRAP_SHOCK"] = 2832] = "TRAP_SHOCK";
    Items[Items["BACKPACK_FRAMED"] = 2111] = "BACKPACK_FRAMED";
    Items[Items["BACKPACK_SATCHEL"] = 1432] = "BACKPACK_SATCHEL";
    Items[Items["BACKPACK_MILITARY_TAN"] = 2124] = "BACKPACK_MILITARY_TAN";
    Items[Items["BACKPACK_BLUE_ORANGE"] = 2038] = "BACKPACK_BLUE_ORANGE";
    Items[Items["HELMET_MOTORCYCLE"] = 2170] = "HELMET_MOTORCYCLE";
    Items[Items["HAT_CAP"] = 12] = "HAT_CAP";
    Items[Items["SHIRT_DEFAULT"] = 2088] = "SHIRT_DEFAULT";
    Items[Items["PANTS_DEFAULT"] = 2177] = "PANTS_DEFAULT";
    Items[Items["SHIRT_SCRUBS_BLUE"] = 2553] = "SHIRT_SCRUBS_BLUE";
    Items[Items["PANTS_SCRUBS_BLUE"] = 2557] = "PANTS_SCRUBS_BLUE";
    Items[Items["SURGEON_MASK_AQUA"] = 2569] = "SURGEON_MASK_AQUA";
    Items[Items["CAP_SCRUBS_BLUE"] = 2560] = "CAP_SCRUBS_BLUE";
    Items[Items["CONVEYS_BLUE"] = 2217] = "CONVEYS_BLUE";
    Items[Items["HAT_BEANIE"] = 2162] = "HAT_BEANIE";
    Items[Items["SUGAR"] = 57] = "SUGAR";
    Items[Items["BATTERY"] = 1696] = "BATTERY";
    Items[Items["SPARKPLUGS"] = 1701] = "SPARKPLUGS";
    Items[Items["SALT"] = 22] = "SALT";
    Items[Items["LIGHTER"] = 1436] = "LIGHTER";
    Items[Items["BOW_DRILL"] = 1452] = "BOW_DRILL";
    Items[Items["WATER_EMPTY"] = 1353] = "WATER_EMPTY";
    Items[Items["FUEL_BIOFUEL"] = 73] = "FUEL_BIOFUEL";
    Items[Items["FUEL_ETHANOL"] = 1384] = "FUEL_ETHANOL";
    Items[Items["WOOD_PLANK"] = 109] = "WOOD_PLANK";
    Items[Items["METAL_SHEET"] = 46] = "METAL_SHEET";
    Items[Items["METAL_SCRAP"] = 48] = "METAL_SCRAP";
    Items[Items["BROKEN_METAL_ITEM"] = 1354] = "BROKEN_METAL_ITEM";
    Items[Items["TARP"] = 155] = "TARP";
    Items[Items["WOOD_LOG"] = 16] = "WOOD_LOG";
    Items[Items["WOOD_STICK"] = 111] = "WOOD_STICK";
    Items[Items["GROUND_TILLER"] = 1383] = "GROUND_TILLER";
    Items[Items["FERTILIZER"] = 25] = "FERTILIZER";
    Items[Items["SEED_CORN"] = 1987] = "SEED_CORN";
    Items[Items["SEED_WHEAT"] = 1988] = "SEED_WHEAT";
    Items[Items["VIAL_EMPTY"] = 2510] = "VIAL_EMPTY";
    Items[Items["SYRINGE_EMPTY"] = 1508] = "SYRINGE_EMPTY";
    Items[Items["GHILLIE_SUIT"] = 92] = "GHILLIE_SUIT";
    Items[Items["GHILLIE_SUIT_TAN"] = 2570] = "GHILLIE_SUIT_TAN";
    Items[Items["HELMET_TACTICAL"] = 2172] = "HELMET_TACTICAL";
    Items[Items["RESPIRATOR"] = 2148] = "RESPIRATOR";
    Items[Items["NV_GOGGLES"] = 1700] = "NV_GOGGLES";
    Items[Items["ALL_PURPOSE_GOGGLES"] = 1693] = "ALL_PURPOSE_GOGGLES";
    Items[Items["GUNPOWDER"] = 11] = "GUNPOWDER";
    Items[Items["KEVLAR_DEFAULT"] = 2271] = "KEVLAR_DEFAULT";
    Items[Items["ARMOR_PLATED"] = 2205] = "ARMOR_PLATED";
    Items[Items["ARMOR_WOODEN"] = 2204] = "ARMOR_WOODEN";
    Items[Items["CLOTH"] = 23] = "CLOTH";
    Items[Items["METAL_PIPE"] = 47] = "METAL_PIPE";
    Items[Items["GRENADE_SMOKE"] = 2236] = "GRENADE_SMOKE";
    Items[Items["GRENADE_FLASH"] = 2235] = "GRENADE_FLASH";
    Items[Items["GRENADE_GAS"] = 2237] = "GRENADE_GAS";
    Items[Items["GRENADE_HE"] = 65] = "GRENADE_HE";
    Items[Items["GRENADE_SCREAM"] = 3022] = "GRENADE_SCREAM";
    Items[Items["MAP"] = 1985] = "MAP";
    Items[Items["COMPASS"] = 1441] = "COMPASS";
    Items[Items["FLARE"] = 1804] = "FLARE";
    Items[Items["FLARE_PARACHUTE"] = 1906] = "FLARE_PARACHUTE";
    Items[Items["FLARE_SMOKE"] = 1672] = "FLARE_SMOKE";
    Items[Items["BACKPACK_RASTA"] = 2393] = "BACKPACK_RASTA";
    Items[Items["WAIST_PACK"] = 1803] = "WAIST_PACK";
    Items[Items["FANNY_PACK_DEV"] = 1] = "FANNY_PACK_DEV";
    Items[Items["VEHICLE_KEY"] = 3460] = "VEHICLE_KEY";
    Items[Items["CODED_MESSAGE"] = 2722] = "CODED_MESSAGE";
    Items[Items["AIRDROP_CODE"] = 2675] = "AIRDROP_CODE";
    Items[Items["BANDANA_BASIC"] = 2323] = "BANDANA_BASIC";
    Items[Items["GLOVES_FINGERLESS"] = 2324] = "GLOVES_FINGERLESS";
    Items[Items["HAND_SHOVEL"] = 1697] = "HAND_SHOVEL";
    Items[Items["COMPASS_IMPROVISED"] = 1444] = "COMPASS_IMPROVISED";
    Items[Items["SKINNING_KNIFE"] = 110] = "SKINNING_KNIFE";
    Items[Items["RIGGED_LIGHT"] = 1748] = "RIGGED_LIGHT";
    Items[Items["SYRINGE_H1Z1_REDUCER"] = 1464] = "SYRINGE_H1Z1_REDUCER";
    Items[Items["LOCKER_KEY_F1"] = 2645] = "LOCKER_KEY_F1";
    Items[Items["LOCKER_KEY_F2"] = 2646] = "LOCKER_KEY_F2";
    Items[Items["LOCKER_KEY_F3"] = 2647] = "LOCKER_KEY_F3";
    Items[Items["LOCKER_KEY_F4"] = 2648] = "LOCKER_KEY_F4";
    Items[Items["EMERGENCY_RADIO"] = 2273] = "EMERGENCY_RADIO";
    Items[Items["HEADLIGHTS_OFFROADER"] = 9] = "HEADLIGHTS_OFFROADER";
    Items[Items["HEADLIGHTS_PICKUP"] = 1728] = "HEADLIGHTS_PICKUP";
    Items[Items["HEADLIGHTS_POLICE"] = 1730] = "HEADLIGHTS_POLICE";
    Items[Items["HEADLIGHTS_ATV"] = 2595] = "HEADLIGHTS_ATV";
    Items[Items["TURBO_OFFROADER"] = 90] = "TURBO_OFFROADER";
    Items[Items["TURBO_PICKUP"] = 1729] = "TURBO_PICKUP";
    Items[Items["TURBO_POLICE"] = 1731] = "TURBO_POLICE";
    Items[Items["TURBO_ATV"] = 2727] = "TURBO_ATV";
    Items[Items["VEHICLE_HOTWIRE"] = 3458] = "VEHICLE_HOTWIRE";
    Items[Items["VEHICLE_MOTOR_OFFROADER"] = 1344] = "VEHICLE_MOTOR_OFFROADER";
    Items[Items["VEHICLE_MOTOR_PICKUP"] = 1712] = "VEHICLE_MOTOR_PICKUP";
    Items[Items["VEHICLE_MOTOR_POLICECAR"] = 1722] = "VEHICLE_MOTOR_POLICECAR";
    Items[Items["VEHICLE_MOTOR_ATV"] = 2594] = "VEHICLE_MOTOR_ATV";
    Items[Items["VEHICLE_HORN"] = 1858] = "VEHICLE_HORN";
    Items[Items["VEHICLE_HORN_POLICECAR"] = 1735] = "VEHICLE_HORN_POLICECAR";
    Items[Items["VEHICLE_SIREN_POLICECAR"] = 1732] = "VEHICLE_SIREN_POLICECAR";
    // NOT USED FOR NOW
    Items[Items["VEHICLE_CONTAINER_OFFROADER"] = 1541] = "VEHICLE_CONTAINER_OFFROADER";
    Items[Items["VEHICLE_CONTAINER_PICKUP"] = 1783] = "VEHICLE_CONTAINER_PICKUP";
    Items[Items["VEHICLE_CONTAINER_POLICECAR"] = 1723] = "VEHICLE_CONTAINER_POLICECAR";
    Items[Items["VEHICLE_CONTAINER_ATV"] = 2728] = "VEHICLE_CONTAINER_ATV";
    Items[Items["CONTAINER_DROPPED_ITEMS"] = 5001] = "CONTAINER_DROPPED_ITEMS";
    Items[Items["CONTAINER_VEHICLE_OFFROADER"] = 5002] = "CONTAINER_VEHICLE_OFFROADER";
    Items[Items["CONTAINER_VEHICLE_PICKUP"] = 5003] = "CONTAINER_VEHICLE_PICKUP";
    Items[Items["CONTAINER_VEHICLE_POLICECAR"] = 5004] = "CONTAINER_VEHICLE_POLICECAR";
    Items[Items["CONTAINER_VEHICLE_ATV"] = 5005] = "CONTAINER_VEHICLE_ATV";
    Items[Items["CONTAINER_STORAGE"] = 5006] = "CONTAINER_STORAGE";
    Items[Items["CONTAINER_WRECKED_VAN"] = 5007] = "CONTAINER_WRECKED_VAN";
    Items[Items["CONTAINER_WRECKED_CAR"] = 5008] = "CONTAINER_WRECKED_CAR";
    Items[Items["CONTAINER_WRECKED_TRUCK"] = 5009] = "CONTAINER_WRECKED_TRUCK";
    Items[Items["CONTAINER_WEAPONS_LOCKER"] = 5010] = "CONTAINER_WEAPONS_LOCKER";
    Items[Items["CONTAINER_DESK"] = 5011] = "CONTAINER_DESK";
    Items[Items["CONTAINER_CABINETS"] = 5012] = "CONTAINER_CABINETS";
    Items[Items["CONTAINER_TOOL_CABINETS"] = 5013] = "CONTAINER_TOOL_CABINETS";
    Items[Items["CONTAINER_DUMPSTER"] = 5014] = "CONTAINER_DUMPSTER";
    Items[Items["CONTAINER_FILE_CABINET"] = 5015] = "CONTAINER_FILE_CABINET";
    Items[Items["CONTAINER_LOCKER"] = 5016] = "CONTAINER_LOCKER";
    Items[Items["CONTAINER_FRIDGE"] = 5017] = "CONTAINER_FRIDGE";
    Items[Items["CONTAINER_OTTOMAN"] = 5018] = "CONTAINER_OTTOMAN";
    Items[Items["CONTAINER_DRESSER"] = 5019] = "CONTAINER_DRESSER";
    Items[Items["CONTAINER_ARMOIRE"] = 5020] = "CONTAINER_ARMOIRE";
    Items[Items["CONTAINER_CABINETS_BATHROOM"] = 5021] = "CONTAINER_CABINETS_BATHROOM";
    Items[Items["CONTAINER_CABINETS_CUBE"] = 5022] = "CONTAINER_CABINETS_CUBE";
    Items[Items["CONTAINER_CABINETS_KITCHEN"] = 5023] = "CONTAINER_CABINETS_KITCHEN";
    Items[Items["CONTAINER_GARBAGE_CAN"] = 5024] = "CONTAINER_GARBAGE_CAN";
    Items[Items["CONTAINER_FURNACE"] = 5025] = "CONTAINER_FURNACE";
    Items[Items["CONTAINER_BARBEQUE"] = 5026] = "CONTAINER_BARBEQUE";
    Items[Items["CONTAINER_CAMPFIRE"] = 5027] = "CONTAINER_CAMPFIRE";
    Items[Items["CONTAINER_DEW_COLLECTOR"] = 5028] = "CONTAINER_DEW_COLLECTOR";
    Items[Items["CONTAINER_ANIMAL_TRAP"] = 5029] = "CONTAINER_ANIMAL_TRAP";
    Items[Items["CONTAINER_BEE_BOX"] = 5030] = "CONTAINER_BEE_BOX";
    Items[Items["CONTAINER_DRUG_CABINET"] = 5031] = "CONTAINER_DRUG_CABINET";
    Items[Items["CONTAINER_MEDICAL_STATION"] = 5032] = "CONTAINER_MEDICAL_STATION";
    Items[Items["CONTAINER_HOSPITAL_DESK"] = 5033] = "CONTAINER_HOSPITAL_DESK";
    Items[Items["CONTAINER_GROSSING_STATION"] = 5034] = "CONTAINER_GROSSING_STATION";
    Items[Items["CONTAINER_HOSPITAL_REFRIGERATOR"] = 5035] = "CONTAINER_HOSPITAL_REFRIGERATOR";
    Items[Items["CONTAINER_HOSPITAL_CABINET"] = 5036] = "CONTAINER_HOSPITAL_CABINET";
})(Items = exports.Items || (exports.Items = {}));
var Skins_Shirt;
(function (Skins_Shirt) {
    Skins_Shirt[Skins_Shirt["CAMO_TAN_FLANNEL_SHIRT"] = 2030] = "CAMO_TAN_FLANNEL_SHIRT";
    Skins_Shirt[Skins_Shirt["BLUE_FLANNEL_SHIRT"] = 2054] = "BLUE_FLANNEL_SHIRT";
    Skins_Shirt[Skins_Shirt["BROWN_FLANNEL_SHIRT"] = 2055] = "BROWN_FLANNEL_SHIRT";
    Skins_Shirt[Skins_Shirt["GREEN_FLANNEL_SHIRT"] = 2056] = "GREEN_FLANNEL_SHIRT";
    Skins_Shirt[Skins_Shirt["RED_FLANNEL_SHIRT"] = 2057] = "RED_FLANNEL_SHIRT";
    Skins_Shirt[Skins_Shirt["PAISLEY_FLANNEL_SHIRT"] = 2184] = "PAISLEY_FLANNEL_SHIRT";
    Skins_Shirt[Skins_Shirt["CAMO_GREEN_FLANNEL_SHIRT"] = 2187] = "CAMO_GREEN_FLANNEL_SHIRT";
    Skins_Shirt[Skins_Shirt["POLICE_SHIRT"] = 2346] = "POLICE_SHIRT";
    Skins_Shirt[Skins_Shirt["BASIC_HOODIE"] = 2373] = "BASIC_HOODIE";
    Skins_Shirt[Skins_Shirt["BLACK_ORANGE_HOODIE"] = 2374] = "BLACK_ORANGE_HOODIE";
    Skins_Shirt[Skins_Shirt["TWITCH_HOODIE"] = 2375] = "TWITCH_HOODIE";
    Skins_Shirt[Skins_Shirt["BLUE_BLACK_HOODIE"] = 2376] = "BLUE_BLACK_HOODIE";
    Skins_Shirt[Skins_Shirt["DOA_HOODIE"] = 2377] = "DOA_HOODIE";
    Skins_Shirt[Skins_Shirt["PRO_GRAMER_HOODIE"] = 2378] = "PRO_GRAMER_HOODIE";
    Skins_Shirt[Skins_Shirt["PARAMEDIC_UNIFORM"] = 2535] = "PARAMEDIC_UNIFORM";
    Skins_Shirt[Skins_Shirt["SHIRT_DEFAULT"] = 2088] = "SHIRT_DEFAULT";
    Skins_Shirt[Skins_Shirt["Dragon_Lodge_Parka"] = 3033] = "Dragon_Lodge_Parka";
})(Skins_Shirt = exports.Skins_Shirt || (exports.Skins_Shirt = {}));
var Skins_Pants;
(function (Skins_Pants) {
    Skins_Pants[Skins_Pants["FLOWER_PRINT_PANTS"] = 2280] = "FLOWER_PRINT_PANTS";
    Skins_Pants[Skins_Pants["POLICE_SLACKS"] = 2347] = "POLICE_SLACKS";
    Skins_Pants[Skins_Pants["LEGGINGS"] = 2364] = "LEGGINGS";
    Skins_Pants[Skins_Pants["BONE_LEGGINGS"] = 2365] = "BONE_LEGGINGS";
    Skins_Pants[Skins_Pants["MUSCLE_LEGGINGS"] = 2366] = "MUSCLE_LEGGINGS";
    Skins_Pants[Skins_Pants["PARAMEDIC_SLACKS"] = 2534] = "PARAMEDIC_SLACKS";
    Skins_Pants[Skins_Pants["PANTS_DEFAULT"] = 2177] = "PANTS_DEFAULT";
    Skins_Pants[Skins_Pants["TWIN_GALAXIES_PANTS"] = 3875] = "TWIN_GALAXIES_PANTS";
    Skins_Pants[Skins_Pants["Stars_Stripes_Shorts"] = 2404] = "Stars_Stripes_Shorts";
})(Skins_Pants = exports.Skins_Pants || (exports.Skins_Pants = {}));
var Skins_Beanie;
(function (Skins_Beanie) {
    Skins_Beanie[Skins_Beanie["AVIATOR_CAP"] = 2058] = "AVIATOR_CAP";
    Skins_Beanie[Skins_Beanie["BLACK_BEANIE"] = 2162] = "BLACK_BEANIE";
    Skins_Beanie[Skins_Beanie["POLICE_HAT"] = 2344] = "POLICE_HAT";
})(Skins_Beanie = exports.Skins_Beanie || (exports.Skins_Beanie = {}));
var Skins_Cap;
(function (Skins_Cap) {
    Skins_Cap[Skins_Cap["CAMO_GREEN_OUTBACK_HAT"] = 2046] = "CAMO_GREEN_OUTBACK_HAT";
    Skins_Cap[Skins_Cap["TAN_CANVAS_OUTBACK_HAT"] = 2066] = "TAN_CANVAS_OUTBACK_HAT";
    Skins_Cap[Skins_Cap["BROWN_LEATHER_OUTBACK_HAT"] = 2067] = "BROWN_LEATHER_OUTBACK_HAT";
    Skins_Cap[Skins_Cap["HAT_CAP"] = 12] = "HAT_CAP";
})(Skins_Cap = exports.Skins_Cap || (exports.Skins_Cap = {}));
var Skins_MotorHelmet;
(function (Skins_MotorHelmet) {
    Skins_MotorHelmet[Skins_MotorHelmet["GORILLA_WARFARE"] = 3631] = "GORILLA_WARFARE";
    Skins_MotorHelmet[Skins_MotorHelmet["ARACHNID"] = 3721] = "ARACHNID";
    Skins_MotorHelmet[Skins_MotorHelmet["DEFAULT"] = 2170] = "DEFAULT";
    /*Infernal_Demon_Mask = 3862,
    Holiday_Hat = 2887,
    Mask_of_Jester = 3366,
    Patchwork_Rudolph_Helmet = 2817,
    Wasteland_Skull_Helmet = 3064,
    EZW_Spiked_Helmet = 3124,
    Dragon_Motorcycle_Helmet = 2828,
    Cigar_Hog_Mask = 2396,
    White_Unicorn_Full_Helmet = 3439,
    Star_Spangled_Hat = 3470,
    Pumpkin_Mask = 2745,
    Scarecrow_Mask = 2750,*/
})(Skins_MotorHelmet = exports.Skins_MotorHelmet || (exports.Skins_MotorHelmet = {}));
var Skins_Kevlar;
(function (Skins_Kevlar) {
    //Toxic_Body_Armor = 2477,
    Skins_Kevlar[Skins_Kevlar["KEVLAR_DEFAULT"] = 2271] = "KEVLAR_DEFAULT";
    /*Dead_End_Armor = 2860,
    EZW_Armored_Championship_Belt = 3125,
    EZW_Armored_Shoulderpads = 3126,*/
})(Skins_Kevlar = exports.Skins_Kevlar || (exports.Skins_Kevlar = {}));
var Skins_Military;
(function (Skins_Military) {
    Skins_Military[Skins_Military["Military_Default"] = 2124] = "Military_Default";
    Skins_Military[Skins_Military["Rasta_Backpack"] = 2393] = "Rasta_Backpack";
    /*Pink_Skulls_Survivor_Backpack = 3046,
    Sniper_Military_Backpack = 3169,
    Fully_Geared_Explorer_Backpack = 4009,*/
})(Skins_Military = exports.Skins_Military || (exports.Skins_Military = {}));
var Skins_Glasses;
(function (Skins_Glasses) {
    Skins_Glasses[Skins_Glasses["Evil_Clown_Glasses"] = 2253] = "Evil_Clown_Glasses";
    Skins_Glasses[Skins_Glasses["Default_Goggles"] = 1693] = "Default_Goggles";
    Skins_Glasses[Skins_Glasses["White_Biker_Glasses"] = 2252] = "White_Biker_Glasses";
    Skins_Glasses[Skins_Glasses["Steampunk_Goggles"] = 2954] = "Steampunk_Goggles";
})(Skins_Glasses = exports.Skins_Glasses || (exports.Skins_Glasses = {}));
//# sourceMappingURL=enums.js.map