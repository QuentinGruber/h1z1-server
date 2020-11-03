/// <reference types="node" />
import { EventEmitter } from "events";
import { GatewayProtocol } from "../../protocols/gatewayprotocol";
interface Packet {
    result: any;
    name: string;
    tunnelData: any;
    flags: any;
}
interface GatewayProtocol {
    pack: (arg0: string, arg1: any) => Packet;
    parse: (arg0: any) => Packet;
}
interface SoeServer {
    on: (arg0: string, arg1: any) => void;
    start: (compression: any, crcSeed: any, crcLength: any, udpLength: any) => void;
    stop: () => void;
    _sendPacket: () => void;
    sendAppData: (arg0: Client, arg1: any, arg2: undefined | any) => void;
    toggleEncryption: () => void;
    setEncryption: (arg0: boolean) => void;
    toggleDataDump: () => void;
    deleteClient: (client: Client) => void;
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
    inputStream: () => void;
    outputStream: () => void;
    outQueueTimer: () => void;
    ackTimer: () => void;
    outOfOrderTimer: () => void;
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
    sendTunnelData(client: Client, tunnelData: any): void;
    stop(): void;
}
export {};
