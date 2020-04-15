var EventEmitter = require("events").EventEmitter,
  SOEServer = require("./soeserver").SOEServer,
  fs = require("fs"),
  util = require("util"),
  LoginProtocol = require("./loginprotocol").LoginProtocol,
  LoginOpCodes = require("./loginprotocol").LoginOpCodes,
  debug = require("debug")("LoginServer"),
  MongoClient = require("mongodb").MongoClient,
  MongoServer = require("mongodb").Server;
log = require("./utils").log;

function LoginError(message) {
  this.name = this.constructor.name;
  this.message = message;
}
util.inherits(LoginError, Error);

function LoginServer(gameId, environment, serverPort, loginKey, backend) {
  EventEmitter.call(this);

  this._compression = 0x0100;
  this._crcSeed = 0;
  this._crcLength = 2;
  this._udpLength = 512;

  this._gameId = gameId;
  this._environment = environment;

  var soeServer = (this._soeServer = new SOEServer(
    "LoginUdp_9",
    serverPort,
    loginKey
  ));
  var protocol = (this._protocol = new LoginProtocol());

  soeServer.on("connect", function (err, client) {
    debug("Client connected from " + client.address + ":" + client.port);
    log("Client connected from " + client.address + ":" + client.port);
    //server.emit('connect', err, client);
  });

  soeServer.on("disconnect", function (err, client) {
    debug("Client disconnected from " + client.address + ":" + client.port);
    log("Client disconnected from " + client.address + ":" + client.port);
    //server.emit('disconnect', err, client);
  });

  soeServer.on("session", function (err, client) {
    debug("Session started for client " + client.address + ":" + client.port);
    log("Session started for client " + client.address + ":" + client.port);
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
          server
            .data("servers")
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
              server.emit(
                "characterselectinforequest",
                new LoginError("Character select info request failed")
              );
            } else {
              var data = protocol.pack("CharacterSelectInfoReply", result);
              soeServer.sendAppData(client, data, true, true);
            }
          });
          break;
        case "CharacterLoginRequest":
          backend.characterLogin(null, null, null, function (err, result) {
            if (err) {
              server.emit(
                "characterloginrequest",
                new LoginError("Character login request failed")
              );
            } else {
              result = JSON.parse(
                fs.readFileSync("data/characterloginreply.json")
              );
              var data = protocol.pack("CharacterLoginReply", result);
              soeServer.sendAppData(client, data, true);
            }
          });
          break;
      }
    } else {
      log("Packet parsing was unsuccesful", 2);
    }
  });
}
util.inherits(LoginServer, EventEmitter);

LoginServer.prototype.start = async function (callback) {
  debug("Starting server");
  log("Starting login server !");
  const uri =
    "mongodb://localhost:27017/?readPreference=primary&appname=MongoDB%20Compass%20Community&ssl=false";
  const mongoClient = (this._mongoClient = new MongoClient(uri, {
    native_parser: true,
  }));
  try {
    let waiting = await mongoClient.connect();
  } catch (e) {
    throw console.error("[ERROR]Unable to connect to mongo server");
  }
  if (mongoClient.isConnected()) {
    log("connected to mongo !");
    this._db = await mongoClient.db("h1server");
  } else {
    throw log("Unable to authenticate on mongo !", 2);
  }

  this._soeServer.start(
    this._compression,
    this._crcSeed,
    this._crcLength,
    this._udpLength
  );
};

LoginServer.prototype.data = function (collectionName) {
  if (this._db) {
    return this._db.collection(collectionName);
  }
};

LoginServer.prototype.stop = function () {
  debug("Shutting down");
  log("Shutting down");
};

exports.LoginServer = LoginServer;
