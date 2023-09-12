import { SOEServer } from "../../../h1z1-server";

export class EchoServer extends SOEServer {
  constructor(serverPort: number, cryptoKey: Uint8Array) {
    super(serverPort, cryptoKey, true);
    this._crcLength = 0;
    this.packetRatePerClient = Infinity;
    this.on("appdata", (client: any, data: Buffer) => {
      this.sendAppData(client, data);
    });
  }
}
