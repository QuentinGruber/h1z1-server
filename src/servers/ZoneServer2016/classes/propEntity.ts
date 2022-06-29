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
import { eul2quat } from "../../../utils/utils";
import { BaseLightweightCharacter } from "./baselightweightcharacter";

function getPropType(modelId: number) {
    let result: string;
    switch (modelId) {
        case 8013:
        case 8014:
        case 9088:
            result = 'destroyable';
            break;
        case 9328:
        case 9330:
        case 9329:
        case 9331:
        case 9336:
            result = 'bed';
            break;
        case 36:
        case 9205:
        case 9041:
            result = 'fireable';
            break;
        case 57:
        case 9127:
            result = 'storage';
            break;
        case 9032:
        case 9033:
            result = 'watersource';
            break;
        default:
            result = 'searchable';
            break;
    }

    return result;
}

function isQuat(rotation: Float32Array) {
    return (rotation[1] != 0 && rotation[2] != 0 && rotation[3] != 0) ? rotation : eul2quat(rotation);
}

export class propEntity extends BaseLightweightCharacter {
    spawnerId: number;
    npcRenderDistance = 150;
    positionUpdateType = 0;
    inventory: object = {};
    type: string;
    constructor(
        characterId: string,
        transientId: number,
        actorModelId: number,
        position: Float32Array,
        rotation: Float32Array,
        scale: Float32Array,
        spawnerId: number,
        renderDistance: number,
    ) {
        super(characterId, transientId, actorModelId, position, rotation);
        this.scale = new Float32Array(scale);
        this.spawnerId = spawnerId;
        this.type = getPropType(this.actorModelId);
        this.npcRenderDistance = renderDistance;
        this.state.rotation = isQuat(rotation);

    }
}