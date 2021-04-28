import { convertToInt64 } from "convert_to_int64";
import _ from "lodash";
const restore = require("mongodb-restore-dump");
const valid_character_ids = require("../../data/valid_character_ids.json");
export const Int64String = function (value: number):string {
  return "0x" + ("0000000000000000" + value.toString(16)).substr(-16);
};

export const generateRandomGuid = function ():string {
  let guid: string;
  guid = "0x";
  for (let i: any = 0; i < 16; i++) {
    guid += Math.floor(Math.random() * 16).toString(16) as string;
  }
  return guid;
};

export const getCharacterId = function (index: number):string {
  return `0x${convertToInt64(valid_character_ids[index])}`;
};

export const generateCharacterId = function (usedId: Array<string> = []):string {
  let characterId = null;
  while (characterId === null) {
    const rndIndex = Math.floor(Math.random() * valid_character_ids.length);
    if (usedId.length) {
      // if usedId array is defined
      if (_.findIndex(usedId, valid_character_ids[rndIndex], 0) === -1) {
        // TODO: try this
        characterId = convertToInt64(valid_character_ids[rndIndex]);
      }
    } else {
      characterId = convertToInt64(valid_character_ids[rndIndex]);
    }
  }
  return `0x${characterId}`;
};

export const lz4_decompress = function (
  data: any,
  inSize: number,
  outSize: number
):any {
  const outdata = new (Buffer as any).alloc(outSize);
  let offsetIn = 0,
    offsetOut = 0;

  while (1) {
    const token: any = data[offsetIn];
    let literalLength: any = token >> 4;
    let matchLength: any = token & 0xf;
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
      const matchOffset = data.readUInt16LE(offsetIn);
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
      const matchStart: any = offsetOut - matchOffset;
      const matchEnd: any = offsetOut - matchOffset + matchLength;
      for (let i = matchStart; i < matchEnd; i++) {
        outdata[offsetOut] = outdata[i];
        offsetOut++;
      }
    } else {
      break;
    }
  }
  return outdata;
};

export const initMongo = async function (uri: string, serverName: string):Promise<void> {
  const debug = require("debug")(serverName);

  // restore single database
  await restore.database({
    uri,
    database: "h1server",
    from: `${__dirname}/../../mongodb/h1server/`,
  });
  debug("h1server database was missing... created one with samples.");
};
