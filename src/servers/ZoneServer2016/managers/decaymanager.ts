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
import { Items } from "../models/enums";
import { LootableConstructionEntity } from "../entities/lootableconstructionentity";
import { ConstructionDoor } from "../entities/constructiondoor";
import { ConstructionChildEntity } from "../entities/constructionchildentity";
import { Scheduler } from "../../../utils/utils";

export class DecayManager {
  loopTime = 1200000; // 20 min
  currentTicksCount = 0; // used to run structure damaging once every x loops
  requiredTicksToDamage = 36; // damage structures once every 12 hours

  public async run(server: ZoneServer2016) {
    this.contructionExpirationCheck(server);
    await Scheduler.wait(this.loopTime);
    this.run(server);
  }

  private contructionExpirationCheck(server: ZoneServer2016) {
    for (const a in server._constructionFoundations) {
      const foundation = server._constructionFoundations[a];
      if (foundation.itemDefinitionId == Items.FOUNDATION_EXPANSION) continue;
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
}
