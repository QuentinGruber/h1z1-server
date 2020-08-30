/// <reference types="node" />
import { EventEmitter } from "events";
declare const GatewayProtocol: any;
interface GatewayProtocol {
    pack: Function;
    parse: Function;
}
interface SoeServer {
    on: Function;
    start: Function;
    stop: Function;
    _sendPacket: Function;
    sendAppData: Function;
    toggleEncryption: Function;
    toggleDataDump: Function;
}
interface Client {
    sessionId: number;
    address: string;
    port: number;
    crcSeed: number;
    crcLength: number;
    clientUdpLength: number;
    serverUdpLength: number;
    sequences: any;
    compression: number;
    useEncryption: boolean;
    outQueue: any;
    outOfOrderPackets: any;
    nextAck: number;
    lastAck: number;
    inputStream: Function;
    outputStream: Function;
    outQueueTimer: Function;
    ackTimer: Function;
    outOfOrderTimer: Function;
}
export declare class GatewayServer extends EventEmitter {
    _soeServer: SoeServer;
    _protocol: GatewayProtocol;
    _compression: number;
    _crcSeed: number;
    _crcLength: number;
    _udpLength: number;
    constructor(protocolName: string, serverPort: number, gatewayKey: string);
    start(): void;
    sendTunnelData(client: Client, tunnelData: string): void;
    stop(): void;
}
export {};
