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
  resultCode: number;
  isMember: boolean;
  isInternal: boolean;
  namespace: string;
  accountFeatures: any[];
  applicationPayload?: any;
  errorDetails: any[];
  ipCountryCode: string;
}
export interface Logout {
}
export interface ForceDisconnect {
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
  populationNumber?: number;
  maxPopulationNumber?: number;
  populationData: string;
  AccessExpression?: string;
  allowedAccess: boolean;
}
export interface TunnelAppPacketClientToServer {
  unknown: string;
  data: string;
}
export interface TunnelAppPacketServerToClient {
  unknown1: boolean;
}
export interface H1emuPrintToConsole {
  __opcode__?: number;
  message?: string;
  showConsole?: boolean;
  clearOutput?: boolean;
}
export interface H1emuMessageBox {
  __opcode__?: number;
  title?: string;
  message?: string;
}
export type LoginUdp_11packets = LoginRequest | LoginReply | Logout | ForceDisconnect | CharacterCreateRequest | CharacterCreateReply | CharacterLoginRequest | CharacterLoginReply | CharacterDeleteRequest | CharacterDeleteReply | CharacterSelectInfoRequest | CharacterSelectInfoReply | ServerListRequest | ServerListReply | ServerUpdate | TunnelAppPacketClientToServer | TunnelAppPacketServerToClient | H1emuPrintToConsole | H1emuMessageBox;