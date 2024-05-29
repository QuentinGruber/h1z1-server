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
import test, { after } from "node:test";
import { ZoneServer2016 } from "../zoneserver";
import assert from "node:assert";
import { ConstructionParentEntity } from "../entities/constructionparententity";
import { generate_random_guid } from "h1emu-core";
import { Items } from "../models/enums";

test(
  "AccountIventoriesManager",
  { timeout: 10000, concurrency: false },
  async (t) => {
    const zone = new ZoneServer2016(0);
    await zone.start();
    const accountInventoriesManager = zone.accountInventoriesManager;
    const rndId = generate_random_guid();
    const originalStackCount = 11;
    const item = zone.generateAccountItem(
      Items.REWARD_CRATE_WASTELAND,
      originalStackCount
    );
    assert.strictEqual(item?.stackCount, originalStackCount, "wtf");
    assert(item, "Item creation failed");
    await t.test("AddAccountItem", async () => {
      await accountInventoriesManager.addAccountItem(rndId, item);
      const savedItem = await accountInventoriesManager.getAccountItem(
        rndId,
        item.itemDefinitionId
      );
      assert.strictEqual(
        item.itemDefinitionId,
        savedItem?.itemDefinitionId,
        "Item def doesn't match"
      );
      assert.strictEqual(
        savedItem?.stackCount,
        originalStackCount,
        "Stack count doesn't match"
      );
      // Since we pick the first itemDefinitionId that match this test will mostly fail
      // assert.strictEqual(item.itemGuid, savedItem?.itemGuid);
    });
    await t.test("UpdateAccountItem", async () => {
      let savedItem;
      savedItem = await accountInventoriesManager.getAccountItem(
        rndId,
        item.itemDefinitionId
      );
      assert.strictEqual(
        savedItem?.stackCount,
        originalStackCount,
        "Stack count doesn't match"
      );
      const newStackCount = 2;
      item.stackCount = newStackCount;
      await accountInventoriesManager.updateAccountItem(rndId, item);

      savedItem = await accountInventoriesManager.getAccountItem(
        rndId,
        item.itemDefinitionId
      );
      assert.strictEqual(
        savedItem?.stackCount,
        newStackCount,
        "Stack count doesn't match after update"
      );
    });
    await t.test("GetAccountItems", async () => {
      let savedItems = await accountInventoriesManager.getAccountItems(rndId);
      assert.strictEqual(
        savedItems?.length,
        1,
        "Account inventory size doesn't match"
      );
    });
    await t.test("RemoveAccountItem", async () => {
      let savedItemsLen = (
        await accountInventoriesManager.getAccountItems(rndId)
      ).length;
      await accountInventoriesManager.removeAccountItem(rndId, item);
      let savedItemsLenAfterDelete = (
        await accountInventoriesManager.getAccountItems(rndId)
      ).length;
      assert.strictEqual(
        savedItemsLen - 1,
        savedItemsLenAfterDelete,
        "Item isn't removed"
      );
      const savedItem = await accountInventoriesManager.getAccountItem(
        rndId,
        item.itemDefinitionId
      );
      assert.strictEqual(savedItem, null, "Item isn't removed");
    });
  }
);

after(() => {
  setImmediate(() => {
    process.exit(0);
  });
});
