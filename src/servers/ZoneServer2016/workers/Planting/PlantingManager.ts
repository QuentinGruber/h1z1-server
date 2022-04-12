import {ZoneClient2016 as Client} from "../../classes/zoneclient";
import {FarmlandManager} from "./Manager/FarmlandManager";
import {GrowingManager} from "./Manager/GrowingManager";
import {ZoneServer2016} from "../../zoneserver";
import {Furrows, Seed} from "./Model/DataModels";
export class PlantingManager {
    //region Variables
    _farmlandManager: FarmlandManager;
    _growManager: GrowingManager;
    _perFertilizerCanUseForHolesCount: number= 4;
    //endregion


    public Reclaim(client: Client, server: ZoneServer2016) {
        let reclaimRet = this._farmlandManager.Reclaim(client, server);
        server.sendChatText(client, `reclaim the ground has been${reclaimRet?' succeeded':' failed'}`);
    }

    //now it's just simple placement,auto find sight point around furrows and holes
    public SowSeed(client: Client,server:ZoneServer2016,itemId:number) {
      let sRet = false;
        let f = this._farmlandManager.SimulateGetSightPointSowAbleFurrows(client);
        if (f)
        {
          for (const hole of f.Holes) {
            if (!hole.InsideSeed&&!hole.InsideCropsPile)
            {
                let seed = new Seed(itemId, Date.now());
              sRet = this._growManager.StartCultivating(client,server,hole,seed);
              if (sRet)
              {
                  this._farmlandManager.ReUseFurrows(f,seed.TimeToGrown);
              }
              break;
            }
          }
        }
        server.sendChatText(client, `swing seed has been${sRet?' succeeded':' failed'}`);
    }

    public FertilizeCrops(client: Client) {
        let holes = this._farmlandManager.GetSurroundingFertilizeAbleHoles(client,1);
        if (!holes.length)
        {
            console.log('No surrounding holes for fertilization');
            return;
        }
        let doneCount = 0;
        for (const hole of holes) {
            if(doneCount >= this._perFertilizerCanUseForHolesCount)
                break;
            if(this._farmlandManager.BuryFertilizerIntoHole(hole))
            {
                this._growManager.StartCultivating
                doneCount +=1;
            }
        }
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
        charactersFurrowsData : {[key: string]:Furrows[]} | null,
        // _onPlantingEvent: OnPlantingEvent | null,
    ) {
        this._farmlandManager =new FarmlandManager(charactersFurrowsData);
        this._growManager = new GrowingManager();
        // this._onPlantingEvent = _onPlantingEvent ? _onPlantingEvent : null;
    }

    //endregion
}
