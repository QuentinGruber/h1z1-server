const debug = require("debug")("zonepacketHandlers");
import { generateCharacterId } from "../../../utils/utils";

const dev = {
  testpacket: function (server, client, args) {
    const packetName = args[1];
    server.sendData(client, packetName, {});
  },
  testNpc: function (server, client, args) {
    const characterId = generateCharacterId();
    server.sendData(client, "PlayerUpdate.AddLightweightNpc", {
      characterId: characterId,
      transientId: server.getTransientId(client, characterId),
      position: client.character.state.position,
      array5: [{ unknown1: 0 }],
      array17: [{ unknown1: 0 }],
      array18: [{ unknown1: 0 }],
    });
  },
  testLoot: function (server, client, args) {
    server.sendData(client, "Loot.Reply", {
      array4: [{ unknown10: 1 }, { unknown10: 1 }],
    });
    /*for (let index = 1000; index < 2000; index++) {
      server.sendData(client, "Loot.Reply", {
        unknown1: index,
        unknown2: index,
        unknown3: index,
        unknown4: index,
        unknown5: index,
        unknown6: index,
        unknown7: index,
        unknown8: index,
        unknown9: index,
        unknown11: index,
        array3: [{ unknown1: index }, { unknown1: index }],
        array4: [{ unknown10: 1 }, { unknown10: 1 }],
      });
    }*/
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
