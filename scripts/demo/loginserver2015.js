process.env.DEBUG = "*";
const { LoginServer } = require("../../h1z1-server");
const server = new LoginServer(1115, process.env.MONGO_URL);
server.start();
