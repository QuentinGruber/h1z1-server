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

export const activityServicePackets: PacketStructures = [
  ["Activity.Activity.ListOfActivities", 0x700101, {}],
  ["Activity.Activity.UpdateActivityFeaturedStatus", 0x700105, {}],
  ["Activity.ScheduledActivity.ListOfActivities", 0x700201, {}]
];
