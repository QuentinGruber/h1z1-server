const restore = require("mongodb-restore-dump");
import { v4 as uuidv4, parse as uuidParse } from "uuid";
import {generate_random_guid} from "h1emu-core"
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
    await server.saveWorld();
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

export const Int64String = function (value: number): string {
  return "0x" + ("0000000000000000" + value.toString(16)).substr(-16);
};

export const generateRandomGuid = function (): string {
  return generate_random_guid();
};

export const lz4_decompress = function (
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
