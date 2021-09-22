process.env.DEBUG = "ZoneServer";
const { ZoneServer } = require("../../h1z1-server");
const Zone = new ZoneServer(
  1117,
  new Buffer.from("F70IaxuU8C/w7FPXY1ibXw==", "base64"),
  process.env.MONGO_URL,
  Number(process.env.WORLD_ID)
);
Zone.start();
