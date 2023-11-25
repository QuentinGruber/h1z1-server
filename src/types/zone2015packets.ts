/* prettier-ignore */ 
export interface Server {
  pingId?: number;
}
export interface SendSelfToClient {
  data :{
  guid?: string;
  characterId?: string;
  unknownUint1: unknown;
  lastLoginDate?: string;
  actorModelId?: number;
  extraModel?: string;
  unknownString1?: string;
  unknownDword4?: number;
  unknownDword5?: number;
  extraModelTexture?: string;
  unknownString3?: string;
  unknownString4?: string;
  headId?: number;
  unknownDword6?: number;
  factionId?: number;
  unknownDword9?: number;
  unknownDword10?: number;
  position?: Float32Array;
  rotation?: Float32Array;
  identity :{
  CharacterId?: number;
  AccountId?: number;
  unknownDword3?: number;
  characterFirstName?: string;
  characterLastName?: string;
};
  unknownDword14?: number;
  currency?: unknown[];
  creationDate?: string;
  unknownDword15?: number;
  unknownDword16?: number;
  unknownBoolean1?: boolean;
  unknownBoolean2?: boolean;
  isMember?: number;
  unknownDword18?: number;
  unknownBoolean3?: boolean;
  unknownDword19?: number;
  unknownDword20?: number;
  unknownDword21?: number;
  unknownDword22?: number;
  unknownDword23?: number;
  unknownBoolean4?: boolean;
  unknownTime1?: string;
  unknownTime2?: string;
  unknownDword24?: number;
  unknownBoolean5?: boolean;
  dailyRibbonCount?: number;
  profiles?: unknown[];
  currentProfile?: number;
  unknownArray2?: unknown[];
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
  unknownCoinStoreData :{
  unknownBoolean1?: boolean;
  unknownArray1?: unknown[];
};
  unknownArray10?: unknown[];
  unknownEffectArray?: unknown[];
  stats?: unknown[];
  playerTitles?: unknown[];
  currentPlayerTitle?: number;
  unknownArray13?: unknown[];
  unknownArray14?: unknown[];
  unknownDword33?: number;
  unknownArray15?: unknown[];
  unknownArray16?: unknown[];
  unknownArray17?: unknown[];
  unknownDword34?: number;
  unknownDword35?: number;
  abilities :{
  unknownArray1?: unknown[];
  unknownArray2?: unknown[];
  unknownArray3?: unknown[];
  unknownArray4?: unknown[];
  unknownData1 :{
  unknownDword1?: number;
  unknownDword2?: number;
};
  unknownArray5?: unknown[];
  unknownArray6?: unknown[];
  unknownArray7?: unknown[];
  unknownArray8?: unknown[];
};
  acquireTimers :{
  unknownArray1?: unknown[];
  unknownWord?: number;
};
  unknownSchema2525 :{
  unknownDword1?: number;
  unknownSchema1 :{
  unknownDword1?: number;
  unknownDword2?: number;
  unknownDword3?: number;
};
  unknownSchema2 :{
  unknownDword1?: number;
  unknownDword2?: number;
  unknownDword3?: number;
};
  unknownDword2?: number;
};
  unknownDword2548?: number;
  unknownArray14154?: unknown[];
  unknownSchema47522 :{
  unknownDword1?: number;
  unknownSchema4z7522 :{
  unknownDword1?: number;
  unknownDword2?: number;
  unknownDword3?: number;
};
  unknownDword3?: number;
};
  unknownArray1511125?: unknown[];
  unknownArray1qsd5?: unknown[];
  unknownArrayHello?: unknown[];
  equipement_slot?: unknown[];
  unknownArray1qqqsd5?: unknown[];
  unknownSchema41722 :{
  unknownDword1?: number;
  unknownSchema475a22 :{
  unknownDword1?: number;
  unknownDword2?: number;
  unknownDword3?: number;
};
  unknownDword3?: number;
};
  unknownSchema33334 :{
  unknownDword1?: number;
  unknownDword2?: number;
  unknownDword3?: number;
};
  unknownArray184d5?: unknown[];
  accountItem: unknown[];
  itemTimerData :{
  unknownData1 :{
  unknownDword1?: number;
  unknownFloat1?: number;
  unknownTime1?: string;
  unknownTime2?: string;
};
  unknownArray1?: unknown[];
  unknownData2 :{
  unknownDword1?: number;
  unknownFloat1?: number;
  unknownTime1?: string;
};
  unknownArray2?: unknown[];
  unknownArray3?: unknown[];
  unknownArray4?: unknown[];
  unknownByte1?: number;
};
  loadoutStuff :{
  unknownDword1?: number;
  unknownArray1?: unknown[];
  unknownTime1?: string;
};
  LocksPermissions?: unknown[];
  missionData :{
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
  nextSkillPointPct: any;
  unknownTime1?: string;
  unknownDword1?: number;
};
  skills?: unknown[];
  EquippedContainers?: unknown[];
  unknownBoolean8?: boolean;
  unknownQword1?: string;
  unknownDword38?: number;
  unknownQword2?: string;
  unknownQword3?: string;
  vehicleLoadoutId?: number;
  unknownDword40?: number;
  unknownBoolean9?: boolean;
  isFirstPersonOnly?: boolean;
};
}
export interface ClientIsReady {
}
export interface ZoneDoneSendingInitialData {
}
export interface TargetClientNotOnline {
  Unknown1?: number;
  Unknown2?: number;
}
export interface ClientBeginZoning {
  zoneName?: string;
  zoneType?: number;
  position?: Float32Array;
  rotation?: Float32Array;
  skyData :{
  unknownDword1?: number;
  name?: string;
  unknownDword2?: number;
  unknownDword3?: number;
  unknownDword4?: number;
  fogDensity?: number;
  fogGradient?: number;
  fogFloor?: number;
  unknownDword7?: number;
  rain?: number;
  temp?: number;
  skyColor?: number;
  cloudWeight0?: number;
  cloudWeight1?: number;
  cloudWeight2?: number;
  cloudWeight3?: number;
  sunAxisY?: number;
  sunAxisX?: number;
  sunAxisZ?: number;
  unknownDword18?: number;
  unknownDword19?: number;
  unknownDword20?: number;
  wind?: number;
  unknownDword22?: number;
  unknownDword23?: number;
  unknownDword24?: number;
  unknownDword25?: number;
  unknownArray?: unknown[];
};
  unknownBoolean1?: boolean;
  zoneId1?: number;
  zoneId2?: number;
  nameId?: number;
  unknownDword10?: number;
  unknownBoolean2?: boolean;
  unknownBoolean3?: boolean;
}
export interface SendZoneDetails {
  zoneName?: string;
  zoneType?: number;
  unknownBoolean1?: boolean;
  skyData :{
  unknownDword1?: number;
  name?: string;
  unknownDword2?: number;
  unknownDword3?: number;
  unknownDword4?: number;
  fogDensity?: number;
  fogGradient?: number;
  fogFloor?: number;
  unknownDword7?: number;
  rain?: number;
  temp?: number;
  skyColor?: number;
  cloudWeight0?: number;
  cloudWeight1?: number;
  cloudWeight2?: number;
  cloudWeight3?: number;
  sunAxisY?: number;
  sunAxisX?: number;
  sunAxisZ?: number;
  unknownDword18?: number;
  unknownDword19?: number;
  unknownDword20?: number;
  wind?: number;
  unknownDword22?: number;
  unknownDword23?: number;
  unknownDword24?: number;
  unknownDword25?: number;
  unknownArray?: unknown[];
};
  zoneId1?: number;
  zoneId2?: number;
  nameId?: number;
  unknownBoolean7?: boolean;
}
export interface GameTimeSync {
  time?: string;
  cycleSpeed?: number;
  unknownBoolean?: boolean;
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
export interface SetClientArea {
  Unknown2?: number;
  Unknown3?: boolean;
  Unknown4?: number;
}
export interface WorldShutdownNotice {
  timeLeft?: number;
  message?: string;
  Unknown4?: number;
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
  Unknown2?: number;
  UnknownString?: string;
  Unknown3?: number;
  Unknown4?: number;
}
export interface POIChangeMessage {
  messageStringId?: number;
  id?: number;
  unknown4?: number;
}
export interface ClientMetrics {
  unknown1?: string;
  unknown2?: number;
  unknown3?: number;
  unknown4?: number;
  unknown5?: number;
  unknown6?: number;
  unknown7?: number;
  unknown8?: number;
  unknown9?: number;
  unknown10?: number;
  unknown11?: number;
  unknown12?: number;
  unknown13?: number;
  unknown14?: number;
  unknown15?: number;
  unknown16?: number;
  unknown17?: number;
  unknown18?: number;
  unknown19?: number;
  unknown20?: number;
  unknown21?: number;
}
export interface ClientLog {
  file?: string;
  message?: string;
}
export interface LoginFailed {
}
export interface ClientGameSettings {
  Unknown2?: number;
  interactGlowAndDist?: number;
  unknownBoolean1?: boolean;
  timescale?: number;
  Unknown4?: number;
  Unknown5?: number;
  unknownFloat1?: number;
  unknownFloat2?: number;
  velDamageMulti?: number;
}
export interface PlayerTitle {
  unknown1?: number;
  titleId?: number;
}
export interface Fotomat {
}
export interface InitializationParameters {
  environment?: string;
  serverId?: number;
}
export interface ClientInitializationDetails {
  unknownDword1?: number;
}
export interface ClientAreaTimer {
  Unknown2?: number;
  Unknown3?: number;
  Unknown4?: string;
}
export interface PlayerUpdateUpdatePosition {
  transientId?: unknown;
  positionUpdate: unknown;
}
export interface Synchronization {
  time1?: string;
  time2?: string;
  clientTime?: string;
  serverTime?: string;
  serverTime2?: string;
  time3?: string;
}
export interface PlayerUpdateManagedPosition {
  transientId: unknown;
  PositionUpdate?: unknown;
}
export interface PlayerUpdateNetworkObjectComponents {
  transientId: unknown;
  unk1?: number;
  unknownArray1?: unknown[];
}
export interface ContinentBattleInfo {
  zones?: unknown[];
}
export interface GetContinentBattleInfo {
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
export interface PlayerUpdateVehicleCollision {
  transientId: unknown;
  damage?: number;
}
export interface PlayerUpdateStop {
  unknownUint: unknown;
}
export interface PlayerUpdateAttachObject {
  objects?: unknown[];
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
export interface CharacterSelectSessionRequest {
}
export interface CharacterSelectSessionResponse {
  status?: number;
  sessionId?: string;
}
export interface SkyChanged {
  unknownDword1?: number;
  name?: string;
  unknownDword2?: number;
  unknownDword3?: number;
  unknownDword4?: number;
  fogDensity?: number;
  fogGradient?: number;
  fogFloor?: number;
  unknownDword7?: number;
  rain?: number;
  temp?: number;
  skyColor?: number;
  cloudWeight0?: number;
  cloudWeight1?: number;
  cloudWeight2?: number;
  cloudWeight3?: number;
  sunAxisY?: number;
  sunAxisX?: number;
  sunAxisZ?: number;
  unknownDword18?: number;
  unknownDword19?: number;
  unknownDword20?: number;
  wind?: number;
  unknownDword22?: number;
  unknownDword23?: number;
  unknownDword24?: number;
  unknownDword25?: number;
  unknownArray?: unknown[];
}
export interface CombatAttackTargetDamage {
  unknown1?: boolean;
  unknown2?: number;
  characterId?: string;
  targetId?: string;
  unknown5?: number;
  unknown6?: boolean;
}
export interface CombatAttackAttackerMissed {
  unknown1?: boolean;
  unknown2?: number;
  characterId?: string;
  targetId?: string;
}
export interface CombatAttackTargetDodged {
  unknown1?: boolean;
  unknown2?: number;
  characterId?: string;
  targetId?: string;
}
export interface CombatEnableBossDisplay {
  unknown2?: number;
  characterId?: string;
  unknown6?: boolean;
}
export interface CombatAttackTargetBlocked {
  unknown2?: number;
  characterId?: string;
  targetId?: string;
}
export interface CombatUpdateGrappling {
  unknown1?: boolean;
  unknown2?: number;
  unknown3?: string;
  unknown4?: number;
  unknown5?: string;
  unknown6?: number;
}
export interface PlayerUpdateKnockback {
  characterId?: string;
  unk?: number;
  position?: Float32Array;
  rotation?: Float32Array;
  unk2?: number;
}
export interface PlayerUpdatePlayAnimation {
  characterId?: string;
  unk1?: number;
  unk2?: number;
  unk3?: number;
  unk4?: number;
}
export interface PlayerUpdateNpcRelevance {
  npcs?: unknown[];
}
export interface PlayerUpdateUpdateScale {
  characterId?: string;
  scale?: Float32Array;
}
export interface PlayerUpdateUpdateTemporaryAppearance {
  modelId?: number;
  characterId?: string;
}
export interface PlayerUpdateRemoveTemporaryAppearance {
  characterId?: string;
  modelId?: number;
}
export interface PlayerUpdatePlayCompositeEffect {
  characterId?: string;
  unk1?: number;
  unk2?: number;
  unk3?: number;
  unk4?: boolean;
  unk5?: boolean;
}
export interface PlayerUpdateSetLookAt {
  characterId?: string;
  targetCharacterId?: string;
}
export interface PlayerUpdateUpdateCharacterState {
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
export interface PlayerUpdateExpectedSpeed {
  characterId?: string;
  speed?: number;
}
export interface PlayerUpdateThoughtBubble {
  characterId?: string;
  unk1?: number;
  unk2?: number;
  unk3?: boolean;
}
export interface PlayerUpdateSetDisposition {
  characterId?: string;
  disposition?: number;
}
export interface PlayerUpdateLootEvent {
  characterId?: string;
  position?: Float32Array;
  rotation?: Float32Array;
  modelFileName?: string;
}
export interface PlayerUpdateSlotCompositeEffectOverride {
  characterId?: string;
  slotId?: number;
  effectId?: number;
}
export interface PlayerUpdateEffectPackage {
  unknownQword1?: string;
  characterId?: string;
  unknownBoolean1?: boolean;
  unknownDword1?: number;
  stringId?: number;
  unknownBoolean2?: boolean;
  effectId?: number;
  unknownDword4?: number;
  unknownDword5?: number;
}
export interface PlayerUpdateAddEffectTagCompositeEffect {
  characterId?: string;
  unk1?: number;
  unk2?: number;
  unk3?: string;
  unk4?: string;
  unk5?: number;
}
export interface PlayerUpdateCustomizeNpc {
  characterId?: string;
  a?: number;
  b?: number;
  unk1?: string;
  unk2?: string;
  c?: number;
  unk3?: boolean;
}
export interface PlayerUpdateSetSpawnerActivationEffect {
  characterId?: string;
  effectId?: number;
}
export interface PlayerUpdateReplaceBaseModel {
  characterId?: string;
  modelId?: number;
  unknown3?: number;
}
export interface PlayerUpdateSetCollidable {
  characterId?: string;
  collisionEnabled?: boolean;
}
export interface PlayerUpdateUpdateOwner {
  characterId?: string;
  unk?: number;
}
export interface PlayerUpdateWeaponStance {
  characterId?: string;
  stance?: number;
}
export interface PlayerUpdateMoveOnRail {
  characterId?: string;
  unknown4?: number;
  unknown5?: number;
  position?: Float32Array;
}
export interface PlayerUpdateClearMovementRail {
  characterId?: string;
}
export interface PlayerUpdateMoveOnRelativeRail {
  characterId?: string;
  unknown4?: number;
  unknown5?: number;
  unknown6?: number;
  unknown7?: number;
  unknown8?: number;
  unknownVector1?: Float32Array;
}
export interface PlayerUpdateDestroyed {
  characterId?: string;
  unknown1?: number;
  unknown2?: number;
  unknown3?: number;
  disableWeirdPhysics?: boolean;
}
export interface PlayerUpdateSeekTarget {
  characterId?: string;
  TargetCharacterId?: string;
  initSpeed?: number;
  acceleration?: number;
  speed?: number;
  unknown8?: number;
  yRot?: number;
  rotation?: Float32Array;
}
export interface PlayerUpdateSeekTargetUpdate {
  characterId?: string;
  TargetCharacterId?: string;
}
export interface PlayerUpdateUpdateActiveWieldType {
  characterId?: string;
  filterType?: number;
}
export interface PlayerUpdateLaunchProjectile {
  projectile :{
  unknownQword1?: string;
  unknownDword1?: number;
  unknownDword2?: number;
  unknownWord3?: boolean;
  unknownWord4?: boolean;
  unknownVector1?: Float32Array;
  unknownVector2?: Float32Array;
  unknownVector3?: Float32Array;
  unknownVector4?: Float32Array;
  unkstring?: string;
  unknownVector5?: Float32Array;
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
  unkstring2?: string;
  unknownDword18?: number;
  unknownDword19?: number;
  unknownDword20?: number;
  unknownDword21?: number;
  unknownDword22?: number;
  unknownDword23?: number;
  unknownDword24?: number;
  unknownDword25?: number;
  unknown26?: boolean;
  unknown27?: boolean;
  unknownDword28?: number;
  unknownDword29?: number;
  unknownDword30?: number;
  unknownDword31?: number;
  unknownDword32?: number;
  unknownDword33?: number;
  unknownDword34?: number;
  unknownDword35?: number;
  unknownDword36?: number;
  unknown37?: number;
  unknown38?: number;
  unknown39?: number;
  unknownDword40?: number;
  unknownDword41?: number;
  unknownQword42?: string;
  unknownDword42?: number;
  unknownDword43?: number;
  unknownDword44?: number;
  unknownDword45?: number;
  unknownVector6?: Float32Array;
  unknownDword46?: number;
  unknownDword47?: number;
  unknownDword48?: number;
  unknownDword49?: number;
  unknownDword50?: number;
  unknownDword51?: number;
  unknownDword52?: number;
  unknownDword53?: number;
  unknownDword54?: number;
  unknownDword55?: number;
  unknownDword56?: number;
  unknownDword57?: number;
};
  unknownDword1?: number;
}
export interface PlayerUpdateHudMessage {
  characterId?: string;
  unkguid2?: string;
  unknownDword1?: number;
  unknownDword2?: number;
  unknownDword3?: number;
  unknownDword4?: number;
  unknownDword5?: number;
  unknownDword6?: number;
}
export interface PlayerUpdateCustomizationData {
  customizationData?: unknown[];
}
export interface PlayerUpdateStartHarvest {
  characterId?: string;
  unknown4?: number;
  timeMs?: number;
  unknown6?: number;
  stringId?: number;
  unknownGuid?: string;
}
export interface PlayerUpdateKnockedOut {
  characterId?: string;
  unknownData1 :{
  unknownQword1?: string;
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
};
  unknownData2 :{
  unknownQword1?: string;
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
};
  unknownData3 :{
  unknownArray1?: unknown[];
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
  unknownVector1?: Float32Array;
  unknownDword9?: number;
  unknownDword10?: number;
  unknownDword11?: number;
  unknownDword12?: number;
};
  unknownDword1?: number;
}
export interface PlayerUpdateRespawn {
  respawnType?: number;
  respawnGuid?: string;
  profileId?: number;
}
export interface PlayerUpdateRespawnReply {
  characterId?: string;
  unk?: number;
}
export interface PlayerUpdateSetSpotted {
  unkArray?: unknown[];
  unk1?: number;
  unk2?: number;
}
export interface PlayerUpdateJet {
  characterId?: string;
  state?: number;
}
export interface PlayerUpdateSetFaction {
  guid?: string;
  factionId?: number;
}
export interface PlayerUpdateSetBattleRank {
  characterId?: string;
  battleRank?: number;
}
export interface PlayerUpdateManagedObject {
  guid?: string;
  guid2?: string;
  characterId?: string;
}
export interface PlayerUpdateManagedObjectResponseControl {
  control?: number;
  objectCharacterId?: string;
}
export interface PlayerUpdateMaterialTypeOverride {
  characterId?: string;
  materialType?: number;
}
export interface PlayerUpdateDebrisLaunch {
  characterId?: string;
  unk1?: number;
  unk2?: number;
  unk3?: string;
}
export interface PlayerUpdateHideCorpse {
  characterId?: string;
  unknownBoolean?: boolean;
}
export interface PlayerUpdateCharacterStateDelta {
  guid1?: string;
  guid2?: string;
  guid3?: string;
  guid4?: string;
  gameTime?: number;
}
export interface PlayerUpdateUpdateStat {
  characterId?: string;
  stats?: unknown[];
}
export interface PlayerUpdatePlayWorldCompositeEffect {
  soundId?: number;
  position?: Float32Array;
  unk3?: number;
}
export interface PlayerUpdateAddLightweightPc {
  characterId?: string;
  transientId?: unknown;
  unknownDword1?: number;
  unknownDword2?: number;
  unknownDword3?: number;
  characterFirstName?: string;
  characterLastName?: string;
  unknownByte3?: number;
  modelId?: number;
  unknownDword5?: number;
  position?: Float32Array;
  rotation?: Float32Array;
  unknownFloat1?: number;
  unknownGuid1?: string;
  unknownDword6?: number;
  unknownDword7?: number;
  unknownByte4?: number;
  unknownDword8?: number;
  unknownDword9?: number;
  unknownGuid2?: string;
  unknownByte5?: number;
}
export interface PlayerUpdateAddLightweightNpc {
  characterId?: string;
  transientId?: unknown;
  string5?: string;
  nameId?: number;
  spawnId?: number;
  facilityId?: number;
  factionId?: number;
  modelId?: number;
  scale?: Float32Array;
  texture?: string;
  string13?: string;
  unknown14?: number;
  position?: Float32Array;
  rotation?: Float32Array;
  unknownVector?: Float32Array;
  unknown18?: number;
  unknown19?: number;
  extraModel?: string;
  string21?: string;
  string22?: string;
  vehicleId?: number;
  unknown24?: number;
  npcDefinitionId?: number;
  positionUpdateType?: number;
  profileId?: number;
  dontRequestFullData?: boolean;
  color?: number[];
  MRversion?: number;
  unknown31?: number;
  unknown32?: string;
  attachedObject :{
  targetObjectId?: string;
};
  debugMode?: number;
  unknown35?: number;
  unknown37?: number;
  unknown36?: string;
  unknown38?: number;
  unknown39?: number;
  unknown40?: number;
}
export interface PlayerUpdateAddLightweightVehicle {
  npcData :{
  characterId?: string;
  transientId?: unknown;
  string5?: string;
  nameId?: number;
  spawnId?: number;
  facilityId?: number;
  factionId?: number;
  modelId?: number;
  scale?: Float32Array;
  texture?: string;
  string13?: string;
  unknown14?: number;
  position?: Float32Array;
  rotation?: Float32Array;
  unknownVector?: Float32Array;
  unknown18?: number;
  unknown19?: number;
  extraModel?: string;
  string21?: string;
  string22?: string;
  vehicleId?: number;
  unknown24?: number;
  npcDefinitionId?: number;
  positionUpdateType?: number;
  profileId?: number;
  dontRequestFullData?: boolean;
  color?: number[];
  MRversion?: number;
  unknown31?: number;
  unknown32?: string;
  attachedObject :{
  targetObjectId?: string;
};
  debugMode?: number;
  unknown35?: number;
  unknown37?: number;
  unknown36?: string;
  unknown38?: number;
  unknown39?: number;
  unknown40?: number;
};
  unknownGuid1?: string;
  unknownDword1?: number;
  unknownDword2?: number;
  positionUpdate: unknown;
  unknownString1?: string;
}
export interface PlayerUpdateAddProxiedObject {
  characterId?: string;
  transientId: unknown;
  unknown5?: number;
  position?: Float32Array;
  rotation?: Float32Array;
  unknown6?: number;
  NetworkObjectComponent: unknown[];
}
export interface PlayerUpdateLightweightToFullPc {
  transientId?: unknown;
  unknownDword1?: number;
  unknownDword2?: number;
  unknownDword3?: number;
  unknownDword4?: number;
  attachments?: unknown[];
  unknownString1?: string;
  unknownString2?: string;
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
  unknownboolean1?: boolean;
  unknownboolean2?: boolean;
  unknownboolean3?: boolean;
  effectTags?: unknown[];
  unknownDword9?: number;
  unknownDword10?: number;
  unknownDword11?: number;
  unknownDword12?: number;
  unknownDword13?: number;
  unknownDword14?: number;
  unknownBoolean4?: boolean;
  unknownBoolean5?: boolean;
  unknownBoolean6?: boolean;
  unknownDword15?: number;
  unknownDword16?: number;
  unknownDword17?: number;
  unknownboolean5?: boolean;
  unknownboolean6?: boolean;
  unknownboolean7?: boolean;
  unknownboolean8?: boolean;
}
export interface PlayerUpdateLightweightToFullNpc {
  transientId?: unknown;
  unknownDword1?: number;
  unknownDword2?: number;
  unknownDword3?: number;
  attachments?: unknown[];
  unknownString1?: string;
  unknownString2?: string;
  unknownDword4?: number;
  unknownFloat1?: number;
  unknownDword5?: number;
  unknownVector1?: Float32Array;
  unknownVector2?: Float32Array;
  unknownFloat2?: number;
  unknownDword6?: number;
  unknownDword7?: number;
  unknownDword8?: number;
  effectTags?: unknown[];
  unknownDword9?: number;
  unknownString3?: string;
  unknownString4?: string;
  unknownDword10?: number;
  unknownString5?: string;
  unknownVector3?: Float32Array;
  unknownDword11?: number;
  unknownDword12?: number;
  unknownDword13?: number;
  unknownGuid?: string;
  unknownFloat3?: number;
  characterVariables?: unknown[];
  unknownDword14?: number;
  unknownFloat4?: number;
  unknownVector5?: Float32Array;
  unknownDword15?: number;
  unknownFloat5?: number;
  unknownFloat6?: number;
  unknownFloat7?: number;
  unknownDword16?: number;
  unknownDword17?: number;
  unknownDword18?: number;
  unknownDword19?: number;
  unknownDword21?: number;
  unknownByte1?: number;
  unknownByte2?: number;
  unknownDword22?: number;
  unknownDword23?: number;
  unknownDword24?: number;
  unknownGuid1?: string;
  unknownDword25?: number;
  unknownGuid2?: string;
  unknownDword26?: number;
  unknownDword27?: number;
  unknownDword28?: number;
  unknownDword29?: number;
  unknownDword30?: number;
  unknownDword31?: number;
  unknownDword32?: number;
  unk?: number;
}
export interface PlayerUpdateLightweightToFullVehicle {
  npcData :{
  transientId?: unknown;
  unknownDword1?: number;
  unknownDword2?: number;
  unknownDword3?: number;
  attachments?: unknown[];
  unknownString1?: string;
  unknownString2?: string;
  unknownDword4?: number;
  unknownFloat1?: number;
  unknownDword5?: number;
  unknownVector1?: Float32Array;
  unknownVector2?: Float32Array;
  unknownFloat2?: number;
  unknownDword6?: number;
  unknownDword7?: number;
  unknownDword8?: number;
  effectTags?: unknown[];
  unknownDword9?: number;
  unknownString3?: string;
  unknownString4?: string;
  unknownDword10?: number;
  unknownString5?: string;
  unknownVector3?: Float32Array;
  unknownDword11?: number;
  unknownDword12?: number;
  unknownDword13?: number;
  unknownGuid?: string;
  unknownFloat3?: number;
  characterVariables?: unknown[];
  unknownDword14?: number;
  unknownFloat4?: number;
  unknownVector5?: Float32Array;
  unknownDword15?: number;
  unknownFloat5?: number;
  unknownFloat6?: number;
  unknownFloat7?: number;
  unknownDword16?: number;
  unknownDword17?: number;
  unknownDword18?: number;
  unknownDword19?: number;
  unknownDword21?: number;
  unknownByte1?: number;
  unknownByte2?: number;
  unknownDword22?: number;
  unknownDword23?: number;
  unknownDword24?: number;
  unknownGuid1?: string;
  unknownDword25?: number;
  unknownGuid2?: string;
  unknownDword26?: number;
  unknownDword27?: number;
  unknownDword28?: number;
  unknownDword29?: number;
  unknownDword30?: number;
  unknownDword31?: number;
  unknownDword32?: number;
  unk?: number;
};
  unknownByte1?: number;
  unknownDword1?: number;
  unknownArray1?: unknown[];
  unknownArray2?: unknown[];
  unknownVector1?: Float32Array;
  unknownVector2?: Float32Array;
  unknownByte3?: number;
  unknownArray3?: unknown[];
  unknownArray4?: unknown[];
  vehicleStats?: unknown[];
  characterStats?: unknown[];
}
export interface PlayerUpdateFullCharacterDataRequest {
  characterId?: string;
}
export interface PlayerUpdateInitiateNameChange {
  characterId?: string;
}
export interface PlayerUpdateNameChangeResult {
  characterId?: string;
  result?: number;
  unknown5?: number;
  unknown6?: number;
}
export interface PlayerUpdateDeploy {
  characterId?: string;
  status?: number;
}
export interface PlayerUpdateLowAmmoUpdate {
  characterId?: string;
  status?: boolean;
}
export interface PlayerUpdateKilledBy {
  characterId?: string;
  characterId2?: string;
  isCheater?: boolean;
}
export interface PlayerUpdateMotorRunning {
  characterId?: string;
  isRunning?: boolean;
}
export interface PlayerUpdateDroppedIemNotification {
  itemId?: number;
  quantity?: number;
}
export interface PlayerUpdateNoSpaceNotification {
}
export interface PlayerUpdateStartMultiStateDeath {
  characterId?: string;
  unknown4?: number;
  unknown5?: number;
  unknown6?: number;
}
export interface PlayerUpdateAggroLevel {
  characterId?: string;
  aggroLevel?: number;
}
export interface PlayerUpdateDoorState {
  characterId?: string;
  doorState?: number;
  unknownBoolean?: boolean;
}
export interface PlayerUpdateBeginCharacterAccess {
  characterId?: string;
  state?: boolean;
  unk1?: number;
}
export interface PlayerUpdateEndCharacterAccess {
}
export interface PlayerUpdateUpdateMutateRights {
  unknownQword1?: string;
  unknownBoolean1?: boolean;
}
export interface AbilityClientMoveAndCast {
  position?: Float32Array;
  unk1?: number;
  unk2?: number;
}
export interface AbilityFailed {
}
export interface AbilityStartCasting {
  characterId?: string;
  unkGuid?: string;
  unk1?: number;
  unk2?: number;
  unk3?: number;
  unkArray1?: unknown[];
  unk4?: number;
  unk5?: number;
  unk6?: number;
}
export interface AbilityLaunch {
  characterId?: string;
  unkGuid?: string;
  unk1?: number;
  weirdAskedByte?: number;
  position?: Float32Array;
  unkArray1?: unknown[];
  unk2?: number;
  unk3?: number;
  unk4?: number;
  unk5?: number;
  unk6?: number;
  unk7?: number;
  unk8?: number;
  unk9?: number;
  unk10?: number;
  unk11?: number;
  unkstring?: string;
  unk12?: number;
  unk13?: number;
  unk14?: number;
  unk15?: number;
  unk16?: number;
  unk17?: number;
  unk18?: number;
  unk19?: number;
  unk20?: number;
  unkGuid2?: string;
  unk21?: boolean;
  unk22?: boolean;
}
export interface AbilityLand {
  unknown3?: bigint;
  unknown4?: number;
  weirdAskedByte?: number;
  position?: Float32Array;
  unknown7?: number;
  position2?: Float32Array;
  unknown9?: number;
  unknown10?: number;
  unknown11?: number;
  unknown12?: number;
  unknown13?: number;
  unknown14?: number;
}
export interface AbilityStartChanneling {
  unknown3?: bigint;
  unknown4?: bigint;
  unknown5?: number;
  unknown6?: number;
  unknown7?: number;
  position?: Float32Array;
  unknown9?: number;
  unknown10?: number;
}
export interface AbilityStopCasting {
  characterId?: string;
  unkGuid?: string;
  unk1?: number;
  unk2?: number;
  unk3?: number;
}
export interface AbilityStopAura {
  unknown1?: number;
  unknown2?: number;
}
export interface AbilityAbilityDetails {
  characterId?: string;
  unkGuid?: string;
  unkGuid2?: string;
  unk1?: number;
  unk2?: number;
  unk3?: number;
  unk4?: boolean;
  unk5?: boolean;
  unk6?: number;
}
export interface AbilitySetDefinition {
  unknown1?: number;
  unknown2?: boolean;
  unknown3?: number;
  unknown4?: number;
  unknown5?: boolean;
  unknown6?: bigint;
  unknown7?: number;
  unknown8?: number;
  unknown9?: number;
  unknown10?: number;
  unknown11?: number;
  unknown12?: number;
}
export interface AbilityAddAbilityDefinition {
  unknown1?: number;
  array1: unknown[];
  unknown3?: number;
  unknown4?: number;
  unknown5?: number;
  unknown6?: number;
  unknown7?: number;
  unknown8?: number;
  unknown9?: number;
  unknown10?: number;
  unknown11?: number;
  unknown12?: number;
  unknown13?: number;
  unknown14?: number;
  unknown15?: number;
  unknown16?: number;
  unknown17?: number;
  unknown18?: number;
  unknown19?: number;
  unknown20?: number;
  unknown21?: number;
  unknown22?: number;
  unknown23?: number;
  unknown24?: number;
  unknown25?: number;
  unknown26?: number;
  unknown27?: number;
  unknown28?: number;
  unknown29?: number;
  unknown30?: number;
  unknown31?: number;
  unknown32?: number;
  unknown33?: number;
  unknown34?: number;
  unknown35?: number;
  unknown36?: number;
  unknown37?: number;
  unknown38?: number;
  unknown39?: number;
  unknown40?: number;
  unknown41?: number;
  unknown42?: number;
  unknown43?: number;
  unknown44?: number;
  unknown45?: number;
  unknown46?: number;
  unknown47?: number;
  unknown48?: number;
  unknown49?: number;
  unknown50?: number;
  unknown51?: number;
  unknown52?: number;
  unknown53?: number;
  unknown54?: number;
  unknown55?: number;
  unknown56?: number;
  unknown57?: number;
  string19?: string;
  array4: unknown[];
  array7: unknown[];
}
export interface ReferenceDataClientProfileData {
  profiles?: unknown[];
}
export interface ReferenceDataWeaponDefinitions {
  data: unknown;
}
export interface ReferenceDataVehicleDefinitions {
  data: unknown;
}
export interface UiTaskAdd {
  Unknown1?: boolean;
  Unknown2?: boolean;
  Unknown3?: boolean;
  Unknown4?: number;
  Unknown5?: number;
  Unknown6?: boolean;
  Unknown7?: boolean;
  Unknown8?: number;
  Unknown9?: boolean;
  Unknown10?: number;
  Unknown11?: number;
}
export interface UiStartTimer {
  time?: number;
}
export interface UiResetTimer {
}
export interface UiMessage {
  stringId?: number;
}
export interface UiWeaponHitFeedback {
  Unknown1?: number;
  isEnemy?: boolean;
  Unknown2?: number;
}
export interface UiHeadShotFeedback {
  Unknown3?: boolean;
  Unknown4?: boolean;
}
export interface RecipeList {
  recipes?: unknown[];
}
export interface AcquaintanceAdd {
  characterId?: string;
  characterName?: string;
  type?: number;
  elapsedTime?: string;
  isOnline?: number;
}
export interface AcquaintanceRemove {
}
export interface AcquaintanceOnline {
  characterId?: string;
  isOnline?: boolean;
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
export interface AchievementAdd {
  achievementId?: number;
  achievementData :{
  objectiveId?: number;
  nameId?: number;
  descriptionId?: number;
  rewardData :{
  unknownByte1?: boolean;
  currency?: unknown[];
  unknownDword1?: number;
  unknownByte2?: number;
  unknownDword2?: number;
  unknownDword3?: number;
  unknownDword4?: number;
  unknownDword5?: number;
  unknownDword6?: number;
  time?: string;
  characterId?: string;
  nameId?: number;
  unknownDword8?: number;
  imageSetId?: number;
  entries?: unknown[];
  unknownDword10?: number;
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
export interface LootReply {
  items?: unknown[];
}
export interface MountMountResponse {
  characterId?: string;
  guid?: string;
  unknownDword1?: number;
  unknownDword2?: number;
  unknownDword3?: number;
  unknownDword4?: number;
  characterData :{
  unknownDword1?: number;
  unknownDword2?: number;
  unknownDword3?: number;
  characterName?: string;
  unknownString1?: string;
};
  tagString?: string;
  unknownDword5?: number;
}
export interface MountDismountRequest {
  unknownByte1?: number;
}
export interface MountDismountResponse {
  characterId?: string;
  guid?: string;
  unknownDword1?: number;
  unknownBoolean1?: boolean;
  unknownByte1?: number;
}
export interface MountList {
  List: unknown[];
}
export interface MountSeatChangeRequest {
  seatId?: number;
}
export interface MountSeatChangeResponse {
  characterId?: string;
  vehicleId?: string;
  unknownDword1?: number;
  unknownDword2?: number;
  unknownDword3?: number;
}
export interface MountSeatSwapRequest {
  characterId?: string;
  identity :{
  CharacterId?: number;
  AccountId?: number;
  unknownDword3?: number;
  characterFirstName?: string;
  characterLastName?: string;
};
  unknownDword3?: number;
}
export interface TargetCharacterGuid {
}
export interface TargetLocation {
}
export interface TargetCharacterBone {
}
export interface TargetCharacterBoneId {
}
export interface TargetActorBone {
  Unk1?: number;
  unk2?: string;
}
export interface TargetActorBoneId {
}
export interface TargetFacility {
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
  unknown1?: string;
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
export interface FacilityProximitySpawnCaptureUpdate {
  unknownBoolean1?: boolean;
  unknownBoolean2?: boolean;
  unknown1?: number;
  unknownBoolean3?: boolean;
  unknownBoolean4?: boolean;
  unknownBoolean5?: boolean;
  unknownBoolean6?: boolean;
}
export interface FacilitySpawnCollisionChanged {
  unknown1?: number;
  unknown2?: boolean;
  unknown3?: number;
}
export interface SkillSelectSkill {
  unknownDword1?: number;
  unknownWord1?: number;
  unknownDword2?: number;
}
export interface SkillSetSkillPointManager {
  unknownDword1?: number;
  unknownSchema1 :{
  unknownQword1?: string;
  unknownQword2?: string;
  unknownQword3?: string;
  unknownQword4?: string;
  unknownQword5?: string;
  unknownDword2?: number;
};
}
export interface SkillSetSkillPointProgress {
  unknown1?: number;
  unknown2?: number;
  unknown3?: number;
}
export interface LoadoutSetCurrentLoadout {
  guid?: string;
  loadoutId?: number;
}
export interface LoadoutSelectSlot {
  type?: number;
  unknownByte1?: number;
  unknownByte2?: number;
  loadoutSlotId?: number;
  gameTime?: number;
}
export interface LoadoutSetCurrentSlot {
  type?: number;
  unknownByte1?: number;
  slotId?: number;
}
export interface LoadoutActivateVehicleLoadoutTerminal {
  type?: number;
  guid?: string;
}
export interface LoadoutSetLoadouts {
  type?: number;
  guid?: string;
  unknownDword1?: number;
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
  unknownDword1?: number;
  unknownArray1?: unknown[];
  passengers?: unknown[];
  unknownArray2?: unknown[];
  unknownData1 :{
  unknownDword1?: number;
  unknownData1 :{
  unknownDword1?: number;
  unknownByte1?: number;
};
  unknownString1?: string;
  unknownDword2?: number;
  unknownDword3?: number;
  unknownDword4?: number;
  unknownDword5?: number;
  unknownArray3?: unknown[];
};
  unknownBytes1 :{
  itemData: unknown;
};
  unknownBytes2?: unknown;
}
export interface VehicleStateData {
  guid?: string;
  unknown3?: number;
  unknown4?: unknown[];
  unknown5?: unknown[];
}
export interface VehicleStateDamage {
  guid?: string;
  unknownVector1?: Float32Array;
  unknownVector2?: Float32Array;
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
export interface VehicleDismiss {
}
export interface VehicleAutoMount {
  guid?: string;
  unknownBoolean1?: boolean;
  unknownDword1?: number;
}
export interface VehicleEngine {
  guid1?: string;
  guid2?: string;
  unknownBoolean?: boolean;
}
export interface VehicleAccessType {
  vehicleGuid?: string;
  accessType?: number;
}
export interface VehicleHealthUpdateOwner {
  vehicleGuid?: string;
  health?: number;
}
export interface VehicleExpiration {
  expireTime?: number;
}
export interface VehicleCurrentMoveMode {
  characterId?: string;
  moveMode?: number;
}
export interface VehicleItemDefinitionRequest {
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
  profileId?: number;
  characterId?: string;
  unknownDword1?: number;
  unknownString1?: string;
  unknownString2?: string;
  equipmentSlots?: unknown[];
  attachmentData?: unknown[];
}
export interface EquipmentSetCharacterEquipmentSlots {
  profileId?: number;
  characterId?: string;
  gameTime?: number;
  slots?: unknown[];
  unknown1?: number;
  unknown2?: number;
  unknown3?: number;
  textures?: unknown[];
  models?: unknown[];
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
export interface WallOfDataUIEvent {
  object?: string;
  function?: string;
  argument?: string;
}
export interface WallOfDataClientSystemInfo {
  ClientSystemInfo?: string;
}
export interface WallOfDataLaunchPadFingerprint {
  LaunchPadFingerprint?: string;
}
export interface WallOfDataClientTransition {
  oldState?: number;
  newState?: number;
  msElapsed?: number;
}
export interface EffectAddEffect {
  unknownData1 :{
  unknownDword1?: number;
  unknownDword2?: number;
  unknownDword3?: number;
};
  unknownData2 :{
  unknownQword1?: string;
  unknownQword2?: string;
};
  unknownData3 :{
  unknownQword1?: string;
  unknownQword2?: string;
  unknownVector1?: Float32Array;
};
}
export interface EffectUpdateEffect {
  unknownData1 :{
  unknownDword1?: number;
  unknownDword2?: number;
  unknownDword3?: number;
};
  unknownData2 :{
  unknownDword1?: number;
  unknownQword1?: string;
};
  unknownData3 :{
  unknownQword1?: string;
  unknownQword2?: string;
  unknownVector1?: Float32Array;
};
}
export interface EffectRemoveEffect {
  unknownData1 :{
  unknownDword1?: number;
  unknownDword2?: number;
  unknownDword3?: number;
};
  unknownData2 :{
  unknownQword1?: string;
};
  unknownData3 :{
  unknownQword1?: string;
  unknownQword2?: string;
  unknownVector1?: Float32Array;
};
}
export interface EffectAddEffectTag {
  unknownDword1?: number;
  unknownDword2?: number;
  unknownDword3?: number;
  unknownDword4?: number;
  unknownDword5?: number;
  unknownData1 :{
  unknownGuid1?: string;
  unknownGuid2?: string;
};
  unknownData2 :{
  unknownGuid1?: string;
  unknownGuid2?: string;
  unknownVector1?: Float32Array;
};
  unknownData3 :{
  unknownDword1?: number;
  unknownDword2?: number;
  unknownDword3?: number;
};
  unknownDword6?: number;
  unknownByte1?: number;
}
export interface EffectRemoveEffectTag {
  unknownData1 :{
  unknownQword1?: string;
};
  unknownData2 :{
  unknownDword1?: number;
  unknownQword1?: string;
  unknownQword2?: string;
};
}
export interface EffectTargetBlockedEffect {
  unknownData1 :{
  unknownQword1?: string;
};
}
export interface AbilitiesInitAbility {
  unknownDword1?: number;
  unknownDword2?: number;
  unknownDword3?: number;
  unknownDword4?: number;
  unknownQword1?: string;
  unknownQword2?: string;
  unknownSchema1 :{
  unknownQword3?: string;
  unknownQword4?: string;
  unknownFloatVector1?: Float32Array;
};
  unknownWord1?: number;
  unknownArray6 :{
  unknownWord2?: number;
  unknownArray1?: unknown[];
  unknownArray2?: unknown[];
  unknownArray3?: unknown[];
  unknownArray4?: unknown[];
  unknownArray5?: unknown[];
};
}
export interface AbilitiesSetActivatableAbilityManager {
  unknownArray1?: unknown[];
}
export interface AbilitiesSetLoadoutAbilities {
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
export interface ClientPcDataSpeechPackList {
  speechPacks?: unknown[];
}
export interface CurrencySetCurrencyDiscount {
  currencyId?: number;
  discount?: number;
}
export interface ZoneSettingData {
  settings?: unknown[];
}
export interface OperationClientClearMissions {
}
export interface WordFilterData {
  wordFilterData: unknown;
}
export interface StaticFacilityInfoAllZones {
  facilities?: unknown[];
}
export interface ContainerInitEquippedContainers {
  Unknown2?: number;
  EquippedContainers?: unknown[];
}
export interface ConstructionPlacementRequest {
}
export interface ConstructionPlacementResponse {
  Unknown2?: boolean;
  Unknown3?: number;
  model?: number;
}
export interface ConstructionPlacementFinalizeRequest {
  position?: Float32Array;
  rotation?: Float32Array;
}
export interface ConstructionPlacementFinalizeResponse {
  status?: boolean;
}
export interface LocksShowMenu {
  characterId?: string;
  unknownDword1?: number;
  lockType?: number;
  objectCharacterId?: string;
}
export interface RagdollStop {
  unknown3?: number;
  unknown4?: string;
  array1: unknown[];
  array2: unknown[];
}
export interface ChatChat {
  unknown2?: number;
  channel?: number;
  characterId1?: string;
  characterId2?: string;
  unknown5_0?: number;
  unknown5_1?: number;
  unknown5_2?: number;
  characterName1?: string;
  unknown5_3?: string;
  unknown6_0?: number;
  unknown6_1?: number;
  unknown6_2?: number;
  characterName2?: string;
  unknown6_3?: string;
  message?: string;
  position?: Float32Array;
  unknownGuid?: string;
  unknown13?: number;
  color1?: number;
  color2?: number;
  unknown15?: number;
  unknown16?: boolean;
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
  soundName?: string;
  unk1?: number;
  unk2?: number;
  unk3?: number;
}
export interface CommandInteractRequest {
  guid?: string;
}
export interface CommandInteractCancel {
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
export interface CommandMoveAndInteract {
  position?: Float32Array;
  guid?: string;
}
export interface CommandRecipeStart {
  recipeId?: number;
}
export interface CommandShowRecipeWindow {
  characterId?: number;
}
export interface CommandPlayDialogEffect {
  characterId?: string;
  effectId?: number;
}
export interface CommandSetActiveVehicleGuid {
  unknown2?: number;
  unknown3?: number;
  vehicleId?: string;
}
export interface CommandPlaySoundIdOnTarget {
  target?: number;
  unk?: boolean;
}
export interface CommandSpotPlayerReply {
  guid?: string;
  unk1?: string;
  unk2?: string;
}
export interface CommandInteractionString {
  guid?: string;
  stringId?: number;
  unknownArray1?: unknown[];
}
export interface CommandPlayersInRadius {
  radius?: number;
  unknown?: number;
  numberOfPlayer?: number;
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
export interface CommandItemDefinitions {
  data :{
  itemDefinitions?: unknown[];
};
}
export interface CommandEnableCompositeEffects {
  enabled?: boolean;
}
export interface CommandRecipeAction {
}
export interface CommandRequestWeaponFireStateUpdate {
  characterId?: string;
}
export interface CommandDeliveryManagerStatus {
  color?: number;
  status?: number;
  unkString?: string;
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
export interface CombatAttackProcessed {
  unknownQword1?: string;
  unknownQword2?: string;
  unknownQword3?: string;
  unknownDword1?: number;
  unknownDword2?: number;
  unknownDword3?: number;
  unknownBoolean1?: boolean;
  unknownBoolean2?: boolean;
  unknownDword4?: number;
  unknownDword5?: number;
}
export interface ClientUpdateItemAdd {
  guid?: string;
  unknown1?: number;
}
export interface ClientUpdateUpdateStat {
  stats?: unknown[];
}
export interface ClientUpdateCollectionAddEntry {
  unknownDword1?: number;
  unknownDword2?: number;
  unknownDword3?: number;
  unknownDword4?: number;
  unknownDword5?: number;
  unknownDword6?: number;
  unknownDword7?: number;
  unknownBoolean1?: boolean;
}
export interface ClientUpdateCollectionRemoveEntry {
  unknownDword1?: number;
  unknownDword2?: number;
}
export interface ClientUpdateUpdateLocation {
  position?: Float32Array;
  rotation?: Float32Array;
  unknownBool1?: boolean;
  movementVersion?: number;
}
export interface ClientUpdateMana {
  mana?: number;
}
export interface ClientUpdateAddProfileAbilitySetApl {
  unknownDword1?: number;
  profiles?: unknown[];
}
export interface ClientUpdateAddEffectTag {
  unknownDword1?: number;
  unknownDword2?: number;
  unknownDword3?: number;
}
export interface ClientUpdateActivateProfile {
  profiles :{
  profileId?: number;
  nameId?: number;
  descriptionId?: number;
  type?: number;
  iconId?: number;
  unknownDword6?: number;
  unknownDword7?: number;
  unknownDword8?: number;
  unknownBoolean1?: boolean;
  unknownDword9?: number;
  unknownArray1?: unknown[];
  unknownDword10?: number;
  unknownDword11?: number;
  unknownBoolean3?: boolean;
  unknownFloat1?: number;
  unknownFloat2?: number;
  unknownFloat3?: number;
  unknownFloat4?: number;
  unknownDword13?: number;
  unknownFloat5?: number;
  unknownDword14?: number;
  unknownDword15?: number;
  unknownDword16?: number;
  unknownDword17?: number;
  unknownDword18?: number;
};
  attachmentData?: unknown[];
  unknownDword1?: number;
  unknownDword3?: number;
  actorModel?: number;
  unknownString1?: string;
  unknownString2?: string;
}
export interface ClientUpdateNotifyPlayer {
  message?: string;
}
export interface ClientUpdateDoneSendingPreloadCharacters {
  unknownBoolean1?: number;
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
export interface ClientUpdateZonePopulation {
  populations?: unknown[];
}
export interface ClientUpdateRespawnLocations {
  locations?: unknown[];
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
  unk1?: number;
  unk2?: number;
}
export interface ClientUpdateScreenEffect {
  unknown1?: number;
  unknownUint: unknown;
  unknown2?: boolean;
  unknown3?: boolean;
  unknown4?: boolean;
  unknown5?: boolean;
  unknown6?: boolean;
  unknown7?: number;
  unknown8?: number;
  vector1?: Float32Array;
}
export interface ClientUpdateMovementVersion {
  version?: number;
}
export interface ClientUpdateManagedMovementVersion {
  version: unknown;
  movementVersion?: number;
}
export interface ClientUpdateUpdateWeaponAddClips {
  unknownDword1?: number;
  unknownByte1?: number;
  unknownFloat1?: number;
}
export interface ClientUpdateDailyRibbonCount {
  unknownDword1?: number;
  unknownDword2?: number;
  unknownBoolean1?: boolean;
}
export interface ClientUpdateDespawnNpcUpdate {
  characterId?: string;
  timeBeforeDespawn?: number;
}
export interface ClientUpdateFreeze {
  frozen?: number;
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
export interface InGamePurchaseStoreBundleCategories {
  categories?: unknown[];
}
export interface InGamePurchaseWalletInfoResponse {
  unknownDword1?: number;
  unknownBoolean1?: boolean;
  unknownDword2?: number;
  unknownDword3?: number;
  unknownString1?: string;
  unknownString2?: string;
  unknownBoolean2?: boolean;
}
export interface InGamePurchaseEnableMarketplace {
  unknownBoolean1?: boolean;
  unknownBoolean2?: boolean;
}
export interface InGamePurchaseAccountInfoRequest {
  locale?: string;
}
export interface InGamePurchaseItemOfTheDay {
  bundleId?: number;
}
export interface InGamePurchaseActiveSchedules {
  unknown1?: unknown[];
  unknown2?: number;
  unknown3?: unknown[];
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
export interface TargetAddTarget {
  Unk1?: string;
  Unk2?: string;
  Unk3?: boolean;
}
export interface TargetSetTarget {
  Unk1?: string;
  Unk2?: string;
  Unk3?: boolean;
}
export interface TargetRemoveTarget {
  Unk2?: string;
  Unk3?: boolean;
}
export interface TargetClearTarget {
  Unk2?: string;
  Unk3?: boolean;
}
export interface ProfileStatsGetPlayerProfileStats {
  characterId?: string;
}
export interface ProfileStatsPlayerProfileStats {
  unknownData1 :{
  unknownData1 :{
  unknownDword1?: number;
  unknownArray1?: unknown[];
  unknownDword2?: number;
  unknownDword3?: number;
  unknownDword4?: number;
  unknownDword5?: number;
  unknownDword6?: number;
  unknownDword7?: number;
  unknownDword8?: number;
};
  unknownDword1?: number;
  unknownArray1?: unknown[];
  unknownDword2?: number;
  characterName?: string;
  characterId?: string;
  battleRank?: number;
  unknownDword4?: number;
  unknownDword6?: number;
  unknownDword7?: number;
  unknownByte1?: number;
  unknownArray2?: unknown[];
  unknownDword8?: number;
  unknownDword9?: number;
  unknownDword10?: number;
  unknownDword11?: number;
  unknownDword12?: number;
  unknownArray3?: unknown[];
  unknownDword13?: number;
  unknownArray4?: unknown[];
  unknownArray5?: unknown[];
};
  weaponStats1?: unknown[];
  weaponStats2?: unknown[];
  vehicleStats?: unknown[];
  facilityStats1?: unknown[];
  facilityStats2?: unknown[];
}
export interface DtoHitReportPacket {
}
export interface DtoStateChange {
  objectId: number;
  modelName: string;
  effectId: number;
  unk3: number;
  unk4: boolean;
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
export interface LockssetLock {
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
}
export interface PlayerUpdateRemovePlayer {
  characterId?: string;
}
export interface PlayerUpdateRemovePlayerGracefully {
  characterId?: string;
  unknown5?: boolean;
  unknown6?: number;
  effectDelay?: number;
  effectId?: number;
  stickyEffectId?: number;
  timeToDisappear?: number;
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
export type zone2015packets = Server | SendSelfToClient | ClientIsReady | ZoneDoneSendingInitialData | TargetClientNotOnline | ClientBeginZoning | SendZoneDetails | GameTimeSync | UpdateClientSessionData | WorldDisplayInfo | SetLocale | SetClientArea | WorldShutdownNotice | KeepAlive | ClientExitLaunchUrl | MembershipActivation | ShowSystemMessage | POIChangeMessage | ClientMetrics | ClientLog | LoginFailed | ClientGameSettings | PlayerTitle | Fotomat | InitializationParameters | ClientInitializationDetails | ClientAreaTimer | PlayerUpdateUpdatePosition | Synchronization | PlayerUpdateManagedPosition | PlayerUpdateNetworkObjectComponents | ContinentBattleInfo | GetContinentBattleInfo | GetRespawnLocations | Security | ServerPopulationInfo | GetServerPopulationInfo | PlayerUpdateVehicleCollision | PlayerUpdateStop | PlayerUpdateAttachObject | ClientSettings | RewardBuffInfo | GetRewardBuffInfo | CharacterSelectSessionRequest | CharacterSelectSessionResponse | SkyChanged | CombatAttackTargetDamage | CombatAttackAttackerMissed | CombatAttackTargetDodged | CombatEnableBossDisplay | CombatAttackTargetBlocked | CombatUpdateGrappling | PlayerUpdateKnockback | PlayerUpdatePlayAnimation | PlayerUpdateNpcRelevance | PlayerUpdateUpdateScale | PlayerUpdateUpdateTemporaryAppearance | PlayerUpdateRemoveTemporaryAppearance | PlayerUpdatePlayCompositeEffect | PlayerUpdateSetLookAt | PlayerUpdateUpdateCharacterState | PlayerUpdateExpectedSpeed | PlayerUpdateThoughtBubble | PlayerUpdateSetDisposition | PlayerUpdateLootEvent | PlayerUpdateSlotCompositeEffectOverride | PlayerUpdateEffectPackage | PlayerUpdateAddEffectTagCompositeEffect | PlayerUpdateCustomizeNpc | PlayerUpdateSetSpawnerActivationEffect | PlayerUpdateReplaceBaseModel | PlayerUpdateSetCollidable | PlayerUpdateUpdateOwner | PlayerUpdateWeaponStance | PlayerUpdateMoveOnRail | PlayerUpdateClearMovementRail | PlayerUpdateMoveOnRelativeRail | PlayerUpdateDestroyed | PlayerUpdateSeekTarget | PlayerUpdateSeekTargetUpdate | PlayerUpdateUpdateActiveWieldType | PlayerUpdateLaunchProjectile | PlayerUpdateHudMessage | PlayerUpdateCustomizationData | PlayerUpdateStartHarvest | PlayerUpdateKnockedOut | PlayerUpdateRespawn | PlayerUpdateRespawnReply | PlayerUpdateSetSpotted | PlayerUpdateJet | PlayerUpdateSetFaction | PlayerUpdateSetBattleRank | PlayerUpdateManagedObject | PlayerUpdateManagedObjectResponseControl | PlayerUpdateMaterialTypeOverride | PlayerUpdateDebrisLaunch | PlayerUpdateHideCorpse | PlayerUpdateCharacterStateDelta | PlayerUpdateUpdateStat | PlayerUpdatePlayWorldCompositeEffect | PlayerUpdateAddLightweightPc | PlayerUpdateAddLightweightNpc | PlayerUpdateAddLightweightVehicle | PlayerUpdateAddProxiedObject | PlayerUpdateLightweightToFullPc | PlayerUpdateLightweightToFullNpc | PlayerUpdateLightweightToFullVehicle | PlayerUpdateFullCharacterDataRequest | PlayerUpdateInitiateNameChange | PlayerUpdateNameChangeResult | PlayerUpdateDeploy | PlayerUpdateLowAmmoUpdate | PlayerUpdateKilledBy | PlayerUpdateMotorRunning | PlayerUpdateDroppedIemNotification | PlayerUpdateNoSpaceNotification | PlayerUpdateStartMultiStateDeath | PlayerUpdateAggroLevel | PlayerUpdateDoorState | PlayerUpdateBeginCharacterAccess | PlayerUpdateEndCharacterAccess | PlayerUpdateUpdateMutateRights | AbilityClientMoveAndCast | AbilityFailed | AbilityStartCasting | AbilityLaunch | AbilityLand | AbilityStartChanneling | AbilityStopCasting | AbilityStopAura | AbilityAbilityDetails | AbilitySetDefinition | AbilityAddAbilityDefinition | ReferenceDataClientProfileData | ReferenceDataWeaponDefinitions | ReferenceDataVehicleDefinitions | UiTaskAdd | UiStartTimer | UiResetTimer | UiMessage | UiWeaponHitFeedback | UiHeadShotFeedback | RecipeList | AcquaintanceAdd | AcquaintanceRemove | AcquaintanceOnline | FriendList | FriendMessage | ClientPathRequest | ClientPathReply | AchievementAdd | AchievementInitialize | LootReply | MountMountResponse | MountDismountRequest | MountDismountResponse | MountList | MountSeatChangeRequest | MountSeatChangeResponse | MountSeatSwapRequest | TargetCharacterGuid | TargetLocation | TargetCharacterBone | TargetCharacterBoneId | TargetActorBone | TargetActorBoneId | TargetFacility | VoiceLogin | VoiceJoinChannel | WeaponWeapon | FacilityReferenceData | FacilityFacilityData | FacilityProximitySpawnCaptureUpdate | FacilitySpawnCollisionChanged | SkillSelectSkill | SkillSetSkillPointManager | SkillSetSkillPointProgress | LoadoutSetCurrentLoadout | LoadoutSelectSlot | LoadoutSetCurrentSlot | LoadoutActivateVehicleLoadoutTerminal | LoadoutSetLoadouts | ExperienceSetExperienceRanks | ExperienceSetExperienceRateTier | VehicleOwner | VehicleOccupy | VehicleStateData | VehicleStateDamage | VehicleSpawn | VehicleUpdateQueuePosition | VehicleSetAutoDrive | VehicleLoadVehicleDefinitionManager | VehicleDismiss | VehicleAutoMount | VehicleEngine | VehicleAccessType | VehicleHealthUpdateOwner | VehicleExpiration | VehicleCurrentMoveMode | VehicleItemDefinitionRequest | ResourceEvent | CollisionDamage | EquipmentSetCharacterEquipment | EquipmentSetCharacterEquipmentSlots | DefinitionFilterSetDefinitionVariable | DefinitionFilterSetDefinitionIntSet | DefinitionFilterUnknownWithVariable1 | DefinitionFilterUnknownWithVariable2 | WallOfDataUIEvent | WallOfDataClientSystemInfo | WallOfDataLaunchPadFingerprint | WallOfDataClientTransition | EffectAddEffect | EffectUpdateEffect | EffectRemoveEffect | EffectAddEffectTag | EffectRemoveEffectTag | EffectTargetBlockedEffect | AbilitiesInitAbility | AbilitiesSetActivatableAbilityManager | AbilitiesSetLoadoutAbilities | MapRegionGlobalData | MapRegionData | MapRegionMapOutOfBounds | MapRegionRequestContinentData | ClientPcDataSpeechPackList | CurrencySetCurrencyDiscount | ZoneSettingData | OperationClientClearMissions | WordFilterData | StaticFacilityInfoAllZones | ContainerInitEquippedContainers | ConstructionPlacementRequest | ConstructionPlacementResponse | ConstructionPlacementFinalizeRequest | ConstructionPlacementFinalizeResponse | LocksShowMenu | RagdollStop | ChatChat | ChatChatText | CommandPlaySoundAtLocation | CommandInteractRequest | CommandInteractCancel | CommandInteractionList | CommandInteractionSelect | CommandSetProfile | CommandPlayerSelect | CommandFreeInteractionNpc | CommandMoveAndInteract | CommandRecipeStart | CommandShowRecipeWindow | CommandPlayDialogEffect | CommandSetActiveVehicleGuid | CommandPlaySoundIdOnTarget | CommandSpotPlayerReply | CommandInteractionString | CommandPlayersInRadius | CommandAddWorldCommand | CommandAddZoneCommand | CommandExecuteCommand | CommandZoneExecuteCommand | CommandItemDefinitions | CommandEnableCompositeEffects | CommandRecipeAction | CommandRequestWeaponFireStateUpdate | CommandDeliveryManagerStatus | CommandSpawnVehicle | CommandRunSpeed | CommandAddItem | CombatAttackProcessed | ClientUpdateItemAdd | ClientUpdateUpdateStat | ClientUpdateCollectionAddEntry | ClientUpdateCollectionRemoveEntry | ClientUpdateUpdateLocation | ClientUpdateMana | ClientUpdateAddProfileAbilitySetApl | ClientUpdateAddEffectTag | ClientUpdateActivateProfile | ClientUpdateNotifyPlayer | ClientUpdateDoneSendingPreloadCharacters | ClientUpdateDamageInfo | ClientUpdateZonePopulation | ClientUpdateRespawnLocations | ClientUpdateModifyMovementSpeed | ClientUpdateModifyTurnRate | ClientUpdateModifyStrafeSpeed | ClientUpdateUpdateManagedLocation | ClientUpdateScreenEffect | ClientUpdateMovementVersion | ClientUpdateManagedMovementVersion | ClientUpdateUpdateWeaponAddClips | ClientUpdateDailyRibbonCount | ClientUpdateDespawnNpcUpdate | ClientUpdateFreeze | ClientUpdateStartTimer | ClientUpdateCompleteLogoutProcess | ClientUpdateProximateItems | ClientUpdateTextAlert | InGamePurchaseStoreBundleCategories | InGamePurchaseWalletInfoResponse | InGamePurchaseEnableMarketplace | InGamePurchaseAccountInfoRequest | InGamePurchaseItemOfTheDay | InGamePurchaseActiveSchedules | QuickChatSendData | LobbyGameDefinitionDefinitionsRequest | LobbyGameDefinitionDefinitionsResponse | CoinStoreItemList | CoinStoreSellToClientRequest | CoinStoreTransactionComplete | TargetAddTarget | TargetSetTarget | TargetRemoveTarget | TargetClearTarget | ProfileStatsGetPlayerProfileStats | ProfileStatsPlayerProfileStats | DtoHitReportPacket | DtoStateChange | DtoObjectInitialData | DtoHitSpeedTreeReport | LockssetLock | RagdollStart | RagdollUpdatePose | RagdollUnk2 | RagdollUnk | PlayerUpdateRemovePlayer | PlayerUpdateRemovePlayerGracefully | InGamePurchaseStoreBundles;