export interface LoginServerInfo {
    address?: string;
    port: number;
}

export interface ServerInfo {
    serverId : number;
    h1emuVersion: string;
    serverParameters : string;
}

export interface ServerParameters {
    maxPopulation: number;
}

export interface H1emuZoneServerObject {
    serverId: number;
    serverParameters: ServerParameters
}