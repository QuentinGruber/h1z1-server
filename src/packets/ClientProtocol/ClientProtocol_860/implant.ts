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

export const implantPackets: any = [
  ["Implant.SelectImplant", 0x9b01, {}],
  ["Implant.UnselectImplant", 0x9b02, {}],
  ["Implant.LoadImplantDefinitionManager", 0x9b03, {}],
  ["Implant.SetImplants", 0x9b04, {}],
  ["Implant.UpdateImplantSlot", 0x9b05, {}],
];
