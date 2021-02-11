// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (c) 2021 Quentin Gruber
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

const PackageSetting = require("./package.json");

console.log(PackageSetting.name + " V" + PackageSetting.version);

exports.SOEInputStream = require("./out/src/servers/SoeServer/soeinputstream.js").SOEInputStream;
exports.SOEOutputStream = require("./out/src/servers/SoeServer/soeoutputstream.js").SOEOutputStream;

exports.SOEProtocol = require("./out/src/protocols/soeprotocol.js").SOEProtocol;
exports.LoginProtocol = require("./out/src/protocols/loginprotocol.js").LoginProtocol;
exports.GatewayProtocol = require("./out/src/protocols/gatewayprotocol.js").GatewayProtocol;
exports.ZoneProtocol = require("./out/src/protocols/archived/zoneprotocol.js").ZoneProtocol;
exports.H1Z1Protocol = require("./out/src/protocols/h1z1protocol.js").H1Z1Protocol;

exports.SOEClient = require("./out/src/clients/soeclient.js").SOEClient;
exports.LoginClient = require("./out/src/clients/loginclient.js").LoginClient;
exports.GatewayClient = require("./out/src/clients/gatewayclient.js").GatewayClient;
exports.ZoneClient = require("./out/src/clients/zoneclient.js").ZoneClient;

exports.SOEServer = require("./out/src/servers/SoeServer/soeserver.js").SOEServer;
exports.LoginServer = require("./out/src/servers/LoginServer/loginserver.js").LoginServer;
exports.GatewayServer = require("./out/src/servers/GatewayServer/gatewayserver.js").GatewayServer;
exports.ZoneServer = require("./out/src/servers/ZoneServer/zoneserver.js").ZoneServer;

exports.SOEProxy = require("./out/src/proxies/soeproxy.js").SOEProxy;
exports.LoginProxy = require("./out/src/proxies/loginproxy.js").LoginProxy;
exports.GatewayProxy = require("./out/src/proxies/gatewayproxy.js").GatewayProxy;
exports.ZoneProxy = require("./out/src/proxies/zoneproxy.js").ZoneProxy;
exports.TransparentProxy = require("./out/src/proxies/transproxy.js").TransparentProxy;
