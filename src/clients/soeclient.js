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

const { LogicalPacket } = require("../servers/SoeServer/logicalPacket");
const { SOEOutputChannels } = require("../servers/SoeServer/soeoutputstream");

const EventEmitter = require("node:events").EventEmitter,
  SOEInputStream =
    require("../servers/SoeServer/soeinputstream").SOEInputStream,
  SOEOutputStream =
    require("../servers/SoeServer/soeoutputstream").SOEOutputStream,
  { Soeprotocol, append_crc_legacy, SoeOpcode } = require("h1emu-core"),
  util = require("node:util"),
  fs = require("node:fs"),
  dgram = require("node:dgram"),
  debug = require("debug")("SOEClient");

function createSessionId() {
  return (Math.random() * 0xffffffff) >>> 0;
}

class SOEClient {
  constructor(protocolName, serverAddress, serverPort, cryptoKey, localPort) {
    EventEmitter.call(this);
    const me = this;

    this._guid = ((Math.random() * 0xffffffff) >>> 0).toString(16);
    debug(this._guid, "Creating new SOEClient instance");
    this._protocolName = protocolName;
    this._serverAddress = serverAddress;
    this._serverPort = serverPort;
    this._localPort = localPort;
    this._cryptoKey = cryptoKey;
    this._useEncryption = true;
    this._dumpData = false;

    this._outQueue = [];

    const connection = (this._connection = dgram.createSocket("udp4"));
    const protocol = (this._protocol = new Soeprotocol(true, 0));
    const inputStream = (this._inputStream = new SOEInputStream(cryptoKey));
    const outputStream = (this._outputStream = new SOEOutputStream(cryptoKey));

    let n1 = 0,
      n2 = 0;

    inputStream.on("appdata", function (data) {
      if (me._dumpData) {
        fs.writeFileSync("soeclient_apppacket_" + n2++ + ".dat", data);
      }
      me.emit("appdata", null, data);
    });

    inputStream.on("ack", function (sequence) {
      nextAck = sequence;
    });

    inputStream.on("outoforder", function (sequence) {
      outOfOrderPackets.push(sequence);
    });

    outputStream.on(
      SOEOutputChannels.Reliable,
      function (data, sequence, fragment) {
        if (fragment) {
          me._sendPacket(SoeOpcode.DataFragment, {
            sequence: sequence,
            data: data
          });
        } else {
          me._sendPacket(SoeOpcode.Data, {
            sequence: sequence,
            data: data
          });
        }
      }
    );

    var lastAck = -1,
      nextAck = -1,
      outOfOrderPackets = [];

    function checkAck() {
      if (lastAck !== nextAck) {
        lastAck = nextAck;
        me._sendPacket(SoeOpcode.Ack, {
          channel: 0,
          sequence: nextAck
        });
      }
      me._ackTimer = setTimeout(checkAck, 50);
    }

    checkAck();

    function checkOutOfOrderQueue() {
      if (outOfOrderPackets.length) {
        return;
        const packets = [];
        for (let i = 0; i < 20; i++) {
          const sequence = outOfOrderPackets.shift();
          packets.push({
            name: SoeOpcode.OutOfOrder,
            soePacket: {
              channel: 0,
              sequence: sequence
            }
          });
          if (!outOfOrderPackets.length) {
            break;
          }
        }
        debug("Sending " + packets.length + " OutOfOrder packets");
        me._sendPacket(
          SoeOpcode.MultiPacket,
          {
            subPackets: packets
          },
          true
        );
      }
      me._outOfOrderTimer = setTimeout(checkOutOfOrderQueue, 10);
    }

    checkOutOfOrderQueue();

    function checkOutQueue() {
      if (me._outQueue.length) {
        const logical = new LogicalPacket(me._outQueue.shift());
        const data = logical.canCrc
          ? append_crc_legacy(logical.data, this._crcSeed)
          : logical.data;
        if (me._dumpData) {
          fs.writeFileSync("debug/soeclient_" + n1++ + "_out.dat", data);
        }
        me._connection.send(
          data,
          0,
          data.length,
          me._serverPort,
          me._serverAddress,
          function (err, bytes) {}
        );
      }
      me._outQueueTimer = setTimeout(checkOutQueue, 0);
    }

    checkOutQueue();

    function handlePacket(packet) {
      switch (packet.name) {
        case "SessionReply":
          debug("Received session reply from server");
          me._compression = 0;
          me._crcSeed = packet.crc_seed;
          me._crcLength = packet.crc_length;
          me._udpLength = packet.udp_length;
          inputStream.toggleEncryption(me._useEncryption);
          outputStream.toggleEncryption(me._useEncryption);
          outputStream.setFragmentSize(packet.udp_length - 7);
          me.emit("connect", null, packet);
          break;
        case "Disconnect":
          debug("Received disconnect from server");
          me.disconnect();
          me.emit("disconnect");
          break;
        case "MultiPacket":
          let lastOutOfOrder = 0;
          const channel = 0;
          for (let i = 0; i < packet.sub_packets.length; i++) {
            const subPacket = packet.sub_packets[i];
            switch (subPacket.name) {
              case "OutOfOrder":
                if (subPacket.sequence > lastOutOfOrder) {
                  lastOutOfOrder = subPacket.sequence;
                }
                break;
              default:
                handlePacket({
                  soePacket: subPacket
                });
            }
          }
          if (lastOutOfOrder > 0) {
            debug(
              "Received multiple out-order-packet packet on channel " +
                channel +
                ", sequence " +
                lastOutOfOrder
            );
            outputStream.getDataCache(lastOutOfOrder);
          }
          break;
        case "Ping":
          debug("Received ping from server");
          break;
        case "NetStatusReply":
          debug("Received net status reply from server");
          break;
        case "Data":
          debug("Received data packet from server");
          inputStream.write(Buffer.from(packet.data), packet.sequence, false);
          break;
        case "DataFragment":
          debug("Received data fragment from server");
          inputStream.write(Buffer.from(packet.data), packet.sequence, true);
          break;
        case "OutOfOrder":
          debug(
            "Received out-order-packet packet on channel " +
              packet.channel +
              ", sequence " +
              packet.sequence
          );
          //outputStream.resendData(result.sequence);
          break;
        case "Ack":
          outputStream.ack(packet.sequence, new Map());
          break;
        case "FatalError":
          debug("Received fatal error from server");
          break;
        case "FatalErrorReply":
          break;
      }
    }

    connection.on("message", function (data, remote) {
      if (me._dumpData) {
        fs.writeFileSync("debug/soeclient_" + n1++ + "_in.dat", data);
      }
      const result = JSON.parse(protocol.parse(data));
      handlePacket(result);
    });

    connection.on("listening", function () {
      const address = this.address();
      debug("Listening on " + address.address + ":" + address.port);
    });
  }

  connect() {
    debug(
      "Setting up connection for " +
        this._serverAddress +
        ":" +
        this._serverPort
    );
    this._sessionId = createSessionId();
    const me = this;
    this._connection.bind(this._localPort, function () {
      me._sendPacket(SoeOpcode.SessionRequest, {
        protocol: me._protocolName,
        crc_length: 3,
        session_id: me._sessionId,
        udp_length: 512
      });
    });
  }

  disconnect() {
    clearTimeout(this._outQueueTimer);
    clearTimeout(this._ackTimer);
    clearTimeout(this._outOfOrderTimer);
    try {
      this._sendPacket(SoeOpcode.Disconnect, {});
      this._connection.close();
    } catch (e) {}
  }

  toggleEncryption(value) {
    value = !!value;
    this._useEncryption = value;
    debug(this._guid, "Toggling encryption: value = " + value);
    this._outputStream.toggleEncryption(value);
    this._inputStream.toggleEncryption(value);
  }

  toggleDataDump(value) {
    this._dumpData = value;
  }

  _sendPacket(packetOpcode, packet, prioritize) {
    if (packet.data) {
      packet.data = [...packet.data];
    }
    const data = Buffer.from(
      this._protocol.pack(packetOpcode, JSON.stringify(packet))
    );
    debug(this._guid, "Sending " + packetOpcode + " packet to server");
    if (this._dumpData) {
      fs.writeFileSync(
        "debug/soeclient_" + this._guid + "_outpacket_" + q++ + ".dat",
        data
      );
    }
    if (prioritize) {
      this._outQueue.unshift(data);
    } else {
      this._outQueue.push(data);
    }
  }

  sendAppData(data, overrideEncryption) {
    debug(this._guid, "Sending app data: " + data.length + " bytes");
    this._outputStream.write(data, SOEOutputChannels.Reliable);
  }
}

util.inherits(SOEClient, EventEmitter);

var q = 0;

exports.SOEClient = SOEClient;
