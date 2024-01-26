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

export const ThrustPadPackets: any = [
  ["ThrustPad.Data", 0x9a01, {}],
  ["ThrustPad.Update", 0x9a02, {}],
  ["ThrustPad.PlayerEntered", 0x9a03, {}]
];
