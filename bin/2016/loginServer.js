const { LoginServer, LoginProtocol } = require("../../h1z1-server");
const server = new LoginServer(1115, "");
server._protocol = new LoginProtocol("LoginUdp_11");
server.start();
