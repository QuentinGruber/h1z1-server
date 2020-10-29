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

PackageSetting = require("./package.json");

console.log(PackageSetting.name + " V" + PackageSetting.version);

exports.SOEInputStream = require("./lib/soeinputstream.js").SOEInputStream;
exports.SOEOutputStream = require("./lib/soeoutputstream.js").SOEOutputStream;

exports.SOEProtocol = require("./lib/soeprotocol.js").SOEProtocol;
exports.LoginProtocol = require("./lib/loginprotocol.js").LoginProtocol;
exports.GatewayProtocol = require("./lib/gatewayprotocol.js").GatewayProtocol;
exports.ZoneProtocol = require("./lib/zoneprotocol.js").ZoneProtocol;
exports.H1Z1Protocol = require("./lib/h1z1protocol.js").H1Z1Protocol;

exports.ZonePackets = require("./lib/zonepackets.js");
exports.H1Z1Packets = require("./lib/h1z1packets.js");

exports.SOEClient = require("./lib/soeclient.js").SOEClient;
exports.LoginClient = require("./lib/loginclient.js").LoginClient;
exports.GatewayClient = require("./lib/gatewayclient.js").GatewayClient;
exports.ZoneClient = require("./lib/zoneclient.js").ZoneClient;

exports.SOEServer = require("./lib/soeserver.js").SOEServer;
exports.LoginServer = require("./lib/loginserver.js").LoginServer;
exports.GatewayServer = require("./lib/gatewayserver.js").GatewayServer;
exports.ZoneServer = require("./lib/zoneserver.js").ZoneServer;

exports.SOEProxy = require("./lib/soeproxy.js").SOEProxy;
exports.LoginProxy = require("./lib/loginproxy.js").LoginProxy;
exports.GatewayProxy = require("./lib/gatewayproxy.js").GatewayProxy;
exports.ZoneProxy = require("./lib/zoneproxy.js").ZoneProxy;
exports.TransparentProxy = require("./lib/transproxy.js").TransparentProxy;
