// Diagnostic-only SOE transport using the current server stream APIs.
const { EventEmitter } = require("node:events");
const dgram = require("node:dgram");
const path = require("node:path");
const root = process.cwd();
const { Soeprotocol, SoeOpcode, append_crc_legacy } = require(
  path.join(root, "node_modules/h1emu-core")
);
const { SOEInputStream } = require(
  path.join(root, "out/servers/SoeServer/soeinputstream")
);
const { SOEOutputStream, SOEOutputChannels } = require(
  path.join(root, "out/servers/SoeServer/soeoutputstream")
);
const { LogicalPacket } = require(
  path.join(root, "out/servers/SoeServer/logicalPacket")
);
class ProbeClient extends EventEmitter {
  constructor(name, address, port, key, localPort) {
    super();
    Object.assign(this, { name, address, port, localPort, seed: 0 });
    this.protocol = new Soeprotocol(true, 0);
    this.socket = dgram.createSocket("udp4");
    this.input = new SOEInputStream(key);
    this.output = new SOEOutputStream(key);
    this.input.on("appdata", (data) => this.emit("appdata", null, data));
    this.input.on("error", (error) =>
      console.error("Probe stream error:", error.message)
    );
    this.input.on("outOfOrder", (sequence) =>
      this.send(SoeOpcode.OutOfOrder, { sequence })
    );
    this.output.on(SOEOutputChannels.Reliable, () => {
      for (const item of this.output.getAvailableReliableData())
        this.send(item.fragment ? SoeOpcode.DataFragment : SoeOpcode.Data, {
          sequence: item.sequence,
          data: [...item.data]
        });
    });
    this.socket.on("message", (data) => {
      const packet = JSON.parse(this.protocol.parse(data));
      this.handle(packet);
    });
  }
  send(opcode, data) {
    let raw = Buffer.from(this.protocol.pack(opcode, JSON.stringify(data)));
    if (new LogicalPacket(raw).canCrc) raw = append_crc_legacy(raw, this.seed);
    this.socket.send(raw, this.port, this.address);
  }
  handle(packet) {
    switch (packet.name) {
      case "SessionReply":
        this.seed = packet.crc_seed;
        this.protocol = new Soeprotocol(true, this.seed);
        this.input.setEncryption(true);
        this.output.setEncryption(true);
        this.output.setFragmentSize(packet.udp_length - 6);
        this.emit("connect");
        break;
      case "MultiPacket":
        for (const child of packet.sub_packets) this.handle(child);
        break;
      case "Data":
      case "DataFragment":
        this.input.write(
          Buffer.from(packet.data),
          packet.sequence,
          packet.name === "DataFragment"
        );
        this.send(SoeOpcode.Ack, { sequence: this.input._lastAck.get() });
        break;
      case "Ack":
        this.output.ack(packet.sequence, new Map());
        break;
    }
  }
  connect() {
    this.socket.bind(this.localPort, () =>
      this.send(SoeOpcode.SessionRequest, {
        protocol: this.name,
        crc_length: 2,
        session_id: 1234567,
        udp_length: 512
      })
    );
  }
  sendAppData(data) {
    this.output.write(data, SOEOutputChannels.Reliable);
  }
  disconnect() {
    this.socket.close();
  }
}
module.exports = { SOEClient: ProbeClient };
