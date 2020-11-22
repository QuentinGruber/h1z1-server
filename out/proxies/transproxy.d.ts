/// <reference types="node" />
export function TransparentProxy(remoteAddress: any, remotePort: any, localPort: any, localClientPort: any): void;
export class TransparentProxy {
    constructor(remoteAddress: any, remotePort: any, localPort: any, localClientPort: any);
    _server: dgram.Socket;
    _client: dgram.Socket;
    _serverPort: any;
    _serverAddress: any;
    _localPort: any;
    _localClientPort: any;
    start(): void;
    stop(): void;
}
import dgram = require("dgram");
