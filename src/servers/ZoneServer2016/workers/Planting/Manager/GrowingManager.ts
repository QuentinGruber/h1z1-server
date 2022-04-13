import {CropsPile, CropsPileStatus, Hole, Seed} from "../Model/DataModels";
import {ZoneClient2016} from "../../../classes/zoneclient";
import {ZoneServer2016} from "../../../zoneserver";
import {Euler, GrowthScript, PlantingSetting, Stage, Vector4} from "../Model/TypeModels";
import {Euler2Quaternion} from "../Utils";

const defaultTestGrowthScripts: GrowthScript =
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
                  Name: 'Corn Seed', ItemDefinitionId: 1987, Count: 2, ModelId: 0, LootAble: true
                },
                {
                  Name: 'Dried Corn Seeds',
                  ItemDefinitionId: 106,
                  Count: 1,
                  ModelId: 0,
                  LootAble: true
                },
                {
                  Name: 'Crown Corn',
                  ItemDefinitionId: 1983,
                  Count: 4,
                  ModelId: 0,
                  LootAble: true
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
                  Name: 'Dried Wheat Seeds',
                  ItemDefinitionId: 1437,
                  Count: 2,
                  ModelId: 0,
                  LootAble: true
                }
              ],
            }
        }
      }
  }

export class GrowingManager {
  //key is hole guid, value is stage timer handle of seed or crops in hole
  private readonly _stageTimers: {
    [key: string]:
      { timer: NodeJS.Timeout, scriptName: string, srcStage: Stage | null, destStage: Stage }
  };

  constructor(private _setting: PlantingSetting) {
    Object.entries(defaultTestGrowthScripts).forEach(([k, v]) => {
      if (!_setting.GrowthScripts[k])
        _setting.GrowthScripts[k] = v;
    });
    this._stageTimers = {};
  }

  public StartCultivating = (client: ZoneClient2016, server: ZoneServer2016, hole: Hole, seed: Seed): boolean => {
    if (hole && seed) {
      if (this._setting.GrowthScripts[seed.Name]) {
        let script = this._setting.GrowthScripts[seed.Name];
        if (!script) {
          console.warn('cant match growth script of ', seed.Name);
          return false;
        }
        let stagesKeys = Object.keys(script.Stages);
        if (stagesKeys.length < 1)
          return false;
        let firstStage = script.Stages[stagesKeys[0]];
        hole.InsideSeed = seed;
        return this.grow2Stage(client, server, hole, seed.Name, null, firstStage);
      }
    }
    return false;
  }

  //The arrival time of the next stage will only be confirmed according to the energy efficiency of the fertilizer. The timer will be recalculated when this func called each times.
  public AccelerateGrowth = (hole: Hole, client: ZoneClient2016, server: ZoneServer2016) => {
    if (!hole.InsideSeed && !hole.InsideCropsPile)
      return false;
    const guid = hole.Id;
    if (!guid) return false;
    if (this._stageTimers[guid]) {
      this.grow2Stage(client, server, hole, this._stageTimers[guid].scriptName, this._stageTimers[guid].srcStage, this._stageTimers[guid].destStage);
    }
  }
  private grow2Stage = (client: ZoneClient2016, server: ZoneServer2016, hole: Hole, scriptName: string, srcStage: Stage | null, destStage: Stage): boolean => {
    if (!hole.GetInsideObject()) {
      console.log('nothing found in hole');
      return false;
    }
    const guid = hole.Id;
    if (!guid) return false;
    if (this._stageTimers[guid]) {
      clearTimeout(this._stageTimers[guid].timer);
    }
    let realTimeToReach = destStage.TimeToReach;
    //calc stage reach time
    if (hole.LastFertilizeTime && hole.FertilizerDuration) {
      let fertilizerRemaining = Date.now() - hole.LastFertilizeTime;
      //到达下一个状态在有化肥加成的情况下,需要多长时间
      let timeToReachByAcceleration = destStage.TimeToReach / this._setting.FertilizerAcceleration;
      //如果本来需要10秒,有化肥加成以后,就用5秒,化肥实际可用的时间是7秒,那就直接定10/2=5秒的定时器
      if (timeToReachByAcceleration <= fertilizerRemaining) {
        realTimeToReach = destStage.TimeToReach / this._setting.FertilizerAcceleration;
      }
      //如果本来需要10秒,有化肥的加成以后,就用5秒,化肥实际可用时间是4秒,前面的8秒时间被化肥加成所用4秒,后面的时间正常.那最后的结果是6秒
      else {
        // 这剩余的4秒可以产生8秒的效果
        let quick = fertilizerRemaining * this._setting.FertilizerAcceleration;
        // 还剩下2秒正常的
        let normal = destStage.TimeToReach - quick;
        //2秒正常的加上化肥的4秒,最后就是6秒
        realTimeToReach = normal + fertilizerRemaining;
        //equal
        // realTimeToReach = destStage.TimeToReach - fertilizerRemaining* this._fertilizerAcceleration + fertilizerRemaining;
        //equal
        // realTimeToReach = destStage.TimeToReach + fertilizerRemaining * (1-this._fertilizerAcceleration);
      }
    }
    const timer = setTimeout(() => {
      //sapling
      if (destStage.StageName == CropsPileStatus.Sapling.toString() && hole.InsideSeed) {
        hole.InsideCropsPile = new CropsPile(hole.InsideSeed, CropsPileStatus.Sapling);
        this.changeModel(server, hole, hole.InsideSeed.Guid, destStage.NewModelId);
        hole.InsideSeed = null;
        console.log('种子已发芽', hole.GetInsideObject());
      }
      //growing
      else if (destStage.StageName == CropsPileStatus.Growing.toString() && hole.InsideCropsPile) {
        hole.InsideCropsPile.Status = CropsPileStatus.Growing;
        this.changeModel(server, hole, hole.InsideCropsPile.Guid, destStage.NewModelId);
        console.log('种子已成长', hole.GetInsideObject())
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
            this.createLootAbleCropsPiles(client, server, hole, destStage.NewModelId, current.ItemDefinitionId, current.Count);
          }
        }
        this.removeModel(server, hole.InsideCropsPile.Guid);

        console.log('种子已成熟', hole.GetInsideObject());

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
      let sts = Object.keys(this._setting.GrowthScripts[scriptName].Stages);
      let currentIndex = sts.indexOf(destStage.StageName);
      let nextIndex = currentIndex + 1;
      if (sts.length < nextIndex + 1) {
        //no more
        console.log('没有更多状态了.no more stage,the end, now you can loot crops if correct!!');
        return;
      } else {
        let nextStage = this._setting.GrowthScripts[scriptName].Stages[sts[nextIndex]];
        this.grow2Stage(client, server, hole, scriptName, destStage, nextStage);
      }
    }, realTimeToReach);
    this._stageTimers[guid] = {timer: timer, destStage: destStage, srcStage: srcStage, scriptName: scriptName};
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
    GrowingManager.placeCropModel(hole.Position, hole.Rotation, newModelId, server);
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
  private createLootAbleCropsPiles = (client: ZoneClient2016, server: ZoneServer2016, hole: Hole, modelId: number, itemDefinitionId: number, count: number) => {
    let qu = Euler2Quaternion(hole.Rotation.Yaw, hole.Rotation.Pitch, hole.Rotation.Roll);
    let rotation = [qu.Z, qu.Y, qu.X, qu.W];
    let cid = server.generateGuid();
    let guid = server.generateGuid();
    const obj = {
      characterId: cid,
      guid: guid,
      transientId: server.getTransientId(cid),
      modelId: modelId,
      position: [hole.Position.Z, hole.Position.Y, hole.Position.X, hole.Position.W],
      rotation: rotation,
      color: {r: 0, g: 0, b: 255},
      scale: new Float32Array([1.5, 1.5, 1.5, 1]),
      spawnerId: itemDefinitionId,
      item: server.generateItem(itemDefinitionId, count),
      npcRenderDistance: 15,
    };
    server._objects[cid] = obj;
    // server.spawnObjects(client);
    server.sendDataToAll("AddLightweightNpc", obj);
    console.log('loot able crops created:', itemDefinitionId, count);
  }

  private static placeCropModel(pos: Vector4, rot: Euler, modelId: number, server: ZoneServer2016): boolean {
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
