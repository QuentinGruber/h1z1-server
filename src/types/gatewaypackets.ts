/* prettier-ignore */ 
export interface LoginRequest {
  characterId: string;
  ticket: string;
  clientProtocol: string;
  clientBuild: string;
}
export interface LoginReply {
  loggedIn: boolean;
}
export interface Logout {
}
export interface ForceDisconnect {
}
export interface ChannelIsRoutable {
  isRoutable: boolean;
}
export interface ConnectionIsNotRoutable {
}
export type gatewaypackets = LoginRequest | LoginReply | Logout | ForceDisconnect | ChannelIsRoutable | ConnectionIsNotRoutable;