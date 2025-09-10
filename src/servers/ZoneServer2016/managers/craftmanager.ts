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

import { ContainerErrors, FilterIds, Items } from "../models/enums";
import { ZoneServer2016 } from "../zoneserver";
import { ZoneClient2016 as Client } from "../classes/zoneclient";
import { checkConstructionInRange } from "../../../utils/utils";
import { Recipe } from "types/zoneserver";
import { Character2016 } from "../entities/character";
import { BaseItem } from "../classes/baseItem";
import { BaseLootableEntity } from "../entities/baselootableentity";
import { ChallengeType } from "./challengemanager";
import { ItemObject } from "../entities/itemobject";

interface CraftComponentDSEntry {
  itemDefinitionId: number;
  stackCount: number;
}

type ItemDataSource = {
  item: BaseItem;
  character: BaseLootableEntity | Character2016 | ItemObject;
};
type InventoryDataSource = {
  [itemDefinitionId: number]: Array<ItemDataSource>;
};

/**
 * Retrieves the craft components data source from the client's inventory and mounted container.
 * @param client The client to get the craft components data source for.
 * @param server ZoneServer pointer.
 * @returns The craft components data source object.
 */
function getCraftComponentsDataSource(
  client: Client,
  server: ZoneServer2016
): {
  components: { [itemDefinitionId: number]: CraftComponentDSEntry };
  items: InventoryDataSource;
} {
  const components: { [itemDefinitionId: number]: CraftComponentDSEntry } = {};
  const items: InventoryDataSource = {};
  // ignoring proximity container items for now

  const addItem = (
    itemDefinitionId: number,
    count: number,
    itemDS: ItemDataSource
  ) => {
    if (!Number.isFinite(count) || count <= 0) return;
    if (components[itemDefinitionId]) {
      components[itemDefinitionId].stackCount += count;
    } else {
      components[itemDefinitionId] = { itemDefinitionId, stackCount: count };
    }
    if (items[itemDefinitionId]) {
      items[itemDefinitionId].push(itemDS);
    } else {
      items[itemDefinitionId] = [itemDS];
    }
  };

  Object.values(client.character.getInventoryAsContainer()).forEach(
    (containerItems) => {
      containerItems.forEach((item) => {
        const count = Number.isFinite(item.stackCount) ? item.stackCount : 0;
        addItem(item.itemDefinitionId, count, {
          item,
          character: client.character
        });
      });
    }
  );

  const proximityItems = server.getCraftingProximityItems(client);
  proximityItems?.forEach((item: ItemObject) => {
    const count = Number.isFinite(item.item.stackCount)
      ? item.item.stackCount
      : 0;
    addItem(item.item.itemDefinitionId, count, {
      item: item.item,
      character: item
    });
  });

  const container = client.character.mountedContainer?.getContainer();
  if (container) {
    Object.values(container.items).forEach((item) => {
      const count = Number.isFinite(item.stackCount) ? item.stackCount : 0;
      addItem(item.itemDefinitionId, count, {
        item,
        character: client.character.mountedContainer!
      });
    });
  }

  return { components, items };
}

/**
 * Checks if a workbench or weapon workbench is in range for crafting.
 * @param server The ZoneServer2016 instance.
 * @param position The client's position.
 * @param requireWorkbench Whether a regular workbench is required.
 * @param requireWeaponWorkbench Whether a weapon workbench is required.
 * @returns True if the required workbench is in range, false otherwise.
 */
function checkWorkbenchRequirements(
  server: ZoneServer2016,
  position: Float32Array,
  requireWorkbench: boolean | undefined = false,
  requireWeaponWorkbench: boolean | undefined = false
): boolean {
  if (requireWorkbench) {
    return (
      checkConstructionInRange(
        server._constructionSimple,
        position,
        3,
        Items.WORKBENCH
      ) ||
      checkConstructionInRange(
        server._worldSimpleConstruction,
        position,
        3,
        Items.WORKBENCH
      )
    );
  }
  if (requireWeaponWorkbench) {
    return (
      checkConstructionInRange(
        server._constructionSimple,
        position,
        3,
        Items.WORKBENCH_WEAPON
      ) ||
      checkConstructionInRange(
        server._worldSimpleConstruction,
        position,
        3,
        Items.WORKBENCH_WEAPON
      )
    );
  }
  return true;
}

/**
 * CraftManager handles the crafting of a recipe by a client.
 */
export class CraftManager {
  /** Iterated count of craft actions in a loop */
  private craftLoopCount: number = 0;
  private maxCraftLoopCount: number = 500;
  /** HashMap of item components that make-up the parent item,
   * uses itemDefinitionId (number) for indexing
   */
  private componentsDataSource: {
    [itemDefinitionId: number]: CraftComponentDSEntry;
  } = {};
  private readonly inventoryDataSource: InventoryDataSource;

  /**
   * Constructs a new instance of the CraftManager class.
   * @param client - The client object.
   * @param server - The server object.
   * @param recipeId - The ID of the recipe to craft.
   * @param count - The number of times to craft the recipe.
   */
  constructor(
    client: Client,
    server: ZoneServer2016,
    recipeId: number = 0,
    count: number = 0
  ) {
    const { components, items } = getCraftComponentsDataSource(client, server);
    this.componentsDataSource = components;
    this.inventoryDataSource = items;
    this.start(client, server, recipeId, count);
  }

  /**
   * Removes a craft component from the character and updates the remaining items.
   * @param server The ZoneServer2016 instance.
   * @param itemDS The item data source containing the craft component.
   * @param count The number of craft components to remove.
   * @returns A boolean indicating if the removal was successful.
   */
  async removeCraftComponent(
    server: ZoneServer2016,
    itemDS: ItemDataSource,
    count: number
  ): Promise<boolean> {
    if (itemDS.character instanceof ItemObject) {
      const spawnedItem = server._spawnedItems[itemDS.character.characterId];
      if (spawnedItem.item.stackCount > count) {
        spawnedItem.item.stackCount -= count;
        return true;
      } else {
        return server.deleteEntity(
          itemDS.character.characterId,
          server._spawnedItems
        );
      }
    } else {
      return await server.removeInventoryItem(
        itemDS.character,
        itemDS.item,
        count
      );
    }
  }

  /**
   * Generates the craft queue based on the recipe and its components.
   * @param server The ZoneServer2016 instance.
   * @param client The client performing the craft.
   * @param recipe The recipe object.
   * @param recipeCount The number of times to repeat the recipe.
   * @param recipeId The ID of the recipe being crafted.
   * @param craftCount The total number of items to craft.
   * @returns A promise resolving to a boolean indicating if the craft queue generation was successful.
   */
  async generateCraftQueue(
    server: ZoneServer2016,
    client: Client,
    recipe: Recipe,
    recipeCount: number,
    recipeId: number,
    craftCount: number
  ): Promise<boolean> {
    for (const component of recipe.components) {
      const requiredItems = component.requiredAmount * recipeCount;

      if (!this.componentsDataSource[component.itemDefinitionId]) {
        const componentRecipe =
          client.character.recipes[component.itemDefinitionId];
        if (!componentRecipe) {
          return false;
        }
        const componentBundleCount = componentRecipe.bundleCount || 1;
        const craftAmount = Math.ceil(requiredItems / componentBundleCount);

        if (
          !(await this.craftItem(
            server,
            client,
            component.itemDefinitionId,
            craftAmount
          ))
        ) {
          return false;
        }
      } else if (
        this.componentsDataSource[component.itemDefinitionId].stackCount <
        requiredItems
      ) {
        const componentRecipe =
          client.character.recipes[component.itemDefinitionId];
        if (!componentRecipe) {
          return false;
        }
        const componentBundleCount = componentRecipe.bundleCount || 1;
        let remainingItems =
          requiredItems -
          this.componentsDataSource[component.itemDefinitionId].stackCount;
        const craftAmount = Math.ceil(remainingItems / componentBundleCount);

        if (
          !(await this.craftItem(
            server,
            client,
            component.itemDefinitionId,
            craftAmount
          ))
        ) {
          return false;
        }
      }
    }

    // Add crafted item to componentsDataSource
    if (this.componentsDataSource[recipeId]) {
      this.componentsDataSource[recipeId].stackCount += craftCount;
    } else {
      this.componentsDataSource[recipeId] = {
        itemDefinitionId: recipeId,
        stackCount: craftCount
      };
    }

    return true;
  }

  /**
   * Crafts an item using the given recipe and adds it to the client's inventory.
   * @param server The ZoneServer2016 instance.
   * @param client The client performing the craft.
   * @param recipeId The ID of the recipe being crafted.
   * @param recipeCount The number of times to repeat the recipe.
   * @returns A promise resolving to a boolean indicating if the crafting process was successful.
   */
  async craftItem(
    server: ZoneServer2016,
    client: Client,
    recipeId: number,
    recipeCount: number
  ): Promise<boolean> {
    if (!recipeCount || this.craftLoopCount++ > this.maxCraftLoopCount)
      return false;

    const recipe = client.character.recipes[recipeId];
    if (!recipe) return false;

    const bundleCount = recipe.bundleCount || 1;
    const craftCount = recipeCount * bundleCount;

    // Validate workbench requirements
    switch (recipe.filterId) {
      case FilterIds.COOKING:
      case FilterIds.FURNACE:
        server.sendAlert(
          client,
          "This recipe requires a furnace, barbeque, or campfire to craft"
        );
        return false;
    }
    if (
      !checkWorkbenchRequirements(
        server,
        client.character.state.position,
        recipe.requireWorkbench,
        recipe.requireWeaponWorkbench
      )
    ) {
      server.sendAlert(
        client,
        `You must be near a ${recipe.requireWeaponWorkbench ? "weapon workbench" : "workbench"} to complete this recipe`
      );
      return false;
    }

    // Generate craft queue
    if (
      !(await this.generateCraftQueue(
        server,
        client,
        recipe,
        recipeCount,
        recipeId,
        craftCount
      ))
    ) {
      return false;
    }

    // Add crafted item and leftovers
    await server.pUtilizeHudTimer(
      client,
      server.getItemDefinition(recipeId)?.NAME_ID ?? 0,
      1000 * recipeCount,
      0
    );

    // Consume components
    for (const component of recipe.components) {
      const requiredItems = component.requiredAmount * recipeCount;
      if (
        !this.componentsDataSource[component.itemDefinitionId] ||
        this.componentsDataSource[component.itemDefinitionId].stackCount <
          requiredItems
      ) {
        server.containerError(client, ContainerErrors.NO_ITEM_IN_SLOT);
        return false;
      }

      if (!this.inventoryDataSource[component.itemDefinitionId]) {
        server.containerError(client, ContainerErrors.NO_ITEM_IN_SLOT);
        return false;
      }

      let remainingItems = requiredItems;
      for (const itemDS of this.inventoryDataSource[
        component.itemDefinitionId
      ]) {
        const availableCount = itemDS.item.stackCount || 0;
        if (availableCount <= 0) continue; // Skip items with zero count
        const consumeCount = Math.min(availableCount, remainingItems);
        if (!(await this.removeCraftComponent(server, itemDS, consumeCount))) {
          server.containerError(client, ContainerErrors.NO_ITEM_IN_SLOT);
          return false;
        }
        remainingItems -= consumeCount;
        if (remainingItems <= 0) break;
      }

      if (remainingItems > 0) {
        server.containerError(client, ContainerErrors.NO_ITEM_IN_SLOT);
        return false;
      }
    }

    client.character.lootItem(
      server,
      server.generateItem(recipeId, craftCount, true)
    );
    recipe.leftOverItems?.forEach((id: number) => {
      client.character.lootItem(server, server.generateItem(id, 1));
    });

    // Update challenges
    switch (recipeId) {
      case Items.IED:
        server.challengeManager.registerChallengeProgression(
          client,
          ChallengeType.IED,
          1
        );
        break;

      case Items.FOUNDATION:
        server.challengeManager.registerChallengeProgression(
          client,
          ChallengeType.MY_LAND,
          1
        );
        break;

      case Items.SHACK:
        server.challengeManager.registerChallengeProgression(
          client,
          ChallengeType.MY_HOME,
          1
        );
        break;
    }

    return true;
  }

  async start(
    client: Client,
    server: ZoneServer2016,
    recipeId: number,
    count: number
  ) {
    for (let i = 0; i < count; i++) {
      if (!(await this.craftItem(server, client, recipeId, 1))) return;
    }
  }
}
