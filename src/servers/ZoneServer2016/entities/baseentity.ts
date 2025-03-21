// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2025 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

import { DamageInfo } from "types/zoneserver";
import { ZoneServer2016 } from "../zoneserver";
import { ZoneClient2016 } from "../classes/zoneclient";
import { ModelIds } from "../models/enums";

function getRenderDistance(actorModelId: number) {
  let range: number = 0;
  switch (actorModelId) {
    case ModelIds.GROUND_TAMPER:
      range = 1000;
      break;
    case ModelIds.DECK_EXPANSION:
    case ModelIds.METAL_SHACK_DOOR:
    case ModelIds.METAL_SHACK:
    case ModelIds.SMALL_SHACK:
    case ModelIds.DEW_COLLECTOR:
    case ModelIds.WOOD_SHACK:
    case ModelIds.WOOD_SHACK_DOOR:
      range = 1000;
      break;
    case ModelIds.RAMP:
      range = 450;
      break;
    case ModelIds.FOUNDATION_STAIRS:
    case ModelIds.METAL_GATE:
    case ModelIds.METAL_WALL:
    case ModelIds.UPPER_METAL_WALL:
    case ModelIds.SHELTER:
    case ModelIds.LARGE_SHELTER:
    case ModelIds.UPPER_LEVEL_SHELTER:
    case ModelIds.UPPER_LEVEL_LARGE_SHELTER:
    case ModelIds.STRUCTURE_STAIRS:
    case ModelIds.TOWER:
    case ModelIds.DECK_FOUNDATION:
      range = 1000;
      break;
  }
  return range ? range : undefined;
}

export abstract class BaseEntity {
  /** Universal Identifier, used for locating the home of an entity */
  characterId: string;

  /** Required for interactable entities, npc and interaction components packet */
  transientId: number;

  /** Id of the model that corresponds to the entity */
  actorModelId!: number;

  temporaryActorModelId?: number;

  /** State of the BaseLightweightCharacter, includes: state (Float32Array),
   * rotation(Float32Array), lookAt(Float32Array), and yaw (number) */
  state: {
    position: Float32Array;
    rotation: Float32Array;
  };

  /** Physical size of the entity based on the entity model */
  scale = new Float32Array([1, 1, 1, 1]);

  /** Distance (H1Z1 meters) where the entity will render,
   * when undefined, uses the zoneserver._charactersRenderDistance value instead
   */
  npcRenderDistance: number;

  /** Distance (H1Z1 meters) at which the player can interact with the entity */
  interactionDistance: number;

  /** Used for vehicle abilities, array of the corresponding vehicles effects */
  effectTags: number[] = [];

  /** The physical material the entity is made of - See enums.ts/MaterialTypes for more information */
  materialType: number;

  h1emu_ai_id?: bigint;
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
    this.materialType = this.getMaterialType(server, this.actorModelId);
    server.pushToGridCell(this);
  }

  getMaterialType(server: ZoneServer2016, actorModelId: number) {
    const modelData = server._modelsData[actorModelId];
    if (!modelData) {
      return 0;
    }
    return modelData.materialType;
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

  OnMeleeHit(server: ZoneServer2016, damageInfo: DamageInfo) {
    // default: do nothing
  }

  destroy(server: ZoneServer2016): boolean {
    console.log(
      `Attempted to call destroy() on an entity an undefined destroy method! actorModelId ${this.actorModelId}`
    );
    return false;
  }

  OnExplosiveHit(
    server: ZoneServer2016,
    sourceEntity: BaseEntity,
    client?: ZoneClient2016
  ) {
    // default: do nothing
  }
  /* eslint-enable @typescript-eslint/no-unused-vars */
}
