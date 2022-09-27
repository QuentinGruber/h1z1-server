//   copyright (C) 2021 - 2022 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

import { BaseLightweightCharacter } from "./baselightweightcharacter";
import { ZoneServer2016 } from "../zoneserver";

export class simpleConstruction extends BaseLightweightCharacter {
    health: number = 1000000;
    healthPercentage: number = 100;
    buildingSlot?: string;
    perimeters: { [slot: string]: Float32Array };
    parentObjectCharacterId: string;
    eulerAngle?: number;
    slot?: string;
    occupiedSlots: string[] = [];
    securedPolygons?: any;
    isSecured = false;
    constructor(
        characterId: string,
        transientId: number,
        actorModelId: number,
        position: Float32Array,
        rotation: Float32Array,
        parentObjectCharacterId: string,
        slot?: string,
        BuildingSlot?: string,
        eulerAngle?: number,
    ) {
        super(characterId, transientId, actorModelId, position, rotation);
        if (BuildingSlot) this.buildingSlot = BuildingSlot;
        this.parentObjectCharacterId = parentObjectCharacterId;
        if (eulerAngle) this.eulerAngle = eulerAngle;
        if (slot) this.slot = slot
        this.perimeters = {
            "LoveShackDoor": new Float32Array([0, 0, 0, 0])
        }
    }
    pGetConstructionHealth() {
        return {
            characterId: this.characterId,
            health: this.health / 10000,
        };
    }
    pDamageConstruction(damage: number) {
        this.health -= damage;
        this.healthPercentage = this.health / 10000;
    }
    changePerimeters(server: ZoneServer2016, slot: string | undefined, value: Float32Array) {
        this.perimeters['LoveShackDoor'] = value;
        if (value.reduce((accumulator, currentValue) => accumulator + currentValue) != 0) {
            this.isSecured = true
        } else this.isSecured = false;
    }
}
