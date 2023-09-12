// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2023 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

import { EventEmitter } from "node:events";
import { RC4 } from "h1emu-core";
import { wrappedUint16 } from "../../utils/utils";
import { dataCache } from "types/soeserver";

const debug = require("debug")("SOEOutputStream");

export class SOEOutputStream extends EventEmitter {
  private _useEncryption: boolean = false;
  private _fragmentSize: number = 0;
  private _sequence: wrappedUint16 = new wrappedUint16(-1);
  lastAck: wrappedUint16 = new wrappedUint16(-1);
  private _cache: dataCache = {};

  private _rc4: RC4;
  private _hadCacheError: boolean = false;
  constructor(cryptoKey: Uint8Array) {
    super();
    this._rc4 = new RC4(cryptoKey);
  }

  addToCache(sequence: number, data: Uint8Array, isFragment: boolean) {
    this._cache[sequence] = {
      data: data,
      fragment: isFragment
    };
  }

  removeFromCache(sequence: number): void {
    if (!!this._cache[sequence]) {
      delete this._cache[sequence];
    }
  }

  write(data: Uint8Array, unbuffered: boolean = false): void {
    if (this._useEncryption) {
      data = Buffer.from(this._rc4.encrypt(data));

      // if the first byte is a 0x00 then we need to add 1 more
      if (data[0] === 0) {
        const tmp = Buffer.alloc(1);
        data = Buffer.concat([tmp, data]);
      }
    }
    if (data.length <= this._fragmentSize) {
      this._sequence.increment();
      this.addToCache(this._sequence.get(), data, false);
      this.emit("data", data, this._sequence.get(), false, unbuffered);
    } else {
      const header = Buffer.allocUnsafe(4);
      header.writeUInt32BE(data.length, 0);
      data = Buffer.concat([header, data]);
      for (let i = 0; i < data.length; i += this._fragmentSize) {
        this._sequence.increment();
        const fragmentData = data.slice(i, i + this._fragmentSize);
        this.addToCache(this._sequence.get(), fragmentData, true);

        this.emit("data", fragmentData, this._sequence.get(), true, unbuffered);
      }
    }
  }

  ack(sequence: number, unAckData: Map<number, number>): void {
    // delete all data / timers cached for the sequences behind the given ack sequence
    while (this.lastAck.get() !== wrappedUint16.wrap(sequence + 1)) {
      const lastAck = this.lastAck.get();
      this.removeFromCache(lastAck);
      unAckData.delete(lastAck);
      this.lastAck.increment();
    }
  }

  resendData(sequence: number): void {
    if (this._cache[sequence]) {
      this.emit(
        "dataResend",
        this._cache[sequence].data,
        sequence,
        this._cache[sequence].fragment
      );
    } else {
      // already deleted from cache so already acknowledged by the client not a real issue
      debug(`Cache error, could not resend data for sequence ${sequence}! `);
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
