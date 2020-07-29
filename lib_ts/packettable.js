function build(packets, packetTypes, packetDescriptors, prefix) {
  prefix = prefix ? prefix + "." : "";
  for (var i = 0; i < packets.length; i++) {
    var packet = packets[i],
      name = prefix + packet[0],
      type = packet[1] >>> 0,
      packetDesc = packet[2];
    packetTypes[name] = type;
    packetDescriptors[type] = {
      type: type,
      name: name,
      schema: packetDesc.fields,
      fn: packetDesc.fn,
      parse: packetDesc.parse,
      pack: packetDesc.pack,
    };
  }
}

exports.build = build;
