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

import { eul2quat } from "../../../utils/utils";
import { BaseLightweightCharacter } from "./baselightweightcharacter";

export class DoorEntity extends BaseLightweightCharacter{
  flags = { a: 0, b: 127, c: 0 };
  spawnerId: number;
  npcRenderDistance = 150;
  openAngle: number;
  closedAngle: number;
  startRot: Float32Array;
  positionUpdateType = 1;
  moving = false;
  isOpen = false;
  constructor(
    characterId: string, 
    transientId: number, 
    actorModelId: number, 
    position: Float32Array, 
    rotation: Float32Array,
    scale: Float32Array,
    spawnerId: number
  ) {
    super(characterId, transientId, actorModelId, position, rotation);
    this.scale = new Float32Array(scale);
    this.spawnerId = spawnerId;
    this.startRot = rotation;
    this.state.rotation = new Float32Array(eul2quat(
      [rotation[0], rotation[1], rotation[2], rotation[3]]
    )),
    this.openAngle = this.startRot[0] + 1.575;
    this.closedAngle = this.startRot[0];
  }

}
