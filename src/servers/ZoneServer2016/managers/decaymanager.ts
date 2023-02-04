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

import { ZoneServer2016 } from "../zoneserver";
import { Items, ResourceIds, ResourceTypes } from "../models/enums";
import { LootableConstructionEntity } from "../entities/lootableconstructionentity";
import { ConstructionDoor } from "../entities/constructiondoor";
import { ConstructionChildEntity } from "../entities/constructionchildentity";
import { Scheduler } from "../../../utils/utils";
import { ConstructionParentEntity } from "../entities/constructionparententity";

export class DecayManager {
  loopTime = 1200000; // 20 min
  currentTicksCount = 0; // used to run structure damaging once every x loops
  requiredTicksToDamage = 36; // damage structures once every 12 hours

  public async run(server: ZoneServer2016) {
    this.contructionExpirationCheck(server);
    if (this.currentTicksCount >= this.requiredTicksToDamage) {
      this.contructionDecayDamage(server);
      this.currentTicksCount = -1;
    }
    this.currentTicksCount++;
    await Scheduler.wait(this.loopTime);
    this.run(server);
  }

  private contructionExpirationCheck(server: ZoneServer2016) {
    for (const a in server._constructionFoundations) {
      const foundation = server._constructionFoundations[a];
      if (
        foundation.itemDefinitionId != Items.FOUNDATION &&
        foundation.itemDefinitionId != Items.GROUND_TAMPER
      )
        continue;
      let expansionshaveChild = false;
      Object.values(foundation.occupiedExpansionSlots).forEach(
        (exp: ConstructionParentEntity) => {
          if (
            Object.keys(exp.occupiedWallSlots).length != 0 ||
            Object.keys(exp.occupiedShelterSlots).length != 0 ||
            Object.keys(exp.occupiedUpperWallSlots).length != 0
          ) {
            expansionshaveChild = true;
          }
        }
      );
      if (expansionshaveChild) continue;
      if (
        Object.keys(foundation.occupiedWallSlots).length == 0 &&
        Object.keys(foundation.occupiedShelterSlots).length == 0 &&
        Object.keys(foundation.occupiedUpperWallSlots).length == 0
      ) {
        if (foundation.objectLessTicks >= foundation.objectLessMaxTicks) {
          for (const a in foundation.occupiedExpansionSlots) {
            const expansion = foundation.occupiedExpansionSlots[a];
            for (const a in expansion.occupiedRampSlots) {
              expansion.occupiedRampSlots[a].destroy(server);
            }
            expansion.destroy(server);
          }
          for (const a in foundation.occupiedRampSlots) {
            foundation.occupiedRampSlots[a].destroy(server);
          }
          Object.values(foundation.freeplaceEntities).forEach(
            (
              entity:
                | LootableConstructionEntity
                | ConstructionDoor
                | ConstructionChildEntity
            ) => {
              entity.destroy(server);
            }
          );
          foundation.destroy(server);
        }
        foundation.objectLessTicks++;
      } else {
        foundation.objectLessTicks = 0;
      }
    }
  }

  private decayDamage(
    server: ZoneServer2016,
    entity:
      | LootableConstructionEntity
      | ConstructionDoor
      | ConstructionChildEntity
  ) {
    const dictionary = server.getConstructionDictionary(entity.characterId);
    entity.damage(server, {
      entity: "",
      damage: 125000,
    });
    server.updateResourceToAllWithSpawnedEntity(
      entity.characterId,
      entity.health,
      ResourceIds.CONSTRUCTION_CONDITION,
      ResourceTypes.CONDITION,
      dictionary
    );
    if (entity.health > 0) return;
    entity.destroy(server);
  }

  private contructionDecayDamage(server: ZoneServer2016) {
    for (const a in server._worldLootableConstruction) {
      this.decayDamage(server, server._worldLootableConstruction[a]);
    }
    for (const a in server._worldSimpleConstruction) {
      this.decayDamage(server, server._worldSimpleConstruction[a]);
    }
    for (const a in server._constructionFoundations) {
      const foundation = server._constructionFoundations[a];
      if (
        foundation.itemDefinitionId != Items.FOUNDATION &&
        foundation.itemDefinitionId != Items.GROUND_TAMPER &&
        foundation.itemDefinitionId != Items.FOUNDATION_EXPANSION
      ) {
        this.decayDamage(server, foundation);
      }
      Object.values(foundation.freeplaceEntities).forEach(
        (
          entity:
            | LootableConstructionEntity
            | ConstructionDoor
            | ConstructionChildEntity
        ) => {
          this.decayDamage(server, entity);
        }
      );
      Object.values(foundation.occupiedShelterSlots).forEach(
        (entity: ConstructionDoor | ConstructionChildEntity) => {
          if (entity instanceof ConstructionChildEntity) {
            this.decayChildEntity(server, entity);
          }
        }
      );
      Object.values(foundation.occupiedWallSlots).forEach(
        (entity: ConstructionDoor | ConstructionChildEntity) => {
          this.decayChildEntity(server, entity);
        }
      );
    }
  }

  private decayChildEntity(
    server: ZoneServer2016,
    entity: ConstructionChildEntity | ConstructionDoor
  ) {
    if (entity instanceof ConstructionChildEntity) {
      Object.values(entity.occupiedShelterSlots).forEach(
        (slot: ConstructionChildEntity) => {
          this.decayChildEntity(server, slot);
        }
      );
      Object.values(entity.occupiedWallSlots).forEach(
        (wall: ConstructionDoor | ConstructionChildEntity) => {
          this.decayDamage(server, wall);
        }
      );
      Object.values(entity.occupiedUpperWallSlots).forEach(
        (slot: ConstructionDoor | ConstructionChildEntity) => {
          this.decayDamage(server, slot);
        }
      );
    }
    this.decayDamage(server, entity);
  }
}
