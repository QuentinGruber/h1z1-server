/// <reference types="node" />
import { EventEmitter } from "events";
declare var LoginProtocol: any;
interface SoeClient {
    on: Function;
    emit: Function;
    connect: Function;
    start: Function;
    stop: Function;
    _sessionId: number;
    _protocol: LoginProtocol;
    _sendPacket: Function;
    sendAppData: Function;
    toggleEncryption: Function;
    toggleDataDump: Function;
}
interface LoginProtocol {
    parse: Function;
    pack: Function;
}
export declare class LoginClient extends EventEmitter {
    _gameId: number;
    _environment: string;
    _soeClient: SoeClient;
    _protocol: LoginProtocol;
    constructor(gameId: number, environment: string, serverAddress: string, serverPort: number, loginKey: string, localPort: number);
    connect(): void;
    login(fingerprint: string): Promise<void>;
    disconnect(): void;
    requestServerList(): void;
    requestCharacterInfo(): void;
    requestCharacterLogin(characterId: number, serverId: number, payload: any): void;
    requestCharacterDelete: () => void;
    requestCharacterCreate: () => void;
}
export {};
