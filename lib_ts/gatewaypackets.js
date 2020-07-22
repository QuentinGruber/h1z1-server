var PacketTable = require("./packettable");

var packets = [
  [
    "LoginRequest",
    0x01,
    {
      fields: [
        { name: "characterId", type: "uint64" },
        { name: "ticket", type: "string" },
        { name: "clientProtocol", type: "string" },
        { name: "clientBuild", type: "string" },
      ],
    },
  ],
  [
    "LoginReply",
    0x02,
    {
      fields: [{ name: "loggedIn", type: "boolean" }],
    },
  ],
  [
    "Logout",
    0x03,
    {
      fields: [],
    },
  ],
  [
    "ForceDisconnect",
    0x04,
    {
      fields: [],
    },
  ],
  ["TunnelPacketToExternalConnection", 0x05, {}],
  ["TunnelPacketFromExternalConnection", 0x06, {}],
  [
    "ChannelIsRoutable",
    0x07,
    {
      fields: [{ name: "isRoutable", type: "boolean" }],
    },
  ],
  [
    "ConnectionIsNotRoutable",
    0x08,
    {
      fields: [],
    },
  ],
];

var packetTypes = {},
  packetDescriptors = {};

PacketTable.build(packets, packetTypes, packetDescriptors);

exports.PacketTypes = packetTypes;
exports.Packets = packetDescriptors;
