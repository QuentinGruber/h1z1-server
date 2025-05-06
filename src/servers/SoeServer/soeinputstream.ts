// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2025 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

import { EventEmitter } from "node:events";
import { RC4 } from "h1emu-core";
import { wrappedUint16 } from "../../utils/utils";
import {
  DATA_HEADER_SIZE,
  MAX_SEQUENCE,
  MAX_UINT8
} from "../../utils/constants";

const debug = require("debug")("SOEInputStream");
type appData = { payload: Buffer; isFragment: boolean };
export class SOEInputStream extends EventEmitter {
  _nextSequence: wrappedUint16 = new wrappedUint16(0);
  _lastAck: wrappedUint16 = new wrappedUint16(-1);
  _appDataMap: Map<number, appData> = new Map();
  _useEncryption: boolean = false;
  _lastProcessedSequence: number = -1;
  _rc4: RC4;
  has_cpf: boolean = false;
  cpf_totalSize: number = -1;
  cpf_dataSize: number = -1;
  cpf_dataWithoutHeader!: Buffer;
  cpf_processedFragmentsSequences: number[] = [];

  constructor(cryptoKey: Uint8Array) {
    super();
    this._rc4 = new RC4(cryptoKey);
  }

  private processSingleData(
    dataToProcess: appData,
    sequence: number
  ): Array<Buffer> {
    this._appDataMap.delete(sequence);
    this._lastProcessedSequence = sequence;
    return parseChannelPacketData(dataToProcess.payload);
  }

  private processFragmentedData(firstPacketSequence: number): Array<Buffer> {
    // cpf == current processed fragment
    if (!this.has_cpf) {
      const firstPacket = this._appDataMap.get(firstPacketSequence) as appData; // should be always defined
      // the total size is written has a uint32 at the first packet of a fragmented data
      this.cpf_totalSize = firstPacket.payload.readUInt32BE(0);
      this.cpf_dataSize = 0;

      this.cpf_dataWithoutHeader = Buffer.allocUnsafe(this.cpf_totalSize);
      this.cpf_processedFragmentsSequences = [];
      this.has_cpf = true;
    }
    for (
      let i = this.cpf_processedFragmentsSequences.length;
      i < this._appDataMap.size;
      i++
    ) {
      const fragmentSequence = (firstPacketSequence + i) % MAX_SEQUENCE;
      const fragment = this._appDataMap.get(fragmentSequence);
      if (fragment) {
        const isFirstPacket = fragmentSequence === firstPacketSequence;
        this.cpf_processedFragmentsSequences.push(fragmentSequence);
        fragment.payload.copy(
          this.cpf_dataWithoutHeader,
          this.cpf_dataSize,
          isFirstPacket ? DATA_HEADER_SIZE : 0
        );
        const fragmentDataLen = isFirstPacket
          ? fragment.payload.length - 4
          : fragment.payload.length;
        this.cpf_dataSize += fragmentDataLen;

        if (this.cpf_dataSize > this.cpf_totalSize) {
          this.emit(
            "error",
            new Error(
              "processDataFragments: offset > totalSize: " +
                this.cpf_dataSize +
                " > " +
                this.cpf_totalSize +
                " (sequence " +
                fragmentSequence +
                ") (fragment length " +
                fragment.payload.length +
                ")"
            )
          );
        }
        if (this.cpf_dataSize === this.cpf_totalSize) {
          // Delete all the processed fragments from memory
          for (
            let k = 0;
            k < this.cpf_processedFragmentsSequences.length;
            k++
          ) {
            this._appDataMap.delete(this.cpf_processedFragmentsSequences[k]);
          }
          this._lastProcessedSequence = fragmentSequence;
          this.has_cpf = false;
          // process the full reassembled data
          return parseChannelPacketData(this.cpf_dataWithoutHeader);
        }
      } else {
        return []; // the full data hasn't been received yet
      }
    }
    return []; // if somehow there is no fragments in memory
  }

  private _processData(): void {
    const nextFragmentSequence =
      (this._lastProcessedSequence + 1) & MAX_SEQUENCE;
    const dataToProcess = this._appDataMap.get(nextFragmentSequence);
    if (dataToProcess) {
      let appData: Array<Buffer> = [];

      if (dataToProcess.isFragment) {
        appData = this.processFragmentedData(nextFragmentSequence);
      } else {
        appData = this.processSingleData(dataToProcess, nextFragmentSequence);
      }
      if (appData.length) {
        this.processAppData(appData);
        // In case there is more data to process
        // It can happen when packets are received out of order
        this._processData();
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
      this.emit("appdata", data); // sending appdata to application
    }
  }

  private acknowledgeInputData(sequence: number): boolean {
    if (sequence > this._nextSequence.get()) {
      debug(
        "Sequence out of order, expected " +
          this._nextSequence.get() +
          " but received " +
          sequence
      );
      // acknowledge that we receive this sequence but do not process it
      // until we're back in order
      this.emit("outOfOrder", sequence);
      return false;
    } else {
      let ack = sequence;
      for (let i = 1; i < MAX_SEQUENCE; i++) {
        // TODO: check if MAX_SEQUENCE + 1 is the right value
        const fragmentIndex = (this._lastAck.get() + i) & MAX_SEQUENCE;
        if (this._appDataMap.has(fragmentIndex)) {
          ack = fragmentIndex;
        } else {
          break;
        }
      }
      // all sequences behind lastAck are acknowledged
      this._lastAck.set(ack);
      return true;
    }
  }

  write(data: Buffer, sequence: number, isFragment: boolean): void {
    debug(
      "Writing " + data.length + " bytes, sequence " + sequence,
      " fragment=" + isFragment + ", lastAck: " + this._lastAck.get()
    );
    if (sequence >= this._nextSequence.get()) {
      this._appDataMap.set(sequence, { payload: data, isFragment: isFragment });
      const wasInOrder = this.acknowledgeInputData(sequence);
      if (wasInOrder) {
        this._nextSequence.set(this._lastAck.get() + 1);
        this._processData();
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
    sizeValueBytes
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
