const { crc32: crc32Table } = require("./crctable.js");
const crcFunctions = require("./crcFunctions")

function crc32(data: any, crcSeed: number) {
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
exports.appendCRC = crcFunctions.cwrap("AppendCRC", Buffer, [Buffer,Number,Number,Number]);
