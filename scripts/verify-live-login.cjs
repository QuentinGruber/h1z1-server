const debug = require("debug")("h1emu:scripts:verify-live-login");
// Run inside the login container. Uses normal LoginUdp_11 packets and temporary
// test records, never real player sessions. Records are removed in finally.
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const path = require("node:path");
const root = process.cwd();
const { MongoClient } = require(path.join(root, "node_modules/mongodb"));
const { SOEClient } = require("./live-soe-probe.cjs");
const { LoginProtocol2016 } = require(
  path.join(root, "out/protocols/loginprotocol2016")
);
const { DEFAULT_CRYPTO_KEY } = require(path.join(root, "out/utils/constants"));
async function main() {
  const mongo = new MongoClient(process.env.MONGO_URL);
  await mongo.connect();
  const db = mongo.db("h1server"),
    id = "connectivity-" + crypto.randomUUID(),
    authKey = crypto.randomBytes(16).toString("hex"),
    guid = "0x" + crypto.randomBytes(8).toString("hex"),
    characterId = "0x" + crypto.randomBytes(8).toString("hex");
  const protocol = new LoginProtocol2016(),
    client = new SOEClient(
      "LoginUdp_11",
      "127.0.0.1",
      1115,
      Buffer.from(DEFAULT_CRYPTO_KEY, "base64"),
      0
    );
  const waiting = new Map(),
    pending = [];
  client.on("appdata", (_err, data) => {
    const packet = protocol.parse(data);
    if (!packet) return;
    const resolve = waiting.get(packet.name);
    if (resolve) {
      waiting.delete(packet.name);
      resolve(packet.result);
    } else pending.push(packet);
  });
  function receive(name) {
    return new Promise((resolve, reject) => {
      const buffered = pending.findIndex((p) => p.name === name);
      if (buffered >= 0) return resolve(pending.splice(buffered, 1)[0].result);
      const timer = setTimeout(() => {
        waiting.delete(name);
        reject(Error("Timed out awaiting " + name));
      }, 12000);
      waiting.set(name, (result) => {
        clearTimeout(timer);
        resolve(result);
      });
    });
  }
  async function request(name, payload, reply) {
    const data = protocol.pack(name, payload);
    assert(data, `Cannot pack ${name}`);
    const response = receive(reply);
    client.sendAppData(data, true);
    return response;
  }
  try {
    await db.collection("user-sessions").insertOne({ _id: id, authKey, guid });
    await db
      .collection("characters-light")
      .insertOne({
        _id: id,
        characterId,
        serverId: 2,
        gameVersion: 2,
        authKey,
        status: 1,
        payload: { name: "ConnectivityProbe" }
      });
    await db
      .collection("characters")
      .insertOne({
        _id: id,
        characterId,
        serverId: 2,
        status: 1,
        characterName: "ConnectivityProbe"
      });
    await new Promise((resolve, reject) => {
      const timer = setTimeout(
        () => reject(Error("UDP SOE handshake timed out")),
        12000
      );
      client.once("connect", () => {
        clearTimeout(timer);
        resolve();
      });
      client.connect();
    });
    const login = await request(
      "LoginRequest",
      {
        sessionId: JSON.stringify({ sessionId: authKey, gameVersion: 2 }),
        systemFingerPrint: "ConnectivityProbe"
      },
      "LoginReply"
    );
    assert.equal(login.status, 1);
    const list = await request("ServerListRequest", {}, "ServerListReply");
    const world = list.servers.find((s) => s.serverId === 2);
    assert(
      world?.allowedAccess,
      "World 2 is not available in the real server-list reply"
    );
    const reply = await request(
      "CharacterLoginRequest",
      {
        serverId: 2,
        characterId,
        payload: { locale: "en_US", localeId: 0, preferredGatewayId: 0 }
      },
      "CharacterLoginReply"
    );
    assert.equal(reply.status, 1);
    assert.equal(reply.applicationData.serverAddress, "127.0.0.1:1117");
    assert.equal(reply.applicationData.serverTicket, guid);
    // Remove only this probe character and verify zone validation still denies it.
    await db.collection("characters").deleteOne({ _id: id });
    const rejected = await request(
      "CharacterLoginRequest",
      {
        serverId: 2,
        characterId,
        payload: { locale: "en_US", localeId: 0, preferredGatewayId: 0 }
      },
      "CharacterLoginReply"
    );
    assert.equal(rejected.status, 0);
    debug(
      JSON.stringify({
        loginUdp11: "accepted",
        serverListWorld2: world.allowedAccess,
        characterLogin: "accepted",
        serverAddress: reply.applicationData.serverAddress,
        missingCharacter: "rejected"
      })
    );
  } finally {
    client.disconnect();
    for (const collection of [
      "user-sessions",
      "characters-light",
      "characters"
    ])
      await db.collection(collection).deleteOne({ _id: id });
    await mongo.close();
  }
}
main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e.message);
    process.exit(1);
  });

