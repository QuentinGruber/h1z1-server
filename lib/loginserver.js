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
var EventEmitter = require("events").EventEmitter, SOEServer = require("./soeserver").SOEServer, fs = require("fs"), util = require("util"), LoginProtocol = require("./loginprotocol").LoginProtocol, LoginOpCodes = require("./loginprotocol").LoginOpCodes, debug = require("debug")("LoginServer"), MongoClient = require("mongodb").MongoClient, MongoServer = require("mongodb").Server;
function LoginError(message) {
    this.name = this.constructor.name;
    this.message = message;
}
util.inherits(LoginError, Error);
function LoginServer(gameId, environment, usingMongo, serverPort, loginKey, backend) {
    EventEmitter.call(this);
    this._usingMongo = usingMongo;
    this._compression = 0x0100;
    this._crcSeed = 0;
    this._crcLength = 2;
    this._udpLength = 512;
    this._gameId = gameId;
    this._environment = environment;
    var soeServer = (this._soeServer = new SOEServer("LoginUdp_9", serverPort, loginKey));
    var protocol = (this._protocol = new LoginProtocol());
    soeServer.on("connect", function (err, client) {
        debug("Client connected from " + client.address + ":" + client.port);
        //server.emit('connect', err, client);
    });
    soeServer.on("disconnect", function (err, client) {
        debug("Client disconnected from " + client.address + ":" + client.port);
        //server.emit('disconnect', err, client);
    });
    soeServer.on("session", function (err, client) {
        debug("Session started for client " + client.address + ":" + client.port);
    });
    soeServer.on("Force_sendServerList", function (err, client) {
        soeServer._db
            .collection("servers")
            .find()
            .toArray(function (err, servers) {
            // remove object id
            for (var i = 0; i < servers.length; i++) {
                delete servers[i]._id;
            }
            var data = protocol.pack("ServerListReply", {
                servers: servers,
            });
            soeServer.sendAppData(client, data, true);
        });
    });
    soeServer.on("SendServerUpdate", function (err, client) {
        soeServer._db
            .collection("servers")
            .find()
            .toArray(function (err, servers) {
            for (var i = 0; i < servers.length; i++) {
                delete servers[i]._id; // remove object id
                var data = protocol.pack("ServerUpdate", servers[i]);
                soeServer.sendAppData(client, data, true);
            }
        });
    });
    soeServer.on("appdata", function (err, client, data) {
        var packet = protocol.parse(data);
        if (packet != false) {
            // if packet parsing succeed
            var result = packet.result;
            switch (packet.name) {
                case "LoginRequest":
                    /*
                      backend.login(result.sessionId, result.fingerprint, function (
                        err,
                        result
                      ) {
                        if (err) {
                          server.emit("login", new LoginError("Login failed"));
                        } else {
                          var data = protocol.pack("LoginReply", result);
                          soeServer.sendAppData(client, data, true);
                        }
                      });
                      */
                    var falsified_data = {
                        // HACK
                        loggedIn: true,
                        status: 1,
                        isMember: true,
                        isInternal: true,
                        namespace: "",
                        payload: "e",
                    };
                    var data = protocol.pack("LoginReply", falsified_data);
                    soeServer.sendAppData(client, data, true);
                    break;
                case "ServerListRequest":
                    soeServer._db
                        .collection("servers")
                        .find()
                        .toArray(function (err, servers) {
                        var data = protocol.pack("ServerListReply", {
                            servers: servers,
                        });
                        soeServer.sendAppData(client, data, true);
                    });
                    break;
                case "CharacterSelectInfoRequest":
                    backend.getCharacterInfo(function (err, result) {
                        if (err) {
                            server.emit("characterselectinforequest", new LoginError("Character select info request failed"));
                        }
                        else {
                            var data = protocol.pack("CharacterSelectInfoReply", result);
                            soeServer.sendAppData(client, data, true, true);
                        }
                    });
                    break;
                case "CharacterLoginRequest":
                    backend.characterLogin(null, null, null, function (err, result) {
                        if (err) {
                            server.emit("characterloginrequest", new LoginError("Character login request failed"));
                        }
                        else {
                            result = JSON.parse(fs.readFileSync("data/characterloginreply.json"));
                            var data = protocol.pack("CharacterLoginReply", result);
                            soeServer.sendAppData(client, data, true);
                        }
                    });
                    break;
            }
        }
        else {
            debug("Packet parsing was unsuccesful");
        }
    });
}
util.inherits(LoginServer, EventEmitter);
LoginServer.prototype.start = function (callback) {
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
                    _a = this._soeServer;
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
};
exports.LoginServer = LoginServer;
