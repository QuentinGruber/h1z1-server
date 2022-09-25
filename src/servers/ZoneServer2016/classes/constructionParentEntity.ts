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

import { simpleConstruction } from "./simpleConstruction";
import { Items } from "../enums";
import { ZoneServer2016 } from "../zoneserver";


export class ConstructionParentEntity extends simpleConstruction {
    healthPercentage: number = 100;
    permissions: any;
    ownerCharacterId: string;
    perimeters: { [slot: string]: Float32Array };
    itemDefinitionId: number;
    expansions: { [slot: string]: string } = {};
    isSecured: boolean = false;
    parentObjectCharacterId: string;
    occupiedSlots: string[]= [];
    buildingSlot?: string;
    securedPolygons: any;
    constructor(
        characterId: string,
        transientId: number,
        actorModelId: number,
        position: Float32Array,
        rotation: Float32Array,
        itemDefinition: number,
        ownerCharacterId: string,
        ownerName: string | undefined,
        parentObjectCharacterId?: string,
        BuildingSlot?: string,
        occupiedSlot?: string,
    ) {
        super(characterId, transientId, actorModelId, position, rotation);
        this.health = 1000000;
        this.ownerCharacterId = ownerCharacterId;
        const ownerPermission = {
            characterId: ownerCharacterId,
            characterName: ownerName,
            useContainers: true,
            build: true,
            demolish: true,
            visit: true,
        }
        this.itemDefinitionId = itemDefinition
        this.permissions = [ownerPermission]
        if (parentObjectCharacterId) {
            this.parentObjectCharacterId = parentObjectCharacterId;
        } else {
            this.parentObjectCharacterId = "";
        }
        if (BuildingSlot) this.buildingSlot = BuildingSlot;
        this.securedPolygons = [];
        this.perimeters = {};
        switch (this.itemDefinitionId) {
            case Items.GROUND_TAMPER:
                this.perimeters = {
                    "01": new Float32Array([0, 0, 0, 0]),
                    "02": new Float32Array([0, 0, 0, 0]),
                    "03": new Float32Array([0, 0, 0, 0]),
                    "04": new Float32Array([0, 0, 0, 0]),
                    "05": new Float32Array([0, 0, 0, 0]),
                    "06": new Float32Array([0, 0, 0, 0]),
                    "07": new Float32Array([0, 0, 0, 0]),
                    "08": new Float32Array([0, 0, 0, 0]),
                    "09": new Float32Array([0, 0, 0, 0]),
                    "10": new Float32Array([0, 0, 0, 0]),
                    "11": new Float32Array([0, 0, 0, 0]),
                    "12": new Float32Array([0, 0, 0, 0]),
                    "13": new Float32Array([0, 0, 0, 0]),
                    "14": new Float32Array([0, 0, 0, 0]),
                    "15": new Float32Array([0, 0, 0, 0]),
                    "16": new Float32Array([0, 0, 0, 0]),
                }
                break;
            case Items.FOUNDATION:
                this.perimeters = {
                    "01": new Float32Array([0, 0, 0, 0]),
                    "02": new Float32Array([0, 0, 0, 0]),
                    "03": new Float32Array([0, 0, 0, 0]),
                    "04": new Float32Array([0, 0, 0, 0]),
                    "05": new Float32Array([0, 0, 0, 0]),
                    "06": new Float32Array([0, 0, 0, 0]),
                    "07": new Float32Array([0, 0, 0, 0]),
                    "08": new Float32Array([0, 0, 0, 0]),
                    "09": new Float32Array([0, 0, 0, 0]),
                    "10": new Float32Array([0, 0, 0, 0]),
                    "11": new Float32Array([0, 0, 0, 0]),
                    "12": new Float32Array([0, 0, 0, 0]),
                }
                break;
            case Items.SMALL_SHACK:
            case Items.BASIC_SHACK:
            case Items.SHACK:
                this.perimeters = {
                    "01": new Float32Array([0, 0, 0, 0]),
                }
                break;
            case Items.FOUNDATION_EXPANSION:
                this.perimeters = {
                    "01": new Float32Array([0, 0, 0, 0]),
                    "02": new Float32Array([0, 0, 0, 0]),
                    "03": new Float32Array([0, 0, 0, 0]),
                    "04": new Float32Array([0, 0, 0, 0]),
                    "05": new Float32Array([0, 0, 0, 0]),
                }
                break;
        }
    }
    checkPerimeters(server: ZoneServer2016) {
        const temporaryPolygons = [];
        this.securedPolygons = [];
        let result = true;
        let side01: boolean = false;
        let side02: boolean = false;
        let side03: boolean = false;
        let side04: boolean = false;

        switch (this.itemDefinitionId) {
            case Items.FOUNDATION:
                if (this.expansions["01"] && server._constructionFoundations[this.expansions["01"]].isSecured) {
                    const expansion = server._constructionFoundations[this.expansions["01"]];
                    const tempExpansionPolygons: any[] = [];
                    tempExpansionPolygons.push([expansion.perimeters["01"][0], expansion.perimeters["01"][2]])
                    tempExpansionPolygons.push([expansion.perimeters["02"][0], expansion.perimeters["02"][2]])
                    tempExpansionPolygons.push([expansion.perimeters["05"][0], expansion.perimeters["05"][2]])
                    if (server._constructionFoundations[this.expansions["04"]] && server._constructionFoundations[this.expansions["04"]].perimeters["01"].reduce((accumulator, currentValue) => accumulator + currentValue) != 0) {
                        tempExpansionPolygons.push([server._constructionFoundations[this.expansions["04"]].perimeters["01"][0], server._constructionFoundations[this.expansions["04"]].perimeters["01"][2]])
                    } else {
                        tempExpansionPolygons.push([this.perimeters["07"][0], this.perimeters["07"][2]])
                    }
                    expansion.securedPolygons = tempExpansionPolygons
                    temporaryPolygons.push([expansion.perimeters["01"][0], expansion.perimeters["01"][2]])
                    side01 = true;
                } else {
                    if (this.perimeters["04"].reduce((accumulator, currentValue) => accumulator + currentValue) != 0 &&
                        this.perimeters["05"].reduce((accumulator, currentValue) => accumulator + currentValue) != 0 &&
                        this.perimeters["06"].reduce((accumulator, currentValue) => accumulator + currentValue) != 0) {
                        temporaryPolygons.push([this.perimeters["04"][0], this.perimeters["04"][2]])
                        side01 = true;
                    }
                }
                if (this.expansions["02"] && server._constructionFoundations[this.expansions["02"]].isSecured) {
                    const expansion = server._constructionFoundations[this.expansions["02"]];
                    const tempExpansionPolygons: any[] = [];
                    tempExpansionPolygons.push([expansion.perimeters["01"][0], expansion.perimeters["01"][2]])
                    tempExpansionPolygons.push([expansion.perimeters["02"][0], expansion.perimeters["02"][2]])
                    tempExpansionPolygons.push([expansion.perimeters["05"][0], expansion.perimeters["05"][2]])
                    if (server._constructionFoundations[this.expansions["01"]] && server._constructionFoundations[this.expansions["01"]].perimeters["01"].reduce((accumulator, currentValue) => accumulator + currentValue) != 0) {
                        tempExpansionPolygons.push([server._constructionFoundations[this.expansions["01"]].perimeters["01"][0], server._constructionFoundations[this.expansions["01"]].perimeters["01"][2]])
                    } else {
                        tempExpansionPolygons.push([this.perimeters["04"][0], this.perimeters["04"][2]])
                    }
                    expansion.securedPolygons = tempExpansionPolygons
                    temporaryPolygons.push([expansion.perimeters["01"][0], expansion.perimeters["01"][2]])
                    side02 = true;
                } else {
                    if (this.perimeters["01"].reduce((accumulator, currentValue) => accumulator + currentValue) != 0 &&
                        this.perimeters["02"].reduce((accumulator, currentValue) => accumulator + currentValue) != 0 &&
                        this.perimeters["03"].reduce((accumulator, currentValue) => accumulator + currentValue) != 0) {
                        temporaryPolygons.push([this.perimeters["01"][0], this.perimeters["01"][2]])
                        side02 = true;
                    }
                }
                if (this.expansions["03"] && server._constructionFoundations[this.expansions["03"]].isSecured) {
                    const expansion = server._constructionFoundations[this.expansions["03"]];
                    const tempExpansionPolygons: any[] = [];
                    tempExpansionPolygons.push([expansion.perimeters["01"][0], expansion.perimeters["01"][2]])
                    tempExpansionPolygons.push([expansion.perimeters["02"][0], expansion.perimeters["02"][2]])
                    tempExpansionPolygons.push([expansion.perimeters["05"][0], expansion.perimeters["05"][2]])
                    if (server._constructionFoundations[this.expansions["02"]] && server._constructionFoundations[this.expansions["02"]].perimeters["01"].reduce((accumulator, currentValue) => accumulator + currentValue) != 0) {
                        tempExpansionPolygons.push([server._constructionFoundations[this.expansions["02"]].perimeters["01"][0], server._constructionFoundations[this.expansions["02"]].perimeters["01"][2]])
                    } else {
                        tempExpansionPolygons.push([this.perimeters["01"][0], this.perimeters["01"][2]])
                    }
                    expansion.securedPolygons = tempExpansionPolygons
                    temporaryPolygons.push([expansion.perimeters["01"][0], expansion.perimeters["01"][2]])
                    side03 = true;
                } else {
                    if (this.perimeters["10"].reduce((accumulator, currentValue) => accumulator + currentValue) != 0 &&
                        this.perimeters["11"].reduce((accumulator, currentValue) => accumulator + currentValue) != 0 &&
                        this.perimeters["12"].reduce((accumulator, currentValue) => accumulator + currentValue) != 0) {
                        temporaryPolygons.push([this.perimeters["10"][0], this.perimeters["10"][2]])
                        side03 = true;
                    }
                }
                if (this.expansions["04"] && server._constructionFoundations[this.expansions["04"]].isSecured) {
                    const expansion = server._constructionFoundations[this.expansions["04"]];
                    const tempExpansionPolygons: any[] = [];
                    tempExpansionPolygons.push([expansion.perimeters["01"][0], expansion.perimeters["01"][2]])
                    tempExpansionPolygons.push([expansion.perimeters["02"][0], expansion.perimeters["02"][2]])
                    tempExpansionPolygons.push([expansion.perimeters["05"][0], expansion.perimeters["05"][2]])
                    if (server._constructionFoundations[this.expansions["03"]] && server._constructionFoundations[this.expansions["03"]].perimeters["01"].reduce((accumulator, currentValue) => accumulator + currentValue) != 0) {
                        tempExpansionPolygons.push([server._constructionFoundations[this.expansions["03"]].perimeters["01"][0], server._constructionFoundations[this.expansions["03"]].perimeters["01"][2]])
                    } else {
                        tempExpansionPolygons.push([this.perimeters["10"][0], this.perimeters["10"][2]])
                    }
                    expansion.securedPolygons = tempExpansionPolygons
                    temporaryPolygons.push([expansion.perimeters["01"][0], expansion.perimeters["01"][2]])
                    side04 = true;
                } else {
                    if (this.perimeters["07"].reduce((accumulator, currentValue) => accumulator + currentValue) != 0 &&
                        this.perimeters["08"].reduce((accumulator, currentValue) => accumulator + currentValue) != 0 &&
                        this.perimeters["09"].reduce((accumulator, currentValue) => accumulator + currentValue) != 0) {
                        temporaryPolygons.push([this.perimeters["07"][0], this.perimeters["07"][2]])
                        side04 = true;
                    }
                }
                if (side01 && side02 && side03 && side04) {
                    this.isSecured = true;
                    this.securedPolygons = temporaryPolygons;

                } else {
                    this.isSecured = false;
                }
                break;
            case Items.FOUNDATION_EXPANSION:
                Object.values(this.perimeters).forEach((value: Float32Array) => {
                    if (!value.reduce((accumulator, currentValue) => accumulator + currentValue)) {
                        result = false
                    }
                });
                this.isSecured = result;
                if (this.parentObjectCharacterId) {
                    server._constructionFoundations[this.parentObjectCharacterId].checkPerimeters(server);
                }
                break;
            case Items.GROUND_TAMPER:
                Object.values(this.perimeters).forEach((value: Float32Array) => {
                    if (!value.reduce((accumulator, currentValue) => accumulator + currentValue)) {
                        result = false
                    }
                });
                if (result) {
                    temporaryPolygons.push([this.perimeters["13"][0], this.perimeters["13"][2]])
                    temporaryPolygons.push([this.perimeters["09"][0], this.perimeters["09"][2]])
                    temporaryPolygons.push([this.perimeters["05"][0], this.perimeters["05"][2]])
                    temporaryPolygons.push([this.perimeters["01"][0], this.perimeters["01"][2]])
                    this.securedPolygons = temporaryPolygons
                }
                this.isSecured = result;
                break;
            case Items.SHACK:
            case Items.SMALL_SHACK:
            case Items.BASIC_SHACK:
                this.isSecured = this.perimeters["01"].reduce((accumulator, currentValue) => accumulator + currentValue) === 0 ? false : true;
                break;
        }
    }
    changePerimeters(server: ZoneServer2016, slot: string | undefined, value: Float32Array) {
        if (!slot) return;
        if (this.itemDefinitionId === Items.SHACK || this.itemDefinitionId === Items.SMALL_SHACK || this.itemDefinitionId === Items.BASIC_SHACK) {
            this.perimeters["01"] = value;
            this.checkPerimeters(server)
            return;
        }
        this.perimeters[slot as keyof typeof this.perimeters] = value;
        this.checkPerimeters(server)
    }
}
