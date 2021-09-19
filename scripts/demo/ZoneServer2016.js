process.env.DEBUG = "ZoneServer";
const H1Z1servers = require("../../h1z1-server");
var Zone = new H1Z1servers.ZoneServer2016(
  1117,
  new Buffer.from("F70IaxuU8C/w7FPXY1ibXw==", "base64")
);
Zone.start();
