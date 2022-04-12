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

import { BaseEntity } from "./baseentity";

function getHeadActor(modelId: number): string {
  switch (modelId) {
    case 9240:
      return "SurvivorMale_Head_01.adr";
    case 9474:
      return "SurvivorFemale_Head_01.adr";
    case 9510:
      return `ZombieFemale_Head_0${Math.floor(Math.random() * 2) + 1}.adr`;
    case 9634:
      return `ZombieMale_Head_0${Math.floor(Math.random() * 3) + 1}.adr`;
    default:
      return "";
  }
}

export class BaseLightweightCharacter extends BaseEntity{
  state: {
    position: Float32Array;
    rotation: Float32Array;
    lookAt: Float32Array;
  };
  flags = { a: 0, b: 0, c: 0 };
  isLightweight = true;
  positionUpdateType = 0;
  headActor = getHeadActor(this.actorModelId);
  constructor(
    characterId: string, 
    transientId: number, 
    actorModelId: number, 
    position: Float32Array, 
    rotation: Float32Array
  ) {
    super(characterId, transientId, actorModelId, position, rotation);
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
      actorModelId: this.actorModelId,
      position: this.state.position,
      rotation: this.state.rotation,
      scale: this.scale,
      positionUpdateType: this.positionUpdateType,
      isLightweight: this.isLightweight,
      flags: this.flags,
      headActor: this.headActor
    }
  }
}
