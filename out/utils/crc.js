"use strict";
var _a = require("./crctable.js"), crc32Table = _a.crc32, crc64Table = _a.crc64;
function crc32(data, crcSeed) {
    var crc = crc32Table[~crcSeed & 0xff];
    crc ^= 0x00ffffff;
    var index = (crcSeed >> 8) ^ crc;
    crc = (crc >> 8) & 0x00ffffff;
    crc ^= crc32Table[index & 0xff];
    index = (crcSeed >> 16) ^ crc;
    crc = (crc >> 8) & 0x00ffffff;
    crc ^= crc32Table[index & 0xff];
    index = (crcSeed >> 24) ^ crc;
    crc = (crc >> 8) & 0x00ffffff;
    crc ^= crc32Table[index & 0xff];
    for (var i = 0; i < data.length; i++) {
        index = data[i] ^ crc;
        crc = (crc >> 8) & 0x00ffffff;
        crc ^= crc32Table[index & 0xff];
    }
    return ~crc >>> 0;
}
function crc64(data, crcSeed) {
    var crc = crc64Table[~crcSeed & 0xff];
    crc ^= 0x00ffffff;
    var index = (crcSeed >> 8) ^ crc;
    crc = (crc >> 8) & 0x00ffffff;
    crc ^= crc64Table[index & 0xff];
    index = (crcSeed >> 16) ^ crc;
    crc = (crc >> 8) & 0x00ffffff;
    crc ^= crc64Table[index & 0xff];
    index = (crcSeed >> 24) ^ crc;
    crc = (crc >> 8) & 0x00ffffff;
    crc ^= crc64Table[index & 0xff];
    for (var i = 0; i < data.length; i++) {
        index = data[i] ^ crc;
        crc = (crc >> 8) & 0x00ffffff;
        crc ^= crc64Table[index & 0xff];
    }
    return ~crc >>> 0;
}
exports.appendCRC = function (data, crcSeed, useCrc64) {
    if (useCrc64 === void 0) { useCrc64 = false; }
    var crc;
    if (useCrc64) {
        crc = crc64(data, crcSeed >>> 0);
    }
    else {
        crc = crc32(data, crcSeed >>> 0);
    }
    var crcBuffer = new Buffer.alloc(2);
    crcBuffer.writeUInt16BE(crc & 0xffff, 0);
    return Buffer.concat([data, crcBuffer]);
};
