export function SOEProxy(protocolName: any, remoteAddress: any, remotePort: any, cryptoKey: any, localPort: any, localClientPort: any): void;
export class SOEProxy {
    constructor(protocolName: any, remoteAddress: any, remotePort: any, cryptoKey: any, localPort: any, localClientPort: any);
    _server: SOEServer;
    _client: SOEClient;
    _useEncryption: boolean;
    _dumpData: boolean;
    start(): void;
    toggleEncryption(value: any): void;
    toggleDataDump(value: any): void;
    stop(): void;
}
import SOEServer_1 = require("../servers/SoeServer/soeserver");
import SOEServer = SOEServer_1.SOEServer;
import SOEClient_1 = require("../clients/soeclient");
import SOEClient = SOEClient_1.SOEClient;
