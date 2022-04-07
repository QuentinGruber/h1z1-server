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

export class BaseLightweightCharacter{
  characterId: string;
  transientId: number;
  actorModelId!: number;
  state: {
    position: Float32Array;
    rotation: Float32Array;
    lookAt: Float32Array;
  };
  npcRenderDistance = 100; // default in case it doesn't get set in extending class
  flags = { a: 0, b: 0, c: 0 };
  isLightweight = true;
  constructor(
    characterId: string, 
    transientId: number, 
    actorModelId: number, 
    position: Float32Array, 
    rotation: Float32Array
  ) {
    this.characterId = characterId;
    this.transientId = transientId;
    this.actorModelId = actorModelId;
    this.state = {
      position: position,
      rotation: rotation,
      lookAt: new Float32Array([0, 0, 0, 1]),
    };
  }

  pGetLightweight() {
    return {
      characterId: this.characterId,
      transientId: this.transientId,
      modelId: this.actorModelId,
      position: this.state.position,
      rotation: this.state.rotation,
      flags: this.flags,
      isLightweight: this.isLightweight
    }
  }
}
