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

import { BaseFullCharacter } from "./basefullcharacter";

function getFlags(field: any) {
    let flagValue = 0;
    for (let j = 0; j < field.length; j++) {
        const flag = field[j];
        if (flag) {
            flagValue = flagValue | (1 << j);
        }
    }
    return flagValue
}

export class Npc extends BaseFullCharacter {
    health: number;
    npcRenderDistance = 80;
    spawnerId: number;
    deathTime: number = 0;
    constructor(
        characterId: string,
        transientId: number,
        actorModelId: number,
        position: Float32Array,
        rotation: Float32Array,
        spawnerId: number = 0
    ) {
        super(characterId, transientId, actorModelId, position, rotation);
        this.spawnerId = spawnerId;
        this.flags.a = getFlags([false, false, false, false, false, false, false, false]);
        this.flags.b = getFlags([false, false, false, false, true, false, false, false]);
        this.flags.c = getFlags([false, false, false, false, false, false, false, false]);
        this.health = 10000;
    }
}
