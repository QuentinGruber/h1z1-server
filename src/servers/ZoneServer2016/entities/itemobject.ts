// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2026 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

import { DamageInfo } from "types/zoneserver";
import { ContainerErrors, Effects, Items, StringIds } from "../models/enums";
import { ZoneServer2016 } from "../zoneserver";
import { BaseItem } from "../classes/baseItem";
import { BaseLightweightCharacter } from "./baselightweightcharacter";
import { ZoneClient2016 } from "../classes/zoneclient";
import {
  checkLineThroughDoorway,
  randomIntFromInterval,
  rotateAroundPivot,
  wallInterceptsLine
} from "../../../utils/utils";
import {
  AddLightweightNpc,
  ClientUpdateProximateItems
} from "types/zone2016packets";
import { LoadoutContainer } from "../classes/loadoutcontainer";
import { BaseFullCharacter } from "./basefullcharacter";
import { LOADOUT_CONTAINER_GUID } from "../../../utils/constants";
import { ConstructionDoor } from "./constructiondoor";
import { ConstructionParentEntity } from "./constructionparententity";
import { ConstructionChildEntity } from "./constructionchildentity";

// TODO find a better way to handle items not inside containers
function transferItemObject(
  server: ZoneServer2016,
  sourceCharacter: ItemObject,
  targetContainer: LoadoutContainer,
  item: BaseItem,
  newSlotId: number,
  count?: number
) {
  if (!count) count = item.stackCount;
  const oldStackCount = item.stackCount, // saves stack count before it gets altered
    targetCharacter = server.getEntity(targetContainer.loadoutItemOwnerGuid);

  if (!(targetCharacter instanceof BaseFullCharacter)) {
    return;
  }

  const client =
    server.getClientByCharId(sourceCharacter.characterId) ||
    server.getClientByCharId(targetCharacter.characterId);

  if (!client) return;

  if (!targetContainer.canAcceptItems) {
    server.containerError(client, ContainerErrors.DOES_NOT_ACCEPT_ITEMS);
    return;
  }

  if (
    targetContainer.acceptedItems.length &&
    !targetContainer.acceptedItems.includes(item.itemDefinitionId)
  ) {
    server.containerError(client, ContainerErrors.UNACCEPTED_ITEM);
    return;
  }

  if (targetContainer.getMaxBulk(server) > 0) {
    const availableSpace = targetContainer.getAvailableBulk(server),
      itemBulk = server.getItemDefinition(item.itemDefinitionId)?.BULK ?? 1;
    let lootCount = Math.floor(availableSpace / itemBulk);
    if (lootCount) {
      if (lootCount > item.stackCount) {
        lootCount = item.stackCount;
      }
    } else return;

    if (count > lootCount) {
      count = lootCount;
    }
  }

  if (item.weapon) {
    clearTimeout(item.weapon.reloadTimer);
    delete item.weapon.reloadTimer;
  }

  const itemStack = targetContainer.getAvailableItemStack(
    server,
    item.itemDefinitionId,
    count
  );

  if (itemStack) {
    // add to existing item stack
    const item = targetContainer.items[itemStack];

    sourceCharacter.item.stackCount -= count;
    server.sendData<ClientUpdateProximateItems>(
      client,
      "ClientUpdate.ProximateItems",
      server.getProximityItems(client)
    );

    item.stackCount += count;
    server.updateContainerItem(targetCharacter, item, targetContainer);
  } else {
    // add item to end
    //combineItemStack(...);
    if (oldStackCount <= count) {
      // if full stack is moved
      server.addContainerItem(targetCharacter, item, targetContainer, true);
      return;
    }
    sourceCharacter.item.stackCount -= count;
    server.sendData<ClientUpdateProximateItems>(
      client,
      "ClientUpdate.ProximateItems",
      server.getProximityItems(client)
    );
    // if only partial stack is moved
    server.addContainerItem(
      targetCharacter,
      server.generateItem(item.itemDefinitionId, count),
      targetContainer,
      true
    );
  }
}

export class ItemObject extends BaseLightweightCharacter {
  npcRenderDistance = 25;
  spawnerId = 0;
  item: BaseItem;
  insideBuilding: string = "";
  isWorldItem: boolean = false;
  creationTime: number = 0;
  triggerExplosionShots = Math.floor(Math.random() * 3) + 2; // random number 2-4 neccesary shots
  shaderGroupId: number = 0;
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
    this.spawnerId = spawnerId;
    this.item = item;
    this.shaderGroupId = server.getShaderGroupId(item.itemDefinitionId);
  }
  /* eslint-disable @typescript-eslint/no-unused-vars */
  OnPlayerSelect(
    server: ZoneServer2016,
    client: ZoneClient2016,
    isInstant?: boolean
    /* eslint-enable @typescript-eslint/no-unused-vars */
  ) {
    server.pickupItem(client, this.characterId);
    // -1 spawnerId means item was dropped
    if (this.spawnerId <= -1) return;
    server.lootCrateWithChance(client, 5);
  }

  takeItem(
    server: ZoneServer2016,
    client: ZoneClient2016,
    containerGuid: string,
    count: number,
    newSlotId: number
  ) {
    if (!this.item) return;
    // client sends "0x0000000000000000" when container not specified
    if (
      containerGuid == "0x0000000000000000" ||
      containerGuid == LOADOUT_CONTAINER_GUID
    ) {
      // TODO equip items into specific loadout slots
      server.pickupItem(client, this.characterId);
      if (this.spawnerId <= -1) return;
      server.lootCrateWithChance(client, 5);
      return;
    }

    const targetContainer =
      client.character.getContainerFromGuid(containerGuid);
    if (!targetContainer) return;

    if (count < this.item.stackCount) {
      transferItemObject(
        server,
        this,
        targetContainer,
        this.item,
        newSlotId,
        count
      );
    } else {
      transferItemObject(
        server,
        this,
        targetContainer,
        this.item,
        newSlotId,
        this.item.stackCount
      );
      server.sendCompositeEffectToAllWithSpawnedEntity(
        server._spawnedItems,
        this,
        server.getItemDefinition(this.item.itemDefinitionId)?.PICKUP_EFFECT ??
          Effects.SFX_Item_PickUp_Generic
      );
      if (
        this.item.itemDefinitionId === Items.FUEL_BIOFUEL ||
        this.item.itemDefinitionId === Items.FUEL_ETHANOL
      ) {
        server.deleteEntity(this.characterId, server._explosives);
      }
      server.deleteEntity(this.characterId, server._spawnedItems);
      delete server.worldObjectManager.spawnedLootObjects[this.spawnerId];

      if (this.spawnerId <= -1) return;
      server.lootCrateWithChance(client, 5);
    }
  }

  checkBuildingObstruct(
    server: ZoneServer2016,
    character: Float32Array,
    foundation: ConstructionParentEntity | undefined
  ): boolean {
    const charPos = new Float32Array(character);

    const itemPos = this.state.position;
    charPos[1] += 1.8;

    const charInFoundation: boolean =
      foundation instanceof ConstructionParentEntity;

    if (!charInFoundation) {
      foundation =
        server._constructionFoundations[this.insideBuilding] ??
        server._constructionSimple[this.insideBuilding]?.getParent(server);
    }

    if (!foundation) return false;

    if (
      foundation.itemDefinitionId == Items.SHACK ||
      foundation.itemDefinitionId == Items.SHACK_BASIC || // TODO
      foundation.itemDefinitionId == Items.SHACK_SMALL
    ) {
      if (!foundation.isSecured) return false;

      if (charInFoundation && foundation.isInside(itemPos)) return false;

      return true;
    }

    if (
      foundation.itemDefinitionId != Items.FOUNDATION_EXPANSION &&
      foundation.itemDefinitionId != Items.FOUNDATION &&
      foundation.itemDefinitionId != Items.GROUND_TAMPER
    ) {
      return false;
    }

    if (foundation.itemDefinitionId == Items.FOUNDATION_EXPANSION)
      foundation = foundation.getParentFoundation(server);

    if (!foundation) return false;

    const allShelters = {
      ...foundation.occupiedShelterSlots,
      ...Object.assign(
        {},
        ...Object.values(foundation.occupiedExpansionSlots).map(
          (exp) => exp.occupiedShelterSlots
        )
      )
    };

    const allWalls = {
      ...foundation.occupiedWallSlots,
      ...Object.assign(
        {},
        ...Object.values(foundation.occupiedExpansionSlots).map(
          (exp) => exp.occupiedWallSlots
        )
      )
    };

    for (const w in allWalls) {
      const wall = allWalls[w];
      const wallStart = new Float32Array<ArrayBufferLike>(wall.state.position);
      let wallEnd = new Float32Array(wall.fixedPosition);

      wallEnd[0] = 2 * wallEnd[0] - wallStart[0]; // doorEnd is currently the midpoint
      wallEnd[2] = 2 * wallEnd[2] - wallStart[2]; // extend it to the end
      wallEnd[1] += 3.5;

      if (wall instanceof ConstructionDoor && wall.isOpen)
        wallEnd = rotateAroundPivot(wallStart, wallEnd, -Math.PI / 2);

      if (wallInterceptsLine(charPos, itemPos, wallStart, wallEnd)) {
        if (
          wall.itemDefinitionId == Items.METAL_DOORWAY &&
          checkLineThroughDoorway(charPos, itemPos, wall)
        )
          continue;
        else return true;
      }
    }

    for (const s in allShelters) {
      const shelter: ConstructionChildEntity = allShelters[s];

      if (!shelter.cubebounds) continue;
      const walls: [Float32Array, Float32Array][] = [
        [
          new Float32Array(shelter.cubebounds[0]),
          new Float32Array(shelter.cubebounds[5])
        ],

        [
          new Float32Array(shelter.cubebounds[1]),
          new Float32Array(shelter.cubebounds[6])
        ],

        [
          new Float32Array(shelter.cubebounds[2]),
          new Float32Array(shelter.cubebounds[7])
        ],

        [
          new Float32Array(shelter.cubebounds[3]),
          new Float32Array(shelter.cubebounds[4])
        ]
      ];

      for (const wall of walls) {
        if (wallInterceptsLine(charPos, itemPos, ...wall)) {
          return !checkLineThroughDoorway(charPos, itemPos, shelter);
        }
      }
    }

    return false;
  }

  OnInteractionString(server: ZoneServer2016, client: ZoneClient2016): void {
    server.sendData(client, "Command.InteractionString", {
      guid: this.characterId,
      stringId: StringIds.TAKE_ITEM
    });
  }

  OnProjectileHit(server: ZoneServer2016, damageInfo: DamageInfo) {
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
      server._explosives[this.characterId].detonate(damageInfo.entity);
    }
  }

  pGetLightweight(): AddLightweightNpc {
    return {
      ...super.pGetLightweight(),
      shaderGroupId: this.shaderGroupId
    };
  }

  destroy(server: ZoneServer2016): boolean {
    delete server.worldObjectManager.spawnedLootObjects[
      server._spawnedItems[this.characterId].spawnerId
    ];
    return server.deleteEntity(this.characterId, server._spawnedItems);
  }
}
