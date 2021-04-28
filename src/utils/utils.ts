const debug = require("debug")("utils")
import _ from "lodash";
const restore = require("mongodb-restore-dump");
const valid_character_ids = require("../../data/valid_character_ids.json");
export const Int64String = function (value: number) {
  return "0x" + ("0000000000000000" + value.toString(16)).substr(-16);
};

export const generateRandomGuid = function () {
  let guid: string;
  guid = "0x";
  for (let i: any = 0; i < 16; i++) {
    guid += Math.floor(Math.random() * 16).toString(16) as string;
  }
  return guid;
};

export function arrayRemove(arr:Array<any>, value:any) { 
  return arr.filter(function(ele){ 
      return ele != value; 
  });
}

export const getCharacterId = function (index: number) {
  return `0x${valid_character_ids[index]}`;
};

export const generateCharacterId = function (usedId: Array<string>) {
  let characterId = null;
  debug(`available ids : ${valid_character_ids.length - usedId.length}`)
  if(usedId.length < valid_character_ids.length){
  while (characterId === null) {
    const rndIndex = Math.floor(Math.random() * valid_character_ids.length);
      const rnd_character_id = valid_character_ids[rndIndex];
      if (_.findIndex(usedId, rnd_character_id, 0) === -1) {
        characterId = rnd_character_id;
        usedId.push(characterId)
      }
  }
  return `0x${characterId}`;
}
  else{
    debug("No more valid character id available :(")
    return `0x000000000000000`;}
};

export const lz4_decompress = function (
  data: any,
  inSize: number,
  outSize: number
) {
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

export const initMongo = async function (uri: string, serverName: string) {
  const debug = require("debug")(serverName);

  // restore single database
  await restore.database({
    uri,
    database: "h1server",
    from: `${__dirname}/../../mongodb/h1server/`,
  });
  debug("h1server database was missing... created one with samples.");
};
