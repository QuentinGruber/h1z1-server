import {CropsPile, CropsPileStatus, Hole, Seed} from "../Model/DataModels";
import {ZoneClient2016} from "../../../classes/zoneclient";
import {ZoneServer2016} from "../../../zoneserver";
import {Euler, Vector4} from "../Model/TypeModels";
import {Euler2Quaternion} from "../Utils";
import {randomIntFromInterval} from "../../../../../utils/utils";

interface Stage {
  StageName: string,
  TimeToReach: number,
  NewModelId: number,
  Outcome?:
    {
      Name: string,
      ItemDefinitionId: number,
      ModelId: number,
      Count: number,
      LootAble: boolean
    }[],
}

interface Stages {
  [key: string]: Stage
}

interface GrowthScript {
  [key: string]: {
    PetriDish: any,
    Stages: Stages
  },
}

const growthScripts: GrowthScript =
  {
    'Corn Seed':
      {
        PetriDish: Hole,
        Stages: {
          Sapling:
            {
              StageName: 'Sapling',
              TimeToReach: 5000,
              NewModelId: 59,
            },
          Growing:
            {
              StageName: 'Growing',
              TimeToReach: 5000,
              NewModelId: 60,
            },
          Grown:
            {
              StageName: 'Grown',
              TimeToReach: 5000,
              NewModelId: 61,
              Outcome: [
                {
                  Name: 'Corn', LootAble: true, ModelId: 0, Count: 4, ItemDefinitionId: 107
                },
                {
                  Name: 'Corn Seed', ItemDefinitionId: 1417, Count: 2, ModelId: 0, LootAble: true
                },
                {
                  Name: 'Dried Corn Seeds', ItemDefinitionId: 106, Count: 1, ModelId: 0, LootAble: true
                }
              ],
            }
        }
      },
    'Wheat Seed':
      {
        PetriDish: Hole,
        Stages: {
          Sapling:
            {
              StageName: 'Sapling',
              TimeToReach: 5000,
              NewModelId: 9191,
            },
          Growing:
            {
              StageName: 'Growing',
              TimeToReach: 5000,
              NewModelId: 9190,
            },
          Grown:
            {
              StageName: 'Grown',
              TimeToReach: 10000,
              NewModelId: 9189,
              Outcome: [
                {
                  Name: 'Wheat', LootAble: true, ModelId: 0, Count: 5, ItemDefinitionId: 1438
                },
                {
                  Name: 'Wheat Seed', ItemDefinitionId: 1988, Count: 1, ModelId: 0, LootAble: true
                },
                {
                  Name: 'Dried Wheat Seeds', ItemDefinitionId: 1437, Count: 2, ModelId: 0, LootAble: true
                }
              ],
            }
        }
      }
  }

export class GrowingManager {
  constructor() {
  }

  public StartCultivating = (client: ZoneClient2016, server: ZoneServer2016, hole: Hole, seed: Seed): boolean => {
    if (hole && seed) {
      if (growthScripts[seed.Name]) {
        let script = growthScripts[seed.Name];
        let stagesKeys = Object.keys(script.Stages);
        if (!stagesKeys || stagesKeys.length < 1)
          return false;
        let firstStage = script.Stages[stagesKeys[0]];
        hole.InsideSeed = seed;
        this.placeSeedOrCrop(hole.Position, hole.Rotation, seed.Type, server);
        return this.grow2Stage(client,server, hole, seed.Name, null, firstStage);
      }
    }
    return false;
  }
  private grow2Stage = (client:ZoneClient2016, server: ZoneServer2016, hole: Hole, scriptName: string, srcStage: Stage | null, destStage: Stage): boolean => {
    if (!hole.GetInsideObject()) {
      console.log('nothing found in hole');
      return false;
    }
    setTimeout(() => {
      //sapling
      if (destStage.StageName == CropsPileStatus.Sapling.toString() && hole.InsideSeed) {
        hole.InsideCropsPile = new CropsPile(hole.InsideSeed, CropsPileStatus.Sapling);
        this.changeModel(server, hole, hole.InsideSeed.Guid, destStage.NewModelId);
        hole.InsideSeed = null;
        console.log('种子已发芽',hole.GetInsideObject());
      }
      //growing
      else if (destStage.StageName == CropsPileStatus.Growing.toString() && hole.InsideCropsPile) {
        hole.InsideCropsPile.Status = CropsPileStatus.Growing;
        this.changeModel(server, hole, hole.InsideCropsPile.Guid, destStage.NewModelId);
        console.log('种子已成长',hole.GetInsideObject())
      }
      //grown
      else if (destStage.StageName == CropsPileStatus.Grown.toString() && hole.InsideCropsPile) {
        hole.InsideCropsPile.Status = CropsPileStatus.Grown;
        if (destStage.Outcome) {
          for (let i = 0; i < destStage.Outcome.length; i++) {
            let current = destStage.Outcome[i];
            hole.InsideCropsPile.LootAbleProducts.push({
              Name: current.Name,
              ItemDefinitionId: current.ItemDefinitionId,
              Count: current.Count
            });
            this.createLootAbleCropsPiles(client,server, hole, destStage.NewModelId, current.ItemDefinitionId, current.Count);
          }
        }
        this.removeModel(server, hole.InsideCropsPile.Guid);

        console.log('种子已成熟',hole.GetInsideObject());

        //remove from hole;
        hole.InsideCropsPile.LootAbleProducts = [];
        hole.InsideCropsPile = null;
        hole.InsideSeed = null;
      }
      //not match
      else {
        console.warn('cant match dest stage', destStage);
      }
      //get next stage;
      let sts = Object.keys(growthScripts[scriptName].Stages);
      let currentIndex = sts.indexOf(destStage.StageName);
      let nextIndex = currentIndex + 1;
      if (sts.length < nextIndex + 1) {
        //no more
        console.log('没有更多状态了.no more stage,the end, now you can loot crops if correct!!');
        return;
      } else {
        let nextStage = growthScripts[scriptName].Stages[sts[nextIndex]];
        this.grow2Stage(client,server, hole, scriptName, destStage, nextStage);
      }
    }, destStage.TimeToReach);
    return true;
  }
  private changeModel = (server: ZoneServer2016, hole: Hole, srcGuid: string, newModelId: number) => {
    //remove
    server.sendDataToAllWithSpawnedTemporaryObject(
      srcGuid,
      "Character.RemovePlayer",
      {
        characterId: srcGuid,
      }
    );
    delete server._temporaryObjects[srcGuid];
    //add
    this.placeSeedOrCrop(hole.Position, hole.Rotation, newModelId, server);
  }
  private removeModel = (server: ZoneServer2016, srcGuid: string): void => {
    server.sendDataToAllWithSpawnedTemporaryObject(
      srcGuid,
      "Character.RemovePlayer",
      {
        characterId: srcGuid,
      }
    );
    delete server._temporaryObjects[srcGuid];
  }
  private createLootAbleCropsPiles = (client:ZoneClient2016,server: ZoneServer2016, hole: Hole, modelId: number, itemDefinitionId: number, count: number) => {
    let qu = Euler2Quaternion(hole.Rotation.Yaw, hole.Rotation.Pitch, hole.Rotation.Roll);
    let rotation = [qu.Z, qu.Y, qu.X, qu.W];
    let cid = server.generateGuid();
    let guid = server.generateGuid();
    let obj = {
      characterId: cid,
      guid: guid,
      transientId: server.getTransientId(cid),
      modelId: modelId,
      position: [hole.Position.Z, hole.Position.Y, hole.Position.X, hole.Position.W],
      rotation: rotation,
      color: {r: 0, g: 0, b: 255},
      scale:new Float32Array([1.5,1.5,1.5,1]),
      spawnerId: -1,
      item: server.generateItem(itemDefinitionId, count),
      npcRenderDistance: 15,
    };
      server._objects[guid] = obj;
      server.spawnObjects(client);
    // server.sendDataToAll("AddLightweightNpc", obj);
    console.log('loot able crops created:', itemDefinitionId, count);
  }

  private placeSeedOrCrop(pos: Vector4, rot: Euler, modelId: number, server: ZoneServer2016): boolean {
    let characterId = server.generateGuid();
    let guid = server.generateGuid();
    let transientId = server.getTransientId(guid);
    let seedQU = Euler2Quaternion(rot.Yaw, rot.Pitch, rot.Roll);
    //add to server dataset
    let obj = {
      characterId: characterId,
      guid: guid,
      transientId: transientId,
      modelId: modelId,
      //9191 9190 9189,59 60 61 is wheat and corn sapling growing grown status model
      position: new Float32Array([pos.Z, pos.Y + 0.05, pos.X]),
      //client calc order like below:
      //if like [z,y,x] structure,calc order is: first rot y second rot z and third rot x.
      //y=yaw z=pitch and x=roll
      // rotation: new Float32Array([0, rot.Yaw, 0]),
      rotation: new Float32Array([seedQU.Z, seedQU.Y, seedQU.X, seedQU.W]),
      dontSendFullNpcRequest: true,
      color: {},
      attachedObject: {},
    };
    server._temporaryObjects[characterId] = obj;
    server.sendDataToAll("AddLightweightNpc", obj);
    return true;
  }
}
