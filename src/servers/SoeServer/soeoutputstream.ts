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

import { EventEmitter } from "node:events";
import { RC4 } from "h1emu-core";
import { wrappedUint16 } from "../../utils/utils";
import { dataCache, dataCacheMap } from "types/soeserver";

const debug = require("debug")("SOEOutputStream");

export enum SOEOutputChannels {
  Reliable = "Reliable",
  Raw = "Raw",
  Ordered = "Ordered"
}

export class SOEOutputStream extends EventEmitter {
  private _useEncryption: boolean = false;
  private _fragmentSize: number = 0;
  _reliable_sequence: wrappedUint16 = new wrappedUint16(-1);
  _last_available_reliable_sequence: wrappedUint16 = new wrappedUint16(-1);
  private _order_sequence: wrappedUint16 = new wrappedUint16(-1);
  lastAck: wrappedUint16 = new wrappedUint16(-1);
  private _cache: dataCacheMap = {};
  private _rc4: RC4;
  private hasPendingEmit: boolean = false;
  maxSequenceAvailable: number = 100;
  outOfOrder: Set<number> = new Set();
  constructor(cryptoKey: Uint8Array) {
    super();
    this._rc4 = new RC4(cryptoKey);
  }

  addToCache(sequence: number, data: Uint8Array, isFragment: boolean) {
    this._cache[sequence] = {
      data: data,
      fragment: isFragment,
      sequence: sequence
    };
  }

  removeFromCache(sequence: number): void {
    if (!!this._cache[sequence]) {
      delete this._cache[sequence];
    }
  }

  isReliableAvailable(): boolean {
    const sequenceAreEqual =
      this.lastAck.get() === this._reliable_sequence.get();
    if (sequenceAreEqual) {
      return false;
    }

    const difference =
      this._last_available_reliable_sequence.get() - this.lastAck.get();
    const differenceIsNotTooBig = difference < this.maxSequenceAvailable;
    return differenceIsNotTooBig;
  }

  getAvailableReliableData(): dataCache[] {
    const data: dataCache[] = [];
    const first_LA_sequence = this._last_available_reliable_sequence.get();
    const targetSequence = wrappedUint16.wrap(
      first_LA_sequence + this.maxSequenceAvailable
    );
    let LA_sequence = first_LA_sequence;
    while (LA_sequence !== targetSequence) {
      const sequence = wrappedUint16.wrap(LA_sequence + 1);
      if (!!this._cache[sequence]) {
        data.push(this._cache[sequence]);
        this._last_available_reliable_sequence.set(sequence);
      } else {
        break;
      }
      LA_sequence = sequence;
    }
    return data;
  }

  writeReliable(data: Uint8Array): void {
    if (data.length <= this._fragmentSize) {
      this._reliable_sequence.increment();
      this.addToCache(this._reliable_sequence.get(), data, false);
    } else {
      const header = Buffer.allocUnsafe(4);
      header.writeUInt32BE(data.length, 0);
      data = Buffer.concat([header, data]);
      for (let i = 0; i < data.length; i += this._fragmentSize) {
        this._reliable_sequence.increment();
        const fragmentData = data.slice(i, i + this._fragmentSize);
        this.addToCache(this._reliable_sequence.get(), fragmentData, true);
      }
    }
    if (!this.hasPendingEmit && this.isReliableAvailable()) {
      // So we emit the event only at the end of the current stack
      // it's useful for app functions that send multiple packets
      queueMicrotask(() => {
        this.emit(SOEOutputChannels.Reliable);
        this.hasPendingEmit = false;
      });
    }
  }

  writeOrdered(data: Uint8Array): void {
    if (data.length <= this._fragmentSize) {
      this._order_sequence.increment();
      this.emit(SOEOutputChannels.Ordered, data, this._order_sequence.get());
    } else {
      console.log(
        "ordered packets can't be too large, this packet will be upgraded as a reliable one"
      );
      this.writeReliable(data);
    }
  }

  write(data: Uint8Array, channel: SOEOutputChannels): void {
    if (this._useEncryption) {
      data = Buffer.from(this._rc4.encrypt(data));

      // if the first byte is a 0x00 then we need to add 1 more
      if (data[0] === 0) {
        const tmp = Buffer.alloc(1);
        data = Buffer.concat([tmp, data]);
      }
    }
    switch (channel) {
      case SOEOutputChannels.Reliable:
        this.writeReliable(data);
        break;
      case SOEOutputChannels.Raw:
        this.emit(SOEOutputChannels.Raw, data);
        break;
      case SOEOutputChannels.Ordered:
        this.writeOrdered(data);
        break;
    }
  }

  ack(sequence: number, unAckData: Map<number, number>): void {
    // delete all data / timers cached for the sequences behind the given ack sequence
    while (this.lastAck.get() !== wrappedUint16.wrap(sequence)) {
      const lastAck = this.lastAck.get();
      this.removeFromCache(lastAck);
      unAckData.delete(lastAck);
      this.lastAck.increment();
      // So we clear the last ack at the end of the loop without incrementing it
      if (this.lastAck.get() === wrappedUint16.wrap(sequence)) {
        const lastAck = this.lastAck.get();
        this.removeFromCache(lastAck);
        unAckData.delete(lastAck);
      }
    }
    // When we receive an ack, we can emit the event Reliable so the application can send more data
    this.emit(SOEOutputChannels.Reliable);
  }

  getDataCache(sequence: number): dataCache {
    return this._cache[sequence];
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
