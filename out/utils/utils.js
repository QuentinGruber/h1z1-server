"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.lz4_decompress = exports.generateGuid = exports.Int64String = void 0;
var lodash_1 = __importDefault(require("lodash"));
var Int64String = function (value) {
    return "0x" + ("0000000000000000" + value.toString(16)).substr(-16);
};
exports.Int64String = Int64String;
var generateGuid = function (guidList) {
    if (guidList === void 0) { guidList = []; }
    var guid;
    do {
        guid = "0x";
        for (var i = 0; i < 16; i++) {
            guid += Math.floor(Math.random() * 16).toString(16);
        }
    } while (!lodash_1.default.indexOf(guidList, guid));
    return guid;
};
exports.generateGuid = generateGuid;
var lz4_decompress = function (data, inSize, outSize) {
    var outdata = new Buffer.alloc(outSize), token, literalLength, matchLength, matchOffset, matchStart, matchEnd, offsetIn = 0, offsetOut = 0;
    while (1) {
        var token = data[offsetIn];
        var literalLength = token >> 4;
        var matchLength = token & 0xf;
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
            var matchStart = offsetOut - matchOffset;
            var matchEnd = offsetOut - matchOffset + matchLength;
            for (var i = matchStart; i < matchEnd; i++) {
                outdata[offsetOut] = outdata[i];
                offsetOut++;
            }
        }
        else {
            break;
        }
    }
    return outdata;
};
exports.lz4_decompress = lz4_decompress;
