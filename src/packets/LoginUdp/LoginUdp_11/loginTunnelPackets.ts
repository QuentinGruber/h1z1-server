// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2022 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

import PacketTableBuild from "../../packettable";

const packets: any[] = [
  [
    "nameValidationRequest",
    0x01,
    {
      fields: [{ name: "characterName", type: "string" }],
    },
  ],
  [
    "nameValidationReply",
    0x02,
    {
      fields: [
        { name: "firstName", type: "string" },
        { name: "lastName", type: "string", defaultValue: " " },
        { name: "status", type: "uint32" },
      ],
    },
  ],
];

export const [packetTypes, packetDescriptors] = PacketTableBuild(packets);

const loginTunnelPackets = {
  Packets: packetDescriptors,
  PacketTypes: packetTypes,
};
export default loginTunnelPackets;
