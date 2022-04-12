import {ZoneClient2016 as Client} from "../../classes/zoneclient";
import {FarmlandManager} from "./Manager/FarmlandManager";
import {GrowingManager} from "./Manager/GrowingManager";
import {ZoneServer2016} from "../../zoneserver";
import {Furrows, Seed} from "./Model/DataModels";
export class PlantingManager {
    //region Variables
    _farmlandManager: FarmlandManager;
    _growManager: GrowingManager;
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
              sRet = this._growManager.StartCultivating(client,server,hole,new Seed(itemId, Date.now()));
              break;
            }
          }
        }
        server.sendChatText(client, `swing seed has been${sRet?' succeeded':' failed'}`);
    }

    // public FertilizeCrops(client: Client,
    //                       fertilizerObject: Fertilizer
    // public FertilizeCrops(client: Client,server:ZoneServer2016
    // ) {
    //
    // }

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
