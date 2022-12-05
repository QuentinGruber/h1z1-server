import { BaseItem } from "./baseItem";

export class LoadoutItem extends BaseItem {
    loadoutItemOwnerGuid: string;
    constructor(itemDefinitionId: number, guid: string, durability: number, stackCount : number, loadoutItemOwnerGuid: string) {
        super(itemDefinitionId, guid, durability, stackCount);
        this.loadoutItemOwnerGuid = loadoutItemOwnerGuid;
    }
}