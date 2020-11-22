export function ZoneClient(serverAddress: any, serverPort: any, key: any, characterId: any, ticket: any, clientProtocol: any, clientBuild: any, localPort: any): void;
export class ZoneClient {
    constructor(serverAddress: any, serverPort: any, key: any, characterId: any, ticket: any, clientProtocol: any, clientBuild: any, localPort: any);
    _gatewayClient: GatewayClient;
    _protocol: ZoneProtocol;
    _characterId: any;
    _ticket: any;
    _clientProtocol: any;
    _clientBuild: any;
    _environment: string;
    _serverId: number;
    connect(): void;
    login(): void;
    disconnect(): void;
    setReferenceData(data: any): void;
    _referenceData: any;
}
import GatewayClient_1 = require("./gatewayclient");
import GatewayClient = GatewayClient_1.GatewayClient;
import ZoneProtocol_1 = require("../protocols/archived/zoneprotocol");
import ZoneProtocol = ZoneProtocol_1.ZoneProtocol;
