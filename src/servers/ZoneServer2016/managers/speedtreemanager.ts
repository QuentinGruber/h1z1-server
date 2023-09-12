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

import { SpeedTree } from "types/zoneserver";
import { randomIntFromInterval } from "../../../utils/utils";
import { ZoneClient2016 as Client } from "../classes/zoneclient";
import { Items } from "../models/enums";
import { ZoneServer2016 } from "../zoneserver";

export class SpeedTreeManager {
  _speedTrees: { [objectId: number]: SpeedTree } = {};
  _speedTreesCounter: any = {};

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

  use(server: ZoneServer2016, client: Client, objectId: number, name: string) {
    const speedtreeDestroyed = this._speedTrees[objectId];
    let destroy = false;
    let count = 1;
    if (speedtreeDestroyed) return;
    let itemDefId = 0;
    switch (name) {
      case "SpeedTree.Blackberry":
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
      case "SpeedTree.DevilClub":
      case "SpeedTree.VineMaple":
        itemDefId = Items.WOOD_STICK;
        destroy = true;
        count = randomIntFromInterval(
          this.minStickHarvest,
          this.maxStickHarvest
        );
        break;
      case "SpeedTree.RedMaple":
      case "SpeedTree.WesternRedCedar":
      case "SpeedTree.GreenMaple":
      case "SpeedTree.GreenMapleDead":
      case "SpeedTree.WesternCedarSapling":
      case "SpeedTree.SaplingMaple":
      case "SpeedTree.WhiteBirch":
      case "SpeedTree.RedCedar":
      case "SpeedTree.PaperBirch":
      case "SpeedTree.OregonOak":
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
      this.destroy(server, objectId, name);
    }
  }

  destroy(server: ZoneServer2016, objectId: number, name: string) {
    server.sendDataToAll("DtoStateChange", {
      objectId: objectId,
      modelName: name.concat(".Stump"),
      effectId: 0,
      unk3: 0,
      unk4: true
    });
    this._speedTrees[objectId] = {
      objectId: objectId,
      modelName: name
    };
    setTimeout(() => {
      server.sendDataToAll("DtoStateChange", {
        objectId: objectId,
        modelName: this._speedTrees[objectId].modelName,
        effectId: 0,
        unk3: 0,
        unk4: true
      });
      delete this._speedTrees[objectId];
    }, this.treeRespawnTimeMS);
  }
}
