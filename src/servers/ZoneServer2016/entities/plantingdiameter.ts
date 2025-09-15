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

import { TemporaryEntity } from "./temporaryentity";
import { ZoneServer2016 } from "../zoneserver";
import { Plant } from "./plant";
import { DamageInfo } from "types/zoneserver";
import { Items, ConstructionPermissionIds, StringIds } from "../models/enums";
import { ZoneClient2016 } from "../classes/zoneclient";

export class PlantingDiameter extends TemporaryEntity {
  /** The time (milliseconds) at which the PlantingDiameter was placed */
  placementTime = Date.now();

  /** HashMap of the Plant occupying the seed slot */
  seedSlots: { [id: string]: Plant } = {};

  /** Time (milliseconds) at which the PlantingDiameter will disappear if unoccupied - Default: 1 day */
  disappearTimestamp: number = new Date().getTime() + 86400000;

  /** Returns true if the player uses a fertilizer nearby */
  isFertilized: boolean = false;

  /** Time (milliseconds) when a fertilizer was applied to a PlantingDiameter */
  fertilizedTimestamp: number = 0;

  /** CharacterId of the player who placed this object */
  ownerCharacterId: string;

  constructor(
    characterId: string,
    transientId: number,
    actorModelId: number,
    position: Float32Array,
    rotation: Float32Array,
    server: ZoneServer2016,
    ownerCharacterId: string
  ) {
    super(characterId, transientId, actorModelId, position, rotation, server);
    this.npcRenderDistance = 30;
    this.ownerCharacterId = ownerCharacterId;
  }

  destroy(server: ZoneServer2016): boolean {
    for (const plant of Object.values(this.seedSlots)) {
      plant.destroy(server);
    }
    return server.deleteEntity(this.characterId, server._temporaryObjects);
  }

  OnInteractionString(server: ZoneServer2016, client: ZoneClient2016): void {
    if (this.canUndoPlacement(server, client)) {
      server.sendData(client, "Command.InteractionString", {
        guid: this.characterId,
        stringId: StringIds.UNDO_PLACEMENT
      });
    }
  }

  OnPlayerSelect(server: ZoneServer2016, client: ZoneClient2016) {
    if (this.canUndoPlacement(server, client)) {
      this.destroy(server);
      client.character.lootItem(
        server,
        server.generateItem(Items.GROUND_TILLER)
      );
      return;
    }
  }

  OnMeleeHit(server: ZoneServer2016, damageInfo: DamageInfo) {
    const client = server.getClientByCharId(damageInfo.entity),
      weapon = client?.character.getEquippedWeapon();
    if (!client || !weapon) return;
    if (weapon.itemDefinitionId != Items.WEAPON_HAMMER_DEMOLITION) return;

    const parentFoundations = Object.values(
      server._constructionFoundations
    ).filter((foundation) => foundation.isInside(this.state.position));

    for (const foundation of parentFoundations) {
      if (
        !foundation.getHasPermission(
          server,
          client.character.characterId,
          ConstructionPermissionIds.DEMOLISH
        )
      )
        return;
    }

    if (
      parentFoundations.length == 0 &&
      client.character.characterId != this.ownerCharacterId
    )
      return;

    for (const plant of Object.values(this.seedSlots)) {
      plant.destroy(server);
    }
    server.deleteEntity(this.characterId, server._temporaryObjects);
  }

  canUndoPlacement(server: ZoneServer2016, client: ZoneClient2016) {
    const weapon = client.character.getEquippedWeapon();
    if (!weapon) return false;

    const parentFoundations = Object.values(
      server._constructionFoundations
    ).filter((foundation) => foundation.isInside(this.state.position));

    for (const foundation of parentFoundations) {
      if (
        foundation.getHasPermission(
          server,
          client.character.characterId,
          ConstructionPermissionIds.DEMOLISH
        ) &&
        Date.now() < this.placementTime + 120000 &&
        weapon.itemDefinitionId == Items.WEAPON_HAMMER_DEMOLITION
      ) {
        return true;
      }
    }

    return client.character.characterId == this.ownerCharacterId;
  }
}
