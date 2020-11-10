/// <reference types="node" />
export var SOEServer: typeof SOEServer;
declare function SOEServer(protocolName: any, serverPort: any, cryptoKey: any, compression: any, isGatewayServer?: boolean, useCrc64?: boolean): void;
declare class SOEServer {
    constructor(protocolName: any, serverPort: any, cryptoKey: any, compression: any, isGatewayServer?: boolean, useCrc64?: boolean);
    _protocolName: any;
    _serverPort: any;
    _cryptoKey: any;
    _compression: any;
    _protocol: any;
    _udpLength: number;
    _useEncryption: boolean;
    _isGatewayServer: boolean;
    _dumpData: boolean;
    _clients: {};
    _connection: import("dgram").Socket;
    start(compression: any, crcSeed: any, crcLength: any, udpLength: any): void;
    _crcSeed: any;
    _crcLength: any;
    stop(): void;
    _sendPacket(client: any, packetName: any, packet: any, prioritize: any): void;
    sendAppData(client: any, data: any, overrideEncryption: any): void;
    setEncryption(value: any): void;
    toggleEncryption(): void;
    toggleDataDump(value: any): void;
    deleteClient(client: any): void;
}
export {};
