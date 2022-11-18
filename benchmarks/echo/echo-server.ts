import { SOEServer } from "../../h1z1-server";

export class EchoServer extends SOEServer {
  constructor(serverPort: number, cryptoKey: Uint8Array) {
    super(serverPort, cryptoKey, true);
    this._crcLength = 0;
    this.on("appdata", (client: any, data: Buffer) => {
      // console.log(`Got data from ${client.sessionId} of size ${data.length}`)
      this.sendAppData(client, data);
    });
  }
}
