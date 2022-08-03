import { Npc} from "./npc";

export class Zombie extends Npc {
    constructor(
        characterId: string,
        transientId: number,
        actorModelId: number,
        position: Float32Array,
        rotation: Float32Array,
        spawnerId: number = 0
    ) {
        super(characterId, transientId, actorModelId, position, rotation, spawnerId);
    }
    }