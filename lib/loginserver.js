"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
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
exports.LoginServer = void 0;
var events_1 = require("events");
var SOEServer = require("./soeserver").SOEServer, LoginProtocol = require("./loginprotocol").LoginProtocol, debug = require("debug")("LoginServer"), MongoClient = require("mongodb").MongoClient;
var LoginServer = /** @class */ (function (_super) {
    __extends(LoginServer, _super);
    function LoginServer(gameId, environment, usingMongo, serverPort, loginKey, SoloMode) {
        if (SoloMode === void 0) { SoloMode = false; }
        var _this = _super.call(this) || this;
        _this._usingMongo = usingMongo;
        _this._compression = 0x0100;
        _this._crcSeed = 0;
        _this._crcLength = 2;
        _this._udpLength = 512;
        _this._cryptoKey = loginKey;
        _this._gameId = gameId;
        _this._environment = environment;
        // reminders
        if (SoloMode) {
            debug("Server in solo mode, MongoDB ignored !");
        }
        else if (usingMongo) {
            debug("Server using Mongo !");
        }
        _this._soeServer = new SOEServer("LoginUdp_9", serverPort, _this._cryptoKey, null);
        _this._protocol = new LoginProtocol();
        _this._soeServer.on("connect", function (err, client) {
            debug("Client connected from " + client.address + ":" + client.port);
            //server.emit('connect', err, client);
        });
        _this._soeServer.on("disconnect", function (err, client) {
            debug("Client disconnected from " + client.address + ":" + client.port);
            //server.emit('disconnect', err, client);
        });
        _this._soeServer.on("session", function (err, client) {
            debug("Session started for client " + client.address + ":" + client.port);
        });
        _this._soeServer.on("SendServerUpdate", function (err, client) { return __awaiter(_this, void 0, void 0, function () {
            var servers, i, data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!usingMongo) return [3 /*break*/, 2];
                        return [4 /*yield*/, this._db.collection("servers").find().toArray()];
                    case 1:
                        servers = _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        servers = [
                            {
                                serverId: 1,
                                serverState: 0,
                                locked: false,
                                name: "fuckdb",
                                nameId: 1,
                                description: "yeah",
                                descriptionId: 1,
                                reqFeatureId: 0,
                                serverInfo: 'Region="CharacterCreate.RegionUs" PingAddress="127.0.0.1:1117" Subregion="UI.SubregionUS" IsRecommended="1" IsRecommendedVS="0" IsRecommendedNC="0" IsRecommendedTR="0"',
                                populationLevel: 1,
                                populationData: 'ServerCapacity="0" PingAddress="127.0.0.1:1117" Rulesets="Permadeath"',
                                allowedAccess: true,
                            },
                        ];
                        _a.label = 3;
                    case 3:
                        for (i = 0; i < servers.length; i++) {
                            if (servers[i]._id) {
                                delete servers[i]._id;
                            }
                            data = this._protocol.pack("ServerUpdate", servers[i]);
                            this._soeServer.sendAppData(client, data, true);
                        }
                        return [2 /*return*/];
                }
            });
        }); });
        _this._soeServer.on("appdata", function (err, client, data) { var data, data, data, data, data, data; return __awaiter(_this, void 0, void 0, function () {
            var packet, result, _a, falsified_data, servers, SoloServer, i, characters_delete_info, characters_info, SinglePlayerCharacter, characters_Login_info, test_data;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        packet = this._protocol.parse(data);
                        if (!(packet != false)) return [3 /*break*/, 11];
                        result = packet.result;
                        _a = packet.name;
                        switch (_a) {
                            case "LoginRequest": return [3 /*break*/, 1];
                            case "ServerListRequest": return [3 /*break*/, 2];
                            case "CharacterDeleteRequest": return [3 /*break*/, 6];
                            case "CharacterSelectInfoRequest": return [3 /*break*/, 7];
                            case "CharacterLoginRequest": return [3 /*break*/, 8];
                            case "TunnelAppPacketClientToServer": return [3 /*break*/, 9];
                        }
                        return [3 /*break*/, 10];
                    case 1:
                        falsified_data = {
                            loggedIn: true,
                            status: 1,
                            isMember: true,
                            isInternal: true,
                            namespace: "soe",
                            payload: "",
                        };
                        data = this._protocol.pack("LoginReply", falsified_data);
                        this._soeServer.sendAppData(client, data, true);
                        return [3 /*break*/, 10];
                    case 2:
                        servers = void 0;
                        if (!(usingMongo && !SoloMode)) return [3 /*break*/, 4];
                        return [4 /*yield*/, this._db.collection("servers").find().toArray()];
                    case 3:
                        servers = _b.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        if (SoloMode) {
                            SoloServer = require("../single_player_server.json");
                            servers = [SoloServer];
                        }
                        _b.label = 5;
                    case 5:
                        for (i = 0; i < servers.length; i++) {
                            if (servers[i]._id) {
                                delete servers[i]._id;
                            }
                        }
                        data = this._protocol.pack("ServerListReply", {
                            servers: servers,
                        });
                        this._soeServer.sendAppData(client, data, true);
                        return [3 /*break*/, 10];
                    case 6:
                        characters_delete_info = {
                            characterId: packet.result.characterId,
                        };
                        data = this._protocol.pack("CharacterDeleteReply", characters_delete_info);
                        this._soeServer.sendAppData(client, data, true, true);
                        debug("CharacterDeleteRequest");
                        return [3 /*break*/, 10];
                    case 7:
                        characters_info = void 0;
                        if (SoloMode) {
                            SinglePlayerCharacter = require("../single_player_character.json");
                            characters_info = {
                                status: 1,
                                canBypassServerLock: true,
                                characters: [SinglePlayerCharacter],
                            };
                        }
                        else {
                            characters_info = {
                                status: 1,
                                canBypassServerLock: true,
                                characters: [],
                            };
                        }
                        data = this._protocol.pack("CharacterSelectInfoReply", characters_info);
                        this._soeServer.sendAppData(client, data, true, true);
                        debug("CharacterSelectInfoRequest");
                        return [3 /*break*/, 10];
                    case 8:
                        characters_Login_info = void 0;
                        if (usingMongo) {
                            debug("[error] MongoDB support isn't ready");
                            characters_Login_info = {
                                characterId: packet.result.characterId,
                                serverId: 1,
                                status: 1,
                                unknown: 0,
                                payload: "\u0000",
                            };
                        }
                        else {
                            characters_Login_info = {
                                characterId: packet.result.characterId,
                                serverId: 1,
                                status: 1,
                                unknown: 0,
                                // prettier-ignore
                                payload: "\u0000",
                            };
                        }
                        debug(characters_Login_info);
                        data = this._protocol.pack("CharacterLoginReply", characters_Login_info);
                        this._soeServer.sendAppData(client, data, true);
                        debug("CharacterLoginRequest");
                        return [3 /*break*/, 10];
                    case 9:
                        test_data = {
                            unknown1: true,
                        };
                        data = this._protocol.pack("TunnelAppPacketServerToClient", test_data);
                        this._soeServer.sendAppData(client, data, true);
                        return [3 /*break*/, 10];
                    case 10: return [3 /*break*/, 12];
                    case 11:
                        debug("Packet parsing was unsuccesful");
                        _b.label = 12;
                    case 12: return [2 /*return*/];
                }
            });
        }); });
        return _this;
    }
    LoginServer.prototype.start = function () {
        return __awaiter(this, void 0, void 0, function () {
            var uri, mongoClient, waiting, e_1, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        debug("Starting server");
                        if (!this._usingMongo) return [3 /*break*/, 7];
                        uri = "mongodb://localhost:27017/?readPreference=primary&appname=MongoDB%20Compass%20Community&ssl=false";
                        mongoClient = (this._mongoClient = new MongoClient(uri, {
                            useUnifiedTopology: true,
                            native_parser: true,
                        }));
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, mongoClient.connect()];
                    case 2:
                        waiting = _b.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        e_1 = _b.sent();
                        throw console.error("[ERROR]Unable to connect to mongo server");
                    case 4:
                        if (!mongoClient.isConnected()) return [3 /*break*/, 6];
                        debug("connected to mongo !");
                        _a = this;
                        return [4 /*yield*/, mongoClient.db("h1server")];
                    case 5:
                        _a._db = _b.sent();
                        return [3 /*break*/, 7];
                    case 6: throw console.error("Unable to authenticate on mongo !", 2);
                    case 7:
                        this._soeServer.start(this._compression, this._crcSeed, this._crcLength, this._udpLength);
                        return [2 /*return*/];
                }
            });
        });
    };
    LoginServer.prototype.data = function (collectionName) {
        if (this._db) {
            return this._db.collection(collectionName);
        }
    };
    LoginServer.prototype.stop = function () {
        debug("Shutting down");
        process.exit(0);
    };
    return LoginServer;
}(events_1.EventEmitter));
exports.LoginServer = LoginServer;
