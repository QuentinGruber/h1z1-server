export function GatewayProxy(protocolName: any, remoteAddress: any, remotePort: any, cryptoKey: any, localPort: any, localClientPort: any): void;
export class GatewayProxy {
    constructor(protocolName: any, remoteAddress: any, remotePort: any, cryptoKey: any, localPort: any, localClientPort: any);
    _soeProxy: SOEProxy;
    _dumpData: boolean;
    start(): void;
    stop(): void;
}
import SOEProxy_1 = require("./soeproxy");
import SOEProxy = SOEProxy_1.SOEProxy;
