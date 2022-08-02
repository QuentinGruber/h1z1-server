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
import { farmingCrop } from "./farmingCrop";
import { Npc } from "./npc";

export class farmingTilledGround extends Npc {
  ownerCharacterId: string;
  buildingSlot?: string;
  cropSlots: { [slot: string]: string };
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
      "01": '',
      "02": '',
      "03": '',
      "04": ''
    }
  }

  sowSeed(server: ZoneServer2016, slot: string, characterId: string) {
    this.cropSlots[slot as keyof typeof this.cropSlots] = characterId;
    if (this.growthUpdater == undefined) {
      this.startTimer(server);
    }
  }

  startTimer(server: ZoneServer2016) {
    this.growthUpdater = setTimeout(() => {
      this.tick(server);
    }, 1000);
  }

  tick(server: ZoneServer2016) {
    const characterIds = Object.values(this.cropSlots).filter(Id => Id != '') as string[];
    let refresh = false;

    characterIds.forEach((characterId) => {
      const cropObj = server._farmingCrops[characterId] as farmingCrop;
      if(cropObj) {
        const ageDivision = (server.getFertilizerDefinition().AGE_DIVISION < 1 ? 1 : server.getFertilizerDefinition()?.AGE_DIVISION) ?? 1;
        const nextStage = server.getGrowthDefinition(cropObj.itemDefinitionId).STAGES[cropObj.growthStage + 1];
        const fullyGrown = cropObj.lastStage(server);

        if(nextStage == undefined || fullyGrown) {
          return;
        }

        if(cropObj.age++ >= (cropObj.fertilized ? nextStage.MAX_AGE / ageDivision : nextStage.MAX_AGE)) {
          if(!fullyGrown) {
            cropObj.growthStage++;
          }
          
          if (cropObj.actorModelId != nextStage.MODEL_ID) {
            cropObj.actorModelId = nextStage.MODEL_ID;
            server.sendDataToAllWithSpawnedEntity(
              server._farmingCrops,
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
        
        if(!fullyGrown) {
          refresh = true;
        }
      }
    });

    if(!refresh) {
      this.growthUpdater = undefined;
      return;
    }

    this.growthUpdater.refresh();
  }
}
