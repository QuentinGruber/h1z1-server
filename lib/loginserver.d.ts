/// <reference types="node" />
import { EventEmitter } from "events";
declare const LoginProtocol: any;
interface LoginProtocol {
    parse: Function;
    pack: Function;
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
export declare class LoginServer extends EventEmitter {
    _soeServer: SoeServer;
    _protocol: LoginProtocol;
    _db: any;
    _mongoClient: any;
    _usingMongo: boolean;
    _compression: number;
    _crcSeed: number;
    _crcLength: number;
    _udpLength: number;
    _gameId: number;
    _environment: string;
    _cryptoKey: string;
    constructor(gameId: number, environment: string, usingMongo: boolean, serverPort: number, loginKey: string, SoloMode: boolean);
    start(): Promise<void>;
    data(collectionName: string): any;
    stop(): void;
}
export {};
