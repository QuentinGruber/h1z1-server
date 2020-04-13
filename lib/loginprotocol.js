var fs = require("fs"),
  debug = require("debug")("LoginProtocol"),
  DataSchema = require("dataschema"),
  LoginPackets = require("./loginpackets");

function LoginProtocol() {}

var n = 0;

LoginProtocol.prototype.parse = function (data) {
  var packetType = data[0],
    result,
    schema,
    name,
    packet = LoginPackets.Packets[packetType];
  if (packet) {
    if (packet.schema) {
      debug(packet.name);
      result = DataSchema.parse(packet.schema, data, 1).result;
      return {
        type: packet.type,
        name: packet.name,
        result: result,
      };
    } else {
      debug("parse()", "No schema for packet " + packet.name);
    }
  } else {
    fs.writeFileSync("debug/loginbadpacket.dat", data);
    debug("parse()", "Unknown or unhandled login packet type: " + packetType);
  }
};

LoginProtocol.prototype.pack = function (packetName, object) {
  var packetType = LoginPackets.PacketTypes[packetName],
    packet = LoginPackets.Packets[packetType],
    payload,
    data;
  if (packet) {
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
  } else {
    debug("pack()", "Unknown or unhandled login packet type: " + packetType);
  }
  return data;
};

exports.LoginProtocol = LoginProtocol;
exports.LoginPackets = LoginPackets;
