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

export const deployablePackets: any = [
  ["Deployable.Place", 0xa101, {}],
  ["Deployable.Remove", 0xa102, {}],
  ["Deployable.Pickup", 0xa103, {}],
  ["Deployable.ActionResponse", 0xa104, {}],
];
