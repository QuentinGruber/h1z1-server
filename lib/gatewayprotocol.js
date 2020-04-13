var debug = require("debug")("GatewayProtocol"),
  DataSchema = require("dataschema"),
  GatewayPackets = require("./gatewaypackets");

function GatewayProtocol() {}

GatewayProtocol.prototype.parse = function (data) {
  var packetType = data[0] & 0x1f,
    result,
    schema,
    name,
    packet = GatewayPackets.Packets[packetType];

  if (packet) {
    if (
      packet.name == "TunnelPacketToExternalConnection" ||
      packet.name == "TunnelPacketFromExternalConnection"
    ) {
      debug(packet.name, data[0], packetType, data[0] >> 5, data.length);

      return {
        type: packet.type,
        flags: data[0] >> 5,
        fromClient: packet.name == "TunnelPacketFromExternalConnection",
        name: packet.name,
        tunnelData: data.slice(1),
      };
    } else {
      if (packet.schema) {
        debug(packet.name);
        result = DataSchema.parse(packet.schema, data, 1).result;
        return {
          type: packet.type,
          flags: data[0] >> 5,
          name: packet.name,
          result: result,
        };
      } else {
        debug("parse()", "No schema for packet " + packet.name);
      }
    }
  } else {
    debug("parse()", "Unknown or unhandled gateway packet type: " + packetType);
  }
};

GatewayProtocol.prototype.pack = function (packetName, object) {
  var packetType = GatewayPackets.PacketTypes[packetName],
    packet = GatewayPackets.Packets[packetType],
    payload,
    data;
  if (packet) {
    if (
      packet.name == "TunnelPacketToExternalConnection" ||
      packet.name == "TunnelPacketFromExternalConnection"
    ) {
      data = new Buffer(1 + object.tunnelData.length);
      data.writeUInt8(packetType | (object.channel << 5), 0);
      object.tunnelData.copy(data, 1);
    } else if (packet.name == "ChannelIsRoutable") {
      data = new Buffer(2);
      data.writeUInt8(packetType | (object.channel << 5), 0);
      data.writeUInt8(object.isRoutable, 1);
    } else {
      if (packet.schema) {
        debug("Packing data for " + packet.name);
        payload = DataSchema.pack(packet.schema, object);
        if (payload) {
          data = new Buffer(1 + payload.length);
          data.writeUInt8(packetType, 0);
          payload.data.copy(data, 1);
        } else {
          debug("Could not pack data schema for " + packet.name);
        }
      } else {
        debug("pack()", "No schema for packet " + packet.name);
      }
    }
  } else {
    debug("pack()", "Unknown or unhandled gateway packet type: " + packetType);
  }

  return data;
};

exports.GatewayProtocol = GatewayProtocol;
exports.GatewayPackets = GatewayPackets;
