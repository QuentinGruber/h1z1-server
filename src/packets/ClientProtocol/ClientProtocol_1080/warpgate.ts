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

export const warpgatePackets: any = [
  ["Warpgate.ActivateTerminal", 0xa801, {}],
  ["Warpgate.ZoneRequest", 0xa802, {}],
  ["Warpgate.PostQueueNotify", 0xa803, {}],
  ["Warpgate.QueueForZone", 0xa804, {}],
  ["Warpgate.CancelQueue", 0xa805, {}],
  ["Warpgate.WarpToQueuedZone", 0xa806, {}],
  ["Warpgate.WarpToSocialZone", 0xa807, {}],
];
