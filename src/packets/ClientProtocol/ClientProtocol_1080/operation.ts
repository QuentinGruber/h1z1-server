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

export const operationPackets: any = [
  ["Operation.ClientJoined", 0xbc06, {}],
  ["Operation.ClientLeft", 0xbc07, {}],
  ["Operation.AvailableData", 0xbc09, {}],
  ["Operation.Created", 0xbc0a, {}],
  ["Operation.Destroyed", 0xbc0b, {}],
  ["Operation.ClientClearMissions", 0xbf0c, { fields: [] }],
  ["Operation.InstanceAreaUpdate", 0xbc0d, {}],
  ["Operation.ClientInArea", 0xbc0e, {}],
  ["Operation.InstanceLocationUpdate", 0xbc0f, {}],
  ["Operation.GroupOperationListReply", 0xbc11, {}],
];
