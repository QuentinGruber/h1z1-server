"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateGuid = exports.Int64String = void 0;
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
