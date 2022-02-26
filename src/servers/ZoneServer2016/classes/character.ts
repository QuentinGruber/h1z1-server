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

import { Character } from "../../ZoneServer/classes/character";
import {
  characterEquipment,
  loadoutItem,
  loadoutContainer
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
  _loadout: { [loadoutSlotId: number]: loadoutItem } = {};
  currentLoadoutSlot: number = 7;//fists
  _equipment: { [equipmentSlotId: number]: characterEquipment } = {};
  _containers: { [loadoutSlotId: number]: loadoutContainer } = {};
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
