import { BaseItem } from "./baseItem";
import { LoadoutItem } from "./loadoutItem";

export class LoadoutContainer extends LoadoutItem {
    containerDefinitionId: number;
    items: { [itemGuid: string]: BaseItem } = {};
    constructor(item: LoadoutItem, containerDefinitionId: number) {
        super(item, item.slotId, item.loadoutItemOwnerGuid);
        this.containerDefinitionId = containerDefinitionId;
    }
}