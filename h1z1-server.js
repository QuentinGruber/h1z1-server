// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2022 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================
require("./out/utils/processErrorHandling")

const PackageSetting = require("./package.json");
process.env.H1Z1_SERVER_VERSION = PackageSetting.version;
console.log(
  `${PackageSetting.name} V${PackageSetting.version} by H1emu community`
);
console.log(`Node ${process.version}`);



const h1z1Server = module.exports;

// Lazy load only on usage
h1z1Server.__defineGetter__("SOEInputStream", function () {
    return require("./out/servers/SoeServer/soeinputstream.js").SOEInputStream;
});

h1z1Server.__defineGetter__("SOEOutputStream", function () {
    return require("./out/servers/SoeServer/soeoutputstream.js").SOEOutputStream;
});  

h1z1Server.__defineGetter__("SOEProtocol", function () {
  return require("./out/protocols/soeprotocol.js").SOEProtocol;
});  

h1z1Server.__defineGetter__("LoginProtocol", function () {
  return require("./out/protocols/loginprotocol.js").LoginProtocol;
});  

h1z1Server.__defineGetter__("GatewayProtocol", function () {
  return require("./out/protocols/gatewayprotocol.js").GatewayProtocol;
});  

h1z1Server.__defineGetter__("H1Z1Protocol", function () {
  return require("./out/protocols/h1z1protocol.js").H1Z1Protocol;
});  

h1z1Server.__defineGetter__("SOEClient", function () {
  return require("./out/clients/soeclient.js").SOEClient;
});  

h1z1Server.__defineGetter__("SOEClientClass", function () {
  return require("./out/servers/SoeServer/soeclient.js").default;
});  

h1z1Server.__defineGetter__("LoginClient", function () {
  return require("./out/clients/loginclient.js").LoginClient;
}); 

h1z1Server.__defineGetter__("GatewayClient", function () {
  return require("./out/clients/gatewayclient.js").GatewayClient;
});  

h1z1Server.__defineGetter__("ZoneClient", function () {
  return require("./out/clients/zoneclient.js").ZoneClient;
});  

h1z1Server.__defineGetter__("ZoneClientClass", function () {
  return require("./out/servers/ZoneServer2015/classes/zoneclient.js").ZoneClient;
});

h1z1Server.__defineGetter__("Utils", function () {
  return require("./out/utils/utils");
});

h1z1Server.__defineGetter__("SOEServer", function () {
  return require("./out/servers/SoeServer/soeserver.js").SOEServer;
});  

h1z1Server.__defineGetter__("LoginServer", function () {
  return require("./out/servers/LoginServer/loginserver.js").LoginServer;
});  

h1z1Server.__defineGetter__("GatewayServer", function () {
  return require("./out/servers/GatewayServer/gatewayserver.js").GatewayServer;
});  

h1z1Server.__defineGetter__("ZoneServer", function () { // legacy
  return require("./out/servers/ZoneServer2015/zoneserver.js").ZoneServer2015;
});

h1z1Server.__defineGetter__("ZoneServer2015", function () {
  return require("./out/servers/ZoneServer2015/zoneserver.js").ZoneServer2015;
});  

h1z1Server.__defineGetter__("ZoneServer2016", function () {
  return require("./out/servers/ZoneServer2016/zoneserver.js").ZoneServer2016;
});