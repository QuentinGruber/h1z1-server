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
exports.LoginServer = void 0;
var events_1 = require("events");
var SOEServer = require("../SoeServer/soeserver").SOEServer;
var loginprotocol_1 = require("../../protocols/loginprotocol");
var debug = require("debug")("LoginServer");
var mongodb_1 = require("mongodb");
var LoginServer = /** @class */ (function (_super) {
    __extends(LoginServer, _super);
    function LoginServer(gameId, environment, serverPort, loginKey, SoloMode) {
        if (SoloMode === void 0) { SoloMode = false; }
        var _this = _super.call(this) || this;
        _this._compression = 0x0100;
        _this._crcSeed = 0;
        _this._crcLength = 2;
        _this._udpLength = 512;
        _this._cryptoKey = loginKey;
        _this._gameId = gameId;
        _this._environment = environment;
        _this._soloMode = SoloMode;
        // reminders
        if (_this._soloMode) {
            debug("Server in solo mode !");
        }
        _this._soeServer = new SOEServer("LoginUdp_9", serverPort, _this._cryptoKey, null);
        _this._protocol = new loginprotocol_1.LoginProtocol();
        _this._soeServer.on("connect", function (err, client) {
            debug("Client connected from " + client.address + ":" + client.port);
            _this.emit("connect", err, client);
        });
        _this._soeServer.on("disconnect", function (err, client) {
            debug("Client disconnected from " + client.address + ":" + client.port);
            _this.emit("disconnect", err, client);
        });
        _this._soeServer.on("session", function (err, client) {
            debug("Session started for client " + client.address + ":" + client.port);
        });
        _this._soeServer.on("SendServerUpdate", function (err, client) { return __awaiter(_this, void 0, void 0, function () {
            var servers, i, data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!!this._soloMode) return [3 /*break*/, 2];
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
        _this._soeServer.on("appdata", function (err, client, data) { return __awaiter(_this, void 0, void 0, function () {
            var packet, result, data_1, _a, falsified_data, CharactersInfo, SinglePlayerCharacter, characters, servers, SoloServer, i, characters_delete_info, WaitSuccess, charactersLoginInfo, _b, serverId, characterId, serverAddress, reply_data, TestData;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        packet = this._protocol.parse(data);
                        if (!(packet !== false)) return [3 /*break*/, 22];
                        result = packet.result;
                        _a = packet.name;
                        switch (_a) {
                            case "LoginRequest": return [3 /*break*/, 1];
                            case "CharacterSelectInfoRequest": return [3 /*break*/, 2];
                            case "ServerListRequest": return [3 /*break*/, 6];
                            case "CharacterDeleteRequest": return [3 /*break*/, 10];
                            case "CharacterLoginRequest": return [3 /*break*/, 14];
                            case "CharacterCreateRequest": return [3 /*break*/, 18];
                            case "TunnelAppPacketClientToServer": return [3 /*break*/, 19];
                            case "Logout": return [3 /*break*/, 20];
                        }
                        return [3 /*break*/, 21];
                    case 1:
                        falsified_data = {
                            loggedIn: true,
                            status: 1,
                            isMember: true,
                            isInternal: true,
                            namespace: "soe",
                            ApplicationPayload: "",
                        };
                        data_1 = this._protocol.pack("LoginReply", falsified_data);
                        this._soeServer.sendAppData(client, data_1, true);
                        _c.label = 2;
                    case 2:
                        CharactersInfo = void 0;
                        if (!this._soloMode) return [3 /*break*/, 3];
                        SinglePlayerCharacter = require("../../../data/single_player_character.json");
                        CharactersInfo = {
                            status: 1,
                            canBypassServerLock: true,
                            characters: [SinglePlayerCharacter],
                        };
                        return [3 /*break*/, 5];
                    case 3: return [4 /*yield*/, this._db
                            .collection("characters")
                            .find()
                            .toArray()];
                    case 4:
                        characters = _c.sent();
                        CharactersInfo = {
                            status: 1,
                            canBypassServerLock: true,
                            characters: characters,
                        };
                        _c.label = 5;
                    case 5:
                        data_1 = this._protocol.pack("CharacterSelectInfoReply", CharactersInfo);
                        this._soeServer.sendAppData(client, data_1, true);
                        debug("CharacterSelectInfoRequest");
                        _c.label = 6;
                    case 6:
                        servers = void 0;
                        if (!!this._soloMode) return [3 /*break*/, 8];
                        return [4 /*yield*/, this._db.collection("servers").find().toArray()];
                    case 7:
                        servers = _c.sent();
                        return [3 /*break*/, 9];
                    case 8:
                        if (this._soloMode) {
                            SoloServer = require("../../../data/single_player_server.json");
                            servers = [SoloServer];
                        }
                        _c.label = 9;
                    case 9:
                        for (i = 0; i < servers.length; i++) {
                            if (servers[i]._id) {
                                delete servers[i]._id;
                            }
                        }
                        data_1 = this._protocol.pack("ServerListReply", {
                            servers: servers,
                        });
                        this._soeServer.sendAppData(client, data_1, true);
                        return [3 /*break*/, 21];
                    case 10:
                        characters_delete_info = {
                            characterId: packet.result.characterId,
                            status: 1,
                            Payload: "\0"
                        };
                        data_1 = this._protocol.pack("CharacterDeleteReply", characters_delete_info);
                        this._soeServer.sendAppData(client, data_1, true);
                        debug("CharacterDeleteRequest");
                        if (!this._soloMode) return [3 /*break*/, 11];
                        debug("Deleting a character in solo mode is weird, modify single_player_character.json instead");
                        return [3 /*break*/, 21];
                    case 11: return [4 /*yield*/, this._db
                            .collection("characters")
                            .deleteOne({ characterId: packet.result.characterId }, function (err, obj) {
                            if (err) {
                                debug(err);
                            }
                            else {
                                debug("Character " +
                                    packet.result.characterId +
                                    " deleted !");
                            }
                        })];
                    case 12:
                        WaitSuccess = _c.sent();
                        _c.label = 13;
                    case 13: return [3 /*break*/, 21];
                    case 14:
                        charactersLoginInfo = void 0;
                        _b = packet.result, serverId = _b.serverId, characterId = _b.characterId;
                        if (!!this._soloMode) return [3 /*break*/, 16];
                        return [4 /*yield*/, this._db
                                .collection("servers")
                                .findOne({ serverId: serverId })];
                    case 15:
                        serverAddress = (_c.sent()).serverAddress;
                        charactersLoginInfo = {
                            characterId: characterId,
                            serverId: serverId,
                            status: 1,
                            unknown: 0,
                            payload: {
                                serverAddress: serverAddress,
                                serverTicket: "7y3Bh44sKWZCYZH",
                                encryptionKey: this._cryptoKey,
                                characterId: characterId,
                                guid: 722776196,
                                unknown2: 0,
                                stationName: "nope0no",
                                characterName: "LocalPlayer",
                                loginQueuePlacement: 0,
                            },
                        };
                        return [3 /*break*/, 17];
                    case 16:
                        charactersLoginInfo = {
                            characterId: characterId,
                            serverId: serverId,
                            status: 1,
                            unknown: 0,
                            payload: {
                                serverAddress: "127.0.0.1:1117",
                                serverTicket: "7y3Bh44sKWZCYZH",
                                encryptionKey: this._cryptoKey,
                                characterId: characterId,
                                guid: 722776196,
                                unknown2: 0,
                                stationName: "nope0no",
                                characterName: "LocalPlayer",
                                loginQueuePlacement: 0,
                            },
                        };
                        _c.label = 17;
                    case 17:
                        debug(charactersLoginInfo);
                        data_1 = this._protocol.pack("CharacterLoginReply", charactersLoginInfo);
                        this._soeServer.sendAppData(client, data_1, true);
                        debug("CharacterLoginRequest");
                        return [3 /*break*/, 21];
                    case 18:
                        reply_data = {
                            status: 1,
                            characterId: "0x03147cca2a860191",
                        };
                        data_1 = this._protocol.pack("CharacterCreateReply", reply_data);
                        this._soeServer.sendAppData(client, data_1, true);
                        return [3 /*break*/, 21];
                    case 19:
                        TestData = {
                            unknown1: true,
                        };
                        data_1 = this._protocol.pack("TunnelAppPacketServerToClient", TestData);
                        this._soeServer.sendAppData(client, data_1, true);
                        return [3 /*break*/, 21];
                    case 20:
                        this._soeServer.deleteClient(client);
                        _c.label = 21;
                    case 21: return [3 /*break*/, 23];
                    case 22:
                        debug("Packet parsing was unsuccesful");
                        _c.label = 23;
                    case 23: return [2 /*return*/];
                }
            });
        }); });
        return _this;
    }
    LoginServer.prototype.start = function () {
        return __awaiter(this, void 0, void 0, function () {
            var uri, mongoClient, e_1, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        debug("Starting server");
                        if (!!this._soloMode) return [3 /*break*/, 7];
                        uri = "mongodb://localhost:27017/?readPreference=primary&appname=MongoDB%20Compass%20Community&ssl=false";
                        mongoClient = (this._mongoClient = new mongodb_1.MongoClient(uri, {
                            useUnifiedTopology: true,
                            native_parser: true,
                        }));
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, mongoClient.connect()];
                    case 2:
                        _b.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        e_1 = _b.sent();
                        throw debug("[ERROR]Unable to connect to mongo server");
                    case 4:
                        if (!mongoClient.isConnected()) return [3 /*break*/, 6];
                        debug("connected to mongo !");
                        _a = this;
                        return [4 /*yield*/, mongoClient.db("h1server")];
                    case 5:
                        _a._db = _b.sent();
                        return [3 /*break*/, 7];
                    case 6: throw debug("Unable to authenticate on mongo !");
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
