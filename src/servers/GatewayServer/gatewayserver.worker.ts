// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2024 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

import { workerData } from "worker_threads";
import { GatewayServer } from "./gatewayserver";
import { GatewayServerThreadedInternalEvents } from "./gatewayserver.threaded";
import { SOEOutputChannels } from "servers/SoeServer/soeoutputstream";

const {
  serverPort,
  gatewayKey,
  appDataChannel,
  disconnectChannel,
  loginChannel,
  internalChannel
} = workerData;

const gatewayServer = new GatewayServer(serverPort, gatewayKey);

internalChannel.on("message", (msg: GatewayServerThreadedInternalEvents) => {
  switch (msg) {
    case GatewayServerThreadedInternalEvents.START:
      gatewayServer.start();
      break;
    case GatewayServerThreadedInternalEvents.STOP:
      gatewayServer.stop();
      break;
  }
});

gatewayServer.on("disconnect", (client) => {
  disconnectChannel.postMessage({ client });
});

gatewayServer.on("login", (client, characterId, ticket, client_protocol) => {
  loginChannel.postMessage({ client, characterId, ticket, client_protocol });
});

gatewayServer.on("tunneldata", (client, data, channel) => {
  appDataChannel.postMessage({ client, data, channel }, [data.buffer]);
});

interface appDataMessage {
  client: any;
  data: Buffer;
  channel: SOEOutputChannels;
}

appDataChannel.on("message", (msg: appDataMessage) => {
  gatewayServer.sendTunnelData(msg.client, msg.data, msg.channel);
});
