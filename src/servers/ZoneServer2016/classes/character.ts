// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (c) 2020 - 2021 Quentin Gruber
//   copyright (c) 2021 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

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
  headActor!: string;
  hairModel!: string;
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
