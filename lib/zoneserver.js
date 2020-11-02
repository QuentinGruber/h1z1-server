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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZoneServer = void 0;
var events_1 = require("events");
var gatewayserver_1 = require("./gatewayserver");
var fs_1 = __importDefault(require("fs"));
var zonepackethandlers_1 = __importDefault(require("./zonepackethandlers"));
var h1z1protocol_1 = require("./h1z1protocol");
// import {MongoClient} from "mongodb"
var debug = require("debug")("ZoneServer");
Date.now = function () {
    // force current time
    return 971172000000;
};
function Int64String(value) {
    return "0x" + ("0000000000000000" + value.toString(16)).substr(-16);
}
var ZoneServer = /** @class */ (function (_super) {
    __extends(ZoneServer, _super);
    function ZoneServer(serverPort, gatewayKey, UsingMongo) {
        var _this = _super.call(this) || this;
        _this._gatewayServer = new gatewayserver_1.GatewayServer("ExternalGatewayApi_3", serverPort, gatewayKey);
        _this._protocol = new h1z1protocol_1.H1Z1Protocol();
        _this._clients = {};
        _this._characters = {};
        _this._ncps = {};
        _this._usingMongo = UsingMongo;
        _this._serverTime = Date.now() / 1000;
        _this._transientId = 0;
        _this._guids = {};
        _this._packetHandlers = zonepackethandlers_1.default;
        _this._startTime = 0;
        _this.on("data", function (err, client, packet) {
            if (err) {
                console.error(err);
            }
            else {
                if (packet.name != "KeepAlive") {
                    debug("Receive Data " + [packet.name]);
                }
                if (_this._packetHandlers[packet.name]) {
                    try {
                        _this._packetHandlers[packet.name](_this, client, packet);
                    }
                    catch (e) {
                        console.log(e);
                    }
                }
                else {
                    debug("Packet not implemented in packetHandlers");
                }
            }
        });
        _this.on("login", function (err, client) {
            if (err) {
                console.error(err);
            }
            else {
                debug("zone login");
                /*
              this.sendRawData(
                client,
                fs.readFileSync(
                  `${__dirname}/data/zone/ReferenceData.WeaponDefinitions.dat`
                )*/
                _this.sendData(client, "InitializationParameters", {
                    environment: "local",
                    serverId: 1,
                });
                var itemData = fs_1.default.readFileSync(__dirname + "/data/ClientItemDefinitions.txt", "utf8"), itemLines = itemData.split("\n"), items = {};
                for (var i = 1; i < itemLines.length; i++) {
                    var line = itemLines[i].split("^");
                    if (line[0]) {
                        items[line[0]] = line[1];
                    }
                }
                var referenceData = { itemTypes: items };
                _this.setReferenceData(referenceData);
                _this.sendData(client, "SendZoneDetails", {
                    zoneName: "Z1",
                    unknownBoolean1: true,
                    zoneType: 4,
                    unknownFloat1: 1,
                    skyData: {
                        name: "sky",
                        unknownDword1: 0,
                        unknownDword2: 0,
                        unknownDword3: 0,
                        fog: 0,
                        unknownDword5: 0,
                        unknownDword6: 0,
                        unknownDword7: 0,
                        unknownDword8: 0,
                        temperature: 40,
                        unknownDword10: 0,
                        unknownDword11: 0,
                        unknownDword12: 0,
                        unknownDword13: 0,
                        unknownDword14: 0,
                        unknownDword15: 0,
                        unknownDword16: 0,
                        unknownDword17: 0,
                        unknownDword18: 0,
                        unknownDword19: 0,
                        unknownDword20: 0,
                        unknownDword21: 0,
                        unknownDword22: 0,
                        unknownDword23: 0,
                        unknownDword24: 0,
                        unknownDword25: 0,
                        unknownArray: [],
                    },
                    zoneId1: 3905829720,
                    zoneId2: 3905829720,
                    nameId: 7699,
                    unknownBoolean7: true,
                });
                _this.sendData(client, "ClientUpdate.ZonePopulation", {
                    populations: [0, 0],
                });
                _this.sendData(client, "ClientUpdate.RespawnLocations", {
                    unknownFlags: 0,
                    locations: [],
                    unknownDword1: 0,
                    unknownDword2: 0,
                    locations2: [],
                });
                _this.sendData(client, "ClientGameSettings", {
                    unknownDword1: 0,
                    unknownDword2: 7,
                    unknownBoolean1: true,
                    timescale: 1,
                    unknownDword3: 1,
                    unknownDword4: 1,
                    unknownDword5: 0,
                    unknownFloat2: 12,
                    unknownFloat3: 110,
                });
                var self = require(__dirname + "/data/sendself.json");
                client.character.guid = self.data.guid;
                client.character.loadouts = self.data.characterLoadoutData.loadouts;
                client.character.inventory = self.data.inventory;
                client.character.factionId = self.data.factionId;
                client.character.name = self.data.identity.characterName;
                _this.sendData(client, "SendSelfToClient", self);
                _this.sendData(client, "PlayerUpdate.SetBattleRank", {
                    characterId: client.character.characterId,
                    battleRank: 100,
                });
            }
        });
        _this._gatewayServer.on("login", function (err, client, characterId) {
            debug("Client logged in from " +
                client.address +
                ":" +
                client.port +
                " with character id " +
                characterId);
            _this._clients[client.sessionId] = client;
            client.transientIds = {};
            client.transientId = 0;
            client.character = {
                characterId: characterId,
                state: {
                    position: [0, 0, 0, 0],
                    rotation: [0, 0, 0, 0],
                    health: 0,
                    shield: 0,
                },
                client: client,
            };
            _this._characters[characterId] = client.character;
            _this.emit("login", err, client);
        });
        _this._gatewayServer.on("disconnect", function (err, client) {
            debug("Client disconnected from " + client.address + ":" + client.port);
            delete _this._clients[client.sessionId];
            _this.emit("disconnect", err, client);
        });
        _this._gatewayServer.on("session", function (err, client) {
            debug("Session started for client " + client.address + ":" + client.port);
        });
        _this._gatewayServer.on("tunneldata", function (err, client, data, flags) {
            var packet = _this._protocol.parse(data, flags, true, _this._referenceData);
            if (packet) {
                _this.emit("data", null, client, packet);
            }
            else {
                debug("zonefailed : ", packet);
            }
        });
        return _this;
    }
    ZoneServer.prototype.start = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                debug("Starting server");
                this._startTime += Date.now();
                /*
              if (this._usingMongo) {
                const uri = "mongodb://localhost:27017";
                const mongoClient = (this._mongoClient = new MongoClient(uri, {
                  useUnifiedTopology: true,
                  native_parser: true,
                }));
                try {
                  await mongoClient.connect();
                } catch (e) {
                  throw console.error("[ERROR]Unable to connect to mongo server");
                }
                if (mongoClient.isConnected()) {
                  debug("connected to mongo !");
                  this._db = await mongoClient.db("h1server");
                } else {
                  throw console.log("Unable to authenticate on mongo !", 2);
                }
              }*/
                this._gatewayServer.start();
                return [2 /*return*/];
            });
        });
    };
    ZoneServer.prototype.data = function (collectionName) {
        if (this._db) {
            return this._db.collection(collectionName);
        }
    };
    ZoneServer.prototype.setReferenceData = function (referenceData) {
        this._referenceData = referenceData;
    };
    ZoneServer.prototype.sendSystemMessage = function (client, message) {
        this.sendDataToAll("Chat.Chat", {
            unknown2: 0,
            channel: 2,
            characterId1: "0x0000000000000000",
            characterId2: "0x0000000000000000",
            unknown5_0: 0,
            unknown5_1: 0,
            unknown5_2: 0,
            characterName1: "",
            unknown5_3: "",
            unknown6_0: 0,
            unknown6_1: 0,
            unknown6_2: 0,
            characterName2: "",
            unknown6_3: "",
            message: message,
            position: [0, 0, 0, 1],
            unknownGuid: "0x0000000000000000",
            unknown13: 0,
            color1: 0,
            color2: 0,
            unknown15: 0,
            unknown16: false,
        });
    };
    ZoneServer.prototype.sendChat = function (client, message, channel) {
        var character = client.character;
        this.sendData(client, "Chat.Chat", {
            channel: channel,
            characterName1: character.name,
            message: message,
            color1: 1,
        });
    };
    ZoneServer.prototype.sendChatText = function (client, message) {
        this.sendData(client, "Chat.ChatText", {
            message: message,
            unknownDword1: 0,
            color: [255, 255, 255, 0],
            unknownDword2: 13951728,
            unknownByte3: 0,
            unknownByte4: 1,
        });
    };
    ZoneServer.prototype.setCharacterLoadout = function (client, loadoutId, loadoutTab) {
        for (var i = 0; i < client.character.loadouts.length; i++) {
            var loadout = client.character.loadouts[i];
            if (loadout.loadoutId == loadoutId &&
                loadout.unknownDword2 == loadoutTab) {
                this.sendChatText(client, "Setting loadout " + loadoutId);
                debug(JSON.stringify(loadout, null, 2));
                client.character.currentLoadout = loadout.loadoutData;
                client.character.currentLoadoutId = loadoutId;
                client.character.currentLoadoutTab = loadoutTab;
                this.sendData(client, "Loadout.SetCurrentLoadout", {
                    type: 2,
                    unknown1: 0,
                    loadoutId: loadoutId,
                    tabId: loadoutTab,
                    unknown2: 1,
                });
                break;
            }
        }
    };
    ZoneServer.prototype.sendData = function (client, packetName, obj) {
        if (packetName != "KeepAlive") {
            debug("send data", packetName);
        }
        var data = this._protocol.pack(packetName, obj, this._referenceData);
        if (Array.isArray(client)) {
            for (var i = 0; i < client.length; i++) {
                this._gatewayServer.sendTunnelData(client[i], data);
            }
        }
        else {
            this._gatewayServer.sendTunnelData(client, data);
        }
    };
    ZoneServer.prototype.sendDataToAll = function (packetName, obj) {
        for (var a in this._clients) {
            this.sendData(this._clients[a], packetName, obj);
        }
    };
    ZoneServer.prototype.sendWeaponPacket = function (client, packetName, obj) {
        var weaponPacket = {
            gameTime: this.getServerTime(),
            packetName: packetName,
            packet: obj,
        };
        this.sendData(client, "Weapon.Weapon", {
            weaponPacket: weaponPacket,
        });
    };
    ZoneServer.prototype.sendRawData = function (client, data) {
        this._gatewayServer.sendTunnelData(client, data);
    };
    ZoneServer.prototype.stop = function () {
        debug("Shutting down");
    };
    ZoneServer.prototype.getGameTime = function () {
        debug("get game time");
        return Math.floor(Date.now() / 1000);
    };
    ZoneServer.prototype.getServerTime = function () {
        debug("get server time");
        var delta = Date.now() - this._startTime;
        delta = Math.floor(delta / 1000);
        return this._serverTime + delta;
    };
    ZoneServer.prototype.sendGameTimeSync = function (client) {
        debug("GameTimeSync");
        this.sendData(client, "GameTimeSync", {
            time: Int64String(this.getGameTime()),
            unknownFloat1: 12,
            unknownBoolean1: false,
        });
    };
    ZoneServer.prototype.generateGuid = function () {
        var str = "0x";
        for (var i = 0; i < 16; i++) {
            str += Math.floor(Math.random() * 16).toString(16);
        }
        if (!this._guids[str]) {
            this._guids[str] = true;
            return str;
        }
        else {
            debug("generateGuid failed! retrying...");
            this.generateGuid();
        }
    };
    ZoneServer.prototype.getTransientId = function (client, guid) {
        if (!client.transientIds[guid]) {
            client.transientId++;
            client.transientIds[guid] = client.transientId;
        }
        return client.transientIds[guid];
    };
    ZoneServer.prototype.spawnNPC = function (npcId, position, rotation, callback) {
        var _this = this;
        this.data("npcs").findOne({ id: npcId }, function (err, npc) {
            if (err) {
                debug(err);
                return;
            }
            if (npc) {
                var guid = _this.generateGuid();
                _this.npcs[guid] = {
                    guid: guid,
                    position: position,
                    rotation: rotation,
                    npcDefinition: npc,
                };
                /*
              var npcData = {
                guid: guid,
                transientId: this._transientId,
                unknownString0: "",
                nameId: npc.name_id > 0 ? npc.name_id : 0,
                unknownDword2: 242919,
                unknownDword3: 310060,
                unknownByte1: 1,
                modelId: npc.model_id || 0,
                scale: [1, 1, 1, 1],
                unknownString1: "",
                unknownString2: "",
                unknownDword5: 0,
                unknownDword6: 0,
                position: position,
                unknownVector1: [0, -0.7071066498756409, 0, 0.70710688829422],
                rotation: [-1.570796012878418, 0, 0, 0],
                unknownDword7: 0,
                unknownFloat1: 0,
                unknownString3: "",
                unknownString4: "",
                unknownString5: "",
                vehicleId: 0,
                unknownDword9: 0,
                npcDefinitionId: npc.id || 0,
                unknownByte2: 0,
                profileId: npc.profile_id || 0,
                unknownBoolean1: true,
                unknownData1: {
                  unknownByte1: 16,
                  unknownByte2: 10,
                  unknownByte3: 0,
                },
                unknownByte6: 0,
                unknownDword11: 0,
                unknownGuid1: "0x0000000000000000",
                unknownData2: {
                  unknownGuid1: "0x0000000000000000",
                },
                unknownDword12: 0,
                unknownDword13: 0,
                unknownDword14: 0,
                unknownByte7: 0,
                unknownArray1: [],
              };
              */
                callback(null, _this.npcs[guid]);
            }
            else {
                callback("NPC " + npcId + " not found");
            }
        });
    };
    ZoneServer.prototype.spawnVehicle = function (vehicleId) { };
    ZoneServer.prototype.createPositionUpdate = function (position, rotation) {
        var obj = {
            flags: 4095,
            unknown2_int32: this.getGameTime(),
            unknown3_int8: 0,
            unknown4: 1,
            position: position,
            unknown6_int32: 3217625048,
            unknown7_float: 0,
            unknown8_float: 0,
            unknown9_float: 0,
            unknown10_float: 0,
            unknown11_float: 0,
            unknown12_float: [0, 0, 0],
            unknown13_float: rotation,
            unknown14_float: 0,
            unknown15_float: 0,
        };
        return obj;
    };
    return ZoneServer;
}(events_1.EventEmitter));
exports.ZoneServer = ZoneServer;
