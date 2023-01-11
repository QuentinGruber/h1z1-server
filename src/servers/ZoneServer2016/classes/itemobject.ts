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

import { DamageInfo } from "types/zoneserver";
import { Items, StringIds } from "../models/enums";
import { ZoneServer2016 } from "../zoneserver";
import { BaseItem } from "./baseItem";
import { BaseLightweightCharacter } from "./baselightweightcharacter";
import { ZoneClient2016 } from "./zoneclient";

export class ItemObject extends BaseLightweightCharacter {
  npcRenderDistance = 25;
  spawnerId = 0;
  item: BaseItem;
  flags = {
    bit0: 0,
    bit1: 0,
    bit2: 0,
    bit3: 0,
    bit4: 0,
    bit5: 0,
    bit6: 0,
    bit7: 0,
    bit8: 0,
    bit9: 0,
    bit10: 0,
    bit11: 0,
    projectileCollision: 0,
    bit13: 0,
    bit14: 0,
    bit15: 0,
    bit16: 0,
    bit17: 0,
    bit18: 0,
    bit19: 0,
    noCollide: 1,
    knockedOut: 0,
    bit22: 0,
    bit23: 0,
  };
  creationTime: number = 0;
  constructor(
    characterId: string,
    transientId: number,
    actorModelId: number,
    position: Float32Array,
    rotation: Float32Array,
    spawnerId: number,
    item: BaseItem
  ) {
    super(characterId, transientId, actorModelId, position, rotation);
    (this.spawnerId = spawnerId), (this.item = item);
  }

  OnPlayerSelect(server: ZoneServer2016, client: ZoneClient2016) {
    server.pickupItem(client, this.characterId);
  }

  OnInteractionString(server: ZoneServer2016, client: ZoneClient2016): void {
    server.sendData(client, "Command.InteractionString", {
      guid: this.characterId,
      stringId: StringIds.TAKE_ITEM,
    });
  }

  OnProjectileHit(server: ZoneServer2016, damageInfo: DamageInfo) {
    damageInfo; // eslint
    if (
      this.item.itemDefinitionId === Items.FUEL_BIOFUEL ||
      this.item.itemDefinitionId === Items.FUEL_ETHANOL
    ) {
      server.deleteEntity(this.characterId, server._spawnedItems);
      delete server.worldObjectManager._spawnedLootObjects[this.spawnerId];
      server._explosives[this.characterId].detonate(server);
    }
  }
}
