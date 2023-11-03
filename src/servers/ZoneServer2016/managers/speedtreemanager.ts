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

import { SpeedTree, ZoneSpeedTreeData } from "types/zoneserver";
import { isPosInRadius, randomIntFromInterval } from "../../../utils/utils";
import { ZoneClient2016 as Client } from "../classes/zoneclient";
import { Items, TreeIds } from "../models/enums";
import { ZoneServer2016 } from "../zoneserver";
const Z1_speedTrees = require("../../../../data/2016/zoneData/Z1_speedTrees.json");

export class SpeedTreeManager {
  _speedTrees: { [objectId: number]: SpeedTree } = {};
  _speedTreesCounter: any = {};
  _speedTreesList: { [objectId: number]: ZoneSpeedTreeData } = {};

  /* MANAGED BY CONFIGMANAGER */
  minBlackberryHarvest!: number;
  maxBlackberryHarvest!: number;
  branchHarvestChance!: number;
  minStickHarvest!: number;
  maxStickHarvest!: number;
  treeRespawnTimeMS!: number;
  minWoodLogHarvest!: number;
  maxWoodLogHarvest!: number;
  minTreeHits!: number;
  maxTreeHits!: number;

  initiateList() {
    Z1_speedTrees.forEach((tree: any) => {
      this._speedTreesList[tree.uniqueId] = {
        objectId: tree.uniqueId,
        treeId: tree.id,
        position: tree.position
      };
    });
  }

  customize(DTOArray: Array<any>) {
    for (const object in this._speedTrees) {
      const DTO = this._speedTrees[object];
      const DTOinstance = {
        objectId: DTO.objectId,
        unknownString1: DTO.modelName.concat(".Stump")
      };
      DTOArray.push(DTOinstance);
    }
  }

  use(
    server: ZoneServer2016,
    client: Client,
    objectId: number,
    treeId: number,
    name: string
  ) {
    const zoneSpeedTree = this._speedTreesList[objectId];
    if (!zoneSpeedTree || zoneSpeedTree.treeId != treeId) {
      server.sendChatText(
        client,
        `[Server] Invalid tree, please report this! ${treeId}`
      );
      return;
    }

    if (
      !isPosInRadius(3, zoneSpeedTree.position, client.character.state.position)
    ) {
      server.sendConsoleText(client, `[Server] Tree is too far.`);
      return;
    }
    const speedtreeDestroyed = this._speedTrees[objectId];
    let destroy = false;
    let count = 1;
    if (speedtreeDestroyed) return;
    let itemDefId = 0;
    switch (treeId) {
      case TreeIds.BLACKBERRY:
        server.startInteractionTimer(client, 0, 0, 9);
        itemDefId = Items.BLACKBERRY;
        if (Math.random() <= this.branchHarvestChance) {
          client.character.lootItem(
            server,
            server.generateItem(Items.WEAPON_BRANCH)
          );
        }
        destroy = true;
        count = randomIntFromInterval(
          this.minBlackberryHarvest,
          this.maxBlackberryHarvest
        );
        break;
      case TreeIds.DEVILCLUB:
      case TreeIds.VINEMAPLE:
        server.startInteractionTimer(client, 0, 0, 9);
        itemDefId = Items.WOOD_STICK;
        destroy = true;
        count = randomIntFromInterval(
          this.minStickHarvest,
          this.maxStickHarvest
        );
        break;
      case TreeIds.REDMAPLE:
      case TreeIds.WESTERNCEDAR:
      case TreeIds.GREENMAPLE:
      case TreeIds.GREENMAPLEDEAD:
      case TreeIds.WESTERNCEDARSAPLING:
      case TreeIds.SAPLINGMAPLE:
      case TreeIds.WHITEBIRCH:
      case TreeIds.REDCEDAR:
      case TreeIds.PAPERBIRCH:
      case TreeIds.OREGONOAK:
        const wep = client.character.getEquippedWeapon();
        if (!wep) return;

        switch (wep.itemDefinitionId) {
          case Items.WEAPON_HATCHET:
          case Items.WEAPON_HATCHET_MAKESHIFT:
          case Items.WEAPON_AXE_FIRE:
          case Items.WEAPON_AXE_WOOD:
          case Items.WEAPON_MACHETE01:
            break;
          default:
            server.sendAlert(client, "This tool is not sharp enough for this!");
            return;
        }

        server.damageItem(client, wep, 5);

        if (!this._speedTreesCounter[objectId]) {
          this._speedTreesCounter[objectId] = {
            hitPoints: randomIntFromInterval(
              this.minTreeHits - 1,
              this.maxTreeHits - 1
            )
          }; // add a new tree key with random level of hitpoints
        }
        if (this._speedTreesCounter[objectId].hitPoints-- == 0) {
          destroy = true;
          delete this._speedTreesCounter[objectId]; // If out of health destroy tree and delete its key
          itemDefId = Items.WOOD_LOG;
          count = randomIntFromInterval(
            this.minWoodLogHarvest,
            this.maxWoodLogHarvest
          );
        }
        break;
      default: // boulders (do nothing);
        return;
    }
    if (itemDefId) {
      client.character.lootContainerItem(
        server,
        server.generateItem(itemDefId, count)
      );
    }
    if (destroy) {
      this.destroy(server, zoneSpeedTree, name);
    }
  }

  destroy(
    server: ZoneServer2016,
    zoneSpeedTree: ZoneSpeedTreeData,
    name: string
  ) {
    server.sendDataToAll("DtoStateChange", {
      objectId: zoneSpeedTree.objectId,
      modelName: name.concat(".Stump"),
      effectId: 0,
      unk3: 0,
      unk4: true
    });

    this._speedTrees[zoneSpeedTree.objectId] = {
      objectId: zoneSpeedTree.objectId,
      modelName: name,
      position: zoneSpeedTree.position
    };
    setTimeout(() => {
      server.sendDataToAll("DtoStateChange", {
        objectId: zoneSpeedTree.objectId,
        modelName: this._speedTrees[zoneSpeedTree.objectId].modelName,
        effectId: 0,
        unk3: 0,
        unk4: true
      });
      delete this._speedTrees[zoneSpeedTree.objectId];
    }, this.treeRespawnTimeMS);
  }
}
