// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2022 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

const restore = require("mongodb-restore-dump");
import { generate_random_guid } from "h1emu-core";
import v8 from "v8";
import fs, { readdirSync } from "fs";
import { normalize } from "path";
import {
  setImmediate as setImmediatePromise,
  setTimeout as setTimeoutPromise
} from 'timers/promises';

export class customLodash {
  constructor() {}

  cloneDeep(value: any) {
    return v8.deserialize(v8.serialize(value));
  }

  find(array: any[], filter: any) {
    return array.find(filter);
  }

  isEqual(array1: any[], array2: any[]) {
    return (
      Array.isArray(array1) &&
      Array.isArray(array2) &&
      array1.length === array2.length &&
      array1.every((val, index) => val === array2[index])
    );
  }

  forEach(object: Object, callback: Function) {
    const objectLength = Object.keys(object).length;
    const objectValues = Object.values(object);
    for (let index = 0; index < objectLength; index++) {
      callback(objectValues[index]);
    }
  }

  size(object: Object) {
    return Object.keys(object).length;
  }

  fill(array: any[], object: any) {
    for (let index = 0; index < array.length; index++) {
      array[index] = object;
    }
    return array;
  }
  delete(array: any[], entry: any) {
    const index = array.indexOf(entry);
    if (index > -1) {
      array.splice(index, 1);
    }
  }
}

export const _ = new customLodash();

// Original code from GuinnessRules
export function eul2quat(angle: number[]) {
  // Assuming the angles are in radians.
  const heading = angle[0],
    attitude = angle[1],
    bank = -angle[2];
  const c1 = Math.cos(heading / 2);
  const s1 = Math.sin(heading / 2);
  const c2 = Math.cos(attitude / 2);
  const s2 = Math.sin(attitude / 2);
  const c3 = Math.cos(bank / 2);
  const s3 = Math.sin(bank / 2);
  const c1c2 = c1 * c2;
  const s1s2 = s1 * s2;
  const qw = c1c2 * c3 - s1s2 * s3;
  const qy = s1 * c2 * c3 + c1 * s2 * s3;
  const qz = c1c2 * s3 + s1s2 * c3;
  const qx = c1 * s2 * c3 - s1 * c2 * s3;
  return [qx, qy, -qz, qw];
}

export async function zoneShutdown(
  server: any,
  startedTime: number,
  timeLeft: number,
  message: string
) {
  const timeLeftMs = timeLeft * 1000;
  const currentTimeLeft = timeLeftMs - (Date.now() - startedTime);
  if (currentTimeLeft < 0) {
    server.sendDataToAll("WorldShutdownNotice", {
      timeLeft: 0,
      message: message,
    });
    server.sendDataToAll("CharacterSelectSessionResponse", {
      status: 1,
      sessionId: "0", // TODO: get sessionId from client object
    });
    setTimeout(() => {
      process.exit(0);
    }, 5000);
  } else {
    server.sendDataToAll("WorldShutdownNotice", {
      timeLeft: currentTimeLeft / 1000,
      message: message,
    });
    setTimeout(
      () => zoneShutdown(server, startedTime, timeLeft, message),
      timeLeftMs / 5
    );
  }
}

export const randomIntFromInterval = (min: number, max: number) => {
  // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min);
};

export const getAppDataFolderPath = (): string => {
  const folderName = "h1emu";
  return `${process.env.APPDATA || process.env.HOME}/${folderName}`;
};

export const setupAppDataFolder = (): void => {
  const AppDataFolderPath = getAppDataFolderPath();
  if (!fs.existsSync(AppDataFolderPath)) {
    fs.mkdirSync(AppDataFolderPath);
  }
  if (!fs.existsSync(`${AppDataFolderPath}/single_player_characters.json`)) {
    fs.writeFileSync(
      `${AppDataFolderPath}/single_player_characters.json`,
      JSON.stringify([])
    );
  }
  if (
    !fs.existsSync(`${AppDataFolderPath}/single_player_characters2016.json`)
  ) {
    fs.writeFileSync(
      `${AppDataFolderPath}/single_player_characters2016.json`,
      JSON.stringify([])
    );
  }
};

const isBetween = (radius: number, value1: number, value2: number): boolean => {
  return value1 <= value2 + radius && value1 >= value2 - radius;
};

export const isPosInRadius = (
  radius: number,
  player_position: Float32Array,
  enemi_position: Float32Array
): boolean => {
  return (
    isBetween(radius, player_position[0], enemi_position[0]) &&
    isBetween(radius, player_position[2], enemi_position[2])
  );
};

export function getDistance(p1: Float32Array, p2: Float32Array) {
  const a = p1[0] - p2[0];
  const b = p1[1] - p2[1];
  const c = p1[2] - p2[2];
  return Math.sqrt(a * a + b * b + c * c);
}

export function createPositionUpdate(
  position: Float32Array,
  rotation: any,
  gameTime: any
): any {
  const obj: any = {
    flags: 4095,
    unknown2_int32: gameTime,
    unknown3_int8: 0,
    unknown4: 1,
    position: position,
  };
  if (rotation) {
    obj.unknown13_float = rotation;
  }
  return obj;
}

export const Int64String = function (value: number): string {
  return "0x" + ("0000000000000000" + value.toString(16)).substr(-16);
};

export const generateRandomGuid = function (): string {
  return "0x" + generate_random_guid();
};

export const removeCacheFullDir = function (directoryPath:string): void {
  const files = readdirSync(directoryPath); // need to be sync
  for (const file of files){
    if(!file.includes(".")){ // if it's a folder ( this feature isn't tested but should work well )
      removeCacheFullDir(`${directoryPath}/${file}`)
    }
    if(file.substring(file.length - 3) === ".js"){
      delete require.cache[normalize(`${directoryPath}/${file}`)];
    }
  }
};

export const generateCommandList = (
  commandObject: any,
  commandNamespace: string
): string[] => {
  const commandList: string[] = [];
  Object.keys(commandObject).forEach((key) => {
    commandList.push(`/${commandNamespace} ${key}`);
  });
  return commandList;
};

export const lz4_decompress = function (
  // from original implementation
  data: any,
  inSize: number,
  outSize: number
): any {
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

export const initMongo = async function (
  uri: string,
  serverName: string
): Promise<void> {
  const debug = require("debug")(serverName);

  // restore single database
  await restore.database({
    uri,
    database: "h1server",
    from: `${__dirname}/../../mongodb/h1server/`,
  });
  debug("h1server database was missing... created one with samples.");
};

export const getPacketTypeBytes = function (packetType: number): number[] {
  const packetTypeBytes = [];
  while (packetType) {
    packetTypeBytes.unshift(packetType & 0xff);
    packetType = packetType >> 8;
  }
  return packetTypeBytes;
};


// experimental custom implementation of the scheduler API
export class Scheduler {
  constructor() {}
  static async yield() {
    return await setImmediatePromise();
  }
  static async wait(delay:number, options?:any) {
    return await setTimeoutPromise(delay, undefined, { signal: options?.signal });
  }
}