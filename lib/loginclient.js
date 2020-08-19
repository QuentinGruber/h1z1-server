"use strict";
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
var EventEmitter = require("events").EventEmitter, SOEClient = require("./soeclient").SOEClient, https = require("https"), fs = require("fs"), util = require("util"), LoginProtocol = require("./loginprotocol").LoginProtocol, LoginPackets = require("./loginprotocol").LoginPackets, loginProtocolName = "LoginUdp_9", debug = require("debug")("LoginClient");
function LoginError(message) {
    this.name = this.constructor.name;
    this.message = message;
}
util.inherits(LoginError, Error);
function LoginClient(gameId, environment, serverAddress, serverPort, loginKey, localPort) {
    EventEmitter.call(this);
    this._gameId = gameId;
    this._environment = environment;
    var soeClient = (this._soeClient = new SOEClient(loginProtocolName, serverAddress, serverPort, loginKey, localPort));
    var protocol = (this._protocol = new LoginProtocol());
    var me = this;
    var n = 0;
    soeClient.on("appdata", function (err, data) {
        n++;
        var packet, result;
        try {
            packet = protocol.parse(data);
        }
        catch (e) {
            debug("Failed parsing app data loginclient_appdata_" + n + ".dat");
            return;
        }
        result = packet.result;
        switch (packet.name) {
            case "LoginReply":
                if (result.status === 1) {
                    me.emit("login", null, {
                        loggedIn: result.loggedIn,
                        isMember: result.isMember,
                    });
                }
                else {
                    me.emit("login", new LoginError("Login failed"));
                }
                break;
            case "ForceDisconnect":
                break;
            case "CharacterLoginReply":
                if (result.status === 1) {
                    debug(JSON.stringify(result, null, 4));
                    me.emit("characterlogin", null, result);
                }
                else {
                    me.emit("characterlogin", new LoginError("Character login failed"));
                }
                break;
            case "CharacterCreateReply":
                if (result.status === 1) {
                    me.emit("charactercreate", null, {});
                }
                else {
                    me.emit("charactercreate", new LoginError("Character create failed"));
                }
                break;
            case "CharacterDeleteReply":
                if (result.status === 1) {
                    me.emit("characterdelete", null, {});
                }
                else {
                    me.emit("characterdelete", new LoginError("Character delete failed"));
                }
                break;
            case "CharacterSelectInfoReply":
                if (result.status === 1) {
                    me.emit("characterinfo", null, result);
                }
                else {
                    me.emit("characterinfo", new LoginError("Character info failed"));
                }
                break;
            case "ServerListReply":
                me.emit("serverlist", null, {
                    servers: result.servers,
                });
                break;
            case "ServerUpdate":
                if (result.status === 1) {
                    me.emit("serverupdate", null, result.server);
                }
                else {
                    me.emit("serverupdate", new LoginError("Server update failed"));
                }
                break;
            case "TunnelAppPacketServerToClient":
                break;
        }
    });
    soeClient.on("connect", function (err, result) {
        debug("Connected to login server");
        me.emit("connect", err, result);
        me.login("ezfzfez");
    });
    soeClient.on("disconnect", function (err, result) {
        debug("Disconnected");
        me.emit("disconnect", err, result);
    });
}
util.inherits(LoginClient, EventEmitter);
LoginClient.prototype.connect = function (callback) {
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
                        case 0: return [4 /*yield*/, me._protocol.pack("LoginRequest", {
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
        var me, data;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    me = this;
                    return [4 /*yield*/, SetupLoginRequest(fingerprint, this._soeClient._sessionId.toString(), this._soeClient._protocol)];
                case 1:
                    data = _a.sent();
                    debug("Sending login request");
                    this._soeClient.sendAppData(data, true);
                    me.emit("connect");
                    return [2 /*return*/];
            }
        });
    });
};
LoginClient.prototype.disconnect = function () {
    this._soeClient.disconnect();
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
LoginClient.prototype.requestCharacterDelete = function () { };
LoginClient.prototype.requestCharacterCreate = function () { };
LoginClient.prototype.getPlaySession = function (token, callback) {
    debug("Fetching play session from lp.soe.com");
    var me = this;
    var options = {
        host: "lp.soe.com",
        path: "/" + this._gameId + "/" + this._environment + "/get_play_session",
        headers: {
            Cookie: "lp-token=" + token,
        },
        method: "GET",
    };
    var request = https.get(options, function (res) {
        var data = "";
        res.setEncoding("utf8");
        res.on("data", function (chunk) {
            data += chunk;
        });
        res.on("end", function () {
            var obj = JSON.parse(data);
            if (obj && obj.result == "SUCCESS") {
                var args = obj.launch_args.split(" ");
                var argObj = {};
                for (var i = 0; i < args.length; i++) {
                    var arg = args[i].split("=");
                    argObj[arg[0]] = arg[1];
                }
                var sessionId = argObj.sessionid;
                debug("Received play session (" + sessionId + ")");
                callback(null, sessionId);
            }
            else {
                debug("Play session request failed");
                var msg = obj ? obj.result : "Unknown launchpad error";
                callback(new LoginError(msg));
            }
        });
    });
};
exports.LoginClient = LoginClient;
