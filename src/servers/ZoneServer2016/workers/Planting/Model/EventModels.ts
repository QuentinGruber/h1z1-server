import {ZoneClient2016 as Client} from "../../../classes/zoneclient";
import {Furrows} from "./DataModels";

export enum PlantingEventTypeEnum
{
  Created,
  Modified,
  Removed
}
export interface OnPlantingEvent {
  (srcClient:Client,eventType:PlantingEventTypeEnum,furrows:Array<Furrows>):void
}
