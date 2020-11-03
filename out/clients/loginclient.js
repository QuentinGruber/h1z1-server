"use strict";
// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (c) 2020 Quentin Gruber
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginClient = void 0;
var events_1 = require("events");
var SOEClient = require("./soeclient").SOEClient, https = require("https"), util = require("util"), LoginProtocol = require("../protocols/loginprotocol").LoginProtocol, loginProtocolName = "LoginUdp_9", debug = require("debug")("LoginClient");
var LoginClient = /** @class */ (function (_super) {
    __extends(LoginClient, _super);
    function LoginClient(gameId, environment, serverAddress, serverPort, loginKey, localPort) {
        var _this = _super.call(this) || this;
        _this.requestCharacterDelete = function () { };
        _this.requestCharacterCreate = function () { };
        _this._gameId = gameId;
        _this._environment = environment;
        _this._soeClient = new SOEClient(loginProtocolName, serverAddress, serverPort, loginKey, localPort);
        _this._protocol = new LoginProtocol();
        var n = 0;
        _this._soeClient.on("connect", function (err, result) {
            debug("Connected to login server");
            _this.login("FiNgErPrInT");
        });
        _this._soeClient.on("disconnect", function (err, result) {
            debug("Disconnected");
        });
        _this._soeClient.on("appdata", function (err, data) {
            n++;
            var packet, result;
            try {
                packet = _this._protocol.parse(data);
            }
            catch (e) {
                debug("Failed parsing app data loginclient_appdata_" + n + ".dat");
                return;
            }
            result = packet.result;
            switch (packet.name) {
                case "LoginReply":
                    if (result.status === 1) {
                        _this.emit("login", null, {
                            loggedIn: result.loggedIn,
                            isMember: result.isMember,
                        });
                    }
                    else {
                        _this.emit("login", "Login failed");
                    }
                    break;
                case "ForceDisconnect":
                    break;
                case "CharacterLoginReply":
                    if (result.status === 1) {
                        debug(JSON.stringify(result, null, 4));
                        _this.emit("characterlogin", null, result);
                    }
                    else {
                        _this.emit("characterlogin", "Character login failed");
                    }
                    break;
                case "CharacterCreateReply":
                    if (result.status === 1) {
                        _this.emit("charactercreate", null, {});
                    }
                    else {
                        _this.emit("charactercreate", "Character create failed");
                    }
                    break;
                case "CharacterDeleteReply":
                    if (result.status === 1) {
                        _this.emit("characterdelete", null, {});
                    }
                    else {
                        _this.emit("characterdelete", "Character delete failed");
                    }
                    break;
                case "CharacterSelectInfoReply":
                    if (result.status === 1) {
                        _this.emit("characterinfo", null, result);
                    }
                    else {
                        _this.emit("characterinfo", "Character info failed");
                    }
                    break;
                case "ServerListReply":
                    _this.emit("serverlist", null, {
                        servers: result.servers,
                    });
                    break;
                case "ServerUpdate":
                    if (result.status === 1) {
                        _this.emit("serverupdate", null, result.server);
                    }
                    else {
                        _this.emit("serverupdate", "Server update failed");
                    }
                    break;
                case "TunnelAppPacketServerToClient":
                    break;
            }
        });
        return _this;
    }
    LoginClient.prototype.connect = function () {
        debug("Connecting to login server");
        this._soeClient.connect();
    };
    LoginClient.prototype.login = function (fingerprint) {
        return __awaiter(this, void 0, void 0, function () {
            function SetupLoginRequest(fingerprint, sessionId, protocol) {
                return __awaiter(this, void 0, void 0, function () {
                    var data;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, protocol.pack("LoginRequest", {
                                    sessionId: sessionId,
                                    systemFingerPrint: fingerprint,
                                })];
                            case 1:
                                data = _a.sent();
                                return [2 /*return*/, data];
                        }
                    });
                });
            }
            var data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, SetupLoginRequest(fingerprint, this._soeClient._sessionId.toString(), this._protocol)];
                    case 1:
                        data = _a.sent();
                        debug("Sending login request");
                        this._soeClient.sendAppData(data, true);
                        this.emit("connect");
                        return [2 /*return*/];
                }
            });
        });
    };
    LoginClient.prototype.disconnect = function () {
        this.emit("disconnect");
    };
    LoginClient.prototype.requestServerList = function () {
        debug("Requesting server list");
        var data = this._protocol.pack("ServerListRequest");
        this._soeClient.sendAppData(data, true);
    };
    LoginClient.prototype.requestCharacterInfo = function () {
        debug("Requesting character info");
        var data = this._protocol.pack("CharacterSelectInfoRequest");
        this._soeClient.sendAppData(data, true);
    };
    LoginClient.prototype.requestCharacterLogin = function (characterId, serverId, payload) {
        debug("Requesting character login");
        var data = this._protocol.pack("CharacterLoginRequest", {
            characterId: characterId,
            serverId: serverId,
            payload: payload,
        });
        if (data) {
            this._soeClient.sendAppData(data, true);
        }
        else {
            debug("Could not pack character login request data");
        }
    };
    return LoginClient;
}(events_1.EventEmitter));
exports.LoginClient = LoginClient;
