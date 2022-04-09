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

export class BaseEntity{
  characterId: string;
  actorModelId!: number;
  state: {
    position: Float32Array;
    rotation: Float32Array;
  };
  npcRenderDistance = 100; // default in case it doesn't get set in extending class
  constructor(
    characterId: string, 
    actorModelId: number, 
    position: Float32Array, 
    rotation: Float32Array
  ) {
    this.characterId = characterId;
    this.actorModelId = actorModelId;
    this.state = {
      position: position,
      rotation: rotation,
    };
  }
}
