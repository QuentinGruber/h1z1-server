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

import { DoorEntity } from "./doorentity";

export class constructionDoor extends DoorEntity {
    ownerCharacterId: string;
    password: number = 0;
    grantedAccess: any = [];
    health: number = 1000000;
    constructor(
        characterId: string,
        transientId: number,
        actorModelId: number,
        position: Float32Array,
        rotation: Float32Array,
        scale: Float32Array,
        spawnerId: number,
        ownerCharacterId: string
    ) {
        super(characterId, transientId, actorModelId, position, rotation, new Float32Array(scale), 0);
        this.ownerCharacterId = ownerCharacterId;
    }
}
