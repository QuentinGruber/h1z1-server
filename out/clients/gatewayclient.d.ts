export function GatewayClient(serverAddress: any, serverPort: any, key: any, localPort: any): void;
export class GatewayClient {
    constructor(serverAddress: any, serverPort: any, key: any, localPort: any);
    _soeClient: SOEClient;
    _protocol: GatewayProtocol;
    connect(callback: any): void;
    sendTunnelData(tunnelData: any, channel: any): void;
    login(characterId: any, ticket: any, clientProtocol: any, clientBuild: any): void;
    disconnect(): void;
}
import SOEClient_1 = require("./soeclient");
import SOEClient = SOEClient_1.SOEClient;
import GatewayProtocol_1 = require("../protocols/gatewayprotocol");
import GatewayProtocol = GatewayProtocol_1.GatewayProtocol;
