/* prettier-ignore */ 
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
  applicationPayload: unknown;
}
export interface Logout {
}
export interface ForceDisconnect {
  reason?: number;
}
export interface CharacterCreateRequest {
  serverId: number;
  unknown: number;
  payload :{
  empireId: number;
  headType: number;
  profileType: number;
  gender: number;
  characterName: string;
};
}
export interface CharacterCreateReply {
  status: number;
  characterId: string;
}
export interface CharacterLoginRequest {
  characterId: string;
  serverId: number;
  status?: number;
  payload :{
  locale: string;
  localeId: number;
  preferredGatewayId: number;
};
}
export interface CharacterLoginReply {
  unknownQword1: string;
  unknownDword1: number;
  unknownDword2: number;
  status: number;
  applicationData :{
  serverAddress: string;
  serverTicket: string;
  encryptionKey: unknown;
  guid: string;
  unknownQword2: string;
  stationName: string;
  characterName: string;
  unknownString: string;
};
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
  characters: unknown[];
}
export interface ServerListRequest {
}
export interface ServerListReply {
  servers: unknown[];
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
export type LoginUdp_9packets = LoginRequest | LoginReply | Logout | ForceDisconnect | CharacterCreateRequest | CharacterCreateReply | CharacterLoginRequest | CharacterLoginReply | CharacterDeleteRequest | CharacterDeleteReply | CharacterSelectInfoRequest | CharacterSelectInfoReply | ServerListRequest | ServerListReply | ServerUpdate | TunnelAppPacketClientToServer | TunnelAppPacketServerToClient;