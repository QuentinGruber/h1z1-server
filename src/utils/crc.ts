const { crc32: crc32Table } = require("./crctable.js");

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
exports.appendCRC = function (
  data: any,
  crcSeed: number
) {
  const crc = crc32(data, crcSeed >>> 0);
  var crcBuffer = new (Buffer as any).alloc(2);
  crcBuffer.writeUInt16BE(crc & 0xffff, 0);
  return Buffer.concat([data, crcBuffer]);
};
