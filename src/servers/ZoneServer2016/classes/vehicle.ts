// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2022 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

import { Vehicle } from "../../ZoneServer/classes/vehicles";
import { createPositionUpdate } from "../../../utils/utils";

function getVehicleId(ModelId: number) {
  switch (ModelId) {
    case 7225: // offroader
      return 1;
    case 9258: // pickup
      return 2;
    case 9301: // policecar
      return 3;
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
  seats: { [seatId: string]: any } = {};
  gameTime: number;
  constructor(
    worldId: number,
    characterId: string,
    transientId: number,
    modelId: number,
    position: Float32Array,
    rotation: Float32Array,
    gameTime: number
  ) {
    super(worldId, characterId, transientId, modelId, position, rotation);
    this.npcData.vehicleId = getVehicleId(modelId);
    this.isInvulnerable = 
    this.npcData.vehicleId==1337 ||
    this.npcData.vehicleId==13?true:false
    switch (this.npcData.vehicleId) {
      case 1: // offroader
      case 2: // pickup
      case 3: // policecar
        this.seats = {
          0: "",
          1: "",
          2: "",
          3: "",
          4: "",
        };
        break;
      case 5: // atv
        this.seats = {
          0: "",
          1: "",
        };
        break;
      default:
        this.seats = {
          0: "",
        };
        break;
    }
    Object.seal(this.seats); // object can't be edited, but properties can
    this.gameTime = gameTime;
    this.positionUpdate = createPositionUpdate(
      this.npcData.position,
      this.npcData.rotation,
      this.gameTime
    );
  }
  getSeatCount() {
    return Object.keys(this.seats).length;
  }
  getNextSeatId() {
    for (const seatId in this.seats) {
      if (!this.seats[seatId]) {
        return seatId;
      }
    }
    return -1;
  }
  getCharacterSeat(characterId: string) {
    for (const seatId in this.seats) {
      if (this.seats[seatId] === characterId) {
        return seatId;
      }
    }
  }

  getPassengerList(): string[] {
    let passengers: string[] = [];
    for (const seatId in this.seats) {
      if (this.seats[seatId]) {
        passengers.push(this.seats[seatId]);
      }
    }
    return passengers;
  }
}
