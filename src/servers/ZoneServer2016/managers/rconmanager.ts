// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2024 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================
import { WebSocketServer } from "ws";
import crypto from "crypto";
import { promisify } from "util";
export class RConManager {
  wss!: WebSocketServer;
  // TODO: move to config
  wssPort: number = Math.floor(Math.random() * 65535);
  password: string = "password";

  constructor() {}

  decipherMessage(messageRaw: string) {
    const decipher = crypto.createDecipher("aes-256-cbc", this.password);
    let decrypted = decipher.update(messageRaw, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  }

  cipherMessage(messageRaw: string) {
    const cipher = crypto.createCipher("aes-256-cbc", this.password);
    let encrypted = cipher.update(messageRaw, "utf8", "hex");
    encrypted += cipher.final("hex");
    return encrypted;
  }

  handleMessage(ws: WebSocket, messageRaw: string) {
    const messageObj = JSON.parse(this.decipherMessage(messageRaw));
    console.log("messageObj", messageObj);
    ws.send(this.cipherMessage(JSON.stringify({ message: "ok" })));
  }

  start() {
    console.log("RConManager start");
    this.wss = new WebSocketServer({ port: this.wssPort });
    this.wss.on("connection", (ws) => {
      ws.on("message", (message) => {
        console.log("received: %s", message);
      });
      ws.send("something");
    });
  }

  async stop() {
    // const close = promisify(this.wss.close);
    // await close();
  }
}
