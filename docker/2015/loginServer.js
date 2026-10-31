const debug = require("debug")("h1emu:docker:2015:loginServer");
const { LoginServer } = require("../../h1z1-server");
const server = new LoginServer(1115, process.env.MONGO_URL);
server
  .start()
  .then(() => {
    debug("[LOGIN] Ready: client UDP 1115; internal UDP/WS 1110");
  })
  .catch((error) => {
    console.error("[LOGIN] Startup failed", error);
    process.exit(1);
  });
