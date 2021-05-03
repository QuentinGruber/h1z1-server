const debug = require("debug")("zonepacketHandlers");

const admin = {
  shutdown: async function (server, client, args) {
    server.sendDataToAll("WorldShutdownNotice", {
      timeLeft: 0,
      message: " ",
    });
    if (!server._soloMode) {
      server.sendDataToAll("CharacterSelectSessionResponse", {
        status: 1,
        sessionId: "placeholder", // TODO: get sessionId from client object
      });
      await server.saveWorld();
      process.exit(0);
    }
  },
};

export default admin;
