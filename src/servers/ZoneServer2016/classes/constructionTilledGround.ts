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
import { Npc } from "./npc";

export class constructionTilledGround extends Npc {
  ownerCharacterId: string;
  buildingSlot?: string;
  cropSlots: { [slot: string]: Float32Array };
  growthUpdater?: any;
  constructor(
    characterId: string,
    transientId: number,
    position: Float32Array,
    rotation: Float32Array,
    ownerCharacterId: string,
    BuildingSlot?: string
  ) {
    super(characterId, transientId, 62, position, rotation);
    this.ownerCharacterId = ownerCharacterId;
    if (BuildingSlot) {
      this.buildingSlot = BuildingSlot;
    }
    this.cropSlots = {
      "01": new Float32Array([0, 0, 0, 0]),
      "02": new Float32Array([0, 0, 0, 0]),
      "03": new Float32Array([0, 0, 0, 0]),
      "04": new Float32Array([0, 0, 0, 0])
    }
  }

  sowSeed(server: ZoneServer2016, slot: string, value: Float32Array) {
    this.cropSlots[slot as keyof typeof this.cropSlots] = value;

    this.growthUpdater = setTimeout(() => {
      //TODO: Stop cycle when all crops are mature and cleanup
      for (const characterId in server._constructionCrops) {
        const cropObj = server._constructionCrops[characterId];
        for (const slot in this.cropSlots) {
          if(cropObj.parentObjectCharacterId == this.characterId && cropObj.buildingSlot == slot && !cropObj.mature) {
            const stageObj = server.getGrowthDefinition(cropObj.itemDefinitionId).STAGES[cropObj.growthStage + 1];
            if(stageObj == undefined) { 
              continue;
            }

            if(cropObj.age++ >= stageObj.AGE) {
              //TODO: Cropstage cannot be higher then length
              cropObj.growthStage++;

              if(server.getGrowthDefinition(cropObj.itemDefinitionId).STAGES[cropObj.growthStage + 1] == undefined && !cropObj.mature) {
                cropObj.mature = true;
              }

              if(cropObj.actorModelId != stageObj.MODEL_ID) {
                cropObj.actorModelId = stageObj.MODEL_ID;
                server.sendDataToAllWithSpawnedEntity(
                  server._constructionCrops,
                  cropObj.characterId,
                  "Character.ReplaceBaseModel",
                  {
                    characterId: cropObj.characterId,
                    modelId: cropObj.actorModelId,
                    effectId: 5056,
                  }
                )
              }
            }
          }
        }
      }
      
      this.growthUpdater.refresh();
    }, 1000);
  }
}
