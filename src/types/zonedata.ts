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

export interface zoneObject {
  actorDefinition: string;
  renderDistance: number;
  instances: zoneObjectInstance[];
}

export interface zoneObjectInstance {
  position: number[];
  rotation: number[];
  scale: number[];
  id: number;
  unknownByte1: number;
  unknownFloat1: number;
}
