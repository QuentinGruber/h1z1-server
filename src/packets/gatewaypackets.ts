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

import PacketTableBuild from "./packettable";

const packets: any[] = [
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

export const [packetTypes, packetDescriptors] = PacketTableBuild(packets);
const GatewayPackets = {
  Packets: packetDescriptors,
  PacketDescriptors: packetTypes,
};
export default GatewayPackets;
