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
import {
  packInteractionComponent,
  packNpcComponent,
  packUnsignedIntWith2bitLengthValue,
  readUnsignedIntWith2bitLengthValue
} from "./shared";

export const replicationPackets: PacketStructures = [
  [
    "Replication.InteractionComponent",
    0xeb,
    {
      fields: [
        { name: "opcode", type: "uint8", defaultValue: 4 },
        {
          name: "transientId",
          type: "custom",
          parser: readUnsignedIntWith2bitLengthValue,
          packer: packUnsignedIntWith2bitLengthValue
        },
        {
          name: "rawComponent",
          type: "custom",
          parser: packInteractionComponent,
          packer: packInteractionComponent,
          defaultValue: packInteractionComponent
        }
      ]
    }
  ],
  [
    "Replication.NpcComponent",
    0xeb04,
    {
      fields: [
        {
          name: "transientId",
          type: "custom",
          parser: readUnsignedIntWith2bitLengthValue,
          packer: packUnsignedIntWith2bitLengthValue
        },
        { name: "stringLength", type: "uint16", defaultValue: 18 },
        //{ name: "componentName", type: "fixedlengthstring", defaultValue: "ClientNpcComponent" }, avoid test errors
        {
          name: "componentName",
          type: "uint64string",
          defaultValue: "0x704E746E65696C43"
        },
        {
          name: "componentName2",
          type: "uint64string",
          defaultValue: "0x656E6F706D6F4363"
        },
        { name: "componentName3", type: "uint16", defaultValue: 29806 },
        { name: "unkByte1", type: "uint8", defaultValue: 0 },
        { name: "unkDword1", type: "uint32", defaultValue: 0 },
        { name: "unkDword2", type: "uint32", defaultValue: 1 },
        { name: "unkDword3", type: "uint32", defaultValue: 124 },
        { name: "unkDword4", type: "uint32", defaultValue: 4136351497 },
        { name: "unkByte2", type: "uint8", defaultValue: 0 },
        { name: "unkDword5", type: "uint32", defaultValue: 82 },
        { name: "unkDword6", type: "uint32", defaultValue: 2126 },
        { name: "unkDword7", type: "uint32", defaultValue: 718 },
        { name: "unkDword8", type: "uint32", defaultValue: 0 },
        { name: "nameId", type: "uint32", defaultValue: 0 },
        {
          name: "rawComponent",
          type: "custom",
          parser: packNpcComponent,
          packer: packNpcComponent,
          defaultValue: packNpcComponent
        }
      ]
    }
  ]
];
