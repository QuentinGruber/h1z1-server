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
console.log(`Node ${process.version}`);

exports.SOEInputStream =
  require("./out/servers/SoeServer/soeinputstream.js").SOEInputStream;
exports.SOEOutputStream =
  require("./out/servers/SoeServer/soeoutputstream.js").SOEOutputStream;

exports.SOEProtocol = require("./out/protocols/soeprotocol.js").SOEProtocol;
exports.LoginProtocol =
  require("./out/protocols/loginprotocol.js").LoginProtocol;
exports.GatewayProtocol =
  require("./out/protocols/gatewayprotocol.js").GatewayProtocol;
exports.H1Z1Protocol = require("./out/protocols/h1z1protocol.js").H1Z1Protocol;

exports.SOEClient = require("./out/clients/soeclient.js").SOEClient;
exports.LoginClient = require("./out/clients/loginclient.js").LoginClient;
exports.GatewayClient = require("./out/clients/gatewayclient.js").GatewayClient;
exports.ZoneClient = require("./out/clients/zoneclient.js").ZoneClient;

exports.SOEServer = require("./out/servers/SoeServer/soeserver.js").SOEServer;
exports.LoginServer =
  require("./out/servers/LoginServer/loginserver.js").LoginServer;
exports.GatewayServer =
  require("./out/servers/GatewayServer/gatewayserver.js").GatewayServer;
exports.ZoneServer =
  require("./out/servers/ZoneServer/zoneserver.js").ZoneServer;
