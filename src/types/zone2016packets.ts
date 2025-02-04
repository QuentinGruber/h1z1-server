/* prettier-ignore */ 
export interface ClientFinishedLoading {
  characterReleased?: boolean;
}
export interface SendSelfToClient {
  data :{
  guid?: string;
  characterId?: string;
  transientId: unknown;
  lastLoginDate?: string;
  actorModelId?: number;
  headActor?: string;
  hairModel?: string;
  hairTint?: number;
  eyeTint?: number;
  emptyTexture?: string;
  unknownString3?: string;
  unknownString4?: string;
  headId?: number;
  unknownDword6?: number;
  shaderGroupId?: number;
  unknownDword9?: number;
  unknownDword10?: number;
  position?: Float32Array;
  rotation?: Float32Array;
  identity :{
  unknownDword1?: number;
  unknownDword2?: number;
  unknownDword3?: number;
  characterFirstName?: string;
  characterLastName?: string;
  unknownString1?: string;
  characterName?: string;
  unknownQword1?: string;
};
  unknownDword11?: number;
  currency?: unknown[];
  creationDate?: string;
  unknownDword15?: number;
  unknownDword16?: number;
  unknownBoolean1?: boolean;
  isRespawning?: boolean;
  isMember?: number;
  unknownDword18?: number;
  unknownBoolean3?: boolean;
  unknownDword19?: number;
  unknownDword26?: number;
  unknownDword21?: number;
  unknownDword22?: number;
  unknownDword23?: number;
  unknownTime1?: string;
  unknownTime2?: string;
  unknownDword24?: number;
  unknownBoolean5?: boolean;
  dailyRibbonCount?: number;
  profiles?: unknown[];
  currentProfile?: number;
  unknownArray1?: unknown[];
  collections?: unknown[];
  inventory :{
  items?: unknown[];
  unknownDword1?: number;
};
  gender?: number;
  characterQuests :{
  quests?: unknown[];
  unknownDword1?: number;
  unknownDword2?: number;
  unknownBoolean1?: boolean;
  unknownDword3?: number;
  unknownDword4?: number;
};
  characterAchievements?: unknown[];
  acquaintances?: unknown[];
  recipes?: unknown[];
  mounts?: unknown[];
  sendFirstTimeEvents?: boolean;
  SHADER_PARAMETER_GROUP?: unknown[];
  unknownArray2?: unknown[];
  effectTags?: unknown[];
  stats?: unknown[];
  playerTitles?: unknown[];
  currentPlayerTitle?: number;
  unknownArray13?: unknown[];
  unknownArray14?: unknown[];
  unknownDword33?: number;
  FIRE_MODES_1?: unknown[];
  FIRE_MODES_2?: unknown[];
  unknownArray17?: unknown[];
  unknownDword34?: number;
  unknownDword35?: number;
  unknownAbilityData1 :{
  unknownArray1?: unknown[];
  unknownArray2?: unknown[];
  unknownArray3?: unknown[];
};
  unknownAbilityData2 :{
  abilityLines1?: unknown[];
  abilityLines2?: unknown[];
  abilityLines3?: unknown[];
  abilityLines4?: unknown[];
  unknownDword1?: number;
  unknownDword2?: number;
  unknownArray1?: unknown[];
  unknownArray2?: unknown[];
  unknownArray3?: unknown[];
  unknownArray4?: unknown[];
};
  unknownData1 :{
  unknownArray1?: unknown[];
  unknownArray2?: unknown[];
  unknownByte1?: number;
};
  unknownData2 :{
  unknownDword1?: number;
  unknownData1 :{
  unknownDword1?: number;
  unknownDword2?: number;
  unknownDword3?: number;
};
  unknownData11 :{
  unknownDword1?: number;
  unknownDword2?: number;
  unknownDword3?: number;
};
  unknownDword2?: number;
};
  unknownDword37?: number;
  unknownData3 :{
  unknownQword1?: string;
  unknownData1 :{
  unknownData1 :{
  unknownDword1?: number;
  unknownDword2?: number;
  unknownQword1?: string;
};
  unknownQword1?: string;
  unknownDword1?: number;
  unknownDword2?: number;
  unknownDword3?: number;
  unknownData2 :{
  unknownDword1?: number;
  unknownDword2?: number;
  unknownDword3?: number;
  unknownDword4?: number;
};
  unknownString1?: string;
};
  unknownByte1?: number;
};
  unknownArray18?: unknown[];
  unknownData4 :{
  unknownDword1?: number;
  unknownDword2?: number;
  unknownDword3?: number;
  unknownDword4?: number;
  unknownDword5?: number;
};
  unknownArray19?: unknown[];
  unknownArray20?: unknown[];
  unknownArray21?: unknown[];
  unknownArray22?: unknown[];
  unknownArray23?: unknown[];
  equipment?: unknown[];
  unknownArray25?: unknown[];
  unknownData5 :{
  unknownDword1?: number;
  unknownDword2?: number;
  unknownDword3?: number;
  unknownDword4?: number;
  unknownDword5?: number;
};
  unknownData6 :{
  unknownDword1?: number;
  unknownDword2?: number;
  unknownDword3?: number;
};
  implantSlots?: unknown[];
  accountItems :{
  unknownArray1?: unknown[];
  unknownArray2?: unknown[];
  unknownArray3?: unknown[];
};
  unknownArray26?: unknown[];
  unknownData7 :{
  unknownData1 :{
  unknownDword1?: number;
  unknownDword2?: number;
  unknownQword1?: string;
  unknownQword2?: string;
};
  unknownArray1?: unknown[];
  unknownData2 :{
  unknownDword1?: number;
  unknownDword2?: number;
  unknownQword1?: string;
};
  unknownArray2?: unknown[];
  unknownArray3?: unknown[];
  unknownByte1?: number;
};
  unknownData8 :{
  unknownDword1?: number;
  unknownDword2?: number;
  unknownString1?: string;
  unknownArray1?: unknown[];
  unknownArray2?: unknown[];
  unknownArray3?: unknown[];
};
  loadoutSlots :{
  loadoutId?: number;
  loadoutData :{
  loadoutSlots?: unknown[];
};
  currentSlotId?: number;
};
  unknownArray27?: unknown[];
  unknownData9 :{
  unknownArray1?: unknown[];
  unknownArray2?: unknown[];
  unknownArray3?: unknown[];
  unknownArray4?: unknown[];
  unknownArray5?: unknown[];
};
  characterResources?: unknown[];
  skillPointData :{
  skillPointsGranted?: string;
  skillPointsTotal?: string;
  skillPointsSpent?: string;
  unknownQword1?: string;
  unknownQword2?: string;
  unknownDword1?: number;
};
  skills?: unknown[];
  containers?: unknown[];
  unknownArray28?: unknown[];
  unknownArray29?: unknown[];
  quizComplete?: boolean;
  unknownQword1?: string;
  unknownDword38?: number;
  vehicleLoadoutRelatedQword?: string;
  unknownQword3?: string;
  vehicleLoadoutRelatedDword?: number;
  unknownDword40?: number;
  isAdmin?: boolean;
  firstPersonOnly?: boolean;
  spectatorFlags?: number;
};
}
export interface ClientIsReady {
}
export interface ZoneDoneSendingInitialData {
}
export interface ClientBeginZoning {
  zoneName?: string;
  zoneType?: number;
  position?: Float32Array;
  rotation?: Float32Array;
  skyData :{
  overcast?: number;
  fogDensity?: number;
  fogFloor?: number;
  fogGradient?: number;
  globalPrecipitation?: number;
  temperature?: number;
  skyClarity?: number;
  cloudWeight0?: number;
  cloudWeight1?: number;
  cloudWeight2?: number;
  cloudWeight3?: number;
  transitionTime?: number;
  sunAxisX?: number;
  sunAxisY?: number;
  sunAxisZ?: number;
  windDirectionX?: number;
  windDirectionY?: number;
  windDirectionZ?: number;
  wind?: number;
  rainminStrength?: number;
  rainRampupTimeSeconds?: number;
  cloudFile?: string;
  stratusCloudTiling?: number;
  stratusCloudScrollU?: number;
  stratusCloudScrollV?: number;
  stratusCloudHeight?: number;
  cumulusCloudTiling?: number;
  cumulusCloudScrollU?: number;
  cumulusCloudScrollV?: number;
  cumulusCloudHeight?: number;
  cloudAnimationSpeed?: number;
  cloudSilverLiningThickness?: number;
  cloudSilverLiningBrightness?: number;
  cloudShadows?: number;
};
  movementVersion?: number;
  zoneId1?: number;
  zoneId2?: number;
  geometryId?: number;
  nameId?: number;
  unknownBoolean1?: boolean;
  waitForZoneReady?: boolean;
  unknownBoolean3?: boolean;
}
export interface ProjectileDebug {
  weaponDefinitionId?: number;
  unknownDword2?: number;
  unknownDword3?: number;
  unknownDword4?: number;
  unknownDword5?: number;
  unknownDword6?: number;
  unknownByte1?: number;
  unknownDword7?: number;
  unknownWord1?: number;
  unknownString1?: string;
  projectileLocation?: Float32Array;
  playerLocation?: Float32Array;
  unknownByte5?: number;
}
export interface SendZoneDetails {
  zoneName?: string;
  zoneType?: number;
  unknownBoolean1?: boolean;
  skyData :{
  overcast?: number;
  fogDensity?: number;
  fogFloor?: number;
  fogGradient?: number;
  globalPrecipitation?: number;
  temperature?: number;
  skyClarity?: number;
  cloudWeight0?: number;
  cloudWeight1?: number;
  cloudWeight2?: number;
  cloudWeight3?: number;
  transitionTime?: number;
  sunAxisX?: number;
  sunAxisY?: number;
  sunAxisZ?: number;
  windDirectionX?: number;
  windDirectionY?: number;
  windDirectionZ?: number;
  wind?: number;
  rainminStrength?: number;
  rainRampupTimeSeconds?: number;
  cloudFile?: string;
  stratusCloudTiling?: number;
  stratusCloudScrollU?: number;
  stratusCloudScrollV?: number;
  stratusCloudHeight?: number;
  cumulusCloudTiling?: number;
  cumulusCloudScrollU?: number;
  cumulusCloudScrollV?: number;
  cumulusCloudHeight?: number;
  cloudAnimationSpeed?: number;
  cloudSilverLiningThickness?: number;
  cloudSilverLiningBrightness?: number;
  cloudShadows?: number;
};
  zoneId1?: number;
  geometryId?: number;
  nameId?: number;
  unknownBoolean2?: boolean;
  lighting?: string;
  isInvitational?: boolean;
}
export interface GameTimeSync {
  time?: string;
  cycleSpeed?: number;
  unknownBoolean1?: boolean;
}
export interface UpdateClientSessionData {
  sessionId?: string;
  stationName?: string;
  unknownBoolean1?: boolean;
  unknownString1?: string;
  unknownString2?: string;
  stationCode?: string;
  unknownString3?: string;
}
export interface WorldDisplayInfo {
  worldId?: number;
}
export interface SetLocale {
  locale?: string;
}
export interface WorldShutdownNotice {
  timeBeforeShutdown?: string;
  message?: string;
}
export interface KeepAlive {
  gameTime?: number;
}
export interface ClientExitLaunchUrl {
  url?: string;
}
export interface MembershipActivation {
  unknown?: number;
}
export interface ShowSystemMessage {
  unknownDword1?: number;
  message?: string;
  unknownDword2?: number;
  color?: number;
}
export interface POIChangeMessage {
  messageStringId?: number;
  id?: number;
  unknownDword1?: number;
}
export interface ClientLog {
  file?: string;
  message?: string;
}
export interface CommerceSessionResponse {
  unknownBoolean1?: boolean;
  sessionToken?: string;
}
export interface LoginFailed {
}
export interface NpcCollision {
  unknownDword1?: number;
  unknownDword2?: number;
  unknownDword3?: number;
  unknownDword4?: number;
  unknownDword5?: number;
}
export interface ClientGameSettings {
  deprecated?: number;
  interactionCheckRadius?: number;
  unknownBoolean1?: boolean;
  timescale?: number;
  enableWeapons?: number;
  Unknown5?: number;
  unknownFloat1?: number;
  fallDamageVelocityThreshold?: number;
  fallDamageVelocityMultiplier?: number;
}
export interface PlayerTitle {
  unknown1?: number;
  titleId?: number;
}
export interface InitializationParameters {
  ENVIRONMENT?: string;
  unknownString1?: string;
  rulesetDefinitions?: unknown[];
}
export interface ClientInitializationDetails {
  unknownDword1?: number;
}
export interface PlayerUpdatePosition {
  transientId: unknown;
  positionUpdate: unknown;
}
export interface Synchronization {
  clientHoursMs?: string;
  clientHoursMs2?: string;
  clientTime?: string;
  serverTime?: string;
  serverTime2?: string;
  time3?: string;
}
export interface PlayerUpdateManagedPosition {
  transientId?: unknown;
  positionUpdate?: unknown;
}
export interface AddSimpleNpc {
  characterId?: string;
  transientId: unknown;
  unknownByte1?: number;
  position?: Float32Array;
  rotation?: Float32Array;
  unknownDword1?: number;
  terrainObjectId?: number;
  modelId?: number;
  scale?: Float32Array;
  unknownDword3?: number;
  unknownByte2?: number;
  health?: number;
}
export interface ContinentBattleInfo {
  zones?: unknown[];
}
export interface GetContinentBattleInfo {
}
export interface SendSecurityPacketAndSelfDestruct {
  unk?: number;
}
export interface GetRespawnLocations {
}
export interface Security {
  code?: number;
}
export interface ServerPopulationInfo {
  population?: unknown[];
  populationPercent?: unknown[];
  populationBuff?: unknown[];
}
export interface GetServerPopulationInfo {
}
export interface VehicleCollision {
  transientId: unknown;
  damage?: number;
}
export interface PlayerStop {
  transientId: unknown;
  state?: boolean;
}
export interface ClientSettings {
  helpUrl?: string;
  shopUrl?: string;
  shop2Url?: string;
}
export interface RewardBuffInfo {
  unknownFloat1?: number;
  unknownFloat2?: number;
  unknownFloat3?: number;
  unknownFloat4?: number;
  unknownFloat5?: number;
  unknownFloat6?: number;
  unknownFloat7?: number;
  unknownFloat8?: number;
  unknownFloat9?: number;
  unknownFloat10?: number;
  unknownFloat11?: number;
  unknownFloat12?: number;
}
export interface GetRewardBuffInfo {
}
export interface CharacterSelectSessionResponse {
  status?: number;
  sessionId?: string;
}
export interface UpdateWeatherData {
  overcast?: number;
  fogDensity?: number;
  fogFloor?: number;
  fogGradient?: number;
  globalPrecipitation?: number;
  temperature?: number;
  skyClarity?: number;
  cloudWeight0?: number;
  cloudWeight1?: number;
  cloudWeight2?: number;
  cloudWeight3?: number;
  transitionTime?: number;
  sunAxisX?: number;
  sunAxisY?: number;
  sunAxisZ?: number;
  windDirectionX?: number;
  windDirectionY?: number;
  windDirectionZ?: number;
  wind?: number;
  rainminStrength?: number;
  rainRampupTimeSeconds?: number;
  cloudFile?: string;
  stratusCloudTiling?: number;
  stratusCloudScrollU?: number;
  stratusCloudScrollV?: number;
  stratusCloudHeight?: number;
  cumulusCloudTiling?: number;
  cumulusCloudScrollU?: number;
  cumulusCloudScrollV?: number;
  cumulusCloudHeight?: number;
  cloudAnimationSpeed?: number;
  cloudSilverLiningThickness?: number;
  cloudSilverLiningBrightness?: number;
  cloudShadows?: number;
}
export interface AddLightweightPc {
  characterId?: string;
  transientId: unknown;
  identity :{
  unknownDword1?: number;
  unknownDword2?: number;
  unknownDword3?: number;
  characterFirstName?: string;
  characterLastName?: string;
  unknownString1?: string;
  characterName?: string;
  unknownQword1?: string;
};
  unknownByte1?: number;
  actorModelId?: number;
  unknownDword1?: number;
  position?: Float32Array;
  rotation?: Float32Array;
  unknownFloat1?: number;
  mountGuid?: string;
  mountSeatId?: number;
  mountRelatedDword1?: number;
  movementVersion?: number;
  effectId?: number;
  unknownDword4?: number;
  unknownQword1?: string;
  shaderGroupId?: number;
  flags1:{
     flag0?: number,
     knockedOut?: number,
     disableEquipment?: number,
     useEffect?: number,
     flag4?: number,
     isAdmin?: number,
     flag6?: number,
     flag7?: number,
};
}
export interface AddLightweightNpc {
  characterId?: string;
  transientId: unknown;
  petName?: string;
  nameId?: number;
  unknownByte1?: number;
  actorModelId?: number;
  scale?: Float32Array;
  texture?: string;
  unknownString2?: string;
  unknownDword1?: number;
  position?: Float32Array;
  rotation?: Float32Array;
  unknownFloatVector4?: Float32Array;
  unknownDword2?: number;
  unknownDword3?: number;
  headActor?: string;
  unknownString3?: string;
  unknownString4?: string;
  vehicleId?: number;
  projectileUniqueId?: number;
  npcDefinitionId?: number;
  positionUpdateType?: number;
  profileId?: number;
  isLightweight?: boolean;
  flags :{
  flags1:{
     bit0?: number,
     bit1?: number,
     bit2?: number,
     bit3?: number,
     bit4?: number,
     bit5?: number,
     bit6?: number,
     bit7?: number,
};
  flags2:{
     nonAttackable?: number,
     bit9?: number,
     bit10?: number,
     bit11?: number,
     projectileCollision?: number,
     bit13?: number,
     bit14?: number,
     bit15?: number,
};
  flags3:{
     bit16?: number,
     bit17?: number,
     bit18?: number,
     bit19?: number,
     noCollide?: number,
     knockedOut?: number,
     bit22?: number,
     bit23?: number,
};
};
  movementVersion?: number;
  unknownDword8?: number;
  managerCharacterId?: string;
  attachedObject :{
  targetObjectId?: string;
};
  unknownDword9?: number;
  unknownDword10?: number;
  unknownQword2?: string;
  unknownDword11?: number;
  useCollision?: number;
  unknownDword13?: number;
  shaderGroupId?: number;
  unknownDword15?: number;
}
export interface AddLightweightVehicle {
  npcData :{
  characterId?: string;
  transientId: unknown;
  petName?: string;
  nameId?: number;
  unknownByte1?: number;
  actorModelId?: number;
  scale?: Float32Array;
  texture?: string;
  unknownString2?: string;
  unknownDword1?: number;
  position?: Float32Array;
  rotation?: Float32Array;
  unknownFloatVector4?: Float32Array;
  unknownDword2?: number;
  unknownDword3?: number;
  headActor?: string;
  unknownString3?: string;
  unknownString4?: string;
  vehicleId?: number;
  projectileUniqueId?: number;
  npcDefinitionId?: number;
  positionUpdateType?: number;
  profileId?: number;
  isLightweight?: boolean;
  flags :{
  flags1:{
     bit0?: number,
     bit1?: number,
     bit2?: number,
     bit3?: number,
     bit4?: number,
     bit5?: number,
     bit6?: number,
     bit7?: number,
};
  flags2:{
     nonAttackable?: number,
     bit9?: number,
     bit10?: number,
     bit11?: number,
     projectileCollision?: number,
     bit13?: number,
     bit14?: number,
     bit15?: number,
};
  flags3:{
     bit16?: number,
     bit17?: number,
     bit18?: number,
     bit19?: number,
     noCollide?: number,
     knockedOut?: number,
     bit22?: number,
     bit23?: number,
};
};
  movementVersion?: number;
  unknownDword8?: number;
  managerCharacterId?: string;
  attachedObject :{
  targetObjectId?: string;
};
  unknownDword9?: number;
  unknownDword10?: number;
  unknownQword2?: string;
  unknownDword11?: number;
  useCollision?: number;
  unknownDword13?: number;
  shaderGroupId?: number;
  unknownDword15?: number;
};
  unknownGuid1?: string;
  unknownDword1?: number;
  unknownDword2?: number;
  positionUpdate: unknown;
  unknownString1?: string;
}
export interface AddProxiedObject {
  guid?: string;
  transientId: unknown;
  unknownByte1?: number;
  position?: Float32Array;
  rotation?: Float32Array;
}
export interface LightweightToFullPc {
  useCompression?: boolean;
  fullPcData :{
  transientId?: unknown;
  unknownDword1?: number;
  unknownDword2?: number;
  unknownDword3?: number;
  unknownDword4?: number;
  attachmentData?: unknown[];
  headActor?: string;
  hairModel?: string;
  unknownDword5?: number;
  unknownDword6?: number;
  unknownDword7?: number;
  unknownString3?: string;
  unknownString4?: string;
  unknownString5?: string;
  unknownString6?: string;
  unknownString7?: string;
  unknownString8?: string;
  unknownDword8?: number;
  unknownData1 :{
  unknownDword1?: number;
  unknownDword2?: number;
  unknownDword3?: number;
};
  effectTags?: unknown[];
  unknownDword9?: number;
  unknownDword10?: number;
  unknownDword11?: number;
  unknownDword12?: number;
  unknownDword13?: number;
  materialType?: number;
  unknownBool1?: boolean;
  unknownBool2?: boolean;
  unknownBool3?: boolean;
  unknownDword15?: number;
  unknownArray1 :{
  data?: unknown[];
};
  resources :{
  data?: unknown[];
};
  unknownArray2 :{
  unknownArray1?: unknown[];
};
  unknownArray3 :{
  data?: unknown[];
};
  remoteWeapons :{
  data?: unknown[];
};
};
  positionUpdate: unknown;
  unknownByte1?: number;
  unknownByte2?: number;
  unknownQword1?: string;
  stats?: unknown[];
  remoteWeaponExtra?: unknown[];
}
export interface LightweightToFullNpc {
  transientId: unknown;
  unknownDword1?: number;
  unknownDword2?: number;
  unknownDword3?: number;
  attachmentData?: unknown[];
  unknownString1?: string;
  unknownString2?: string;
  unknownDword4?: number;
  unknownFloat1?: number;
  unknownDword5?: number;
  unknownDword6?: number;
  unknownDword7?: number;
  effectTags?: unknown[];
  unknownData1 :{
  unknownDword1?: number;
  unknownString1?: string;
  unknownString2?: string;
  unknownDword2?: number;
  unknownString3?: string;
};
  unknownVector4?: Float32Array;
  unknownDword8?: number;
  characterId?: string;
  targetData: unknown;
  unknownArray1?: unknown[];
  unknownArray2?: unknown[];
  unknownDword9?: number;
  unknownDword10?: number;
  unknownVector5?: Float32Array;
  unknownDword11?: number;
  unknownDword12?: number;
  unknownDword13?: number;
  unknownDword14?: number;
  unknownDword15?: number;
  unknownDword16?: number;
  unknownDword17?: number;
  unknownByte1?: number;
  unknownByte2?: number;
  unknownDword18?: number;
  unknownDword19?: number;
  materialType?: number;
  unknownQword1?: string;
  unknownArray3 :{
  data?: unknown[];
};
  resources :{
  data?: unknown[];
};
  unknownArray4 :{
  unknownArray1?: unknown[];
};
  unknownArray5 :{
  data?: unknown[];
};
  remoteWeapons?: unknown;
  itemsData :{
  items?: unknown[];
  unknownDword1?: number;
};
  unknownDword21?: number;
}
export interface LightweightToFullVehicle {
  npcData :{
  transientId: unknown;
  unknownDword1?: number;
  unknownDword2?: number;
  unknownDword3?: number;
  attachmentData?: unknown[];
  unknownString1?: string;
  unknownString2?: string;
  unknownDword4?: number;
  unknownFloat1?: number;
  unknownDword5?: number;
  unknownDword6?: number;
  unknownDword7?: number;
  effectTags?: unknown[];
  unknownData1 :{
  unknownDword1?: number;
  unknownString1?: string;
  unknownString2?: string;
  unknownDword2?: number;
  unknownString3?: string;
};
  unknownVector4?: Float32Array;
  unknownDword8?: number;
  characterId?: string;
  targetData: unknown;
  unknownArray1?: unknown[];
  unknownArray2?: unknown[];
  unknownDword9?: number;
  unknownDword10?: number;
  unknownVector5?: Float32Array;
  unknownDword11?: number;
  unknownDword12?: number;
  unknownDword13?: number;
  unknownDword14?: number;
  unknownDword15?: number;
  unknownDword16?: number;
  unknownDword17?: number;
  unknownByte1?: number;
  unknownByte2?: number;
  unknownDword18?: number;
  unknownDword19?: number;
  materialType?: number;
  unknownQword1?: string;
  unknownArray3 :{
  data?: unknown[];
};
  resources :{
  data?: unknown[];
};
  unknownArray4 :{
  unknownArray1?: unknown[];
};
  unknownArray5 :{
  data?: unknown[];
};
  remoteWeapons?: unknown;
  itemsData :{
  items?: unknown[];
  unknownDword1?: number;
};
  unknownDword21?: number;
};
  unknownByte1?: number;
  unknownDword1?: number;
  unknownArray1?: unknown[];
  unknownArray2?: unknown[];
  unknownVector1?: Float32Array;
  unknownVector2?: Float32Array;
  unknownByte3?: number;
  passengers?: unknown[];
  unknownArray3?: unknown[];
  stats?: unknown[];
  unknownArray4?: unknown[];
}
export interface ReplicationInteractionComponent {
  opcode?: number;
  transientId: unknown;
  rawComponent?: unknown;
}
export interface FairPlayInternal {
}
export interface CharacterRemovePlayer {
  characterId?: string;
  unknownWord1?: number;
  unknownBool1?: boolean;
  unknownDword1?: number;
  effectDelay?: number;
  effectId?: number;
  stickyEffectId?: number;
  timeToDisappear?: number;
}
export interface CharacterPlayAnimation {
  characterId?: string;
  animationName: unknown;
  unm4?: number;
  unknownDword1?: number;
  unknownByte1?: number;
  unknownDword2?: number;
  animationType?: unknown;
  unknownByte1xda?: number;
  unknownDword3?: number;
}
export interface CharacterUpdateScale {
  characterId?: string;
  scale?: Float32Array;
}
export interface CharacterUpdateCharacterState {
  characterId?: string;
  states1:{
     visible: number,
     afraid: number,
     asleep: number,
     silenced: number,
     bound: number,
     rooted: number,
     stunned: number,
     knockedOut: number,
};
  states2:{
     nonAttackable: number,
     knockedBack: number,
     confused: number,
     goinghome: number,
     inCombat: number,
     frozen: number,
     berserk: number,
     inScriptedAnimation: number,
};
  states3:{
     pull: number,
     revivable: number,
     beingRevived: number,
     cloaked: number,
     interactBlocked: number,
     nonHealable: number,
     weaponFireBlocked: number,
     nonResuppliable: number,
};
  states4:{
     charging: number,
     invincibility: number,
     thrustPadded: number,
     castingAbility: number,
     userMovementDisabled: number,
     flying: number,
     hideCorpse: number,
     gmHidden: number,
};
  states5:{
     griefInvulnerability: number,
     canSpawnTank: number,
     inGravityField: number,
     invulnerable: number,
     friendlyFireImmunity: number,
     riotShielded: number,
     supplyingAmmo: number,
     supplyingRepairs: number,
};
  states6:{
     REUSE_ME_2: number,
     REUSE_ME_3: number,
     hidesHeat: number,
     nearDeath: number,
     dormant: number,
     ignoreStatusNotUsed: number,
     inWater: number,
     disarmed: number,
};
  states7:{
     doorState: number,
     sitting: number,
     error1: number,
     error2: number,
     handsUp: number,
     bit5: number,
     bit6: number,
     bit7: number,
};
  placeholder?: number;
  gameTime?: number;
}
export interface CharacterAddEffectTagCompositeEffect {
  characterId?: string;
  unknownDword1?: number;
  effectId?: number;
  unknownGuid?: string;
  unknownGuid2?: string;
  unknownDword2?: number;
}
export interface CharacterRemoveEffectTagCompositeEffect {
  characterId?: string;
  effectId?: number;
  newEffectId?: number;
}
export interface CharacterReplaceBaseModel {
  characterId?: string;
  modelId?: number;
  effectId?: number;
}
export interface CharacterWeaponStance {
  characterId?: string;
  stance?: number;
}
export interface CharacterUpdateTintAlias {
  characterId?: string;
  tintAlias?: string;
  decalAlias?: string;
}
export interface CharacterMoveOnRail {
  characterId?: string;
  unknown4?: number;
  unknown5?: number;
  position?: Float32Array;
}
export interface CharacterClearMovementRail {
  characterId?: string;
}
export interface CharacterMoveOnRelativeRail {
  characterId?: string;
  unknown4?: number;
  unknown5?: number;
  unknown6?: number;
  unknown7?: number;
  unknown8?: number;
  unknownVector1?: Float32Array;
}
export interface CharacterDestroyed {
  characterId?: string;
  destroyedEffect?: number;
  destroyedModel?: number;
  unknown3?: number;
  disableWeirdPhysic?: boolean;
  destroyedEffect2?: number;
  disableWeirdPhysic2?: boolean;
}
export interface CharacterSeekTarget {
  characterId?: string;
  TargetCharacterId?: string;
  initSpeed?: number;
  acceleration?: number;
  speed?: number;
  turn?: number;
  yRot?: number;
  rotation?: Float32Array;
}
export interface CharacterSeekTargetUpdate {
  characterId?: string;
  TargetCharacterId?: string;
}
export interface CharacterUpdateActiveWieldType {
  characterId?: string;
  unknownDword1?: number;
}
export interface CharacterKnockedOut {
  guid?: string;
}
export interface CharacterKnockedOutDamageReport {
  guid?: string;
  flags1?: number;
  flags2?: number;
  unknownDword1?: number;
  unknownQword1?: string;
  unknownQword2?: string;
  unknownQword3?: string;
  unknownDword2?: number;
  unknownDword3?: number;
  unknownDword4?: number;
  unknownDword5?: number;
  unknownDword6?: number;
  unknownDword7?: number;
  unknownDword8?: number;
  unknownFloatVector1?: Float32Array;
  unknownDword9?: number;
  unknownDword10?: number;
  unknownDword11?: number;
  unknownDword12?: number;
  unknownArray1: unknown[];
  unknownArray2: unknown[];
  unknownArray3: unknown[];
  unknownArray4: unknown[];
}
export interface CharacterRespawn {
  respawnType?: number;
  respawnGuid?: string;
  profileId?: number;
  profileId2?: number;
  unk?: number;
  gridPosition?: Float32Array;
}
export interface CharacterRespawnReply {
  characterId?: string;
  status?: boolean;
}
export interface CharacterJet {
  characterId?: string;
  state?: number;
}
export interface CharacterSetFaction {
  guid?: string;
  factionId?: number;
}
export interface CharacterSetBattleRank {
  characterId?: string;
  battleRank?: number;
}
export interface CharacterManagedObject {
  objectCharacterId?: string;
  guid2?: string;
  characterId?: string;
}
export interface CharacterCharacterStateDelta {
  guid1?: string;
  guid2?: string;
  guid3?: string;
  guid4?: string;
  gameTime?: number;
}
export interface CharacterPlayWorldCompositeEffect {
  characterId?: string;
  effectId?: number;
  position?: Float32Array;
  effectTime?: number;
}
export interface CharacterFullCharacterDataRequest {
  characterId?: string;
}
export interface CharacterKilledBy {
  killer?: string;
  killed?: string;
  isCheater?: boolean;
}
export interface CharacterMotorRunning {
  characterId?: string;
  unknownBool1?: boolean;
}
export interface CharacterDroppedItemNotification {
  characterId?: string;
  itemDefId?: number;
  count?: number;
}
export interface CharacterNoSpaceNotification {
  characterId?: string;
}
export interface CharacterStartMultiStateDeath {
  data: unknown;
}
export interface CharacterDoorState {
  characterId?: string;
  unknownDword1?: number;
  unknownBool1?: boolean;
}
export interface CharacterSetAllowRespawn {
  characterId?: string;
  allowRespawn?: boolean;
}
export interface CharacterMovementVersion {
  characterId?: string;
  version?: number;
}
export interface CharacterDailyRepairMaterials {
  characterId?: string;
  containerId?: string;
  materials?: unknown[];
}
export interface CharacterUpdateSimpleProxyHealth {
  characterId?: string;
  healthPercentage?: number;
}
export interface GroupInvite {
  unknownDword1?: number;
  unknownDword2?: number;
  unknownDword3?: number;
  inviteData :{
  unknownQword1?: string;
  unknownDword1?: number;
  sourceCharacter :{
  characterId?: string;
  identity :{
  unknownDword1?: number;
  unknownDword2?: number;
  unknownDword3?: number;
  characterFirstName?: string;
  characterLastName?: string;
  unknownString1?: string;
  characterName?: string;
  unknownQword1?: string;
};
  unknownByte1?: number;
  unknownString1?: string;
};
  targetCharacter :{
  characterId?: string;
  identity :{
  unknownDword1?: number;
  unknownDword2?: number;
  unknownDword3?: number;
  characterFirstName?: string;
  characterLastName?: string;
  unknownString1?: string;
  characterName?: string;
  unknownQword1?: string;
};
  unknownByte1?: number;
  unknownString1?: string;
};
  unknownDword2?: number;
};
}
export interface GroupJoin {
  unknownDword1?: number;
  unknownDword2?: number;
  joinState?: number;
  unknownDword3?: number;
  inviteData :{
  unknownQword1?: string;
  unknownDword1?: number;
  sourceCharacter :{
  characterId?: string;
  identity :{
  unknownDword1?: number;
  unknownDword2?: number;
  unknownDword3?: number;
  characterFirstName?: string;
  characterLastName?: string;
  unknownString1?: string;
  characterName?: string;
  unknownQword1?: string;
};
  unknownByte1?: number;
  unknownString1?: string;
};
  targetCharacter :{
  characterId?: string;
  identity :{
  unknownDword1?: number;
  unknownDword2?: number;
  unknownDword3?: number;
  characterFirstName?: string;
  characterLastName?: string;
  unknownString1?: string;
  characterName?: string;
  unknownQword1?: string;
};
  unknownByte1?: number;
  unknownString1?: string;
};
  unknownDword2?: number;
};
}
export interface GroupAutoGroup {
  unknownDword1?: number;
  unknownDword2?: number;
  unknownDword3?: number;
  unknownDword4?: number;
  unknownArray1: unknown[];
  unknownArray2: unknown[];
}
export interface GroupLeave {
  unknownDword1?: number;
  unknownDword2?: number;
}
export interface GroupKick {
  unknownDword1?: number;
  unknownDword2?: number;
  unknownDword3?: number;
  unknownDword4?: number;
  characterId?: string;
  unknownByte1?: number;
}
export interface GroupDisband {
  executeType?: number;
  errorType?: number;
}
export interface GroupSetGroupFlags {
  executeType?: number;
  errorType?: number;
  flags?: number;
}
export interface GroupSetGroupOwner {
  unknownDword1?: number;
  unknownDword2?: number;
  characterId?: string;
  groupId?: number;
}
export interface GroupSetGroupDescription {
  unknownDword1?: number;
  unknownDword2?: number;
  description?: string;
}
export interface GroupUnknownA {
  unknownDword1?: number;
  unknownDword2?: number;
  unknownQword1?: string;
  unknownBoolean1?: boolean;
}
export interface GroupMapPingRelated {
  unknownDword1?: number;
  characterId?: string;
  unknownDword2?: number;
  unknownDword3?: number;
}
export interface GroupUnknownC {
  unknownDword1?: number;
  characterId?: string;
  unknownBoolean1?: boolean;
}
export interface GroupGetGroup {
  unknownDword1?: number;
  unknownDword2?: number;
}
export interface GroupUnknownF {
  unknownDword1?: number;
  characterId?: string;
  unknownDword2?: number;
}
export interface GroupJoinLookingForMore {
  unknownDword1?: number;
  unknownDword2?: number;
}
export interface GroupToggleSquadLeaderChat {
  unknownDword1?: number;
  characterId?: string;
  leaveState?: boolean;
}
export interface GroupUnknown12 {
  unknownDword1?: number;
  unknownData1 :{
  groupId?: number;
  characterId?: string;
  unknownByte1?: number;
};
  unknownByte1?: number;
  unknownString1?: string;
  unknownDword2?: number;
  members: unknown[];
  unknownDword3?: number;
}
export interface GroupPlayerJoined {
  unknownDword1?: number;
  unknownDword2?: number;
  joinData :{
  inviteData :{
  characterId?: string;
  identity :{
  unknownDword1?: number;
  unknownDword2?: number;
  unknownDword3?: number;
  characterFirstName?: string;
  characterLastName?: string;
  unknownString1?: string;
  characterName?: string;
  unknownQword1?: string;
};
  unknownByte1?: number;
  unknownString1?: string;
};
  jobData :{
  id?: number;
  unknownDword2?: number;
  iconId?: number;
  backgroundIconId?: number;
  rank?: number;
};
  unknownDword1?: number;
  unknownByte1?: number;
  unknownDword2?: number;
  unknownDword3?: number;
  unknownDword4?: number;
  unknownQword1?: string;
  zoneId?: number;
  position?: Float32Array;
  rotation?: Float32Array;
  unknownQword2?: string;
  unknownDword6?: number;
  memberId?: number;
  playerDistance?: number;
  helmetDurability?: number;
  armorDurability?: number;
};
}
export interface GroupUnknown14 {
  unknownDword1?: number;
  joinData :{
  inviteData :{
  characterId?: string;
  identity :{
  unknownDword1?: number;
  unknownDword2?: number;
  unknownDword3?: number;
  characterFirstName?: string;
  characterLastName?: string;
  unknownString1?: string;
  characterName?: string;
  unknownQword1?: string;
};
  unknownByte1?: number;
  unknownString1?: string;
};
  jobData :{
  id?: number;
  unknownDword2?: number;
  iconId?: number;
  backgroundIconId?: number;
  rank?: number;
};
  unknownDword1?: number;
  unknownByte1?: number;
  unknownDword2?: number;
  unknownDword3?: number;
  unknownDword4?: number;
  unknownQword1?: string;
  zoneId?: number;
  position?: Float32Array;
  rotation?: Float32Array;
  unknownQword2?: string;
  unknownDword6?: number;
  memberId?: number;
  playerDistance?: number;
  helmetDurability?: number;
  armorDurability?: number;
};
}
export interface GroupRemoveGroup {
  unknownDword1?: number;
  unknownDword2?: number;
  groupId?: number;
}
export interface GroupRemoveMember {
  data: unknown;
}
export interface GroupRemoveInvitation {
  unknownDword1?: number;
  unknownDword2?: number;
  inviteData :{
  unknownQword1?: string;
  unknownDword1?: number;
  sourceCharacter :{
  characterId?: string;
  identity :{
  unknownDword1?: number;
  unknownDword2?: number;
  unknownDword3?: number;
  characterFirstName?: string;
  characterLastName?: string;
  unknownString1?: string;
  characterName?: string;
  unknownQword1?: string;
};
  unknownByte1?: number;
  unknownString1?: string;
};
  targetCharacter :{
  characterId?: string;
  identity :{
  unknownDword1?: number;
  unknownDword2?: number;
  unknownDword3?: number;
  characterFirstName?: string;
  characterLastName?: string;
  unknownString1?: string;
  characterName?: string;
  unknownQword1?: string;
};
  unknownByte1?: number;
  unknownString1?: string;
};
  unknownDword2?: number;
};
}
export interface GroupUnknown19 {
  unknownDword1?: number;
  unknownArray1?: unknown[];
}
export interface GroupUnknown1a {
  unknownDword1?: number;
  unknownDword2?: number;
  unknownArray1?: unknown[];
}
export interface GroupRaidCreate {
  unknownDword1?: number;
  unknownDword2?: number;
  unknownDword3?: number;
  inviteData :{
  unknownQword1?: string;
  unknownDword1?: number;
  sourceCharacter :{
  characterId?: string;
  identity :{
  unknownDword1?: number;
  unknownDword2?: number;
  unknownDword3?: number;
  characterFirstName?: string;
  characterLastName?: string;
  unknownString1?: string;
  characterName?: string;
  unknownQword1?: string;
};
  unknownByte1?: number;
  unknownString1?: string;
};
  targetCharacter :{
  characterId?: string;
  identity :{
  unknownDword1?: number;
  unknownDword2?: number;
  unknownDword3?: number;
  characterFirstName?: string;
  characterLastName?: string;
  unknownString1?: string;
  characterName?: string;
  unknownQword1?: string;
};
  unknownByte1?: number;
  unknownString1?: string;
};
  unknownDword2?: number;
};
}
export interface ReferenceDataItemClassDefinitions {
  ITEMCLASS_DEFINITIONS?: unknown[];
}
export interface ReferenceDataItemCategoryDefinitions {
  categories?: unknown[];
}
export interface ReferenceDataProfileDefinitions {
  profiles?: unknown[];
}
export interface ReferenceDataWeaponDefinitions {
  data :{
  definitionsData: unknown;
};
}
export interface ReferenceDataProjectileDefinitions {
  definitionsData: unknown;
}
export interface ReferenceDataDynamicAppearance {
  ITEM_APPEARANCE_DEFINITIONS?: unknown[];
  SHADER_SEMANTIC_DEFINITIONS?: unknown[];
  SHADER_PARAMETER_DEFINITIONS?: unknown[];
}
export interface UiExecuteScript {
  unknownString1?: string;
  unknownArray1?: unknown[];
}
export interface UiWeaponHitFeedback {
  unknownDword1?: number;
  unknownByte1?: number;
  unknownDword2?: number;
}
export interface UiZoneWaypoint {
  unknownBoolean1?: boolean;
  unknownDword1?: number;
}
export interface UiConfirmHit {
  hitType:{
     isAlly?: number,
     isHeadshot?: number,
     damagedArmor?: number,
     crackedArmor?: number,
     bit4?: number,
     bit5?: number,
     bit6?: number,
     bit7?: number,
};
}
export interface RewardAddRewardItem {
  unknownBoolean1?: boolean;
  currency?: unknown[];
  unknownDword1?: number;
  unknownDword2?: number;
  unknownDword3?: number;
  unknownDword4?: number;
  unknownDword5?: number;
  unknownDword6?: number;
  time?: string;
  characterId?: string;
  nameId?: number;
  unknownDword7?: number;
  entries?: unknown[];
  unknownDword8?: number;
  unknownBoolean2?: boolean;
}
export interface RewardAddNonRewardItem {
  itemDefId?: number;
  nameId?: number;
  iconId?: number;
  time4?: number;
  count?: number;
  time6?: number;
}
export interface RecipeAdd {
  recipes?: unknown[];
}
export interface RecipeComponentUpdate {
  unknownDword1?: number;
  unknownDword2?: number;
  unknownQword1?: string;
}
export interface RecipeRemove {
  recipeId?: number;
  bool?: boolean;
}
export interface RecipeDiscovery {
}
export interface RecipeDiscoveries {
  recipes?: unknown[];
  unkArray1?: unknown[];
  unkArray2?: unknown[];
}
export interface RecipeUnk8 {
  unknownQword1?: string;
  unknownDword1?: number;
}
export interface RecipeList {
  recipes?: unknown[];
}
export interface FriendList {
  friends?: unknown[];
}
export interface FriendMessage {
  messageType?: number;
  messageTime?: string;
  messageData1 :{
  unknowndDword1?: number;
  unknowndDword2?: number;
  unknowndDword3?: number;
  characterName?: string;
  unknownString1?: string;
};
  messageData2 :{
  unknowndDword1?: number;
  unknowndDword2?: number;
  unknowndDword3?: number;
  characterName?: string;
  unknownString1?: string;
};
}
export interface ClientPathRequest {
}
export interface ClientPathReply {
  PathProcessingTech?: number;
  unknownDword2?: number;
  nodes?: unknown[];
}
export interface FirstTimeEventUnknown1 {
}
export interface FirstTimeEventState {
  unknownDword1?: number;
  unknownDword2?: number;
  unknownBoolean1?: boolean;
}
export interface FirstTimeEventUnknown2 {
}
export interface FirstTimeEventUnknown3 {
}
export interface FirstTimeEventScript {
  unknownString1?: string;
  unknownArray1?: unknown[];
  unknownDword1?: number;
  unknownBoolean1?: boolean;
}
export interface FirstTimeEventUnknown4 {
  unknownString1?: string;
  unknownArray1?: unknown[];
  unknownDword1?: number;
  unknownBoolean1?: boolean;
}
export interface AchievementAdd {
  achievementId?: number;
  achievementData :{
  objectiveId?: number;
  nameId?: number;
  descriptionId?: number;
  rewardData :{
  unknownBoolean1?: boolean;
  currency?: unknown[];
  unknownDword1?: number;
  unknownDword2?: number;
  unknownDword3?: number;
  unknownDword4?: number;
  unknownDword5?: number;
  unknownDword6?: number;
  time?: string;
  characterId?: string;
  nameId?: number;
  unknownDword7?: number;
  entries?: unknown[];
  unknownDword8?: number;
};
  unknownByte1?: number;
  unknownDword3?: number;
  unknownDword4?: number;
  unknownByte2?: number;
  unknownByte3?: number;
  unknownData1 :{
  unknownDword1?: number;
  unknownDword2?: number;
  unknownDword3?: number;
  unknownDword4?: number;
};
  unknownByte4?: number;
};
}
export interface AchievementInitialize {
  clientAchievements?: unknown[];
  achievementData :{
  achievements?: unknown[];
};
}
export interface MountMountResponse {
  characterId?: string;
  vehicleGuid?: string;
  seatId?: number;
  unknownDword2?: number;
  isDriver?: number;
  debugStuff?: number;
  identity :{
  unknownDword1?: number;
  unknownDword2?: number;
  unknownDword3?: number;
  characterFirstName?: string;
  characterLastName?: string;
  unknownString1?: string;
  characterName?: string;
  unknownQword1?: string;
};
  tagString?: string;
}
export interface MountDismountRequest {
  unknownByte1?: number;
}
export interface MountDismountResponse {
  characterId?: string;
  vehicleGuid?: string;
  debugStuff?: number;
  removePlayerControl?: boolean;
  unknownByte1?: number;
}
export interface MountSeatChangeRequest {
  seatId?: number;
  unknownByte1?: number;
}
export interface MountSeatChangeResponse {
  characterId?: string;
  vehicleGuid?: string;
  identity :{
  unknownDword1?: number;
  unknownDword2?: number;
  unknownDword3?: number;
  characterFirstName?: string;
  characterLastName?: string;
  unknownString1?: string;
  characterName?: string;
  unknownQword1?: string;
};
  seatId?: number;
  unknownDword1?: number;
  unknownDword2?: number;
}
export interface Ping {
}
export interface Pong {
  unknownQword1?: string;
}
export interface VoiceLogin {
  clientName?: string;
  sessionId?: string;
  url?: string;
  characterName?: string;
}
export interface VoiceJoinChannel {
  roomType?: number;
  uri?: string;
  unknown1?: number;
}
export interface VoiceLeaveChannel {
}
export interface VoiceRadioChannel {
  radioType?: number;
  currentChannel?: number;
}
export interface VoiceLeaveRadio {
}
export interface WeaponWeapon {
  weaponPacket: unknown;
}
export interface FacilityReferenceData {
  data: unknown;
}
export interface FacilityFacilityData {
  facilities?: unknown[];
}
export interface FacilitySpawnCollisionChanged {
  unknown1?: number;
  unknown2?: boolean;
  unknown3?: number;
}
export interface SkillSetSkillPointProgress {
  unknown1?: number;
  unknown2?: number;
  unknown3?: number;
}
export interface LoadoutSelectLoadout {
  loadoutId?: number;
}
export interface LoadoutUnk1 {
  characterId?: string;
  loadoutSlotId?: number;
}
export interface LoadoutSetLoadoutSlots {
  characterId?: string;
  loadoutId?: number;
  loadoutData :{
  loadoutSlots?: unknown[];
};
  currentSlotId?: number;
}
export interface LoadoutSetLoadoutSlot {
  characterId?: string;
  loadoutSlot :{
  loadoutId?: number;
  slotId?: number;
  loadoutItemData :{
  itemDefinitionId?: number;
  loadoutItemGuid?: string;
  unknownByte1?: number;
};
  unknownDword1?: number;
};
  currentSlotId?: number;
}
export interface LoadoutSelectSlot {
  unknownDword1?: number;
  slotId?: number;
  unknownDword2?: number;
}
export interface LoadoutCreateCustomLoadout {
  slotId?: number;
  loadoutId?: number;
}
export interface ExperienceSetExperienceRanks {
  experienceRanks?: unknown[];
}
export interface ExperienceSetExperienceRateTier {
  unknownDword1?: number;
  unknownDword2?: number;
  unknownDword3?: number;
  unknownDword4?: number;
  unknownDword5?: number;
}
export interface VehicleOwner {
  guid?: string;
  characterId?: string;
  unknownDword1?: number;
  vehicleId?: number;
  passengers?: unknown[];
}
export interface VehicleOccupy {
  guid?: string;
  characterId?: string;
  vehicleId?: number;
  clearLoadout?: number;
  unknownArray1?: unknown[];
  passengers?: unknown[];
  unknownArray2?: unknown[];
  unknownBytes1 :{
  itemData :{
  itemDefinitionId?: number;
  tintId?: number;
  guid?: string;
  count?: number;
  itemSubData?: unknown;
  containerGuid?: string;
  containerDefinitionId?: number;
  containerSlotId?: number;
  baseDurability?: number;
  currentDurability?: number;
  maxDurabilityFromDefinition?: number;
  unknownBoolean1?: boolean;
  ownerCharacterId?: string;
  effectId?: number;
};
};
  unknownBytes2 :{
  itemData :{
  itemDefinitionId?: number;
  tintId?: number;
  guid?: string;
  count?: number;
  itemSubData?: unknown;
  containerGuid?: string;
  containerDefinitionId?: number;
  containerSlotId?: number;
  baseDurability?: number;
  currentDurability?: number;
  maxDurabilityFromDefinition?: number;
  unknownBoolean1?: boolean;
  ownerCharacterId?: string;
  effectId?: number;
};
};
}
export interface VehicleStateData {
  guid?: string;
  unknownFloat1?: number;
  unknownArray1?: unknown[];
  unknownArray2?: unknown[];
}
export interface VehicleSpawn {
  vehicleId?: number;
  loadoutTab?: number;
}
export interface VehicleUpdateQueuePosition {
  queuePosition?: number;
}
export interface VehicleSetAutoDrive {
  guid?: string;
}
export interface VehicleLoadVehicleDefinitionManager {
  vehicleDefinitions?: unknown[];
}
export interface VehicleAutoMount {
  guid?: string;
  unknownBoolean1?: boolean;
  unknownDword1?: number;
}
export interface VehicleEngine {
  guid1?: string;
  vehicleCharacterId?: string;
  engineOn?: boolean;
}
export interface VehicleAccessType {
  vehicleGuid?: string;
  accessType?: number;
}
export interface VehicleOwnerPassengerList {
  characterId?: string;
  passengers?: unknown[];
}
export interface VehicleExpiration {
  expireTime?: number;
}
export interface VehicleCurrentMoveMode {
  characterId?: string;
  moveMode?: number;
}
export interface VehicleItemDefinitionRequest {
  itemDefinitionId?: number;
}
export interface VehicleInventoryItems {
  characterId?: string;
  itemsData :{
  items?: unknown[];
  unknownDword1?: number;
};
}
export interface ResourceEvent {
  gameTime?: number;
  eventData: unknown;
}
export interface CollisionDamage {
  unknownByte1?: number;
  characterId?: string;
  objectCharacterId?: string;
  unknownDword1?: number;
  damage?: number;
  unknownDword2?: number;
  position?: Float32Array;
  unknownByte2?: number;
}
export interface EquipmentSetCharacterEquipment {
  characterData :{
  profileId?: number;
  characterId?: string;
};
  unknownDword1?: number;
  tintAlias?: string;
  decalAlias?: string;
  equipmentSlots?: unknown[];
  attachmentData?: unknown[];
  unknownBoolean1?: boolean;
}
export interface EquipmentSetCharacterEquipmentSlot {
  characterData :{
  profileId?: number;
  characterId?: string;
};
  equipmentSlot :{
  equipmentSlotId?: number;
  equipmentSlotData :{
  equipmentSlotId?: number;
  guid?: string;
  tintAlias?: string;
  decalAlias?: string;
};
};
  attachmentData :{
  modelName?: string;
  textureAlias?: string;
  tintAlias?: string;
  decalAlias?: string;
  tintId?: number;
  compositeEffectId?: number;
  effectId?: number;
  slotId?: number;
  unknownDword4?: number;
  SHADER_PARAMETER_GROUP?: unknown[];
  unknownBool1?: boolean;
};
}
export interface EquipmentUnsetCharacterEquipmentSlot {
  characterData :{
  profileId?: number;
  characterId?: string;
};
  unknownDword1?: number;
  slotId?: number;
}
export interface EquipmentSetCharacterEquipmentSlots {
  characterData :{
  profileId?: number;
  characterId?: string;
};
  gameTime?: number;
  slots?: unknown[];
  unknownDword1?: number;
  unknownString1?: string;
  unknownString2?: string;
  equipmentSlots?: unknown[];
  attachmentData?: unknown[];
}
export interface DefinitionFilterSetDefinitionVariable {
  unknownDword1?: number;
  unknownQword1?: string;
  unknownData1 :{
  unknownFloat1?: number;
  unknownFloat2?: number;
};
}
export interface DefinitionFilterSetDefinitionIntSet {
  unknownDword1?: number;
  unknownQword1?: string;
  unknownData1?: unknown[];
}
export interface DefinitionFilterUnknownWithVariable1 {
  unknownDword1?: number;
  unknownQword1?: string;
}
export interface DefinitionFilterUnknownWithVariable2 {
  unknownDword1?: number;
  unknownQword1?: string;
}
export interface H1emuPrintToConsole {
  message?: string;
  showConsole?: boolean;
  clearOutput?: boolean;
}
export interface H1emuMessageBox {
  title?: string;
  message?: string;
}
export interface H1emuRequestAssetHashes {
}
export interface H1emuVoiceInit {
  args?: string;
}
export interface H1emuRequestModules {
}
export interface H1emuRequestWindows {
}
export interface H1emuVoiceState {
  message?: string;
}
export interface WallOfDataUIEvent {
  object?: string;
  function?: string;
  argument?: string;
}
export interface WallOfDataClientSystemInfo {
  info?: string;
}
export interface WallOfDataClientTransition {
  oldState?: number;
  newState?: number;
  msElapsed?: number;
}
export interface EffectAddEffect {
  effectData :{
  unknownDword1?: number;
  abilityEffectId1?: number;
  abilityEffectId2?: number;
};
  unknownData2 :{
  unknownQword1?: string;
  unknownQword2?: string;
};
  targetData :{
  unknownQword1?: string;
  targetCharacterId?: string;
  position?: Float32Array;
};
}
export interface EffectUpdateEffect {
  effectData :{
  unknownDword1?: number;
  abilityEffectId1?: number;
  abilityEffectId2?: number;
};
  unknownData2 :{
  unknownDword1?: number;
  unknownQword1?: string;
};
  targetData :{
  unknownQword1?: string;
  targetCharacterId?: string;
  position?: Float32Array;
};
}
export interface EffectRemoveEffect {
  abilityEffectData :{
  unknownDword1?: number;
  abilityEffectId1?: number;
  abilityEffectId2?: number;
};
  targetCharacterData :{
  characterId?: string;
};
  targetCharacterId?: string;
  guid2?: string;
  unknownVector1?: Float32Array;
}
export interface EffectAddEffectTag {
  unknownDword1?: number;
  unknownDword2?: number;
  unknownDword3?: number;
  unknownDword4?: number;
  unknownDword5?: number;
  unknownDword6?: number;
  unknownDword7?: number;
  unknownDword8?: number;
  unknownDword9?: number;
  unknownDword10?: number;
  unknownDword11?: number;
  unknownQword1?: string;
  unknownQword2?: string;
  unknownQword3?: string;
  unknownQword4?: string;
  unknownDword12?: number;
  unknownDword13?: number;
  unknownDword14?: number;
  unknownDword15?: number;
  unknownDword16?: number;
  unknownDword17?: number;
  unknownDword18?: number;
  unknownQword5?: string;
  unknownDword19?: number;
  unknownDword20?: number;
  unknownByte1?: number;
  unknownDword21?: number;
  unknownQword6?: string;
  unknownQword7?: string;
  unknownDword22?: number;
  unknownQword8?: string;
  unknownDword23?: number;
}
export interface EffectRemoveUiIndicators {
  unknownData1 :{
  unknownQword1?: string;
};
  unknownData2 :{
  unknownDword1?: number;
  unknownQword1?: string;
  unknownQword2?: string;
};
}
export interface EffectAddUiIndicator {
  characterId?: string;
  hudElementGuid?: string;
  unknownDword1?: number;
  unknownData1 :{
  hudElementId?: number;
  unknownDword2?: number;
  unknownDword3?: number;
};
  hudElementData :{
  nameId?: number;
  descriptionId?: number;
  imageSetId?: number;
};
  unknownData3 :{
  unknownGuid1?: string;
  unknownDword1?: number;
  unknownGuid2?: string;
};
  unknownData4 :{
  targetCharacterId?: string;
  unknownQword2?: string;
  unknownVector1?: Float32Array;
};
  unknownData5 :{
  unknownDword1?: number;
  unknownDword2?: number;
  unknownDword3?: number;
};
  unknownDword2?: number;
  unknownByte1?: number;
}
export interface AbilitiesInitAbility {
  unknownDword1?: number;
  unknownDword2?: number;
  abilityId?: number;
  unknownDword3?: number;
  characterId?: string;
  unknownDword4?: number;
  unknownDword5?: number;
  unknownDword6?: number;
  targetCharacterId?: string;
  unknownDword7?: number;
  unknownDword8?: number;
  position?: Float32Array;
  abilityData: unknown;
}
export interface AbilitiesUpdateAbility {
  unknownDword1?: number;
  unknownDword2?: number;
  abilityId?: number;
  unknownDword3?: number;
  targetCharacterId?: string;
  unknownDword4?: number;
  unknownDword5?: number;
  position?: Float32Array;
  unknownDword6?: number;
  unknownByte1?: number;
  unknownByte2?: number;
  unknownDword8?: number;
  unknownDword9?: number;
  unknownDword10?: number;
  abilityData: unknown;
}
export interface AbilitiesUninitAbility {
  unknownDword1?: number;
  abilityId?: number;
  unknownDword2?: number;
}
export interface AbilitiesSetActivatableAbilityManager {
  abilities?: unknown[];
}
export interface AbilitiesSetVehicleActivatableAbilityManager {
  abilities?: unknown[];
}
export interface AbilitiesActivateAbility {
  abilityId?: number;
  unknownDword1?: number;
}
export interface AbilitiesDeactivateAbility {
  abilityId?: number;
  unknownDword1?: number;
}
export interface AbilitiesVehicleDeactivateAbility {
  abilityId?: number;
  unknownDword1?: number;
}
export interface AbilitiesActivateAbilityFailed {
  abilityId?: number;
  unknownDword1?: number;
}
export interface AbilitiesClearAbilityLineManager {
}
export interface AbilitiesSetProfileAbilityLineMembers {
  unknownDword1?: number;
}
export interface AbilitiesSetLoadoutAbilities {
  abilities?: unknown[];
}
export interface AbilitiesAddLoadoutAbility {
  abilitySlotId?: number;
  abilityId?: number;
  unknownDword1?: number;
  guid1?: string;
  guid2?: string;
}
export interface AbilitiesAddPersistentAbility {
  unk?: number;
}
export interface AbilitiesSetProfileRankAbilities {
  abilities?: unknown[];
}
export interface MapRegionGlobalData {
  unknown1?: number;
  unknown2?: number;
}
export interface MapRegionData {
  unknown1?: number;
  unknown2?: number;
  regions?: unknown[];
}
export interface MapRegionMapOutOfBounds {
  characterId?: string;
  unknownDword1?: number;
  unknownByte2?: number;
}
export interface MapRegionRequestContinentData {
  zoneId?: number;
}
export interface ItemsSetItemTimerManager {
  unknownArray1?: unknown[];
  unknownArray2?: unknown[];
  unknownArray3?: unknown[];
}
export interface ItemsSetItemTrialLockTimer {
  unknownDword1?: number;
  unknownDword2?: number;
  unknownQword1?: string;
}
export interface ItemsSetAccountItemManager {
  unknowWord2?: number;
}
export interface ItemsSetEscrowAccountItemManager {
  accountItems?: unknown[];
}
export interface ItemsAddEscrowAccountItem {
  itemData :{
  itemId?: string;
  itemDefinitionId?: bigint;
  itemCount?: number;
  itemGuid?: string;
  unknownDword4?: number;
};
}
export interface ItemsRemoveEscrowAccountItem {
  itemId?: string;
  itemDefinitionId?: number;
}
export interface ItemsUpdateEscrowAccountItem {
  itemData :{
  itemId?: string;
  itemDefinitionId?: bigint;
  itemCount?: number;
  itemGuid?: string;
  unknownDword4?: number;
};
}
export interface ItemsAccountItemManagerStateChanged {
  unknownQword1?: string;
  escrowAccountLoadSucceeded?: number;
  escrowAccountAllowTrading?: number;
}
export interface ItemsReportRewardCrateContents {
  winningRewards?: unknown[];
  possibleRewards?: unknown[];
}
export interface ItemsSetSkinItem {
  unknownDword1?: number;
  itemDefinitionId?: number;
  unknownQword1?: string;
  unknownDword3?: number;
  unknownByte1?: number;
}
export interface ItemsRequestUseItem {
  itemCount?: number;
  unknownDword1?: number;
  itemUseOption?: number;
  characterId?: string;
  targetCharacterId?: string;
  sourceCharacterId?: string;
  itemGuid?: string;
  itemSubData?: unknown;
}
export interface ItemsRequestUseAccountItem {
  itemCount?: number;
  unknownDword2?: number;
  unknownDword3?: number;
  itemDefinitionId?: number;
  itemSubData?: unknown;
}
export interface CurrencySetCurrencyDiscount {
  currencyId?: number;
  discount?: number;
}
export interface ZoneSettingData {
  settings?: unknown[];
}
export interface WordFilterData {
  wordFilterData: unknown;
}
export interface StaticFacilityInfoAllZones {
  facilities?: unknown[];
}
export interface OperationClientClearMissions {
}
export interface WordFilterData {
  wordFilterData: unknown;
}
export interface LocksShowMenu {
  characterId?: string;
  unknownDword1?: number;
  lockType?: number;
  objectCharacterId?: string;
}
export interface CharacterStateInteractionStart {
  characterId?: string;
  time?: number;
  unknownDword2?: number;
  unknownQword1?: string;
  unknownQword2?: string;
  unknownDword3?: number;
  stringId?: number;
  animationId?: number;
  unknownDword6?: number;
  unknownDword7?: number;
  unknownDword8?: number;
  unknownDword9?: number;
  UseOptionItemId?: string;
  useOptionString?: string;
}
export interface CharacterStateInteractionStop {
  characterId?: string;
}
export interface AudioSetState {
  unknownString1?: string;
  unknownString2?: string;
}
export interface AudioSetSwitch {
  characterId?: string;
  unknownString1?: string;
  unknownString2?: string;
}
export interface AudioPostEvent {
  unknownString1?: string;
}
export interface NpcFoundationPermissionsManagerAddPermission {
  objectCharacterId?: string;
  characterName?: string;
  unk?: string;
  permissionSlot?: number;
}
export interface NpcFoundationPermissionsManagerEditPermission {
  objectCharacterId?: string;
  unk?: string;
  characterName?: string;
  permissionSlot?: number;
}
export interface NpcFoundationPermissionsManagerBaseShowPermissions {
  characterId?: string;
  characterId2?: string;
  permissions?: unknown[];
}
export interface ReplicationNpcComponent {
  transientId: unknown;
  stringLength?: number;
  componentName?: string;
  componentName2?: string;
  componentName3?: number;
  unkByte1?: number;
  unkDword1?: number;
  unkDword2?: number;
  unkDword3?: number;
  unkDword4?: number;
  unkByte2?: number;
  unkDword5?: number;
  unkDword6?: number;
  unkDword7?: number;
  unkDword8?: number;
  nameId?: number;
  rawComponent?: unknown;
}
export interface VehicleSkinSetVehicleSkinManager {
  vehicleId?: string;
  characterId?: string;
  shaderGroupId?: number;
}
export interface AnimationRequest {
  animationId?: number;
}
export interface AnimationBase {
  characterId?: string;
  animationId?: number;
}
export interface ChatChat {
  unknownWord1?: number;
  channel?: number;
  characterId1?: string;
  characterId2?: string;
  identity1 :{
  unknownDword1?: number;
  unknownDword2?: number;
  unknownDword3?: number;
  characterFirstName?: string;
  characterLastName?: string;
  unknownString1?: string;
  characterName?: string;
  unknownQword1?: string;
};
  identity2 :{
  unknownDword1?: number;
  unknownDword2?: number;
  unknownDword3?: number;
  characterFirstName?: string;
  characterLastName?: string;
  unknownString1?: string;
  characterName?: string;
  unknownQword1?: string;
};
  message?: string;
  position?: Float32Array;
  unknownGuid1?: string;
  unknownDword1?: number;
  color1?: number;
  color2?: number;
  unknownByte1?: number;
  unknownBoolean1?: boolean;
}
export interface ChatChatText {
  message?: string;
  unknownDword1?: number;
  color: unknown[];
  unknownDword2?: number;
  unknownByte3?: number;
  unknownByte4?: number;
}
export interface CommandPlaySoundAtLocation {
  unknownString1?: string;
  unknownDword1?: number;
  unknownDword2?: number;
  unknownDword3?: number;
}
export interface CommandInteractRequest {
  characterId?: string;
  entityPosition?: Float32Array;
  isInstant?: boolean;
}
export interface CommandInteractCancel {
}
export interface CommandInteractDebug {
}
export interface CommandInteractionList {
  guid?: string;
  unknownBoolean1?: boolean;
  unknownArray1?: unknown[];
  unknownString1?: string;
  unknownBoolean2?: boolean;
  unknownArray2?: unknown[];
  unknownBoolean3?: boolean;
}
export interface CommandInteractionSelect {
  guid?: string;
  interactionId?: number;
}
export interface CommandSetProfile {
  profileId?: number;
  tab?: number;
}
export interface CommandPlayerSelect {
  characterId?: string;
  guid?: string;
}
export interface CommandFreeInteractionNpc {
}
export interface CommandRecipeStart {
  recipeId?: number;
  count?: number;
}
export interface CommandPlayDialogEffect {
  characterId?: string;
  effectId?: number;
}
export interface CommandPlaySoundIdOnTarget {
  soundId?: number;
  targetData: unknown;
}
export interface CommandInteractionString {
  guid?: string;
  stringId?: number;
  unknown4?: number;
}
export interface CommandAddWorldCommand {
  command?: string;
}
export interface CommandAddZoneCommand {
  command?: string;
}
export interface CommandExecuteCommand {
  commandHash?: number;
  arguments?: string;
}
export interface CommandZoneExecuteCommand {
  commandHash?: number;
  arguments?: string;
}
export interface CommandItemDefinitionRequest {
  ID?: number;
}
export interface CommandItemDefinitionReply {
  data :{
  ID?: number;
  definitionData?: unknown;
};
}
export interface CommandItemDefinitions {
  data :{
  itemDefinitions: unknown[];
};
}
export interface CommandEnableCompositeEffects {
  enabled?: boolean;
}
export interface CommandRequestWeaponFireStateUpdate {
  characterId?: string;
}
export interface CommandDeliveryDisplayInfo {
  unknownDword1?: number;
  unknownArray1: unknown[];
}
export interface CommandDeliveryManagerStatus {
  color?: number;
  status?: number;
  unkString?: string;
}
export interface CommandReportLastDeath {
}
export interface CommandPointAndReport {
  rotation?: Float32Array;
  unknownDword1?: number;
  reportedCharacterId?: string;
}
export interface CommandSpawnVehicle {
  vehicleId?: number;
  factionId?: number;
  position?: Float32Array;
  heading?: number;
  unknownDword1?: number;
  autoMount?: boolean;
}
export interface CommandRunSpeed {
  runSpeed?: number;
}
export interface CommandAddItem {
  itemId?: number;
  stackCount?: number;
  imageSetId?: number;
  imageTintValue?: number;
  NameId?: number;
  DescriptionId?: number;
}
export interface ClientUpdateItemAdd {
  characterId?: string;
  data :{
  itemDefinitionId?: number;
  tintId?: number;
  guid?: string;
  count?: number;
  itemSubData?: unknown;
  containerGuid?: string;
  containerDefinitionId?: number;
  containerSlotId?: number;
  baseDurability?: number;
  currentDurability?: number;
  maxDurabilityFromDefinition?: number;
  unknownBoolean1?: boolean;
  ownerCharacterId?: string;
  effectId?: number;
  weaponData?: unknown;
};
}
export interface ClientUpdateItemUpdate {
  characterId?: string;
  data :{
  itemDefinitionId?: number;
  tintId?: number;
  guid?: string;
  count?: number;
  itemSubData?: unknown;
  containerGuid?: string;
  containerDefinitionId?: number;
  containerSlotId?: number;
  baseDurability?: number;
  currentDurability?: number;
  maxDurabilityFromDefinition?: number;
  unknownBoolean1?: boolean;
  ownerCharacterId?: string;
  effectId?: number;
};
}
export interface ClientUpdateItemDelete {
  characterId?: string;
  itemGuid?: string;
}
export interface ClientUpdateUpdateStat {
  statId?: number;
  statValue: unknown;
}
export interface ClientUpdateUpdateLocation {
  position?: Float32Array;
  rotation?: Float32Array;
  unknownBoolean1?: boolean;
  unknownByte1?: number;
  triggerLoadingScreen?: boolean;
}
export interface ClientUpdateActivateProfile {
  profileData :{
  profileId?: number;
  nameId?: number;
  descriptionId?: number;
  type?: number;
  unknownDword1?: number;
  abilityBgImageSet?: number;
  badgeImageSet?: number;
  buttonImageSet?: number;
  unknownByte1?: number;
  unknownByte2?: number;
  unknownDword4?: number;
  unknownArray1?: unknown[];
  unknownDword5?: number;
  unknownDword6?: number;
  unknownByte3?: number;
  unknownDword7?: number;
  unknownDword8?: number;
  unknownDword9?: number;
  unknownDword10?: number;
  unknownDword11?: number;
  unknownDword12?: number;
  unknownDword13?: number;
  unknownDword14?: number;
  unknownDword15?: number;
  unknownDword16?: number;
};
  attachmentData?: unknown[];
  unknownDword1?: number;
  unknownDword2?: number;
  actorModelId?: number;
  tintAlias?: string;
  decalAlias?: string;
}
export interface ClientUpdateDoneSendingPreloadCharacters {
  done?: boolean;
}
export interface ClientUpdateDamageInfo {
  unknownDword1?: number;
  transientId?: unknown;
  unknownDword2?: number;
  orientationToSource?: number;
  unknownDword4?: number;
  unknownBoolean2?: boolean;
  unknownBoolean3?: boolean;
  unknownDword5?: number;
  unknownDword6?: number;
}
export interface ClientUpdateRespawnLocations {
  unknownFlags?: number;
  locations?: unknown[];
  unknownDword1?: number;
  unknownDword2?: number;
  locations2?: unknown[];
}
export interface ClientUpdateModifyMovementSpeed {
  speed?: number;
  movementVersion?: number;
}
export interface ClientUpdateModifyTurnRate {
  speed?: number;
  movementVersion?: number;
}
export interface ClientUpdateModifyStrafeSpeed {
  speed?: number;
  movementVersion?: number;
}
export interface ClientUpdateUpdateManagedLocation {
  characterId?: string;
  position?: Float32Array;
  rotation?: Float32Array;
  unknownBoolean1?: boolean;
  unknownByte1?: number;
}
export interface ClientUpdateManagedMovementVersion {
  version: unknown;
}
export interface ClientUpdateUpdateWeaponAddClips {
  unknownDword1?: number;
  unknownByte1?: number;
  unknownFloat1?: number;
}
export interface ClientUpdateStartTimer {
  stringId?: number;
  time?: number;
  message?: string;
}
export interface ClientUpdateCompleteLogoutProcess {
}
export interface ClientUpdateProximateItems {
  items?: unknown[];
}
export interface ClientUpdateTextAlert {
  message?: string;
}
export interface ClientUpdateNetworkProximityUpdatesComplete {
}
export interface ClientUpdateDeathMetrics {
  recipesDiscovered?: number;
  playersKilled?: number;
  wildlifeKilled?: number;
  zombiesKilled?: number;
  vehiclesDestroyed?: number;
  minutesSurvived?: number;
  position?: Float32Array;
  lastDamageAmount?: number;
  killedByHeadshot?: boolean;
}
export interface ClientUpdateManagedObjectResponseControl {
  control?: boolean;
  objectCharacterId?: string;
}
export interface ClientUpdateNpcRelevance {
  unknownByte1?: number;
  npcs?: unknown[];
}
export interface ClientUpdateMonitorTimeDrift {
  timeDrift: number;
}
export interface ClientUpdateUpdateRewardAndGrinderState {
  unknownBoolean1?: boolean;
  unknownBoolean2?: boolean;
}
export interface ClientUpdateUpdateLockoutTimes {
  unk?: unknown[];
  bool?: boolean;
}
export interface ClientUpdateZoneStatus {
  status?: number;
}
export interface InGamePurchasePreviewOrderResponse {
  unknownDword1?: number;
  unknownDword2?: number;
  unknownDword3?: number;
  unknownDword4?: number;
}
export interface InGamePurchasePlaceOrderResponse {
  unknownDword1?: number;
  unknownDword2?: number;
  unknownString1?: string;
  unknownDword3?: number;
  unknownDword4?: number;
}
export interface InGamePurchaseStoreBundles {
  unknownDword1?: number;
  unknownDword2?: number;
  storeId?: number;
  unknownDword3?: number;
  unknownDword4?: number;
  imageData :{
  imageSetId?: string;
  imageTintValue?: string;
};
  storeBundles?: unknown[];
}
export interface InGamePurchaseStoreBundleCategoryGroups {
  categoryGroups?: unknown[];
}
export interface InGamePurchaseStoreBundleCategories {
  categories?: unknown[];
  unknownBoolean1?: boolean;
}
export interface InGamePurchaseExclusivePartnerStoreBundles {
  storeBundles?: unknown[];
}
export interface InGamePurchaseStoreBundleGroups {
  bundleGroups?: unknown[];
}
export interface InGamePurchaseWalletInfoResponse {
  unknownDword1?: number;
  unknownBoolean1?: boolean;
  unknownDword2?: number;
  unknownDword3?: number;
  unknownString1?: string;
  unknownString2?: string;
  unknownBoolean2?: boolean;
  unknownArray1?: unknown[];
}
export interface InGamePurchaseStationCashProductsResponse {
  unknownDword1?: number;
  products?: unknown[];
}
export interface InGamePurchaseStateCodesResponse {
  unknownDword1?: number;
  stateCodes?: unknown[];
}
export interface InGamePurchaseCountryCodesResponse {
  unknownDword1?: number;
  countryCodes?: unknown[];
}
export interface InGamePurchaseSubscriptionProductsResponse {
  unknownDword1?: number;
  products?: unknown[];
}
export interface InGamePurchaseEnableMarketplace {
  unknownBoolean1?: boolean;
  unknownBoolean2?: boolean;
}
export interface InGamePurchaseAcccountInfoRequest {
  locale?: string;
}
export interface InGamePurchaseAcccountInfoResponse {
  unknownDword1?: number;
  locale?: string;
  currency?: string;
  unknownBoolean1?: boolean;
}
export interface InGamePurchaseStoreBundleContentRequest {
  bundles?: unknown[];
}
export interface InGamePurchaseStoreBundleContentResponse {
  bundles?: unknown[];
}
export interface InGamePurchaseClientStatistics {
  unknownByte1?: number;
  unknownDword1?: number;
  unknownDword2?: number;
  unknownDword3?: number;
  unknownDword4?: number;
  unknownDword5?: number;
  unknownDword6?: number;
  unknownDword7?: number;
  unknownDword8?: number;
  unknownDword9?: number;
  unknownDword10?: number;
  unknownDword11?: number;
  unknownDword12?: number;
  unknownDword13?: number;
  unknownDword14?: number;
  unknownDword15?: number;
  unknownDword16?: number;
  unknownDword17?: number;
  unknownDword18?: number;
  unknownDword19?: number;
  unknownDword20?: number;
  unknownDword21?: number;
  unknownDword22?: number;
  unknownDword23?: number;
  unknownDword24?: number;
  unknownDword25?: number;
}
export interface InGamePurchaseDisplayMannequinStoreBundles {
  unknownDword1?: number;
  unknownArray1?: unknown[];
}
export interface InGamePurchaseItemOfTheDay {
  unknownDword1?: number;
  unknownDword2?: number;
  unknownDword3?: number;
  unknownDword4?: number;
  unknownDword5?: number;
  unknownDword6?: number;
  unknownDword7?: number;
  unknownDword8?: number;
  unknownDword9?: number;
  unknownDword10?: number;
  unknownDword11?: number;
  unknownDword12?: number;
  appStoreBundle :{
  storeBundle :{
  marketingBundle :{
  bundleId?: number;
  nameId?: number;
  descriptionId?: number;
  unknownDword4?: number;
  imageData :{
  imageSetId?: string;
  imageTintValue?: string;
};
  unknownBoolean1?: boolean;
  unknownString1?: string;
  stationCurrencyId?: number;
  price?: number;
  currencyId?: number;
  currencyPrice?: number;
  unknownDword9?: number;
  unknownTime1?: string;
  unknownTime2?: string;
  unknownDword10?: number;
  unknownBoolean2?: boolean;
  itemListDetails?: unknown[];
  unknownArray2?: unknown[];
};
  storeId?: number;
  categoryId?: number;
  unknownBoolean1?: boolean;
  unknownDword3?: number;
  unknownDword4?: number;
  unknownDword5?: number;
  unknownDword6?: number;
  unknownDword7?: number;
  unknownDword8?: number;
  unknownDword9?: number;
  unknownDword10?: number;
  unknownBoolean2?: boolean;
  unknownBoolean3?: boolean;
  unknownBoolean4?: boolean;
};
  unknownDword1?: number;
  unknownDword2?: number;
  unknownDword3?: number;
  unknownDword4?: number;
  unknownDword5?: number;
  unknownDword6?: number;
  unknownString1?: string;
  unknownDword7?: number;
  unknownDword8?: number;
  unknownDword9?: number;
  memberSalePrice?: number;
  unknownDword11?: number;
  unknownQword3?: string;
  unknownString2?: string;
  unknownDword12?: number;
  unknownDword13?: number;
};
  unknownBoolean1?: boolean;
}
export interface InGamePurchaseEnablePaymentSources {
  unknownBoolean1?: boolean;
  unknownBoolean2?: boolean;
}
export interface InGamePurchaseSetMembershipFreeItemInfo {
  unknownDword1?: number;
  unknownDword2?: number;
}
export interface InGamePurchaseGiftOrderNotification {
  unknownQword1?: string;
  unknownString1?: string;
  unknownString2?: string;
  unknownString3?: string;
  unknownDword1?: number;
}
export interface InGamePurchaseActiveSchedules {
  unknownArray1?: unknown[];
  unknownString1?: string;
  unknownArray3?: unknown[];
}
export interface InGamePurchaseNudgeOfferNotification {
  unknownDword1?: number;
  unknownDword2?: number;
  unknownDword3?: number;
  unknownDword4?: number;
  unknownDword5?: number;
  unknownDword6?: number;
  unknownDword7?: number;
}
export interface InGamePurchaseSpiceWebAuthUrlResponse {
  codeStringMappingId?: string;
  url?: string;
}
export interface InGamePurchaseBundlePriceUpdate {
  unknownArray1?: unknown[];
}
export interface InGamePurchaseWalletBalanceUpdate {
  totalCoinsCount?: number;
}
export interface InGamePurchaseMemberFreeItemCount {
  unknownDword1?: number;
}
export interface QuickChatSendData {
  commands?: unknown[];
}
export interface LobbyGameDefinitionDefinitionsRequest {
}
export interface LobbyGameDefinitionDefinitionsResponse {
  definitionsData :{
  data?: string;
};
}
export interface CoinStoreItemList {
  items?: unknown[];
  unknown1?: number;
}
export interface CoinStoreSellToClientRequest {
  unknown1?: number;
  unknown2?: number;
  itemId?: number;
  unknown4?: number;
  quantity?: number;
  unknown6?: number;
}
export interface CoinStoreTransactionComplete {
  unknown1?: number;
  unknown2?: number;
  unknown3?: number;
  unknown4?: number;
  unknown5?: number;
  unknown6?: number;
  unknown7?: number;
  unknown8?: number;
  timestamp?: number;
  unknown9?: number;
  itemId?: number;
  unknown10?: number;
  quantity?: number;
  unknown11?: number;
  unknown12?: number;
}
export interface ProfileStatsGetPlayerProfileStats {
  characterId?: string;
}
export interface H1emuFairPlay {
  name?: string;
  data1?: string;
  data2?: string;
  data3?: string;
}
export interface H1emuHeartBeat {
  data?: string;
  name?: string;
  data2?: string;
  data3?: string;
  data4?: string;
  data5?: string;
}
export interface ItemsAddAccountItem {
  itemId?: string;
  unknowWord2?: number;
  unknowWord3?: number;
  unknowWord4?: number;
}
export interface DtoHitReportPacket {
}
export interface DtoStateChange {
  objectId: number;
  modelName: string;
  effectId: number;
  unk3?: number;
  unk4: boolean;
  unkDword1?: number;
  unk5?: boolean;
  unk6?: boolean;
  unk7?: boolean;
  unk8?: boolean;
}
export interface DtoObjectInitialData {
  unknownDword1: number;
  unknownArray1?: unknown[];
  unknownArray2?: unknown[];
}
export interface DtoHitSpeedTreeReport {
  id: number;
  treeId: number;
  name: string;
}
export interface ContainerMoveItem {
  containerGuid?: string;
  characterId?: string;
  itemGuid?: string;
  targetCharacterId?: string;
  count?: number;
  newSlotId?: number;
}
export interface ContainerInitEquippedContainers {
  ignore?: string;
  characterId?: string;
  containers?: unknown[];
}
export interface ContainerError {
  characterId?: string;
  containerError?: number;
}
export interface ContainerListAll {
  characterId?: string;
  containers?: unknown[];
  array1?: unknown[];
  unknownDword1?: number;
}
export interface ContainerUpdateEquippedContainer {
  ignore?: string;
  characterId?: string;
  containerData :{
  guid?: string;
  definitionId?: number;
  associatedCharacterId?: string;
  slots?: number;
  items?: unknown[];
  showBulk?: boolean;
  maxBulk?: number;
  unknownDword1?: number;
  bulkUsed?: number;
  hasBulkLimit?: boolean;
};
}
export interface ConstructionPlacementRequest {
  itemDefinitionId?: number;
}
export interface ConstructionPlacementResponse {
  itemDefinitionId?: number;
  model?: number;
}
export interface ConstructionPlacementFinalizeRequest {
  itemDefinitionId?: number;
  position?: Float32Array;
  scale?: Float32Array;
  parentObjectCharacterId?: string;
  BuildingSlot?: string;
  unkByte1?: number;
  unk1?: number;
  rotation1?: Float32Array;
  rotation2?: Float32Array;
  rotation3?: Float32Array;
  unk6?: number;
  position2?: Float32Array;
}
export interface ConstructionPlacementFinalizeResponse {
  status?: boolean;
  unknownString1?: string;
}
export interface ConstructionUnknown {
  unknownArray1?: unknown[];
  unknownArray2?: unknown[];
}
export interface LocksSetLock {
  unknownDword1?: number;
  unknownDword2?: number;
  password?: number;
}
export interface RagdollStart {
  characterId?: string;
}
export interface RagdollUpdatePose {
  characterId?: string;
  positionUpdate: unknown;
}
export interface RagdollUnk2 {
  characterId?: string;
  unk1?: number;
  unkArray1?: unknown[];
  positionUpdate: unknown;
}
export interface RagdollUnk {
  characterId?: string;
  unk1?: number;
  unkArray1?: unknown[];
  unk2?: number;
  unkArray2?: unknown[];
}
export interface RagdollStop {
  characterId?: string;
  position?: Float32Array;
  rotation?: Float32Array;
}
export interface GameModeUpdateToxicGas {
  position?: Float32Array;
  radius?: number;
  unknownDword3?: number;
  unknownDword4?: number;
}
export interface GameModeUpdateSafeZone {
  position?: Float32Array;
  radius?: number;
}
export interface GameModeDeathInfo {
  endingPositionIndex?: number;
  endsInDraw?: boolean;
  playerName?: string;
  remainingHealth?: number;
  weapon?: number;
  unknownDword4?: number;
}
export interface GameModeStartLogout {
  unknownBoolean1?: boolean;
}
export interface GameModeUnk9 {
  unknownDword1?: number;
}
export interface GameModeUnk10 {
  unknownDword1?: number;
  unknownDword2?: number;
}
export interface GameModeUnk11 {
  unknownBoolean1?: boolean;
}
export interface GameModeUnk13 {
  unknownArray1?: unknown[];
}
export interface GameModeUnk15 {
  unknownDword1?: number;
  unknownDword2?: number;
  unknownDword3?: number;
  unknownString1?: string;
}
export interface GameModeUnk16 {
  unknownDword1?: number;
  unknownDword2?: number;
}
export interface GameModeUnk18 {
  unknownDword1?: number;
}
export interface GameModeUnk19 {
  unknownBoolean1?: boolean;
}
export interface GameModeUnk20 {
  unknownString1?: string;
  unknownString2?: string;
  unknownDword1?: number;
}
export interface GameModeUnk21 {
  unknownBoolean1?: boolean;
}
export interface GameModeStartMatch {
  remainingSeconds?: number;
}
export interface GameModeUnk23 {
  unknownBoolean1?: boolean;
}
export interface GameModeShowVictoryScreen {
  unknownDword1?: number;
}
export interface GrinderExchangeRequest {
  items?: unknown[];
}
export interface GrinderExchangeResponse {
  items?: unknown[];
}
export interface ScreenEffectApplyScreenEffect {
  unknownDword1?: number;
  effectId?: number;
  unknownDword3?: number;
  duration?: number;
  unknownDword5?: number;
  screenBrightness?: number;
  unknownDword7?: number;
  string1?: string;
  unknownDword8?: number;
  string2?: string;
  unknownDword9?: number;
  colorGradingFilename?: string;
  colorGrading?: number;
  unknownDword11?: number;
  unknownDword12?: number;
  screenCover?: number;
  transparency?: number;
  color?: number;
  unknownDword16?: number;
  unknownDword17?: number;
  unknownDword18?: number;
  unknownDword19?: number;
  unknownDword20?: number;
  unknownDword21?: number;
}
export interface ScreenEffectRemoveScreenEffect {
  unknownDword1?: number;
  effectId?: number;
  unknownDword3?: number;
}
export interface SpectatorEnable {
}
export interface SpectatorUnknown2 {
  unknownDword1?: number;
  unknownArray1?: unknown[];
  unknownArray2?: unknown[];
}
export interface SpectatorUnknown3 {
}
export interface SpectatorTeleport {
  x?: number;
  y?: number;
}
export interface SpectatorUnknown5 {
  unknownArray1?: unknown[];
}
export interface SpectatorSetUnknownFlag1 {
}
export interface SpectatorSetUnknownFlag2 {
}
export interface SpectatorMatchResults {
  unknownQword1?: string;
  unknownString1?: string;
  unknownDword1?: number;
}
export interface SpectatorUnknown12 {
  unknownQword1?: string;
}
export interface SynchronizedTeleportWaitingForPlayers {
  unknownBoolean1?: boolean;
}
export interface SynchronizedTeleportUnk2 {
}
export interface SynchronizedTeleportStartingMatch {
  cooldown?: number;
  unknownBoolean1?: boolean;
}
export interface SynchronizedTeleportCountdown {
  unknownBoolean1?: boolean;
}
export interface AccessedCharacterBeginCharacterAccess {
  objectCharacterId?: string;
  mutatorCharacterId?: string;
  dontOpenInventory?: boolean;
  itemsData :{
  items?: unknown[];
  unknownDword1?: number;
};
}
export interface AccessedCharacterEndCharacterAccess {
  characterId?: string;
}
export interface AccessedCharacterUpdateMutatorRights {
  characterId?: string;
  mutatorCharacterId?: string;
}
export interface AccessedCharacterUnknown3 {
}
export interface AccessedCharacterUnknown2 {
  characterId?: string;
  itemsData :{
  items?: unknown[];
  unknownDword1?: number;
};
}
export interface ShaderParameterOverrideBase {
  characterId?: string;
  itemDefinitionId?: number;
  slotId?: number;
  unknownDword2?: number;
  shaderGroupId?: number;
}
export type zone2016packets = ClientFinishedLoading | SendSelfToClient | ClientIsReady | ZoneDoneSendingInitialData | ClientBeginZoning | ProjectileDebug | SendZoneDetails | GameTimeSync | UpdateClientSessionData | WorldDisplayInfo | SetLocale | WorldShutdownNotice | KeepAlive | ClientExitLaunchUrl | MembershipActivation | ShowSystemMessage | POIChangeMessage | ClientLog | CommerceSessionResponse | LoginFailed | NpcCollision | ClientGameSettings | PlayerTitle | InitializationParameters | ClientInitializationDetails | PlayerUpdatePosition | Synchronization | PlayerUpdateManagedPosition | AddSimpleNpc | ContinentBattleInfo | GetContinentBattleInfo | SendSecurityPacketAndSelfDestruct | GetRespawnLocations | Security | ServerPopulationInfo | GetServerPopulationInfo | VehicleCollision | PlayerStop | ClientSettings | RewardBuffInfo | GetRewardBuffInfo | CharacterSelectSessionResponse | UpdateWeatherData | AddLightweightPc | AddLightweightNpc | AddLightweightVehicle | AddProxiedObject | LightweightToFullPc | LightweightToFullNpc | LightweightToFullVehicle | ReplicationInteractionComponent | FairPlayInternal | CharacterRemovePlayer | CharacterPlayAnimation | CharacterUpdateScale | CharacterUpdateCharacterState | CharacterAddEffectTagCompositeEffect | CharacterRemoveEffectTagCompositeEffect | CharacterReplaceBaseModel | CharacterWeaponStance | CharacterUpdateTintAlias | CharacterMoveOnRail | CharacterClearMovementRail | CharacterMoveOnRelativeRail | CharacterDestroyed | CharacterSeekTarget | CharacterSeekTargetUpdate | CharacterUpdateActiveWieldType | CharacterKnockedOut | CharacterKnockedOutDamageReport | CharacterRespawn | CharacterRespawnReply | CharacterJet | CharacterSetFaction | CharacterSetBattleRank | CharacterManagedObject | CharacterCharacterStateDelta | CharacterPlayWorldCompositeEffect | CharacterFullCharacterDataRequest | CharacterKilledBy | CharacterMotorRunning | CharacterDroppedItemNotification | CharacterNoSpaceNotification | CharacterStartMultiStateDeath | CharacterDoorState | CharacterSetAllowRespawn | CharacterMovementVersion | CharacterDailyRepairMaterials | CharacterUpdateSimpleProxyHealth | GroupInvite | GroupJoin | GroupAutoGroup | GroupLeave | GroupKick | GroupDisband | GroupSetGroupFlags | GroupSetGroupOwner | GroupSetGroupDescription | GroupUnknownA | GroupMapPingRelated | GroupUnknownC | GroupGetGroup | GroupUnknownF | GroupJoinLookingForMore | GroupToggleSquadLeaderChat | GroupUnknown12 | GroupPlayerJoined | GroupUnknown14 | GroupRemoveGroup | GroupRemoveMember | GroupRemoveInvitation | GroupUnknown19 | GroupUnknown1a | GroupRaidCreate | ReferenceDataItemClassDefinitions | ReferenceDataItemCategoryDefinitions | ReferenceDataProfileDefinitions | ReferenceDataWeaponDefinitions | ReferenceDataProjectileDefinitions | ReferenceDataDynamicAppearance | UiExecuteScript | UiWeaponHitFeedback | UiZoneWaypoint | UiConfirmHit | RewardAddRewardItem | RewardAddNonRewardItem | RecipeAdd | RecipeComponentUpdate | RecipeRemove | RecipeDiscovery | RecipeDiscoveries | RecipeUnk8 | RecipeList | FriendList | FriendMessage | ClientPathRequest | ClientPathReply | FirstTimeEventUnknown1 | FirstTimeEventState | FirstTimeEventUnknown2 | FirstTimeEventUnknown3 | FirstTimeEventScript | FirstTimeEventUnknown4 | AchievementAdd | AchievementInitialize | MountMountResponse | MountDismountRequest | MountDismountResponse | MountSeatChangeRequest | MountSeatChangeResponse | Ping | Pong | VoiceLogin | VoiceJoinChannel | VoiceLeaveChannel | VoiceRadioChannel | VoiceLeaveRadio | WeaponWeapon | FacilityReferenceData | FacilityFacilityData | FacilitySpawnCollisionChanged | SkillSetSkillPointProgress | LoadoutSelectLoadout | LoadoutUnk1 | LoadoutSetLoadoutSlots | LoadoutSetLoadoutSlot | LoadoutSelectSlot | LoadoutCreateCustomLoadout | ExperienceSetExperienceRanks | ExperienceSetExperienceRateTier | VehicleOwner | VehicleOccupy | VehicleStateData | VehicleSpawn | VehicleUpdateQueuePosition | VehicleSetAutoDrive | VehicleLoadVehicleDefinitionManager | VehicleAutoMount | VehicleEngine | VehicleAccessType | VehicleOwnerPassengerList | VehicleExpiration | VehicleCurrentMoveMode | VehicleItemDefinitionRequest | VehicleInventoryItems | ResourceEvent | CollisionDamage | EquipmentSetCharacterEquipment | EquipmentSetCharacterEquipmentSlot | EquipmentUnsetCharacterEquipmentSlot | EquipmentSetCharacterEquipmentSlots | DefinitionFilterSetDefinitionVariable | DefinitionFilterSetDefinitionIntSet | DefinitionFilterUnknownWithVariable1 | DefinitionFilterUnknownWithVariable2 | H1emuPrintToConsole | H1emuMessageBox | H1emuRequestAssetHashes | H1emuVoiceInit | H1emuRequestModules | H1emuRequestWindows | H1emuVoiceState | WallOfDataUIEvent | WallOfDataClientSystemInfo | WallOfDataClientTransition | EffectAddEffect | EffectUpdateEffect | EffectRemoveEffect | EffectAddEffectTag | EffectRemoveUiIndicators | EffectAddUiIndicator | AbilitiesInitAbility | AbilitiesUpdateAbility | AbilitiesUninitAbility | AbilitiesSetActivatableAbilityManager | AbilitiesSetVehicleActivatableAbilityManager | AbilitiesActivateAbility | AbilitiesDeactivateAbility | AbilitiesVehicleDeactivateAbility | AbilitiesActivateAbilityFailed | AbilitiesClearAbilityLineManager | AbilitiesSetProfileAbilityLineMembers | AbilitiesSetLoadoutAbilities | AbilitiesAddLoadoutAbility | AbilitiesAddPersistentAbility | AbilitiesSetProfileRankAbilities | MapRegionGlobalData | MapRegionData | MapRegionMapOutOfBounds | MapRegionRequestContinentData | ItemsSetItemTimerManager | ItemsSetItemTrialLockTimer | ItemsSetAccountItemManager | ItemsSetEscrowAccountItemManager | ItemsAddEscrowAccountItem | ItemsRemoveEscrowAccountItem | ItemsUpdateEscrowAccountItem | ItemsAccountItemManagerStateChanged | ItemsReportRewardCrateContents | ItemsSetSkinItem | ItemsRequestUseItem | ItemsRequestUseAccountItem | CurrencySetCurrencyDiscount | ZoneSettingData | WordFilterData | StaticFacilityInfoAllZones | OperationClientClearMissions | WordFilterData | LocksShowMenu | CharacterStateInteractionStart | CharacterStateInteractionStop | AudioSetState | AudioSetSwitch | AudioPostEvent | NpcFoundationPermissionsManagerAddPermission | NpcFoundationPermissionsManagerEditPermission | NpcFoundationPermissionsManagerBaseShowPermissions | ReplicationNpcComponent | VehicleSkinSetVehicleSkinManager | AnimationRequest | AnimationBase | ChatChat | ChatChatText | CommandPlaySoundAtLocation | CommandInteractRequest | CommandInteractCancel | CommandInteractDebug | CommandInteractionList | CommandInteractionSelect | CommandSetProfile | CommandPlayerSelect | CommandFreeInteractionNpc | CommandRecipeStart | CommandPlayDialogEffect | CommandPlaySoundIdOnTarget | CommandInteractionString | CommandAddWorldCommand | CommandAddZoneCommand | CommandExecuteCommand | CommandZoneExecuteCommand | CommandItemDefinitionRequest | CommandItemDefinitionReply | CommandItemDefinitions | CommandEnableCompositeEffects | CommandRequestWeaponFireStateUpdate | CommandDeliveryDisplayInfo | CommandDeliveryManagerStatus | CommandReportLastDeath | CommandPointAndReport | CommandSpawnVehicle | CommandRunSpeed | CommandAddItem | ClientUpdateItemAdd | ClientUpdateItemUpdate | ClientUpdateItemDelete | ClientUpdateUpdateStat | ClientUpdateUpdateLocation | ClientUpdateActivateProfile | ClientUpdateDoneSendingPreloadCharacters | ClientUpdateDamageInfo | ClientUpdateRespawnLocations | ClientUpdateModifyMovementSpeed | ClientUpdateModifyTurnRate | ClientUpdateModifyStrafeSpeed | ClientUpdateUpdateManagedLocation | ClientUpdateManagedMovementVersion | ClientUpdateUpdateWeaponAddClips | ClientUpdateStartTimer | ClientUpdateCompleteLogoutProcess | ClientUpdateProximateItems | ClientUpdateTextAlert | ClientUpdateNetworkProximityUpdatesComplete | ClientUpdateDeathMetrics | ClientUpdateManagedObjectResponseControl | ClientUpdateNpcRelevance | ClientUpdateMonitorTimeDrift | ClientUpdateUpdateRewardAndGrinderState | ClientUpdateUpdateLockoutTimes | ClientUpdateZoneStatus | InGamePurchasePreviewOrderResponse | InGamePurchasePlaceOrderResponse | InGamePurchaseStoreBundles | InGamePurchaseStoreBundleCategoryGroups | InGamePurchaseStoreBundleCategories | InGamePurchaseExclusivePartnerStoreBundles | InGamePurchaseStoreBundleGroups | InGamePurchaseWalletInfoResponse | InGamePurchaseStationCashProductsResponse | InGamePurchaseStateCodesResponse | InGamePurchaseCountryCodesResponse | InGamePurchaseSubscriptionProductsResponse | InGamePurchaseEnableMarketplace | InGamePurchaseAcccountInfoRequest | InGamePurchaseAcccountInfoResponse | InGamePurchaseStoreBundleContentRequest | InGamePurchaseStoreBundleContentResponse | InGamePurchaseClientStatistics | InGamePurchaseDisplayMannequinStoreBundles | InGamePurchaseItemOfTheDay | InGamePurchaseEnablePaymentSources | InGamePurchaseSetMembershipFreeItemInfo | InGamePurchaseGiftOrderNotification | InGamePurchaseActiveSchedules | InGamePurchaseNudgeOfferNotification | InGamePurchaseSpiceWebAuthUrlResponse | InGamePurchaseBundlePriceUpdate | InGamePurchaseWalletBalanceUpdate | InGamePurchaseMemberFreeItemCount | QuickChatSendData | LobbyGameDefinitionDefinitionsRequest | LobbyGameDefinitionDefinitionsResponse | CoinStoreItemList | CoinStoreSellToClientRequest | CoinStoreTransactionComplete | ProfileStatsGetPlayerProfileStats | H1emuFairPlay | H1emuHeartBeat | ItemsAddAccountItem | DtoHitReportPacket | DtoStateChange | DtoObjectInitialData | DtoHitSpeedTreeReport | ContainerMoveItem | ContainerInitEquippedContainers | ContainerError | ContainerListAll | ContainerUpdateEquippedContainer | ConstructionPlacementRequest | ConstructionPlacementResponse | ConstructionPlacementFinalizeRequest | ConstructionPlacementFinalizeResponse | ConstructionUnknown | LocksSetLock | RagdollStart | RagdollUpdatePose | RagdollUnk2 | RagdollUnk | RagdollStop | GameModeUpdateToxicGas | GameModeUpdateSafeZone | GameModeDeathInfo | GameModeStartLogout | GameModeUnk9 | GameModeUnk10 | GameModeUnk11 | GameModeUnk13 | GameModeUnk15 | GameModeUnk16 | GameModeUnk18 | GameModeUnk19 | GameModeUnk20 | GameModeUnk21 | GameModeStartMatch | GameModeUnk23 | GameModeShowVictoryScreen | GrinderExchangeRequest | GrinderExchangeResponse | ScreenEffectApplyScreenEffect | ScreenEffectRemoveScreenEffect | SpectatorEnable | SpectatorUnknown2 | SpectatorUnknown3 | SpectatorTeleport | SpectatorUnknown5 | SpectatorSetUnknownFlag1 | SpectatorSetUnknownFlag2 | SpectatorMatchResults | SpectatorUnknown12 | SynchronizedTeleportWaitingForPlayers | SynchronizedTeleportUnk2 | SynchronizedTeleportStartingMatch | SynchronizedTeleportCountdown | AccessedCharacterBeginCharacterAccess | AccessedCharacterEndCharacterAccess | AccessedCharacterUpdateMutatorRights | AccessedCharacterUnknown3 | AccessedCharacterUnknown2 | ShaderParameterOverrideBase;