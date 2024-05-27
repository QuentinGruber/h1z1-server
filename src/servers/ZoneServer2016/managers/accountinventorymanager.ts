// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2024 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

import { AccountItem } from "types/zoneserver";
import { BaseItem } from "../classes/baseItem";

export class AccountInventoryManager {
  constructor() {}

  async getAccountItems(loginSessionId: string): Promise<AccountItem[]> {
    return [];
  }

  async getAccountItem(
    loginSessionId: string,
    itemDefinition: number
  ): Promise<AccountItem | null> {
    return null;
  }

  async addAccountItem(loginSessionId: string, item: BaseItem) {}
  async updateAccountItem(loginSessionId: string, item: BaseItem) {}
  async removeAccountItem(loginSessionId: string, item: BaseItem) {}
}
