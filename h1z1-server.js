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

const PackageSetting = require("./package.json");

console.log(PackageSetting.name + " V" + PackageSetting.version);

exports.SOEInputStream = require("./out/servers/SoeServer/soeinputstream.js").SOEInputStream;
exports.SOEOutputStream = require("./out/servers/SoeServer/soeoutputstream.js").SOEOutputStream;

exports.SOEProtocol = require("./out/protocols/soeprotocol.js").SOEProtocol;
exports.LoginProtocol = require("./out/protocols/loginprotocol.js").LoginProtocol;
exports.GatewayProtocol = require("./out/protocols/gatewayprotocol.js").GatewayProtocol;
exports.ZoneProtocol = require("./out/protocols/archived/zoneprotocol.js").ZoneProtocol;
exports.H1Z1Protocol = require("./out/protocols/h1z1protocol.js").H1Z1Protocol;

exports.ZonePackets = require("./out/packets/archived/zonepackets.js");
exports.H1Z1Packets = require("./out/packets/h1z1packets.js");

exports.SOEClient = require("./out/clients/soeclient.js").SOEClient;
exports.LoginClient = require("./out/clients/loginclient.js").LoginClient;
exports.GatewayClient = require("./out/clients/gatewayclient.js").GatewayClient;
exports.ZoneClient = require("./out/clients/zoneclient.js").ZoneClient;

exports.SOEServer = require("./out/servers/SoeServer/soeserver.js").SOEServer;
exports.LoginServer = require("./out/servers/LoginServer/loginserver.js").LoginServer;
exports.GatewayServer = require("./out/servers/GatewayServer/gatewayserver.js").GatewayServer;
exports.ZoneServer = require("./out/servers/ZoneServer/zoneserver.js").ZoneServer;

exports.SOEProxy = require("./out/proxies/soeproxy.js").SOEProxy;
exports.LoginProxy = require("./out/proxies/loginproxy.js").LoginProxy;
exports.GatewayProxy = require("./out/proxies/gatewayproxy.js").GatewayProxy;
exports.ZoneProxy = require("./out/proxies/zoneproxy.js").ZoneProxy;
exports.TransparentProxy = require("./out/proxies/transproxy.js").TransparentProxy;
