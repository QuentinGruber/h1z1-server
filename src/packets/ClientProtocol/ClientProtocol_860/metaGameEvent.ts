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

export const MetaGameEventPackets: any = [
  ["MetaGameEvent.StartWarning", 0xb901, {}],
  ["MetaGameEvent.Start", 0xb902, {}],
  ["MetaGameEvent.Update", 0xb903, {}],
  ["MetaGameEvent.CompleteDominating", 0xb904, {}],
  ["MetaGameEvent.CompleteStandard", 0xb905, {}],
  ["MetaGameEvent.CompleteCancel", 0xb906, {}],
  ["MetaGameEvent.ExperienceBonusUpdate", 0xb907, {}],
  ["MetaGameEvent.ClearExperienceBonus", 0xb908, {}],
];
