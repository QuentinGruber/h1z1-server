// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2023 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

import { PacketStructures } from "types/packetStructure";

export const quickChatPackets: PacketStructures = [
  [
    "QuickChat.SendData",
    0x280100,
    {
      fields: [
        {
          name: "commands",
          type: "array",
          defaultValue: [{}],
          fields: [
            { name: "commandId", type: "uint32", defaultValue: 0 },
            {
              name: "commandData",
              type: "schema",
              fields: [
                { name: "commandId", type: "uint32", defaultValue: 0 },
                { name: "menuStringId", type: "uint32", defaultValue: 0 },
                { name: "chatStringId", type: "uint32", defaultValue: 0 },
                { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                { name: "unknownDword2", type: "uint32", defaultValue: 0 },
                { name: "unknownDword3", type: "uint32", defaultValue: 0 },
                { name: "unknownDword4", type: "uint32", defaultValue: 0 },
                { name: "unknownDword5", type: "uint32", defaultValue: 0 },
                { name: "unknownDword6", type: "uint32", defaultValue: 0 },
                { name: "unknownDword7", type: "uint32", defaultValue: 0 }
              ]
            }
          ]
        }
      ]
    }
  ],
  ["QuickChat.SendTell", 0x2802, {}],
  ["QuickChat.SendChatToChannel", 0x2803, {}]
];
