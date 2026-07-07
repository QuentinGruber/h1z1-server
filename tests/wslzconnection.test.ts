import test from "node:test";
import assert from "node:assert";
import path from "node:path";
import { WsZoneConnectionManager } from "../src/servers/LoginZoneConnection/wszoneconnectionmanager";
import { WsLoginConnectionManager } from "../src/servers/LoginZoneConnection/wsloginconnectionmanager";

const SECRET = "goodsecret";
const SERVER_ID = 42;

// exercise the wss path: login serves a self-signed test cert, zone dials wss
// and skips verification (transport tests aren't validating the cert chain)
process.env.LZ_TLS_CERT = path.join(__dirname, "fixtures", "test-login.crt");
process.env.LZ_TLS_KEY = path.join(__dirname, "fixtures", "test-login.key");
process.env.LZ_TLS = "1";
process.env.LZ_TLS_INSECURE = "1";

function makeLogin(port: number, validSecret: string) {
  const login = new WsZoneConnectionManager(port, async (_serverId, secret) => {
    // simulate the real DB lookup latency so the zone's SessionRequest arrives
    // mid-auth — regression guard against dropping messages during the check
    await new Promise((r) => setTimeout(r, 50));
    return secret === validSecret;
  });
  // minimal loginserver behaviour: complete the handshake on SessionRequest
  login.on("data", (_e: any, client: any, packet: any) => {
    if (packet.name === "SessionRequest") {
      login.sendData(client, "SessionReply", { status: 1 });
    }
  });
  return login;
}

test("ws lz: good secret establishes a session and round-trips a request", async (t) => {
  const PORT = 31110;
  process.env.LZ_SERVER_SECRET = SECRET;
  const login = makeLogin(PORT, SECRET);
  await login.start();

  const zone = new WsLoginConnectionManager(SERVER_ID);
  zone.setLoginInfo(
    { address: "127.0.0.1", port: PORT },
    {
      serverId: SERVER_ID,
      h1emuVersion: "test",
      gameMode: 0,
      serverRuleSets: "PVP"
    }
  );
  // always tear down, even if an assertion throws, so the port isn't leaked
  t.after(async () => {
    await zone.stop();
    await login.stop();
  });

  const session = new Promise<void>((res) => zone.on("session", () => res()));
  await zone.start();
  await session;

  // login -> zone request, zone -> login reply routed to processInternalReq
  const replyReq = new Promise<any>((res) =>
    login.on("processInternalReq", (packet: any) => res(packet))
  );
  zone.on("data", (_e: any, client: any, packet: any) => {
    if (packet.name === "ClientIsAdminRequest") {
      zone.sendData(client, "ClientIsAdminReply", {
        reqId: packet.data.reqId,
        status: 1
      });
    }
  });
  const zoneClient = Object.values((login as any)._clients)[0];
  login.sendData(zoneClient as any, "ClientIsAdminRequest", {
    reqId: 7,
    guid: "1"
  });

  const reply = await replyReq;
  assert.strictEqual(reply.data.reqId, 7);
  // status is a boolean in the ClientIsAdminReply schema; round-trip preserves it
  assert.strictEqual(reply.data.status, true);
});

test("ws lz: zone reconnects after the connection drops", async (t) => {
  const PORT = 31112;
  process.env.LZ_SERVER_SECRET = SECRET;
  const login = makeLogin(PORT, SECRET);
  await login.start();

  const zone = new WsLoginConnectionManager(SERVER_ID);
  (zone as any)._reconnectDelay = 100; // don't wait the full 5s in the test
  zone.setLoginInfo(
    { address: "127.0.0.1", port: PORT },
    {
      serverId: SERVER_ID,
      h1emuVersion: "test",
      gameMode: 0,
      serverRuleSets: "PVP"
    }
  );
  t.after(async () => {
    await zone.stop();
    await login.stop();
  });

  let sessions = 0;
  const reconnected = new Promise<void>((res) => {
    zone.on("session", () => {
      sessions++;
      if (sessions === 1) {
        // simulate an abrupt drop from the login side once established
        const socket = Object.values((login as any)._sockets)[0] as any;
        socket.terminate();
      } else if (sessions === 2) {
        res();
      }
    });
  });
  await zone.start();
  await reconnected;
  assert.strictEqual(sessions, 2);
});

test("ws lz: bad secret is rejected (no session)", async (t) => {
  const PORT = 31111;
  process.env.LZ_SERVER_SECRET = "wrongsecret";
  const login = makeLogin(PORT, SECRET);
  await login.start();

  const zone = new WsLoginConnectionManager(SERVER_ID);
  zone.setLoginInfo(
    { address: "127.0.0.1", port: PORT },
    {
      serverId: SERVER_ID,
      h1emuVersion: "test",
      gameMode: 0,
      serverRuleSets: "PVP"
    }
  );
  t.after(async () => {
    await zone.stop();
    await login.stop();
    process.exitCode = 0;
  });
  process.exitCode = 0; // manager sets exitCode 11 on refusal; don't fail the runner

  const rejected = new Promise<string>((res) => {
    zone.on("session", () => res("session"));
    zone.on("sessionfailed", () => res("failed"));
  });
  await zone.start();
  assert.strictEqual(await rejected, "failed");
});
