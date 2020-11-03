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
  debug = require("debug")("SOEOutputStream");

function SOEOutputStream(cryptoKey, fragmentSize) {
  EventEmitter.call(this);
  this._useEncryption = false;
  this._fragmentSize = fragmentSize;
  this._sequence = -1;
  this._lastAck = -1;
  this._cache = [];
  this._rc4 = crypto.createCipheriv("rc4", cryptoKey, "");
}
util.inherits(SOEOutputStream, EventEmitter);

SOEOutputStream.prototype.write = function (data, overrideEncryption) {
  if (this._useEncryption && overrideEncryption !== false) {
    this._rc4.write(data);
    data = this._rc4.read();
    if (data[0] == 0) {
      var tmp = new Buffer.alloc(1);
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
    this.emit("data", null, data, this._sequence, false);
  } else {
    var header = new Buffer.alloc(4),
      fragments = [];
    header.writeUInt32BE(data.length, 0);
    data = Buffer.concat([header, data]);
    for (var i = 0; i < data.length; i += this._fragmentSize) {
      this._sequence++;
      var fragmentData = data.slice(i, i + this._fragmentSize);
      this._cache[this._sequence] = {
        data: fragmentData,
        fragment: true,
      };
      this.emit("data", null, fragmentData, this._sequence, true);
    }
  }
};

SOEOutputStream.prototype.ack = function (sequence) {
  while (this._lastAck <= sequence) {
    this._lastAck++;
    if (this._cache[this._lastAck]) {
      delete this._cache[this._lastAck];
    }
  }
};

SOEOutputStream.prototype.resendData = function (sequence) {
  var start = this._lastAck + 1;
  for (var i = start; i < sequence; i++) {
    if (this._cache[i]) {
      this.emit("data", null, this._cache[i].data, i, this._cache[i].fragment);
    } else {
      throw "Cache error, could not resend data!";
    }
  }
};

SOEOutputStream.prototype.setEncryption = function (value) {
  this._useEncryption = value;
  debug("encryption: " + this._useEncryption);
};

SOEOutputStream.prototype.toggleEncryption = function () {
  this._useEncryption = !this._useEncryption;
  debug("Toggling encryption: " + this._useEncryption);
};

SOEOutputStream.prototype.setFragmentSize = function (value) {
  this._fragmentSize = value;
};

exports.SOEOutputStream = SOEOutputStream;
