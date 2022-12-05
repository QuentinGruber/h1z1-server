import { BaseItem } from "./baseItem";

export class LoadoutItem extends BaseItem {
    loadoutItemOwnerGuid: string;
    constructor(item: BaseItem, loadoutSlotId: number, loadoutItemOwnerGuid: string) {
        super(item.itemDefinitionId, item.itemGuid, item.currentDurability, item.stackCount);
        this.slotId = loadoutSlotId;
        this.containerGuid = "0xFFFFFFFFFFFFFFFF";
        this.stackCount = 1;
        this.weapon = item.weapon;
        this.loadoutItemOwnerGuid = loadoutItemOwnerGuid;
    }
}