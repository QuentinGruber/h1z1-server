/// <reference types="node" />
export function SOEServer(protocolName: any, serverPort: any, cryptoKey: any, compression: any, isGatewayServer?: boolean): void;
export class SOEServer {
    constructor(protocolName: any, serverPort: any, cryptoKey: any, compression: any, isGatewayServer?: boolean);
    _protocolName: any;
    _serverPort: any;
    _cryptoKey: any;
    _compression: any;
    _protocol: any;
    _udpLength: number;
    _useEncryption: boolean;
    _isGatewayServer: boolean;
    _clients: {};
    _connection: dgram.Socket;
    start(compression: any, crcSeed: any, crcLength: any, udpLength: any): void;
    _crcSeed: any;
    _crcLength: any;
    stop(): void;
    _sendPacket(client: any, packetName: any, packet: any, prioritize: any): void;
    sendAppData(client: any, data: any, overrideEncryption: any): void;
    setEncryption(value: any): void;
    toggleEncryption(): void;
    deleteClient(client: any): void;
}
import dgram = require("dgram");
