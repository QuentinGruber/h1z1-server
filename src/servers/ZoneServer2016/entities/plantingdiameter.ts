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

import { TemporaryEntity } from "./temporaryentity";
import { ZoneServer2016 } from "../zoneserver";
import { Plant } from "./plant";

export class PlantingDiameter extends TemporaryEntity {
  seedSlots: { [id: string]: Plant } = {};
  disappearTimestamp: number = new Date().getTime() + 86400000; // + 1 day
  isFertilized: boolean = false;
  fertilizedTimestamp: number = 0;
  constructor(
    characterId: string,
    transientId: number,
    actorModelId: number,
    position: Float32Array,
    rotation: Float32Array,
    server: ZoneServer2016
  ) {
    super(characterId, transientId, actorModelId, position, rotation, server);
    this.npcRenderDistance = 30;
  }

  destroy(server: ZoneServer2016): boolean {
    for (const plant of Object.values(this.seedSlots)) {
      plant.destroy(server);
    }
    return server.deleteEntity(this.characterId, server._temporaryObjects);
  }
}
