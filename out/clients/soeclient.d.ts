/// <reference types="node" />
export function SOEClient(protocolName: any, serverAddress: any, serverPort: any, cryptoKey: any, localPort: any): void;
export class SOEClient {
    constructor(protocolName: any, serverAddress: any, serverPort: any, cryptoKey: any, localPort: any);
    _guid: string;
    _protocolName: any;
    _serverAddress: any;
    _serverPort: any;
    _localPort: any;
    _cryptoKey: any;
    _useEncryption: boolean;
    _dumpData: boolean;
    _outQueue: any[];
    _connection: dgram.Socket;
    _protocol: any;
    _inputStream: SOEInputStream;
    _outputStream: SOEOutputStream;
    connect(): void;
    _sessionId: number | undefined;
    disconnect(): void;
    toggleEncryption(value: any): void;
    toggleDataDump(value: any): void;
    _sendPacket(packetName: any, packet: any, prioritize: any): void;
    sendAppData(data: any, overrideEncryption: any): void;
}
import dgram = require("dgram");
import SOEInputStream_1 = require("../servers/SoeServer/soeinputstream");
import SOEInputStream = SOEInputStream_1.SOEInputStream;
import SOEOutputStream_1 = require("../servers/SoeServer/soeoutputstream");
import SOEOutputStream = SOEOutputStream_1.SOEOutputStream;
