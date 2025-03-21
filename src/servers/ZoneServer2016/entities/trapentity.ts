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

import { CubeBounds, DamageInfo, Point3D } from "types/zoneserver";
import {
  getCubeBounds,
  getDistance,
  isInsideCube,
  isPosInRadius
} from "../../../utils/utils";
import {
  Effects,
  Items,
  LoadoutSlots,
  ModelIds,
  MovementModifiers,
  ResourceIds,
  ResourceTypes
} from "../models/enums";
import { ZoneServer2016 } from "../zoneserver";
import { BaseSimpleNpc } from "./basesimplenpc";
import { BaseEntity } from "./baseentity";
import { LoadoutItem } from "../classes/loadoutItem";

export class TrapEntity extends BaseSimpleNpc {
  /** Damage delay for the TrapEntity */
  trapTimer?: NodeJS.Timeout;

  /** Returns true if a snare has been stepped on */
  isTriggered = false;

  /** Distance (H1Z1 meters) where the TrapEntity will render */
  npcRenderDistance = 75;

  /** Id of the TrapEntity - See ServerItemDefinitions.json for more information */
  itemDefinitionId: number;
  worldOwned: boolean = false;
  ownerCharacterId: string;
  readonly cubebounds!: CubeBounds;
  constructor(
    characterId: string,
    transientId: number,
    actorModelId: number,
    position: Float32Array,
    rotation: Float32Array,
    server: ZoneServer2016,
    itemDefinitionId: Items,
    worldOwned = false,
    ownerCharacterId = ""
  ) {
    super(characterId, transientId, actorModelId, position, rotation, server);
    this.itemDefinitionId = itemDefinitionId;
    this.worldOwned = worldOwned;
    this.ownerCharacterId = ownerCharacterId;

    const angle = -this.state.rotation[1];
    switch (itemDefinitionId) {
      case Items.BARBED_WIRE:
        this.cubebounds = getCubeBounds(
          position,
          7.05,
          2.15,
          angle,
          position[1] - 0.9,
          position[1] + 1.8
        );
    }
  }

  async arm(server: ZoneServer2016) {
    switch (this.itemDefinitionId) {
      case Items.PUNJI_STICKS:
      case Items.PUNJI_STICK_ROW:
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
              !client.vehicle.mountedVehicle &&
              !client.character.isSpectator
            ) {
              const item: LoadoutItem | undefined =
                client.character._loadout[LoadoutSlots.FEET];
              client.character.damage(server, {
                entity: this.characterId,
                causeBleed: true,
                damage: server.isBoot(item.itemDefinitionId) ? 401 : 501
              });
              server.sendDataToAllWithSpawnedEntity(
                server._traps,
                this.characterId,
                "Character.PlayWorldCompositeEffect",
                {
                  characterId: "0x0",
                  effectId: Effects.PFX_Impact_PunjiSticks_Blood,
                  position: server._clients[a].character.state.position
                }
              );

              server.sendDataToAllWithSpawnedEntity(
                server._traps,
                this.characterId,
                "Character.UpdateSimpleProxyHealth",
                this.pGetSimpleProxyHealth()
              );
              if (!this.worldOwned) this.health -= 1000;
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
                effectId: Effects.PFX_Damage_Crate_01m,
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
                  effectId: Effects.PFX_Impact_Knife_Metal_Vehicle,
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
            this.actorModelId = ModelIds.SNARE;
            server.worldObjectManager.createLootEntity(
              server,
              server.generateItem(Items.SNARE),
              this.state.position,
              this.state.rotation,
              15
            );
          }
        }, 200);
        break;
      case Items.BARBED_WIRE:
        this.trapTimer = setTimeout(() => {
          if (!server._traps[this.characterId]) {
            return;
          }
          for (const a in server._clients) {
            const client = server._clients[a];
            if (
              this.isInside(client.character.state.position) &&
              client.character.isAlive &&
              !client.character.isSpectator
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
                  effectId: Effects.PFX_Impact_PunjiSticks_Blood,
                  position: server._clients[a].character.state.position
                }
              );

              server.sendDataToAllWithSpawnedEntity(
                server._traps,
                this.characterId,
                "Character.UpdateSimpleProxyHealth",
                this.pGetSimpleProxyHealth()
              );
              if (!this.worldOwned) this.health -= 1000;
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
                effectId: Effects.PFX_Damage_Crate_01m,
                position: this.state.position
              }
            );
            this.destroy(server);
            return;
          }
        }, 500);
        break;
      case Items.TRAP_FIRE:
      case Items.TRAP_FLASH:
        // Wait 10 seconds before activating the trap
        await new Promise<void>((resolve) => setTimeout(resolve, 10000));

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
              this.detonateTrap(server, {
                entity: client.character.characterId,
                damage: 0
              });
              this.isTriggered = true;
            }
          }
          for (const a in server._vehicles) {
            if (
              getDistance(
                server._vehicles[a].state.position,
                this.state.position
              ) < 2
            ) {
              server._vehicles[a].getPassengerList().map((passenger) => {
                this.detonateTrap(server, { entity: passenger, damage: 0 });
                this.isTriggered = true;
              });
            }
          }
          if (!this.isTriggered) {
            this.trapTimer?.refresh();
          } else {
            this.destroy(server);
          }
        }, 90);
        break;
    }
  }
  destroy(server: ZoneServer2016): boolean {
    return server.deleteEntity(this.characterId, server._traps);
  }

  isInside(position: Float32Array) {
    switch (this.itemDefinitionId) {
      case Items.BARBED_WIRE:
        return isInsideCube(Array.from(position) as Point3D, this.cubebounds);
    }
  }

  OnProjectileHit(server: ZoneServer2016, damageInfo: DamageInfo) {
    const damage = damageInfo.damage * 6; // bullets do more to damage traps
    this.damage(server, { ...damageInfo, damage });
  }

  OnMeleeHit(server: ZoneServer2016, damageInfo: DamageInfo) {
    const client = server.getClientByCharId(damageInfo.entity),
      weapon = client?.character.getEquippedWeapon();
    if (!client || !weapon) return;

    const damage = damageInfo.damage * 3;
    this.damage(server, { ...damageInfo, damage });
    server.damageItem(client.character, weapon, 50);
  }

  damage(server: ZoneServer2016, damageInfo: DamageInfo) {
    if (this.worldOwned) return;
    this.health -= damageInfo.damage;
    server.sendDataToAllWithSpawnedEntity(
      server._traps,
      this.characterId,
      "Character.UpdateSimpleProxyHealth",
      this.pGetSimpleProxyHealth()
    );
    if (this.health > 0) return;
    if (this.destroy(server)) this.detonateTrap(server, damageInfo);
  }

  detonateTrap(server: ZoneServer2016, damageInfo: DamageInfo) {
    const client = server.getClientByCharId(damageInfo.entity);
    if (
      !client ||
      ![Items.TRAP_FLASH, Items.TRAP_FIRE].includes(this.itemDefinitionId)
    )
      return;

    //TODO: Damage vehicles while driving over fire traps
    switch (this.itemDefinitionId) {
      case Items.TRAP_FLASH:
        if (
          getDistance(client.character.state.position, this.state.position) <= 5
        ) {
          server.addScreenEffect(client, server._screenEffects["FLASH"]);

          server.sendDataToAllWithSpawnedEntity(
            server._characters,
            client.character.characterId,
            "Character.PlayAnimation",
            {
              characterId: client.character.characterId,
              animationName: "Action",
              animationType: "ActionType",
              unm4: 0,
              unknownDword1: 0,
              unknownByte1: 0,
              unknownDword2: 0,
              unknownByte1xda: 0,
              unknownDword3: 9
            }
          );
        }
        break;
      case Items.TRAP_FIRE:
        if (
          getDistance(client.character.state.position, this.state.position) <= 5
        ) {
          server.sendDataToAllWithSpawnedEntity(
            server._characters,
            client.character.characterId,
            "Character.PlayAnimation",
            {
              characterId: client.character.characterId,
              animationName: "Action",
              animationType: "ActionType",
              unm4: 0,
              unknownDword1: 0,
              unknownByte1: 0,
              unknownDword2: 0,
              unknownByte1xda: 0,
              unknownDword3: 11
            }
          );

          server.sendDataToAllWithSpawnedEntity(
            server._traps,
            this.characterId,
            "Character.AddEffectTagCompositeEffect",
            {
              characterId: client.character.characterId,
              unknownDword1: Effects.PFX_Fire_Person_loop,
              effectId: Effects.PFX_Fire_Person_loop,
              unknownGuid: client.character.characterId,
              unknownDword2: 3
            }
          );

          const interval = 1000,
            duration = 10000;
          let elapsedTime = 0;

          const timerId = setInterval(() => {
            elapsedTime += interval;

            client.character.damage(server, {
              entity: this.characterId,
              causeBleed: false,
              damage: 500
            });
            if (elapsedTime >= duration) {
              clearInterval(timerId);
              server.sendDataToAllWithSpawnedEntity(
                server._characters,
                client.character.characterId,
                "Character.RemoveEffectTagCompositeEffect",
                {
                  characterId: client.character.characterId,
                  effectId: Effects.PFX_Fire_Person_loop,
                  newEffectId: 0
                }
              );
            }
          }, interval);
        }
        break;
    }

    if (!this.isTriggered) {
      server.sendCompositeEffectToAllInRange(
        600,
        "",
        this.state.position,
        Effects.PFX_Impact_Explosion_FlashGrenade_Default
      );
    }
  }

  OnExplosiveHit(server: ZoneServer2016, sourceEntity: BaseEntity) {
    if (!isPosInRadius(5, this.state.position, sourceEntity.state.position))
      return;
    this.destroy(server);
  }
}
