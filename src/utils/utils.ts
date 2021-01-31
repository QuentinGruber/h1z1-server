import _ from "lodash";

export const Int64String = function (value: number) {
  return "0x" + ("0000000000000000" + value.toString(16)).substr(-16);
};

export const generateGuid = function (guidList: Array<string> = []) {
  let guid: string;
  do {
    guid = "0x";
    for (var i: any = 0; i < 16; i++) {
      guid += Math.floor(Math.random() * 16).toString(16) as string;
    }
  } while (!_.indexOf(guidList, guid));
  return guid;
};

export const lz4_decompress = function (
  data: any,
  inSize: number,
  outSize: number
) {
  var outdata = new (Buffer as any).alloc(outSize),
    offsetIn = 0,
    offsetOut = 0;

  while (1) {
    var token: any = data[offsetIn];
    var literalLength: any = token >> 4;
    var matchLength: any = token & 0xf;
    offsetIn++;
    if (literalLength) {
      if (literalLength == 0xf) {
        while (data[offsetIn] == 0xff) {
          literalLength += 0xff;
          offsetIn++;
        }
        literalLength += data[offsetIn];
        offsetIn++;
      }
      data.copy(outdata, offsetOut, offsetIn, offsetIn + literalLength);

      offsetIn += literalLength;
      offsetOut += literalLength;
    }

    if (offsetIn < data.length - 2) {
      var matchOffset = data.readUInt16LE(offsetIn);
      offsetIn += 2;

      if (matchLength == 0xf) {
        while (data[offsetIn] == 0xff) {
          matchLength += 0xff;
          offsetIn++;
        }
        matchLength += data[offsetIn];
        offsetIn++;
      }
      matchLength += 4;
      var matchStart: any = offsetOut - matchOffset;
      var matchEnd: any = offsetOut - matchOffset + matchLength;
      for (var i = matchStart; i < matchEnd; i++) {
        outdata[offsetOut] = outdata[i];
        offsetOut++;
      }
    } else {
      break;
    }
  }
  return outdata;
};
