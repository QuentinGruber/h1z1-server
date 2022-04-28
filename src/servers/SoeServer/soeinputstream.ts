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
import {
  DATA_HEADER_SIZE,
  MAX_SEQUENCE,
  MAX_UINT8,
} from "../../utils/constants";

const debug = require("debug")("SOEInputStream");
type Fragment = { payload: Buffer; isFragment: boolean };
export class SOEInputStream extends EventEmitter {
  _nextSequence: number = 0;
  _lastAck: number = -1;
  _nextFragment: number = 0;
  _lastProcessedFragmentSequence: number = -1;
  _fragments: Array<Fragment> = [];
  _useEncryption: boolean = false;
  _rc4: RC4;

  constructor(cryptoKey: Uint8Array) {
    super();
    this._rc4 = new RC4(cryptoKey);
  }

  private processSingleData(dataToProcess: Fragment, sequence: number): Array<Buffer> {
    this._lastProcessedFragmentSequence = sequence;
    return parseChannelPacketData(dataToProcess.payload);
  }

  private processFragmentedData(
    dataToProcess: Fragment,
    sequence: number
  ): Array<Buffer> {
    // the total size is written has a uint32 at the first packet of a fragmented data
    const totalSize = dataToProcess.payload.readUInt32BE(0);
    let dataSize = dataToProcess.payload.length - DATA_HEADER_SIZE;

    const dataWithoutHeader = Buffer.alloc(totalSize);

    const processedFragmentsSequences: Array<number> = [sequence];
    for (let i = 1; i < this._fragments.length; i++) {
      const fragmentSequence = (sequence + i) % MAX_SEQUENCE;
      const fragment = this._fragments[fragmentSequence];
      if (fragment) {
        processedFragmentsSequences.push(fragmentSequence);
        dataToProcess.payload.copy(dataWithoutHeader, 0, DATA_HEADER_SIZE);
        fragment.payload.copy(dataWithoutHeader, dataSize);
        dataSize += fragment.payload.length;

        if (dataSize > totalSize) {
          throw (
            "processDataFragments: offset > totalSize: " +
            dataSize +
            " > " +
            totalSize +
            " (sequence " +
            fragmentSequence +
            ") (fragment length " +
            this._fragments.length +
            ")"
          );
        }
        if (dataSize === totalSize) {
          // Delete all the processed fragments from memory
          for (let k = 0; k < processedFragmentsSequences.length; k++) {
            delete this._fragments[processedFragmentsSequences[k]];
          }
          this._lastProcessedFragmentSequence = fragmentSequence;
          // process the full reassembled data
          return parseChannelPacketData(dataWithoutHeader);
        }
      } else {
        return []; // the full data hasn't been received yet
      }
    }
    return []; // if somehow there is no fragments in memory
  }

  private _processData(): void {
    const nextFragmentSequence =
      (this._lastProcessedFragmentSequence + 1) & MAX_SEQUENCE;
    const dataToProcess = this._fragments[nextFragmentSequence];
    let appData: Array<Buffer> = [];
    if (dataToProcess) {
      if (dataToProcess.isFragment) {
        appData = this.processFragmentedData(
          dataToProcess,
          nextFragmentSequence
        );
      } else {
        appData = this.processSingleData(dataToProcess, nextFragmentSequence);
      }

      if (appData.length) {
        this.processAppData(appData);
      }
    }
  }

  private processAppData(appData: Array<Buffer>) {
    for (let i = 0; i < appData.length; i++) {
      let data = appData[i];
      if (this._useEncryption) {
        // sometimes there's an extra 0x00 byte in the beginning that trips up the RC4 decyption
        if (data.length > 1 && data.readUInt16LE(0) === 0) {
          data = Buffer.from(this._rc4.encrypt(data.slice(1)));
        } else {
          data = Buffer.from(this._rc4.encrypt(data));
        }
      }
      this.emit("appdata", null, data); // sending appdata to application
    }
  }

  private acknowledgeInputData(sequence: number): boolean {
    if (sequence > this._nextSequence) {
      debug(
        "Sequence out of order, expected " +
          this._nextSequence +
          " but received " +
          sequence
      );
      // acknowledge that we receive this sequence but do not process it
      // until we're back in order
      this.emit("outoforder", null, this._nextSequence, sequence);
      return false;
    } else {
      let ack = sequence;
      for (let i = 1; i < MAX_SEQUENCE; i++) {
        const j = (this._lastAck + i) & MAX_SEQUENCE;
        if (this._fragments[j]) {
          ack = j;
        } else {
          break;
        }
      }
      if (ack > this._lastAck) {
        this._lastAck = ack;
        // all sequences behind lastAck are acknowledged
        this.emit("ack", null, ack);
      }
      return true;
    }
  }

  write(data: Buffer, sequence: number, isFragment: boolean): void {
    debug(
      "Writing " + data.length + " bytes, sequence " + sequence,
      " fragment=" + isFragment + ", lastAck: " + this._lastAck
    );
    this._fragments[sequence] = { payload: data, isFragment };
    const wasInOrder = this.acknowledgeInputData(sequence);
    if (wasInOrder) {
      this._nextSequence = this._lastAck + 1;
      this._processData();
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
}

function readDataLength(
  data: Buffer,
  offset: number
): { length: number; sizeValueBytes: number } {
  let length = data.readUInt8(offset),
    sizeValueBytes;
  if (length === MAX_UINT8) {
    // if length is MAX_UINT8 then it's maybe a bigger number
    if (data[offset + 1] === MAX_UINT8 && data[offset + 2] === MAX_UINT8) {
      // it's an uint32
      length = data.readUInt32BE(offset + 3);
      sizeValueBytes = 7;
    } else {
      // it's an uint16
      length = data.readUInt16BE(offset + 1);
      sizeValueBytes = 3;
    }
  } else {
    sizeValueBytes = 1;
  }
  return {
    length,
    sizeValueBytes,
  };
}

function parseChannelPacketData(data: Buffer): Array<Buffer> {
  let appData: Array<Buffer> = [],
    offset,
    dataLength;
  if (data[0] === 0x00 && data[1] === 0x19) {
    // if it's a DataFragment packet
    offset = 2;
    while (offset < data.length) {
      dataLength = readDataLength(data, offset);
      offset += dataLength.sizeValueBytes;
      appData.push(data.slice(offset, offset + dataLength.length));
      offset += dataLength.length;
    }
  } else {
    appData = [data];
  }
  return appData;
}
