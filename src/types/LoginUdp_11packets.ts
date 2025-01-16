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
  loggedIn?: boolean;
  status?: number;
  resultCode?: number;
  isMember?: boolean;
  isInternal?: boolean;
  namespace?: string;
  accountFeatures: unknown[];
  applicationPayload :{
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
  unknownBoolean1?: boolean;
  unknownDword11?: number;
  unknownArray1: unknown[];
  unknownString1?: string;
  unknownArray2: unknown[];
  unknownString2?: string;
  unknownString3?: string;
  unknownString4?: string;
  unknownString5?: string;
  unknownString6?: string;
  unknownString7?: string;
};
  unknownArray2: unknown[];
  unknownString2?: string;
  unknownString3?: string;
  unknownBoolean3?: boolean;
  unknownString4?: string;
  ipCountryCode?: string;
  unknownString5?: string;
  unknownString6?: string;
  unknownString7?: string;
  unknownString8?: string;
  unknownString9?: string;
  unknownString10?: string;
  unknownString11?: string;
  unknownDword3?: number;
}
export interface Logout {
}
export interface ForceDisconnect {
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
  encryptionType?: number;
  guid: string;
  unknownQword1?: string;
  unknownString1?: string;
  unknownString2?: string;
  unknownString3?: string;
  serverFeatureBit?: string;
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
  populationLevel?: number;
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
export interface H1emuHadesInit {
  __opcode__?: number;
  authTicket?: string;
  gatewayServer?: string;
}
export interface H1emuHadesQuery {
  __opcode__?: number;
  authTicket?: string;
  gatewayServer?: string;
}
export interface FairPlayInit {
  __opcode__?: number;
}
export interface H1emuCustomQueue {
  __opcode__?: number;
  currentPosition?: string;
  estimatedWaitTime?: string;
}
export type LoginUdp_11packets = LoginRequest | LoginReply | Logout | ForceDisconnect | CharacterCreateRequest | CharacterCreateReply | CharacterLoginRequest | CharacterLoginReply | CharacterDeleteRequest | CharacterDeleteReply | CharacterSelectInfoRequest | CharacterSelectInfoReply | ServerListRequest | ServerListReply | ServerUpdate | TunnelAppPacketClientToServer | TunnelAppPacketServerToClient | H1emuPrintToConsole | H1emuMessageBox | H1emuHadesInit | H1emuHadesQuery | FairPlayInit | H1emuCustomQueue;