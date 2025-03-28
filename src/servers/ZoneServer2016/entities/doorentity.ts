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

import { eul2quat } from "../../../utils/utils";
import { ZoneServer2016 } from "../zoneserver";
import { BaseLightweightCharacter } from "./baselightweightcharacter";
import { ZoneClient2016 } from "../classes/zoneclient";
import { DamageInfo } from "../../../types/zoneserver";
import { AddLightweightNpc } from "types/zone2016packets";
import {
  Effects,
  ModelIds,
  PositionUpdateType,
  StringIds
} from "../models/enums";

function getDestroyedModels(actorModel: number): number[] {
  switch (actorModel) {
    case ModelIds.RESTAURANT_DOOR_1:
      return [
        ModelIds.RESTAURANT_DOOR_GLASS_BROKEN_1,
        ModelIds.RESTAURANT_DOOR_GLASS_BROKEN_2,
        ModelIds.RESTAURANT_DOOR_GLASS_BROKEN_3
      ];
    case ModelIds.BUISNESS_DOORS_GLASS:
      return [
        ModelIds.BUISNESS_DOORS_GLASS_BROKEN_1,
        ModelIds.BUISNESS_DOORS_GLASS_BROKEN_2,
        ModelIds.BUISNESS_DOORS_GLASS_BROKEN_3
      ];
    case ModelIds.CABIN_DOOR:
      return [ModelIds.CABIN_DOOR_BROKEN];
    case ModelIds.BUISNESS_DOOR_GLASS:
      return [
        ModelIds.BUISNESS_DOOR_GLASS_BROKEN_1,
        ModelIds.BUISNESS_DOOR_GLASS_BROKEN_2,
        ModelIds.BUISNESS_DOOR_GLASS_BROKEN_3
      ];
    case ModelIds.CAMPER_DOOR_1:
      return [
        ModelIds.CAMPER_DOOR_GLASS_BROKEN_1,
        ModelIds.CAMPER_DOOR_GLASS_BROKEN_2
      ];
    default:
      return [];
  }
}

function getDoorSound(actorModelId: number) {
  let openSound = Effects.SFX_Door_Wood_Open;
  let closeSound = Effects.SFX_Door_Wood_Close;
  switch (actorModelId) {
    case ModelIds.PLYWOOD_METAL_GATE:
      openSound = Effects.SFX_Gate_Placeable_Metal_Open;
      closeSound = Effects.SFX_Gate_Placeable_Metal_Close;
      break;
    case ModelIds.RESIDENTIAL_DOOR_1:
    case ModelIds.RESIDENTIAL_DOOR_2:
    case ModelIds.RESIDENTIAL_DOOR_3:
    case ModelIds.RESIDENTIAL_DOOR_4:
    case ModelIds.RESIDENTIAL_DOOR_5:
    case ModelIds.RESIDENTIAL_FRONT_DOOR_1:
    case ModelIds.RESIDENTIAL_FRONT_DOOR_2:
    case ModelIds.RESIDENTIAL_INTERIOR_DOOR:
    case ModelIds.CAMPER_DOOR_1:
    case ModelIds.CAMPER_DOOR_GLASS_BROKEN_1:
    case ModelIds.CAMPER_DOOR_GLASS_BROKEN_2:
      openSound = Effects.SFX_Door_Wood_Open;
      closeSound = Effects.SFX_Door_Wood_Close;
      break;
    case ModelIds.CHURCH_DOOR:
      openSound = Effects.SFX_Door_Wood_Church_Open;
      closeSound = Effects.SFX_Door_Wood_Church_Close;
      break;
    case ModelIds.OFFICE_DOOR:
    case ModelIds.MENS_LEFT_DOOR:
    case ModelIds.WOMENS_LEFT_DOOR:
      openSound = Effects.SFX_Door_Office_Open;
      closeSound = Effects.SFX_Door_Office_Close;
      break;
    case ModelIds.FREEZER_DOOR:
      openSound = Effects.SFX_Door_Metal_Freezer_Open;
      closeSound = Effects.SFX_Door_Metal_Freezer_Close;
      break;
    case ModelIds.INDUSTRIAL_DOOR_1:
    case ModelIds.INDUSTRIAL_DOOR_2:
    case ModelIds.PUSH_DOOR:
      openSound = Effects.SFX_Door_Metal_Industrial_Open;
      closeSound = Effects.SFX_Door_Metal_Industrial_Close;
      break;
    case ModelIds.RESTAURANT_DOOR_GLASS_BROKEN_1:
    case ModelIds.RESTAURANT_DOOR_GLASS_BROKEN_2:
    case ModelIds.RESTAURANT_DOOR_GLASS_BROKEN_3:
    case ModelIds.RESTAURANT_DOOR_1:
      openSound = Effects.SFX_Door_Wood_Restaurant_Open;
      closeSound = Effects.SFX_Door_Wood_Restaurant_Close;
      break;
    case ModelIds.BUISNESS_DOOR_GLASS:
    case ModelIds.BUISNESS_DOOR_GLASS_BROKEN_1:
    case ModelIds.BUISNESS_DOOR_GLASS_BROKEN_2:
    case ModelIds.BUISNESS_DOOR_GLASS_BROKEN_3:
      openSound = Effects.SFX_Door_Glass_Business_Open;
      closeSound = Effects.SFX_Door_Glass_Business_Close;
      break;
    default:
      break;
  }
  return { openSound, closeSound };
}

export class DoorEntity extends BaseLightweightCharacter {
  spawnerId: number;
  /** Distance (H1Z1 meters) where the DoorEntity will spawn for the player */
  npcRenderDistance = 150;
  openAngle: number;
  closedAngle: number;
  /** Default rotation for the  */
  startRot: Float32Array;
  /** Returns true while the door is the process of closing/opening */
  moving = false;
  /** Returns true if the player opens the door */
  isOpen = false;
  openSound: number;
  closeSound: number;
  /** Returns true when a window is broken  */
  destroyed: boolean = false;
  destroyedModel: number;
  destroyedModels: number[];
  constructor(
    characterId: string,
    transientId: number,
    actorModelId: number,
    position: Float32Array,
    rotation: Float32Array,
    server: ZoneServer2016,
    scale: Float32Array,
    spawnerId: number
  ) {
    super(characterId, transientId, actorModelId, position, rotation, server);
    this.positionUpdateType = PositionUpdateType.MOVABLE;
    this.flags.projectileCollision = 1;
    this.scale = new Float32Array(scale);
    this.spawnerId = spawnerId;
    this.startRot = rotation;
    this.state.rotation = new Float32Array(
      eul2quat(
        new Float32Array([rotation[0], rotation[1], rotation[2], rotation[3]])
      )
    );
    this.openAngle = this.startRot[0] + 1.575;
    this.closedAngle = this.startRot[0];
    const { openSound, closeSound } = getDoorSound(this.actorModelId);
    this.openSound = openSound;
    this.closeSound = closeSound;
    this.destroyedModels = getDestroyedModels(this.actorModelId);
    this.destroyedModel =
      this.destroyedModels[(this.destroyedModels.length * Math.random()) | 0];
    this.health = 2000;
  }

  pGetLightweight(): AddLightweightNpc {
    return {
      characterId: this.characterId,
      transientId: this.transientId,
      actorModelId: this.destroyed ? this.destroyedModel : this.actorModelId,
      position: new Float32Array(
        Array.from(this.state.position).map((pos, idx) => {
          return idx == 1 ? pos++ : pos;
        })
      ),
      rotation: this.state.rotation,
      scale: this.scale,
      positionUpdateType: this.positionUpdateType,
      profileId: this.profileId,
      isLightweight: this.isLightweight,
      flags: {
        flags1: this.flags,
        flags2: this.flags,
        flags3: this.flags
      },
      headActor: this.headActor,
      attachedObject: {}
    };
  }

  OnProjectileHit(server: ZoneServer2016, damageInfo: DamageInfo) {
    if (!this.destroyedModel || this.destroyed) return;
    this.health -= damageInfo.damage;
    if (this.health > 0) return;
    this.destroyed = true;
    server.sendDataToAllWithSpawnedEntity(
      server._doors,
      this.characterId,
      "Character.Destroyed",
      {
        characterId: this.characterId,
        destroyedModel: this.destroyedModel,
        disableWeirdPhysic: true,
        destroyedEffect2: Effects.PFX_Damage_GlassWindow_House
      }
    );
  }

  OnMeleeHit(server: ZoneServer2016, damageInfo: DamageInfo) {
    this.OnProjectileHit(server, damageInfo);
  }

  OnPlayerSelect(
    server: ZoneServer2016,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    client: ZoneClient2016,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    isInstant?: boolean
  ) {
    if (this.moving) {
      return;
    }
    this.moving = true;
    // eslint-disable-next-line
    const door = this; // for setTimeout callback
    setTimeout(function () {
      door.moving = false;
    }, 1000);
    server.sendDataToAllWithSpawnedEntity(
      server._doors,
      this.characterId,
      "PlayerUpdatePosition",
      {
        transientId: this.transientId,
        positionUpdate: {
          sequenceTime: 0,
          unknown3_int8: 0,
          position: this.state.position,
          orientation: this.isOpen ? this.closedAngle : this.openAngle
        }
      }
    );
    server.sendDataToAllWithSpawnedEntity(
      server._doors,
      this.characterId,
      "Command.PlayDialogEffect",
      {
        characterId: this.characterId,
        effectId: this.isOpen ? this.closeSound : this.openSound
      }
    );
    this.isOpen = !this.isOpen;
  }

  OnInteractionString(server: ZoneServer2016, client: ZoneClient2016) {
    server.sendData(client, "Command.InteractionString", {
      guid: this.characterId,
      stringId: StringIds.USE_DOOR
    });
  }

  destroy(server: ZoneServer2016): boolean {
    return server.deleteEntity(this.characterId, server._doors);
  }
}
