"use strict";
var crc32Table = require("./crctable.js").crc32;
var crcFunctions = require("./crcFunctions");
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
exports.appendCRC = function (data, crcSeed) {
    var genCRC = crcFunctions.cwrap("GenerateCrc", Number, [Buffer, Number, Number]);
    var rnd = Math.random() * 100;
    console.log("try id_" + rnd.toFixed(0));
    console.log("current Javascript generated crc :" + crc32(data, crcSeed >>> 0));
    console.log("generated crc from the c++ function :" + genCRC(data, data.length, crcSeed >>> 0));
    var crc = crc32(data, crcSeed >>> 0);
    var crcBuffer = new Buffer.alloc(2);
    crcBuffer.writeUInt16BE(crc & 0xffff, 0);
    return Buffer.concat([data, crcBuffer]);
};
