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

export const itemsPackets: any = [
  ["Items.LoadItemRentalDefinitionManager", 0xaf01, {}],
  ["Items.SetItemTimerManager", 0xaf02, {}],
  ["Items.SetItemLockTimer", 0xaf03, {}],
  ["Items.SetItemTimers", 0xaf04, {}],
  ["Items.SetItemTrialLockTimer", 0xaf05, {}],
  ["Items.SetItemTrialTimers", 0xaf06, {}],
  ["Items.AddItemTrialTimer", 0xaf07, {}],
  ["Items.RemoveItemTrialTimer", 0xaf08, {}],
  ["Items.ExpireItemTrialTimer", 0xaf09, {}],
  ["Items.UpdateItemTrialTimer", 0xaf0a, {}],
  ["Items.SetItemRentalTimers", 0xaf0b, {}],
  ["Items.AddItemRentalTimer", 0xaf0c, {}],
  ["Items.RemoveItemRentalTimer", 0xaf0d, {}],
  ["Items.ExpireItemRentalTimer", 0xaf0e, {}],
  ["Items.SetAccountItemManager", 0xaf0f, {}],
  ["Items.AddAccountItem", 0xaf10, {}],
  ["Items.RemoveAccountItem", 0xaf11, {}],
  ["Items.UpdateAccountItem", 0xaf12, {}],
  ["Items.RequestAddItemTimer", 0xaf13, {}],
  ["Items.RequestTrialItem", 0xaf14, {}],
  ["Items.RequestRentalItem", 0xaf15, {}],
  ["Items.RequestUseItem", 0xaf16, {}],
  ["Items.RequestUseAccountItem", 0xaf17, {}],
];
