// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (c) 2020 - 2021 Quentin Gruber
//   copyright (c) 2021 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

const EventEmitter = require("events").EventEmitter,
  SOEInputStream =
    require("../servers/SoeServer/soeinputstream").SOEInputStream,
  SOEOutputStream =
    require("../servers/SoeServer/soeoutputstream").SOEOutputStream,
  SOEProtocol = require("../protocols/soeprotocol").SOEProtocol,
  SOEPackets = require("../protocols/soeprotocol").SOEPackets,
  util = require("util"),
  fs = require("fs"),
  dgram = require("dgram"),
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
    const protocol = (this._protocol = new SOEProtocol());
    const inputStream = (this._inputStream = new SOEInputStream(cryptoKey));
    const outputStream = (this._outputStream = new SOEOutputStream(cryptoKey));

    let n1 = 0,
      n2 = 0;

    inputStream.on("data", function (err, data) {
      if (me._dumpData) {
        fs.writeFileSync("soeclient_apppacket_" + n2++ + ".dat", data);
      }
      me.emit("appdata", null, data);
    });

    inputStream.on("ack", function (err, sequence) {
      nextAck = sequence;
    });

    inputStream.on("outoforder", function (err, expected, sequence) {
      outOfOrderPackets.push(sequence);
    });

    outputStream.on("data", function (err, data, sequence, fragment) {
      if (fragment) {
        me._sendPacket("DataFragment", {
          sequence: sequence,
          data: data,
        });
      } else {
        me._sendPacket("Data", {
          sequence: sequence,
          data: data,
        });
      }
    });

    var lastAck = -1,
      nextAck = -1,
      outOfOrderPackets = [];

    function checkAck() {
      if (lastAck !== nextAck) {
        lastAck = nextAck;
        me._sendPacket("Ack", {
          channel: 0,
          sequence: nextAck,
        });
      }
      me._ackTimer = setTimeout(checkAck, 50);
    }

    checkAck();

    function checkOutOfOrderQueue() {
      if (outOfOrderPackets.length) {
        const packets = [];
        for (let i = 0; i < 20; i++) {
          const sequence = outOfOrderPackets.shift();
          packets.push({
            name: "OutOfOrder",
            soePacket: {
              channel: 0,
              sequence: sequence,
            },
          });
          if (!outOfOrderPackets.length) {
            break;
          }
        }
        debug("Sending " + packets.length + " OutOfOrder packets");
        me._sendPacket(
          "MultiPacket",
          {
            subPackets: packets,
          },
          true
        );
      }
      me._outOfOrderTimer = setTimeout(checkOutOfOrderQueue, 10);
    }

    checkOutOfOrderQueue();

    function checkOutQueue() {
      if (me._outQueue.length) {
        const data = me._outQueue.shift();
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
      const soePacket = packet.soePacket,
        result = soePacket.result;
      switch (soePacket.name) {
        case "SessionReply":
          debug("Received session reply from server");

          me._compression = result.compression;
          me._crcSeed = result.crcSeed;
          me._crcLength = result.crcLength;
          me._udpLength = result.udpLength;

          inputStream.toggleEncryption(me._useEncryption);
          outputStream.toggleEncryption(me._useEncryption);
          outputStream.setFragmentSize(result.udpLength - 7);

          me.emit("connect", null, result);
          break;
        case "Disconnect":
          debug("Received disconnect from server");
          me.disconnect();
          me.emit("disconnect");
          break;
        case "MultiPacket":
          let lastOutOfOrder = 0;
          const channel = 0;
          for (let i = 0; i < result.subPackets.length; i++) {
            const subPacket = result.subPackets[i];
            switch (subPacket.name) {
              case "OutOfOrder":
                if (subPacket.sequence > lastOutOfOrder) {
                  lastOutOfOrder = subPacket.sequence;
                }
                break;
              default:
                handlePacket({
                  soePacket: subPacket,
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
            outputStream.resendData(lastOutOfOrder);
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
          inputStream.write(result.data, result.sequence, false);
          break;
        case "DataFragment":
          debug("Received data fragment from server");
          inputStream.write(result.data, result.sequence, true);
          break;
        case "OutOfOrder":
          debug(
            "Received out-order-packet packet on channel " +
              result.channel +
              ", sequence " +
              result.sequence
          );
          outputStream.resendData(result.sequence);
          break;
        case "Ack":
          outputStream.ack(result.sequence);
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
      const result = protocol.parse(data, me._crcSeed, me._compression);
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
      me._sendPacket("SessionRequest", {
        protocol: me._protocolName,
        crcLength: 3,
        sessionId: me._sessionId,
        udpLength: 512,
      });
    });
  }

  disconnect() {
    clearTimeout(this._outQueueTimer);
    clearTimeout(this._ackTimer);
    clearTimeout(this._outOfOrderTimer);
    try {
      this._sendPacket("Disconnect", {});
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

  _sendPacket(packetName, packet, prioritize) {
    const data = this._protocol.pack(
      packetName,
      packet,
      this._crcSeed,
      this._compression
    );
    debug(this._guid, "Sending " + packetName + " packet to server");
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
    this._outputStream.write(data, overrideEncryption);
  }
}

util.inherits(SOEClient, EventEmitter);

var q = 0;

exports.SOEClient = SOEClient;
