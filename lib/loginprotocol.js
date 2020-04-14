var fs = require("fs"),
  debug = require("debug")("LoginProtocol"),
  DataSchema = require("dataschema"),
  LoginPackets = require("./loginpackets");
log = require("./utils").log;

function LoginProtocol() {}

var n = 0;

LoginProtocol.prototype.parse = function (data) {
  var packetType = data[0],
    result,
    schema,
    name,
    packet = LoginPackets.Packets[packetType];
  if (packet == undefined) packet = LoginPackets.Packets[1]; // HACK
  if (packet) {
    if (packet.schema) {
      console.log(packet.name);
      result = DataSchema.parse(packet.schema, data, 1).result;
      return {
        type: packet.type,
        name: packet.name,
        result: result,
      };
    } else {
      console.log("parse()", "No schema for packet " + packet.name);
      log("parse() " + "No schema for packet " + packet.name, 2);
    }
  } else {
    //fs.writeFileSync("debug/loginbadpacket.dat", data); Diseable that
    console.log(
      "parse()",
      "Unknown or unhandled login packet type: " + packetType
    );
    log(
      "parse() " + "Unknown or unhandled login packet type: " + packetType,
      2
    );
    return false;
  }
};

LoginProtocol.prototype.pack = function (packetName, object) {
  var packetType = LoginPackets.PacketTypes[packetName],
    packet = LoginPackets.Packets[packetType],
    payload,
    data;
  if (packet) {
    if (packet.schema) {
      console.log("Packing data for " + packet.name);
      payload = DataSchema.pack(packet.schema, object);
      if (payload) {
        data = new Buffer(1 + payload.length);
        data.writeUInt8(packetType, 0);
        payload.data.copy(data, 1);
      } else {
        console.log("Could not pack data schema for " + packet.name);
      }
    } else {
      console.log("pack()", "No schema for packet " + packet.name);
    }
  } else {
    console.log(
      "pack()",
      "Unknown or unhandled login packet type: " + packetType
    );
  }
  return data;
};

exports.LoginProtocol = LoginProtocol;
exports.LoginPackets = LoginPackets;
