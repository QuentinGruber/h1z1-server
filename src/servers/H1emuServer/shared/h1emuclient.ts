import { RemoteInfo } from "dgram";

export class H1emuClient {
  sessionId: number;
  address: string;
  port: number;
  session: boolean = false;
  lastPing: number = Date.now();
  clientId: string;

  constructor(remote: RemoteInfo) {
    this.sessionId = 0;
    this.address = remote.address;
    this.port = remote.port;
    this.clientId = `${remote.address}:${remote.port}`;
  }
}
