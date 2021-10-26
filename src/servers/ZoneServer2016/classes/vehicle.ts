import { Vehicle } from "../../ZoneServer/classes/vehicles";

function getVehicleId(ModelId: number) {
  switch (ModelId) {
    case 7225: // offroader
      return 1;
    case 9301: // policecar
      return 3;
    case 9258: // pickup
      return 2;
    case 9588: // atv
      return 5;
    case 9374: // parachute
      return 13;
    case 9371: // spectate
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
