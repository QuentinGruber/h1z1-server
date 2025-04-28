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

/** Used when a player respawns and decides a location */
export class SpawnCell {
  position: Float32Array;
  spawnPoints: Float32Array[] = [];
  width: number;
  height: number;
  constructor(x: number, y: number, width: number, height: number) {
    this.position = new Float32Array([x, 0, y, 1]);
    this.width = width;
    this.height = height;
  }
}
