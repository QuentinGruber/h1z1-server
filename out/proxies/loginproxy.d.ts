export function LoginProxy(remoteAddress: any, remotePort: any, cryptoKey: any, localPort: any, localClientPort: any): void;
export class LoginProxy {
    constructor(remoteAddress: any, remotePort: any, cryptoKey: any, localPort: any, localClientPort: any);
    _soeProxy: SOEProxy;
    start(): void;
    stop(): void;
}
import SOEProxy_1 = require("./soeproxy");
import SOEProxy = SOEProxy_1.SOEProxy;
