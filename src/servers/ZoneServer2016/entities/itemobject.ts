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
import { BaseItem } from "../classes/baseItem";
import { BaseLightweightCharacter } from "./baselightweightcharacter";
import { ZoneClient2016 } from "../classes/zoneclient";
import { randomIntFromInterval } from "../../../utils/utils";

export class ItemObject extends BaseLightweightCharacter {
  npcRenderDistance = 25;
  spawnerId = 0;
  item: BaseItem;
  creationTime: number = 0;
  triggerExplosionShots = Math.floor(Math.random() * 3) + 2; // random number 2-4 neccesary shots
  constructor(
    characterId: string,
    transientId: number,
    actorModelId: number,
    position: Float32Array,
    rotation: Float32Array,
    server: ZoneServer2016,
    spawnerId: number,
    item: BaseItem
  ) {
    super(characterId, transientId, actorModelId, position, rotation, server);
    this.flags.noCollide = 1;
    (this.spawnerId = spawnerId), (this.item = item);
  }
  /* eslint-disable @typescript-eslint/no-unused-vars */
  OnPlayerSelect(
    server: ZoneServer2016,
    client: ZoneClient2016,
    isInstant?: boolean
    /* eslint-enable @typescript-eslint/no-unused-vars */
  ) {
    server.pickupItem(client, this.characterId);
  }

  OnInteractionString(server: ZoneServer2016, client: ZoneClient2016): void {
    server.sendData(client, "Command.InteractionString", {
      guid: this.characterId,
      stringId: StringIds.TAKE_ITEM
    });
  }

  OnProjectileHit(server: ZoneServer2016, damageInfo: DamageInfo) {
    damageInfo; // eslint
    if (
      this.item.itemDefinitionId === Items.FUEL_BIOFUEL ||
      this.item.itemDefinitionId === Items.FUEL_ETHANOL
    ) {
      this.triggerExplosionShots -= 1;
      if (
        damageInfo.weapon == Items.WEAPON_SHOTGUN ||
        damageInfo.weapon == Items.WEAPON_NAGAFENS_RAGE
      ) {
        // prevent shotguns one shotting gas cans
        const randomInt = randomIntFromInterval(0, 100);
        if (randomInt < 90) this.triggerExplosionShots += 1;
      }
      if (this.triggerExplosionShots > 0) return;
      server.deleteEntity(this.characterId, server._spawnedItems);
      delete server.worldObjectManager.spawnedLootObjects[this.spawnerId];
      server._explosives[this.characterId].detonate(
        server,
        server.getClientByCharId(damageInfo.entity)
      );
    }
  }

  destroy(server: ZoneServer2016): boolean {
    delete server.worldObjectManager.spawnedLootObjects[
      server._spawnedItems[this.characterId].spawnerId
    ];
    return server.deleteEntity(this.characterId, server._spawnedItems);
  }
}
