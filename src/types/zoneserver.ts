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

import { ConstructionParentEntity } from "servers/ZoneServer2016/entities/constructionparententity";
import { ConstructionChildEntity } from "servers/ZoneServer2016/entities/constructionchildentity";
import { FilterIds, HealTypes, Items } from "servers/ZoneServer2016/models/enums";
import { ConstructionDoor } from "servers/ZoneServer2016/entities/constructiondoor";
import { LootableConstructionEntity } from "servers/ZoneServer2016/entities/lootableconstructionentity";
import { LoadoutItem } from "servers/ZoneServer2016/classes/loadoutItem";
import { ZoneServer2016 } from "servers/ZoneServer2016/zoneserver";
import { Character2016 } from "servers/ZoneServer2016/entities/character";
import { BaseItem } from "servers/ZoneServer2016/classes/baseItem";

export interface npcData {
  guid: string;
  characterId: string;
  transientId: number;
  modelId: number;
  scale: number[];
  resources: any;
  position: Float32Array;
  rotation: Float32Array;
  attachedObject: any;
  vehicleId: number;
  positionUpdateType: number;
  color: any;
  unknownArray1: any[];
  destroyedState: number;
  array5: any[];
  array17: any[];
  array18: any[];
}
export interface seats {
  seat1: boolean;
  seat2: boolean;
  seat3: boolean;
  seat4: boolean;
}

export interface passengers {
  passenger1?: any;
  passenger2?: any;
  passenger3?: any;
  passenger4?: any;
}

export interface positionUpdate {
  flags?: number;
  sequenceTime?: number;
  unknown3_int8?: number;
  stance?: number;
  position?: Array<number>;
  orientation?: any;
  frontTilt?: number;
  sideTilt?: number;
  angleChange?: number;
  verticalSpeed?: number;
  horizontalSpeed?: number;
  unknown12_float?: number;
  rotation?: any;
  rotationRaw?: any;
  lookAt?: Array<number>;
  direction?: any;
  engineRPM?: any;
}

export interface CharacterEquipment {
  modelName: string;
  slotId: number;
  effectId?: number;
  guid?: string;
  defaultTextureAlias?: string;
  textureAlias?: string;
  tintAlias?: string;
  decalAlias?: string;
  SHADER_PARAMETER_GROUP?: Array<{SHADER_SEMANTIC_ID: number}>
}

export interface GrinderItem {
  itemDefinitionId: number;
  count: number;
}

export interface Weather {
  templateName?: string;
  name: string;
  unknownDword1: number;
  unknownDword2: number;
  unknownDword3: number;
  unknownDword4: number;
  fogDensity: number;
  fogGradient: number;
  fogFloor: number;
  unknownDword7: number;
  rain: number;
  temp: number;
  skyColor: number;
  cloudWeight0: number;
  cloudWeight1: number;
  cloudWeight2: number;
  cloudWeight3: number;
  sunAxisX: number;
  sunAxisY: number;
  sunAxisZ: number;
  unknownDword18: number;
  unknownDword19: number;
  unknownDword20: number;
  wind: number;
  unknownDword22: number;
  unknownDword23: number;
  unknownDword24: number;
  unknownDword25: number;
  unknownArray: UnknownArray[];
}

export interface UnknownArray {
  unknownDword1: number;
  unknownDword2: number;
  unknownDword3: number;
  unknownDword4: number;
  unknownDword5: number;
  unknownDword6: number;
  unknownDword7: number;
}

export interface skyData {
  templateName?: string;
  snow: number;
  snowMap: number;
  colorGradient: number;
  sunAxisX: number;
  sunAxisY: number;
  wind: number;
}

export interface HitReport {
  sessionProjectileCount: number;
  characterId: string;
  position: Float32Array;
  unknownFlag1: number;
  hitLocation?: string;
  totalShotCount: number;
  unknownByte2: number;
}

export interface DamageInfo {
  entity: string;
  weapon?: Items;
  damage: number;
  causeBleed?: boolean;
  hitReport?: HitReport;
  message?: string;
  meleeType?: number;
}

export interface DamageRecord {
  source: {
    name: string;
    ping: number;
  };
  target: {
    name: string;
    ping: number;
  };
  hitInfo: {
    timestamp: number;
    weapon?: Items;
    distance: string;
    hitLocation: string;
    hitPosition: Float32Array;
    oldHP: number;
    newHP: number;
    message: string;
  };
}

export interface FireHint {
  id: number;
  position: Float32Array;
  rotation: number;
  hitNumber: number;
  weaponItem: LoadoutItem
  timeStamp: number,
  projectileUniqueId: number;
  marked?: { characterId: string, position: Float32Array, rotation: Float32Array, gameTime: number }
}

export interface CharacterEffect {
  id: number;
  duration: number;
  callback?: (server: ZoneServer2016, character: Character2016) => void;
  endCallback?: (server: ZoneServer2016, character: Character2016) => void;
}

export interface SpawnLocation {
  id: number;
  name: string;
  position: Float32Array;
  rotation: Float32Array;
}

export interface LootDefinition {
  item: number;
  weight: number;
  spawnCount: {
    min: number;
    max: number;
  };
}

export interface LootSpawner {
  spawnChance: number;
  items: Array<LootDefinition>;
}

export interface ContainerLootSpawner extends LootSpawner {
  maxItems: number;
}

export interface RecipeComponent {
  itemDefinitionId: number;
  requiredAmount: number;
}

export interface Recipe {
  filterId: FilterIds;
  bundleCount?: number;
  components: Array<RecipeComponent>;
  splitted?: boolean;
  itemId?: number;
  requireWorkbench?: boolean
  requireWeaponWorkbench?: boolean
  leftOverItems?: number[]
}

export interface ItemUseOption {
  itemDef: number,
  type: number,
  timeout: number,
  eatCount?: number,
  drinkCount?: number,
  comfortCount?: number,
  givetrash?: number,
  healCount?: number,
  staminaCount?: number,
  enduranceCount?: number
  bandagingCount?: number,
  refuelCount?: number,
  healType?: HealTypes,
}

export interface smeltRecipe {
  filterId: FilterIds;
  rewardId: number;
  components: Array<RecipeComponent>;
}

export interface dailyRepairMaterial {
    itemDefinitionId: number;
    requiredCount: number;
}

export type SlottedConstructionEntity = ConstructionChildEntity | ConstructionParentEntity | ConstructionDoor;

export type ConstructionEntity = SlottedConstructionEntity | LootableConstructionEntity;

export type ShelterSlotsPlacementTimer = {
	[slot: number]: number;
};

export interface ConstructionPermissions {
  characterId: string;
  characterName: string;
  useContainers: boolean;
  build: boolean;
  demolish: boolean;
  visit: boolean;
}

export type ConstructionSlotPositionMap = { [slot: number]: { position: Float32Array, rotation: Float32Array } };

export type OccupiedSlotMap = { [slot: string]: SlottedConstructionEntity };

type Point2D = [number, number];

export type SquareBounds = [Point2D, Point2D, Point2D, Point2D];

export type Point3D = [...Point2D, number];

export type CubeBounds = [Point3D, Point3D, Point3D, Point3D, Point3D, Point3D, Point3D, Point3D];

export interface ClientBan {
  name: string;
  banType: string;
  banReason: string;
  loginSessionId: string;
  IP: string;
  adminId: string;
  expirationDate: number;
  active: boolean;
  unBanAdminName: string;
}

export interface ClientMute {
  name: string;
  muteReason: string;
  loginSessionId: string;
  adminName: string;
  expirationDate: number;
  active: boolean;
  unmuteAdminName: string;
}

export interface Group {
  groupId: number;
  leader: string;
  members: Array<string>;
}

export interface FairPlayWeaponStat {
  maxSpeed: number;
  minSpeed: number;
  maxDistance: number;
}

export interface FairPlayValues {
  lastLoginDateAddVal: number;
  maxTimeDrift: number;
  maxSpeed: number;
  maxVerticalSpeed: number;
  speedWarnsNumber: number;
  maxTpDist: number;
  defaultMaxProjectileSpeed: number;
  defaultMinProjectileSpeed: number;
  defaultMaxDistance: number;
  WEAPON_308: FairPlayWeaponStat;
  WEAPON_CROSSBOW: FairPlayWeaponStat;
  WEAPON_BOW_MAKESHIFT: FairPlayWeaponStat;
  WEAPON_BOW_RECURVE: FairPlayWeaponStat;
  WEAPON_BOW_WOOD: FairPlayWeaponStat;
  WEAPON_SHOTGUN: FairPlayWeaponStat;
  dotProductMin: number;
  dotProductMinShotgun: number;
  dotProductBlockValue: number;
  requiredFile: string;
  requiredString: string;
  requiredFile2: string;
  respawnCheckRange: number;
  respawnCheckTime: number;
  respawnCheckIterations: number;
  maxFlying: number;
  maxPositionDesync: number;
  maxFlaggedShots: number;
}

export interface SpeedTree {
  objectId: number;
  modelName: string;
}

export interface ZoneSpeedTreeData {
	objectId: number;
	position: Float32Array
}

export interface UseOption {
	id: number;
	typeName: string;
	animationId: number
}

export interface HudIndicator {
	id: number;
	typeName: string;
	nameId: number,
	descriptionId: number,
	imageSetId: number,
}

export interface ScreenEffect {
	effectId: number;
	typeName: string;
	duration: number;
	screenBrightness: number;
	colorGradingFilename: string;
	colorGrading: number;
	screenCover: number;
	transparency: number;
	color: number;
	unknownDword3: number;
  unknownDword7: number;
  unknownDword16: number;
  unknownDword17: number;
  unknownDword18: number;
  unknownDword19: number;
}

export interface clientEffect {
	id: number;
	typeName: string;
	animationName: string
}

export interface modelData {
	id: number;
	fileName: string;
	materialType: number
}

export interface characterIndicatorData {
	typeName: string;
	expirationTime: number;
}

export interface HealType {
	healingTicks: number,
	healingMaxTicks: number
}

export interface StanceFlags {
  FIRST_PERSON: boolean,
  FLAG1: boolean,
  SITTING: boolean,
  STRAFE_RIGHT: boolean,
  STRAFE_LEFT: boolean,
  FORWARD: boolean,
  BACKWARD: boolean,
  FLAG7: boolean,
  FLAG8: boolean,
  PRONED: boolean,
  FLAG10: boolean,
  ON_GROUND: boolean,
  FLAG12: boolean,
  FLAG13: boolean,
  FLAG14: boolean,
  STATIONARY: boolean,
  FLOATING: boolean,
  JUMPING: boolean,
  FLAG18: boolean,
  SPRINTING: boolean,
  CROUCHING: boolean,
  FLAG21: boolean,
}

export interface Weather2016 {
  overcast: number,
	fogDensity: number,
	fogFloor: number,
	fogGradient: number,
	globalPrecipitation: number,
	temperature: number,
	skyClarity: number,
	cloudWeight0: number,
	cloudWeight1: number,
	cloudWeight2: number,
	cloudWeight3: number,
	transitionTime: number,
	sunAxisX: number,
	sunAxisY: number,
	sunAxisZ: number,
	windDirectionX: number,
	windDirectionY: number,
	windDirectionZ: number,
	wind: number,
	rainMinStrength: number,
	rainRampupTimeSeconds: number,
	cloudFile: string,
	stratusCloudTiling: number,
	stratusCloudScrollU: number,
	stratusCloudScrollV: number,
	stratusCloudHeight: number,
	cumulusCloudTiling: number,
	cumulusCloudScrollU: number,
	cumulusCloudScrollV: number,
	cumulusCloudHeight: number,
	cloudAnimationSpeed: number,
	cloudSilverLiningThickness: number,
	cloudSilverLiningBrightness: number,
	cloudShadows: number
}

export interface WeatherTemplate extends Weather2016 {
  templateName: string,
}

export interface AccountDefinition {
  ID: number,
  ACCOUNT_ITEM_ID: number,
  REWARD_SET_ID: number,
  REWARD_ITEM_ID: number,
  REWARD_ITEM_TINT_ID: number,
  REWARD_ITEM_COUNT: number,
  REWARD_ITEM_MATERIAL_EFFECT_ID: number,
  CONTENT_ID: number
}

export interface RewardCrateDefinition {
  itemDefinitionId: number,
  rewards: RewardCrateRewardDefinition[]
  excludeFromExchange?: boolean;
}

export interface RewardCrateRewardDefinition {
  itemDefinitionId: number,
  rewardChance: number
}

export interface ItemDefinition {
  NAME: string,
  ID: number,
  CODE_FACTORY_NAME: string,
  NAME_ID: number,
  DESCRIPTION_ID: number,
  IMAGE_SET_ID: number,
  ACTIVATABLE_ABILITY_ID: number,
  PASSIVE_ABILITY_ID: number,
  COST: number,
  ITEM_CLASS: number,
  MAX_STACK_SIZE: number,
  MIN_STACK_SIZE: number,
  PROFILE_OVERRIDE: number,
  NO_TRADE: 0|1,
  SINGLE_USE: 0|1,
  MODEL_NAME: string,
  GENDER_USAGE: number,
  TEXTURE_ALIAS: string,
  SHADER_PARAMETER_GROUP_ID: number,
  CATEGORY_ID: number,
  MEMBERS_ONLY: 0|1,
  NON_MINI_GAME: 0|1,
  PARAM1: number,
  PARAM2: number,
  PARAM3: number,
  NO_SALE: 0|1,
  WEAPON_TRAIL_EFFECT_ID: number,
  USE_REQUIREMENT_ID: number,
  CLIENT_USE_REQUIREMENT_ID: number,
  COMPOSITE_EFFECT_ID: number,
  POWER_RATING: number,
  MIN_PROFILE_RANK: number,
  RARITY: number,
  CONTENT_ID: number,
  NO_LIVE_GAMER: 0|1,
  COMBAT_ONLY: 0|1,
  FORCE_DISABLE_PREVIEW: 0|1,
  MEMBER_DISCOUNT: number,
  RACE_SET_ID: number,
  VIP_RANK_REQUIRED: number,
  PERSIST_PROFILE_SWITCH: number,
  FLAG_QUICK_USE: 0|1,
  FLAG_CAN_EQUIP: 0|1,
  FLAG_ACCOUNT_SCOPE: 0|1,
  UI_MODEL_CAMERA_ID: number,
  EQUIP_COUNT_MAX: number,
  CURRENCY_TYPE: number,
  DATASHEET_ID: number,
  ITEM_TYPE: number,
  SKILL_SET_ID: number,
  OVERLAY_TEXTURE: string,
  DECAL_SLOT: string,
  OVERLAY_ADJUSTMENT: number,
  TRIAL_DURATION_SEC: number,
  NEXT_TRIAL_DELAY_SEC: number,
  PASSIVE_ABILITY_SET_ID: number,
  HUD_IMAGE_SET_ID: number,
  OVERRIDE_APPEARANCE: string,
  OVERRIDE_CAMERA_ID: number,
  PLAYER_STUDIO_DISPLAY_NAME: string,
  STRING_PARAM1: string,
  BULK: number,
  ACTIVE_EQUIP_SLOT_ID: number,
  PASSIVE_EQUIP_SLOT_ID: number,
  USE_ITEM_RETICLE_ID: number,
  GRINDER_REWARD_SET_ID: number,
  BUILD_BAR_GROUP_ID: number,
  FLAG_NO_DRAG_DROP: 0|1,
  INTERACTION_ANIMATION_ID: number,
  IS_ARMOR: 0|1,
  PASSIVE_EQUIP_SLOT_GROUP_ID: number,
  SCRAP_VALUE_OVERRIDE: number,

  // server-side only, added by h1emu
  WORLD_MODEL_ID?: number,
  EFFECT_ID?: number;
  PICKUP_EFFECT?: number,
  PLACEMENT_MODEL_ID?: number,
}

export interface AccountItem extends BaseItem {
  loginSessionId: string;
}

export type EntityDictionary<Entity> = { [characterId: string]: Entity};

export interface PropInstance {
  objectId: number,
  replacementModel: string
}
export interface RandomReward {
  reward: number;
  isRare: boolean;
}
