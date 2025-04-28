/* eslint-disable no-var */
/**
	Javascript version of the key LZ4 C functions

    Copyright (c) 2012 Pierre Curto
    https://github.com/pierrec/node-lz4

    see ./LICENSE
 */

if (!Math.imul)
  Math.imul = function imul(a, b) {
    const ah = a >>> 16;
    const al = a & 0xffff;
    const bh = b >>> 16;
    const bl = b & 0xffff;
    return (al * bl + ((ah * bl + al * bh) << 16)) | 0;
  };

/**
 * Decode a block. Assumptions: input contains all sequences of a
 * chunk, output is large enough to receive the decoded data.
 * If the output buffer is too small, an error will be thrown.
 * If the returned value is negative, an error occured at the returned offset.
 *
 * @param input {Buffer} input data
 * @param output {Buffer} output data
 * @param sIdx
 * @param eIdx
 * @param sIdx
 * @param eIdx
 * @return {Number} number of decoded bytes
 * @private
 */
export const uncompress = (
  input: string | any[],
  output: any[],
  sIdx: number,
  eIdx: number
): number => {
  sIdx = sIdx || 0;
  eIdx = eIdx || input.length - sIdx;
  let end;
  // Process each sequence in the incoming data
  for (var i = sIdx, n = eIdx, j = 0; i < n; ) {
    const token = input[i++];

    // Literals
    let literals_length = token >> 4;
    if (literals_length > 0) {
      // length of literals
      var l = literals_length + 240;
      while (l === 255) {
        l = input[i++];
        literals_length += l;
      }

      // Copy the literals
      end = i + literals_length;
      while (i < end) output[j++] = input[i++];

      // End of buffer?
      if (i === n) return j;
    }

    // Match copy
    // 2 bytes offset (little endian)
    const offset = input[i++] | (input[i++] << 8);

    // 0 is an invalid offset value
    if (offset === 0 || offset > j) return -(i - 2);

    // length of match copy
    let match_length = token & 0xf;
    l = match_length + 240;
    while (l === 255) {
      l = input[i++];
      match_length += l;
    }

    // Copy the match
    let pos = j - offset; // position of the match copy in the current output
    end = j + match_length + 4; // minmatch = 4
    while (j < end) output[j++] = output[pos++];
  }

  return j;
};

const maxInputSize = 0x7e000000,
  minMatch = 4,
  hashLog = 16,
  hashShift = minMatch * 8 - hashLog,
  hashSize = 1 << hashLog,
  copyLength = 8,
  mfLimit = copyLength + minMatch,
  skipStrength = 6,
  mlBits = 4,
  mlMask = (1 << mlBits) - 1,
  runBits = 8 - mlBits,
  runMask = (1 << runBits) - 1,
  hasher = 2654435761;

// CompressBound returns the maximum length of a lz4 block, given it's uncompressed length
export const compressBound = function (isize: number) {
  return isize > maxInputSize ? 0 : (isize + isize / 255 + 16) | 0;
};

export const compress = function (src: any, dst: any[], sIdx: any, eIdx: any) {
  // V8 optimization: non sparse array with integers
  const hashTable = new Array(hashSize);
  for (let i = 0; i < hashSize; i++) {
    hashTable[i] = 0;
  }
  return compressBlock(src, dst, 0, hashTable, sIdx || 0, eIdx || dst.length);
};

export const compressBlock = (
  src: string | any[],
  dst: any[],
  pos: number,
  hashTable: any[],
  sIdx: number,
  eIdx: number
) => {
  let dpos = sIdx;
  const dlen = eIdx - sIdx;
  let anchor = 0;

  if (src.length >= maxInputSize) throw new Error("input too large");

  // Minimum of input bytes for compression (LZ4 specs)
  if (src.length > mfLimit) {
    const n = compressBound(src.length);
    if (dlen < n) throw Error("output too small: " + dlen + " < " + n);

    let findMatchAttempts = (1 << skipStrength) + 3;
    const // Keep last few bytes incompressible (LZ4 specs):
      // last 5 bytes must be literals
      srcLength = src.length - mfLimit;

    while (pos + minMatch < srcLength) {
      // Find a match
      // min match of 4 bytes aka sequence
      const sequenceLowBits = (src[pos + 1] << 8) | src[pos];
      const sequenceHighBits = (src[pos + 3] << 8) | src[pos + 2];
      // compute hash for the current sequence
      const hash =
        Math.imul(sequenceLowBits | (sequenceHighBits << 16), hasher) >>>
        hashShift;
      // get the position of the sequence matching the hash
      // NB. since 2 different sequences may have the same hash
      // it is double-checked below
      // do -1 to distinguish between initialized and uninitialized values
      let ref = hashTable[hash] - 1;
      // save position of current sequence in hash table
      hashTable[hash] = pos + 1;

      // first reference or within 64k limit or current sequence !== hashed one: no match
      if (
        ref < 0 ||
        (pos - ref) >>> 16 > 0 ||
        ((src[ref + 3] << 8) | src[ref + 2]) != sequenceHighBits ||
        ((src[ref + 1] << 8) | src[ref]) != sequenceLowBits
      ) {
        // increase step if nothing found within limit
        const step = findMatchAttempts++ >> skipStrength;
        pos += step;
        continue;
      }

      findMatchAttempts = (1 << skipStrength) + 3;

      // got a match
      var literals_length = pos - anchor;
      const offset = pos - ref;

      // minMatch already verified
      pos += minMatch;
      ref += minMatch;

      // move to the end of the match (>=minMatch)
      let match_length = pos;
      while (pos < srcLength && src[pos] == src[ref]) {
        pos++;
        ref++;
      }

      // match length
      match_length = pos - match_length;

      // token
      const token = match_length < mlMask ? match_length : mlMask;

      // encode literals length
      if (literals_length >= runMask) {
        // add match length to the token
        dst[dpos++] = (runMask << mlBits) + token;
        for (var len = literals_length - runMask; len > 254; len -= 255) {
          dst[dpos++] = 255;
        }
        dst[dpos++] = len;
      } else {
        // add match length to the token
        dst[dpos++] = (literals_length << mlBits) + token;
      }

      // write literals
      for (let i = 0; i < literals_length; i++) {
        dst[dpos++] = src[anchor + i];
      }

      // encode offset
      dst[dpos++] = offset;
      dst[dpos++] = offset >> 8;

      // encode match length
      if (match_length >= mlMask) {
        match_length -= mlMask;
        while (match_length >= 255) {
          match_length -= 255;
          dst[dpos++] = 255;
        }

        dst[dpos++] = match_length;
      }

      anchor = pos;
    }
  }

  // cannot compress input
  if (anchor == 0) return 0;

  // Write last literals
  // encode literals length
  literals_length = src.length - anchor;
  if (literals_length >= runMask) {
    // add match length to the token
    dst[dpos++] = runMask << mlBits;
    for (var ln = literals_length - runMask; ln > 254; ln -= 255) {
      dst[dpos++] = 255;
    }
    dst[dpos++] = ln;
  } else {
    // add match length to the token
    dst[dpos++] = literals_length << mlBits;
  }

  // write literals
  pos = anchor;
  while (pos < src.length) {
    dst[dpos++] = src[pos++];
  }

  return dpos;
};
export const compressDependent = compressBlock;
