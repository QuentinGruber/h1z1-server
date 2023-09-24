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

import { getDistance } from "../../../utils/utils";
import {
  Items,
  MovementModifiers,
  ResourceIds,
  ResourceTypes
} from "../models/enums";
import { ZoneServer2016 } from "../zoneserver";
import { BaseSimpleNpc } from "./basesimplenpc";

export class TrapEntity extends BaseSimpleNpc {
  trapTimer?: NodeJS.Timeout;
  isTriggered = false;
  npcRenderDistance = 75;
  itemDefinitionId: number;
  constructor(
    characterId: string,
    transientId: number,
    actorModelId: number,
    position: Float32Array,
    rotation: Float32Array,
    server: ZoneServer2016,
    itemDefinitionId: Items
  ) {
    super(characterId, transientId, actorModelId, position, rotation, server);
    this.itemDefinitionId = itemDefinitionId;
  }

  arm(server: ZoneServer2016) {
    switch (this.itemDefinitionId) {
      case (Items.PUNJI_STICKS, Items.PUNJI_STICK_ROW):
        this.trapTimer = setTimeout(() => {
          if (!server._traps[this.characterId]) {
            return;
          }
          for (const a in server._clients) {
            const client = server._clients[a];
            if (
              getDistance(
                client.character.state.position,
                this.state.position
              ) < 1.5 &&
              client.character.isAlive &&
              !client.vehicle.mountedVehicle
            ) {
              client.character.damage(server, {
                entity: this.characterId,
                causeBleed: true,
                damage: 501
              });
              server.sendDataToAllWithSpawnedEntity(
                server._traps,
                this.characterId,
                "Character.PlayWorldCompositeEffect",
                {
                  characterId: "0x0",
                  effectId: 5116,
                  position: server._clients[a].character.state.position
                }
              );

              server.sendDataToAllWithSpawnedEntity(
                server._traps,
                this.characterId,
                "Character.UpdateSimpleProxyHealth",
                this.pGetSimpleProxyHealth()
              );
              this.health -= 1000;
            }
          }

          if (this.health > 0) {
            this.trapTimer?.refresh();
          } else {
            server.sendDataToAllWithSpawnedEntity(
              server._traps,
              this.characterId,
              "Character.PlayWorldCompositeEffect",
              {
                characterId: "0x0",
                effectId: 163,
                position: this.state.position
              }
            );
            this.destroy(server);
            return;
          }
        }, 500);
        break;
      case Items.SNARE:
        this.trapTimer = setTimeout(() => {
          if (!server._traps[this.characterId]) {
            return;
          }
          for (const a in server._clients) {
            const client = server._clients[a];
            if (
              getDistance(
                client.character.state.position,
                this.state.position
              ) < 1
            ) {
              client.character.damage(server, {
                entity: this.characterId,
                damage: 2000
              });
              client.character._resources[ResourceIds.BLEEDING] += 41;
              server.updateResourceToAllWithSpawnedEntity(
                client.character.characterId,
                client.character._resources[ResourceIds.BLEEDING] > 0
                  ? client.character._resources[ResourceIds.BLEEDING]
                  : 0,
                ResourceIds.BLEEDING,
                ResourceTypes.BLEEDING,
                server._characters
              );
              server.sendDataToAllWithSpawnedEntity(
                server._traps,
                this.characterId,
                "Character.PlayWorldCompositeEffect",
                {
                  characterId: this.characterId,
                  effectId: 1630,
                  position: server._traps[this.characterId].state.position
                }
              );
              this.isTriggered = true;
              server.applyMovementModifier(client, MovementModifiers.SNARED);
            }
          }

          if (!this.isTriggered) {
            this.trapTimer?.refresh();
          } else {
            this.destroy(server);
            this.actorModelId = 1974;
            server.worldObjectManager.createLootEntity(
              server,
              server.generateItem(1415),
              this.state.position,
              this.state.rotation,
              15
            );
          }
        }, 200);
        break;
    }
  }
  destroy(server: ZoneServer2016): boolean {
    return server.deleteEntity(this.characterId, server._traps);
  }
}
