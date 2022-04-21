export interface LoginProtocolReadingFormat {
    serverId?: number,
    unknown?: number,
    subPacketName?: string,
    packetLength?: number,
    name: string,
    result: any,
    type?: number,
}

export interface H1z1ProtocolReadingFormat {
    name: string,
    data: any,
}

export interface GatewayProtocolReadingFormat {
    type: number,
    flags: number,
    fromClient?: boolean,
    tunnelData?: Buffer
    name: string,
    result?: any,
}