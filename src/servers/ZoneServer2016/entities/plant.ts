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

import { ZoneServer2016 } from "../zoneserver";
import { ItemObject } from "./itemobject";
import { BaseItem } from "../classes/baseItem";
import { ZoneClient2016 } from "../classes/zoneclient";
import { PlantingDiameter } from "./plantingdiameter";

import {
  ConstructionPermissionIds,
  Effects,
  Items,
  ModelIds,
  StringIds
} from "../models/enums";
import { CharacterPlayWorldCompositeEffect } from "types/zone2016packets";

export class Plant extends ItemObject {
  /** Current state the crop is in */
  growState: number = 0;

  /** Next time (milliseconds) that the crop will enter the next state */
  nextStateTime: number;

  /** Time (milliseconds) it takes for a crop to enter the next state - Default: 8hrs */
  readonly growTime = 28800000;

  /** CharacterId of the PlantingDiamater the crop is occupying */
  parentObjectCharacterId: string;

  /** Current slot on a PlantingDiameter (4 slots in total) */
  slot: string;

  /** Returns true when a player uses fertilizer near the crop */
  isFertilized: boolean = false;
  isLightweight = false;

  /** Distance (H1Z1 meters) where the crop will render */
  npcRenderDistance = 30;

  constructor(
    characterId: string,
    transientId: number,
    actorModelId: number,
    position: Float32Array,
    rotation: Float32Array,
    server: ZoneServer2016,
    spawnerId: number,
    item: BaseItem,
    parentObjectCharacterId: string,
    slot: string
  ) {
    super(
      characterId,
      transientId,
      actorModelId,
      position,
      rotation,
      server,
      spawnerId,
      item
    );
    this.parentObjectCharacterId = parentObjectCharacterId;
    this.slot = slot;
    this.nextStateTime = new Date().getTime() + this.growTime;
    if (!server._temporaryObjects[parentObjectCharacterId]) return;
    const parent = server._temporaryObjects[
      parentObjectCharacterId
    ] as PlantingDiameter;
    if (parent.isFertilized) this.isFertilized = true;
    if (this.item.itemDefinitionId == Items.SEED_CORN) {
      this.nameId = StringIds.CORN;
    } else this.nameId = StringIds.WHEAT;
  }

  grow(server: ZoneServer2016) {
    if (this.growState == 3) return;
    this.growState++;
    switch (this.item.itemDefinitionId) {
      case Items.SEED_CORN:
        switch (this.growState) {
          case 1:
            this.actorModelId = ModelIds.CORN_CROPSTATE_1;
            break;
          case 2:
            this.actorModelId = ModelIds.CORN_CROPSTATE_2;
            break;
          case 3:
            this.actorModelId = ModelIds.CORN_CROPSTATE_3;
            break;
        }
        break;
      case Items.SEED_WHEAT:
        switch (this.growState) {
          case 1:
            this.actorModelId = ModelIds.WHEAT_CROPSTATE_1;
            break;
          case 2:
            this.actorModelId = ModelIds.WEHAT_CROPSTATE_2;
            break;
          case 3:
            this.actorModelId = ModelIds.WHEAT_CROPSTATE_3;
            break;
        }
    }
    server.sendDataToAllWithSpawnedEntity(
      server._plants,
      this.characterId,
      "Character.ReplaceBaseModel",
      {
        characterId: this.characterId,
        modelId: this.actorModelId
      }
    );
    if (this.isFertilized) {
      const pos = this.state.position;
      server.sendDataToAllWithSpawnedEntity<CharacterPlayWorldCompositeEffect>(
        // play burning effect & remove it after 15s
        server._plants,
        this.characterId,
        "Character.PlayWorldCompositeEffect",
        {
          characterId: this.characterId,
          effectId: Effects.EFX_Crop_Fertilizer,
          position: new Float32Array([pos[0], pos[1], pos[2], 1]),
          effectTime: 180
        }
      );
    }
    const timeToAdd = this.isFertilized ? this.growTime / 2 : this.growTime; // 4 or 8h based on fertilized or not
    this.nextStateTime = new Date().getTime() + timeToAdd;
  }
  /* eslint-disable @typescript-eslint/no-unused-vars */
  OnPlayerSelect(
    server: ZoneServer2016,
    client: ZoneClient2016,
    isInstant?: boolean
    /* eslint-enable @typescript-eslint/no-unused-vars */
  ) {
    if (this.growState != 3) return;
    for (const a in server._constructionFoundations) {
      const foundation = server._constructionFoundations[a];
      if (!foundation.isInside(this.state.position)) continue;
      if (
        foundation.isSecured &&
        !foundation.getHasPermission(
          server,
          client.character.characterId,
          ConstructionPermissionIds.CONTAINERS
        )
      ) {
        server.sendChatText(client, "Construction: no permission");
        return;
      }
    }
    if (!server._temporaryObjects[this.parentObjectCharacterId]) {
      server.deleteEntity(this.characterId, server._plants);
      return;
    }
    const parent = server._temporaryObjects[
      this.parentObjectCharacterId
    ] as PlantingDiameter;
    delete parent.seedSlots[this.slot];

    switch (this.item.itemDefinitionId) {
      case Items.SEED_WHEAT:
        client.character.lootItem(server, server.generateItem(Items.WHEAT));
        client.character.lootItem(
          server,
          server.generateItem(Items.SEED_WHEAT, 2),
          2
        );
        break;
      case Items.SEED_CORN:
        client.character.lootItem(server, server.generateItem(Items.CORN));
        client.character.lootItem(
          server,
          server.generateItem(Items.SEED_CORN, 2),
          2
        );
        break;
    }
    server.sendCompositeEffectToAllWithSpawnedEntity(
      server._plants,
      this,
      5151
    );
    server.deleteEntity(this.characterId, server._plants);
  }

  OnInteractionString(server: ZoneServer2016, client: ZoneClient2016): void {
    if (this.growState != 3) return;
    server.sendData(client, "Command.InteractionString", {
      guid: this.characterId,
      stringId: StringIds.TAKE_ITEM
    });
  }

  OnFullCharacterDataRequest(
    server: ZoneServer2016,
    client: ZoneClient2016
  ): void {
    if (!this.isFertilized) return;
    server.sendData(client, "Command.PlayDialogEffect", {
      characterId: this.characterId,
      effectId: Effects.EFX_Crop_Fertilizer
    });
  }

  destroy(server: ZoneServer2016): boolean {
    return server.deleteEntity(this.characterId, server._plants);
  }
}
