// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2024 H1emu community
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
      fields: [{ name: "characterName", type: "string" }]
    }
  ],
  [
    "nameValidationReply",
    0x02,
    {
      fields: [
        { name: "firstName", type: "string" },
        { name: "lastName", type: "string", defaultValue: " " },
        { name: "status", type: "uint32" }
      ]
    }
  ],
  [
    "loginQueueUpdate",
    0x03,
    {
      fields: [
        { name: "playersInQueue", type: "uint32", defaultValue: 1 },
        { name: "unk2", type: "uint32", defaultValue: 0 },
        { name: "unk3", type: "uint32", defaultValue: 0 },
        { name: "unk4", type: "uint32", defaultValue: 0 },
        { name: "unk5", type: "uint32", defaultValue: 0 },

        { name: "disableEstimate", type: "boolean", defaultValue: true },

        { name: "unk7", type: "uint32", defaultValue: 0 },
        { name: "unk8", type: "uint32", defaultValue: 0 },
        { name: "unk9", type: "uint32", defaultValue: 0 },
        { name: "unk10", type: "uint32", defaultValue: 0 },
        { name: "unk11", type: "uint32", defaultValue: 0 }
      ]
    }
  ],
  [
    "loginQueueCanceled",
    0x05,
    {
      fields: [
        { name: "characterId", type: "uint64string" },
        { name: "unk1", type: "uint8" }
      ]
    }
  ]
];

export const [packetTypes, packetDescriptors] = PacketTableBuild(packets);

const loginTunnelPackets = {
  Packets: packetDescriptors,
  PacketTypes: packetTypes
};
export default loginTunnelPackets;
