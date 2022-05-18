import {ZoneClient2016 as Client} from "../../classes/zoneclient";
import {FarmlandManager} from "./Manager/FarmlandManager";
import {GrowingManager} from "./Manager/GrowingManager";
import {ZoneServer2016} from "../../zoneserver";
import {Furrows, Seed, SeedType} from "./Model/DataModels";
import {PlantingSetting} from "./Model/TypeModels";
import {inventoryItem} from "../../../../types/zoneserver";

const debug = require("debug")("PlantingManager");

const defaultPlantingSetting: PlantingSetting =
    {
        PerFertilizerCanUseForHolesCount: 4,
        DefaultFurrowsDuration: 3600000*24,
        DefaultFertilizerDuration: 3600000*48,
        FertilizerAcceleration: 4,
        FertilizerActionRadius: 2,
        GrowthScripts: {}
    }

export class PlantingManager {
    //region Variables
    private _farmlandManager: FarmlandManager;
    private _growManager: GrowingManager;
    //todo: if want hot accept new settings, remove readonly prop and add trigger hot update events
    private readonly _setting: PlantingSetting;

    //endregion

    public Reclaim(client: Client, server: ZoneServer2016):boolean {
        const reclaimRet = this._farmlandManager.Reclaim(client, server);
        server.sendChatText(client, `Placement${reclaimRet ? ' succeeded' : ' failed'}`);
        return reclaimRet;
    }

    //now it's just simple placement,auto find sight point around furrows and holes
    public SowSeed(client: Client, server: ZoneServer2016, itemDefinitionId: number, itemGuid: string) {
        let sRet = false;
        const f = this._farmlandManager.SimulateGetSurroundingSowAbleFurrows(client, false);
        if (f) {
            for (const hole of f.Holes) {
                if (!hole.InsideCropsPile) {
                    const seed = new Seed(itemDefinitionId, Date.now(), itemGuid);
                    //cost seed and get placed seed guid
                    const objectInHole = this._farmlandManager.BurySeedIntoHole(hole, seed, server);
                    if(objectInHole)
                    seed.Guid = objectInHole.itemGuid;
                    else
                        return;
                    sRet = this._growManager.StartCultivating(client, server, hole, seed);
                    if (sRet) {
                        this._farmlandManager.ReUseFurrows(f, seed.TimeToGrown);
                    }
                    break;
                }
            }
        }
        server.sendChatText(client, `Sowing${sRet ? ' succeeded' : ' failed'}`);
    }

    public FertilizeCrops(client: Client, server: ZoneServer2016) {
        const holes = this._farmlandManager.GetSurroundingFertilizeAbleHoles(client, this._setting.FertilizerActionRadius);
        if (!holes.length) {
            debug('No surrounding holes for fertilization');
            server.sendChatText(client, `Fertilizer failed,No holes around`);
            return;
        }
        let doneCount = 0;
        for (const hole of holes) {
            if (doneCount >= this._setting.PerFertilizerCanUseForHolesCount)
                break;
            if (this._farmlandManager.BuryFertilizerIntoHole(hole)) {
                this._growManager.AccelerateGrowth(hole, client, server);
                doneCount += 1;
            }
        }
        //then if there's any fertilizer left over, use it to fill the hole where the fertilizer is less effective
        if (doneCount < this._setting.PerFertilizerCanUseForHolesCount) {
            //in order to ensure that each fertilizer exerts its maximum effect,order the holes
            if (holes.length > 1) {
                holes.sort((a, b) => {
                    if (a && b && a.LastFertilizeTime != undefined && b.LastFertilizeTime != undefined) {
                        return a.LastFertilizeTime - b.LastFertilizeTime;
                    }
                    return 0
                });
            }
            for (const hole of holes) {
                if (doneCount >= this._setting.PerFertilizerCanUseForHolesCount)
                    break;
                if (this._farmlandManager.ReFertilizeHole(hole)) {
                    this._growManager.AccelerateGrowth(hole, client, server);
                    doneCount += 1;
                }
            }
        }
        debug('fertilize hole(seed or crops) success, done count:' + doneCount);
        server.sendChatText(client, doneCount?`Successfully fertilized ${doneCount} holes`:`Fertilizer failed,No seed or crops around`);
    }

    public TriggerPicking = (item: inventoryItem | undefined, client: Client, server: ZoneServer2016): boolean => {
        if (!item || !SeedType[item.itemDefinitionId] || !item.itemGuid)
            return false;
        const hole = this._farmlandManager.IsSeedOrCropsInHole(item.itemGuid);
        if (hole) {
            const pickingRet = this._growManager.PickingMatureCrops(hole, client, server);
            if(pickingRet)
            {
                this._farmlandManager.MakeFertilizerUseless(hole);
            }
            return pickingRet;
        }
        return false;
    }

    //region Constructor
    constructor(
        //key is characterId, value is this character all furrows
        charactersFurrowsData: { [key: string]: Furrows[] } | null,
        setting: PlantingSetting | null = null
        // _onPlantingEvent: OnPlantingEvent | null,
    ) {
        this._setting = setting ? setting : defaultPlantingSetting;
        this._farmlandManager = new FarmlandManager(this._setting, charactersFurrowsData);
        this._growManager = new GrowingManager(this._setting);
        // this._onPlantingEvent = _onPlantingEvent ? _onPlantingEvent : null;
    }

    //endregion
}
