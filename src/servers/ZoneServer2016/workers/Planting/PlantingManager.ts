import {ZoneClient2016 as Client} from "../../classes/zoneclient";
import {FarmlandManager} from "./Manager/FarmlandManager";
import {GrowingManager} from "./Manager/GrowingManager";
import {ZoneServer2016} from "../../zoneserver";
import {Furrows, Seed, SeedType} from "./Model/DataModels";


//An object of this class will use for be a bridge between Client side and Server side.
//When client -> server, using functions in 'In' region.
//When server -> client, using functions in 'Out' region.But...Now it seems like that's not my concern, they just need to register the function for me
export class PlantingManager {
    //region Variables
    // // Base communicator
    // // ( this class not extend from GatewayServer because the GatewayServer's object maybe a global for the app,so we don't need to create a new one )
    _farmlandManager: FarmlandManager;
    _growManager: GrowingManager;
    // _onPlantingEvent: OnPlantingEvent | null;
    //endregion


    //region Data In
    // public Reclaim(client: Client, character: Character,
    //                furrowsDestWorldCoordinates: Position,
    //                surfacePlane: SurfacePlane | null,
    //                destinationType: FurrowsPlacingDestinationTypeEnum = 0) {
    public Reclaim(client: Client, server: ZoneServer2016) {
        let reclaimRet = this._farmlandManager.Reclaim(client, server);
        server.sendChatText(client, `reclaim the ground has been${reclaimRet?' succeeded':' failed'}`);
    }

    // public SwingSeed(client: Client,
    //                  hole: Hole,
    //                  seed: Seed) {

    //now it's just simple placement,auto find sight point around furrows and holes
    public SowSeed(client: Client,server:ZoneServer2016,itemId:number) {
      let sRet = false;
        let f = this._farmlandManager.SimulateGetSightPointSowAbleFurrows(client,server);
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

    //endregion

    //region Data Out

    //region Active
    //When we have new furrows or modified furrows, let the world know.Broadcast to all. Send them information packets about crops and other about planting individually
    // private sendPlantState(
    //     //who will receive this message
    //     destClient: Client,
    //     //if not something changed just query request, set null
    //     eventType: PlantingEventTypeEnum | null,
    //     //the [planting things] are all from a list of furrows, furrows carry holes and crops pile information
    //     plantingThings: Array<Furrows>
    // ) {
    //     if (!this._onPlantingEvent) {
    //         return;
    //     }
    //     //call gateway server broadcast function
    //     if (eventType) {
    //         this._onPlantingEvent(destClient, eventType, plantingThings)
    //     }
    // }

    //endregion

    //region Passive

    //The purpose of this method is to let the SceneInformationManager(if we have) get information about the planting from the PlantingManagers
    // public GetPlantingInformation: GetPlantingInformationDelegate;
    // public GetPlantingInformation = (
    //     client: Client,
    //     fields: string | [string] = '*'): Array<Furrows> | null => {
    //     if (!this._growManager || !this._farmlandManager) {
    //         return null;
    //     }
    //     //do some thing
    //     return [];
    // }
    //endregion

    //endregion

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
