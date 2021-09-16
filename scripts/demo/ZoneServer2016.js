process.env.DEBUG = "ZoneServer";
const H1Z1servers = require("../../h1z1-server");
const { Base64 } = require("js-base64");
var Zone = new H1Z1servers.ZoneServer2016(
  1117,
  Base64.toUint8Array("F70IaxuU8C/w7FPXY1ibXw==")
);
Zone.start();
