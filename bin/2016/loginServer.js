const { LoginServer } = require("../../h1z1-server");
const server = new LoginServer(1115, "");
server._protocol = new H1Z1servers.LoginProtocol("LoginUdp_11");
server.start();
