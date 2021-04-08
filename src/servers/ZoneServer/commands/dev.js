const debug = require("debug")("zonepacketHandlers");
import { generateCharacterId } from "../../../utils/utils";

const dev = {
  testpacket: function (server, client, args) {
    const packetName = args[1];
    server.sendData(client, packetName, {});
  },
  testNpc: function (server, client, args) {
    server.sendData(client, "PlayerUpdate.AddLightweightNpc", {
      characterId: generateCharacterId(),
      transientId: 1,
      array5: [{ unknown1: 1 }],
      array17: [{ unknown1: 1 }],
      array18: [{ unknown1: 1 }],
    });
  },
  reloadPackets: function (server, client, args) {
    if (args[1]) {
      server.reloadPackets(client, args[1]);
    } else {
      server.reloadPackets(client);
    }
  },
  reloadMongo: function (server, client, args) {
    server._soloMode
      ? server.sendChatText(client, "Can't do that in solomode...")
      : server.reloadMongoData(client);
  },
};

export default dev;
