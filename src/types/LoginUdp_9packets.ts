export interface LoginRequest {
  sessionId: string;
  systemFingerPrint: string;
  Locale?: number;
  ThirdPartyAuthTicket?: number;
  ThirdPartyUserId?: number;
  ThirdPartyId?: number;
}
export interface LoginReply {
  loggedIn: boolean;
  status: number;
  isMember: boolean;
  isInternal: boolean;
  namespace: string;
  ApplicationPayload: any;
}
export interface Logout {
}
export interface ForceDisconnect {
  reason?: number;
}
export interface CharacterCreateRequest {
  serverId: number;
  unknown: number;
  payload: any;
}
export interface CharacterCreateReply {
  status: number;
  characterId: string;
}
export interface CharacterLoginRequest {
  characterId: string;
  serverId: number;
  status?: number;
  payload: any;
}
export interface CharacterLoginReply {
  unknownQword1: string;
  unknownDword1: number;
  unknownDword2: number;
  status: number;
  applicationData: any;
}
export interface CharacterDeleteRequest {
  characterId: string;
}
export interface CharacterDeleteReply {
  characterId: string;
  status: number;
  Payload: string;
}
export interface CharacterSelectInfoRequest {
}
export interface CharacterSelectInfoReply {
  status: number;
  canBypassServerLock: boolean;
  characters: any[];
}
export interface ServerListRequest {
}
export interface ServerListReply {
  servers: any[];
}
export interface ServerUpdate {
  serverId: number;
  serverState: number;
  locked: boolean;
  name: string;
  nameId: number;
  description: string;
  descriptionId: number;
  reqFeatureId: number;
  serverInfo: string;
  populationLevel: number;
  populationData: string;
  allowedAccess: boolean;
}
export interface TunnelAppPacketClientToServer {
}
export interface TunnelAppPacketServerToClient {
}
