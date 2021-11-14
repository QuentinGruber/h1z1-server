import { Character } from "../../ZoneServer/classes/character";
import {
  characterEquipment,
  characterLoadout,
} from "../../../types/zoneserver";

export class Character2016 extends Character {
  resources: {
    health: number;
    stamina: number;
    virus: number;
    food: number;
    water: number;
    comfort: number;
  };
  actorModelId!: number;
  headActor!: number;
  isRespawning: boolean = false;
  gender!: number;
  creationDate!: string;
  lastLoginDate!: string;
  loadout: characterLoadout[] = [];
  equipment: characterEquipment[] = [];
  _inventory: { [itemGuid: string]: any } = {};
  startRessourceUpdater: any;
  constructor(characterId: string, generatedTransient: number) {
    super(characterId, generatedTransient);
    this.resources = {
      health: 5000,
      stamina: 50,
      food: 5000,
      water: 5000,
      virus: 6000,
      comfort: 6000,
    };
  }
}
