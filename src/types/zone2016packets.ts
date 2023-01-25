/* prettier-ignore */ 
export interface SendSelfToClient {
  data: any;
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
  skyData? :{
  unknownDword1?: number;
  fogDensity?: number;
  fogFloor?: number;
  fogGradient?: number;
  rain?: number;
  temp?: number;
  colorGradient?: number;
  unknownDword8?: number;
  unknownDword9?: number;
  unknownDword10?: number;
  unknownDword11?: number;
  unknownDword12?: number;
  sunAxisX?: number;
  sunAxisY?: number;
  unknownDword15?: number;
  disableTrees?: number;
  disableTrees1?: number;
  disableTrees2?: number;
  wind?: number;
  unknownDword20?: number;
  unknownDword21?: number;
  name?: string;
  unknownDword22?: number;
  unknownDword23?: number;
  unknownDword24?: number;
  unknownDword25?: number;
  unknownDword26?: number;
  unknownDword27?: number;
  unknownDword28?: number;
  unknownDword29?: number;
  AOSize?: number;
  AOGamma?: number;
  AOBlackpoint?: number;
  unknownDword33?: number;
}
  unknownByte1?: number;
  zoneId1?: number;
  zoneId2?: number;
  nameId?: number;
  unknownDword10?: number;
  unknownBoolean1?: boolean;
  waitForZoneReady?: boolean;
  unknownBoolean3?: boolean;
}
export interface SendZoneDetails {
  zoneName?: string;
  zoneType?: number;
  unknownBoolean1?: boolean;
  skyData? :{
  unknownDword1?: number;
  fogDensity?: number;
  fogFloor?: number;
  fogGradient?: number;
  rain?: number;
  temp?: number;
  colorGradient?: number;
  unknownDword8?: number;
  unknownDword9?: number;
  unknownDword10?: number;
  unknownDword11?: number;
  unknownDword12?: number;
  sunAxisX?: number;
  sunAxisY?: number;
  unknownDword15?: number;
  disableTrees?: number;
  disableTrees1?: number;
  disableTrees2?: number;
  wind?: number;
  unknownDword20?: number;
  unknownDword21?: number;
  name?: string;
  unknownDword22?: number;
  unknownDword23?: number;
  unknownDword24?: number;
  unknownDword25?: number;
  unknownDword26?: number;
  unknownDword27?: number;
  unknownDword28?: number;
  unknownDword29?: number;
  AOSize?: number;
  AOGamma?: number;
  AOBlackpoint?: number;
  unknownDword33?: number;
}
  zoneId1?: number;
  zoneId2?: number;
  nameId?: number;
  unknownBoolean2?: boolean;
  lighting?: string;
  unknownBoolean3?: boolean;
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
export interface LoginFailed {
}
export interface UnknownPacketName {
  unknownDword1?: number;
}
export interface ClientGameSettings {
  Unknown2?: number;
  interactGlowAndDist?: number;
  unknownBoolean1?: boolean;
  timescale?: number;
  enableWeapons?: number;
  Unknown5?: number;
  unknownFloat1?: number;
  unknownFloat2?: number;
  damageMultiplier?: number;
}
export interface PlayerTitle {
  unknown1?: number;
  titleId?: number;
}
export interface InitializationParameters {
  ENVIRONMENT?: string;
  unknownString1?: string;
  rulesetDefinitions?: any[];
}
export interface ClientInitializationDetails {
  unknownDword1?: number;
}
export interface PlayerUpdatePosition {
  transientId: any;
  positionUpdate: any;
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
  transientId?: any;
  positionUpdate?: any;
}
export interface AddSimpleNpc {
  characterId?: string;
  transientId: any;
  unknownByte1?: number;
  position?: Float32Array;
  rotation?: Float32Array;
  unknownDword1?: number;
  unknownDword2?: number;
  modelId?: number;
  scale?: Float32Array;
  unknownDword3?: number;
  showHealth?: boolean;
  health?: number;
}
export interface ContinentBattleInfo {
  zones?: any[];
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
  population?: any[];
  populationPercent?: any[];
  populationBuff?: any[];
}
export interface GetServerPopulationInfo {
}
export interface PlayerStop {
  transientId: any;
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
  unknownDword1?: number;
  fogDensity?: number;
  fogFloor?: number;
  fogGradient?: number;
  rain?: number;
  temp?: number;
  colorGradient?: number;
  unknownDword8?: number;
  unknownDword9?: number;
  unknownDword10?: number;
  unknownDword11?: number;
  unknownDword12?: number;
  sunAxisX?: number;
  sunAxisY?: number;
  unknownDword15?: number;
  disableTrees?: number;
  disableTrees1?: number;
  disableTrees2?: number;
  wind?: number;
  unknownDword20?: number;
  unknownDword21?: number;
  name?: string;
  unknownDword22?: number;
  unknownDword23?: number;
  unknownDword24?: number;
  unknownDword25?: number;
  unknownDword26?: number;
  unknownDword27?: number;
  unknownDword28?: number;
  unknownDword29?: number;
  AOSize?: number;
  AOGamma?: number;
  AOBlackpoint?: number;
  unknownDword33?: number;
}
export interface AddLightweightPc {
  characterId?: string;
  transientId: any;
  identity? :{
  unknownDword1?: number;
  unknownDword2?: number;
  unknownDword3?: number;
  characterFirstName?: string;
  characterLastName?: string;
  unknownString1?: string;
  characterName?: string;
  unknownQword1?: string;
}
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
  unknownDword5?: number;
  flags1?: number[];
}
export interface AddLightweightNpc {
  characterId?: string;
  transientId: any;
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
  unknownDword5?: number;
  npcDefinitionId?: number;
  positionUpdateType?: number;
  profileId?: number;
  isLightweight?: boolean;
  flags? :{
  flags1?: number[];
  flags2?: number[];
  flags3?: number[];
}
  unknownByte3?: number;
  unknownDword8?: number;
  unknownQword1?: string;
  attachedObject? :{
  targetObjectId?: string;
}
  unknownDword9?: number;
  unknownDword10?: number;
  unknownQword2?: string;
  unknownDword11?: number;
  useCollision?: number;
  unknownDword13?: number;
  unknownDword14?: number;
  unknownDword15?: number;
}
export interface AddLightweightVehicle {
  npcData? :{
  characterId?: string;
  transientId: any;
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
  unknownDword5?: number;
  npcDefinitionId?: number;
  positionUpdateType?: number;
  profileId?: number;
  isLightweight?: boolean;
  flags? :{
  flags1?: number[];
  flags2?: number[];
  flags3?: number[];
}
  unknownByte3?: number;
  unknownDword8?: number;
  unknownQword1?: string;
  attachedObject? :{
  targetObjectId?: string;
}
  unknownDword9?: number;
  unknownDword10?: number;
  unknownQword2?: string;
  unknownDword11?: number;
  useCollision?: number;
  unknownDword13?: number;
  unknownDword14?: number;
  unknownDword15?: number;
}
  unknownGuid1?: string;
  unknownDword1?: number;
  unknownDword2?: number;
  positionUpdate: any;
  unknownString1?: string;
}
export interface AddProxiedObject {
  guid?: string;
  transientId: any;
  unknownByte1?: number;
  position?: Float32Array;
  rotation?: Float32Array;
}
export interface LightweightToFullPc {
  useCompression?: boolean;
  fullPcData: any;
  positionUpdate: any;
  unknownByte1?: number;
  unknownByte2?: number;
  unknownQword1?: string;
  stats?: any[];
  remoteWeaponExtra?: any[];
}
export interface LightweightToFullNpc {
  transientId: any;
  unknownDword1?: number;
  unknownDword2?: number;
  unknownDword3?: number;
  attachmentData?: any[];
  unknownString1?: string;
  unknownString2?: string;
  unknownDword4?: number;
  unknownFloat1?: number;
  unknownDword5?: number;
  unknownDword6?: number;
  unknownDword7?: number;
  effectTags?: any[];
  unknownData1? :{
  unknownDword1?: number;
  unknownString1?: string;
  unknownString2?: string;
  unknownDword2?: number;
  unknownString3?: string;
}
  unknownVector4?: Float32Array;
  unknownDword8?: number;
  characterId?: string;
  targetData: any;
  unknownArray1?: any[];
  unknownArray2?: any[];
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
  unknownArray3?: any;
  resources?: any;
  unknownArray4?: any;
  unknownArray5?: any;
  remoteWeapons?: any;
  itemsData?: any;
  unknownDword21?: number;
}
export interface LightweightToFullVehicle {
  npcData? :{
  transientId: any;
  unknownDword1?: number;
  unknownDword2?: number;
  unknownDword3?: number;
  attachmentData?: any[];
  unknownString1?: string;
  unknownString2?: string;
  unknownDword4?: number;
  unknownFloat1?: number;
  unknownDword5?: number;
  unknownDword6?: number;
  unknownDword7?: number;
  effectTags?: any[];
  unknownData1? :{
  unknownDword1?: number;
  unknownString1?: string;
  unknownString2?: string;
  unknownDword2?: number;
  unknownString3?: string;
}
  unknownVector4?: Float32Array;
  unknownDword8?: number;
  characterId?: string;
  targetData: any;
  unknownArray1?: any[];
  unknownArray2?: any[];
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
  unknownArray3?: any;
  resources?: any;
  unknownArray4?: any;
  unknownArray5?: any;
  remoteWeapons?: any;
  itemsData?: any;
  unknownDword21?: number;
}
  unknownByte1?: number;
  unknownDword1?: number;
  unknownArray1?: any[];
  unknownArray2?: any[];
  unknownVector1?: Float32Array;
  unknownVector2?: Float32Array;
  unknownByte3?: number;
  passengers?: any[];
  unknownArray3?: any[];
  stats?: any[];
  unknownArray4?: any[];
}
export interface ReplicationInteractionComponent {
  opcode?: number;
  transientId: any;
  rawComponent?: any;
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
export interface CharacterUpdateScale {
  characterId?: string;
  scale?: Float32Array;
}
export interface CharacterUpdateCharacterState {
  characterId?: string;
  states1: number[];
  states2: number[];
  states3: number[];
  states4: number[];
  states5: number[];
  states6: number[];
  states7: number[];
  placeholder?: number;
  gameTime?: number;
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
  unknown4?: number;
  disableWeirdPhysic2?: boolean;
}
export interface CharacterSeekTarget {
  characterId?: string;
  TargetCharacterId?: string;
  initSpeed?: number;
  acceleration?: number;
  speed?: number;
  unknown8?: number;
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
export interface CharacterRespawn {
  respawnType?: number;
  respawnGuid?: string;
  profileId?: number;
  profileId2?: number;
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
  unk3?: number;
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
export interface CharacterDroppedIemNotification {
  characterId?: string;
  itemDefId?: number;
  count?: number;
}
export interface CharacterNoSpaceNotification {
  characterId?: string;
}
export interface CharacterStartMultiStateDeath {
  characterId?: string;
  unknown4?: number;
  unknown5?: number;
  unknown6?: number;
}
export interface CharacterDoorState {
  characterId?: string;
  unknownDword1?: number;
  unknownBool1?: boolean;
}
export interface CharacterUpdateSimpleProxyHealth {
  characterId?: string;
  healthPercentage?: number;
}
export interface ReferenceDataProfileDefinitions {
  profiles?: any[];
}
export interface ReferenceDataWeaponDefinitions {
  data: any;
}
export interface ReferenceDataProjectileDefinitions {
  definitionsData: any;
}
export interface ReferenceDataVehicleDefinitions {
  data: any;
}
export interface UiWeaponHitFeedback {
  unknownDword1?: number;
  unknownByte1?: number;
  unknownDword2?: number;
}
export interface UiConfirmHit {
  hitType?: number[];
}
export interface RewardAddNonRewardItem {
  itemDefId?: number;
  unk1?: number;
  iconId?: number;
  time4?: number;
  count?: number;
  time6?: number;
}
export interface RecipeAdd {
  recipes?: any[];
}
export interface RecipeRemove {
  recipeId?: number;
  bool?: boolean;
}
export interface RecipeDiscovery {
}
export interface RecipeDiscoveries {
  recipes?: any[];
  unkArray1?: any[];
  unkArray2?: any[];
}
export interface RecipeList {
  recipes?: any[];
}
export interface FriendList {
  friends?: any[];
}
export interface FriendMessage {
  messageType?: number;
  messageTime?: string;
  messageData1? :{
  unknowndDword1?: number;
  unknowndDword2?: number;
  unknowndDword3?: number;
  characterName?: string;
  unknownString1?: string;
}
  messageData2? :{
  unknowndDword1?: number;
  unknowndDword2?: number;
  unknowndDword3?: number;
  characterName?: string;
  unknownString1?: string;
}
}
export interface ClientPathRequest {
}
export interface ClientPathReply {
  PathProcessingTech?: number;
  unknownDword2?: number;
  nodes?: any[];
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
  unknownArray1?: any[];
  unknownDword1?: number;
  unknownBoolean1?: boolean;
}
export interface AchievementAdd {
  achievementId?: number;
  achievementData? :{
  objectiveId?: number;
  nameId?: number;
  descriptionId?: number;
  rewardData? :{
  unknownBoolean1?: boolean;
  currency?: any[];
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
  imageSetId?: number;
  entriesArrLength?: number;
  unknownDword8?: number;
}
  unknownByte1?: number;
  unknownDword3?: number;
  unknownDword4?: number;
  unknownByte2?: number;
  unknownByte3?: number;
  unknownData1? :{
  unknownDword1?: number;
  unknownDword2?: number;
  unknownDword3?: number;
  unknownDword4?: number;
}
  unknownByte4?: number;
}
}
export interface AchievementInitialize {
  clientAchievements?: any[];
  achievementData: any;
}
export interface MountMountResponse {
  characterId?: string;
  vehicleGuid?: string;
  seatId?: number;
  unknownDword2?: number;
  isDriver?: number;
  debugStuff?: number;
  identity? :{
  unknownDword1?: number;
  unknownDword2?: number;
  unknownDword3?: number;
  characterFirstName?: string;
  characterLastName?: string;
  unknownString1?: string;
  characterName?: string;
  unknownQword1?: string;
}
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
  identity? :{
  unknownDword1?: number;
  unknownDword2?: number;
  unknownDword3?: number;
  characterFirstName?: string;
  characterLastName?: string;
  unknownString1?: string;
  characterName?: string;
  unknownQword1?: string;
}
  seatId?: number;
  unknownDword1?: number;
  unknownDword2?: number;
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
}
export interface VoiceLeaveRadio {
}
export interface WeaponWeapon {
  weaponPacket: any;
}
export interface FacilityReferenceData {
  data: any;
}
export interface FacilityFacilityData {
  facilities?: any[];
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
  loadoutData? :{
  loadoutSlots?: any[];
}
  currentSlotId?: number;
}
export interface LoadoutSetLoadoutSlot {
  characterId?: string;
  loadoutSlot? :{
  loadoutId?: number;
  slotId?: number;
  loadoutItemData? :{
  itemDefinitionId?: number;
  loadoutItemGuid?: string;
  unknownByte1?: number;
}
  unknownDword1?: number;
}
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
  experienceRanks?: any[];
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
  passengers?: any[];
}
export interface VehicleOccupy {
  guid?: string;
  characterId?: string;
  vehicleId?: number;
  clearLoadout?: number;
  unknownArray1?: any[];
  passengers?: any[];
  unknownArray2?: any[];
  unknownBytes1?: any;
  unknownBytes2?: any;
}
export interface VehicleStateData {
  guid?: string;
  unknownFloat1?: number;
  unknownArray1?: any[];
  unknownArray2?: any[];
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
  vehicleDefinitions?: any[];
}
export interface VehicleAutoMount {
  guid?: string;
  unknownBoolean1?: boolean;
  unknownDword1?: number;
}
export interface VehicleEngine {
  guid1?: string;
  guid2?: string;
  engineOn?: boolean;
}
export interface VehicleOwnerPassengerList {
  characterId?: string;
  passengers?: any[];
}
export interface VehicleExpiration {
  expireTime?: number;
}
export interface VehicleCurrentMoveMode {
  characterId?: string;
  moveMode?: number;
}
export interface VehicleInventoryItems {
  characterId?: string;
  itemsData?: any;
}
export interface ResourceEvent {
  gameTime?: number;
  eventData: any;
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
  characterData? :{
  profileId?: number;
  characterId?: string;
}
  unknownDword1?: number;
  unknownString1?: string;
  unknownString2?: string;
  equipmentSlots?: any[];
  attachmentData?: any[];
  unknownBoolean1?: boolean;
}
export interface EquipmentSetCharacterEquipmentSlot {
  characterData? :{
  profileId?: number;
  characterId?: string;
}
  equipmentSlot? :{
  equipmentSlotId?: number;
  equipmentSlotData? :{
  equipmentSlotId?: number;
  guid?: string;
  tintAlias?: string;
  decalAlias?: string;
}
}
  attachmentData? :{
  modelName?: string;
  textureAlias?: string;
  tintAlias?: string;
  decalAlias?: string;
  unknownDword1?: number;
  unknownDword2?: number;
  effectId?: number;
  slotId?: number;
  unknownDword4?: number;
  unknownArray1?: any[];
  unknownBool1?: boolean;
}
}
export interface EquipmentUnsetCharacterEquipmentSlot {
  characterData? :{
  profileId?: number;
  characterId?: string;
}
  unknownDword1?: number;
  slotId?: number;
}
export interface EquipmentSetCharacterEquipmentSlots {
  characterData? :{
  profileId?: number;
  characterId?: string;
}
  gameTime?: number;
  slots?: any[];
  unknownDword1?: number;
  unknownString1?: string;
  unknownString2?: string;
  equipmentSlots?: any[];
  attachmentData?: any[];
}
export interface DefinitionFilterSetDefinitionVariable {
  unknownDword1?: number;
  unknownQword1?: string;
  unknownData1? :{
  unknownFloat1?: number;
  unknownFloat2?: number;
}
}
export interface DefinitionFilterSetDefinitionIntSet {
  unknownDword1?: number;
  unknownQword1?: string;
  unknownData1?: any[];
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
  info?: string;
}
export interface WallOfDataClientTransition {
  oldState?: number;
  newState?: number;
  msElapsed?: number;
}
export interface EffectAddEffect {
  unknownData1? :{
  unknownDword1?: number;
  unknownDword2?: number;
  unknownDword3?: number;
}
  unknownData2? :{
  unknownQword1?: string;
  unknownQword2?: string;
}
  unknownData3? :{
  unknownQword1?: string;
  unknownQword2?: string;
  unknownVector1?: Float32Array;
}
}
export interface EffectUpdateEffect {
  unknownData1? :{
  unknownDword1?: number;
  unknownDword2?: number;
  unknownDword3?: number;
}
  unknownData2? :{
  unknownDword1?: number;
  unknownQword1?: string;
}
  unknownData3? :{
  unknownQword1?: string;
  unknownQword2?: string;
  unknownVector1?: Float32Array;
}
}
export interface EffectRemoveEffect {
  unknownData1? :{
  unknownDword1?: number;
  unknownDword2?: number;
  unknownDword3?: number;
}
  unknownData2? :{
  unknownQword1?: string;
}
  unknownData3? :{
  unknownQword1?: string;
  unknownQword2?: string;
  unknownVector1?: Float32Array;
}
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
export interface EffectRemoveEffectTag {
  unknownData1? :{
  unknownQword1?: string;
}
  unknownData2? :{
  unknownDword1?: number;
  unknownQword1?: string;
  unknownQword2?: string;
}
}
export interface EffectTargetBlockedEffect {
  unknownData1? :{
  unknownQword1?: string;
}
}
export interface AbilitiesSetActivatableAbilityManager {
  unknownArray1?: any[];
}
export interface AbilitiesSetLoadoutAbilities {
  abilities?: any[];
}
export interface MapRegionGlobalData {
  unknown1?: number;
  unknown2?: number;
}
export interface MapRegionData {
  unknown1?: number;
  unknown2?: number;
  regions?: any[];
}
export interface MapRegionMapOutOfBounds {
  characterId?: string;
  unknownDword1?: number;
  unknownByte2?: number;
}
export interface MapRegionRequestContinentData {
  zoneId?: number;
}
export interface ItemsRequestUseItem {
  itemCount?: number;
  unknownDword1?: number;
  itemUseOption?: number;
  characterId?: string;
  characterId2?: string;
  characterId3?: string;
  itemGuid?: string;
  itemSubData?: any;
}
export interface CurrencySetCurrencyDiscount {
  currencyId?: number;
  discount?: number;
}
export interface ZoneSettingData {
  settings?: any[];
}
export interface WordFilterData {
  wordFilterData: any;
}
export interface StaticFacilityInfoAllZones {
  facilities?: any[];
}
export interface OperationClientClearMissions {
}
export interface WordFilterData {
  wordFilterData: any;
}
export interface LocksShowMenu {
  characterId?: string;
  unknownDword1?: number;
  lockType?: number;
  objectCharacterId?: string;
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
export interface NpcFoundationPermissionsManagerBaseshowPermissions {
  characterId?: string;
  characterId2?: string;
  permissions?: any[];
}
export interface ReplicationNpcComponent {
  transientId: any;
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
  rawComponent?: any;
}
export interface ChatChat {
  unknownWord1?: number;
  channel?: number;
  characterId1?: string;
  characterId2?: string;
  identity1? :{
  unknownDword1?: number;
  unknownDword2?: number;
  unknownDword3?: number;
  characterFirstName?: string;
  characterLastName?: string;
  unknownString1?: string;
  characterName?: string;
  unknownQword1?: string;
}
  identity2? :{
  unknownDword1?: number;
  unknownDword2?: number;
  unknownDword3?: number;
  characterFirstName?: string;
  characterLastName?: string;
  unknownString1?: string;
  characterName?: string;
  unknownQword1?: string;
}
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
  color: any[];
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
  unknownArray1?: any[];
  unknownString1?: string;
  unknownBoolean2?: boolean;
  unknownArray2?: any[];
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
  targetData: any;
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
  data: any;
}
export interface CommandItemDefinitions {
  data: any;
}
export interface CommandEnableCompositeEffects {
  enabled?: boolean;
}
export interface CommandRequestWeaponFireStateUpdate {
  characterId?: string;
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
  data: any;
}
export interface ClientUpdateItemUpdate {
  characterId?: string;
  data? :{
  itemDefinitionId?: number;
  tintId?: number;
  guid?: string;
  count?: number;
  itemSubData?: any;
  containerGuid?: string;
  containerDefinitionId?: number;
  containerSlotId?: number;
  baseDurability?: number;
  currentDurability?: number;
  maxDurabilityFromDefinition?: number;
  unknownBoolean1?: boolean;
  ownerCharacterId?: string;
  unknownDword9?: number;
}
}
export interface ClientUpdateItemDelete {
  characterId?: string;
  itemGuid?: string;
}
export interface ClientUpdateUpdateStat {
  statId?: number;
  statValue: any;
}
export interface ClientUpdateUpdateLocation {
  position?: Float32Array;
  rotation?: Float32Array;
  unknownBoolean1?: boolean;
  unknownByte1?: number;
  triggerLoadingScreen?: boolean;
}
export interface ClientUpdateActivateProfile {
  profileData: any;
  attachmentData?: any[];
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
  transientId?: any;
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
  locations?: any[];
  unknownDword1?: number;
  unknownDword2?: number;
  locations2?: any[];
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
export interface ClientUpdateManagedMovementVersion {
  version: any;
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
  items?: any[];
}
export interface ClientUpdateTextAlert {
  message?: string;
}
export interface ClientUpdateNetworkProximityUpdatesComplete {
}
export interface ClientUpdateDeathMetrics {
  recipesDiscovered?: number;
  unknown4?: number;
  wildlifeKilled?: number;
  zombiesKilled?: number;
  unknown7?: number;
  minutesSurvived?: number;
  position?: Float32Array;
  unknown10?: number;
  unknown11?: boolean;
}
export interface ClientUpdateManagedObjectResponseControl {
  control?: boolean;
  objectCharacterId?: string;
}
export interface ClientUpdateMonitorTimeDrift {
  timeDrift: number;
}
export interface InGamePurchaseStoreBundleCategories {
  categories?: any[];
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
export interface InGamePurchaseAcccountInfoRequest {
  locale?: string;
}
export interface InGamePurchaseItemOfTheDay {
  bundleId?: number;
}
export interface InGamePurchaseActiveSchedules {
  unknown1?: any[];
  unknown2?: number;
  unknown3?: any[];
}
export interface QuickChatSendData {
  commands?: any[];
}
export interface LobbyGameDefinitionDefinitionsRequest {
}
export interface LobbyGameDefinitionDefinitionsResponse {
  definitionsData: any;
}
export interface CoinStoreItemList {
  items?: any[];
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
  unknownArray1?: any[];
  unknownArray2?: any[];
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
  containers?: any[];
}
export interface ContainerError {
  characterId?: string;
  containerError?: number;
}
export interface ContainerListAll {
  characterId?: string;
  containers?: any[];
  array1?: any[];
  unknownDword1?: number;
}
export interface ContainerUpdateEquippedContainer {
  ignore?: string;
  characterId?: string;
  containerData? :{
  guid?: string;
  definitionId?: number;
  associatedCharacterId?: string;
  slots?: number;
  items?: any[];
  showBulk?: boolean;
  maxBulk?: number;
  unknownDword1?: number;
  bulkUsed?: number;
  hasBulkLimit?: boolean;
}
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
  unknownArray1?: any[];
  unknownArray2?: any[];
}
export interface LockssetLock {
  unknownDword1?: number;
  unknownDword2?: number;
  password?: number;
}
export interface SpectatorBase {
}
export interface AccessedCharacterBeginCharacterAccess {
  objectCharacterId?: string;
  containerGuid?: string;
  unknownBool1?: boolean;
  itemsData?: any;
}
export interface AccessedCharacterEndCharacterAccess {
}
export interface AccessedCharacterUnknown1 {
  characterId?: string;
  containerGuid?: string;
}
export interface AccessedCharacterUnknown2 {
  characterId?: string;
  itemsData?: any;
}
export interface InGamePurchaseStoreBundles {
  unknownDword1?: number;
  unknownDword2?: number;
  storeId?: number;
  unknownDword3?: number;
  unknownDword4?: number;
  imageData? :{
  imageSetId?: string;
  imageTintValue?: string;
}
  storeBundles?: any[];
}
export type zone2016packets = SendSelfToClient | ClientIsReady | ZoneDoneSendingInitialData | ClientBeginZoning | SendZoneDetails | GameTimeSync | UpdateClientSessionData | WorldDisplayInfo | SetLocale | WorldShutdownNotice | KeepAlive | ClientExitLaunchUrl | MembershipActivation | ShowSystemMessage | POIChangeMessage | ClientLog | LoginFailed | UnknownPacketName | ClientGameSettings | PlayerTitle | InitializationParameters | ClientInitializationDetails | PlayerUpdatePosition | Synchronization | PlayerUpdateManagedPosition | AddSimpleNpc | ContinentBattleInfo | GetContinentBattleInfo | SendSecurityPacketAndSelfDestruct | GetRespawnLocations | Security | ServerPopulationInfo | GetServerPopulationInfo | PlayerStop | ClientSettings | RewardBuffInfo | GetRewardBuffInfo | CharacterSelectSessionResponse | UpdateWeatherData | AddLightweightPc | AddLightweightNpc | AddLightweightVehicle | AddProxiedObject | LightweightToFullPc | LightweightToFullNpc | LightweightToFullVehicle | ReplicationInteractionComponent | CharacterRemovePlayer | CharacterUpdateScale | CharacterUpdateCharacterState | CharacterReplaceBaseModel | CharacterWeaponStance | CharacterMoveOnRail | CharacterClearMovementRail | CharacterMoveOnRelativeRail | CharacterDestroyed | CharacterSeekTarget | CharacterSeekTargetUpdate | CharacterUpdateActiveWieldType | CharacterKnockedOut | CharacterRespawn | CharacterRespawnReply | CharacterJet | CharacterSetFaction | CharacterSetBattleRank | CharacterManagedObject | CharacterCharacterStateDelta | CharacterPlayWorldCompositeEffect | CharacterFullCharacterDataRequest | CharacterKilledBy | CharacterMotorRunning | CharacterDroppedIemNotification | CharacterNoSpaceNotification | CharacterStartMultiStateDeath | CharacterDoorState | CharacterUpdateSimpleProxyHealth | ReferenceDataProfileDefinitions | ReferenceDataWeaponDefinitions | ReferenceDataProjectileDefinitions | ReferenceDataVehicleDefinitions | UiWeaponHitFeedback | UiConfirmHit | RewardAddNonRewardItem | RecipeAdd | RecipeRemove | RecipeDiscovery | RecipeDiscoveries | RecipeList | FriendList | FriendMessage | ClientPathRequest | ClientPathReply | FirstTimeEventUnknown1 | FirstTimeEventState | FirstTimeEventUnknown2 | FirstTimeEventUnknown3 | FirstTimeEventScript | AchievementAdd | AchievementInitialize | MountMountResponse | MountDismountRequest | MountDismountResponse | MountSeatChangeRequest | MountSeatChangeResponse | VoiceLogin | VoiceJoinChannel | VoiceLeaveChannel | VoiceRadioChannel | VoiceLeaveRadio | WeaponWeapon | FacilityReferenceData | FacilityFacilityData | FacilitySpawnCollisionChanged | SkillSetSkillPointProgress | LoadoutSelectLoadout | LoadoutUnk1 | LoadoutSetLoadoutSlots | LoadoutSetLoadoutSlot | LoadoutSelectSlot | LoadoutCreateCustomLoadout | ExperienceSetExperienceRanks | ExperienceSetExperienceRateTier | VehicleOwner | VehicleOccupy | VehicleStateData | VehicleSpawn | VehicleUpdateQueuePosition | VehicleSetAutoDrive | VehicleLoadVehicleDefinitionManager | VehicleAutoMount | VehicleEngine | VehicleOwnerPassengerList | VehicleExpiration | VehicleCurrentMoveMode | VehicleInventoryItems | ResourceEvent | CollisionDamage | EquipmentSetCharacterEquipment | EquipmentSetCharacterEquipmentSlot | EquipmentUnsetCharacterEquipmentSlot | EquipmentSetCharacterEquipmentSlots | DefinitionFilterSetDefinitionVariable | DefinitionFilterSetDefinitionIntSet | DefinitionFilterUnknownWithVariable1 | DefinitionFilterUnknownWithVariable2 | WallOfDataUIEvent | WallOfDataClientSystemInfo | WallOfDataClientTransition | EffectAddEffect | EffectUpdateEffect | EffectRemoveEffect | EffectAddEffectTag | EffectRemoveEffectTag | EffectTargetBlockedEffect | AbilitiesSetActivatableAbilityManager | AbilitiesSetLoadoutAbilities | MapRegionGlobalData | MapRegionData | MapRegionMapOutOfBounds | MapRegionRequestContinentData | ItemsRequestUseItem | CurrencySetCurrencyDiscount | ZoneSettingData | WordFilterData | StaticFacilityInfoAllZones | OperationClientClearMissions | WordFilterData | LocksShowMenu | NpcFoundationPermissionsManagerAddPermission | NpcFoundationPermissionsManagerEditPermission | NpcFoundationPermissionsManagerBaseshowPermissions | ReplicationNpcComponent | ChatChat | ChatChatText | CommandPlaySoundAtLocation | CommandInteractRequest | CommandInteractCancel | CommandInteractDebug | CommandInteractionList | CommandInteractionSelect | CommandSetProfile | CommandPlayerSelect | CommandFreeInteractionNpc | CommandRecipeStart | CommandPlayDialogEffect | CommandPlaySoundIdOnTarget | CommandInteractionString | CommandAddWorldCommand | CommandAddZoneCommand | CommandExecuteCommand | CommandZoneExecuteCommand | CommandItemDefinitionRequest | CommandItemDefinitionReply | CommandItemDefinitions | CommandEnableCompositeEffects | CommandRequestWeaponFireStateUpdate | CommandReportLastDeath | CommandPointAndReport | CommandSpawnVehicle | CommandRunSpeed | CommandAddItem | ClientUpdateItemAdd | ClientUpdateItemUpdate | ClientUpdateItemDelete | ClientUpdateUpdateStat | ClientUpdateUpdateLocation | ClientUpdateActivateProfile | ClientUpdateDoneSendingPreloadCharacters | ClientUpdateDamageInfo | ClientUpdateRespawnLocations | ClientUpdateModifyMovementSpeed | ClientUpdateModifyTurnRate | ClientUpdateModifyStrafeSpeed | ClientUpdateManagedMovementVersion | ClientUpdateUpdateWeaponAddClips | ClientUpdateStartTimer | ClientUpdateCompleteLogoutProcess | ClientUpdateProximateItems | ClientUpdateTextAlert | ClientUpdateNetworkProximityUpdatesComplete | ClientUpdateDeathMetrics | ClientUpdateManagedObjectResponseControl | ClientUpdateMonitorTimeDrift | InGamePurchaseStoreBundleCategories | InGamePurchaseWalletInfoResponse | InGamePurchaseEnableMarketplace | InGamePurchaseAcccountInfoRequest | InGamePurchaseItemOfTheDay | InGamePurchaseActiveSchedules | QuickChatSendData | LobbyGameDefinitionDefinitionsRequest | LobbyGameDefinitionDefinitionsResponse | CoinStoreItemList | CoinStoreSellToClientRequest | CoinStoreTransactionComplete | ProfileStatsGetPlayerProfileStats | DtoHitReportPacket | DtoStateChange | DtoObjectInitialData | DtoHitSpeedTreeReport | ContainerMoveItem | ContainerInitEquippedContainers | ContainerError | ContainerListAll | ContainerUpdateEquippedContainer | ConstructionPlacementRequest | ConstructionPlacementResponse | ConstructionPlacementFinalizeRequest | ConstructionPlacementFinalizeResponse | ConstructionUnknown | LockssetLock | SpectatorBase | AccessedCharacterBeginCharacterAccess | AccessedCharacterEndCharacterAccess | AccessedCharacterUnknown1 | AccessedCharacterUnknown2 | InGamePurchaseStoreBundles;