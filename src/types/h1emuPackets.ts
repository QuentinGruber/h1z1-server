export interface SessionRequest {
  serverId: number;
  h1emuVersion: string;
  serverParameters?: string;
}
export interface SessionReply {
  status: number;
}
export interface Ping {
}
export interface CharacterCreateRequest {
  reqId: number;
  characterObjStringify: string;
}
export interface CharacterCreateReply {
  reqId: number;
  status: boolean;
}
export interface CharacterDeleteRequest {
  reqId: number;
  characterId: string;
}
export interface CharacterDeleteReply {
  reqId: number;
  status: boolean;
}
export interface UpdateZonePopulation {
  population: number;
}
export interface ZonePingRequest {
  reqId: number;
  address: string;
}
export interface ZonePingReply {
  reqId: number;
  status: boolean;
}
export interface CharacterExistRequest {
  reqId: number;
  characterId: string;
}
export interface CharacterExistReply {
  reqId: number;
  status: boolean;
}
