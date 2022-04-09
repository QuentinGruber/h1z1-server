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

import { BaseFullCharacter } from "./basefullcharacter";

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

export class Npc extends BaseFullCharacter{
  npcRenderDistance = 80;
  spawnerId: number;
  headActor = getHeadActor(this.actorModelId);
  constructor(
    characterId: string, 
    transientId: number, 
    actorModelId: number, 
    position: Float32Array, 
    rotation: Float32Array,
    spawnerId: number = 0
  ) {
    super(characterId, transientId, actorModelId, position, rotation);
    this.spawnerId = spawnerId;
  }
  pGetLightweight() {
    return {
      ...super.pGetLightweight(),
      headActor: this.headActor
    }
  }
}
