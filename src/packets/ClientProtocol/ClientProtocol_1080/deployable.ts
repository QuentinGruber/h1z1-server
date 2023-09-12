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

export const deployablePackets: PacketStructures = [
  ["Deployable.Place", 0xa201, {}],
  ["Deployable.Remove", 0xa202, {}],
  ["Deployable.Pickup", 0xa203, {}],
  ["Deployable.ActionResponse", 0xa204, {}]
];
