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

export enum GAME_VERSIONS {
  H1Z1_15janv_2015 = 1,
  H1Z1_6dec_2016 = 2,
  H1Z1_KOTK_PS3 = 3,
}

export enum NAME_VALIDATION_STATUS {
  AVAILABLE = 1,
  TAKEN = 2,
  INVALID = 3,
  PROFANE = 4,
  RESERVED = 5,
}

export enum DB_COLLECTIONS {
  ADMINS = "admins",
  BANNED = "banned",
  BLACK_LIST_ENTRIES = "blackListEntries",
  CHARACTERS = "characters",
  CHARACTERS_LIGHT = "characters-light",
  CHAT = "chat",
  CONSTRUCTION = "construction",
  CONSTRUCTION_TEMP = "construction-temp",
  CROPS = "crops",
  CROPS_TEMP = "crops-temp",
  FINGERPRINTS = "fingerprints",
  PROPS = "props",
  SERVERS = "servers",
  USERS_SESSIONS = "user-sessions",
  VEHICLES = "vehicles",
  WEATHERS = "weathers",
  WORLD_CONSTRUCTIONS = "worldconstruction",
  WORLD_CONSTRUCTIONS_TEMP = "worldconstruction-temp",
  WORLDS = "worlds",
  COMMAND_USED = "commands-used",
  FAIRPLAY = "fairplay-logs",
}
