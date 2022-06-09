export interface SendSelfToClient {
  data: any;
}
export interface ClientIsReady {
}
export interface ZoneDoneSendingInitialData {
}
export interface TargetClientNotOnline {
  Unknown1: number;
  Unknown2: number;
}
export interface ClientBeginZoning {
  zoneName: string;
  zoneType: number;
  position: number[];
  rotation: number[];
  unknownDword1: number;
  name: string;
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
  sunAxisY: number;
  sunAxisX: number;
  sunAxisZ: number;
  unknownDword18: number;
  unknownDword19: number;
  unknownDword20: number;
  wind: number;
  unknownDword22: number;
  unknownDword23: number;
  unknownDword24: number;
  unknownDword25: number;
  unknownArray: any[];
  unknownBoolean1: boolean;
  zoneId1: number;
  zoneId2: number;
  nameId: number;
  unknownDword10: number;
  unknownBoolean2: boolean;
  unknownBoolean3: boolean;
}
export interface SendZoneDetails {
  zoneName: string;
  zoneType: number;
  unknownBoolean1: boolean;
  unknownDword1: number;
  name: string;
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
  sunAxisY: number;
  sunAxisX: number;
  sunAxisZ: number;
  unknownDword18: number;
  unknownDword19: number;
  unknownDword20: number;
  wind: number;
  unknownDword22: number;
  unknownDword23: number;
  unknownDword24: number;
  unknownDword25: number;
  unknownArray: any[];
  zoneId1: number;
  zoneId2: number;
  nameId: number;
  unknownBoolean7: boolean;
}
export interface GameTimeSync {
  time: string;
  cycleSpeed: number;
  unknownBoolean: boolean;
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
export interface SetClientArea {
  Unknown2: number;
  Unknown3: boolean;
  Unknown4: number;
}
export interface WorldShutdownNotice {
  timeLeft: number;
  message: string;
  Unknown4: number;
}
export interface KeepAlive {
  gameTime: number;
}
export interface ClientExitLaunchUrl {
  url: string;
}
export interface MembershipActivation {
  unknown: number;
}
export interface ShowSystemMessage {
  Unknown2: number;
  UnknownString: string;
  Unknown3: number;
  Unknown4: number;
}
export interface POIChangeMessage {
  messageStringId: number;
  id: number;
  unknown4: number;
}
export interface ClientMetrics {
  unknown1: string;
  unknown2: number;
  unknown3: number;
  unknown4: number;
  unknown5: number;
  unknown6: number;
  unknown7: number;
  unknown8: number;
  unknown9: number;
  unknown10: number;
  unknown11: number;
  unknown12: number;
  unknown13: number;
  unknown14: number;
  unknown15: number;
  unknown16: number;
  unknown17: number;
  unknown18: number;
  unknown19: number;
  unknown20: number;
  unknown21: number;
}
export interface ClientLog {
  file: string;
  message: string;
}
export interface LoginFailed {
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
export interface Fotomat {
}
export interface InitializationParameters {
  environment: string;
  serverId: number;
}
export interface ClientInitializationDetails {
  unknownDword1: number;
}
export interface ClientAreaTimer {
  Unknown2: number;
  Unknown3: number;
  Unknown4: string;
}
export interface PlayerUpdate.UpdatePosition {
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
  PositionUpdate: any;
}
export interface PlayerUpdateNetworkObjectComponents {
  transientId: any;
  unk1: number;
  unknownArray1: any[];
}
export interface ContinentBattleInfo {
  zones: any[];
}
export interface GetContinentBattleInfo {
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
export interface PlayerUpdate.VehicleCollision {
  transientId: any;
  damage: number;
}
export interface PlayerUpdate.Stop {
  unknownUint: any;
}
export interface PlayerUpdate.AttachObject {
  objects: any[];
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
export interface CharacterSelectSessionRequest {
}
export interface CharacterSelectSessionResponse {
  status: number;
  sessionId: string;
}
export interface SkyChanged {
  unknownDword1: number;
  name: string;
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
  sunAxisY: number;
  sunAxisX: number;
  sunAxisZ: number;
  unknownDword18: number;
  unknownDword19: number;
  unknownDword20: number;
  wind: number;
  unknownDword22: number;
  unknownDword23: number;
  unknownDword24: number;
  unknownDword25: number;
  unknownArray: any[];
}
export interface Combat.AttackTargetDamage {
  unknown1: boolean;
  unknown2: number;
  characterId: string;
  targetId: string;
  unknown5: number;
  unknown6: boolean;
}
export interface Combat.AttackAttackerMissed {
  unknown1: boolean;
  unknown2: number;
  characterId: string;
  targetId: string;
}
export interface Combat.AttackTargetDodged {
  unknown1: boolean;
  unknown2: number;
  characterId: string;
  targetId: string;
}
export interface Combat.EnableBossDisplay {
  unknown2: number;
  characterId: string;
  unknown6: boolean;
}
export interface Combat.AttackTargetBlocked {
  unknown2: number;
  characterId: string;
  targetId: string;
}
export interface Combat.UpdateGrappling {
  unknown1: boolean;
  unknown2: number;
  unknown3: string;
  unknown4: number;
  unknown5: string;
  unknown6: number;
}
export interface PlayerUpdate.Knockback {
  characterId: string;
  unk: number;
  position: number[];
  rotation: number[];
  unk2: number;
}
export interface PlayerUpdate.PlayAnimation {
  characterId: string;
  unk1: number;
  unk2: number;
  unk3: number;
  unk4: number;
}
export interface PlayerUpdate.NpcRelevance {
  npcs: any[];
}
export interface PlayerUpdate.UpdateScale {
  characterId: string;
  scale: number[];
}
export interface PlayerUpdate.UpdateTemporaryAppearance {
  modelId: number;
  characterId: string;
}
export interface PlayerUpdate.RemoveTemporaryAppearance {
  characterId: string;
  modelId?: number;
}
export interface PlayerUpdate.PlayCompositeEffect {
  characterId: string;
  unk1: number;
  unk2: number;
  unk3: number;
  unk4: boolean;
  unk5: boolean;
}
export interface PlayerUpdate.SetLookAt {
  characterId: string;
  targetCharacterId: string;
}
export interface PlayerUpdate.UpdateCharacterState {
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
export interface PlayerUpdate.ExpectedSpeed {
  characterId: string;
  speed: number;
}
export interface PlayerUpdate.ThoughtBubble {
  characterId: string;
  unk1: number;
  unk2: number;
  unk3: boolean;
}
export interface PlayerUpdate.SetDisposition {
  characterId: string;
  disposition: number;
}
export interface PlayerUpdate.LootEvent {
  characterId: string;
  position: number[];
  rotation: number[];
  modelFileName: string;
}
export interface PlayerUpdate.SlotCompositeEffectOverride {
  characterId: string;
  slotId: number;
  effectId: number;
}
export interface PlayerUpdate.EffectPackage {
  unknownQword1: string;
  characterId: string;
  unknownBoolean1: boolean;
  unknownDword1: number;
  stringId: number;
  unknownBoolean2: boolean;
  effectId: number;
  unknownDword4: number;
  unknownDword5: number;
}
export interface PlayerUpdate.AddEffectTagCompositeEffect {
  characterId: string;
  unk1: number;
  unk2: number;
  unk3: string;
  unk4: string;
  unk5: number;
}
export interface PlayerUpdate.CustomizeNpc {
  characterId: string;
  a: number;
  b: number;
  unk1: string;
  unk2: string;
  c: number;
  unk3: boolean;
}
export interface PlayerUpdate.SetSpawnerActivationEffect {
  characterId: string;
  effectId: number;
}
export interface PlayerUpdate.ReplaceBaseModel {
  characterId: string;
  modelId: number;
  unknown3: number;
}
export interface PlayerUpdate.SetCollidable {
  characterId: string;
  collisionEnabled: boolean;
}
export interface PlayerUpdate.UpdateOwner {
  characterId: string;
  unk: number;
}
export interface PlayerUpdate.WeaponStance {
  characterId: string;
  stance: number;
}
export interface PlayerUpdate.MoveOnRail {
  characterId: string;
  unknown4: number;
  unknown5: number;
  position: number[];
}
export interface PlayerUpdate.ClearMovementRail {
  characterId: string;
}
export interface PlayerUpdate.MoveOnRelativeRail {
  characterId: string;
  unknown4: number;
  unknown5: number;
  unknown6: number;
  unknown7: number;
  unknown8: number;
  unknownVector1: number[];
}
export interface PlayerUpdate.Destroyed {
  characterId: string;
  unknown1: number;
  unknown2: number;
  unknown3: number;
  disableWeirdPhysics: boolean;
}
export interface PlayerUpdate.SeekTarget {
  characterId: string;
  TargetCharacterId: string;
  initSpeed: number;
  acceleration: number;
  speed: number;
  unknown8: number;
  yRot: number;
  rotation: number[];
}
export interface PlayerUpdate.SeekTargetUpdate {
  characterId: string;
  TargetCharacterId: string;
}
export interface PlayerUpdate.UpdateActiveWieldType {
  characterId: string;
  filterType: number;
}
export interface PlayerUpdate.LaunchProjectile {
  unknownQword1: string;
  unknownDword1: number;
  unknownDword2: number;
  unknownWord3: boolean;
  unknownWord4: boolean;
  unknownVector1: number[];
  unknownVector2: number[];
  unknownVector3: number[];
  unknownVector4: number[];
  unkstring: string;
  unknownVector5: number[];
  unknownDword6: number;
  unknownDword7: number;
  unknownDword8: number;
  unknownDword9: number;
  unknownDword10: number;
  unknownDword11: number;
  unknownDword12: number;
  unknownDword13: number;
  unknownDword14: number;
  unknownDword15: number;
  unknownDword16: number;
  unknownDword17: number;
  unkstring2: string;
  unknownDword18: number;
  unknownDword19: number;
  unknownDword20: number;
  unknownDword21: number;
  unknownDword22: number;
  unknownDword23: number;
  unknownDword24: number;
  unknownDword25: number;
  unknown26: boolean;
  unknown27: boolean;
  unknownDword28: number;
  unknownDword29: number;
  unknownDword30: number;
  unknownDword31: number;
  unknownDword32: number;
  unknownDword33: number;
  unknownDword34: number;
  unknownDword35: number;
  unknownDword36: number;
  unknown37: number;
  unknown38: number;
  unknown39: number;
  unknownDword40: number;
  unknownDword41: number;
  unknownQword42: string;
  unknownDword42: number;
  unknownDword43: number;
  unknownDword44: number;
  unknownDword45: number;
  unknownVector6: number[];
  unknownDword46: number;
  unknownDword47: number;
  unknownDword48: number;
  unknownDword49: number;
  unknownDword50: number;
  unknownDword51: number;
  unknownDword52: number;
  unknownDword53: number;
  unknownDword54: number;
  unknownDword55: number;
  unknownDword56: number;
  unknownDword57: number;
  unknownDword1: number;
}
export interface PlayerUpdate.HudMessage {
  characterId: string;
  unkguid2: string;
  unknownDword1: number;
  unknownDword2: number;
  unknownDword3: number;
  unknownDword4: number;
  unknownDword5: number;
  unknownDword6: number;
}
export interface PlayerUpdate.CustomizationData {
  customizationData: any[];
}
export interface PlayerUpdate.StartHarvest {
  characterId: string;
  unknown4: number;
  timeMs: number;
  unknown6: number;
  stringId: number;
  unknownGuid: string;
}
export interface PlayerUpdate.KnockedOut {
  characterId: string;
  unknownQword1: string;
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
  unknownDword12: number;
  unknownQword1: string;
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
  unknownDword12: number;
  unknownArray1: any[];
  unknownDword1: number;
  unknownQword1: string;
  unknownQword2: string;
  unknownQword3: string;
  unknownDword2: number;
  unknownDword3: number;
  unknownDword4: number;
  unknownDword5: number;
  unknownDword6: number;
  unknownDword7: number;
  unknownDword8: number;
  unknownVector1: number[];
  unknownDword9: number;
  unknownDword10: number;
  unknownDword11: number;
  unknownDword12: number;
  unknownDword1: number;
}
export interface PlayerUpdate.Respawn {
  respawnType: number;
  respawnGuid: string;
  profileId: number;
}
export interface PlayerUpdate.RespawnReply {
  characterId: string;
  unk: number;
}
export interface PlayerUpdate.SetSpotted {
  unkArray: any[];
  unk1: number;
  unk2: number;
}
export interface PlayerUpdate.Jet {
  characterId: string;
  state: number;
}
export interface PlayerUpdate.SetFaction {
  guid: string;
  factionId: number;
}
export interface PlayerUpdate.SetBattleRank {
  characterId: string;
  battleRank: number;
}
export interface PlayerUpdate.ManagedObject {
  guid: string;
  guid2: string;
  characterId: string;
}
export interface PlayerUpdate.ManagedObjectResponseControl {
  control: number;
  objectCharacterId: string;
}
export interface PlayerUpdate.MaterialTypeOverride {
  characterId: string;
  materialType: number;
}
export interface PlayerUpdate.DebrisLaunch {
  characterId: string;
  unk1: number;
  unk2: number;
  unk3: string;
}
export interface PlayerUpdate.HideCorpse {
  characterId: string;
  unknownBoolean: boolean;
}
export interface PlayerUpdate.CharacterStateDelta {
  guid1: string;
  guid2: string;
  guid3: string;
  guid4: string;
  gameTime: number;
}
export interface PlayerUpdate.UpdateStat {
  characterId: string;
  stats: any[];
}
export interface PlayerUpdate.PlayWorldCompositeEffect {
  soundId: number;
  position: number[];
  unk3: number;
}
export interface PlayerUpdate.AddLightweightPc {
  characterId: string;
  transientId: any;
  unknownDword1: number;
  unknownDword2: number;
  unknownDword3: number;
  characterFirstName: string;
  characterLastName: string;
  unknownByte3: number;
  modelId: number;
  unknownDword5: number;
  position: number[];
  rotation: number[];
  unknownFloat1: number;
  unknownGuid1: string;
  unknownDword6: number;
  unknownDword7: number;
  unknownByte4: number;
  unknownDword8: number;
  unknownDword9: number;
  unknownGuid2: string;
  unknownByte5: number;
}
export interface PlayerUpdate.AddLightweightNpc {
  characterId: string;
  transientId: any;
  string5: string;
  nameId: number;
  spawnId: number;
  facilityId: number;
  factionId: number;
  modelId: number;
  scale: number[];
  texture: string;
  string13: string;
  unknown14: number;
  position: number[];
  rotation: number[];
  unknownVector: number[];
  unknown18: number;
  unknown19: number;
  extraModel: string;
  string21: string;
  string22: string;
  vehicleId: number;
  unknown24: number;
  npcDefinitionId: number;
  positionUpdateType: number;
  profileId: number;
  dontRequestFullData: boolean;
  color: Array;
  MRversion: number;
  unknown31: number;
  unknown32: string;
  targetObjectId: string;
  debugMode: number;
  unknown35: number;
  unknown37: number;
  unknown36: string;
  unknown38: number;
  unknown39: number;
  unknown40: number;
}
export interface PlayerUpdate.AddLightweightVehicle {
  characterId: string;
  transientId: any;
  string5: string;
  nameId: number;
  spawnId: number;
  facilityId: number;
  factionId: number;
  modelId: number;
  scale: number[];
  texture: string;
  string13: string;
  unknown14: number;
  position: number[];
  rotation: number[];
  unknownVector: number[];
  unknown18: number;
  unknown19: number;
  extraModel: string;
  string21: string;
  string22: string;
  vehicleId: number;
  unknown24: number;
  npcDefinitionId: number;
  positionUpdateType: number;
  profileId: number;
  dontRequestFullData: boolean;
  color: Array;
  MRversion: number;
  unknown31: number;
  unknown32: string;
  targetObjectId: string;
  debugMode: number;
  unknown35: number;
  unknown37: number;
  unknown36: string;
  unknown38: number;
  unknown39: number;
  unknown40: number;
  unknownGuid1: string;
  unknownDword1: number;
  unknownDword2: number;
  positionUpdate: any;
  unknownString1: string;
}
export interface PlayerUpdate.AddProxiedObject {
  characterId: string;
  transientId: any;
  unknown5: number;
  position: number[];
  rotation: number[];
  unknown6: number;
  NetworkObjectComponent: any[];
}
export interface PlayerUpdate.LightweightToFullPc {
  transientId: any;
  unknownDword1: number;
  unknownDword2: number;
  unknownDword3: number;
  unknownDword4: number;
  attachments: any[];
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
  unknownboolean1: boolean;
  unknownboolean2: boolean;
  unknownboolean3: boolean;
  effectTags: any[];
  unknownDword9: number;
  unknownDword10: number;
  unknownDword11: number;
  unknownDword12: number;
  unknownDword13: number;
  unknownDword14: number;
  unknownBoolean4: boolean;
  unknownBoolean5: boolean;
  unknownBoolean6: boolean;
  unknownDword15: number;
  unknownDword16: number;
  unknownDword17: number;
  unknownboolean5: boolean;
  unknownboolean6: boolean;
  unknownboolean7: boolean;
  unknownboolean8: boolean;
}
export interface PlayerUpdate.LightweightToFullNpc {
  transientId: any;
  unknownDword1: number;
  unknownDword2: number;
  unknownDword3: number;
  attachments: any[];
  unknownString1: string;
  unknownString2: string;
  unknownDword4: number;
  unknownFloat1: number;
  unknownDword5: number;
  unknownVector1: number[];
  unknownVector2: number[];
  unknownFloat2: number;
  unknownDword6: number;
  unknownDword7: number;
  unknownDword8: number;
  effectTags: any[];
  unknownDword9: number;
  unknownString3: string;
  unknownString4: string;
  unknownDword10: number;
  unknownString5: string;
  unknownVector3: number[];
  unknownDword11: number;
  unknownDword12: number;
  unknownDword13: number;
  unknownGuid: string;
  unknownFloat3: number;
  characterVariables: any[];
  unknownDword14: number;
  unknownFloat4: number;
  unknownVector5: number[];
  unknownDword15: number;
  unknownFloat5: number;
  unknownFloat6: number;
  unknownFloat7: number;
  unknownDword16: number;
  unknownDword17: number;
  unknownDword18: number;
  unknownDword19: number;
  unknownDword21: number;
  unknownByte1: number;
  unknownByte2: number;
  unknownDword22: number;
  unknownDword23: number;
  unknownDword24: number;
  unknownGuid1: string;
  unknownDword25: number;
  unknownGuid2: string;
  unknownDword26: number;
  unknownDword27: number;
  unknownDword28: number;
  unknownDword29: number;
  unknownDword30: number;
  unknownDword31: number;
  unknownDword32: number;
  unk: number;
}
export interface PlayerUpdate.LightweightToFullVehicle {
  transientId: any;
  unknownDword1: number;
  unknownDword2: number;
  unknownDword3: number;
  attachments: any[];
  unknownString1: string;
  unknownString2: string;
  unknownDword4: number;
  unknownFloat1: number;
  unknownDword5: number;
  unknownVector1: number[];
  unknownVector2: number[];
  unknownFloat2: number;
  unknownDword6: number;
  unknownDword7: number;
  unknownDword8: number;
  effectTags: any[];
  unknownDword9: number;
  unknownString3: string;
  unknownString4: string;
  unknownDword10: number;
  unknownString5: string;
  unknownVector3: number[];
  unknownDword11: number;
  unknownDword12: number;
  unknownDword13: number;
  unknownGuid: string;
  unknownFloat3: number;
  characterVariables: any[];
  unknownDword14: number;
  unknownFloat4: number;
  unknownVector5: number[];
  unknownDword15: number;
  unknownFloat5: number;
  unknownFloat6: number;
  unknownFloat7: number;
  unknownDword16: number;
  unknownDword17: number;
  unknownDword18: number;
  unknownDword19: number;
  unknownDword21: number;
  unknownByte1: number;
  unknownByte2: number;
  unknownDword22: number;
  unknownDword23: number;
  unknownDword24: number;
  unknownGuid1: string;
  unknownDword25: number;
  unknownGuid2: string;
  unknownDword26: number;
  unknownDword27: number;
  unknownDword28: number;
  unknownDword29: number;
  unknownDword30: number;
  unknownDword31: number;
  unknownDword32: number;
  unk: number;
  unknownByte1: number;
  unknownDword1: number;
  unknownArray1: any[];
  unknownArray2: any[];
  unknownVector1: number[];
  unknownVector2: number[];
  unknownByte3: number;
  unknownArray3: any[];
  unknownArray4: any[];
  vehicleStats: any[];
  characterStats: any[];
}
export interface PlayerUpdate.FullCharacterDataRequest {
  characterId: string;
}
export interface PlayerUpdate.InitiateNameChange {
  characterId: string;
}
export interface PlayerUpdate.NameChangeResult {
  characterId: string;
  result: number;
  unknown5: number;
  unknown6: number;
}
export interface PlayerUpdate.Deploy {
  characterId: string;
  status: number;
}
export interface PlayerUpdate.LowAmmoUpdate {
  characterId: string;
  status: boolean;
}
export interface PlayerUpdate.KilledBy {
  characterId: string;
  characterId2: string;
  isCheater: boolean;
}
export interface PlayerUpdate.MotorRunning {
  characterId: string;
  isRunning: boolean;
}
export interface PlayerUpdate.DroppedIemNotification {
  itemId: number;
  quantity: number;
}
export interface PlayerUpdate.NoSpaceNotification {
}
export interface PlayerUpdate.StartMultiStateDeath {
  characterId: string;
  unknown4: number;
  unknown5: number;
  unknown6: number;
}
export interface PlayerUpdate.AggroLevel {
  characterId: string;
  aggroLevel: number;
}
export interface PlayerUpdate.DoorState {
  characterId: string;
  doorState: number;
  unknownBoolean: boolean;
}
export interface PlayerUpdate.BeginCharacterAccess {
  characterId: string;
  state: boolean;
  unk1: number;
}
export interface PlayerUpdate.EndCharacterAccess {
}
export interface PlayerUpdate.UpdateMutateRights {
  unknownQword1: string;
  unknownBoolean1: boolean;
}
export interface Ability.ClientMoveAndCast {
  position: number[];
  unk1: number;
  unk2: number;
}
export interface Ability.Failed {
}
export interface Ability.StartCasting {
  characterId: string;
  unkGuid: string;
  unk1: number;
  unk2: number;
  unk3: number;
  unkArray1: any[];
  unk4: number;
  unk5: number;
  unk6: number;
}
export interface Ability.Launch {
  characterId: string;
  unkGuid: string;
  unk1: number;
  weirdAskedByte: number;
  position: number[];
  unkArray1: any[];
  unk2: number;
  unk3: number;
  unk4: number;
  unk5: number;
  unk6: number;
  unk7: number;
  unk8: number;
  unk9: number;
  unk10: number;
  unk11: number;
  unkstring: string;
  unk12: number;
  unk13: number;
  unk14: number;
  unk15: number;
  unk16: number;
  unk17: number;
  unk18: number;
  unk19: number;
  unk20: number;
  unkGuid2: string;
  unk21: boolean;
  unk22: boolean;
}
export interface Ability.Land {
  unknown3: bigint;
  unknown4: number;
  weirdAskedByte: number;
  position: number[];
  unknown7: number;
  position2: number[];
  unknown9: number;
  unknown10: number;
  unknown11: number;
  unknown12: number;
  unknown13: number;
  unknown14: number;
}
export interface Ability.StartChanneling {
  unknown3: bigint;
  unknown4: bigint;
  unknown5: number;
  unknown6: number;
  unknown7: number;
  position: number[];
  unknown9: number;
  unknown10: number;
}
export interface Ability.StopCasting {
  characterId: string;
  unkGuid: string;
  unk1: number;
  unk2: number;
  unk3: number;
}
export interface Ability.StopAura {
  unknown1: number;
  unknown2: number;
}
export interface Ability.AbilityDetails {
  characterId: string;
  unkGuid: string;
  unkGuid2: string;
  unk1: number;
  unk2: number;
  unk3: number;
  unk4: boolean;
  unk5: boolean;
  unk6: number;
}
export interface Ability.SetDefinition {
  unknown1: number;
  unknown2: boolean;
  unknown3: number;
  unknown4: number;
  unknown5: boolean;
  unknown6: bigint;
  unknown7: number;
  unknown8: number;
  unknown9: number;
  unknown10: number;
  unknown11: number;
  unknown12: number;
}
export interface Ability.AddAbilityDefinition {
  unknown1: number;
  array1: any[];
  unknown3: number;
  unknown4: number;
  unknown5: number;
  unknown6: number;
  unknown7: number;
  unknown8: number;
  unknown9: number;
  unknown10: number;
  unknown11: number;
  unknown12: number;
  unknown13: number;
  unknown14: number;
  unknown15: number;
  unknown16: number;
  unknown17: number;
  unknown18: number;
  unknown19: number;
  unknown20: number;
  unknown21: number;
  unknown22: number;
  unknown23: number;
  unknown24: number;
  unknown25: number;
  unknown26: number;
  unknown27: number;
  unknown28: number;
  unknown29: number;
  unknown30: number;
  unknown31: number;
  unknown32: number;
  unknown33: number;
  unknown34: number;
  unknown35: number;
  unknown36: number;
  unknown37: number;
  unknown38: number;
  unknown39: number;
  unknown40: number;
  unknown41: number;
  unknown42: number;
  unknown43: number;
  unknown44: number;
  unknown45: number;
  unknown46: number;
  unknown47: number;
  unknown48: number;
  unknown49: number;
  unknown50: number;
  unknown51: number;
  unknown52: number;
  unknown53: number;
  unknown54: number;
  unknown55: number;
  unknown56: number;
  unknown57: number;
  string19: string;
  array4: any[];
  array7: any[];
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
export interface Ui.TaskAdd {
  Unknown1: boolean;
  Unknown2: boolean;
  Unknown3: boolean;
  Unknown4: number;
  Unknown5: number;
  Unknown6: boolean;
  Unknown7: boolean;
  Unknown8: number;
  Unknown9: boolean;
  Unknown10: number;
  Unknown11: number;
}
export interface Ui.StartTimer {
  time: number;
}
export interface Ui.ResetTimer {
}
export interface Ui.Message {
  stringId: number;
}
export interface Ui.WeaponHitFeedback {
  Unknown1: number;
  isEnemy: boolean;
  Unknown2: number;
}
export interface Ui.HeadShotFeedback {
  Unknown3: boolean;
  Unknown4: boolean;
}
export interface Recipe.List {
  recipes: any[];
}
export interface Acquaintance.Add {
  characterId: string;
  characterName: string;
  type: number;
  elapsedTime: string;
  isOnline: number;
}
export interface Acquaintance.Remove {
}
export interface Acquaintance.Online {
  characterId: string;
  isOnline: boolean;
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
export interface Achievement.Add {
  achievementId: number;
  objectiveId: number;
  nameId: number;
  descriptionId: number;
  unknownByte1: boolean;
  currency: any[];
  unknownDword1: number;
  unknownByte2: number;
  unknownDword2: number;
  unknownDword3: number;
  unknownDword4: number;
  unknownDword5: number;
  unknownDword6: number;
  time: string;
  characterId: string;
  nameId: number;
  unknownDword8: number;
  imageSetId: number;
  entries: any[];
  unknownDword10: number;
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
export interface Loot.Reply {
  items: any[];
}
export interface Mount.MountResponse {
  characterId: string;
  guid: string;
  unknownDword1: number;
  unknownDword2: number;
  unknownDword3: number;
  unknownDword4: number;
  unknownDword1: number;
  unknownDword2: number;
  unknownDword3: number;
  characterName: string;
  unknownString1: string;
  tagString: string;
  unknownDword5: number;
}
export interface Mount.DismountRequest {
  unknownByte1: number;
}
export interface Mount.DismountResponse {
  characterId: string;
  guid: string;
  unknownDword1: number;
  unknownBoolean1: boolean;
  unknownByte1: number;
}
export interface Mount.List {
  List: any[];
}
export interface Mount.SeatChangeRequest {
  seatId: number;
}
export interface Mount.SeatChangeResponse {
  characterId: string;
  vehicleId: string;
  unknownDword1: number;
  unknownDword2: number;
  unknownDword3: number;
}
export interface Mount.SeatSwapRequest {
  characterId: string;
  CharacterId: number;
  AccountId: number;
  unknownDword3: number;
  characterFirstName: string;
  characterLastName: string;
  unknownDword3: number;
}
export interface Target.CharacterGuid {
}
export interface Target.Location {
}
export interface Target.CharacterBone {
}
export interface Target.CharacterBoneId {
}
export interface Target.ActorBone {
  Unk1: number;
  unk2: string;
}
export interface Target.ActorBoneId {
}
export interface Target.Facility {
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
  unknown1: string;
}
export interface Weapon.Weapon {
  weaponPacket: any;
}
export interface Facility.ReferenceData {
  data: any;
}
export interface Facility.FacilityData {
  facilities: any[];
}
export interface Facility.ProximitySpawnCaptureUpdate {
  unknownBoolean1: boolean;
  unknownBoolean2: boolean;
  unknown1: number;
  unknownBoolean3: boolean;
  unknownBoolean4: boolean;
  unknownBoolean5: boolean;
  unknownBoolean6: boolean;
}
export interface Facility.SpawnCollisionChanged {
  unknown1: number;
  unknown2: boolean;
  unknown3: number;
}
export interface Skill.SelectSkill {
  unknownDword1: number;
  unknownWord1: number;
  unknownDword2: number;
}
export interface Skill.SetSkillPointManager {
  unknownDword1: number;
  unknownQword1: string;
  unknownQword2: string;
  unknownQword3: string;
  unknownQword4: string;
  unknownQword5: string;
  unknownDword2: number;
}
export interface Skill.SetSkillPointProgress {
  unknown1: number;
  unknown2: number;
  unknown3: number;
}
export interface Loadout.SetCurrentLoadout {
  guid: string;
  loadoutId: number;
}
export interface Loadout.SelectSlot {
  type: number;
  unknownByte1: number;
  unknownByte2: number;
  loadoutSlotId: number;
  gameTime: number;
}
export interface Loadout.SetCurrentSlot {
  type: number;
  unknownByte1: number;
  slotId: number;
}
export interface Loadout.ActivateVehicleLoadoutTerminal {
  type: number;
  guid: string;
}
export interface Loadout.SetLoadouts {
  type: number;
  guid: string;
  unknownDword1: number;
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
  unknownDword1: number;
  unknownArray1: any[];
  passengers: any[];
  unknownArray2: any[];
  unknownDword1: number;
  unknownDword1: number;
  unknownByte1: number;
  unknownString1: string;
  unknownDword2: number;
  unknownDword3: number;
  unknownDword4: number;
  unknownDword5: number;
  unknownArray3: any[];
  unknownBytes1: any;
  unknownBytes2: any;
}
export interface Vehicle.StateData {
  guid: string;
  unknown3: number;
  unknown4: any[];
  unknown5: any[];
}
export interface Vehicle.StateDamage {
  guid: string;
  unknownVector1: number[];
  unknownVector2: number[];
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
export interface Vehicle.Dismiss {
}
export interface Vehicle.AutoMount {
  guid: string;
  unknownBoolean1: boolean;
  unknownDword1: number;
}
export interface Vehicle.Engine {
  guid1: string;
  guid2: string;
  unknownBoolean: boolean;
}
export interface Vehicle.AccessType {
  vehicleGuid: string;
  accessType: number;
}
export interface Vehicle.HealthUpdateOwner {
  vehicleGuid: string;
  health: number;
}
export interface Vehicle.Expiration {
  expireTime: number;
}
export interface Vehicle.CurrentMoveMode {
  characterId: string;
  moveMode: number;
}
export interface Vehicle.ItemDefinitionRequest {
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
export interface Equipment.SetCharacterEquipmentSlots {
  profileId: number;
  characterId: string;
  gameTime: number;
  slots: any[];
  unknown1: number;
  unknown2: number;
  unknown3: number;
  textures: any[];
  models: any[];
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
export interface WallOfData.ClientSystemInfo {
  ClientSystemInfo: string;
}
export interface WallOfData.LaunchPadFingerprint {
  LaunchPadFingerprint: string;
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
  unknownGuid1: string;
  unknownGuid2: string;
  unknownGuid1: string;
  unknownGuid2: string;
  unknownVector1: number[];
  unknownDword1: number;
  unknownDword2: number;
  unknownDword3: number;
  unknownDword6: number;
  unknownByte1: number;
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
export interface Abilities.InitAbility {
  unknownDword1: number;
  unknownDword2: number;
  unknownDword3: number;
  unknownDword4: number;
  unknownQword1: string;
  unknownQword2: string;
  unknownQword3: string;
  unknownQword4: string;
  unknownFloatVector1: number[];
  unknownWord1: number;
  unknownWord2: number;
  unknownArray1: any[];
  unknownArray2: any[];
  unknownArray3: any[];
  unknownArray4: any[];
  unknownArray5: any[];
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
export interface ClientPcData.SpeechPackList {
  speechPacks: any[];
}
export interface Currency.SetCurrencyDiscount {
  currencyId: number;
  discount: number;
}
export interface ZoneSetting.Data {
  settings: any[];
}
export interface Operation.ClientClearMissions {
}
export interface WordFilter.Data {
  wordFilterData: any;
}
export interface StaticFacilityInfo.AllZones {
  facilities: any[];
}
export interface Container.InitEquippedContainers {
  Unknown2: number;
  EquippedContainers: any[];
}
export interface Construction.PlacementRequest {
}
export interface Construction.PlacementResponse {
  Unknown2: boolean;
  Unknown3: number;
  model: number;
}
export interface Construction.PlacementFinalizeRequest {
  position: number[];
  rotation: number[];
}
export interface Construction.PlacementFinalizeResponse {
  status: boolean;
}
export interface Ragdoll.Stop {
  unknown3: number;
  unknown4: string;
  array1: any[];
  array2: any[];
}
export interface Chat.Chat {
  unknown2: number;
  channel: number;
  characterId1: string;
  characterId2: string;
  unknown5_0: number;
  unknown5_1: number;
  unknown5_2: number;
  characterName1: string;
  unknown5_3: string;
  unknown6_0: number;
  unknown6_1: number;
  unknown6_2: number;
  characterName2: string;
  unknown6_3: string;
  message: string;
  position: number[];
  unknownGuid: string;
  unknown13: number;
  color1: number;
  color2: number;
  unknown15: number;
  unknown16: boolean;
}
export interface Chat.ChatText {
  message: string;
  unknownDword1: number;
  color: Array;
  unknownDword2: number;
  unknownByte3: number;
  unknownByte4: number;
}
export interface Command.PlaySoundAtLocation {
  soundName: string;
  unk1: number;
  unk2: number;
  unk3: number;
}
export interface Command.InteractRequest {
  guid: string;
}
export interface Command.InteractCancel {
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
export interface Command.MoveAndInteract {
  position: number[];
  guid: string;
}
export interface Command.RecipeStart {
  recipeId: number;
}
export interface Command.ShowRecipeWindow {
  characterId: number;
}
export interface Command.PlayDialogEffect {
  characterId: string;
  effectId: number;
}
export interface Command.SetActiveVehicleGuid {
  unknown2: number;
  unknown3: number;
  vehicleId: string;
}
export interface Command.PlaySoundIdOnTarget {
  target: number;
  unk: boolean;
}
export interface Command.SpotPlayerReply {
  guid: string;
  unk1: string;
  unk2: string;
}
export interface Command.InteractionString {
  guid: string;
  stringId: number;
  unknownArray1: any[];
}
export interface Command.PlayersInRadius {
  radius: number;
  unknown: number;
  numberOfPlayer: number;
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
export interface Command.ItemDefinitions {
  data: any;
}
export interface Command.EnableCompositeEffects {
  enabled: boolean;
}
export interface Command.RecipeAction {
}
export interface Command.RequestWeaponFireStateUpdate {
  characterId: string;
}
export interface Command.DeliveryManagerStatus {
  color: number;
  status: number;
  unkString: string;
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
export interface Combat.AttackProcessed {
  unknownQword1: string;
  unknownQword2: string;
  unknownQword3: string;
  unknownDword1: number;
  unknownDword2: number;
  unknownDword3: number;
  unknownBoolean1: boolean;
  unknownBoolean2: boolean;
  unknownDword4: number;
  unknownDword5: number;
}
export interface ClientUpdate.ItemAdd {
  guid: string;
  unknown1: number;
}
export interface ClientUpdate.UpdateStat {
  stats: any[];
}
export interface ClientUpdate.CollectionAddEntry {
  unknownDword1: number;
  unknownDword2: number;
  unknownDword3: number;
  unknownDword4: number;
  unknownDword5: number;
  unknownDword6: number;
  unknownDword7: number;
  unknownBoolean1: boolean;
}
export interface ClientUpdate.CollectionRemoveEntry {
  unknownDword1: number;
  unknownDword2: number;
}
export interface ClientUpdate.UpdateLocation {
  position: number[];
  rotation: number[];
  unknownBool1: boolean;
  movementVersion: number;
}
export interface ClientUpdate.Mana {
  mana: number;
}
export interface ClientUpdate.AddProfileAbilitySetApl {
  unknownDword1: number;
  profiles: any[];
}
export interface ClientUpdate.AddEffectTag {
  unknownDword1: number;
  unknownDword2: number;
  unknownDword3: number;
}
export interface ClientUpdate.ActivateProfile {
  profiles: any;
  attachmentData: any[];
  unknownDword1: number;
  unknownDword3: number;
  actorModel: number;
  unknownString1: string;
  unknownString2: string;
}
export interface ClientUpdate.NotifyPlayer {
  message: string;
}
export interface ClientUpdate.DoneSendingPreloadCharacters {
  unknownBoolean1: number;
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
export interface ClientUpdate.ZonePopulation {
  populations: any[];
}
export interface ClientUpdate.RespawnLocations {
  locations: any[];
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
export interface ClientUpdate.UpdateManagedLocation {
  characterId: string;
  position: number[];
  rotation: number[];
  unk1: number;
  unk2: number;
}
export interface ClientUpdate.ScreenEffect {
  unknown1: number;
  unknownUint: any;
  unknown2: boolean;
  unknown3: boolean;
  unknown4: boolean;
  unknown5: boolean;
  unknown6: boolean;
  unknown7: number;
  unknown8: number;
  vector1: number[];
}
export interface ClientUpdate.MovementVersion {
  version: number;
}
export interface ClientUpdate.ManagedMovementVersion {
  version: any;
  version?: number;
}
export interface ClientUpdate.UpdateWeaponAddClips {
  unknownDword1: number;
  unknownByte1: number;
  unknownFloat1: number;
}
export interface ClientUpdate.DailyRibbonCount {
  unknownDword1: number;
  unknownDword2: number;
  unknownBoolean1: boolean;
}
export interface ClientUpdate.DespawnNpcUpdate {
  characterId: string;
  timeBeforeDespawn: number;
}
export interface ClientUpdate.Freeze {
  frozen: number;
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
export interface InGamePurchase.AccountInfoRequest {
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
export interface Target.AddTarget {
  Unk1: string;
  Unk2: string;
  Unk3: boolean;
}
export interface Target.SetTarget {
  Unk1: string;
  Unk2: string;
  Unk3: boolean;
}
export interface Target.RemoveTarget {
  Unk2: string;
  Unk3: boolean;
}
export interface Target.ClearTarget {
  Unk2: string;
  Unk3: boolean;
}
export interface ProfileStats.GetPlayerProfileStats {
  characterId: string;
}
export interface ProfileStats.PlayerProfileStats {
  unknownDword1: number;
  unknownArray1: any[];
  unknownDword2: number;
  unknownDword3: number;
  unknownDword4: number;
  unknownDword5: number;
  unknownDword6: number;
  unknownDword7: number;
  unknownDword8: number;
  unknownDword1: number;
  unknownArray1: any[];
  unknownDword2: number;
  characterName: string;
  characterId: string;
  battleRank: number;
  unknownDword4: number;
  unknownDword6: number;
  unknownDword7: number;
  unknownByte1: number;
  unknownArray2: any[];
  unknownDword8: number;
  unknownDword9: number;
  unknownDword10: number;
  unknownDword11: number;
  unknownDword12: number;
  unknownArray3: any[];
  unknownDword13: number;
  unknownArray4: any[];
  unknownArray5: any[];
  weaponStats1: any[];
  weaponStats2: any[];
  vehicleStats: any[];
  facilityStats1: any[];
  facilityStats2: any[];
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
  unknownArray1: any[];
  unknownArray2: any[];
}
export interface DtoHitSpeedTreeReport {
  id: number;
  treeId: number;
  name: string;
}
export interface Ragdoll.Start {
  characterId: string;
}
export interface Ragdoll.UpdatePose {
  characterId: string;
  positionUpdate: any;
}
export interface Ragdoll.Unk2 {
  characterId: string;
  unk1: number;
  unkArray1: any[];
  positionUpdate: any;
}
export interface Ragdoll.Unk {
  characterId: string;
  unk1: number;
  unkArray1: any[];
}
export interface PlayerUpdate.RemovePlayer {
  characterId: string;
}
export interface PlayerUpdate.RemovePlayerGracefully {
  characterId: string;
  unknown5: boolean;
  unknown6: number;
  effectDelay: number;
  effectId: number;
  stickyEffectId: number;
  timeToDisappear: number;
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
