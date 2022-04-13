import {ZoneClient2016 as Client} from "../../classes/zoneclient";
import {FarmlandManager} from "./Manager/FarmlandManager";
import {GrowingManager} from "./Manager/GrowingManager";
import {ZoneServer2016} from "../../zoneserver";
import {Furrows, Seed} from "./Model/DataModels";
import {PlantingSetting} from "./Model/TypeModels";
import {inventoryItem} from "../../../../types/zoneserver";
import {generateRandomGuid} from "../../../../utils/utils";

const defaultPlantingSetting: PlantingSetting =
    {
        PerFertilizerCanUseForHolesCount: 4,
        DefaultFurrowsDuration: 3600000,
        DefaultFertilizerDuration: 10800000,
        FertilizerAcceleration: 2,
        GrowthScripts:{}
    }

export class PlantingManager {
    //region Variables
    private _farmlandManager: FarmlandManager;
    private _growManager: GrowingManager;
    //todo: if want hot accept new settings, remove readonly prop and add trigger hot update events
    private readonly _setting: PlantingSetting;

    //endregion

    public Reclaim(client: Client, server: ZoneServer2016) {
        let reclaimRet = this._farmlandManager.Reclaim(client, server);
        server.sendChatText(client, `reclaim the ground has been${reclaimRet ? ' succeeded' : ' failed'}`);
    }
    test(server:ZoneServer2016,client:Client)
    {
        let rotation = [0,0,0,0];
        const cid = generateRandomGuid();
        const guid = generateRandomGuid();
        const obj = {
            characterId: cid,
            guid: guid,
            transientId: server.getTransientId(cid),
            modelId: 61,
            position: Array.from(client.character.state.position),
            rotation: rotation,
            color: {r: 0, g: 0, b: 255},
            scale: new Float32Array([1.5, 1.5, 1.5, 1]),
            spawnerId: 107||0,
            item: server.generateItem(107, 4),
            npcRenderDistance: 25,
        };
        server._objects[cid] = obj;
        // server.spawnObjects(client);
        server.sendDataToAll("AddLightweightNpc", obj);
        if (107) server.worldObjectManager._spawnedObjects[107] = cid;
        // console.log('loot able crops created:', itemDefinitionId, count);
    }
    createLootEntity(
        // todo: clean this up
        server: ZoneServer2016,
        item: inventoryItem | undefined,
        modelId:number,
        position: Array<number>,
        rotation: Array<number>,
        renderDistance: number,
        itemSpawnerId: number = -1
    ): void {
        const guid = generateRandomGuid(),
            characterId = generateRandomGuid();
        server._objects[characterId] = {
            characterId: characterId,
            guid: guid,
            transientId: server.getTransientId(characterId),
            modelId: modelId,
            position: position,
            rotation: rotation,
            scale:[2,2,2,2],
            color: { r: 0, g: 0, b: 255 },
            spawnerId: itemSpawnerId || 0,
            item: item,
            npcRenderDistance: renderDistance,
        };
        server.sendDataToAll("AddLightweightNpc", server._objects[characterId]);
        if (itemSpawnerId) server.worldObjectManager._spawnedObjects[itemSpawnerId] = characterId;
    }

    //now it's just simple placement,auto find sight point around furrows and holes
    public SowSeed(client: Client, server: ZoneServer2016, itemId: number) {
        let sRet = false;
        let f = this._farmlandManager.SimulateGetSightPointSowAbleFurrows(client);
        if (f) {
            for (const hole of f.Holes) {
                if (!hole.InsideSeed && !hole.InsideCropsPile) {
                    let seed = new Seed(itemId, Date.now());
                    sRet = this._growManager.StartCultivating(client, server, hole, seed);
                    if (sRet) {
                        this._farmlandManager.ReUseFurrows(f, seed.TimeToGrown);
                    }
                    break;
                }
            }
        }
        server.sendChatText(client, `swing seed has been${sRet ? ' succeeded' : ' failed'}`);
    }

    public FertilizeCrops(client: Client, server: ZoneServer2016) {
        let holes = this._farmlandManager.GetSurroundingFertilizeAbleHoles(client, 1);
        if (!holes.length) {
            console.log('No surrounding holes for fertilization');
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
        console.log('fertilize hole(seed or crops) success, done count:', doneCount);
    }

    // public UprootCrops(client: Client,
    //                    hole: Hole) {
    //
    // }
    //
    // public PickingMatureCrops(client: Client,
    //                           source: CropsPile | Hole) {
    //
    // }

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
