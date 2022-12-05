import { BaseItem } from "./baseItem";
import { LoadoutItem } from "./loadoutItem";

export class LoadoutContainer extends LoadoutItem {
    containerDefinitionId: number;
    items: { [itemGuid: string]: BaseItem } = {};
    constructor(itemDefinitionId: number, guid: string, durability: number, stackCount : number, loadoutItemOwnerGuid: string, containerDefinitionId: number) {
        super(itemDefinitionId, guid, durability, stackCount, loadoutItemOwnerGuid);
        this.containerDefinitionId = containerDefinitionId;
    }
}