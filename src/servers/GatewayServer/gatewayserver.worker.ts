// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2025 H1emu community
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
  clientInfoChannel,
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

gatewayServer.on("disconnect", (sessionId: number) => {
  disconnectChannel.postMessage(sessionId);
});

gatewayServer.on(
  "login",
  (soeClientId, characterId, ticket, client_protocol) => {
    loginChannel.postMessage({
      soeClientId,
      characterId,
      ticket,
      client_protocol
    });
  }
);

gatewayServer.on("tunneldata", (sessionId, data, channel) => {
  appDataChannel.postMessage(
    { sessionId, data, channel }
    // FIXME:  transfering the buffer create weird behavior need to investigate
    // , [data.buffer]
  );
});

interface appDataMessage {
  soeClientId: string;
  data: Buffer;
  channel: SOEOutputChannels;
}

appDataChannel.on("message", (msg: appDataMessage) => {
  gatewayServer.sendTunnelData(msg.soeClientId, msg.data, msg.channel);
});

export interface ClientInfoMessage {
  soeClientId: string;
  requestId: number;
  fnName: keyof GatewayServer;
}
clientInfoChannel.on("message", (msg: ClientInfoMessage) => {
  const fn = gatewayServer[msg.fnName];
  if (fn) {
    // FIXME: idk how to type this
    // @ts-expect-error
    const result = fn.call(gatewayServer, msg.soeClientId);
    clientInfoChannel.postMessage({ requestId: msg.requestId, result });
  }
});
