process.env.DEBUG = "*";
const H1Z1servers = require("../../h1z1-server");
var server = new H1Z1servers.LoginServer(
  1115, // <- server port
  "" // <- MongoDB address ( if blank server start in solo mode )
);
server._protocol = new H1Z1servers.LoginProtocol("LoginUdp_11");
server.start();
