"use strict";
const ieee754 = require("ieee754");

function checkOffset(offset, ext, length) {
    if (offset + ext > length) {
        throw new RangeError("Index out of range");
    }
}

function toArray() {
    const length = this.length;
    const array = new Array(length);
    for (let i = 0; i < length; i++) {
        array[i] = this[i];
    }
    return array;
}

function readUInt24LE(offset, noAssert) {
    return this.readUIntLE(offset, 3, noAssert);
}
function readInt24LE(offset, noAssert) {
    return this.readIntLE(offset, 3, noAssert);
}
function readUInt24BE(offset, noAssert) {
    return this.readUIntBE(offset, 3, noAssert);
}
function readInt24BE(offset, noAssert) {
    return this.readIntBE(offset, 3, noAssert);
}

function writeUInt24LE(value, offset, noAssert) {
    return this.writeUIntLE(value, offset, 3, noAssert);
}
function writeInt24LE(value, offset, noAssert) {
    return this.writeIntLE(value, offset, 3, noAssert);
}
function writeUInt24BE(value, offset, noAssert) {
    return this.writeUIntBE(value, offset, 3, noAssert);
}
function writeInt24BE(value, offset, noAssert) {
    return this.writeIntBE(value, offset, 3, noAssert);
}

function readPrefixedStringLE(offset, encoding, noAssert) {
    const length = this.readUInt32LE(offset, noAssert);
    const value = this.toString(encoding || "utf8", offset + 4, offset + 4 + length);
    return value;
}

function readPrefixedStringBE(offset, encoding, noAssert) {
    const length = this.readUInt32BE(offset, noAssert);
    const value = this.toString(encoding || "utf8", offset + 4, offset + 4 + length);
    return value;
}

function writePrefixedStringLE(string, offset, encoding, noAssert) {
    this.writeUInt32LE(string.length, offset, noAssert);
    this.write(string, offset + 4, string.length, encoding || "utf8");
    return string.length + 4;
}

function writePrefixedStringBE(string, offset, encoding, noAssert) {
    const length = string.length;
    this.writeUInt32BE(length, offset, noAssert);
    this.write(string, offset + 4, length, encoding || "utf8");
    return length + 4;
}

function readNullTerminatedString(offset, noAssert) {
    if (!noAssert) {
        checkOffset(offset, 1, this.length);
    }
    const length = this.length;
    let value = "";
    for (let i = offset; i < length;i++) {
        if (this[i] === 0) {
            break;
        }
        value += String.fromCharCode(this[i]);
    }
    return value;
}

function writeNullTerminatedString(string, offset, noAssert) {
    const length = string.length;
    if (!noAssert) {
        checkOffset(offset, length, this.length);
    }
    for (let i = 0; i < length; i++) {
        this[offset + i] = string.charCodeAt(i);
    }
    this[offset + length] = 0;
    return length + 1;
}

function readBoolean(offset, noAssert) {
    const value = this.readUInt8(offset, noAssert);
    return (value !== 0);
}

function writeBoolean(value, offset, noAssert) {
    this.writeUInt8(value ? 1 : 0, offset, noAssert);
    return 1;
}

function readBytes(offset, length, noAssert) {
    if (!noAssert) {
        checkOffset(offset, length, this.length);
    }
    const dst = new Buffer(length);
    this.copy(dst, 0, offset, offset + length);
    return new ExtBuffer(dst);
}

function writeBytes(bytes, offset, length, noAssert) {
    if (typeof length === "undefined") {
        length = bytes.length;
    }
    if (!noAssert) {
        checkOffset(offset, length, this.length);
    }
    bytes.copy(this, offset, 0, length);
    return length;
}

function readUInt64String(offset, noAssert) {
    let str = "0x";
    for (let j = 7; j >= 0; j--) {
        str += ("0" + this.readUInt8(offset+j, noAssert).toString(16)).substr(-2);
    }
    return str;
}

function readInt64String(offset, noAssert) {
    return this.readUInt64String(offset, noAssert);
}

function writeUInt64String(value, offset, noAssert) {
    for (let j = 0; j < 8; j++) {
        this.writeUInt8(parseInt(value.substr(2 + (7 - j) * 2, 2), 16), offset + j, noAssert);
    }
    return 8;
}

function writeInt64String(value, offset, noAssert) {
    return this.writeUInt64String(value, offset, noAssert);
}

function readFloat16LE(offset, noAssert) {
    if (!noAssert) {
        checkOffset(offset, 2, this.length);
    }
    return ieee754.read(this, offset, true, 10, 2);
}

function readFloat16BE(offset, noAssert) {
    if (!noAssert) {
        checkOffset(offset, 2, this.length);
    }
    return ieee754.read(this, offset, false, 10, 2);
}

function writeFloat16LE(value, offset, noAssert) {
    if (!noAssert) {
        checkOffset(offset, 2, this.length);
    }
    return ieee754.write(this, value, offset, true, 10, 2);
}

function writeFloat16BE(value, offset, noAssert) {
    if (!noAssert) {
        checkOffset(offset, 2, this.length);
    }
    return ieee754.write(this, value, offset, false, 10, 2);
}


const methods = {
    toArray,
    readBoolean,
    readBytes,
    readFloat16BE,
    readFloat16LE,
    readInt24BE,
    readInt24LE,
    readInt64String,
    readNullTerminatedString,
    readPrefixedStringBE,
    readPrefixedStringLE,
    readUInt24BE,
    readUInt24LE,
    readUInt64String,
    writeBoolean,
    writeBytes,
    writeFloat16BE,
    writeFloat16LE,
    writeInt24BE,
    writeInt24LE,
    writeInt64String,
    writeNullTerminatedString,
    writePrefixedStringBE,
    writePrefixedStringLE,
    writeUInt24BE,
    writeUInt24LE,
    writeUInt64String
};

function ExtBuffer(arg, encodingOrOffset, length) {
    const buffer = new Buffer(arg, encodingOrOffset, length);

    Object.keys(methods).forEach(method => {
        if (!buffer[method]) {
            buffer[method] = methods[method];
        }
    });

    return buffer;
}

module.exports = ExtBuffer; 


