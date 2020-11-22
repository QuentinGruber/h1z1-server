export function ZoneProxy(remoteAddress: any, remotePort: any, cryptoKey: any, localPort: any, localClientPort: any): void;
export class ZoneProxy {
    constructor(remoteAddress: any, remotePort: any, cryptoKey: any, localPort: any, localClientPort: any);
    _gatewayProxy: GatewayProxy;
    start(): void;
    stop(): void;
}
import GatewayProxy_1 = require("./gatewayproxy");
import GatewayProxy = GatewayProxy_1.GatewayProxy;
