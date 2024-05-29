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
import { ZoneServer2016 } from "../zoneserver";
import { Collection } from "mongodb";
import { getAppDataFolderPath } from "../../../utils/utils";
import fs from "node:fs";

export class AccountInventoryManager {
  isInSoloMode: boolean;
  // need to be initialized before using the manager in !solomode
  mongodbCollection!: Collection;
  private _soloDataPath = `${getAppDataFolderPath()}/single_player_accountitems.json`;
  constructor(zoneServer: ZoneServer2016) {
    this.isInSoloMode = zoneServer._soloMode;
  }

  init(collection: Collection) {
    this.mongodbCollection = collection;
  }

  private _getSoloAccountItems(): AccountItem[] {
    return JSON.parse(fs.readFileSync(this._soloDataPath).toString());
  }

  private _saveSoloAccountItems(items: AccountItem[]) {
    fs.writeFileSync(this._soloDataPath, JSON.stringify(items));
  }

  async getAccountItems(loginSessionId: string): Promise<AccountItem[]> {
    if (this.isInSoloMode) {
      return this._getSoloAccountItems();
    } else {
      return await this.mongodbCollection
        .find<AccountItem>({ loginSessionId })
        .toArray();
    }
  }

  async getAccountItem(
    loginSessionId: string,
    itemDefinitionId: number
  ): Promise<AccountItem | null> {
    if (this.isInSoloMode) {
      const accountItems = this._getSoloAccountItems();
      return (
        accountItems.find((v) => {
          return v.itemDefinitionId === itemDefinitionId;
        }) ?? null
      );
    } else {
      return await this.mongodbCollection.findOne<AccountItem>({
        loginSessionId,
        itemDefinitionId
      });
    }
  }

  async addAccountItem(loginSessionId: string, item: BaseItem) {
    if (this.isInSoloMode) {
      const accountItems = this._getSoloAccountItems();
      accountItems.push({ loginSessionId, ...item } as any);
      this._saveSoloAccountItems(accountItems);
    } else {
      return await this.mongodbCollection.insertOne({
        loginSessionId,
        ...item
      });
    }
  }
  async updateAccountItem(loginSessionId: string, item: BaseItem) {
    if (this.isInSoloMode) {
      const accountItems = this._getSoloAccountItems();
      for (let i = 0; i < accountItems.length; i++) {
        const originalItem = accountItems[i];
        if (originalItem.itemDefinitionId === item.itemDefinitionId) {
          accountItems[i] = { loginSessionId, ...item } as any;
        }
      }
      this._saveSoloAccountItems(accountItems);
    } else {
      return await this.mongodbCollection.updateOne(
        {
          loginSessionId,
          itemDefinitionId: item.itemDefinitionId,
          itemGuid: item.itemGuid
        },
        {
          $set: {
            ...item
          }
        }
      );
    }
  }
  async removeAccountItem(loginSessionId: string, item: BaseItem) {
    if (this.isInSoloMode) {
      const accountItems = this._getSoloAccountItems();
      for (let i = 0; i < accountItems.length; i++) {
        const originalItem = accountItems[i];
        if (originalItem.itemDefinitionId === item.itemDefinitionId) {
          accountItems.splice(i, 1);
        }
      }
      this._saveSoloAccountItems(accountItems);
    } else {
      return await this.mongodbCollection.deleteOne({
        loginSessionId,
        itemGuid: item.itemGuid
      });
    }
  }
}
