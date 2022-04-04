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

import {
  characterEquipment,
  loadoutItem,
  loadoutContainer,
} from "../../../types/zoneserver";

export class BaseCharacter {
  characterId: string;
  transientId: number;
  spawnLocation?: string;
  state: {
    position: Float32Array;
    rotation: Float32Array;
    lookAt: Float32Array;
  };
  resources = {};
  actorModelId!: number;
  _loadout: { [loadoutSlotId: number]: loadoutItem } = {};
  //currentLoadoutSlot: number = 7; //fists
  _equipment: { [equipmentSlotId: number]: characterEquipment } = {};
  _containers: { [loadoutSlotId: number]: loadoutContainer } = {};
  constructor(characterId: string, generatedTransient: number) {
    this.characterId = characterId;
    this.transientId = generatedTransient;
    this.state = {
      position: new Float32Array([0, 0, 0, 0]),
      rotation: new Float32Array([0, 0, 0, 0]),
      lookAt: new Float32Array([0, 0, 0, 0]),
    };
  }
}
