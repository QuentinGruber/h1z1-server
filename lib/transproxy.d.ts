/// <reference types="node" />
export var TransparentProxy: typeof TransparentProxy;
declare function TransparentProxy(remoteAddress: any, remotePort: any, localPort: any, localClientPort: any): void;
declare class TransparentProxy {
    constructor(remoteAddress: any, remotePort: any, localPort: any, localClientPort: any);
    _server: import("dgram").Socket;
    _client: import("dgram").Socket;
    _serverPort: any;
    _serverAddress: any;
    _localPort: any;
    _localClientPort: any;
    start(): void;
    stop(): void;
}
export {};
