import {CropsPile, CropsPileStatus, Hole, Seed} from "../Model/DataModels";
import {ZoneClient2016} from "../../../classes/zoneclient";
import {ZoneServer2016} from "../../../zoneserver";
import {GrowthScript, PlantingSetting, Stage} from "../Model/TypeModels";
import {Euler2Quaternion} from "../Utils";
import {ItemObject} from "../../../classes/itemobject";
import {randomIntFromInterval} from "../../../../../utils/utils";
import {inventoryItem} from "../../../../../types/zoneserver";

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
                                    Name: 'Corn', LootAble: true, ModelId: 0, MinCount: 2, MaxCount:6, ItemDefinitionId: 107
                                },
                                {
                                    Name: 'Corn Seed', ItemDefinitionId: 1987, DefiniteCount: 2, ModelId: 0, LootAble: true
                                },
                                {
                                    Name: 'Dried Corn Seeds',
                                    ItemDefinitionId: 106,
                                    MinCount: 1,
                                    MaxCount: 2,
                                    ModelId: 0,
                                    LootAble: true
                                },
                                // {
                                //     Name: 'Crown Corn',
                                //     ItemDefinitionId: 1983,
                                //     DefiniteCount: 4,
                                //     ModelId: 0,
                                //     LootAble: true
                                // }
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
                                    Name: 'Wheat', LootAble: true, ModelId: 0, MinCount: 3, MaxCount:6, ItemDefinitionId: 1438
                                },
                                {
                                    Name: 'Wheat Seed', ItemDefinitionId: 1988, DefiniteCount: 1, ModelId: 0, LootAble: true
                                },
                                {
                                    Name: 'Dried Wheat Seeds',
                                    ItemDefinitionId: 1437,
                                    MinCount: 1,
                                    MaxCount: 3,
                                    ModelId: 0,
                                    LootAble: true
                                }
                            ],
                        }
                }
            }
    }

export class GrowingManager {
    //region variables
    //key is hole guid, value is stage timer handle of seed or crops in hole
    private readonly _stageTimers: {
        [key: string]:
            { timer: NodeJS.Timeout, scriptName: string, srcStage: Stage | null, destStage: Stage }
    };
    //endregion

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
                const script = this._setting.GrowthScripts[seed.Name];
                if (!script) {
                    console.warn('cant match growth script of ', seed.Name);
                    return false;
                }
                const stagesKeys = Object.keys(script.Stages);
                if (stagesKeys.length < 1)
                    return false;
                const firstStage = script.Stages[stagesKeys[0]];
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

    public PickingMatureCrops = (hole: Hole, client: ZoneClient2016, server: ZoneServer2016) :boolean=> {
        if (hole.InsideSeed) {
            server.sendChatText(client, 'hole cleared by take out seed');
            server.deleteEntity(hole.InsideSeed.Guid, server._objects);
            return true;
        } else if (hole.InsideCropsPile) {
            if(hole.InsideCropsPile.LootAbleProducts.length)
            {
                for (const lootAbleProduct of hole.InsideCropsPile.LootAbleProducts) {
                    const randomOutcomeItemByScript = server.generateItem(lootAbleProduct.ItemDefinitionId, lootAbleProduct.Count);
                    server.lootItem(client, randomOutcomeItemByScript, lootAbleProduct.Count);
                }
                server.sendChatText(client, 'hole cleared by picking crops');
            }
            else
            {
                server.sendChatText(client, 'hole cleared by uproot');
            }
            //multi outcome items created by single guid, so only run once
            server.deleteEntity(hole.InsideCropsPile.Guid, server._objects);
            //remove from hole;
            hole.InsideCropsPile.LootAbleProducts = [];
            hole.InsideCropsPile = null;
            hole.InsideSeed = null;

            return true;
        }
        return false;
    }

    //region private
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
            const fertilizerRemaining = Date.now() - hole.LastFertilizeTime;
            //到达下一个状态在有化肥加成的情况下,需要多长时间
            const timeToReachByAcceleration = destStage.TimeToReach / this._setting.FertilizerAcceleration;
            //如果本来需要10秒,有化肥加成以后,就用5秒,化肥实际可用的时间是7秒,那就直接定10/2=5秒的定时器
            if (timeToReachByAcceleration <= fertilizerRemaining) {
                realTimeToReach = destStage.TimeToReach / this._setting.FertilizerAcceleration;
            }
            //如果本来需要10秒,有化肥的加成以后,就用5秒,化肥实际可用时间是4秒,前面的8秒时间被化肥加成所用4秒,后面的时间正常.那最后的结果是6秒
            else {
                // 这剩余的4秒可以产生8秒的效果
                const quick = fertilizerRemaining * this._setting.FertilizerAcceleration;
                // 还剩下2秒正常的
                const normal = destStage.TimeToReach - quick;
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
                server.deleteEntity(hole.InsideSeed.Guid, server._objects);
                const item = GrowingManager.placeMatureCropModel(hole,destStage.NewModelId, server);
                if(!item) return;
                hole.InsideCropsPile = new CropsPile(hole.InsideSeed, CropsPileStatus.Sapling, item.itemGuid);
                hole.InsideSeed = null;
                console.log('种子已发芽', hole.GetInsideObject());
            }
            //growing
            else if (destStage.StageName == CropsPileStatus.Growing.toString() && hole.InsideCropsPile) {
                server.deleteEntity(hole.InsideCropsPile.Guid, server._objects);
                const item = GrowingManager.placeMatureCropModel(hole,destStage.NewModelId, server);
                if(!item) return;
                const seed = hole.InsideCropsPile.EmbryoSeed;
                hole.InsideCropsPile = null;
                hole.InsideCropsPile = new CropsPile(seed, CropsPileStatus.Growing, item.itemGuid);
                console.log('种子已成长', hole.GetInsideObject())
            }
            //grown
            else if (destStage.StageName == CropsPileStatus.Grown.toString() && hole.InsideCropsPile) {
                server.deleteEntity(hole.InsideCropsPile.Guid, server._objects);
                const item = GrowingManager.placeMatureCropModel(hole,destStage.NewModelId, server);
                if(!item) return;
                const seed = hole.InsideCropsPile.EmbryoSeed;
                hole.InsideCropsPile = null;
                hole.InsideCropsPile = new CropsPile(seed, CropsPileStatus.Grown, item.itemGuid);
                if (destStage.Outcome) {
                    for (let i = 0; i < destStage.Outcome.length; i++) {
                        const current = destStage.Outcome[i];
                        hole.InsideCropsPile.LootAbleProducts.push({
                            Name: current.Name,
                            ItemDefinitionId: current.ItemDefinitionId,
                            Count: current.DefiniteCount? current.DefiniteCount :
                                ((current.MinCount && current.MaxCount)? randomIntFromInterval(current.MinCount,current.MaxCount):1)
                        });
                    }
                }

                console.log('种子已成熟', hole.GetInsideObject());
            }
            //not match
            else {
                console.warn('cant match dest stage', destStage);
            }
            //get next stage;
            const sts = Object.keys(this._setting.GrowthScripts[scriptName].Stages);
            const currentIndex = sts.indexOf(destStage.StageName);
            const nextIndex = currentIndex + 1;
            if (sts.length < nextIndex + 1) {
                //no more
                console.log('没有更多状态了.no more stage,the end, now you can loot crops if correct!!');
                return;
            } else {
                const nextStage = this._setting.GrowthScripts[scriptName].Stages[sts[nextIndex]];
                this.grow2Stage(client, server, hole, scriptName, destStage, nextStage);
            }
        }, realTimeToReach);
        this._stageTimers[guid] = {timer: timer, destStage: destStage, srcStage: srcStage, scriptName: scriptName};
        return true;
    }

    //loot able
    private static placeMatureCropModel(hole: Hole, modelId: number, server: ZoneServer2016): inventoryItem | null {
        let seedType =  hole.InsideSeed? hole.InsideSeed.Type:0;
        if(hole.InsideCropsPile && hole.InsideCropsPile.EmbryoSeed && !seedType)
        {
            seedType = hole.InsideCropsPile.EmbryoSeed.Type;
        }
        const qu = Euler2Quaternion(hole.Rotation.Yaw, hole.Rotation.Pitch, hole.Rotation.Roll);
        //set count=0, just place a loot able model, generate mature crops and seeds when picking
        const item = server.generateItem(seedType, 0);
        if (!item) {
            console.warn('server generate item failed, item definition id :', seedType);
            return null;
        }
        server._objects[item.itemGuid] = new ItemObject(
            item.itemGuid,
            server.getTransientId(item.itemGuid),
            modelId,
            hole.Position.ToFloat32ArrayZYXW(),
            qu.ToFloat32ArrayZYXW(),
            hole.CreateTime,
            item
        )
        return item;
    }
    //endregion
}
