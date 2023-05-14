// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2023 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

import { toHex } from "../../../utils/utils";
import { ZoneServer2016 } from "../zoneserver";
import { BaseItem } from "./baseItem";
import { ZoneClient2016 } from "./zoneclient";

export class Weapon {
  itemGuid: string;
  itemDefinitionId: number;
  ammoCount: number;
  reloadTimer?: NodeJS.Timeout;
  currentReloadCount = 0; // needed for reload packet to work every time
  constructor(item: BaseItem, ammoCount?: number) {
    this.itemGuid = item.itemGuid;
    this.itemDefinitionId = item.itemDefinitionId;
    this.ammoCount = ammoCount || 0;
  }

  unload(server: ZoneServer2016, client: ZoneClient2016) {
    if (!this.ammoCount) return;
    client.character.lootItem(
      server,
      server.generateItem(
        server.getWeaponAmmoId(this.itemDefinitionId),
        this.ammoCount
      )
    );
    this.ammoCount = 0;
    const weapon = client.character.getEquippedWeapon();
    if (weapon?.itemGuid == this.itemGuid) {
      server.sendWeaponData(client, "Weapon.Reload", {
        weaponGuid: this.itemGuid,
        unknownDword1: 0,
        ammoCount: 0,
        unknownDword3: 0,
        currentReloadCount: toHex(++this.currentReloadCount)
      });
    }
  }
}
