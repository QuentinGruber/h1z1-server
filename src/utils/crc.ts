import { crc32 } from "h1emu-core"

export function appendCRC(data: any, crcSeed: number): Buffer {
  const crc = crc32(data, crcSeed >>> 0);
  const crcBuffer = new (Buffer as any).alloc(2);
  crcBuffer.writeUInt16BE(crc & 0xffff, 0);
  return Buffer.concat([data, crcBuffer]);
}
