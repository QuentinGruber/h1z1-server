import { Weapon } from "./weapon";

export class BaseItem {
  itemDefinitionId: number;
  slotId = 0;
  itemGuid: string;
  containerGuid = "0x0";
  currentDurability: number;
  stackCount: number;
  weapon?: Weapon;
  constructor(
    itemDefinitionId: number,
    guid: string,
    durability: number,
    stackCount: number
  ) {
    this.itemDefinitionId = itemDefinitionId;
    this.itemGuid = guid;
    this.currentDurability = durability;
    this.stackCount = stackCount;
  }
}
