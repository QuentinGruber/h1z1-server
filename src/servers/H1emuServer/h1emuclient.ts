import { RemoteInfo } from "dgram";

export class H1emuClient {
  sessionId: number;
  address: string;
  port: number;
  clientUdpLength: number = 512;
  serverUdpLength: number = 512;
  protocolName?: string;
  constructor(
    remote: RemoteInfo,
  ) {
    this.sessionId = 0;
    this.address = remote.address;
    this.port = remote.port;
  }
}
