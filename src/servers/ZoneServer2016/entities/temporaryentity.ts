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

import { ZoneServer2016 } from "../zoneserver";
import { BaseSimpleNpc } from "./basesimplenpc";

export class TemporaryEntity extends BaseSimpleNpc {
  /** Distance where the TemporaryEntity will render for the player */
  npcRenderDistance = 40;
  /** Time alloted for the entity to remain in the world */
  disappearTimer?: NodeJS.Timeout;
  constructor(
    characterId: string,
    transientId: number,
    actorModelId: number,
    position: Float32Array,
    rotation: Float32Array,
    server: ZoneServer2016
  ) {
    super(characterId, transientId, actorModelId, position, rotation, server);
  }

  setDespawnTimer(server: ZoneServer2016, time: number) {
    if (this.disappearTimer) this.disappearTimer.refresh();
    this.disappearTimer = setTimeout(() => {
      server.deleteEntity(this.characterId, server._temporaryObjects);
    }, time);
  }

  destroy(server: ZoneServer2016): boolean {
    return server.deleteEntity(this.characterId, server._temporaryObjects);
  }
}
