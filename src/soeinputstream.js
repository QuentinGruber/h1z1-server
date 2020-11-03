// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (c) 2020 Quentin Gruber
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

var EventEmitter = require("events").EventEmitter,
  crypto = require("crypto"),
  util = require("util"),
  debug = require("debug")("SOEInputStream");

function SOEInputStream(cryptoKey) {
  EventEmitter.call(this);

  this._sequences = [];
  this._sequenceAdd = 0;
  this._nextSequence = -1;
  this._lastAck = -1;
  this._nextFragment = 0;
  this._lastProcessedFragment = -1;
  this._fragments = new Array(0x10000);
  this._useEncryption = false;
  this._rc4 = crypto.createDecipheriv("rc4", cryptoKey, "");
}
util.inherits(SOEInputStream, EventEmitter);

function ZeroBuffer(length) {
  var buffer = new Buffer.alloc(length);
  for (var i = 0; i < length; i++) {
    buffer[i] = 0;
  }
  return buffer;
}

function readDataLength(data, offset) {
  var dataLength = data.readUInt8(offset),
    n;
  if (dataLength == 0xff) {
    if (data[offset + 1] == 0xff && data[offset + 2] == 0xff) {
      dataLength = data.readUInt32BE(offset + 3);
      n = 7;
    } else {
      dataLength = data.readUInt16BE(offset + 1);
      n = 3;
    }
  } else {
    n = 1;
  }
  return {
    value: dataLength,
    numBytes: n,
  };
}

function parseChannelPacketData(data) {
  var appData = [],
    offset,
    dataLength;
  if (data[0] === 0x00 && data[1] == 0x19) {
    offset = 2;
    while (offset < data.length) {
      dataLength = readDataLength(data, offset);
      offset += dataLength.numBytes;
      appData.push(data.slice(offset, offset + dataLength.value));
      offset += dataLength.value;
    }
  } else {
    appData = [data];
  }
  return appData;
}

SOEInputStream.prototype._processDataFragments = function () {
  var nextFragment = (this._lastProcessedFragment + 1) & 0xffff,
    fragments = this._fragments,
    head = fragments[nextFragment],
    data,
    totalSize,
    dataSize,
    offset,
    fragment,
    appData = [],
    i,
    j,
    k;
  if (head) {
    if (head.singlePacket) {
      this._lastProcessedFragment = nextFragment;
      appData = parseChannelPacketData(head);
      fragments[nextFragment] = null;
    } else {
      totalSize = head.readUInt32BE(0);
      dataSize = head.length - 4;

      data = ZeroBuffer(totalSize);
      head.copy(data, 0, 4);

      var fragmentIndices = [nextFragment];
      for (var i = 1; i < 65536; i++) {
        var j = (nextFragment + i) % 0xffff;
        fragment = fragments[j];
        if (fragment) {
          fragmentIndices.push(j);
          fragment.copy(data, dataSize);
          dataSize += fragment.length;

          if (dataSize > totalSize) {
            throw (
              "processDataFragments: offset > totalSize: " +
              dataSize +
              " > " +
              totalSize +
              " (sequence " +
              j +
              ") (fragment length " +
              fragment.length +
              ")"
            );
          }
          if (dataSize == totalSize) {
            for (k = 0; k < fragmentIndices.length; k++) {
              fragments[fragmentIndices[k]] = null;
            }
            this._lastProcessedFragment = j;
            appData = parseChannelPacketData(data);
            break;
          }
        } else {
          break;
        }
      }
    }
  }

  if (appData.length) {
    for (i = 0; i < appData.length; i++) {
      data = appData[i];
      if (this._useEncryption) {
        // sometimes there's an extra 0x00 byte in the beginning that trips up the RC4 decyption
        if (data.length > 1 && data.readUInt16LE(0) === 0) {
          this._rc4.write(data.slice(1));
        } else {
          this._rc4.write(data);
        }
        data = this._rc4.read();
      }
      this.emit("data", null, data);
    }
    var me = this;
    setTimeout(function () {
      me._processDataFragments();
    }, 0);
    //this._processDataFragments();
  }
};

SOEInputStream.prototype.write = function (data, sequence, fragment) {
  if (this._nextSequence == -1) {
    this._nextSequence = sequence;
  }
  debug(
    "Writing " + data.length + " bytes, sequence " + sequence,
    " fragment=" + fragment + ", lastAck: " + this._lastAck
  );
  this._fragments[sequence] = data;
  if (!fragment) {
    this._fragments[sequence].singlePacket = true;
  }

  //debug(sequence, this._nextSequence);
  if (sequence > this._nextSequence) {
    debug(
      "Sequence out of order, expected " +
        this._nextSequence +
        " but received " +
        sequence
    );
    this.emit("outoforder", null, this._nextSequence, sequence);
  } else {
    var ack = sequence;
    for (var i = 1; i < 65536; i++) {
      var j = (this._lastAck + i) & 0xffff;
      if (this._fragments[j]) {
        ack = j;
      } else {
        break;
      }
    }
    if (ack > this._lastAck) {
      this._lastAck = ack;
      this.emit("ack", null, ack);
    }
    this._nextSequence = (this._lastAck + 1) & 0xffff;

    this._processDataFragments();
  }
};

SOEInputStream.prototype.setEncryption = function (value) {
  this._useEncryption = value;
  debug("encryption: " + this._useEncryption);
};

SOEInputStream.prototype.toggleEncryption = function () {
  this._useEncryption = !this._useEncryption;
  debug("Toggling encryption: " + this._useEncryption);
};

exports.SOEInputStream = SOEInputStream;
