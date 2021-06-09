const { ZoneServer } = require("../../h1z1-server");
const { Base64 } = require("js-base64");
const Zone = new ZoneServer(
  1117,
  Base64.toUint8Array("F70IaxuU8C/w7FPXY1ibXw==")
);
Zone.start();
