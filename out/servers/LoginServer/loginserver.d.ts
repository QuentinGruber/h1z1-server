/// <reference types="node" />
import { EventEmitter } from "events";
import { LoginProtocol } from "../../protocols/loginprotocol";
interface SoeServer {
    on: (arg0: string, arg1: any) => void;
    start: (compression: any, crcSeed: any, crcLength: any, udpLength: any) => void;
    stop: () => void;
    _sendPacket: () => void;
    sendAppData: (arg0: Client, arg1: any, arg2: undefined | any) => void;
    toggleEncryption: (arg0: boolean) => void;
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
export declare class LoginServer extends EventEmitter {
    _soeServer: SoeServer;
    _protocol: LoginProtocol;
    _db: any;
    _mongoClient: any;
    _compression: number;
    _crcSeed: number;
    _crcLength: number;
    _udpLength: number;
    _gameId: number;
    _environment: string;
    _cryptoKey: string;
    _soloMode: boolean;
    constructor(gameId: number, environment: string, serverPort: number, loginKey: string, SoloMode?: boolean);
    start(): Promise<void>;
    data(collectionName: string): any;
    stop(): void;
}
export {};
