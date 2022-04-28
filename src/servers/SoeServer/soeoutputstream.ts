// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2022 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

import { EventEmitter } from "events";
import { RC4 } from "h1emu-core";
import { dataCache } from "types/soeserver";

const debug = require("debug")("SOEOutputStream");

export class SOEOutputStream extends EventEmitter {
  private _useEncryption: boolean = false;
  private _fragmentSize: number = 0;
  private _sequence: number = -1;
  private _lastAck: number = -1;
  private _cache: dataCache = {};

  private _rc4: RC4;
  private _hadCacheError: boolean = false;
  private _maxCache: number = 25000;
  private _cacheSize: number = 0;
  constructor(cryptoKey: Uint8Array) {
    super();
    this._rc4 = new RC4(cryptoKey);
  }

  addToCache(sequence: number, data: Buffer, isFragment: boolean) {
    if (this._cacheSize < this._maxCache) {
      this._cacheSize++;
      this._cache[sequence] = {
        data: data,
        fragment: isFragment,
      };
    } else {
      console.error("Cache is full, dropping data sequence: " + sequence);
    }
  }

  removeFromCache(sequence: number): void {
    if (!!this._cache[sequence]) {
      this._cacheSize--;
      delete this._cache[sequence];
    }
  }

  write(data: Buffer): void {
    if (this._useEncryption) {
      data = Buffer.from(this._rc4.encrypt(data));

      // if the first byte is a 0x00 then we need to add 1 more
      if (data[0] === 0) {
        const tmp = Buffer.alloc(1);
        data = Buffer.concat([tmp, data]);
      }
    }
    if (data.length <= this._fragmentSize) {
      this._sequence++;
      this.addToCache(this._sequence, data, false);
      this.emit("data", null, data, this._sequence, false);
    } else {
      const header = Buffer.allocUnsafe(4);
      header.writeUInt32BE(data.length, 0);
      data = Buffer.concat([header, data]);
      for (let i = 0; i < data.length; i += this._fragmentSize) {
        this._sequence++;
        const fragmentData = data.slice(i, i + this._fragmentSize);
        this.addToCache(this._sequence, fragmentData, true);

        this.emit("data", null, fragmentData, this._sequence, true);
      }
    }
  }

  ack(sequence: number, unAckData: Map<number,number>): void {
    // delete all data / timers cached for the sequences behind the given ack sequence
    while (this._lastAck <= sequence) {
      this.removeFromCache(this._lastAck);
      if (unAckData.has(this._lastAck)) {
        unAckData.delete(this._lastAck);
      }
      this._lastAck++;
    }
  }

  resendData(sequence: number): void {
    if (this._hadCacheError) {
      return;
    }
    if (this._cache[sequence]) {
      this.emit(
        "dataResend",
        null,
        this._cache[sequence].data,
        sequence,
        this._cache[sequence].fragment
      );
    } else {
      console.error(
        `Cache error, could not resend data for sequence ${sequence}! `
      );
      this._hadCacheError = true;
      this.emit("cacheError");
    }
  }

  isUsingEncryption(): boolean {
    return this._useEncryption;
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
