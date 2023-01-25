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

import { ConstructionParentEntity } from "servers/ZoneServer2016/entities/constructionparententity";
import { ConstructionChildEntity } from "servers/ZoneServer2016/entities/constructionchildentity";
import { FilterIds, Items } from "servers/ZoneServer2016/models/enums";
import { ConstructionDoor } from "servers/ZoneServer2016/entities/constructiondoor";
import { LootableConstructionEntity } from "servers/ZoneServer2016/entities/lootableconstructionentity";

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

export interface characterEquipment {
  modelName: string;
  slotId: number;
  guid?: string;
  defaultTextureAlias?: string;
  textureAlias?: string;
  tintAlias?: string;
  decalAlias?: string;
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

export interface Weather2016 {
  templateName?: string;
  name: string;
  unknownDword1: number;
  fogDensity: number;
  fogFloor: number;
  fogGradient: number;
  rain: number;
  temp: number;
  colorGradient: number;
  unknownDword8: number;
  unknownDword9: number;
  unknownDword10: number;
  unknownDword11: number;
  unknownDword12: number;
  sunAxisX: number;
  sunAxisY: number;
  unknownDword15: number;
  windDirectionX: number;
  windDirectionY: number;
  windDirectionZ: number;
  wind: number;
  unknownDword20: number;
  unknownDword21: number;
  unknownDword22: number;
  unknownDword23: number;
  unknownDword24: number;
  unknownDword25: number;
  unknownDword26: number;
  unknownDword27: number;
  unknownDword28: number;
  unknownDword29: number;
  AOSize: number;
  AOGamma: number;
  AOBlackpoint: number;
  unknownDword33: number;
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
  };
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
  requireWorkbench?: boolean
}

export interface ItemUseOption {
    itemDef: number,
    type: number,
    timeout: number,
    eatCount?: number,
    drinkCount?: number,
    givetrash?: number,
    healCount?: number,
    staminaCount?: number,
    bandagingCount?: number,
    refuelCount?: number,
}

export interface smeltRecipe {
    filterId: FilterIds;
    rewardId: number;
    components: Array<RecipeComponent>;
}

export type SlottedConstructionEntity = ConstructionChildEntity | ConstructionParentEntity | ConstructionDoor;

export type ConstructionEntity = SlottedConstructionEntity | LootableConstructionEntity;

export interface ConstructionPermissions {
  characterId: string;
  characterName: string;
  useContainers: boolean;
  build: boolean;
  demolish: boolean;
  visit: boolean;
}

export type ConstructionSlotPositionMap = { [slot: number]: {position: Float32Array, rotation: Float32Array} };

export type OccupiedSlotMap = { [slot: string]: SlottedConstructionEntity };

type Point2D = [number, number];

export type SquareBounds = [Point2D, Point2D, Point2D, Point2D];

export interface Ban {
  name:string;
  banType:string;
  banReason: string;
  loginSessionId: string;
  IP: string;
  HWID: string;
  adminName: string;
  expirationDate: number;
  active: boolean;
  unBanAdminName: string;
}