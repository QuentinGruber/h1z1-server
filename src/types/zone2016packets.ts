export interface SendSelfToClient {
  data: any;
}
export interface ClientIsReady {
}
export interface ZoneDoneSendingInitialData {
}
export interface ClientBeginZoning {
  zoneName: string;
  zoneType: number;
  position: number[];
  rotation: number[];
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
  disableTrees: number;
  disableTrees1: number;
  disableTrees2: number;
  wind: number;
  unknownDword20: number;
  unknownDword21: number;
  name: string;
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
  zoneId1: number;
  zoneId2: number;
  nameId: number;
  unknownDword10: number;
  unknownBoolean1: boolean;
  unknownBoolean2: boolean;
  unknownBoolean3: boolean;
}
export interface SendZoneDetails {
  zoneName: string;
  zoneType: number;
  unknownBoolean1: boolean;
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
  disableTrees: number;
  disableTrees1: number;
  disableTrees2: number;
  wind: number;
  unknownDword20: number;
  unknownDword21: number;
  name: string;
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
  zoneId1: number;
  zoneId2: number;
  nameId: number;
  unknownBoolean2: boolean;
  unknownString1: string;
  unknownBoolean3: boolean;
}
export interface GameTimeSync {
  time: string;
  cycleSpeed: number;
  unknownBoolean1: boolean;
}
export interface UpdateClientSessionData {
  sessionId: string;
  stationName: string;
  unknownBoolean1: boolean;
  unknownString1: string;
  unknownString2: string;
  stationCode: string;
  unknownString3: string;
}
export interface WorldDisplayInfo {
  worldId: number;
}
export interface SetLocale {
  locale: string;
}
export interface WorldShutdownNotice {
  timeBeforeShutdown: string;
  message: string;
}
export interface KeepAlive {
  gameTime: number;
}
export interface MembershipActivation {
  unknown: number;
}
export interface ShowSystemMessage {
  unknownDword1: number;
  message: string;
  unknownDword2: number;
  color: number;
}
export interface POIChangeMessage {
  messageStringId: number;
  id: number;
  unknownDword1: number;
}
export interface ClientLog {
  file: string;
  message: string;
}
export interface UnknownPacketName {
  unknownDword1: number;
}
export interface ClientGameSettings {
  Unknown2: number;
  interactGlowAndDist: number;
  unknownBoolean1: boolean;
  timescale: number;
  Unknown4: number;
  Unknown5: number;
  unknownFloat1: number;
  unknownFloat2: number;
  velDamageMulti: number;
}
export interface PlayerTitle {
  unknown1: number;
  titleId: number;
}
export interface InitializationParameters {
  environment: string;
  serverId: number;
}
export interface ClientInitializationDetails {
  unknownDword1: number;
}
export interface PlayerUpdatePosition {
  transientId: any;
  positionUpdate: any;
}
export interface Synchronization {
  time1: string;
  time2: string;
  clientTime: string;
  serverTime: string;
  serverTime2: string;
  time3: string;
}
export interface PlayerUpdateManagedPosition {
  transientId: any;
  positionUpdate: any;
}
export interface AddSimpleNpc {
  characterId: string;
  transientId: any;
  unknownByte1: number;
  position: number[];
  rotation: number[];
  unknownDword1: number;
  unknownDword2: number;
  modelId: number;
  scale: number[];
  unknownDword3: number;
  showHealth: boolean;
  health: number;
}
export interface ContinentBattleInfo {
  zones: any[];
}
export interface GetContinentBattleInfo {
}
export interface SendSecurityPacketAndSelfDestruct {
}
export interface GetRespawnLocations {
}
export interface Security {
  code: number;
}
export interface ServerPopulationInfo {
  population: any[];
  populationPercent: any[];
  populationBuff: any[];
}
export interface GetServerPopulationInfo {
}
export interface PlayerStop {
  unknownUint: any;
}
export interface ClientSettings {
  helpUrl: string;
  shopUrl: string;
  shop2Url: string;
}
export interface RewardBuffInfo {
  unknownFloat1: number;
  unknownFloat2: number;
  unknownFloat3: number;
  unknownFloat4: number;
  unknownFloat5: number;
  unknownFloat6: number;
  unknownFloat7: number;
  unknownFloat8: number;
  unknownFloat9: number;
  unknownFloat10: number;
  unknownFloat11: number;
  unknownFloat12: number;
}
export interface GetRewardBuffInfo {
}
export interface CharacterSelectSessionResponse {
  status: number;
  sessionId: string;
}
export interface UpdateWeatherData {
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
  disableTrees: number;
  disableTrees1: number;
  disableTrees2: number;
  wind: number;
  unknownDword20: number;
  unknownDword21: number;
  name: string;
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
export interface AddLightweightPc {
  characterId: string;
  transientId: any;
  unknownDword1: number;
  unknownDword2: number;
  unknownDword3: number;
  characterFirstName: string;
  characterLastName: string;
  unknownString1: string;
  characterName: string;
  unknownQword1: string;
  unknownByte1: number;
  actorModelId: number;
  unknownDword1: number;
  position: number[];
  rotation: number[];
  unknownDword2: number;
  mountGuid: string;
  mountSeatId: number;
  mountRelatedDword1: number;
  unknownByte2: number;
  unknownDword3: number;
  unknownDword4: number;
  unknownQword1: string;
  unknownDword5: number;
  unknownByte3: number;
}
export interface AddLightweightNpc {
  characterId: string;
  transientId: any;
  petName: string;
  nameId: number;
  unknownByte1: number;
  actorModelId: number;
  scale: number[];
  texture: string;
  unknownString2: string;
  unknownDword1: number;
  position: number[];
  rotation: number[];
  unknownFloatVector4: number[];
  unknownDword2: number;
  unknownDword3: number;
  headActor: string;
  unknownString3: string;
  unknownString4: string;
  vehicleId: number;
  unknownDword5: number;
  npcDefinitionId: number;
  positionUpdateType: number;
  unknownDword7: number;
  isLightweight: boolean;
  a: number;
  b: number;
  c: number;
  unknownByte3: number;
  unknownDword8: number;
  unknownQword1: string;
  targetObjectId: string;
  unknownDword9: number;
  unknownDword10: number;
  unknownQword2: string;
  unknownDword11: number;
  unknownDword12: number;
  unknownDword13: number;
  unknownDword14: number;
  unknownDword15: number;
}
export interface AddLightweightVehicle {
  characterId: string;
  transientId: any;
  petName: string;
  nameId: number;
  unknownByte1: number;
  actorModelId: number;
  scale: number[];
  texture: string;
  unknownString2: string;
  unknownDword1: number;
  position: number[];
  rotation: number[];
  unknownFloatVector4: number[];
  unknownDword2: number;
  unknownDword3: number;
  headActor: string;
  unknownString3: string;
  unknownString4: string;
  vehicleId: number;
  unknownDword5: number;
  npcDefinitionId: number;
  positionUpdateType: number;
  unknownDword7: number;
  isLightweight: boolean;
  a: number;
  b: number;
  c: number;
  unknownByte3: number;
  unknownDword8: number;
  unknownQword1: string;
  targetObjectId: string;
  unknownDword9: number;
  unknownDword10: number;
  unknownQword2: string;
  unknownDword11: number;
  unknownDword12: number;
  unknownDword13: number;
  unknownDword14: number;
  unknownDword15: number;
  unknownGuid1: string;
  unknownDword1: number;
  unknownDword2: number;
  positionUpdate: any;
  unknownString1: string;
}
export interface AddProxiedObject {
  guid: string;
  transientId: any;
  unknownByte1: number;
  position: number[];
  rotation: number[];
}
export interface LightweightToFullPc {
  useCompression: boolean;
  unknownDword1: number;
  positionUpdate: any;
  unknownByte1: number;
  unknownByte2: number;
  unknownQword1: string;
  stats: any[];
  transientId: any;
  unknownDword1: number;
  unknownDword2: number;
  unknownDword3: number;
  unknownDword4: number;
  attachmentData: any[];
  unknownString1: string;
  unknownString2: string;
  unknownDword5: number;
  unknownDword6: number;
  unknownDword7: number;
  unknownString3: string;
  unknownString4: string;
  unknownString5: string;
  unknownString6: string;
  unknownString7: string;
  unknownString8: string;
  unknownDword8: number;
  unknownDword1: number;
  unknownDword2: number;
  unknownDword3: number;
  effectTags: any[];
  unknownDword9: number;
  unknownDword10: number;
  unknownDword11: number;
  unknownDword12: number;
  unknownDword13: number;
  unknownDword14: number;
  unknownBool1: boolean;
  unknownBool2: boolean;
  unknownBool3: boolean;
  unknownDword15: number;
  unknownDword16: number;
  unknownArray1: any;
  resources: any;
  unknownArray2: any;
  unknownArray3: any;
}
export interface LightweightToFullNpc {
  transientId: any;
  unknownDword1: number;
  unknownDword2: number;
  unknownDword3: number;
  attachmentData: any[];
  unknownString1: string;
  unknownString2: string;
  unknownDword4: number;
  unknownFloat1: number;
  unknownDword5: number;
  unknownDword6: number;
  unknownDword7: number;
  effectTags: any[];
  unknownDword1: number;
  unknownString1: string;
  unknownString2: string;
  unknownDword2: number;
  unknownString3: string;
  unknownVector4: number[];
  unknownDword8: number;
  characterId: string;
  unknownByte1: number;
  unknownArray1: any[];
  unknownArray2: any[];
  unknownDword9: number;
  unknownDword10: number;
  unknownVector5: number[];
  unknownDword11: number;
  unknownDword12: number;
  unknownDword13: number;
  unknownDword14: number;
  unknownDword15: number;
  unknownDword16: number;
  unknownDword17: number;
  unknownByte1: number;
  unknownByte2: number;
  unknownDword18: number;
  unknownDword19: number;
  unknownDword20: number;
  unknownQword1: string;
  unknownArray3: any;
  resources: any;
  unknownArray4: any;
  unknownArray5: any;
  remoteWeapons: any;
  itemsData: any;
  unknownDword21: number;
}
export interface LightweightToFullVehicle {
  transientId: any;
  unknownDword1: number;
  unknownDword2: number;
  unknownDword3: number;
  attachmentData: any[];
  unknownString1: string;
  unknownString2: string;
  unknownDword4: number;
  unknownFloat1: number;
  unknownDword5: number;
  unknownDword6: number;
  unknownDword7: number;
  effectTags: any[];
  unknownDword1: number;
  unknownString1: string;
  unknownString2: string;
  unknownDword2: number;
  unknownString3: string;
  unknownVector4: number[];
  unknownDword8: number;
  characterId: string;
  unknownByte1: number;
  unknownArray1: any[];
  unknownArray2: any[];
  unknownDword9: number;
  unknownDword10: number;
  unknownVector5: number[];
  unknownDword11: number;
  unknownDword12: number;
  unknownDword13: number;
  unknownDword14: number;
  unknownDword15: number;
  unknownDword16: number;
  unknownDword17: number;
  unknownByte1: number;
  unknownByte2: number;
  unknownDword18: number;
  unknownDword19: number;
  unknownDword20: number;
  unknownQword1: string;
  unknownArray3: any;
  resources: any;
  unknownArray4: any;
  unknownArray5: any;
  remoteWeapons: any;
  itemsData: any;
  unknownDword21: number;
  unknownByte1: number;
  unknownDword1: number;
  unknownArray1: any[];
  unknownArray2: any[];
  unknownVector1: number[];
  unknownVector2: number[];
  unknownByte3: number;
  passengers: any[];
  unknownArray3: any[];
  stats: any[];
  unknownArray4: any[];
}
export interface Character.RemovePlayer {
  characterId: string;
  unknownWord1: number;
  unknownBool1: boolean;
  unknownDword1: number;
  unknownDword2: number;
  unknownDword3: number;
  unknownDword4: number;
  unknownDword5: number;
}
export interface Character.UpdateScale {
  characterId: string;
  scale: number[];
}
export interface Character.UpdateCharacterState {
  characterId: string;
  states1: number[];
  states2: number[];
  states3: number[];
  states4: number[];
  states5: number[];
  states6: number[];
  states7: number[];
  placeholder: number;
  gameTime: number;
}
export interface Character.ReplaceBaseModel {
  characterId: string;
  modelId: number;
  effectId: number;
}
export interface Character.WeaponStance {
  characterId: string;
  stance: number;
}
export interface Character.MoveOnRail {
  characterId: string;
  unknown4: number;
  unknown5: number;
  position: number[];
}
export interface Character.ClearMovementRail {
  characterId: string;
}
export interface Character.MoveOnRelativeRail {
  characterId: string;
  unknown4: number;
  unknown5: number;
  unknown6: number;
  unknown7: number;
  unknown8: number;
  unknownVector1: number[];
}
export interface Character.Destroyed {
  characterId: string;
  unknown1: number;
  unknown2: number;
  unknown3: number;
  disableWeirdPhysic: boolean;
  unknown4: number;
  disableWeirdPhysic2: boolean;
}
export interface Character.SeekTarget {
  characterId: string;
  TargetCharacterId: string;
  initSpeed: number;
  acceleration: number;
  speed: number;
  unknown8: number;
  yRot: number;
  rotation: number[];
}
export interface Character.SeekTargetUpdate {
  characterId: string;
  TargetCharacterId: string;
}
export interface Character.UpdateActiveWieldType {
  characterId: string;
  unknownDword1: number;
}
export interface Character.KnockedOut {
  guid: string;
}
export interface Character.Respawn {
  respawnType: number;
  respawnGuid: string;
  profileId: number;
  profileId2: number;
}
export interface Character.RespawnReply {
  characterId: string;
  status: boolean;
}
export interface Character.Jet {
  characterId: string;
  state: number;
}
export interface Character.SetFaction {
  guid: string;
  factionId: number;
}
export interface Character.SetBattleRank {
  characterId: string;
  battleRank: number;
}
export interface Character.ManagedObject {
  objectCharacterId: string;
  guid2: string;
  characterId: string;
}
export interface Character.CharacterStateDelta {
  guid1: string;
  guid2: string;
  guid3: string;
  guid4: string;
  gameTime: number;
}
export interface Character.PlayWorldCompositeEffect {
  characterId: string;
  effectId: number;
  position: number[];
  unk3: number;
}
export interface Character.FullCharacterDataRequest {
  characterId: string;
}
export interface Character.MotorRunning {
  characterId: string;
  unknownBool1: boolean;
}
export interface Character.DroppedIemNotification {
  characterId: string;
  itemDefId: number;
  count: number;
}
export interface Character.NoSpaceNotification {
  characterId: string;
}
export interface Character.StartMultiStateDeath {
  characterId: string;
  unknown4: number;
  unknown5: number;
  unknown6: number;
}
export interface Character.DoorState {
  characterId: string;
  unknownDword1: number;
  unknownBool1: boolean;
}
export interface Character.UpdateSimpleProxyHealth {
  characterId: string;
  health: number;
}
export interface ReferenceData.ClientProfileData {
  profiles: any[];
}
export interface ReferenceData.WeaponDefinitions {
  data: any;
}
export interface ReferenceData.VehicleDefinitions {
  data: any;
}
export interface Reward.AddNonRewardItem {
  itemDefId: number;
  unk1: number;
  iconId: number;
  time4: number;
  count: number;
  time6: number;
}
export interface Recipe.Add {
  recipes: any[];
}
export interface Recipe.Remove {
  recipeId: number;
  bool: boolean;
}
export interface Recipe.Discovery {
}
export interface Recipe.Discoveries {
  recipes: any[];
  unkArray1: any[];
  unkArray2: any[];
}
export interface Recipe.List {
  recipes: any[];
}
export interface Friend.List {
  friends: any[];
}
export interface Friend.Message {
  messageType: number;
  messageTime: string;
  unknowndDword1: number;
  unknowndDword2: number;
  unknowndDword3: number;
  characterName: string;
  unknownString1: string;
  unknowndDword1: number;
  unknowndDword2: number;
  unknowndDword3: number;
  characterName: string;
  unknownString1: string;
}
export interface ClientPath.Request {
}
export interface ClientPath.Reply {
  PathProcessingTech: number;
  unknownDword2: number;
  nodes: any[];
}
export interface FirstTimeEvent.Unknown1 {
}
export interface FirstTimeEvent.State {
  unknownDword1: number;
  unknownDword2: number;
  unknownBoolean1: boolean;
}
export interface FirstTimeEvent.Unknown2 {
}
export interface FirstTimeEvent.Unknown3 {
}
export interface FirstTimeEvent.Script {
  unknownString1: string;
  unknownArray1: any[];
  unknownDword1: number;
  unknownBoolean1: boolean;
}
export interface Achievement.Add {
  achievementId: number;
  objectiveId: number;
  nameId: number;
  descriptionId: number;
  unknownBoolean1: boolean;
  currency: any[];
  unknownDword1: number;
  unknownDword2: number;
  unknownDword3: number;
  unknownDword4: number;
  unknownDword5: number;
  unknownDword6: number;
  time: string;
  characterId: string;
  nameId: number;
  unknownDword7: number;
  imageSetId: number;
  entriesArrLength: number;
  unknownDword8: number;
  unknownByte1: number;
  unknownDword3: number;
  unknownDword4: number;
  unknownByte2: number;
  unknownByte3: number;
  unknownDword1: number;
  unknownDword2: number;
  unknownDword3: number;
  unknownDword4: number;
  unknownByte4: number;
}
export interface Achievement.Initialize {
  clientAchievements: any[];
  achievementData: any;
}
export interface Mount.MountResponse {
  characterId: string;
  vehicleGuid: string;
  seatId: number;
  unknownDword2: number;
  unknownDword3: number;
  unknownDword4: number;
  unknownDword1: number;
  unknownDword2: number;
  unknownDword3: number;
  characterFirstName: string;
  characterLastName: string;
  unknownString1: string;
  characterName: string;
  unknownQword1: string;
  tagString: string;
}
export interface Mount.DismountRequest {
  unknownByte1: number;
}
export interface Mount.DismountResponse {
  characterId: string;
  vehicleGuid: string;
  unknownDword1: number;
  unknownBoolean1: boolean;
  unknownByte1: number;
}
export interface Mount.SeatChangeRequest {
  seatId: number;
  unknownByte1: number;
}
export interface Mount.SeatChangeResponse {
  characterId: string;
  vehicleGuid: string;
  unknownDword1: number;
  unknownDword2: number;
  unknownDword3: number;
  characterFirstName: string;
  characterLastName: string;
  unknownString1: string;
  characterName: string;
  unknownQword1: string;
  seatId: number;
  unknownDword1: number;
  unknownDword2: number;
}
export interface Voice.Login {
  clientName: string;
  sessionId: string;
  url: string;
  characterName: string;
}
export interface Voice.JoinChannel {
  roomType: number;
  uri: string;
  unknown1: number;
}
export interface Facility.ReferenceData {
  data: any;
}
export interface Facility.FacilityData {
  facilities: any[];
}
export interface Facility.SpawnCollisionChanged {
  unknown1: number;
  unknown2: boolean;
  unknown3: number;
}
export interface Skill.SetSkillPointProgress {
  unknown1: number;
  unknown2: number;
  unknown3: number;
}
export interface Loadout.SelectLoadout {
  loadoutId: number;
}
export interface Loadout.Unk1 {
  characterId: string;
  loadoutSlotId: number;
}
export interface Loadout.SetLoadoutSlots {
  characterId: string;
  loadoutId: number;
  loadoutSlots: any[];
  currentSlotId: number;
}
export interface Loadout.SetLoadoutSlot {
  characterId: string;
  itemDefinitionId: number;
  slotId: number;
  itemDefinitionId: number;
  loadoutItemGuid: string;
  unknownByte1: number;
  unknownDword1: number;
  unknownDword1: number;
}
export interface Loadout.SelectSlot {
  unknownDword1: number;
  slotId: number;
  unknownDword2: number;
}
export interface Loadout.CreateCustomLoadout {
  slotId: number;
  loadoutId: number;
}
export interface Experience.SetExperienceRanks {
  experienceRanks: any[];
}
export interface Experience.SetExperienceRateTier {
  unknownDword1: number;
  unknownDword2: number;
  unknownDword3: number;
  unknownDword4: number;
  unknownDword5: number;
}
export interface Vehicle.Owner {
  guid: string;
  characterId: string;
  unknownDword1: number;
  vehicleId: number;
  passengers: any[];
}
export interface Vehicle.Occupy {
  guid: string;
  characterId: string;
  vehicleId: number;
  clearLoadout: number;
  unknownArray1: any[];
  passengers: any[];
  unknownArray2: any[];
  unknownBytes1: any;
  unknownBytes2: any;
}
export interface Vehicle.StateData {
  guid: string;
  unknownFloat1: number;
  unknownArray1: any[];
  unknownArray2: any[];
}
export interface Vehicle.Spawn {
  vehicleId: number;
  loadoutTab: number;
}
export interface Vehicle.UpdateQueuePosition {
  queuePosition: number;
}
export interface Vehicle.SetAutoDrive {
  guid: string;
}
export interface Vehicle.LoadVehicleDefinitionManager {
  vehicleDefinitions: any[];
}
export interface Vehicle.AutoMount {
  guid: string;
  unknownBoolean1: boolean;
  unknownDword1: number;
}
export interface Vehicle.Engine {
  guid1: string;
  guid2: string;
  engineOn: boolean;
}
export interface Vehicle.OwnerPassengerList {
  characterId: string;
  passengers: any[];
}
export interface Vehicle.Expiration {
  expireTime: number;
}
export interface ResourceEvent {
  gameTime: number;
  eventData: any;
}
export interface Collision.Damage {
  unknownByte1: number;
  characterId: string;
  objectCharacterId: string;
  unknownDword1: number;
  damage: number;
  unknownDword2: number;
  position: number[];
  unknownByte2: number;
}
export interface Equipment.SetCharacterEquipment {
  profileId: number;
  characterId: string;
  unknownDword1: number;
  unknownString1: string;
  unknownString2: string;
  equipmentSlots: any[];
  attachmentData: any[];
}
export interface Equipment.SetCharacterEquipmentSlot {
  profileId: number;
  characterId: string;
  equipmentSlotId: number;
  equipmentSlotId: number;
  guid: string;
  tintAlias: string;
  decalAlias: string;
  modelName: string;
  textureAlias: string;
  tintAlias: string;
  decalAlias: string;
  unknownDword1: number;
  unknownDword2: number;
  effectId: number;
  slotId: number;
  unknownDword4: number;
  unknownArray1: any[];
  unknownBool1: boolean;
}
export interface Equipment.UnsetCharacterEquipmentSlot {
  profileId: number;
  characterId: string;
  unknownDword1: number;
  slotId: number;
}
export interface Equipment.SetCharacterEquipmentSlots {
  profileId: number;
  characterId: string;
  gameTime: number;
  slots: any[];
  unknownDword1: number;
  unknownString1: string;
  unknownString2: string;
  equipmentSlots: any[];
  attachmentData: any[];
}
export interface DefinitionFilter.SetDefinitionVariable {
  unknownDword1: number;
  unknownQword1: string;
  unknownFloat1: number;
  unknownFloat2: number;
}
export interface DefinitionFilter.SetDefinitionIntSet {
  unknownDword1: number;
  unknownQword1: string;
  unknownData1: any[];
}
export interface DefinitionFilter.UnknownWithVariable1 {
  unknownDword1: number;
  unknownQword1: string;
}
export interface DefinitionFilter.UnknownWithVariable2 {
  unknownDword1: number;
  unknownQword1: string;
}
export interface WallOfData.UIEvent {
  object: string;
  function: string;
  argument: string;
}
export interface WallOfData.ClientTransition {
  oldState: number;
  newState: number;
  msElapsed: number;
}
export interface Effect.AddEffect {
  unknownDword1: number;
  unknownDword2: number;
  unknownDword3: number;
  unknownQword1: string;
  unknownQword2: string;
  unknownQword1: string;
  unknownQword2: string;
  unknownVector1: number[];
}
export interface Effect.UpdateEffect {
  unknownDword1: number;
  unknownDword2: number;
  unknownDword3: number;
  unknownDword1: number;
  unknownQword1: string;
  unknownQword1: string;
  unknownQword2: string;
  unknownVector1: number[];
}
export interface Effect.RemoveEffect {
  unknownDword1: number;
  unknownDword2: number;
  unknownDword3: number;
  unknownQword1: string;
  unknownQword1: string;
  unknownQword2: string;
  unknownVector1: number[];
}
export interface Effect.AddEffectTag {
  unknownDword1: number;
  unknownDword2: number;
  unknownDword3: number;
  unknownDword4: number;
  unknownDword5: number;
  unknownDword6: number;
  unknownDword7: number;
  unknownDword8: number;
  unknownDword9: number;
  unknownDword10: number;
  unknownDword11: number;
  unknownQword1: string;
  unknownQword2: string;
  unknownQword3: string;
  unknownQword4: string;
  unknownDword12: number;
  unknownDword13: number;
  unknownDword14: number;
  unknownDword15: number;
  unknownDword16: number;
  unknownDword17: number;
  unknownDword18: number;
  unknownQword5: string;
  unknownDword19: number;
  unknownDword20: number;
  unknownByte1: number;
  unknownDword21: number;
  unknownQword6: string;
  unknownQword7: string;
  unknownDword22: number;
  unknownQword8: string;
  unknownDword23: number;
}
export interface Effect.RemoveEffectTag {
  unknownQword1: string;
  unknownDword1: number;
  unknownQword1: string;
  unknownQword2: string;
}
export interface Effect.TargetBlockedEffect {
  unknownQword1: string;
}
export interface Abilities.SetActivatableAbilityManager {
  unknownArray1: any[];
}
export interface Abilities.SetLoadoutAbilities {
  abilities: any[];
}
export interface MapRegion.GlobalData {
  unknown1: number;
  unknown2: number;
}
export interface MapRegion.Data {
  unknown1: number;
  unknown2: number;
  regions: any[];
}
export interface MapRegion.MapOutOfBounds {
  characterId: string;
  unknownDword1: number;
  unknownByte2: number;
}
export interface MapRegion.RequestContinentData {
  zoneId: number;
}
export interface Items.RequestUseItem {
  itemCount: number;
  unknownDword1: number;
  itemUseOption: number;
  characterId: string;
  characterId2: string;
  characterId3: string;
  itemGuid: string;
  itemSubData: any;
}
export interface Currency.SetCurrencyDiscount {
  currencyId: number;
  discount: number;
}
export interface ZoneSetting.Data {
  settings: any[];
}
export interface WordFilter.Data {
  wordFilterData: any;
}
export interface StaticFacilityInfo.AllZones {
  facilities: any[];
}
export interface Operation.ClientClearMissions {
}
export interface WordFilter.Data {
  wordFilterData: any;
}
export interface Chat.Chat {
  unknownWord1: number;
  channel: number;
  characterId1: string;
  characterId2: string;
  unknownDword1: number;
  unknownDword2: number;
  unknownDword3: number;
  characterFirstName: string;
  characterLastName: string;
  unknownString1: string;
  characterName: string;
  unknownQword1: string;
  unknownDword1: number;
  unknownDword2: number;
  unknownDword3: number;
  characterFirstName: string;
  characterLastName: string;
  unknownString1: string;
  characterName: string;
  unknownQword1: string;
  message: string;
  position: number[];
  unknownGuid1: string;
  unknownDword1: number;
  color1: number;
  color2: number;
  unknownByte1: number;
  unknownBoolean1: boolean;
}
export interface Chat.ChatText {
  message: string;
  unknownDword1: number;
  color: Array;
  unknownDword2: number;
  unknownByte3: number;
  unknownByte4: number;
}
export interface Command.InteractRequest {
  guid: string;
}
export interface Command.InteractCancel {
}
export interface Command.InteractDebug {
}
export interface Command.InteractionList {
  guid: string;
  unknownBoolean1: boolean;
  unknownArray1: any[];
  unknownString1: string;
  unknownBoolean2: boolean;
  unknownArray2: any[];
  unknownBoolean3: boolean;
}
export interface Command.InteractionSelect {
  guid: string;
  interactionId: number;
}
export interface Command.SetProfile {
  profileId: number;
  tab: number;
}
export interface Command.PlayerSelect {
  characterId: string;
  guid: string;
}
export interface Command.FreeInteractionNpc {
}
export interface Command.RecipeStart {
  recipeId: number;
  count: number;
}
export interface Command.PlayDialogEffect {
  characterId: string;
  effectId: number;
}
export interface Command.InteractionString {
  guid: string;
  stringId: number;
  unknown4: number;
}
export interface Command.AddWorldCommand {
  command: string;
}
export interface Command.AddZoneCommand {
  command: string;
}
export interface Command.ExecuteCommand {
  commandHash: number;
  arguments: string;
}
export interface Command.ZoneExecuteCommand {
  commandHash: number;
  arguments: string;
}
export interface Command.ItemDefinitionRequest {
  ID: number;
}
export interface Command.ItemDefinitionReply {
  data: any;
}
export interface Command.ItemDefinitions {
  data: any;
}
export interface Command.EnableCompositeEffects {
  enabled: boolean;
}
export interface Command.RequestWeaponFireStateUpdate {
  characterId: string;
}
export interface Command.ReportLastDeath {
}
export interface Command.SpawnVehicle {
  vehicleId: number;
  factionId: number;
  position: number[];
  heading: number;
  unknownDword1: number;
  autoMount: boolean;
}
export interface Command.RunSpeed {
  runSpeed: number;
}
export interface Command.AddItem {
  itemId: number;
  stackCount: number;
  imageSetId: number;
  imageTintValue: number;
  NameId: number;
  DescriptionId: number;
}
export interface ClientUpdate.ItemAdd {
  characterId: string;
  data: any;
}
export interface ClientUpdate.ItemUpdate {
  characterId: string;
  itemDefinitionId: number;
  tintId: number;
  guid: string;
  count: number;
  itemSubData: any;
  containerGuid: string;
  containerDefinitionId: number;
  containerSlotId: number;
  baseDurability: number;
  currentDurability: number;
  maxDurabilityFromDefinition: number;
  unknownBoolean1: boolean;
  unknownQword3: string;
  unknownDword9: number;
}
export interface ClientUpdate.ItemDelete {
  characterId: string;
  itemGuid: string;
}
export interface ClientUpdate.UpdateStat {
  statId: number;
  statValue: any;
}
export interface ClientUpdate.UpdateLocation {
  position: number[];
  rotation: number[];
  triggerLoadingScreen: boolean;
  unknownByte1: number;
  unknownBool2: boolean;
}
export interface ClientUpdate.ActivateProfile {
  profileData: any;
  attachmentData: any[];
  unknownDword1: number;
  unknownDword2: number;
  actorModelId: number;
  tintAlias: string;
  decalAlias: string;
}
export interface ClientUpdate.DoneSendingPreloadCharacters {
  done: boolean;
}
export interface ClientUpdate.DamageInfo {
  unknownDword1: number;
  transientId: any;
  unknownDword2: number;
  orientationToSource: number;
  unknownDword4: number;
  unknownBoolean2: boolean;
  unknownBoolean3: boolean;
  unknownDword5: number;
  unknownDword6: number;
}
export interface ClientUpdate.RespawnLocations {
  unknownFlags: number;
  locations: any[];
  unknownDword1: number;
  unknownDword2: number;
  locations2: any[];
}
export interface ClientUpdate.ModifyMovementSpeed {
  speed: number;
  version?: number;
}
export interface ClientUpdate.ModifyTurnRate {
  speed: number;
  version?: number;
}
export interface ClientUpdate.ModifyStrafeSpeed {
  speed: number;
  version?: number;
}
export interface ClientUpdate.ManagedMovementVersion {
  version: any;
}
export interface ClientUpdate.UpdateWeaponAddClips {
  unknownDword1: number;
  unknownByte1: number;
  unknownFloat1: number;
}
export interface ClientUpdate.StartTimer {
  stringId: number;
  time: number;
  message: string;
}
export interface ClientUpdate.CompleteLogoutProcess {
}
export interface ClientUpdate.ProximateItems {
  items: any[];
}
export interface ClientUpdate.TextAlert {
  message: string;
}
export interface ClientUpdate.NetworkProximityUpdatesComplete {
  done: boolean;
}
export interface ClientUpdate.ManagedObjectResponseControl {
  control: boolean;
  objectCharacterId: string;
}
export interface InGamePurchase.StoreBundleCategories {
  categories: any[];
}
export interface InGamePurchase.WalletInfoResponse {
  unknownDword1: number;
  unknownBoolean1: boolean;
  unknownDword2: number;
  unknownDword3: number;
  unknownString1: string;
  unknownString2: string;
  unknownBoolean2: boolean;
}
export interface InGamePurchase.EnableMarketplace {
  unknownBoolean1: boolean;
  unknownBoolean2: boolean;
}
export interface InGamePurchase.AcccountInfoRequest {
  locale: string;
}
export interface InGamePurchase.ItemOfTheDay {
  bundleId: number;
}
export interface InGamePurchase.ActiveSchedules {
  unknown1: any[];
  unknown2: number;
  unknown3: any[];
}
export interface QuickChat.SendData {
  commands: any[];
}
export interface LobbyGameDefinition.DefinitionsRequest {
}
export interface LobbyGameDefinition.DefinitionsResponse {
  definitionsData: any;
}
export interface CoinStore.ItemList {
  items: any[];
  unknown1: number;
}
export interface CoinStore.SellToClientRequest {
  unknown1: number;
  unknown2: number;
  itemId: number;
  unknown4: number;
  quantity: number;
  unknown6: number;
}
export interface CoinStore.TransactionComplete {
  unknown1: number;
  unknown2: number;
  unknown3: number;
  unknown4: number;
  unknown5: number;
  unknown6: number;
  unknown7: number;
  unknown8: number;
  timestamp: number;
  unknown9: number;
  itemId: number;
  unknown10: number;
  quantity: number;
  unknown11: number;
  unknown12: number;
}
export interface ProfileStats.GetPlayerProfileStats {
  characterId: string;
}
export interface DtoHitReportPacket {
}
export interface DtoStateChange {
  objectId: number;
  modelName: string;
  effectId: number;
  unk3: number;
  unk4: boolean;
  unkDword1: number;
  unk5: boolean;
  unk6: boolean;
  unk7: boolean;
  unk8: boolean;
}
export interface DtoObjectInitialData {
  unknownDword1: number;
  unknownArray1: any[];
  unknownArray2: any[];
}
export interface DtoHitSpeedTreeReport {
  id: number;
  treeId: number;
  name: string;
}
export interface Container.MoveItem {
  containerGuid: string;
  characterId: string;
  itemGuid: string;
  targetCharacterId: string;
  count: number;
  newSlotId: number;
}
export interface Container.InitEquippedContainers {
  ignore: string;
  characterId: string;
  containers: any[];
}
export interface Container.Error {
  characterId: string;
  containerError: number;
}
export interface Container.ListAll {
  characterId: string;
  containers: any[];
  array1: any[];
  unknownDword1: number;
}
export interface Container.UpdateEquippedContainer {
  ignore: string;
  characterId: string;
  guid: string;
  definitionId: number;
  associatedCharacterId: string;
  slots: number;
  items: any[];
  unknownBoolean1: boolean;
  maxBulk: number;
  unknownDword4: number;
  bulkUsed: number;
  hasBulkLimit: boolean;
}
export interface Construction.PlacementRequest {
  itemDefinitionId: number;
}
export interface Construction.PlacementResponse {
  unknownDword1: number;
  model: number;
}
export interface Construction.PlacementFinalizeRequest {
  position: number[];
  rotation: number[];
}
export interface Construction.PlacementFinalizeResponse {
  status: boolean;
  unknownString1: string;
}
export interface Construction.Unknown {
  unknownDword1: number;
}
export interface AccessedCharacter.BeginCharacterAccess {
  objectCharacterId: string;
  containerGuid: string;
  unknownBool1: boolean;
  itemsData: any;
}
export interface AccessedCharacter.EndCharacterAccess {
}
export interface AccessedCharacter.Unknown1 {
  characterId: string;
  containerGuid: string;
}
export interface InGamePurchase.StoreBundles {
  unknownDword1: number;
  unknownDword2: number;
  storeId: number;
  unknownDword3: number;
  unknownDword4: number;
  imageSetId: string;
  imageTintValue: string;
  storeBundles: any[];
}
