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

export const zoneSettingPackets: PacketStructures = [
  [
    "ZoneSetting.Data",
    0xb401,
    {
      fields: [
        {
          name: "settings",
          type: "array",
          defaultValue: [{}],
          fields: [
            { name: "hash", type: "uint32", defaultValue: 0 },
            { name: "unknown1", type: "uint32", defaultValue: 0 },
            { name: "unknown2", type: "uint32", defaultValue: 0 },
            { name: "value", type: "uint32", defaultValue: 0 },
            { name: "settingType", type: "uint32", defaultValue: 0 }
          ]
        }
      ]
    }
  ]
];
