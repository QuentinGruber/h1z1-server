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
import { EventEmitter } from "events";

const debug = require("debug")("SOEOutputStream");

export class SOEOutputStream extends EventEmitter {
  _useEncryption: boolean;
  _fragmentSize: number;
  _sequence: number;
  _lastAck: number;
  _cache: any;
  _rc4: crypto.Cipher;
  _enableCaching: boolean;

  constructor(cryptoKey: string, fragmentSize: number) {
    super();
    this._useEncryption = false;
    this._fragmentSize = fragmentSize;
    this._sequence = -1;
    this._lastAck = -1;
    this._cache = {};
    this._enableCaching = true;
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
      if(this._enableCaching){
        this._cache[this._sequence] = {
          data: data,
          fragment: false,
        };
    }
      this.emit("data", null, data, this._sequence, false);
    } else {
      const header = new (Buffer as any).alloc(4);
      header.writeUInt32BE(data.length, 0);
      data = Buffer.concat([header, data]);
      for (let i = 0; i < data.length; i += this._fragmentSize) {
        this._sequence++;
        const fragmentData = data.slice(i, i + this._fragmentSize);
        if(this._enableCaching){
          this._cache[this._sequence] = {
            data: fragmentData,
            fragment: true,
          };
        }
        this.emit("data", null, fragmentData, this._sequence, true);
      }
    }
  }

  ack(sequence: number): void {
    while (this._lastAck <= sequence) {
      if (this._enableCaching && this._cache[this._lastAck]) {
        delete this._cache[this._lastAck];
      }
      this._lastAck++;
    }
  }

  resendData(sequence: number): void {
    const start = this._lastAck + 1;
    for (let i = start; i < sequence; i++) {
      if (this._cache[i]) {
        this.emit(
          "data",
          null,
          this._cache[i].data,
          i,
          this._cache[i].fragment
        );
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

exports.SOEOutputStream = SOEOutputStream;
