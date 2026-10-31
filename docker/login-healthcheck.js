// Both sockets must be ready, after LoginServer.start() has connected to MongoDB.
const fs = require("node:fs");
const net = require("node:net");
const udp =
  fs.readFileSync("/proc/net/udp", "utf8") +
  fs.readFileSync("/proc/net/udp6", "utf8");
if (!udp.split("\n").some((line) => /^\s*\d+:\s+\S+:045B\s/.test(line)))
  process.exit(1);
const socket = net.connect({ host: "127.0.0.1", port: 1110 });
socket.setTimeout(2000);
socket.once("connect", () => {
  socket.destroy();
  process.exit(0);
});
socket.once("error", () => process.exit(1));
socket.once("timeout", () => process.exit(1));
