// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2023 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

import { ZoneClient2016 as Client } from "../../zoneclient";
import { Furrows } from "./DataModels";

export enum PlantingEventTypeEnum {
  Created,
  Modified,
  Removed,
}
export interface OnPlantingEvent {
  (
    srcClient: Client,
    eventType: PlantingEventTypeEnum,
    furrows: Array<Furrows>
  ): void;
}
