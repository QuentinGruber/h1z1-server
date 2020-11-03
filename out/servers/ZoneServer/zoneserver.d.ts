/// <reference types="node" />
import { EventEmitter } from "events";
interface Client {
    client: {
        characterId: string;
        state: {
            position: number[];
            rotation: number[];
            health: number;
            shield: number;
        };
        client: Client;
    };
    transientId: number;
    transientIds: {};
    character: {
        characterId: string;
        name?: string;
        loadouts?: any;
        currentLoadoutTab?: any;
        currentLoadoutId?: any;
        currentLoadout?: any;
        state: {
            position: number[];
            rotation: number[];
            health: number;
            shield: number;
        };
        client: Client;
    };
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
export declare class ZoneServer extends EventEmitter {
    _gatewayServer: any;
    _protocol: any;
    _clients: any;
    _characters: any;
    _ncps: any;
    _usingMongo: any;
    _serverTime: any;
    _transientId: any;
    _guids: any;
    _packetHandlers: any;
    _referenceData: any;
    _startTime: number;
    _db: any;
    npcs: any;
    constructor(serverPort: number, gatewayKey: string, UsingMongo: boolean);
    start(): Promise<void>;
    data(collectionName: string): any;
    setReferenceData(referenceData: any): void;
    sendSystemMessage(client: Client, message: string): void;
    sendChat(client: Client, message: string, channel: number): void;
    sendChatText(client: Client, message: string): void;
    setCharacterLoadout(client: Client, loadoutId: number, loadoutTab: any): void;
    sendData(client: Client, packetName: string, obj: any): void;
    sendDataToAll(packetName: string, obj: any): void;
    sendWeaponPacket(client: Client, packetName: string, obj: any): void;
    sendRawData(client: Client, data: Buffer): void;
    stop(): void;
    getGameTime(): number;
    getServerTime(): any;
    sendGameTimeSync(client: Client): void;
    generateGuid(): string | undefined;
    getTransientId(client: any, guid: string): any;
    spawnNPC(npcId: number, position: Array<number>, rotation: Array<number>, callback: any): void;
    spawnVehicle(vehicleId: number): void;
    createPositionUpdate(position: Array<number>, rotation: Array<number>): {
        flags: number;
        unknown2_int32: number;
        unknown3_int8: number;
        unknown4: number;
        position: number[];
        unknown6_int32: number;
        unknown7_float: number;
        unknown8_float: number;
        unknown9_float: number;
        unknown10_float: number;
        unknown11_float: number;
        unknown12_float: number[];
        unknown13_float: number[];
        unknown14_float: number;
        unknown15_float: number;
    };
}
export {};
