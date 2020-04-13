var EventEmitter = require("events").EventEmitter,
  SOEServer = require("./soeserver").SOEServer,
  fs = require("fs"),
  util = require("util"),
  LoginProtocol = require("./loginprotocol").LoginProtocol,
  LoginOpCodes = require("./loginprotocol").LoginOpCodes,
  debug = require("debug")("LoginServer"),
  MongoClient = require("mongodb").MongoClient,
  MongoServer = require("mongodb").Server;

function LoginError(message) {
  this.name = this.constructor.name;
  this.message = message;
}
util.inherits(LoginError, Error);

function LoginServer(gameId, environment, serverPort, loginKey, backend) {
  async function loginserver_as() {
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
    var server = this;
    server = await start_server(server);
    server._soeServer.start(
      server._compression,
      server._crcSeed,
      server._crcLength,
      server._udpLength
    );
    soeServer.on("connect", function (err, client) {
      debug("Client connected from " + client.address + ":" + client.port);
      console.log(
        "Client connected from " + client.address + ":" + client.port
      );
      console.log("DEBUUUUG " + server);
      //server.emit('connect', err, client);
    });

    soeServer.on("disconnect", function (err, client) {
      debug("Client disconnected from " + client.address + ":" + client.port);
      console.log(
        "Client disconnected from " + client.address + ":" + client.port
      );
      //server.emit('disconnect', err, client);
    });

    soeServer.on("session", function (err, client) {
      debug("Session started for client " + client.address + ":" + client.port);
      console.log(
        "Session started for client " + client.address + ":" + client.port
      );
    });

    soeServer.on("appdata", function (err, client, data) {
      var packet = protocol.parse(data),
        result = packet.result;
      switch (packet.name) {
        case "LoginRequest":
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
    });
  }
  loginserver_as();
}
util.inherits(LoginServer, EventEmitter);

async function start_server(server) {
  debug("Starting server");
  console.log("Starting server");
  const uri =
    "mongodb://localhost:27017/?readPreference=primary&appname=MongoDB%20Compass%20Community&ssl=false";
  const mongoClient = (this._mongoClient = new MongoClient(uri, {
    native_parser: true,
  }));
  let waiting = await mongoClient.connect();
  if (mongoClient.isConnected()) {
    console.log("connected to mongo !");
  }
  server._db = await mongoClient.db("h1test");
  return server;
}

LoginServer.prototype.data = function (collectionName) {
  if (this._db) {
    return this._db.collection(collectionName);
  }
};

LoginServer.prototype.stop = function () {
  debug("Shutting down");
  console.log("Shutting down");
};

exports.LoginServer = LoginServer;
