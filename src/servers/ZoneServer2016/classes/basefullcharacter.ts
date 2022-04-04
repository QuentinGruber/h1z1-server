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

import {
  characterEquipment,
  loadoutItem,
  loadoutContainer,
} from "../../../types/zoneserver";
import { BaseLightweightCharacter } from "./baselightweightcharacter";

export class BaseFullCharacter extends BaseLightweightCharacter{
  resources = {};
  _loadout: { [loadoutSlotId: number]: loadoutItem } = {};
  //currentLoadoutSlot: number = 7; //fists
  _equipment: { [equipmentSlotId: number]: characterEquipment } = {};
  _containers: { [loadoutSlotId: number]: loadoutContainer } = {};
  constructor(characterId: string, generatedTransient: number) {
    super(characterId, generatedTransient);
  }

  getActiveLoadoutSlot(itemGuid: string): number {
    // gets the loadoutSlotId of a specified itemGuid in the loadout
    for(const item of Object.values(this._loadout)) {
      if(itemGuid == item.itemGuid) {
        return item.slotId;
      }
    }
    return 0;
  }

}
