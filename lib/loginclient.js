var EventEmitter = require("events").EventEmitter,
  SOEClient = require("./soeclient").SOEClient,
  https = require("https"),
  fs = require("fs"),
  util = require("util"),
  LoginProtocol = require("./loginprotocol").LoginProtocol,
  LoginPackets = require("./loginprotocol").LoginPackets,
  loginProtocolName = "LoginUdp_9",
  debug = require("debug")("LoginClient");

function LoginError(message) {
  this.name = this.constructor.name;
  this.message = message;
}
util.inherits(LoginError, Error);

function LoginClient(
  gameId,
  environment,
  serverAddress,
  serverPort,
  loginKey,
  localPort
) {
  function privateFunction() {
    this.login();
  }
  EventEmitter.call(this);

  this._gameId = gameId;
  this._environment = environment;

  var soeClient = (this._soeClient = new SOEClient(
    loginProtocolName,
    serverAddress,
    serverPort,
    loginKey,
    localPort
  ));
  var protocol = (this._protocol = new LoginProtocol());
  var me = this;

  var n = 0;
  soeClient.on("appdata", function (err, data) {
    n++;
    var packet, result;

    try {
      packet = protocol.parse(data);
    } catch (e) {
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
        } else {
          me.emit("login", new LoginError("Login failed"));
        }
        break;
      case "ForceDisconnect":
        break;
      case "CharacterLoginReply":
        if (result.status === 1) {
          debug(JSON.stringify(result, null, 4));
          me.emit("characterlogin", null, result);
        } else {
          me.emit("characterlogin", new LoginError("Character login failed"));
        }
        break;
      case "CharacterCreateReply":
        if (result.status === 1) {
          me.emit("charactercreate", null, {});
        } else {
          me.emit("charactercreate", new LoginError("Character create failed"));
        }
        break;
      case "CharacterDeleteReply":
        if (result.status === 1) {
          me.emit("characterdelete", null, {});
        } else {
          me.emit("characterdelete", new LoginError("Character delete failed"));
        }
        break;
      case "CharacterSelectInfoReply":
        if (result.status === 1) {
          me.emit("characterinfo", null, result);
        } else {
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
        } else {
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

LoginClient.prototype.login = async function (fingerprint) {
  me = this;
  async function SetupLoginRequest(fingerprint, sessionId, protocol) {
    var data = await me._protocol.pack("LoginRequest", {
      sessionId: sessionId,
      systemFingerPrint: fingerprint,
    });
    return data;
  }
  var data = await SetupLoginRequest(
    fingerprint,
    this._soeClient._sessionId.toString(),
    this._soeClient._protocol
  );
  debug("Sending login request");
  this._soeClient.sendAppData(data, true);

  me.emit("connect");
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

LoginClient.prototype.requestCharacterLogin = function (
  characterId,
  serverId,
  payload
) {
  debug("Requesting character login");
  var data = this._protocol.pack("CharacterLoginRequest", {
    characterId: characterId,
    serverId: serverId,
    payload: payload,
  });
  if (data) {
    this._soeClient.sendAppData(data, true);
  } else {
    debug("Could not pack character login request data");
  }
};

LoginClient.prototype.requestCharacterDelete = function () {};

LoginClient.prototype.requestCharacterCreate = function () {};

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
      } else {
        debug("Play session request failed");
        var msg = obj ? obj.result : "Unknown launchpad error";
        callback(new LoginError(msg));
      }
    });
  });
};

exports.LoginClient = LoginClient;
