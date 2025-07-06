// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2025 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================
import { generate_random_guid } from "h1emu-core";
import { compress, compressBound } from "./lz4/lz4";
import fs, { readdirSync } from "node:fs";
import path, { normalize, resolve } from "node:path";
import { Collection, MongoClient } from "mongodb";
import { DB_NAME, MAX_TRANSIENT_ID, MAX_UINT16, MAX_UINT32 } from "./constants";
import { ZoneServer2016 } from "servers/ZoneServer2016/zoneserver";
import { ZoneServer2015 } from "servers/ZoneServer2015/zoneserver";
import {
  ConstructionSlotPositionMap,
  CubeBounds,
  Point3D,
  positionUpdate,
  SquareBounds
} from "types/zoneserver";
import { ConstructionSlots } from "servers/ZoneServer2016/data/constructionslots";
import { ConstructionParentEntity } from "servers/ZoneServer2016/entities/constructionparententity";
import { ConstructionChildEntity } from "servers/ZoneServer2016/entities/constructionchildentity";
import { DB_COLLECTIONS, NAME_VALIDATION_STATUS } from "./enums";
import { Resolver } from "node:dns";
import { ZoneClient2016 } from "servers/ZoneServer2016/classes/zoneclient";
import * as crypto from "crypto";
import { ZoneClient } from "servers/ZoneServer2015/classes/zoneclient";

const startTime = Date.now();

/**
 * Represents a custom implementation of lodash library.
 */
export class customLodash {
  /**
   * Calculate the sum of numbers in an array.
   * @param pings - The array of numbers.
   * @returns The sum of numbers.
   */
  sum(pings: number[]): number {
    return pings.reduce((a, b) => a + b, 0);
  }

  /**
   * Create a deep clone of the given value.
   * @param value - The value to clone.
   * @returns The cloned value.
   */
  cloneDeep(value: unknown): unknown {
    return structuredClone(value);
  }

  /**
   * Find the first element in the array that satisfies the filter function.
   * @param array - The array to search in.
   * @param filter - The filter function.
   * @returns The first matching element, or undefined if not found.
   */
  find(array: any[], filter: any) {
    return array.find(filter);
  }

  /**
   * Check if two arrays are equal.
   * @param array1 - The first array.
   * @param array2 - The second array.
   * @returns True if the arrays are equal, false otherwise.
   */
  isEqual(array1: any[], array2: any[]) {
    return (
      Array.isArray(array1) &&
      Array.isArray(array2) &&
      array1.length === array2.length &&
      array1.every((val, index) => val === array2[index])
    );
  }

  /**
   * Iterates over each property in the given object and invokes the provided callback function.
   *
   * @param object - The object to iterate over.
   * @param callback - The function to be called for each property in the object.
   */
  forEach(object: Record<string, unknown>, callback: (arg0: any) => void) {
    const objectLength = Object.keys(object).length;
    const objectValues = Object.values(object);
    for (let index = 0; index < objectLength; index++) {
      callback(objectValues[index]);
    }
  }

  /**
   * Calculates and returns the number of properties in the given object.
   *
   * @param object - The object to get the size of.
   * @returns The number of properties in the object.
   */
  size(object: Record<string, unknown>) {
    return Object.keys(object).length;
  }

  /**
   * Fills the provided array with the specified object.
   *
   * @param array - The array to fill.
   * @param object - The object to fill the array with.
   * @returns The modified array after filling.
   */
  fill(array: any[], object: any) {
    for (let index = 0; index < array.length; index++) {
      array[index] = object;
    }
    return array;
  }

  /**
   * Deletes the specified entry from the given array.
   *
   * @param array - The array to delete the entry from.
   * @param entry - The entry to delete from the array.
   */
  delete(array: any[], entry: any) {
    const index = array.indexOf(entry);
    if (index > -1) {
      array.splice(index, 1);
    }
  }
}

export const _ = new customLodash();

/**
 * Checks if the given rotation is a quaternion. If not, converts the Euler angles to a quaternion.
 *
 * @param rotation - The rotation to check or convert, represented as a Float32Array.
 * @returns The quaternion representation of the rotation.
 */
export function isQuat(rotation: Float32Array) {
  return rotation[1] != 0 && rotation[2] != 0 && rotation[3] != 0
    ? rotation
    : eul2quat(rotation);
}

/**
 * Converts Euler angles to a quaternion representation.
 *
 * @param angle - The Euler angles to convert, represented as a Float32Array.
 * @returns The quaternion representation of the Euler angles.
 */
export function eul2quat(angle: Float32Array): Float32Array {
  // Original code from GuinnessRules.
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

/**
 * Converts a quaternion to a matrix representation.
 *
 * @param angle - The quaternion to convert, represented as a Float32Array.
 * @returns The matrix representation of the quaternion.
 */
export function quat2matrix(angle: Float32Array): number[] {
  //  may not work for other things than construction
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
    1 - (xx + yy)
  ];
}

/**
 * Converts Euler angles to a legacy quaternion representation.
 *
 * @param angle - The Euler angles to convert, represented as an array of numbers.
 * @returns The legacy quaternion representation of the Euler angles.
 */
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

/**
 * Fixes the Euler order of the rotation by modifying the rotation array.
 *
 * @param rotation - The rotation to fix, represented as a Float32Array.
 * @returns The fixed rotation as a Float32Array.
 */
export function fixEulerOrder(rotation: Float32Array): Float32Array {
  return new Float32Array([0, rotation[0], 0, 0]);
}

/**
 * Moves a point in a given direction by a specified distance.
 *
 * @param position - The initial position of the point, represented as a Float32Array.
 * @param angle - The angle in radians representing the direction of movement.
 * @param distance - The distance to move the point.
 * @returns The new position of the point after movement as a Float32Array.
 */
export function movePoint(
  position: Float32Array,
  angle: number,
  distance: number
) {
  return new Float32Array([
    position[0] + Math.cos(angle) * distance,
    position[1],
    position[2] + Math.sin(angle) * distance
  ]);
}

export function isPointNearLine(
  point: Float32Array,
  lineStart: Float32Array,
  lineEnd: Float32Array,
  threshold: number
) {
  // Calculate vectors
  const lineVector = [lineEnd[0] - lineStart[0], lineEnd[1] - lineStart[1]];
  const pointVector = [point[0] - lineStart[0], point[1] - lineStart[1]];

  // Calculate the length of the line segment
  const lineLength = Math.sqrt(
    lineVector[0] * lineVector[0] + lineVector[1] * lineVector[1]
  );

  // Calculate the projection of pointVector onto lineVector
  const projection =
    (pointVector[0] * lineVector[0] + pointVector[1] * lineVector[1]) /
    (lineLength * lineLength);

  // Calculate the closest point on the line segment
  const closestPoint = [
    lineStart[0] + projection * lineVector[0],
    lineStart[1] + projection * lineVector[1]
  ];

  // Calculate the distance between the point and the closest point on the line
  const distance = Math.sqrt(
    (point[0] - closestPoint[0]) * (point[0] - closestPoint[0]) +
      (point[1] - closestPoint[1]) * (point[1] - closestPoint[1])
  );

  // Check if the distance is within the threshold
  return distance <= threshold;
}
/**
 * Calculates the angle between two points in a 2D space.
 *
 * @param position1 - The position of the first point, represented as a Float32Array.
 * @param position2 - The position of the second point, represented as a Float32Array.
 * @returns The angle between the two points in radians.
 */
export function getAngle(position1: Float32Array, position2: Float32Array) {
  const dx = position2[0] - position1[0];
  const dz = position2[2] - position1[2];
  const angle = Math.atan2(dz, dx);
  return angle;
}

/**
 * Shuts down the zone server with a countdown timer and performs necessary cleanup operations.
 *
 * @param server - The zone server instance (ZoneServer2016 or ZoneServer2015).
 * @param startedTime - The timestamp when the server shutdown started.
 * @param timeLeft - The duration of the shutdown timer in seconds.
 * @param message - The message to display during the shutdown process.
 * @returns A promise that resolves after the shutdown process is completed.
 */
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
      message: message
    });
    Object.values(server._clients).forEach(
      (client: ZoneClient2016 & ZoneClient) => {
        server.sendData(client, "CharacterSelectSessionResponse", {
          status: 1,
          sessionId: client.loginSessionId
        });
      }
    );
    setTimeout(() => {
      process.exit(0);
    }, 5000);
  } else {
    server.sendDataToAll("WorldShutdownNotice", {
      timeLeft: currentTimeLeft / 1000,
      message: message
    });
    setTimeout(
      () => zoneShutdown(server, startedTime, timeLeft, message),
      timeLeftMs / 5
    );
  }
}

/**
 * Calculates the difference between two strings using the Levenshtein distance algorithm.
 *
 * @param s1 - The first string to compare.
 * @param s2 - The second string to compare.
 * @returns The difference between the two strings as a number.
 */
export function getDifference(s1: string, s2: string) {
  s1 = s1.toLowerCase();
  s2 = s2.toLowerCase();
  const costs: number[] = [];
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

/**
 * Generates a random integer within the specified range (inclusive).
 *
 * @param min - The minimum value of the range.
 * @param max - The maximum value of the range.
 * @returns The random integer generated.
 */
export const randomIntFromInterval = (min: number, max: number) => {
  // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min);
};

/**
 * Retrieves the application data folder path.
 *
 * @returns The path to the application data folder.
 */
export const getAppDataFolderPath = (): string => {
  const folderName = "h1emu";
  return `${process.env.APPDATA || process.env.HOME}/${folderName}`;
};

/**
 * Decrypts the encrypted text using the provided key and initialization vector (IV).
 *
 * @param text - The encrypted data and IV.
 * @param key - The decryption key.
 * @returns The decrypted text.
 */
export function decrypt(
  text: { iv: string; encryptedData: string },
  key: string
): string {
  const iv = Buffer.from(text.iv, "hex");
  const encryptedText = Buffer.from(text.encryptedData, "hex");

  const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(key), iv);

  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

/**
 * Sets up the application data folder by creating necessary files and directories if they don't exist (Singleplayer windows usage only).
 */
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
  if (!fs.existsSync(`${AppDataFolderPath}/single_player_accountitems.json`)) {
    fs.writeFileSync(
      `${AppDataFolderPath}/single_player_accountitems.json`,
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
  if (!fs.existsSync(`${AppDataFolderPath}/worlddata/traps.json`)) {
    fs.writeFileSync(
      `${AppDataFolderPath}/worlddata/traps.json`,
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

/**
 * Checks if an object is empty (has no enumerable properties).
 *
 * @param obj - The object to check.
 * @returns A boolean indicating whether the object is empty.
 */
export const objectIsEmpty = (obj: Record<string, unknown>) => {
  return Object.keys(obj).length === 0;
};

/**
 * Checks if a value is within a specified range.
 *
 * @param radius - The range around the value.
 * @param value1 - The value to check.
 * @param value2 - The reference value.
 * @returns A boolean indicating whether the value is within the range.
 */
const isBetween = (radius: number, value1: number, value2: number): boolean => {
  return value1 <= value2 + radius && value1 >= value2 - radius;
};

/**
 * Checks if a point is inside a square region defined by its vertices.
 *
 * @param point - The point to check.
 * @param vs - The vertices of the square.
 * @returns A boolean indicating whether the point is inside the square.
 */
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

/**
 * Checks if a 3D point is inside a cube region defined by a cube's bounds.
 *
 * @param point - The 3D point [x, y, z] to check.
 * @param cubeBounds - The cube's bounds represented as CubeBounds.
 * @returns A boolean indicating whether the point is inside the cube.
 */
export const isInsideCube = (point: Point3D, bounds: CubeBounds) => {
  const x = point[0],
    z = point[2],
    lowerY = bounds[0][1],
    upperY = bounds[7][1];

  let inside = false;
  for (let i = 0, j = 4 - 1; i < 4; j = i++) {
    const xi = bounds[i][0],
      zi = bounds[i][2],
      xj = bounds[j][0],
      zj = bounds[j][2],
      intersect =
        zi > z != zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi;
    if (intersect) inside = !inside;
  }

  return inside && point[1] > lowerY && point[1] < upperY;
};

/**
 * Checks if a position is within a specified radius from another position in 2D space.
 *
 * @param radius - The radius to check.
 * @param position1 - The position of the first point.
 * @param position2 - The position of the second point.
 * @returns A boolean indicating whether the second point is within the specified radius of the first point.
 */
export const isPosInRadius = (
  radius: number,
  position1: Float32Array,
  position2: Float32Array
): boolean => {
  const xDiff = position1[0] - position2[0];
  const zDiff = position1[2] - position2[2];
  const radiusSquared = radius * radius;

  return xDiff * xDiff + zDiff * zDiff <= radiusSquared;
};

/**
 * Checks if a position is within a specified radius from another position in 3D space, taking into account the y-axis.
 *
 * @param radius - The radius to check.
 * @param position1 - The position of the first point.
 * @param position2 - The position of the second point.
 * @param y_radius - The radius around the y-axis.
 * @returns A boolean indicating whether the second point is within the specified radius of the first point in both x-z and y axes.
 */
export const isPosInRadiusWithY = (
  radius: number,
  position1: Float32Array,
  position2: Float32Array,
  y_radius: number
): boolean => {
  return (
    isBetween(radius, position1[0], position2[0]) &&
    isBetween(radius, position1[2], position2[2]) &&
    isBetween(y_radius, position1[1], position2[1])
  );
};

/**
 * Calculates the Euclidean distance between two 3D points.
 *
 * @param p1 - The position of the first point.
 * @param p2 - The position of the second point.
 * @returns The Euclidean distance between the two points.
 */
export function getDistance(p1: Float32Array, p2: Float32Array) {
  const a = p1[0] - p2[0];
  const b = p1[1] - p2[1];
  const c = p1[2] - p2[2];
  return Math.sqrt(a * a + b * b + c * c);
}

/**
 * Calculates the Euclidean distance between two 2D points (ignoring the y-axis).
 *
 * @param p1 - The position of the first point.
 * @param p2 - The position of the second point.
 * @returns The Euclidean distance between the two points in 2D space.
 */
export function getDistance2d(p1: Float32Array, p2: Float32Array) {
  const dx = p1[0] - p2[0];
  const dy = p1[2] - p2[2];
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculates the absolute difference between two 1D values.
 *
 * @param height1 - The first height value.
 * @param height2 - The second height value.
 * @returns The absolute difference between the two heights.
 */
export function getDistance1d(height1: number, height2: number) {
  const dh = height1 - height2;
  return Math.abs(dh);
}

/**
 * Checks if any construction in the dictionary is within the specified range of the given position and has a matching itemDefinitionId.
 *
 * @param dictionary - The dictionary of constructions to check.
 * @param position - The position to check against.
 * @param range - The range to check.
 * @param itemDefinitionId - The item definition ID to match.
 * @returns A boolean indicating whether a matching construction is within range of the position.
 */
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

/**
 * Creates a position update object with the given position, rotation, and game time.
 *
 * @param position - The position for the update.
 * @param rotation - The rotation for the update.
 * @param gameTime - The game time for the update.
 * @returns The position update object.
 */
export function createPositionUpdate(
  position: Float32Array,
  rotation: Float32Array,
  gameTime: number
): positionUpdate {
  const obj: positionUpdate = {
    flags: 4095,
    sequenceTime: gameTime,
    position: [...position]
  };
  if (rotation) {
    obj.rotation = rotation;
  }
  return obj;
}

/**
 * Calculates the coordinates of the corners of a rectangle given the center point, angle, offset, and euler rotation.
 *
 * @param centerPoint - The center point of the rectangle.
 * @param angle - The angle of the rectangle.
 * @param offset - The offset of the rectangle.
 * @param eulerRot - The euler rotation of the rectangle.
 * @returns An array containing the coordinates of the rectangle's corners.
 */
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
    [pointD[0], pointD[2]]
  ];
}

/**
 * Calculates the coordinates of the corners of a cube given the center point, angle, offset, euler rotation,
 * bottom y, and top y values.
 *
 * @param centerPoint - The center point of the cube.
 * @param angle - The angle of the cube.
 * @param offset - The offset of the cube.
 * @param eulerRot - The euler rotation of the cube.
 * @param bottomY - The bottom y value of the cube.
 * @param topY - The top y value of the cube.
 * @returns An array containing the coordinates of the cube's corners.
 */
export function getCubeBounds(
  centerPoint: Float32Array,
  angle: number,
  offset: number,
  eulerRot: number,
  bottomY: number,
  topY: number
): CubeBounds {
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
    [pointA[0], bottomY, pointA[2]],
    [pointB[0], bottomY, pointB[2]],
    [pointC[0], bottomY, pointC[2]],
    [pointD[0], bottomY, pointD[2]],
    [pointA[0], topY, pointA[2]],
    [pointB[0], topY, pointB[2]],
    [pointC[0], topY, pointC[2]],
    [pointD[0], topY, pointD[2]]
  ];
}

/**
 * Converts a number to an integer by rounding it down.
 *
 * @param value - The number to convert.
 * @returns The converted integer value.
 */
export const toInt = (value: number) => {
  return Number(value.toFixed(0));
};

/**
 * Converts a number to a hexadecimal string representation.
 *
 * @param value - The number to convert.
 * @returns The hexadecimal string representation of the number.
 */
export const Int64String = function (value: number): string {
  return "0x" + ("0000000000000000" + value.toString(16)).substr(-16);
};

/**
 * Generates a random GUID string.
 *
 * @returns The generated GUID string.
 */
export const generateRandomGuid = function (): string {
  return "0x" + generate_random_guid();
};

/**
 * Generates a transient ID starting from the specified ID.
 *
 * @yields The generated transient ID.
 */
export function* generateTransientId() {
  for (let index = 1; index < MAX_TRANSIENT_ID; index++) {
    yield index;
  }
}

/**
 * Removes the cache for all files in the specified directory path.
 *
 * @param directoryPath - The path of the directory to remove the cache for.
 */
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

/**
 * Generates a list of command strings from the command object and namespace.
 *
 * @param commandObject - The command object containing the commands.
 * @param commandNamespace - The namespace of the commands.
 * @returns An array of command strings.
 */
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

/**
 * LZ4 compression class with static methods for encoding blocks and calculating the encoding bound.
 */
export class LZ4 {
  /**
   * Encodes a block of data using LZ4 compression.
   *
   * @param src - The source data to compress.
   * @param dst - The destination buffer to store the compressed data.
   * @param sIdx - The starting index in the source data.
   * @param eIdx - The ending index in the source data.
   * @returns The size of the compressed block.
   */
  static encodeBlock: (
    src: any,
    dst: any,
    sIdx?: number,
    eIdx?: number
  ) => number;
  /**
   * Calculates the size of the encoded block given the input size.
   *
   * @param isize - The input size.
   * @returns The size of the encoded block.
   */
  static encodeBound: (isize: number) => number;
}
LZ4.encodeBlock = compress;
LZ4.encodeBound = compressBound;

/**
 * Decompresses LZ4-compressed data.
 *
 * @param data - The compressed data.
 * @param inSize - The size of the input data.
 * @param outSize - The size of the output data.
 * @returns The decompressed data.
 */
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

/**
 * Initializes the MongoDB database.
 *
 * @param mongoClient - The MongoDB client.
 * @param serverName - The name of the server.
 * @returns A promise that resolves once the database is initialized.
 */
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
  await mongoClient.db(dbName).createCollection(DB_COLLECTIONS.ADMINS);
  const admins = require("../../data/defaultDatabase/shared/admins.json");
  await mongoClient
    .db(dbName)
    .collection(DB_COLLECTIONS.ADMINS)
    .insertMany(admins);
  debug("h1server database was missing... created one with samples.");
};

/**
 * Converts a packet type to an array of bytes.
 *
 * @param packetType - The packet type.
 * @returns An array of bytes representing the packet type.
 */
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

/**
 * Clears the cache for a folder by deleting cached modules that belong to the folder.
 *
 * @param currentFolderDirname - The dirname of the current folder.
 * @param folderPath - The path of the folder to clear the cache for.
 */
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

/**
 * A wrapped Uint16 class that ensures the value stays within the range of 0 to 65535.
 */
export class wrappedUint16 {
  private value: number;
  constructor(initValue: number) {
    if (initValue > MAX_UINT16) {
      throw new Error("wrappedUint16 can only hold values up to 65535");
    }
    this.value = initValue;
  }

  /**
   * Wraps the given value to ensure it stays within the range of 0 to 65535.
   *
   * @param value - The value to wrap.
   * @returns The wrapped value.
   */
  static wrap(value: number) {
    let uint16 = value;
    if (uint16 > MAX_UINT16) {
      uint16 -= MAX_UINT16 + 1; // subtract the overflow value;
    }
    return uint16;
  }

  /**
   * Adds a value to the wrappedUint16 value.
   *
   * @param value - The value to add.
   */
  add(value: number): void {
    this.value = wrappedUint16.wrap(this.value + value);
  }

  /**
   * Sets the wrappedUint16 value.
   *
   * @param value - The value to set.
   */
  set(value: number): void {
    this.value = wrappedUint16.wrap(value);
  }

  /**
   * Retrieves the wrappedUint16 value.
   *
   * @returns The wrappedUint16 value.
   */
  get(): number {
    return this.value;
  }

  /**
   * Increments the wrappedUint16 value by 1.
   */
  increment(): void {
    this.add(1);
  }
}

/**
 * Converts a BigInt to a hexadecimal string.
 *
 * @param bigInt - The BigInt to convert.
 * @returns The hexadecimal string representation of the BigInt.
 */
export const toBigHex = (bigInt: bigint): string => {
  return `0x${bigInt.toString(16)}`;
};

/**
 * Converts a number to a hexadecimal string.
 *
 * @param number - The number to convert.
 * @returns The hexadecimal string representation of the number.
 */
export const toHex = (number: number): string => {
  return `0x${number.toString(16)}`;
};

/**
 * Retrieves a random element from an array.
 *
 * @param array - The array from which to retrieve a random element.
 * @returns A random element from the array.
 */
export const getRandomFromArray = (array: any[]): any => {
  return array[Math.floor(Math.random() * array.length)];
};

/**
 * Retrieves a random key from an object.
 *
 * @param object - The object from which to retrieve a random key.
 * @returns A random key from the object.
 */
export const getRandomKeyFromAnObject = (object: any): string => {
  const keys = Object.keys(object);
  return keys[Math.floor(Math.random() * keys.length)];
};

/**
 * Calculates the damage reduction based on distance using a linear falloff formula.
 *
 * @param distance - The distance between the target and the source.
 * @param minDamage - The minimum damage value.
 * @param maxDamage - The maximum damage value.
 * @param falloffStart - The distance at which damage falloff begins.
 * @param falloffEnd - The distance at which damage reaches its minimum value.
 * @returns The calculated damage after falloff.
 */
export function calculate_falloff(
  distance: number,
  minDamage: number,
  maxDamage: number,
  falloffStart: number,
  falloffEnd: number
): number {
  if (distance <= falloffStart) {
    return maxDamage;
  } else if (distance >= falloffEnd) {
    return minDamage;
  }
  const damageRange = maxDamage - minDamage,
    distanceRange = falloffEnd - falloffStart,
    distanceFromStart = distance - falloffStart,
    interpolation = 1 - distanceFromStart / distanceRange,
    reducedDamage = minDamage + interpolation * damageRange;
  return Math.round(reducedDamage);
}

/**
 * A typescript port of the ForgeLight engine's hashing algorithm used in the game.
 *
 * @param str - The string to calculate the hash for.
 * @returns The calculated hash value.
 */
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

/**
 * Calculates the orientation (rotation) between two positions.
 *
 * @param pos1 - The first position.
 * @param pos2 - The second position.
 * @returns The calculated orientation.
 */
export function calculateOrientation(
  pos1: Float32Array,
  pos2: Float32Array
): number {
  return Math.atan2(pos1[2] - pos2[2], pos1[0] - pos2[0]) * -1 - 1.4;
}

/**
 * Calculates the position offset based on rotation, angle, and distance from a given position.
 *
 * @param position - The base position.
 * @param rotation - The rotation angle in radians.
 * @param angle - The additional angle in degrees.
 * @param distance - The distance from the base position.
 * @returns The offset position.
 */
export function getOffsetPoint(
  position: Float32Array,
  rotation: number,
  angle: number,
  distance: number
) {
  return movePoint(position, -rotation + (angle * Math.PI) / 180, distance);
}

/**
 * Calculates the angle and distance between two points in a 2D plane.
 *
 * @param p1 - The first point.
 * @param p2 - The second point.
 * @returns An object containing the calculated angle (in degrees) and distance.
 */
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

/**
 * Retrieves the construction slot ID based on the building slot name.
 *
 * @param buildingSlot - The name of the building slot.
 * @returns The corresponding construction slot ID.
 */
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

/**
 * Registers construction slots for a construction entity based on slot definitions.
 *
 * @param construction - The construction entity.
 * @param setSlots - The construction slot position map.
 * @param slotDefinitions - The slot definitions for the construction entity.
 */
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
          1
        ]),
        rotation: new Float32Array([
          0,
          construction.eulerAngle + slots.rotationOffsets[i],
          0
        ])
      };
    });
  }
}

/**
 * Checks if a character name is valid.
 *
 * @param name - The character name to validate.
 * @returns The validation status of the character name.
 */
export function isValidCharacterName(name: string) {
  // Regular expression that matches all special characters
  const specialCharRegex = /[^\w\s]/gi;

  // Check if the string is only made up of blank characters
  const onlyBlankChars = name.replace(/\s/g, "").length === 0;

  // Check if the string contains any special characters
  const hasSpecialChars = specialCharRegex.test(name);

  // Return false if the string is only made up of blank characters or contains special characters
  return !onlyBlankChars &&
    !hasSpecialChars &&
    !name.startsWith(" ") &&
    !name.endsWith(" ")
    ? NAME_VALIDATION_STATUS.AVAILABLE
    : NAME_VALIDATION_STATUS.INVALID;
}

/**
 * Resolves the host address using a resolver.
 *
 * @param resolver - The resolver object.
 * @param hostName - The hostname to resolve.
 * @returns A Promise that resolves to an array of resolved IP addresses.
 */
export async function resolveHostAddress(
  resolver: Resolver,
  hostName: string
): Promise<string[]> {
  const resolvedAddress = await new Promise((resolve) => {
    resolver.resolve4(hostName, (err, addresses) => {
      if (!err) {
        resolve(addresses);
      } else {
        // console.log(
        //   `Failed to resolve ${hostName} as an host name, it will be used as an IP`
        // );
        resolve([hostName]); // if it can't resolve it, assume that's an IPV4 / IPV6 not an hostname
      }
    });
  });
  return resolvedAddress as string[];
}

/**
 * Logs a client action to MongoDB.
 *
 * @param collection - The MongoDB collection to log to.
 * @param client - The ZoneClient2016 instance representing the client.
 * @param serverId - The ID of the server.
 * @param logMessage - The log message to insert.
 */
export async function logClientActionToMongo(
  collection: Collection,
  client: ZoneClient2016,
  serverId: number,
  logMessage: Record<string, unknown>
) {
  try {
    collection.insertOne({
      ...logMessage,
      serverId,
      characterName: client.character.name,
      loginSessionId: client.loginSessionId
    });
  } catch (e: any) {
    console.error(e);
  }
}

/**
 * Removes untransferable fields from an object recursively.
 *
 * @param data - The object to remove untransferable fields from.
 */
export function removeUntransferableFields(data: any) {
  const allowedTypes = ["string", "number", "boolean", "undefined", "bigint"];

  for (const key in data) {
    // eslint-disable-next-line no-prototype-builtins
    if (data.hasOwnProperty(key)) {
      const value = data[key];
      if (typeof value === "object") {
        removeUntransferableFields(value);
      } else if (!allowedTypes.includes(typeof value)) {
        console.log(`Invalid value type: ${typeof value}.`);
        delete data[key];
      }
    }
  }
}

/**
 * Checks if a number is a float.
 *
 * @param number - The number to check.
 * @returns A boolean indicating whether the number is a float.
 */
export function isFloat(number: number) {
  return number % 1 != 0;
}

export function fileExists(filePath: string): boolean {
  try {
    fs.accessSync(filePath);
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}

export async function copyFile(
  originalFilePath: string,
  newFilePath: string
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const readStream = fs.createReadStream(originalFilePath);
    const writeStream = fs.createWriteStream(newFilePath);

    readStream.pipe(writeStream);

    writeStream.on("finish", () => {
      console.log("File copied successfully!");
      readStream.close();
      writeStream.close();
      resolve();
    });

    writeStream.on("error", (err) => {
      console.error("Error copying file:", err);
      readStream.close();
      writeStream.close();
      reject(err);
    });
  });
}

export class TimeWrapper {
  constructor(private fullTimeMs: number) {}
  getSeconds() {
    return toInt(this.fullTimeMs / 1000);
  }
  getMinutes() {
    return toInt(this.fullTimeMs / 60000);
  }
  getHours() {
    return toInt(this.fullTimeMs / 3600000);
  }
  getFull() {
    return this.fullTimeMs;
  }
  getFullBigint() {
    return BigInt(this.fullTimeMs);
  }
  getFullString() {
    return Int64String(this.fullTimeMs);
  }

  getTruncatedU32() {
    const truncated = this.fullTimeMs & MAX_UINT32;
    return truncated >= 0 ? truncated : truncated >>> 0;
  }

  getTruncatedU32String() {
    const truncated = this.fullTimeMs & MAX_UINT32;
    return truncated >= 0
      ? Int64String(truncated)
      : Int64String(truncated >>> 0);
  }
}

export function getCurrentServerTimeWrapper() {
  return new TimeWrapper(Date.now() - startTime);
}

export function getCurrentRealTimeWrapper() {
  return new TimeWrapper(Date.now());
}
export function getDateString(timestamp: number) {
  const months = [
    "JAN",
    "FEB",
    "MAR",
    "APR",
    "MAY",
    "JUN",
    "JUL",
    "AUG",
    "SEP",
    "OCT",
    "NOV",
    "DEC"
  ];
  const date = new Date(timestamp);
  return `${date.getDate()} ${
    months[date.getMonth()]
  } ${date.getFullYear()} ${date.getHours()}:${date.getMinutes()}`;
}

export function loadJson(path: string) {
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

export function loadNavData() {
  const folderPath = `${__dirname}/../../data/2016/navData/`;
  const files = fs.readdirSync(folderPath);

  const dataInOrder: Uint8Array[] = [];

  files.forEach((file) => {
    const filePath = path.join(folderPath, file);

    const stats = fs.statSync(filePath);

    if (stats.isFile()) {
      const data = fs.readFileSync(filePath);
      const fileIndex: number =
        Number(filePath.split(".")[0].split("_part")[1]) - 1;

      dataInOrder[fileIndex] = new Uint8Array(data);
    }
  });
  return new Uint8Array(Buffer.concat(dataInOrder));
}
export function isHalloween() {
  const today = new Date();
  return today.getMonth() === 9 && today.getDate() === 31;
}

export function isChristmasSeason() {
  const today = new Date();
  return today.getMonth() === 11;
}

export function luck(l: number) {
  return Math.floor(Math.random() * l) === 0;
}

const Z1_POIs = require("../../data/2016/zoneData/Z1_POIs");
export function isPosInPoi(position: Float32Array): boolean {
  let isInPoi = false;
  Z1_POIs.forEach((point: any) => {
    let useRange = true;
    if (point.bounds) {
      useRange = false;
      point.bounds.forEach((bound: any) => {
        if (isInsideSquare([position[0], position[2]], bound)) {
          isInPoi = true;
          return;
        }
      });
    }
    if (useRange && isPosInRadius(point.range, position, point.position)) {
      isInPoi = true;
    }
  });

  return isInPoi;
}

const Z1_nerfedPOIs = require("../../data/2016/zoneData/Z1_nerfedPOIs");
export function isLootNerfedLoc(position: Float32Array): number {
  let useRange = true;
  let nerfedValue = 0;
  Z1_nerfedPOIs.forEach((point: any) => {
    if (point.bounds) {
      useRange = false;
      point.bounds.forEach((bound: any) => {
        if (isInsideSquare([position[0], position[2]], bound)) {
          nerfedValue = point.nerfValue;
          return;
        }
      });
    }
    if (useRange && isPosInRadius(point.range, position, point.position)) {
      nerfedValue = point.nerfValue;
    }
  });

  return nerfedValue;
}

export function chance(chanceNum: number): boolean {
  return Math.random() * 1000 < chanceNum;
}

export function getCellName(index: number, numCols: number): string {
  const columnIndex = index % numCols; // Get column index (0-9)
  const rowIndex = Math.floor(index / numCols); // Get row index (0-9)

  const columnLetter = String.fromCharCode(65 + columnIndex); // Convert to A-J
  const rowNumber = rowIndex + 1; // Convert to 1-10

  return columnLetter + rowNumber; // Example: "A1", "B3", "J10"
}
