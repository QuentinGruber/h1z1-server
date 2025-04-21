// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2025 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

export enum GAME_VERSIONS {
  H1Z1_15janv_2015 = 1,
  H1Z1_6dec_2016 = 2,
  H1Z1_KOTK_PS3 = 3
}

export enum CONNECTION_REJECTION_FLAGS {
  ERROR = 0,
  LOCAL_BAN = 1,
  GLOBAL_BAN = 2,
  VPN = 3,
  HWID = 4,
  UNVERIFIED = 5,
  SERVER_LOCKED = 6,
  SERVER_REBOOT = 7,
  CHARACTER_NOT_FOUND = 8,
  OTHER = 9
}

export enum NAME_VALIDATION_STATUS {
  AVAILABLE = 1,
  TAKEN = 2,
  INVALID = 3,
  PROFANE = 4,
  RESERVED = 5
}

export enum CUSTOM_PROFILES_IDS {
  CONSTRUCTION = 999
}

export enum DB_COLLECTIONS {
  CONSTRUCTION_LOGS = "construction-logs",
  ADMINS = "admins",
  BANNED = "banned",
  BLACK_LIST_ENTRIES = "blackListEntries",
  CHARACTERS = "characters",
  ACCOUNT_ITEMS = "account-items",
  CHARACTERS_LIGHT = "characters-light",
  CHAT = "chats",
  CONSTRUCTION = "construction",
  CROPS = "crops",
  TRAPS = "traps",
  FINGERPRINTS = "fingerprints",
  PROPS = "props",
  SERVERS = "servers",
  USERS_SESSIONS = "user-sessions",
  VEHICLES = "vehicles",
  WEATHERS = "weathers",
  WORLD_CONSTRUCTIONS = "worldconstruction",
  WORLDS = "worlds",
  COMMAND_USED = "commands-used",
  FAIRPLAY = "fairplay-logs",
  KILLS = "kills",
  MUTED = "muted",
  GROUPS = "groups",
  VPN_WHITELIST = "vpn-whitelist",
  CHALLENGES = "challenges",
  AUTHKEYS = "verified-authkeys"
}

export enum KILL_TYPE {
  PLAYER = "player",
  ZOMBIE = "zombie",
  WILDLIFE = "wildlife",
  VEHICLE = "vehicle"
}

export enum LOGIN_KICK_REASON {
  UNDEFINED = 0,
  GLOBAL_BAN = 1
}
