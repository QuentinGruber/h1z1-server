import {ZoneClient2016 as Client} from "../../classes/zoneclient";
import {WorldCoordinatesMatrix} from './Model/TypeModel/WorldCoordinatesMatrix';
import {SurfacePlane} from "./Model/TypeModel/SurfacePlane";
import {GatewayServer} from "../../../GatewayServer/gatewayserver";
import {PlantManager} from "./Manager/PlantManager";
import {GrowManager} from "./Manager/GrowManager";

enum DestinationTypeEnum {
    Ground,
    Water,
    Basement
}

type Character = any;
//The furrows contains 2 furrow and also 4 holes in that;
type Furrows = {
    //There's 4 holes in per furrows.
    Holes:Array<Hole>,
};
type Hole = {
    CropsPile: CropsPile
};
type Seed = {};
type Fertilizer = {};
type CropsPile = {};

//An object of this class will use for be a bridge between Client side and Server side.
//When client -> server, using functions in 'In' region.


//When server -> client, using functions in 'Out' region.It's extend from the "GatewayServer" at src/servers/GatewayServer/gatewayserver.ts
export class Communicator {
    //region Variables
    // Base communicator
    // ( this class not extend from GatewayServer because the GatewayServer's object maybe a global for the app,so we don't need to create a new one )
    _gateWayServerGlobal: GatewayServer | undefined;
    _plantManager: PlantManager;
    _growManager: GrowManager;
    //endregion
    //region In
    public Reclaim(client: Client, character: Character,
                   worldCoordinates: WorldCoordinatesMatrix,
                   surfacePlane: SurfacePlane | null,
                   destinationType: DestinationTypeEnum = DestinationTypeEnum.Ground) {

    }

    public SwingSeed(client: Client,
                     character: Character,
                     hole: Hole,
                     seed: Seed) {

    }

    public FertilizeCrops(client: Client,
                          character: Character,
                          characterWorldCoordinates: WorldCoordinatesMatrix,
                          fertilizerObject: Fertilizer
    ) {

    }

    public UprootCrops(client: Client,
                       character: Character,
                       hole: Hole) {

    }

    public PickingMatureCrops(client: Client,
                              character: Character,
                              source: CropsPile | Hole) {

    }

    //endregion

    //region Out

    //region Active
    //Broadcast to all. We can send them information packets about crops and other about planting individually
    public BroadcastFurrowsState() {

    }

    //region note:maybe it's un useful because BroadcastFurrowsState can broadcast all information that include furrows&holes&crops pile status
    public BroadcastHoleState() {
    }

    public BroadcastCropsState(
                                //who will receive this message,set null in order to sent to all
                                destClients:Array<Client>|null,
                               //who will receive this message,set null in order to sent to all
                               destCharacter:Array<Character> | null,
                               //set -1 means all around the world
                               rangeRadius:number|null=-1,

) {
        if (!this._gateWayServerGlobal)
        {
            return;
        }
        //Calculate distance from crops

        //call gateway server broadcast function
    }
    public SendCropsState(
        //who will receive this message
        destClient:Client,
        //who will receive this message
        destCharacter:Character,
        //the [planting things] are all from a list of furrows, furrows carry holes and crops pile information
        plantingThings:Array<Furrows>
    ) {
        if (!this._gateWayServerGlobal)
        {
            return;
        }
        //call gateway server broadcast function
    }

    //endregion
    //endregion

    //region Passive
    //When character close to the scene which including planted things,they will receive the scene data include planted crops and furrows and holes status

    //So, let them know the things.
    //The purpose of this method is to let the SceneInformationManager(if we have) get information about the planting from the PlantingManagers
    // public GetPlantingInformation: GetPlantingInformationDelegate;
    public GetPlantingInformation = (
        client: Client,
        character: Character,
        characterWorldCoordinates: WorldCoordinatesMatrix,
        fields: string | [string] = '*'): Array<Furrows> | null => {
        if (!this._growManager || !this._plantManager) {
            return null;
        }
        let ret: Array<Furrows> = [];
        //do some thing
        return ret;
    }

    //And, We can send them information packets about crops and other about planting individually when trigger by some controller such like [CharactersManager]
    public OnCharacterCloseTo(client: Client,
                              character: Character,
                              characterWorldCoordinates: WorldCoordinatesMatrix) {
        //wow man, hey you, i am a corn crops, take away me pls! ^_^

        //Checkout planting things which can show to the character
        let things = this.GetPlantingInformation(client, character, characterWorldCoordinates, "*");
        if (things) {
            this.SendCropsState(client,character,things);
        }
        //Broadcast data to this guy who will see the scene with planting things;
    }

    //endregion

    //endregion

    //region Constructor
    constructor(
        _gateWayServerGlobal: GatewayServer,
        plantManager: PlantManager,
        growManager: GrowManager) {
        this._plantManager = plantManager;
        this._growManager = growManager;
    }

    //endregion
}