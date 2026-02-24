import { BaseEntity } from "../entities/baseentity";
import { ZoneServer2016 } from "../zoneserver";

/** Used in splitting the map into the appropriate grids based upon the image */
export class GridCell {
  position: Float32Array;
  objects: Array<BaseEntity> = [];
  width: number;
  height: number;
  availableScrap: number;
  constructor(
    server: ZoneServer2016,
    x: number,
    y: number,
    width: number,
    height: number
  ) {
    this.availableScrap = server.worldObjectManager.gridScrapLimit;
    this.position = new Float32Array([x, 0, y, 1]);
    this.width = width;
    this.height = height;
  }
}
