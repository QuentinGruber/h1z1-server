export var LoginProxy: typeof LoginProxy;
declare function LoginProxy(remoteAddress: any, remotePort: any, cryptoKey: any, localPort: any, localClientPort: any): void;
declare class LoginProxy {
    constructor(remoteAddress: any, remotePort: any, cryptoKey: any, localPort: any, localClientPort: any);
    _soeProxy: any;
    start(): void;
    stop(): void;
}
export {};
