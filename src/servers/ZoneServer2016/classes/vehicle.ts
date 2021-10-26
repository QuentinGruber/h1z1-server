import { Vehicle } from "../../ZoneServer/classes/vehicles";

function getVehicleId(ModelId: number) {
  switch (ModelId) {
    case 7225:
      return 1;
    case 9301:
      return 3;
    case 9258:
      return 2;
    case 9374:
      return 13;
    case 9371:
      return 1337;
    default:
      return 1;
  }
}

export class Vehicle2016 extends Vehicle {
  vehicleManager?: string;
  seats: {} = {};
  constructor(
    worldId: number,
    characterId: string,
    transientId: number,
    modelId: number,
    position: Float32Array,
    rotation: Float32Array,
    positionUpdate: any
  ) {
    super(worldId, characterId, transientId, modelId, position, rotation);
    this.npcData.vehicleId = getVehicleId(modelId);
    //this.isManaged = true;
    switch(this.npcData.vehicleId) {
      default:
        break;
    }
    this.positionUpdate = positionUpdate;
  }
}
