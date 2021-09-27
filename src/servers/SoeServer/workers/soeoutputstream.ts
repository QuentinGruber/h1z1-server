// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (c) 2020 - 2021 Quentin Gruber
//   copyright (c) 2021 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

import crypto from "crypto";
import { parentPort, workerData } from "worker_threads";
const debug = require("debug")("SOEOutputStream");

export class SOEOutputStream {
  _useEncryption: boolean;
  _fragmentSize: number;
  _sequence: number;
  _lastAck: number;
  _cache: any;
  _rc4: crypto.Cipher;

  constructor(cryptoKey: string, fragmentSize: number) {
    this._useEncryption = false;
    this._fragmentSize = fragmentSize;
    this._sequence = -1;
    this._lastAck = -1;
    this._cache = {};
    this._rc4 = crypto.createCipheriv("rc4", cryptoKey, null);
  }

  write(data: Buffer, overrideEncryption: boolean): void {
    if (this._useEncryption && overrideEncryption !== false) {
      this._rc4.write(data);
      data = this._rc4.read();
      if (data[0] === 0) {
        const tmp = Buffer.alloc(1);
        tmp[0] = 0;
        data = Buffer.concat([tmp, data]);
      }
    }
    if (data.length <= this._fragmentSize) {
      this._sequence++;
      this._cache[this._sequence] = {
        data: data,
        fragment: false,
      };
      parentPort?.postMessage({
        data: data,
        sequence: this._sequence,
        fragment:false,
      });
    } else {
      const header = new (Buffer as any).alloc(4);
      header.writeUInt32BE(data.length, 0);
      data = Buffer.concat([header, data]);
      for (let i = 0; i < data.length; i += this._fragmentSize) {
        this._sequence++;
        const fragmentData = data.slice(i, i + this._fragmentSize);
        this._cache[this._sequence] = {
          data: fragmentData,
          fragment: true,
        };
        parentPort?.postMessage({
          data: fragmentData,
          sequence: this._sequence,
          fragment:true,
        });
      }
    }
  }

  ack(sequence: number): void {
    while (this._lastAck <= sequence) {
      if (this._cache[this._lastAck]) {
        delete this._cache[this._lastAck];
      }
      this._lastAck++;
    }
  }

  resendData(sequence: number): void {
    const start = this._lastAck + 1;
    for (let i = start; i < sequence; i++) {
      if (this._cache[i]) {
        parentPort?.postMessage({
          data: this._cache[i].data,
          sequence: i,
          fragment:this._cache[i].fragment,
        });
      } else {
        throw "Cache error, could not resend data!";
      }
    }
  }

  setEncryption(value: boolean): void {
    this._useEncryption = value;
    debug("encryption: " + this._useEncryption);
  }

  toggleEncryption(): void {
    this._useEncryption = !this._useEncryption;
    debug("Toggling encryption: " + this._useEncryption);
  }

  setFragmentSize(value: number): void {
    this._fragmentSize = value;
  }
  
}

const outputStream = new SOEOutputStream(workerData.cryptoKey as any,0);

interface Message {
  type: string;
  data?: any;
}

parentPort?.on("message", (message: Message) => {
  switch (message.type) {
    case "write":{
      const { data:{data,overrideEncryption} } = message;
      outputStream.write(data,overrideEncryption)
      break;
    }
    case "setEncryption":{
      const { data } = message;
      outputStream.setEncryption(data);
      break;
    }
    case "toggleEncryption":{
      outputStream.toggleEncryption();
      break;
    }
    case "ack":{
      const { data } = message;
      outputStream.ack(data);
      break;
    }
    case "resendData":{
      const { data } = message;
      outputStream.resendData(data);
      break;
    }
    case "setFragmentSize":{
      const { data } = message;
      outputStream.setFragmentSize(data);
      break;
    }
    case "kill":{
      process.exit(0);
    }
    default:
      break;
  }
});