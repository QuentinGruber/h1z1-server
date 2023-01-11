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

import { ZoneServer2016 } from "../zoneserver";
import { BaseSimpleNpc } from "./basesimplenpc";

export class TemporaryEntity extends BaseSimpleNpc {
  npcRenderDistance = 40;
  disappearTimer?: NodeJS.Timeout;
  constructor(
    characterId: string,
    transientId: number,
    actorModelId: number,
    position: Float32Array,
    rotation: Float32Array
  ) {
    super(characterId, transientId, actorModelId, position, rotation);
  }

  setDespawnTimer(server: ZoneServer2016, time: number) {
    this.disappearTimer = setTimeout(() => {
      server.sendDataToAllWithSpawnedEntity(
        server._temporaryObjects,
        this.characterId,
        "Character.RemovePlayer",
        {
          characterId: this.characterId,
        }
      );
      delete server._temporaryObjects[this.characterId];
    }, time);
  }
}
