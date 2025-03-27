// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2025 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

import { Weapon } from "./weapon";

export class BaseItem {
  /** Id of the item - See ServerItemDefinitions.json for more information */
  itemDefinitionId: number;

  /** Id (index) of the current slot the item occupies in the hotbar */
  slotId = 0;

  /** Global universal identifier of the item */
  itemGuid: string;
  containerGuid = "0x0";

  /** Current health of the item */
  currentDurability: number;
  debugFlag: string = "unset";

  /** Returns the amount of items inside of a stack  */
  stackCount: number;

  /** Determines if the item should be treated as a weapon object */
  weapon?: Weapon;

  /** Returns true if the airdrop has passed all the checks to land safely */
  hasAirdropClearance: boolean = false;

  constructor(
    itemDefinitionId: number,
    guid: string,
    durability: number,
    stackCount: number
  ) {
    this.itemDefinitionId = itemDefinitionId;
    this.itemGuid = guid;
    this.currentDurability = durability;
    if (stackCount < 0) {
      console.error(
        `negative stackcount (${stackCount}) detected for item ${this.itemDefinitionId} debugflag ${this.debugFlag}`
      );
      this.stackCount = 0;
    } else {
      this.stackCount = stackCount;
    }
  }

  isValid(flag?: string): boolean {
    if (flag) this.debugFlag = flag;
    if (this.stackCount <= 0) {
      console.error(
        `Item is invalid! itemDefId: ${this.itemDefinitionId} stackCount: ${this.stackCount} debugFlag: ${this.debugFlag}`
      );
      return false;
    }
    return true;
  }
}
