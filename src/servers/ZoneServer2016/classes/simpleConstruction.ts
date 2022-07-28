//   copyright (C) 2021 - 2022 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

import { BaseSimpleNpc } from "./basesimplenpc";

export class simpleConstruction extends BaseSimpleNpc {
    health = 1000000;
    slot?: string;
    parentObjectCharacterId?: string;
    constructor(
        characterId: string,
        transientId: number,
        actorModelId: number,
        position: Float32Array,
        rotation: Float32Array,
        slot?: string,
        parentObjectCharacterId?: string,
    ) {
        super(characterId, transientId, actorModelId, position, rotation);
        if (slot) {
            this.slot = slot;
        }
        if (parentObjectCharacterId) {
            this.parentObjectCharacterId = parentObjectCharacterId;
        }
    }
}
