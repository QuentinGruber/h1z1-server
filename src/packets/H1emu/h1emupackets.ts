// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (c) 2021 Quentin Gruber
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

import PacketTableBuild from "../packettable";

const packets: any[] = [
  [
    "LoginRequest",
    0x01,
    {
      fields: [
        { name: "sessionId", type: "string" },
      ],
    },
  ],
  [
    "LoginReply",
    0x02,
    {
      fields: [
        { name: "loggedIn", type: "boolean" },
      ],
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
      fields: [{ name: "reason", type: "uint32", defaultValue: 1 }],
    },
  ],
  [
    "Ping",
    0x05,
    {
      fields: [],
    },
  ],
  [
    "TunnelAppPacketZoneToLogin",
    0x06,
    {
      fields: [
      ],
    },
  ],
  [
    "TunnelAppPacketLoginToZone",
    0x07,
    {
      fields: [
      ],
    },
  ],
];

export const [packetTypes, packetDescriptors] = PacketTableBuild(packets);

const h1emupackets = { Packets: packetDescriptors, PacketTypes: packetTypes };
export default h1emupackets;
