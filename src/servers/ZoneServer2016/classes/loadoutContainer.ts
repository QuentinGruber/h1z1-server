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

import { ZoneServer2016 } from "../zoneserver";
import { BaseItem } from "./baseItem";
import { LoadoutItem } from "./loadoutItem";

export class LoadoutContainer extends LoadoutItem {
  containerDefinitionId: number;
  items: { [itemGuid: string]: BaseItem } = {};
  constructor(item: LoadoutItem, containerDefinitionId: number) {
    super(item, item.slotId, item.loadoutItemOwnerGuid);
    this.containerDefinitionId = containerDefinitionId;
  }

  /**
   * Gets the used bulk of this container.
   * @param server The ZoneServer instance.
   * @returns Returns the amount of bulk used.
   */
  getUsedBulk(server: ZoneServer2016): number {
    let bulk = 0;
    for (const item of Object.values(this.items)) {
      bulk +=
        server.getItemDefinition(item.itemDefinitionId).BULK * item.stackCount;
    }
    return bulk;
  }

  /**
   * Gets the maximum bulk that this container can hold.
   * @param server The ZoneServer instance.
   */
  getMaxBulk(server: ZoneServer2016): number {
    return server.getContainerDefinition(this.containerDefinitionId).MAX_BULK;
  }

  /**
   * Gets the available bulk for this container.
   * @param server The ZoneServer instance.
   * @returns Returns the amount of bulk available.
   */
  getAvailableBulk(server: ZoneServer2016): number {
    return this.getMaxBulk(server) - this.getUsedBulk(server);
  }
}
