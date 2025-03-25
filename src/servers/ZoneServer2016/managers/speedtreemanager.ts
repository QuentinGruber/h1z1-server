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

import { PropInstance, SpeedTree, ZoneSpeedTreeData } from "types/zoneserver";
import { loadJson, randomIntFromInterval } from "../../../utils/utils";
import { ZoneClient2016 as Client } from "../classes/zoneclient";
import { Items, TreeIds } from "../models/enums";
import { ZoneServer2016 } from "../zoneserver";
import { ChallengeType } from "./challengemanager";

export class SpeedTreeManager {
  /** HashMap of destroyed trees,
   * uses ObjectId (number) for indexing
   */
  _speedTreesDestroyed: { [objectId: number]: SpeedTree } = {};

  /** The amount of spawned trees in the world */
  _speedTreesCounter: any = {};

  /** HashMap of all spawned trees in the world,
   * uses ObjectId (number) for indexing
   */
  _speedTreesList: Map<number, ZoneSpeedTreeData> = new Map();

  /** MANAGED BY CONFIGMANAGER - See defaultConfig.yaml for more information */
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
    const Z1_speedTrees = loadJson(
      __dirname + "/../../../../data/2016/zoneData/Z1_speedTrees.json"
    );
    Z1_speedTrees.forEach((tree: any) => {
      this._speedTreesList.set(tree.uniqueId, {
        objectId: tree.uniqueId,
        position: tree.position
      });
    });
  }

  customize(DTOArray: Array<PropInstance>) {
    for (const object in this._speedTreesDestroyed) {
      const DTO = this._speedTreesDestroyed[object];
      const DTOinstance = {
        objectId: DTO.objectId,
        replacementModel: DTO.modelName.concat(".Stump")
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
    const speedtreeDestroyed = this._speedTreesDestroyed[objectId];
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
        server.challengeManager.registerChallengeProgression(
          client,
          ChallengeType.DAWN_ITS_TASTY,
          1
        );
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

        const durabilityDamage = server.getDurabilityDamage(
          wep.itemDefinitionId
        );
        switch (wep.itemDefinitionId) {
          case Items.WEAPON_HATCHET:
          case Items.WEAPON_HATCHET_MAKESHIFT:
          case Items.WEAPON_AXE_FIRE:
          case Items.WEAPON_AXE_WOOD:
            break;
          case Items.WEAPON_FISTS:
          case Items.WEAPON_FLASHLIGHT:
          case Items.WEAPON_BINOCULARS:
            return;
          default:
            server.sendAlert(client, "This tool is not sharp enough for this!");
            return;
        }

        server.damageItem(client.character, wep, durabilityDamage);

        if (!this._speedTreesCounter[objectId]) {
          this._speedTreesCounter[objectId] = {
            hitPoints: randomIntFromInterval(
              this.minTreeHits - 1,
              this.maxTreeHits - 1
            )
          }; // add a new tree key with random level of hitpoints
        }
        if (this._speedTreesCounter[objectId].hitPoints-- == 0) {
          server.challengeManager.registerChallengeProgression(
            client,
            ChallengeType.TREE_HATER,
            1
          );
          destroy = true;
          delete this._speedTreesCounter[objectId]; // If out of health destroy tree and delete its key
          itemDefId = Items.WOOD_LOG;
          count = randomIntFromInterval(
            this.minWoodLogHarvest,
            this.maxWoodLogHarvest
          );
          server.lootCrateWithChance(client, 2);
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

    this._speedTreesDestroyed[objectId] = {
      objectId: objectId,
      modelName: name
    };
    setTimeout(() => {
      server.sendDataToAll("DtoStateChange", {
        objectId: objectId,
        modelName: this._speedTreesDestroyed[objectId].modelName,
        effectId: 0,
        unk3: 0,
        unk4: true
      });
      delete this._speedTreesDestroyed[objectId];
    }, this.treeRespawnTimeMS);
  }
}
