// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2023 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

import { generate_random_guid } from "h1emu-core";
import v8 from "v8";
import { compress, compressBound } from "./lz4/lz4";
import fs, { readdirSync } from "fs";
import { normalize, resolve } from "path";
import {
  setImmediate as setImmediatePromise,
  setTimeout as setTimeoutPromise,
} from "timers/promises";
import { Collection, MongoClient } from "mongodb";
import { DB_NAME, MAX_TRANSIENT_ID, MAX_UINT16 } from "./constants";
import { ZoneServer2016 } from "servers/ZoneServer2016/zoneserver";
import { ZoneServer2015 } from "servers/ZoneServer2015/zoneserver";
import {
  ConstructionSlotPositionMap,
  positionUpdate,
  SquareBounds,
} from "types/zoneserver";
import { ConstructionSlots } from "servers/ZoneServer2016/data/constructionslots";
import { ConstructionParentEntity } from "servers/ZoneServer2016/entities/constructionparententity";
import { ConstructionChildEntity } from "servers/ZoneServer2016/entities/constructionchildentity";
import { DB_COLLECTIONS, NAME_VALIDATION_STATUS } from "./enums";
import { Resolver } from "dns";
import { ZoneClient2016 } from "servers/ZoneServer2016/classes/zoneclient";

export class customLodash {
  sum(pings: number[]): number {
    return pings.reduce((a, b) => a + b, 0);
  }
  cloneDeep(value: unknown) {
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

  forEach(object: Record<string, unknown>, callback: (arg0: any) => void) {
    const objectLength = Object.keys(object).length;
    const objectValues = Object.values(object);
    for (let index = 0; index < objectLength; index++) {
      callback(objectValues[index]);
    }
  }

  size(object: Record<string, unknown>) {
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

export function isQuat(rotation: Float32Array) {
  return rotation[1] != 0 && rotation[2] != 0 && rotation[3] != 0
    ? rotation
    : eul2quat(rotation);
}

// Original code from GuinnessRules
export function eul2quat(angle: Float32Array): Float32Array {
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
  return new Float32Array([qx, qy, -qz, qw]);
}

export function quat2matrix(angle: Float32Array): any {
  // a little modified for my needs, may not work for other things than construction
  const x = angle[0];
  const y = angle[1];
  const z = angle[2];
  const w = 0;

  const n = w * w + x * x + y * y + z * z;
  const s = n === 0 ? 0 : 2 / n;
  const wx = s * w * x,
    wy = s * w * y,
    wz = s * w * z;
  const xx = s * x * x,
    xy = s * x * y,
    xz = s * x * z;
  const yy = s * y * y,
    yz = s * y * z,
    zz = s * z * z;

  return [
    1 - (yy + zz),
    xy - wz,
    xz + wy,
    xy + wz,
    1 - (xx + zz),
    yz - wx,
    xz - wy,
    yz + wx,
    1 - (xx + yy),
  ];
}

export function eul2quatLegacy(angle: number[]) {
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

export function movePoint(
  position: Float32Array,
  angle: number,
  distance: number
) {
  // angle in radians
  return new Float32Array([
    position[0] + Math.cos(angle) * distance,
    position[1],
    position[2] + Math.sin(angle) * distance,
  ]);
}

export async function zoneShutdown(
  server: ZoneServer2016 | ZoneServer2015,
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

export function getDifference(s1: string, s2: string) {
  s1 = s1.toLowerCase();
  s2 = s2.toLowerCase();
  const costs: any[] = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i == 0) costs[j] = j;
      else {
        if (j > 0) {
          let newValue = costs[j - 1];
          if (s1.charAt(i - 1) != s2.charAt(j - 1))
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  return costs[s2.length];
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
    !fs.existsSync(`${AppDataFolderPath}/single_player_characters2016.json`) ||
    fs
      .readFileSync(`${AppDataFolderPath}/single_player_characters2016.json`)
      .toString() === "{}"
  ) {
    fs.writeFileSync(
      `${AppDataFolderPath}/single_player_characters2016.json`,
      JSON.stringify([])
    );
  }
  if (
    !fs.existsSync(`${AppDataFolderPath}/single_player_charactersKOTK.json`)
  ) {
    fs.writeFileSync(
      `${AppDataFolderPath}/single_player_charactersKOTK.json`,
      JSON.stringify([])
    );
  }
  if (!fs.existsSync(`${AppDataFolderPath}/worlddata`)) {
    fs.mkdirSync(`${AppDataFolderPath}/worlddata`);
  }
  if (!fs.existsSync(`${AppDataFolderPath}/worlddata/vehicles.json`)) {
    fs.writeFileSync(
      `${AppDataFolderPath}/worlddata/vehicles.json`,
      JSON.stringify([])
    );
  }
  if (!fs.existsSync(`${AppDataFolderPath}/worlddata/construction.json`)) {
    fs.writeFileSync(
      `${AppDataFolderPath}/worlddata/construction.json`,
      JSON.stringify([])
    );
  }
  if (!fs.existsSync(`${AppDataFolderPath}/worlddata/worldconstruction.json`)) {
    fs.writeFileSync(
      `${AppDataFolderPath}/worlddata/worldconstruction.json`,
      JSON.stringify([])
    );
  }
  if (!fs.existsSync(`${AppDataFolderPath}/worlddata/crops.json`)) {
    fs.writeFileSync(
      `${AppDataFolderPath}/worlddata/crops.json`,
      JSON.stringify([])
    );
  }
  if (!fs.existsSync(`${AppDataFolderPath}/worlddata/world.json`)) {
    fs.writeFileSync(
      `${AppDataFolderPath}/worlddata/world.json`,
      JSON.stringify({})
    );
  }
};

export const objectIsEmpty = (obj: Record<string, unknown>) => {
  return Object.keys(obj).length === 0;
};

const isBetween = (radius: number, value1: number, value2: number): boolean => {
  return value1 <= value2 + radius && value1 >= value2 - radius;
};

export const isInsideSquare = (
  point: [number, number],
  vs: SquareBounds | number[][]
) => {
  const x = point[0],
    y = point[1];

  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const xi = vs[i][0],
      yi = vs[i][1],
      xj = vs[j][0],
      yj = vs[j][1],
      intersect =
        yi > y != yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
};

export const isInsideCube = (
  point: [number, number],
  vs: SquareBounds,
  y_pos1: number,
  y_pos2: number,
  y_radius: number
) => {
  const x = point[0],
    y = point[1];

  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const xi = vs[i][0],
      yi = vs[i][1],
      xj = vs[j][0],
      yj = vs[j][1],
      intersect =
        yi > y != yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside && isBetween(y_radius, y_pos1, y_pos2);
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
export const isPosInRadiusWithY = (
  radius: number,
  player_position: Float32Array,
  enemi_position: Float32Array,
  y_radius: number
): boolean => {
  return (
    isBetween(radius, player_position[0], enemi_position[0]) &&
    isBetween(radius, player_position[2], enemi_position[2]) &&
    isBetween(y_radius, player_position[1], enemi_position[1])
  );
};

export function getDistance(p1: Float32Array, p2: Float32Array) {
  const a = p1[0] - p2[0];
  const b = p1[1] - p2[1];
  const c = p1[2] - p2[2];
  return Math.sqrt(a * a + b * b + c * c);
}

export function checkConstructionInRange(
  dictionary: any,
  position: Float32Array,
  range: number,
  itemDefinitionId: number
): boolean {
  for (const a in dictionary) {
    const construction = dictionary[a];
    if (construction.itemDefinitionId != itemDefinitionId) continue;
    if (isPosInRadius(range, position, construction.state.position)) {
      return true;
    }
  }
  return false;
}

export function createPositionUpdate(
  position: Float32Array,
  rotation: Float32Array,
  gameTime: number
): positionUpdate {
  const obj: positionUpdate = {
    flags: 4095,
    sequenceTime: gameTime,
    position: [...position],
  };
  if (rotation) {
    obj.rotation = rotation;
  }
  return obj;
}

export function getRectangleCorners(
  centerPoint: Float32Array,
  angle: number,
  offset: number,
  eulerRot: number
): SquareBounds {
  const middlePointA = movePoint(centerPoint, eulerRot, offset / 2);
  const middlePointB = movePoint(
    centerPoint,
    eulerRot + (180 * Math.PI) / 180,
    offset / 2
  );
  const pointA = movePoint(
    middlePointA,
    eulerRot + 90 * (Math.PI / 180),
    angle / 2
  );
  const pointB = movePoint(
    middlePointA,
    eulerRot + 270 * (Math.PI / 180),
    angle / 2
  );
  const pointC = movePoint(
    middlePointB,
    eulerRot + 270 * (Math.PI / 180),
    angle / 2
  );
  const pointD = movePoint(
    middlePointB,
    eulerRot + 90 * (Math.PI / 180),
    angle / 2
  );
  return [
    [pointA[0], pointA[2]],
    [pointB[0], pointB[2]],
    [pointC[0], pointC[2]],
    [pointD[0], pointD[2]],
  ];
}

export const toInt = (value: number) => {
  return Number(value.toFixed(0));
};

export const Int64String = function (value: number): string {
  return "0x" + ("0000000000000000" + value.toString(16)).substr(-16);
};

export const generateRandomGuid = function (): string {
  return "0x" + generate_random_guid();
};

export function* generateTransientId() {
  let id = 0;
  for (let index = 0; index < MAX_TRANSIENT_ID; index++) {
    yield id++;
  }
}

export const removeCacheFullDir = function (directoryPath: string): void {
  const files = readdirSync(directoryPath); // need to be sync
  for (const file of files) {
    if (!file.includes(".")) {
      // if it's a folder ( this feature isn't tested but should work well )
      removeCacheFullDir(`${directoryPath}/${file}`);
    }
    if (file.substring(file.length - 3) === ".js") {
      delete require.cache[normalize(`${directoryPath}/${file}`)];
    }
  }
};

export const generateCommandList = (
  commandObject: string[],
  commandNamespace: string
): string[] => {
  const commandList: string[] = [];
  Object.keys(commandObject).forEach((key) => {
    commandList.push(`/${commandNamespace} ${key}`);
  });
  return commandList;
};

export class LZ4 {
  static encodeBlock: (src: any, dst: any, sIdx?: any, eIdx?: any) => number;
  static encodeBound: (isize: number) => number;
}
LZ4.encodeBlock = compress;
LZ4.encodeBound = compressBound;

export const lz4_decompress = function (
  // from original implementation
  data: any,
  inSize: number,
  outSize: number
): any {
  const outdata = new (Buffer as any).alloc(outSize);
  let offsetIn = 0,
    offsetOut = 0;

  // eslint-disable-next-line no-constant-condition
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
  mongoClient: MongoClient,
  serverName: string
): Promise<void> {
  const debug = require("debug")(serverName);
  const dbName = DB_NAME;
  await mongoClient.db(dbName).createCollection(DB_COLLECTIONS.SERVERS);
  const servers = require("../../data/defaultDatabase/shared/servers.json");
  await mongoClient
    .db(dbName)
    .collection(DB_COLLECTIONS.SERVERS)
    .insertMany(servers);
  debug("h1server database was missing... created one with samples.");
};

export const getPacketTypeBytes = function (packetType: number): number[] {
  const packetTypeBytes = [];
  for (let i = 0; i < 4; i++) {
    packetTypeBytes.unshift(packetType & 0xff);
    packetType = packetType >>> 8;
    if (packetType <= 0) {
      break;
    }
  }
  return packetTypeBytes;
};

export const clearFolderCache = (
  currentFolderDirname: string,
  folderPath: string
) => {
  const resolvedPath = resolve(currentFolderDirname, folderPath);
  Object.keys(require.cache).forEach((key: string) => {
    if (key.includes(resolvedPath)) {
      delete require.cache[key];
    }
  });
};

// experimental custom implementation of the scheduler API
export class Scheduler {
  static async yield() {
    return await setImmediatePromise();
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static async wait(delay: number, options?: any) {
    return await setTimeoutPromise(delay, undefined, {
      signal: options?.signal,
    });
  }
}

export class wrappedUint16 {
  private value: number;
  constructor(initValue: number) {
    if (initValue > MAX_UINT16) {
      throw new Error("wrappedUint16 can only hold values up to 65535");
    }
    this.value = initValue;
  }
  static wrap(value: number) {
    let uint16 = value;
    if (uint16 > MAX_UINT16) {
      uint16 -= MAX_UINT16 + 1; // subtract the overflow value;
    }
    return uint16;
  }
  add(value: number): void {
    this.value = wrappedUint16.wrap(this.value + value);
  }
  set(value: number): void {
    this.value = wrappedUint16.wrap(value);
  }
  get(): number {
    return this.value;
  }
  increment(): void {
    this.add(1);
  }
}

export const toBigHex = (bigInt: bigint): string => {
  return `0x${bigInt.toString(16)}`;
};

export const toHex = (number: number): string => {
  return `0x${number.toString(16)}`;
};

export const getRandomFromArray = (array: any[]): any => {
  return array[Math.floor(Math.random() * array.length)];
};

export const getRandomKeyFromAnObject = (object: any): string => {
  const keys = Object.keys(object);
  return keys[Math.floor(Math.random() * keys.length)];
};

export function calculateDamageDistFallOff(
  distance: number,
  damage: number,
  range: number
) {
  //return damage / (distance * range);
  return damage * Math.pow(range, distance / 10);
}

export function flhash(str: string) {
  let hashvar1 = 0,
    hashvar2 = 0;

  for (let i = 0; i < str.length; i++) {
    hashvar1 = hashvar2 + str.charCodeAt(i);
    hashvar2 = ((1025 * hashvar1) >> 6) ^ (1025 * hashvar1);
  }

  const hash = 32769 * (((9 * hashvar2) >> 11) ^ (9 * hashvar2));

  return Number(`0x${hash.toString(16).slice(-8)}`);
}

export function calculateOrientation(
  pos1: Float32Array,
  pos2: Float32Array
): number {
  return Math.atan2(pos1[2] - pos2[2], pos1[0] - pos2[0]) * -1 - 1.4;
}

export function getOffsetPoint(
  position: Float32Array,
  rotation: number,
  angle: number,
  distance: number
) {
  return movePoint(position, -rotation + (angle * Math.PI) / 180, distance);
}

export function getAngleAndDistance(
  p1: Float32Array,
  p2: Float32Array
): { angle: number; distance: number } {
  const dx = p2[0] - p1[0];
  const dy = p2[2] - p1[2];
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI; // Angle of rotation in degrees
  const distance = Math.sqrt(dx ** 2 + dy ** 2); // Distance between the points
  return { angle, distance };
}

export function getConstructionSlotId(buildingSlot: string) {
  switch (buildingSlot) {
    case "LoveShackDoor":
    case "WoodShackDoor":
      return 1;
    case "WallStack":
      return 101;
    default:
      return Number(
        buildingSlot.substring(buildingSlot.length, buildingSlot.length - 2)
      );
  }
}

export function registerConstructionSlots(
  construction: ConstructionParentEntity | ConstructionChildEntity,
  setSlots: ConstructionSlotPositionMap,
  slotDefinitions: ConstructionSlots
) {
  const slots = slotDefinitions[construction.itemDefinitionId];
  if (slots) {
    slots.offsets.forEach((offset: number, i: number) => {
      const point = getOffsetPoint(
        construction.state.position,
        construction.eulerAngle,
        slots.angles[i],
        slots.offsets[i]
      );
      setSlots[i + 1] = {
        position: new Float32Array([
          point[0],
          construction.state.position[1] + slots.yOffset,
          point[2],
          1,
        ]),
        rotation: new Float32Array([
          construction.eulerAngle + slots.rotationOffsets[i],
          0,
          0,
        ]),
      };
    });
  }
}
// thx GPT i'm not writing regex myself :)
export function isValidCharacterName(characterName: string) {
  // Regular expression that matches all special characters
  const specialCharRegex = /[^\w\s]/gi;

  // Check if the string is only made up of blank characters
  const onlyBlankChars = characterName.replace(/\s/g, "").length === 0;

  // Check if the string contains any special characters
  const hasSpecialChars = specialCharRegex.test(characterName);

  // Return false if the string is only made up of blank characters or contains special characters
  return !onlyBlankChars && !hasSpecialChars
    ? NAME_VALIDATION_STATUS.AVAILABLE
    : NAME_VALIDATION_STATUS.INVALID;
}

export async function resolveHostAddress(
  resolver: Resolver,
  hostName: string
): Promise<string[]> {
  const resolvedAddress = await new Promise((resolve) => {
    resolver.resolve4(hostName, (err, addresses) => {
      if (!err) {
        resolve(addresses);
      } else {
        console.log(
          `Failed to resolve ${hostName} as an host name, it will be used as an IP`
        );
        return [hostName]; // if it can't resolve it, assume that's an IPV4 / IPV6 not an hostname
      }
    });
  });
  return resolvedAddress as string[];
}
export async function logClientActionToMongo(
  collection: Collection,
  client: ZoneClient2016,
  serverId: number,
  logMessage: Record<string, unknown>
) {
  collection.insertOne({
    ...logMessage,
    serverId,
    characterName: client.character.name,
    loginSessionId: client.loginSessionId,
  });
}
