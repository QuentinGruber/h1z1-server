// Isolated transport regression tests; never connects to MongoDB or the VPS.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { once } = require("node:events");
const { WebSocket, WebSocketServer } = require("ws");
const {
  WsZoneConnectionManager
} = require("../out/servers/LoginZoneConnection/wszoneconnectionmanager");
const {
  WsLoginConnectionManager
} = require("../out/servers/LoginZoneConnection/wsloginconnectionmanager");

const waitFor = async (predicate) => {
  const deadline = Date.now() + 3000;
  while (!predicate()) {
    if (Date.now() > deadline) throw new Error("Timed out");
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
};

test("world 2 authenticates, registers, answers requests and reconnects", async () => {
  const oldSecret = process.env.LZ_SERVER_SECRET;
  process.env.LZ_SERVER_SECRET = "isolated-test-secret";
  const login = new WsZoneConnectionManager(0, async (id, secret) => {
    await new Promise((resolve) => setTimeout(resolve, 30));
    return id === 2 && secret === process.env.LZ_SERVER_SECRET;
  });
  const zone = new WsLoginConnectionManager(2);
  zone._reconnectDelay = 20;
  let registrations = 0;
  login.on("data", (_, client, packet) => {
    if (packet.name === "SessionRequest") {
      assert.equal(packet.data.serverId, 2);
      assert.equal(client.serverId, 2);
      registrations++;
      login.sendData(client, "SessionReply", { status: 1 });
    }
  });
  zone.on("data", (_, client, packet) => {
    if (packet.name === "CharacterAllowedRequest") {
      zone.sendData(client, "CharacterAllowedReply", {
        reqId: packet.data.reqId,
        status: 1,
        rejectionFlag: 0,
        message: ""
      });
    }
  });
  try {
    await login.start();
    if (!login._wss.address()) await once(login._wss, "listening");
    zone.setLoginInfo(
      { address: "127.0.0.1", port: login._wss.address().port },
      { serverId: 2, h1emuVersion: "test", gameMode: 0, serverRuleSets: "PVP" }
    );
    let session = once(zone, "session");
    await zone.start();
    await session;
    const reply = once(login, "processInternalReq");
    login.sendData(
      Object.values(login._clients)[0],
      "CharacterAllowedRequest",
      { reqId: 7, characterId: "0x1", loginSessionId: "test" }
    );
    assert.equal((await reply)[0].data.status, true);
    session = once(zone, "session");
    Object.values(login._sockets)[0].terminate();
    await session;
    assert.equal(registrations, 2);
    await zone.stop();
    await waitFor(() => Object.keys(login._clients).length === 0);
    assert.equal(zone._stopping, true);
  } finally {
    await zone.stop();
    await login.stop();
    if (oldSecret === undefined) delete process.env.LZ_SERVER_SECRET;
    else process.env.LZ_SERVER_SECRET = oldSecret;
  }
});

test("authentication exceptions close the connection without publishing a client", async () => {
  const login = new WsZoneConnectionManager(0, async () => {
    throw new Error("DB unavailable");
  });
  let socket;
  try {
    await login.start();
    if (!login._wss.address()) await once(login._wss, "listening");
    socket = new WebSocket(`ws://127.0.0.1:${login._wss.address().port}`, {
      headers: { "x-server-id": "2", authorization: "test" }
    });
    assert.equal((await once(socket, "close"))[0], 1011);
    assert.equal(Object.keys(login._clients).length, 0);
  } finally {
    socket?.terminate();
    await login.stop();
  }
});

test("a peer closing during authentication cannot become a stale registered client", async () => {
  let finishAuth;
  const login = new WsZoneConnectionManager(
    0,
    () =>
      new Promise((resolve) => {
        finishAuth = resolve;
      })
  );
  let socket;
  try {
    await login.start();
    if (!login._wss.address()) await once(login._wss, "listening");
    socket = new WebSocket(`ws://127.0.0.1:${login._wss.address().port}`, {
      headers: { "x-server-id": "2", authorization: "test" }
    });
    await once(socket, "open");
    const closed = once(socket, "close");
    socket.close();
    await closed;
    finishAuth(true);
    await new Promise((resolve) => setTimeout(resolve, 30));
    assert.equal(Object.keys(login._clients).length, 0);
  } finally {
    socket?.terminate();
    await login.stop();
  }
});

test("a missing registration reply times out and retries despite active heartbeats", async () => {
  const previous = process.env.LZ_SERVER_SECRET;
  process.env.LZ_SERVER_SECRET = "isolated-test";
  const server = new WebSocketServer({ port: 0 });
  const zone = new WsLoginConnectionManager(2);
  zone._deadTimeoutMs = 100;
  zone._reconnectDelay = 20;
  let attempts = 0;
  server.on("connection", (socket) => {
    attempts++;
    const ping = setInterval(() => socket.ping(), 10);
    socket.on("close", () => clearInterval(ping));
    socket.on("message", () => {
      if (attempts > 1)
        socket.send(zone._protocol.pack("SessionReply", { status: 1 }));
    });
  });
  try {
    if (!server.address()) await once(server, "listening");
    zone.setLoginInfo(
      { address: "127.0.0.1", port: server.address().port },
      { serverId: 2, serverRuleSets: "PVP" }
    );
    const registered = once(zone, "session");
    await zone.start();
    await registered;
    assert.equal(attempts, 2);
  } finally {
    await zone.stop();
    for (const socket of server.clients) socket.terminate();
    await new Promise((resolve) => server.close(resolve));
    if (previous === undefined) delete process.env.LZ_SERVER_SECRET;
    else process.env.LZ_SERVER_SECRET = previous;
  }
});
