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
import { ZoneServer2016 } from "../zoneserver";
import { BaseLightweightCharacter } from "./baselightweightcharacter";

export class farmingCrop extends BaseLightweightCharacter {
    ownerCharacterId: string;
    parentObjectCharacterId: string;
    buildingSlot: string;
    itemDefinitionId: number;
    growthStage: number;
    age: number;
    fertilized: boolean = false;
    constructor(
        characterId: string,
        transientId: number,
        actorModelId: number,
        position: Float32Array,
        rotation: Float32Array,
        scale: Float32Array,
        itemDefinitionId: number,
        ownerCharacterId: string,
        parentObjectCharacterId: string,
        BuildingSlot: string
    ) {
        super(characterId, transientId, actorModelId, position, rotation);
        (this.state.rotation = new Float32Array(
            eul2quat(
                new Float32Array([rotation[0], rotation[1], rotation[2], rotation[3]])
            )
        ));
        this.scale = new Float32Array(scale);
        this.ownerCharacterId = ownerCharacterId;
        this.parentObjectCharacterId = parentObjectCharacterId;
        this.buildingSlot = BuildingSlot;
        this.itemDefinitionId = itemDefinitionId;
        this.age = 0;
        this.growthStage = 0;
    }

    lastStage(server: ZoneServer2016) {
        return server.getGrowthDefinition(this.itemDefinitionId).STAGES.length -1 == this.growthStage;
    }
}
