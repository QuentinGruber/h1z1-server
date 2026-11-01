// Run inside the existing zone container via stdin. Read-only: no registration,
// database writes, secret changes, or gameplay startup.
const fs = require("node:fs");
const net = require("node:net");
const debugLibrary = require("debug");
debugLibrary.enable("ZoneRegistrationCheck");
const debug = debugLibrary("ZoneRegistrationCheck");
const { MongoClient } = require("mongodb");

async function main() {
  const worldId = Number(process.env.WORLD_ID);
  const host = process.env.LOGINSERVER_IP;
  debug("worldId=%s expectedWorld2=%s internalHostConfigured=%s", worldId, worldId === 2, !!host);
  let secret = process.env.LZ_SERVER_SECRET || "";
  const file = process.env.LZ_SERVER_SECRET_FILE;
  if (file) {
    try {
      secret = fs.readFileSync(file, "utf8").trim();
      debug("secretFileReadable=true secretNonempty=%s", !!secret);
    } catch {
      debug("FAIL secretFileReadable=false");
      process.exitCode = 1;
      return;
    }
  }
  debug("selectedTransport=%s", secret ? "WebSocket" : "legacy UDP");
  for (const [filePath, marker] of [
    ["docker/2016/zoneServer.js", "LZ_SERVER_SECRET_FILE"],
    ["out/servers/LoginZoneConnection/wsloginconnectionmanager.js", "_registrationTimeout"]
  ]) {
    try { debug("imageMarker %s present=%s", filePath, fs.readFileSync(filePath, "utf8").includes(marker)); }
    catch { debug("FAIL imageFileMissing=%s", filePath); }
  }
  if (host) {
    await new Promise(resolve => {
      const socket = net.connect({ host, port: 1110 });
      socket.setTimeout(3000);
      socket.once("connect", () => { debug("internalTcp1110Reachable=true (authentication not tested)"); socket.destroy(); });
      socket.once("timeout", () => { debug("FAIL internalTcp1110TimedOut=true"); socket.destroy(); });
      socket.once("error", error => debug("FAIL internalTcp1110Error=%s", error.code || "unknown"));
      socket.once("close", resolve);
    });
  }
  if (!process.env.MONGO_URL) { debug("FAIL mongoUrlConfigured=false"); return; }
  const mongo = new MongoClient(process.env.MONGO_URL, { serverSelectionTimeoutMS: 5000 });
  try {
    await mongo.connect();
    const record = await mongo.db("h1server").collection("servers").findOne({ serverId: worldId });
    if (!record) {
      const stringRecord = await mongo.db("h1server").collection("servers").findOne({ serverId: String(worldId) });
      debug("FAIL numericWorldRecordExists=false stringWorldRecordExists=%s", !!stringRecord);
      return;
    }
    debug("worldRecordExists=true enabledForAuth=%s databaseSecretConfigured=%s secretMatches=%s allowedAccess=%s",
      record.isDisabled === false, typeof record.secret === "string" && !!record.secret,
      !!secret && record.secret === secret, record.allowedAccess);
    if (record.isDisabled !== false || !secret || record.secret !== secret) {
      debug("FAIL authentication prerequisites failed; no database fields changed");
    } else {
      debug("Authentication prerequisites match. If unregistered, inspect startup progress and registration packet/result.");
    }
  } catch (error) {
    // Driver messages can include connection details; emit only their class/code.
    debug("FAIL databaseCheckError=%s code=%s", error.name, error.code || "none");
    process.exitCode = 1;
  } finally { await mongo.close(); }
}
main().catch(() => { debug("FAIL diagnostic failed unexpectedly"); process.exitCode = 1; });
