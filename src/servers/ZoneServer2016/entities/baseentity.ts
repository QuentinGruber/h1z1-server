// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2023 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

import { DamageInfo } from "types/zoneserver";
import { ZoneServer2016 } from "../zoneserver";
import { ZoneClient2016 } from "../classes/zoneclient";

function getRenderDistance(actorModelId: number) {
  let range: number = 0;
  switch (actorModelId) {
    case 9115: // tamper
      range = 1000;
      break;
    case 9492: // expansion
    case 9181: // shack door
    case 9180: // metal shack
    case 9192: // small shack
    case 55: // dew collector
    case 9223: // wood shack
    case 63: // wood shack door
      range = 500;
      break;
    case 9487: // ramp
      range = 450;
      break;
    case 9488: // foundation stairs
    case 49: // metal gate
    case 50: // metal wall
    case 9407: // upper metal wall
    case 51: // shelter
    case 52: // large shelter
    case 9408: // upper level shelter
    case 9411: // upper level large shelter
    case 53: // structure stairs
    case 9493: // tower
    case 9130: // foundation, lod distance is 2250, tho i dont think we need it to be that high
      range = 750;
      break;
  }
  return range ? range : undefined;
}

export class BaseEntity {
  characterId: string;
  transientId: number;
  actorModelId!: number;
  state: {
    position: Float32Array;
    rotation: Float32Array;
  };
  scale = new Float32Array([1, 1, 1, 1]);
  npcRenderDistance: number; // when undefined, use the zoneserver._charactersRenderDistance value
  interactionDistance: number;
  constructor(
    characterId: string,
    transientId: number,
    actorModelId: number,
    position: Float32Array,
    rotation: Float32Array,
    server: ZoneServer2016
  ) {
    this.characterId = characterId;
    this.transientId = transientId;
    this.actorModelId = actorModelId;
    this.state = {
      position: position,
      rotation: rotation
    };
    this.npcRenderDistance =
      getRenderDistance(actorModelId) || server.charactersRenderDistance;
    this.interactionDistance = server.interactionDistance;
    server.pushToGridCell(this);
  }

  /* eslint-disable @typescript-eslint/no-unused-vars */
  damage(server: ZoneServer2016, damageInfo: DamageInfo) {
    // default: do nothing
  }

  OnPlayerSelect(
    server: ZoneServer2016,
    client: ZoneClient2016,
    isInstant?: boolean
  ) {
    // default: do nothing
  }

  OnInteractionString(server: ZoneServer2016, client: ZoneClient2016) {
    // default: do nothing
  }

  OnProjectileHit(server: ZoneServer2016, damageInfo: DamageInfo) {
    // default: do nothing
  }

  destroy(server: ZoneServer2016): boolean {
    console.log(
      `Attempted to call destroy() on an entity an undefined destroy method! actorModelId ${this.actorModelId}`
    );
    return false;
  }
  /* eslint-enable @typescript-eslint/no-unused-vars */
}
