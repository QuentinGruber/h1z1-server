import { SOEServer } from "../../../h1z1-server";

export class EchoServer extends SOEServer {
  constructor(serverPort: number, cryptoKey: Uint8Array) {
    super(serverPort, cryptoKey);
    this.on("disconnect", (client: any) => {
      this.deleteClient(client);
    });
    this.on("appdata", (client: any, data: Buffer) => {
      this.sendAppData(client, data);
    });
  }
}
