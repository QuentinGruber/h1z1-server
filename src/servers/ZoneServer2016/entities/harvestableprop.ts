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
import { BaseLootableEntity } from "./baselootableentity";
import { ZoneServer2016 } from "../zoneserver";
import { ZoneClient2016 } from "../classes/zoneclient";

import { StringIds, Items, ModelIds, Effects } from "../models/enums";
import {
  ContainerLootSpawner,
  DamageInfo,
  LootDefinition
} from "types/zoneserver";
import { randomIntFromInterval } from "../../../utils/utils";
import { AddSimpleNpc } from "types/zone2016packets";
import { containerLootSpawnersBWC } from "../data/BWC/BWC_lootspawns";

function getModelId(actorDefinition: string): {
  modelId: number;
  nameId: number;
  lootSpawner: string;
} {
  switch (actorDefinition) {
    case "Common_Props_Harvestable_SUV_proxy.adr":
      return {
        modelId: ModelIds.Common_Props_AbandonedSUV_Harvestable,
        nameId: StringIds.WRECKED_VAN,
        lootSpawner: "Harvestable Vehicle"
      };
    case "Common_Props_Harvestable_Sedan_proxy.adr":
      return {
        modelId: ModelIds.Common_Props_AbandonedSedan_Harvestable,
        nameId: StringIds.WRECKED_SEDAN,
        lootSpawner: "Harvestable Vehicle"
      };
    case "Common_Props_Harvestable_PickupTruck_proxy.adr":
      return {
        modelId: ModelIds.Common_Props_AbandonedTruck_Harvestable,
        nameId: StringIds.WRECKED_TRUCK,
        lootSpawner: "Harvestable Truck"
      };
    default:
      console.log(`modelId not mapped to actorDefinition ${actorDefinition}`);
      return { modelId: 0, nameId: 0, lootSpawner: "" };
  }
}

export class HarvestableProp extends BaseLootableEntity {
  spawnerId: number;
  npcRenderDistance = 150;
  positionUpdateType = 0;
  containerId: number = Items.CONTAINER_STORAGE;
  lootSpawner: string = "";
  searchTime: number = 3000;
  stage: number = 0;
  constructor(
    characterId: string,
    transientId: number,
    actorModelId: number,
    position: Float32Array,
    rotation: Float32Array,
    server: ZoneServer2016,
    scale: Float32Array,
    spawnerId: number,
    renderDistance: number,
    actorDefinition: string
  ) {
    super(characterId, transientId, actorModelId, position, rotation, server);
    this.scale = new Float32Array(scale);
    this.spawnerId = spawnerId;
    this.npcRenderDistance = renderDistance;
    this.loadoutId = 5;
    const actorData = getModelId(actorDefinition);
    this.actorModelId = actorData.modelId;
    this.nameId = actorData.nameId;
    this.lootSpawner = actorData.lootSpawner;
    this.useSimpleStruct = false;
    this.isLightweight = true;
  }

  pGetSimpleNpc(): AddSimpleNpc {
    return {
      characterId: this.characterId,
      transientId: this.transientId,
      position: this.state.position,
      rotation: this.state.rotation,
      modelId: this.actorModelId,
      scale: this.scale,
      health: 100
      //terrainObjectId: this.spawnerId
    };
  }

  /* eslint-disable @typescript-eslint/no-unused-vars */
  OnPlayerSelect(
    server: ZoneServer2016,
    client: ZoneClient2016,
    isInstant?: boolean
    /* eslint-enable @typescript-eslint/no-unused-vars */
  ) {
    const weapon = client.character.getEquippedWeapon();
    if (!weapon || weapon.itemDefinitionId != Items.WEAPON_CROWBAR) return;
    if (this.stage == 2) return;
    server.utilizeHudTimer(
      client,
      StringIds.HARVEST_NO_NAME,
      this.searchTime,
      0,
      () => {
        const weapon2 = client.character.getEquippedWeapon();
        if (!weapon2 || weapon2.itemDefinitionId != Items.WEAPON_CROWBAR)
          return;
        server.damageItem(client.character, weapon2, 400);
        this.stage++;
        let effectId = 0;
        switch (this.actorModelId) {
          case ModelIds.Common_Props_AbandonedSedan_Harvestable:
          case ModelIds.Common_Props_AbandonedSedan_Harvestable_Stage01:
            switch (this.stage) {
              case 1:
                this.actorModelId =
                  ModelIds.Common_Props_AbandonedSedan_Harvestable_Stage01;
                effectId = Effects.PFX_Harvest_Abandoned_Sedan_Stage1;
                break;
              case 2:
                this.actorModelId =
                  ModelIds.Common_Props_AbandonedSedan_Harvestable_Stage02;
                effectId = Effects.PFX_Harvest_Abandoned_Sedan_Stage2;
                break;
            }
            break;
          case ModelIds.Common_Props_AbandonedSUV_Harvestable:
          case ModelIds.Common_Props_AbandonedSUV_Harvestable_Stage01:
            switch (this.stage) {
              case 1:
                this.actorModelId =
                  ModelIds.Common_Props_AbandonedSUV_Harvestable_Stage01;
                effectId = Effects.PFX_Harvest_Abandoned_SUV_Stage1;
                break;
              case 2:
                this.actorModelId =
                  ModelIds.Common_Props_AbandonedSUV_Harvestable_Stage02;
                effectId = Effects.PFX_Harvest_Abandoned_SUV_Stage2;
                break;
            }
            break;
          case ModelIds.Common_Props_AbandonedTruck_Harvestable:
          case ModelIds.Common_Props_AbandonedTruck_Harvestable_Stage01:
            switch (this.stage) {
              case 1:
                this.actorModelId =
                  ModelIds.Common_Props_AbandonedTruck_Harvestable_Stage01;
                effectId = Effects.PFX_Harvest_Abandoned_Truck_Stage1;
                break;
              case 2:
                this.actorModelId =
                  ModelIds.Common_Props_AbandonedTruck_Harvestable_Stage02;
                effectId = Effects.PFX_Harvest_Abandoned_Truck_Stage2;
                break;
            }
            break;
        }
        this.updateStage(server, effectId);
        const lootSpawner = containerLootSpawnersBWC[
          this.lootSpawner
        ] as ContainerLootSpawner;
        lootSpawner.items.forEach((lootDefinition: LootDefinition) => {
          const spawnChance = randomIntFromInterval(0, 100);
          if (spawnChance <= lootDefinition.weight) {
            const count = randomIntFromInterval(
              lootDefinition.spawnCount.min,
              lootDefinition.spawnCount.max
            );
            const item = server.generateItem(lootDefinition.item, count);
            if (!item) return;
            client.character.lootItem(server, item);
          }
        });
      }
    );
  }

  updateStage(server: ZoneServer2016, effectId: number) {
    server.sendDataToAllWithSpawnedEntity(
      server._lootableProps,
      this.characterId,
      "Character.ReplaceBaseModel",
      {
        characterId: this.characterId,
        modelId: this.actorModelId,
        effectId: effectId
      }
    );
  }

  OnInteractionString(server: ZoneServer2016, client: ZoneClient2016) {
    const weapon = client.character.getEquippedWeapon();
    if (!weapon || weapon.itemDefinitionId != Items.WEAPON_CROWBAR) {
      server.sendData(client, "Command.InteractionString", {
        guid: this.characterId,
        stringId: StringIds.YOU_NEED_A_CROWBAR_TO_HARVEST_THIS_VEHICLE_
      });
      return;
    } else if (this.stage >= 2) {
      server.sendData(client, "Command.InteractionString", {
        guid: this.characterId,
        stringId: StringIds.THERE_IS_NOTHING_TO_HARVEST
      });
      return;
    }
    server.sendData(client, "Command.InteractionString", {
      guid: this.characterId,
      stringId: StringIds.HARVEST
    });
  }

  destroy(server: ZoneServer2016): boolean {
    return server.deleteEntity(this.characterId, server._lootableProps);
  }

  OnMeleeHit(server: ZoneServer2016, damageInfo: DamageInfo) {
    switch (this.lootSpawner) {
      case "Wrecked Van":
      case "Wrecked Car":
      case "Wrecked Truck":
        break;
      default:
        return;
    }

    const client = server.getClientByCharId(damageInfo.entity);
    const weapon = client?.character.getEquippedWeapon();

    if (!client || !weapon || weapon.itemDefinitionId != Items.WEAPON_CROWBAR) {
      return;
    }

    if (randomIntFromInterval(0, 100) <= server.crowbarHitRewardChance) {
      client.character.lootItem(server, server.generateItem(Items.METAL_SCRAP));
    }

    server.damageItem(client.character, weapon, server.crowbarHitDamage);
  }
}
