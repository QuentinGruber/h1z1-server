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

export const activityServicePackets: any = [
  ["ActivityService.Activity.ListOfActivities", 0x6f0101, {}],
  ["ActivityService.Activity.UpdateActivityFeaturedStatus", 0x6f0105, {}],
  ["ActivityService.ScheduledActivity.ListOfActivities", 0x6f0201, {}],
];
