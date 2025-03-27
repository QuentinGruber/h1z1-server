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

/* eslint-disable @typescript-eslint/no-unused-vars */
// TODO enable @typescript-eslint/no-unused-vars
import { ZoneClient2016 as Client } from "./classes/zoneclient";
import { ZoneServer2016 } from "./zoneserver";
const debug = require("debug")("ZoneServer");

import {
  _,
  isPosInRadius,
  toHex,
  quat2matrix,
  eul2quat,
  isPosInRadiusWithY,
  getCurrentServerTimeWrapper,
  getDateString,
  isHalloween,
  isChristmasSeason as isChristmasSeason
} from "../../utils/utils";

import { CraftManager } from "./managers/craftmanager";
import {
  ConstructionPermissionIds,
  ContainerErrors,
  Items,
  ResourceIds,
  ResourceTypes,
  ItemUseOptions,
  LoadoutSlots,
  StringIds,
  AccountItems,
  Effects
} from "./models/enums";
import { BaseFullCharacter } from "./entities/basefullcharacter";
import { BaseLightweightCharacter } from "./entities/baselightweightcharacter";
import { ConstructionParentEntity } from "./entities/constructionparententity";
import { ConstructionDoor } from "./entities/constructiondoor";
import {
  AbilitiesInitAbility,
  AbilitiesUninitAbility,
  AbilitiesUpdateAbility,
  AccessedCharacterEndCharacterAccess,
  CharacterCharacterStateDelta,
  CharacterFullCharacterDataRequest,
  CharacterNoSpaceNotification,
  CharacterRespawn,
  CharacterSelectSessionResponse,
  CharacterStartMultiStateDeath,
  CharacterWeaponStance,
  ChatChat,
  ClientInitializationDetails,
  ClientLog,
  ClientUpdateCompleteLogoutProcess,
  ClientUpdateDoneSendingPreloadCharacters,
  ClientUpdateMonitorTimeDrift,
  ClientUpdateNetworkProximityUpdatesComplete,
  ClientUpdateProximateItems,
  ClientUpdateUpdateLocation,
  ClientUpdateUpdateManagedLocation,
  CollisionDamage,
  CommandAddWorldCommand,
  CommandExecuteCommand,
  CommandFreeInteractionNpc,
  CommandInteractRequest,
  CommandInteractionString,
  CommandItemDefinitionReply,
  CommandItemDefinitionRequest,
  CommandPointAndReport,
  CommandRecipeStart,
  CommandReportLastDeath,
  CommandRunSpeed,
  CommandSpawnVehicle,
  ConstructionPlacementFinalizeRequest,
  ConstructionPlacementRequest,
  ConstructionPlacementResponse,
  ContinentBattleInfo,
  DtoHitSpeedTreeReport,
  EffectAddEffect,
  EffectRemoveEffect,
  GetContinentBattleInfo,
  GroupInvite,
  GroupJoin,
  ItemsRequestUseAccountItem,
  ItemsRequestUseItem,
  KeepAlive,
  LightweightToFullNpc,
  LoadoutSelectSlot,
  LobbyGameDefinitionDefinitionsRequest,
  LocksSetLock,
  MountSeatChangeRequest,
  NpcFoundationPermissionsManagerAddPermission,
  NpcFoundationPermissionsManagerBaseShowPermissions,
  NpcFoundationPermissionsManagerEditPermission,
  PlayerUpdateManagedPosition,
  ReplicationInteractionComponent,
  ReplicationNpcComponent,
  RewardBuffInfo,
  Security,
  SetLocale,
  SpectatorTeleport,
  Synchronization,
  VehicleAccessType,
  VehicleCollision,
  VehicleStateData,
  VoiceLeaveRadio,
  VoiceRadioChannel,
  WallOfDataClientSystemInfo,
  WallOfDataUIEvent,
  WeaponWeapon,
  ZoneDoneSendingInitialData,
  H1emuVoiceInit,
  GroupKick,
  InGamePurchaseStoreBundleContentResponse,
  GrinderExchangeRequest,
  GrinderExchangeResponse,
  RagdollUpdatePose
} from "types/zone2016packets";
import { VehicleCurrentMoveMode } from "types/zone2015packets";
import {
  AccountItem,
  ClientBan,
  ConstructionPermissions,
  DamageInfo,
  GrinderItem,
  Group,
  RewardCrateDefinition,
  StanceFlags
} from "types/zoneserver";
import { Vehicle2016 } from "./entities/vehicle";
import { Plant } from "./entities/plant";
import { ConstructionChildEntity } from "./entities/constructionchildentity";
import { DB_COLLECTIONS } from "../../utils/enums";
import { LootableConstructionEntity } from "./entities/lootableconstructionentity";
import { Character2016 } from "./entities/character";
import { Crate } from "./entities/crate";
import {
  EXTERNAL_CONTAINER_GUID,
  LOADOUT_CONTAINER_GUID,
  OBSERVER_GUID
} from "../../utils/constants";
import { BaseLootableEntity } from "./entities/baselootableentity";
import { Destroyable } from "./entities/destroyable";
import { Lootbag } from "./entities/lootbag";
import { ReceivedPacket } from "types/shared";
import { LoadoutItem } from "./classes/loadoutItem";
import { BaseItem } from "./classes/baseItem";
import { EntityType } from "h1emu-ai";

function getStanceFlags(num: number): StanceFlags {
  function getBit(bin: string, bit: number) {
    return bin.charAt(bit) === "1";
  }

  const bin = num.toString(2).padStart(22, "0"); // Convert integer to binary string and pad with zeros
  return {
    FIRST_PERSON: getBit(bin, 0),
    FLAG1: getBit(bin, 1),
    SITTING: getBit(bin, 2),
    STRAFE_RIGHT: getBit(bin, 3),
    STRAFE_LEFT: getBit(bin, 4),
    FORWARD: getBit(bin, 5),
    BACKWARD: getBit(bin, 6),
    FLAG7: getBit(bin, 7),
    FLAG8: getBit(bin, 8),
    PRONED: getBit(bin, 9),
    FLAG10: getBit(bin, 10),
    ON_GROUND: getBit(bin, 11),
    FLAG12: getBit(bin, 12),
    FLAG13: getBit(bin, 13),
    FLAG14: getBit(bin, 14),
    STATIONARY: getBit(bin, 15),
    FLOATING: getBit(bin, 16),
    JUMPING: getBit(bin, 17),
    FLAG18: getBit(bin, 18),
    SPRINTING: getBit(bin, 19),
    CROUCHING: getBit(bin, 20),
    FLAG21: getBit(bin, 21)
  };
}

//const abilities = require("../../../data/2016/sampleData/abilities.json");

export class ZonePacketHandlers {
  constructor() {}

  ClientIsReady(
    server: ZoneServer2016,
    client: Client,
    packet: ReceivedPacket<object>
  ) {
    /*
    server.sendData(client, "ClientUpdate.ActivateProfile", {
      profileData: {
          profileId: 5,
          nameId: 66,
          descriptionId: 66,
          type: 3,
          unknownDword1: 0,
          unknownArray1: []
      },
      attachmentData: client.character.pGetAttachmentSlots(),
      unknownDword1: 5,
      unknownDword2: 5,
      actorModelId: client.character.actorModelId,
      tintAlias: "Default",
      decalAlias: "#"
    });
    */
    client.isInVoiceChat = false;
    server.firstRoutine(client);
    server.setGodMode(client, true);

    server.sendData<ClientUpdateDoneSendingPreloadCharacters>(
      client,
      "ClientUpdate.DoneSendingPreloadCharacters",
      {
        done: true
      }
    ); // Required for WaitForWorldReady

    server.spawnStaticBuildings(client);

    // Required for WaitForWorldReady
    setTimeout(() => {
      // makes loading longer but gives game time to spawn objects and reduce lag
      server.sendData<ClientUpdateNetworkProximityUpdatesComplete>(
        client,
        "ClientUpdate.NetworkProximityUpdatesComplete",
        {}
      );
    }, 5000);

    server.customizeDTO(client);

    client.character.startResourceUpdater(client, server);
    server.sendData<CharacterCharacterStateDelta>(
      client,
      "Character.CharacterStateDelta",
      {
        guid1: client.guid,
        guid2: "0x0000000000000000",
        guid3: "0x0000000040000000",
        guid4: "0x0000000000000000",
        gameTime: getCurrentServerTimeWrapper().getTruncatedU32()
      }
    );

    if (server.itemClassDefinitionsCache) {
      server.sendRawDataReliable(client, server.itemClassDefinitionsCache);
    }
    if (server.profileDefinitionsCache) {
      server.sendRawDataReliable(client, server.profileDefinitionsCache);
    }
    if (server.projectileDefinitionsCache) {
      server.sendRawDataReliable(client, server.projectileDefinitionsCache);
    }

    // for melees / emotes / vehicle boost / etc (needs more work)
    /*
    server.sendData<>(client, "Abilities.SetActivatableAbilityManager", abilities);
      server.sendData<>(client, "ClientUpdate.UpdateStat", {
        stats: [
          {
            statId: 5,
            statValue: {
                type: 1,
                value: {
                    base: 1.3,
                    modifier: 0.16
                }
            }
          }
        ]
      })
    */

    /*
      server.sendData<>(client, "Loadout.SetCurrentLoadout", {
        guid: client.character.guid,
        loadoutId: client.character.currentLoadoutId,
      });
      */

    server.sendData<ZoneDoneSendingInitialData>(
      client,
      "ZoneDoneSendingInitialData",
      {}
    ); // Required for WaitForWorldReady

    server.accountInventoriesManager
      .getAccountItems(client.loginSessionId)
      .then((accountItems) => {
        server.sendData(client, "Items.SetEscrowAccountItemManager", {
          accountItems: accountItems.map((item: BaseItem) => {
            return {
              itemId: item.itemGuid,
              itemData: {
                itemId: item.itemGuid,
                itemGuid: item.itemGuid,
                itemDefinitionId: item.itemDefinitionId,
                itemCount: item.stackCount
              }
            };
          })
        });
      });

    server.sendDeliveryStatus(client);
  }
  ClientFinishedLoading(
    server: ZoneServer2016,
    client: Client,
    packet: ReceivedPacket<any>
  ) {
    if (!server.hookManager.checkHook("OnClientFinishedLoading", client)) {
      return;
    }
    if (client.character.awaitingTeleportLocation) {
      const awaitingPos = client.character.awaitingTeleportLocation;
      setTimeout(() => {
        server.sendData(
          client,
          "UpdateWeatherData",
          server.weatherManager.weather
        );
        server.sendData<ClientUpdateUpdateLocation>(
          client,
          "ClientUpdate.UpdateLocation",
          {
            position: awaitingPos
          }
        );
        server.sendData(
          client,
          "UpdateWeatherData",
          server.weatherManager.weather
        );
        client.character.state.position = awaitingPos;
        client.character.awaitingTeleportLocation = undefined;
        // fixes characters showing up as dead if they respawn close to other characters
        server.sendDataToAllOthersWithSpawnedEntity(
          server._characters,
          client,
          client.character.characterId,
          "Character.RemovePlayer",
          {
            characterId: client.character.characterId
          }
        );
        setTimeout(() => {
          if (!client?.character) return;
          server.sendDataToAllOthersWithSpawnedEntity(
            server._characters,
            client,
            client.character.characterId,
            "AddLightweightPc",
            client.character.pGetLightweightPC(server, client)
          );
        }, 2000);
      }, 100);
    }
    const itemDefinition = server.getItemDefinition(
      client.character.getEquippedWeapon()?.itemDefinitionId
    );
    if (itemDefinition) {
      server.abilitiesManager.deactivateAbility(
        server,
        client,
        itemDefinition.ACTIVATABLE_ABILITY_ID
      );
    }

    server.tempGodMode(client, 15000);
    client.currentPOI = 0; // clears currentPOI for POIManager
    server.sendGameTimeSync(client);
    server.sendData(client, "UpdateWeatherData", server.weatherManager.weather);
    server.constructionManager.sendConstructionData(server, client);
    if (packet.data.characterReleased) {
      if (client.firstCharacterReleased) {
        server.challengeManager.loadChallenges(client);
        client.firstCharacterReleased = false;
        // it's just for performance testing
        // for (let index = 0; index < 100; index++) {
        // this.aiManager.add_entity(client.character, EntityType.Player);
        // }
        if (server._soloMode || process.env.ENABLE_AI)
          client.character.h1emu_ai_id = server.aiManager.add_entity(
            client.character,
            EntityType.Player
          );
        if (
          server.voiceChatManager.useVoiceChatV2 &&
          server.voiceChatManager.joinVoiceChatOnConnect
        ) {
          // disabled for now, client will init manually
          //server.voiceChatManager.handleVoiceChatInit(server, client);
          server.voiceChatManager.sendVoiceChatState(server, client);
          client.voiceChatTimer = setInterval(() => {
            server.voiceChatManager.sendVoiceChatState(server, client);
          }, 20000);
          client.isInVoiceChat = true;
        }
        server.sendData(
          client,
          "UpdateWeatherData",
          server.weatherManager.weather
        );
        if (server.welcomeMessage)
          server.sendAlert(client, server.welcomeMessage);
        if (client.isAdmin) {
          server.sendChatText(
            client,
            `server population : ${_.size(server._characters)}`
          );
          if (server.adminMessage)
            server.sendAlert(client, server.adminMessage);
        }
        if (!server._soloMode && client.character.groupId) {
          server.sendAlert(client, "Group automatically joined.");
        }

        if (isHalloween()) {
          server.accountInventoriesManager
            .getAccountItem(client.loginSessionId, AccountItems.HAUNTED_HOODIE)
            .then((alreadyHaveMask) => {
              if (!alreadyHaveMask) {
                server.rewardManager.addRewardToPlayer(
                  client,
                  AccountItems.HAUNTED_HOODIE
                );
                server.rewardManager.addRewardToPlayer(
                  client,
                  AccountItems.FRANKENSWINE_BACKPACK
                );

                const item = server.generateItem(Items.PUMPKIN_MASK, 1, true);
                client.character.lootItem(server, item);
              }
            });
        }
        if (isChristmasSeason()) {
          server.accountInventoriesManager
            .getAccountItem(
              client.loginSessionId,
              AccountItems.KRINGLE_HOLIDAY_HAT
            )
            .then((alreadyHaveMask) => {
              if (!alreadyHaveMask) {
                server.rewardManager.addRewardToPlayer(
                  client,
                  AccountItems.KRINGLE_HOLIDAY_HAT
                );
                const item = server.generateItem(
                  Items.KRINGLE_HOLIDAY_HAT,
                  1,
                  true
                );
                client.character.lootItem(server, item);
              }
            });
        }

        // if (!server._soloMode) {
        //   client.afkTimer = setInterval(() => {
        //     client.afk(server);
        //   }, ZoneClient2016.afkTime);
        // }
      }
    }

    if (client.firstLoading) {
      client.character.lastLoginDate = toHex(Date.now());
      server.setGodMode(client, false);
      if (client.banType != "") {
        server.sendChatTextToAdmins(
          `Silently banned ${client.character.name} has joined the server !`
        );
      }
      client.firstLoading = false;

      server.sendData<CommandAddWorldCommand>(
        client,
        "Command.AddWorldCommand",
        {
          command: "help"
        }
      );
      Object.values(server.commandHandler.commands).forEach((command) => {
        server.sendData<CommandAddWorldCommand>(
          client,
          "Command.AddWorldCommand",
          {
            command: command.name
          }
        );
      });

      server.sendData<CharacterWeaponStance>(client, "Character.WeaponStance", {
        // activates weaponstance key
        characterId: client.character.characterId,
        stance: client.character.weaponStance
      });
      client.character.updateEquipment(server); // needed or third person character will be invisible
      client.character.updateLoadout(server); // needed or all loadout context menu entries aren't shown
      // clear /hax run since switching servers doesn't automatically clear it
      server.sendData<CommandRunSpeed>(client, "Command.RunSpeed", {
        runSpeed: 0
      });
      client.character.isReady = true;
      server.updateFootwear(
        client,
        client.character._loadout[LoadoutSlots.FEET]?.itemDefinitionId ?? 0,
        client.character._loadout[LoadoutSlots.FEET] == undefined
      );
      server.airdropManager(client, true);
    }
    if (!client.character.isAlive || client.character.isRespawning) {
      // try to fix stuck on death screen
      server.sendData<CharacterStartMultiStateDeath>(
        client,
        "Character.StartMultiStateDeath",
        {
          data: {
            characterId: client.character.characterId
          }
        }
      );
    }
    server.spawnContainerAccessNpc(client);
    server.setTickRate();
  }
  Security(
    server: ZoneServer2016,
    client: Client,
    packet: ReceivedPacket<Security>
  ) {
    debug(packet);
  }
  CommandRecipeStart(
    server: ZoneServer2016,
    client: Client,
    packet: ReceivedPacket<CommandRecipeStart>
  ) {
    new CraftManager(client, server, packet.data.recipeId, packet.data.count);
  }
  CommandSpawnVehicle(
    server: ZoneServer2016,
    client: Client,
    packet: ReceivedPacket<CommandSpawnVehicle>
  ) {
    server.commandHandler.executeInternalCommand(
      server,
      client,
      "vehicle",
      packet
    );
  }
  CommandSetInWater(
    server: ZoneServer2016,
    client: Client,
    packet: ReceivedPacket<object>
  ) {
    debug(packet);
    client.character.characterStates.inWater = true;
    const fireState =
      client.character._characterEffects[Effects.PFX_Fire_Person_loop];
    if (fireState) {
      // remove burning when player is in water
      fireState.duration = 0;
    }
  }
  CommandClearInWater(
    server: ZoneServer2016,
    client: Client,
    packet: ReceivedPacket<object>
  ) {
    debug(packet);
    client.character.characterStates.inWater = false;
  }
  CommandFreeInteractionNpc(
    server: ZoneServer2016,
    client: Client,
    packet: ReceivedPacket<CommandFreeInteractionNpc>
  ) {
    debug("FreeInteractionNpc");
    server.sendData<CommandFreeInteractionNpc>(
      client,
      "Command.FreeInteractionNpc",
      {}
    );
  }
  CollisionDamage(
    server: ZoneServer2016,
    client: Client,
    packet: ReceivedPacket<CollisionDamage>
  ) {
    if (packet.data.objectCharacterId != client.character.characterId) {
      const objVehicle = server._vehicles[packet.data.objectCharacterId || ""];
      if (objVehicle && objVehicle.engineOn) {
        for (const a in server._destroyables) {
          const destroyable = server._destroyables[a];
          if (destroyable.destroyedModel) continue;
          if (
            !packet.data.position ||
            !isPosInRadius(
              4.5,
              destroyable.state.position,
              packet.data.position
            )
          ) {
            continue;
          }
          const damageInfo: DamageInfo = {
            entity: `${objVehicle.characterId} collision`,
            damage: 1000000
          };
          destroyable.OnProjectileHit(server, damageInfo);
        }
      }
      if (objVehicle && packet.data.characterId != objVehicle.characterId) {
        if (objVehicle.getNextSeatId(server) == 0) return;
      }
    }
    const characterId = packet.data.characterId || "",
      damage: number = packet.data.damage || 0,
      objectCharacterId = packet.data.objectCharacterId || "",
      vehicle = server._vehicles[characterId];
    if (characterId === client.character.characterId) {
      if (client.character.vehicleExitDate + 3000 > new Date().getTime()) {
        return;
      }
      if (client.vehicle.mountedVehicle) return;
      // fixes collision dmg bug on login
      if (Number(client.character.lastLoginDate) + 4000 >= Date.now()) {
        return;
      }
      // damage must pass this threshold to be applied
      if (damage <= 800) return;

      if (server.isPvE) {
        // only apply collision dmg if falling
        if (characterId === objectCharacterId) {
          client.character.damage(server, {
            entity: "Server.CollisionDamage",
            damage: damage
          });
        }
        return;
      }

      client.character.damage(server, {
        entity: "Server.CollisionDamage",
        damage: damage
      });
    } else if (vehicle) {
      // leave old system with this damage threshold to damage flipped vehicles
      if (damage > 5000 && damage < 5500) {
        vehicle.damage(server, {
          entity: "Server.CollisionDamage",
          damage: damage / 50
        });
      }
    }
  }

  VehicleCollision(
    server: ZoneServer2016,
    client: Client,
    packet: ReceivedPacket<VehicleCollision>
  ) {
    const transientId = (packet.data.transientId as number) || 0,
      characterId = server._transientIds[transientId],
      vehicle = characterId ? server._vehicles[characterId] : undefined,
      damage = Number((packet.data.damage || 0).toFixed(0));

    if (!vehicle || damage <= 100) return;
    vehicle.damage(server, { entity: "", damage: damage * 4 });
    //server.DTOhit(client, packet);
  }

  CommandPointAndReport(
    server: ZoneServer2016,
    client: Client,
    packet: ReceivedPacket<CommandPointAndReport>
  ) {
    debug(packet);
    /*const targetClient = Object.values(server._clients).find((c) => {
            if (c.character.characterId == packet.data.reportedCharacterId) {
                return c;
            }
        });
        if (!server._discordWebhookUrl) {
            server.sendChatText(client, "Contact admin to enable discord web hooks");
            return;
          }
        if (!targetClient) {
            server.sendChatText(client, "Client not found.");
            return;
          }
          targetClient.reports += 1;
          const logs: any[] = []
          targetClient.clientLogs.forEach((log: { log: string, isSuspicious: boolean })  => {
              if (log.isSuspicious) {
                  logs.push(log.log)
              }
          })
          const obj = [
              { title: 'Reported player:', info: `name: ${targetClient.character.name}, id:${targetClient.loginSessionId}`},              
              { title: 'Reported player position:', info: `${targetClient.character.state.position[0]}   ${targetClient.character.state.position[1]}   ${targetClient.character.state.position[2]}` },
              { title: 'Reported player pvp stats:', info: `Shots fired:${targetClient.pvpStats.shotsFired}, shots hit:${targetClient.pvpStats.shotsHit}, overall accuracy: ${(100 * targetClient.pvpStats.shotsHit / targetClient.pvpStats.shotsFired).toFixed(2)}% | head: ${(targetClient.pvpStats.head * 100 / targetClient.pvpStats.shotsHit).toFixed(0)}% | spine: ${(targetClient.pvpStats.spine * 100 / targetClient.pvpStats.shotsHit).toFixed(0)}% | hands: ${(targetClient.pvpStats.hands * 100 / targetClient.pvpStats.shotsHit).toFixed(0)}% | legs ${(targetClient.pvpStats.legs * 100 / targetClient.pvpStats.shotsHit).toFixed(0)}%` },
              { title: 'Reported player suspicious processes:', info: `:${logs}` },
              { title: 'Reported by:', info: `name: ${client.character.name}, id: ${client.loginSessionId}` },
              { title: 'Position:', info: `${client.character.state.position[0]}   ${client.character.state.position[1]}   ${client.character.state.position[2]}` },
              { title: 'Time:', info: `${server.getDateString(Date.now())}` },
              { title: 'Total reports this session:', info: `${targetClient.reports}` }
          ]
          server.sendDiscordHook(client, targetClient, 'Point and Click Report', 'player decided that suspect is sus :)', obj) // mas�o ma�lane
        */ // disabled for now, people use it to check if a player is nearby
  }
  CommandReportLastDeath(
    server: ZoneServer2016,
    client: Client,
    packet: ReceivedPacket<CommandReportLastDeath>
  ) {
    const targetClient = client.lastDeathReport?.attacker;
    if (!client.lastDeathReport) return;
    if (!targetClient) {
      server.sendChatText(client, "Client not found.");
      return;
    }
    targetClient.reports += 1;
    const logs: any[] = [];
    targetClient.clientLogs.forEach(
      (log: { log: string; isSuspicious: boolean }) => {
        if (log.isSuspicious) {
          logs.push(log.log);
        }
      }
    );
    const obj = [
      {
        title: "Reported player:",
        info: `name: ${targetClient.character.name}, id:${targetClient.loginSessionId}`
      },
      {
        title: "Reported player position:",
        info: `${targetClient.character.state.position[0]}   ${targetClient.character.state.position[1]}   ${targetClient.character.state.position[2]}`
      },
      {
        title: "Distance between players:",
        info: `${client.lastDeathReport?.distance}`
      },
      {
        title: "Reported player pvp stats:",
        info: `Shots fired:${targetClient.pvpStats.shotsFired}, shots hit:${
          targetClient.pvpStats.shotsHit
        }, overall accuracy: ${(
          (100 * targetClient.pvpStats.shotsHit) /
          targetClient.pvpStats.shotsFired
        ).toFixed(2)}% | head: ${(
          (targetClient.pvpStats.head * 100) /
          targetClient.pvpStats.shotsHit
        ).toFixed(0)}% | spine: ${(
          (targetClient.pvpStats.spine * 100) /
          targetClient.pvpStats.shotsHit
        ).toFixed(0)}% | hands: ${(
          (targetClient.pvpStats.hands * 100) /
          targetClient.pvpStats.shotsHit
        ).toFixed(0)}% | legs ${(
          (targetClient.pvpStats.legs * 100) /
          targetClient.pvpStats.shotsHit
        ).toFixed(0)}%`
      },
      { title: "Reported player suspicious processes:", info: `:${logs}` },
      {
        title: "Reported by:",
        info: `name: ${client.character.name}, id: ${client.loginSessionId}`
      },
      {
        title: "Position:",
        info: `${client.character.state.position[0]}   ${client.character.state.position[1]}   ${client.character.state.position[2]}`
      },
      { title: "Time:", info: `${getDateString(Date.now())}` },
      { title: "Total reports this session:", info: `${targetClient.reports}` }
    ];
    delete client.lastDeathReport;
  }

  LobbyGameDefinitionDefinitionsRequest(
    server: ZoneServer2016,
    client: Client,
    packet: ReceivedPacket<LobbyGameDefinitionDefinitionsRequest>
  ) {
    server.sendData<LobbyGameDefinitionDefinitionsRequest>(
      client,
      "LobbyGameDefinition.DefinitionsResponse",
      {
        definitionsData: { data: "" }
      }
    );
  }
  KeepAlive(
    server: ZoneServer2016,
    client: Client,
    packet: ReceivedPacket<KeepAlive>
  ) {
    if (client.isLoading && client.characterReleased && client.isSynced) {
      setTimeout(() => {
        client.isLoading = false;
        if (!client.characterReleased) return;
        if (client.firstReleased) {
          server.sendData<H1emuVoiceInit>(client, "H1emu.VoiceInit", {
            args: `172.232.36.121 ${server._worldId}` // TODO: not wise but we'll change it
          });
          server.sendData(
            client,
            "UpdateWeatherData",
            server.weatherManager.weather
          );
          server.fairPlayManager.handleAssetValidationInit(server, client);
        }
        if (
          client.firstReleased &&
          client.startingPos &&
          client.character.state.position[1] < client.startingPos[1]
        ) {
          client.firstReleased = false;
          server.sendData<ClientUpdateUpdateLocation>(
            client,
            "ClientUpdate.UpdateLocation",
            {
              position: client.startingPos,
              triggerLoadingScreen: false
            }
          );
          client.character.state.position = client.startingPos;
        }
        client.firstReleased = false;
        server.executeRoutine(client);
      }, 500);
    }
  }
  ClientUpdateMonitorTimeDrift(
    server: ZoneServer2016,
    client: Client,
    packet: ReceivedPacket<ClientUpdateMonitorTimeDrift>
  ) {
    // nothing for now
  }
  ClientLog(
    server: ZoneServer2016,
    client: Client,
    packet: ReceivedPacket<ClientLog>
  ) {
    /*const message = packet.data.message || "";
    if (
      packet.data.file ===
        server.fairPlayManager.fairPlayValues?.requiredFile2 &&
      //!client.clientLogs.includes(packet.data.message) && TODO: FIX THIS SINCE IT NEVER WORKED -Meme
      !client.isAdmin
    ) {
      const obj = { log: message, isSuspicious: false };
      for (let x = 0; x < server.fairPlayManager._suspiciousList.length; x++) {
        if (
          message
            .toLowerCase()
            .includes(server.fairPlayManager._suspiciousList[x].toLowerCase())
        ) {
          obj.isSuspicious = true;
          if (!server._soloMode) {
            logClientActionToMongo(
              server._db?.collection(DB_COLLECTIONS.FAIRPLAY) as Collection,
              client,
              server._worldId,
              {
                type: "suspicious software",
                suspicious: server.fairPlayManager._suspiciousList[x]
              }
            );
          }
          server.sendChatTextToAdmins(
            `FairPlay: kicking ${client.character.name} for using suspicious software - ${server.fairPlayManager._suspiciousList[x]}`,
            false
          );
          server.kickPlayer(client);
          break;
        }
      }
      client.clientLogs.push(obj);
    }
    debug(packet);*/
  }
  WallOfDataUIEvent(
    server: ZoneServer2016,
    client: Client,
    packet: ReceivedPacket<WallOfDataUIEvent>
  ) {
    debug("UIEvent");
  }
  SetLocale(
    server: ZoneServer2016,
    client: Client,
    packet: ReceivedPacket<SetLocale>
  ) {
    debug("SetLocale");
  }
  GetContinentBattleInfo(
    server: ZoneServer2016,
    client: Client,
    packet: ReceivedPacket<GetContinentBattleInfo>
  ) {
    server.sendData<ContinentBattleInfo>(client, "ContinentBattleInfo", {
      zones: [
        {
          id: 1,
          nameId: 1,
          descriptionId: 1,
          population: [],
          regionPercent: [],
          populationBuff: [],
          populationTargetPercent: [],
          name: "Z1", // could use this field to load a specific TileInfo
          hexSize: 100,
          isProductionZone: 1
        }
      ]
    });
  }
  async ChatChat(
    server: ZoneServer2016,
    client: Client,
    packet: ReceivedPacket<ChatChat>
  ) {
    const { channel, message } = packet.data; // leave channel for later

    if (!server._soloMode) {
      server._db.collection(DB_COLLECTIONS.CHAT).insertOne({
        loginSessionId: client.loginSessionId,
        characterName: client.character.name,
        serverId: server._worldId,
        message
      });
    }

    if (await server.chatManager.checkMute(server, client)) {
      server.sendChatText(client, "You are muted!");
      return;
    }
    server.chatManager.sendChatToAllInRange(
      server,
      client,
      message as string,
      300
    );
  }
  ClientInitializationDetails(
    server: ZoneServer2016,
    client: Client,
    packet: ReceivedPacket<ClientInitializationDetails>
  ) {
    // just in case
    if (packet.data.unknownDword1) {
      debug("ClientInitializationDetails : ", packet.data.unknownDword1);
    }
  }
  ClientLogout(
    server: ZoneServer2016,
    client: Client,
    packet: ReceivedPacket<object>
  ) {
    debug("ClientLogout");
    if (client.hudTimer) {
      clearTimeout(client.hudTimer); // clear the timer started at StartLogoutRequest
    }
    if (client.properlyLogout) {
      server.deleteClient(client);
    }
  }
  GameTimeSync(
    server: ZoneServer2016,
    client: Client,
    packet: ReceivedPacket<object>
  ) {
    server.sendGameTimeSync(client);
  }
  Synchronization(
    server: ZoneServer2016,
    client: Client,
    packet: ReceivedPacket<Synchronization>
  ) {
    const currentTime = getCurrentServerTimeWrapper();
    const serverTime = currentTime.getFullString();
    const reflectedPacket: Synchronization = {
      ...packet.data,
      serverTime: serverTime,
      serverTime2: serverTime,
      time3: currentTime.getTruncatedU32String()
    };
    server.sendData<Synchronization>(
      client,
      "Synchronization",
      reflectedPacket
    );
    const groupId = client.character.groupId;
    if (groupId) {
      server.groupManager.syncGroup(server, groupId);
    }
    if (client.isSynced) return;
    client.isSynced = true;
    client.character.lastLoginDate = toHex(Date.now());
    server.constructionManager.constructionPermissionsManager(server, client);
  }
  CommandExecuteCommand(
    server: ZoneServer2016,
    client: Client,
    packet: ReceivedPacket<CommandExecuteCommand>
  ) {
    const hash = packet.data.commandHash ?? 0;
    if (server.commandHandler.commands[hash]) {
      const command = server.commandHandler.commands[hash];
      if (command?.name == "!!h1custom!!") {
        this.handleCustomPacket(server, client, packet.data.arguments ?? "");
        return;
      }
    }
    server.commandHandler.executeCommand(server, client, packet);
  }
  CommandInteractRequest(
    server: ZoneServer2016,
    client: Client,
    packet: ReceivedPacket<CommandInteractRequest>
  ) {
    const entity = server.getEntity(packet.data.characterId || "");
    if (!entity) return;
    const isConstruction =
      entity instanceof ConstructionParentEntity ||
      entity instanceof ConstructionDoor;

    const isLootable =
      entity instanceof LootableConstructionEntity || entity instanceof Lootbag;
    if (
      !isPosInRadiusWithY(
        entity.interactionDistance || server.interactionDistance,
        client.character.state.position,
        isConstruction
          ? entity.fixedPosition || entity.state.position
          : entity.state.position,
        isLootable ? 1.7 : 5
      )
    ) {
      return;
    }
    client.character.lastInteractionRequestGuid = entity.characterId;
    entity.OnPlayerSelect(server, client, packet.data.isInstant);
  }
  CommandInteractCancel(
    server: ZoneServer2016,
    client: Client,
    packet: ReceivedPacket<object>
  ) {
    debug("Interaction Canceled");
  }
  CommandStartLogoutRequest(
    server: ZoneServer2016,
    client: Client,
    packet: ReceivedPacket<object>
  ) {
    client.posAtTimerStart = client.character.state.position;
    if (!client.character.isAlive) {
      client.properlyLogout = true;
      // Exit to menu button on respawn screen
      server.sendData<ClientUpdateCompleteLogoutProcess>(
        client,
        "ClientUpdate.CompleteLogoutProcess",
        {}
      );
      return;
    }
    server.dismountVehicle(client);
    client.character.dismountContainer(server);
    const timerTime = 10000;
    server.utilizeHudTimer(client, 0, timerTime, 0, () => {
      // Clear spectator on logout to prevent the client from crashing on the next login - Jason
      if (client.character.isSpectator) {
        server.commandHandler.executeInternalCommand(
          server,
          client,
          "spectate",
          []
        );
      }
      client.properlyLogout = true;
      server.sendData<ClientUpdateCompleteLogoutProcess>(
        client,
        "ClientUpdate.CompleteLogoutProcess",
        {}
      );
    });
  }
  CharacterSelectSessionRequest(
    server: ZoneServer2016,
    client: Client,
    packet: ReceivedPacket<object>
  ) {
    server.sendData<CharacterSelectSessionResponse>(
      client,
      "CharacterSelectSessionResponse",
      {
        status: 0,
        sessionId: client.loginSessionId
      }
    );
  }
  ProfileStatsGetPlayerProfileStats(
    server: ZoneServer2016,
    client: Client,
    packet: ReceivedPacket<object>
  ) {
    // server.sendData<>(
    //   client,
    //   "ProfileStats.PlayerProfileStats",
    //   require("../../../data/profilestats.json")
    // );
  }
  async WallOfDataClientSystemInfo(
    server: ZoneServer2016,
    client: Client,
    packet: ReceivedPacket<WallOfDataClientSystemInfo>
  ) {
    const info = packet.data.info;
    if (!info) return;
    const startPos = info.search("Device") + 9;
    const cut = info.substring(startPos, info.length);
    client.HWID = cut.substring(0, cut.search(",") - 1);
    const hwidBanned: ClientBan = (await server._db
      ?.collection(DB_COLLECTIONS.BANNED)
      .findOne({ HWID: client.HWID, active: true })) as unknown as ClientBan;
    if (hwidBanned?.expirationDate < Date.now()) {
      //client.banType = hwidBanned.banType;
      //server.enforceBan(client);
    }
  }
  DtoHitSpeedTreeReport(
    server: ZoneServer2016,
    client: Client,
    packet: ReceivedPacket<DtoHitSpeedTreeReport>
  ) {
    server.speedtreeManager.use(
      server,
      client,
      packet.data.id,
      packet.data.treeId,
      packet.data.name
    );
  }
  GetRewardBuffInfo(
    server: ZoneServer2016,
    client: Client,
    packet: ReceivedPacket<object>
  ) {
    server.sendData<RewardBuffInfo>(client, "RewardBuffInfo", {
      unknownFloat1: 1,
      unknownFloat2: 2,
      unknownFloat3: 3,
      unknownFloat4: 4,
      unknownFloat5: 5,
      unknownFloat6: 6,
      unknownFloat7: 7,
      unknownFloat8: 8,
      unknownFloat9: 9,
      unknownFloat10: 10,
      unknownFloat11: 11,
      unknownFloat12: 12
    });
  }
  async PlayerUpdateManagedPosition(
    server: ZoneServer2016,
    client: Client,
    packet: ReceivedPacket<PlayerUpdateManagedPosition>
  ) {
    // Early exit if no data or transientId is missing
    const packetData = packet.data;
    if (!packetData || !packetData.transientId) {
      console.log("TransientId error detected", packet);
      return;
    }

    const positionUpdate = packetData.positionUpdate as any;
    const flags = positionUpdate.flags;
    if (!flags) return;

    // throwable projectiles management

    if (positionUpdate.unknown3_int8 === 10) {
      const transientId = (packetData.transientId as number) || 0;
      const characterId = server._transientIds[transientId];
      const projectile = characterId
        ? server._throwableProjectiles[characterId]
        : undefined;
      if (projectile) {
        server.sendRawToAllOthersWithSpawnedEntity(
          client,
          server._throwableProjectiles,
          characterId,
          server._protocol.createManagedPositionBroadcast2016(
            positionUpdate.raw
          )
        );
        if (positionUpdate.position)
          projectile.state.position = positionUpdate.position;
      }
    }

    // Airdrop management
    if (positionUpdate.unknown3_int8 === 5) {
      if (!server._airdrop || !positionUpdate.position) return;

      const airdropManager = server._airdrop.manager;
      if (
        airdropManager?.character.characterId !== client.character.characterId
      )
        return;

      // Update plane position and orientation
      server._airdrop.plane.state.position = new Float32Array([
        positionUpdate.position[0],
        400,
        positionUpdate.position[2],
        1
      ]);
      server._airdrop.plane.positionUpdate.orientation =
        positionUpdate.orientation;
      server._airdrop.plane.state.rotation = eul2quat(
        new Float32Array([positionUpdate.orientation, 0, 0, 0])
      );

      // Handle airdrop release
      if (
        !server._airdrop.cargoSpawned &&
        server._airdrop.cargo &&
        isPosInRadius(
          150,
          positionUpdate.position,
          server._airdrop.destinationPos
        )
      ) {
        server._airdrop.cargoSpawned = true;

        // Disabling the alert, manager is usually not the person who called an airdrop
        //server.sendAlert(server._airdrop.manager, "Air drop released. The package is delivered.");

        setTimeout(() => {
          if (server._airdrop?.cargo) {
            for (const client of Object.values(server._clients)) {
              if (!client.firstLoading && !client.isLoading) {
                const vehicleData =
                  server._airdrop.cargo.pGetFullVehicle(server);
                server.sendData(client, "AddLightweightVehicle", {
                  ...server._airdrop.cargo.pGetLightweightVehicle(),
                  unknownGuid1: server.generateGuid()
                });
                server.sendData(client, "Character.MovementVersion", {
                  characterId: server._airdrop.cargo.characterId,
                  version: 6
                });
                server.sendData(
                  client,
                  "LightweightToFullVehicle",
                  vehicleData as any
                );
                server.sendData(client, "Character.SeekTarget", {
                  characterId: server._airdrop.cargo.characterId,
                  TargetCharacterId: server._airdrop.cargoTarget,
                  initSpeed: -5,
                  acceleration: 0,
                  speed: 0,
                  turn: 5,
                  yRot: 0
                });
                server.sendData(client, "Character.ManagedObject", {
                  objectCharacterId: server._airdrop.cargo.characterId,
                  characterId: client.character.characterId
                });
              }
            }
          }
        }, 4500);
      }
      return;
    }

    // Airdrop container spawn handling
    if (positionUpdate.unknown3_int8 === 6) {
      if (
        !server._airdrop ||
        !positionUpdate.position ||
        !server._airdrop.cargo
      )
        return;
      if (
        server._airdrop.manager?.character.characterId !==
        client.character.characterId
      )
        return;

      server._airdrop.cargo.state.position[1] = positionUpdate.position[1]; // Update Y position only
      server._airdrop.cargo.positionUpdate.orientation =
        positionUpdate.orientation;

      if (
        !server._airdrop.containerSpawned &&
        positionUpdate.position[1] <= server._airdrop.destinationPos[1] + 2
      ) {
        server._airdrop.containerSpawned = true;
        server.worldObjectManager.createAirdropContainer(
          server,
          server._airdrop.destinationPos,
          server._airdrop.forcedAirdropType
        );
        for (const client of Object.values(server._clients)) {
          server.airdropManager(client, false);
        }
        delete server._airdrop;
      }
      return;
    }

    // Vehicle handling
    const transientId = (packetData.transientId as number) || 0;
    const characterId = server._transientIds[transientId];
    const vehicle = characterId ? server._vehicles[characterId] : undefined;

    if (!vehicle) {
      if (client.character.isSpectator && positionUpdate.position) {
        client.character.state.position = positionUpdate.position;
      }
      return;
    }

    // Block cheaters spawning cars on top of people's heads
    if (!client.managedObjects.includes(vehicle.characterId)) return;

    if (!client.character.isAlive) {
      client.blockedPositionUpdates++;
      if (client.blockedPositionUpdates >= 50) {
        server.updateCharacterState(
          client,
          client.character.characterId,
          client.character.characterStates,
          false
        );
        server.sendData(client, "Character.StartMultiStateDeath", {
          data: { characterId: client.character.characterId }
        });
        client.blockedPositionUpdates = 0;
        return;
      }
    } else {
      client.blockedPositionUpdates = 0;
    }

    if (positionUpdate.position) {
      // Position flag
      /*if (
        await server.fairPlayManager.checkVehicleSpeed(
          server,
          client,
          positionUpdate.sequenceTime,
          positionUpdate.position,
          vehicle
        )
      )
        return;

      const dist = getDistance(
        vehicle.positionUpdate.position,
        positionUpdate.position
      );
      if (
        dist > 220 ||
        getDistance1d(vehicle.oldPos.position[1], positionUpdate.position[1]) >
          100
      ) {
        server.kickPlayer(client);
        server.sendChatTextToAdmins(
          `FairPlay: kicking ${client.character.name} for suspected teleport in vehicle by ${dist} from [${vehicle.positionUpdate.position.join(", ")}] to [${positionUpdate.position.join(", ")}]`,
          false
        );
        return;
      }*/

      // Update passenger positions and handle kicks if necessary
      vehicle.getPassengerList().forEach((passengerId) => {
        const passenger = server._characters[passengerId];
        if (passenger) {
          passenger.state.position = positionUpdate.position;
          const c = server.getClientByCharId(passengerId);
          if (c) c.startLoc = positionUpdate.position[1];
        } else {
          vehicle.removePassenger(passengerId);
        }
      });
      const adjustedPosValue = vehicle.vehicleId == 5 ? 0.2 : 0.8;
      const fixedPosUpdate = new Float32Array([
        positionUpdate.position[0],
        positionUpdate.position[1] - adjustedPosValue,
        positionUpdate.position[2],
        1
      ]);
      // Update vehicle position
      vehicle.state.position = fixedPosUpdate;
      vehicle.oldPos = {
        position: positionUpdate.position,
        time: positionUpdate.sequenceTime
      };
      vehicle.positionUpdate.position = fixedPosUpdate;

      // Stop HUD timer if player moved
      if (
        client.hudTimer &&
        !isPosInRadius(
          1,
          client.character.state.position,
          client.posAtTimerStart
        )
      ) {
        server.stopHudTimer(client);
        delete client.hudTimer;
      }
    }

    // Send position updates to other clients
    if (packetData.transientId !== server._characterIds[OBSERVER_GUID]) {
      server.sendRawToAllOthersWithSpawnedEntity(
        client,
        server._vehicles,
        characterId,
        server._protocol.createManagedPositionBroadcast2016(positionUpdate.raw)
      );
    }

    // Update engineRPM, orientation, frontTilt, sideTilt based on flags
    if (positionUpdate.engineRPM) vehicle.engineRPM = positionUpdate.engineRPM;
    if (positionUpdate.rotation) {
      vehicle.state.rotation = eul2quat(
        new Float32Array([positionUpdate.orientation, 0, 0, 0])
      );
      vehicle.positionUpdate.rotation = positionUpdate.rotation;
    }
    if (positionUpdate.orientation)
      vehicle.positionUpdate.orientation = positionUpdate.orientation;
    if (positionUpdate.frontTilt)
      vehicle.positionUpdate.frontTilt = positionUpdate.frontTilt;
    if (positionUpdate.sideTilt)
      vehicle.positionUpdate.sideTilt = positionUpdate.sideTilt;
  }
  VehicleStateData(
    server: ZoneServer2016,
    client: Client,
    packet: ReceivedPacket<VehicleStateData>
  ) {
    server.sendDataToAllOthersWithSpawnedEntity(
      server._vehicles,
      client,
      packet.data.guid,
      "Vehicle.StateData",
      {
        ...packet.data
      }
    );
  }
  PlayerUpdatePosition(
    server: ZoneServer2016,
    client: Client,
    packet: ReceivedPacket<any> // todo: remove any - Meme
  ) {
    const {
      flags,
      sequenceTime,
      position,
      rotation,
      rotationRaw,
      lookAt,
      stance
    } = packet.data;

    // Return early for spammed junk packets
    if (flags === 2 || packet.data.flags == 513) {
      return;
    }
    // Disable temporary god mode if enabled
    if (client.character.tempGodMode) server.setTempGodMode(client, false);
    // Update character's position
    client.character.positionUpdate = client.character.positionUpdate || {};
    Object.assign(client.character.positionUpdate, packet.data);

    if (packet.data.orientation) {
      // orientation
      /*server.fairPlayManager.checkAimVector(
        server,
        client,
        packet.data.orientation
      );*/
    }
    // Handle dead character state
    if (!client.character.isAlive) {
      client.blockedPositionUpdates++;
      if (client.blockedPositionUpdates >= 30) {
        server.updateCharacterState(
          client,
          client.character.characterId,
          client.character.characterStates,
          false
        );
        server.sendData<CharacterStartMultiStateDeath>(
          client,
          "Character.StartMultiStateDeath",
          { data: { characterId: client.character.characterId } }
        );
        return;
      }
    } else {
      client.blockedPositionUpdates = 0;
    }

    // Handle stance flag (0x01)
    if (packet.data.stance) {
      const stanceFlags = getStanceFlags(stance);

      // Detect movements based on stance
      server.fairPlayManager.detectJumpXSMovement(server, client, stanceFlags);
      server.fairPlayManager.detectDroneMovement(server, client, stanceFlags);
      server.detectEnasMovement(server, client, stanceFlags);

      // Handle jump logic
      if (
        stanceFlags.JUMPING &&
        stanceFlags.FLOATING &&
        !stanceFlags.ON_GROUND &&
        !client.isInAir &&
        !client.vehicle.mountedVehicle
      ) {
        client.isInAir = true;
        client.startLoc = client.character.state.position[1];
      } else if (!stanceFlags.FLOATING && client.isInAir) {
        client.isInAir = false;
      }

      // Handle sitting logic
      client.character.isSitting =
        stanceFlags.SITTING &&
        stanceFlags.ON_GROUND &&
        !client.vehicle.mountedVehicle
          ? true
          : stanceFlags.SITTING
            ? false
            : client.character.isSitting;

      // Update running state
      client.character.isRunning = stanceFlags.SPRINTING;

      // Handle jump penalty
      if (
        stanceFlags.JUMPING &&
        !stanceFlags.FLOATING &&
        client.character.lastJumpTime < sequenceTime &&
        !client.character.isGodMode()
      ) {
        client.character.lastJumpTime = sequenceTime + 1100;
        client.character._resources[ResourceIds.STAMINA] = Math.max(
          0,
          client.character._resources[ResourceIds.STAMINA] - 12
        );
        server.updateResourceToAllWithSpawnedEntity(
          client.character.characterId,
          client.character._resources[ResourceIds.STAMINA],
          ResourceIds.STAMINA,
          ResourceTypes.STAMINA,
          server._characters
        );
      }

      // Update character stance
      client.character.stance = stance;
      client.character.positionUpdate.stance = stance;
    }
    // Handle position flag (0x02)
    if (packet.data.position) {
      if (!client.characterReleased) client.characterReleased = true;
      // if (client.movementSet.size < ZoneClient2016.minMovementForAfk) {
      //   const movementId = Math.round(position[0]) + Math.round(position[2]);
      //   client.movementSet.add(movementId);
      // }

      // skip fairplay for performance test

      /*if (
        await server.fairPlayManager.checkPlayerSpeed(
          server,
          client,
          packet.data.sequenceTime,
          packet.data.position
        )
      )
        return;*/

      // Update character position
      client.character.state.position = position;

      // Stop HUD timer if position is out of radius
      if (
        client.hudTimer &&
        !isPosInRadius(
          1,
          client.character.state.position,
          client.posAtTimerStart
        )
      ) {
        server.stopHudTimer(client);
        delete client.hudTimer;
      }

      // Handle dismounting from container if out of range
      if (
        client.character.mountedContainer &&
        !server._vehicles[client.character.mountedContainer.characterId] &&
        !isPosInRadius(
          client.character.mountedContainer.interactionDistance,
          client.character.state.position,
          client.character.mountedContainer.state.position
        )
      ) {
        client.character.dismountContainer(server);
      }

      // Check current interaction
      client.character.checkCurrentInteractionGuid();

      // Timeout interaction lock UI
      if (
        client.character.lastInteractionRequestGuid &&
        client.character.lastInteractionTime + 60000 > Date.now()
      ) {
        client.character.lastInteractionRequestGuid = "";
        client.character.lastInteractionTime = 0;
      }
    }
    // Handle rotation flag (0x200)
    if (packet.data.rotation) {
      client.character.state.rotation = rotation;
      client.character.state.yaw = rotationRaw[0];
      client.character.state.lookAt = lookAt;
    }

    // Sync decoy position for spectators and vanished characters
    if (
      (client.character.isSpectator || client.character.isVanished) &&
      _.size(server._decoys) > 0 &&
      client.isDecoy
    ) {
      server.sendDataToAllWithSpawnedEntity(
        server._characters,
        client.character.characterId,
        "PlayerUpdatePosition",
        {
          transientId: client.character.transientId,
          positionUpdate: packet.data
        }
      );
    }
  }
  CharacterRespawn(
    server: ZoneServer2016,
    client: Client,
    packet: ReceivedPacket<CharacterRespawn>
  ) {
    server.commandHandler.executeInternalCommand(
      server,
      client,
      "respawn",
      packet
    );
  }
  SpectatorTeleport(
    server: ZoneServer2016,
    client: Client,
    packet: ReceivedPacket<SpectatorTeleport>
  ) {
    const { x, y } = packet.data;
    if (x == null || y == null) return;
    server.dropAllManagedObjects(client);
    server.sendData<ClientUpdateUpdateLocation>(
      client,
      "ClientUpdate.UpdateLocation",
      {
        position: new Float32Array([x, 355, y, 1]),
        triggerLoadingScreen: false
      }
    );
    server.sendData<ClientUpdateUpdateManagedLocation>(
      client,
      "ClientUpdate.UpdateManagedLocation",
      {
        characterId: OBSERVER_GUID,
        position: new Float32Array([
          x,
          client.character.state.position[1],
          y,
          1
        ])
      }
    );
  }
  CharacterFullCharacterDataRequest(
    server: ZoneServer2016,
    client: Client,
    packet: ReceivedPacket<CharacterFullCharacterDataRequest>
  ) {
    if (packet.data.characterId == EXTERNAL_CONTAINER_GUID) {
      server.sendData<LightweightToFullNpc>(client, "LightweightToFullNpc", {
        transientId: 0,
        attachmentData: [],
        characterId: EXTERNAL_CONTAINER_GUID,
        resources: {
          data: []
        },
        effectTags: [],
        unknownData1: {},
        targetData: {},
        unknownArray1: [],
        unknownArray2: [],
        unknownArray3: { data: [] },
        unknownArray4: {},
        unknownArray5: { data: [] },
        remoteWeapons: {
          isVehicle: false,
          data: {}
        },
        itemsData: {
          items: [],
          unknownDword1: 0
        }
      });
      return;
    }

    if (server._airdrop) {
      if (server._airdrop.plane.characterId == packet.data.characterId) {
        server._airdrop.plane.OnFullCharacterDataRequest(server, client);
        return;
      } else if (
        server._airdrop.cargo &&
        server._airdrop.cargo.characterId == packet.data.characterId
      ) {
        server._airdrop.cargo.OnFullCharacterDataRequest(server, client);
        return;
      }
    }

    const entity = server.getEntity(packet.data.characterId);
    if (!(entity instanceof BaseFullCharacter) && !(entity instanceof Plant)) {
      return;
    }
    entity.OnFullCharacterDataRequest(server, client);
  }
  CommandPlayerSelect(
    server: ZoneServer2016,
    client: Client,
    packet: ReceivedPacket<object>
  ) {
    debug("Command.PlayerSelect");
  }
  LocksSetLock(
    server: ZoneServer2016,
    client: Client,
    packet: ReceivedPacket<LocksSetLock>
  ) {
    if (!client.character.isAlive || client.isLoading) return;

    // if player hits cancel
    if (!packet.data.password || packet.data.password == 1) return;

    if (!client.character.lastInteractionRequestGuid) {
      server.sendAlert(client, "Invalid door entity!");
      return;
    }
    const doorEntity = server._constructionDoors[
      client.character.lastInteractionRequestGuid
    ] as ConstructionDoor;
    if (!doorEntity) {
      server.sendAlert(client, "Invalid door entity!");
      return;
    }
    const now = Date.now(),
      then = client.character.lastLockFailure,
      diff = now - then;
    if (diff <= 5000) {
      server.sendAlert(client, "Please wait 5 seconds between attempts.");
      return;
    }
    if (
      !isPosInRadius(
        client.character.interactionDistance * 4.0,
        client.character.state.position,
        doorEntity.fixedPosition
          ? doorEntity.fixedPosition
          : doorEntity.state.position
      )
    ) {
      server.sendAlert(client, "Code lock failed!");
      return;
    }
    if (
      doorEntity.ownerCharacterId === client.character.characterId ||
      doorEntity.getHasPermission(
        server,
        client.character.characterId,
        ConstructionPermissionIds.DEMOLISH
      )
    ) {
      if (doorEntity.passwordHash != packet.data.password) {
        doorEntity.passwordHash = packet.data.password;
        doorEntity.grantedAccess = [];
        doorEntity.grantedAccess.push(client.character.characterId);
        if (client.character.characterId != doorEntity.ownerCharacterId) {
          doorEntity.grantedAccess.push(doorEntity.ownerCharacterId);
        }
      }
      return;
    }
    if (
      doorEntity.passwordHash === packet.data.password &&
      !doorEntity.grantedAccess.includes(client.character.characterId)
    ) {
      doorEntity.grantedAccess.push(client.character.characterId);
      const parent = doorEntity.getParentFoundation(server);
      if (!parent) return;
      if (parent.permissions[client.character.characterId]) return;
      if (Object.keys(parent.permissions).length >= 16) {
        server.sendAlert(client, "Permissions limit reached.");
        return;
      }
      parent.permissions[client.character.characterId] = {
        characterId: client.character.characterId,
        characterName: client.character.name,
        useContainers: false,
        build: false,
        demolish: false,
        visit: true
      };
    } else {
      client.character.lastLockFailure = now;
      const damageInfo: DamageInfo = {
        entity: "Server.InvalidLockCode",
        damage: 1000
      };
      client.character.damage(server, damageInfo);
    }
  }
  MountDismountRequest(
    server: ZoneServer2016,
    client: Client,
    packet: ReceivedPacket<object>
  ) {
    // only for driver seat
    server.dismountVehicle(client);
  }
  VehicleCurrentMoveMode(
    server: ZoneServer2016,
    client: Client,
    packet: ReceivedPacket<VehicleCurrentMoveMode>
  ) {
    const { characterId, moveMode } = packet.data,
      vehicle = server._vehicles[characterId as string];
    if (!vehicle) return;
    debug(
      `vehTransient:${vehicle.transientId} , mode: ${moveMode} from ${
        client.character.name
      } time:${Date.now()}`
    );
  }
  VehicleDismiss(
    server: ZoneServer2016,
    client: Client,
    packet: ReceivedPacket<object>
  ) {
    const vehicleGuid = client.vehicle.mountedVehicle;
    if (vehicleGuid) {
      server.dismountVehicle(client);
      server.dismissVehicle(vehicleGuid);
    }
  }
  VehicleAccessType(
    server: ZoneServer2016,
    client: Client,
    packet: ReceivedPacket<VehicleAccessType>
  ) {
    const vehicle = server._vehicles[packet.data.vehicleGuid ?? ""],
      accessType = packet.data.accessType ?? 0;
    vehicle.setLockState(server, client, !!accessType);
  }
  CommandInteractionString(
    server: ZoneServer2016,
    client: Client,
    packet: ReceivedPacket<CommandInteractionString>
  ) {
    const guid = packet.data.guid || "",
      entity = server.getEntity(guid);

    if (!entity) return;
    if (entity instanceof Crate) {
      client.character.currentInteractionGuid = guid;
      client.character.lastInteractionStringTime = Date.now();
      return;
    }
    const isConstruction =
      entity instanceof ConstructionParentEntity ||
      entity instanceof ConstructionChildEntity ||
      entity instanceof ConstructionDoor;
    if (
      !isPosInRadius(
        entity.interactionDistance || server.interactionDistance,
        client.character.state.position,
        isConstruction
          ? entity.fixedPosition || entity.state.position
          : entity.state.position
      )
    ) {
      return;
    }
    client.character.currentInteractionGuid = guid;
    client.character.lastInteractionStringTime = Date.now();
    const isNonReplicatable =
      entity instanceof Destroyable || entity instanceof Character2016;
    if (
      entity instanceof BaseLightweightCharacter &&
      !isNonReplicatable &&
      !client.sentInteractionData.includes(entity)
    ) {
      server.sendData<ReplicationNpcComponent>(
        client,
        "Replication.NpcComponent",
        {
          transientId: entity.transientId,
          nameId: entity.nameId
        }
      );
      client.sentInteractionData.push(entity);
      if (
        !(
          entity instanceof ConstructionParentEntity ||
          entity instanceof ConstructionChildEntity ||
          entity instanceof LootableConstructionEntity
        )
      ) {
        server.sendData<ReplicationInteractionComponent>(
          client,
          "Replication.InteractionComponent",
          {
            transientId: entity.transientId
          }
        );
      }
    }
    entity.OnInteractionString(server, client);
  }
  MountSeatChangeRequest(
    server: ZoneServer2016,
    client: Client,
    packet: ReceivedPacket<MountSeatChangeRequest>
  ) {
    server.changeSeat(client, packet);
  }
  ConstructionPlacementFinalizeRequest(
    server: ZoneServer2016,
    client: Client,
    packet: ReceivedPacket<ConstructionPlacementFinalizeRequest>
  ) {
    if (
      !packet.data.itemDefinitionId ||
      !packet.data.rotation1 ||
      !packet.data.rotation2 ||
      !packet.data.position2
    ) {
      return;
    }
    const array = new Float32Array([
      packet.data.rotation1[3],
      packet.data.rotation1[1],
      packet.data.rotation2[2]
    ]);
    const matrix = quat2matrix(array);
    const euler = [
      Math.atan2(matrix[7], matrix[8]),
      Math.atan2(
        -matrix[6],
        Math.sqrt(Math.pow(matrix[7], 2) + Math.pow(matrix[8], 2))
      ),
      Math.atan2(matrix[3], matrix[0])
    ];
    let final;
    if (euler[0] >= 0) {
      final = new Float32Array([euler[1], 0, 0, 0]);
    } else {
      final = new Float32Array([euler[2], 0, 0, 0]);
    }
    if (Math.abs(final[0]) < 0.01) {
      final[0] = 0;
    }
    const modelId = server.getItemDefinition(
      packet.data.itemDefinitionId
    )?.PLACEMENT_MODEL_ID;
    if (!modelId) {
      console.log(
        `[ERROR] No PLACEMENT_MODEL_ID for ${packet.data.itemDefinitionId} from characterId ${client.character.characterId}`
      );
      server.sendChatText(
        client,
        `[ERROR] No PLACEMENT_MODEL_ID for ${packet.data.itemDefinitionId}`
      );
      return;
    }

    const scale = packet.data.scale || new Float32Array([1, 1, 1, 1]);
    server.constructionManager.placement(
      server,
      client,
      packet.data.itemDefinitionId,
      modelId,
      packet.data.position2,
      final,
      scale,
      packet.data.parentObjectCharacterId || "",
      packet.data.BuildingSlot || ""
    );
  }
  CommandItemDefinitionRequest(
    server: ZoneServer2016,
    client: Client,
    packet: ReceivedPacket<CommandItemDefinitionRequest>
  ) {
    debug(`ItemDefinitionRequest ID: ${packet.data.ID}`);

    const itemDef = server.getItemDefinition(packet.data.ID);

    if (!itemDef) {
      debug(
        `ERROR: No ItemDefinition found for ItemDefinitonID: ${packet.data.ID}`
      );
      return;
    }
    server.sendData<CommandItemDefinitionReply>(
      client,
      "Command.ItemDefinitionReply",
      {
        data: {
          ID: itemDef.ID,
          definitionData: {
            ...itemDef,
            HUD_IMAGE_SET_ID: itemDef.IMAGE_SET_ID,
            ITEM_TYPE_1: itemDef.ITEM_TYPE,
            flags1: {
              ...itemDef
            },
            flags2: {
              ...itemDef
            },
            stats: []
          }
        }
      }
    );
    if (server.isContainer(itemDef.ID)) {
      // Fixes containers missing an itemdefinition not showing in inventory
      client.character.updateLoadout(server);
    }
  }
  CharacterWeaponStance(
    server: ZoneServer2016,
    client: Client,
    packet: ReceivedPacket<CharacterWeaponStance>
  ) {
    const stance = packet.data.stance;
    if (typeof stance !== "number") return;
    if (client.character.positionUpdate) {
      client.character.weaponStance = stance;
    }
    server.sendDataToAllOthersWithSpawnedEntity(
      server._characters,
      client,
      client.character.characterId,
      "Character.WeaponStance",
      {
        characterId: client.character.characterId,
        stance: stance
      }
    );
  }
  CommandRedeploy(
    server: ZoneServer2016,
    client: Client,
    packet: ReceivedPacket<object>
  ) {
    const damageInfo: DamageInfo = {
      entity: "",
      damage: 0
    };
    server.killCharacter(client, damageInfo);
  }
  FirstTimeEventInventoryAccess(
    server: ZoneServer2016,
    client: Client,
    packet: ReceivedPacket<object>
  ) {
    client.character.isInInventory = !client.character.isInInventory;
    if (client.character.isInInventory) {
      const proximityItems = server.getProximityItems(client);
      server.sendData<ClientUpdateProximateItems>(
        client,
        "ClientUpdate.ProximateItems",
        proximityItems
      );
    }
  }
  CommandSuicide(
    server: ZoneServer2016,
    client: Client,
    packet: ReceivedPacket<object>
  ) {
    server.killCharacter(client, {
      entity: client.character.characterId,
      damage: 9999
    });
  }
  //#region ITEMS
  async RequestUseItem(
    server: ZoneServer2016,
    client: Client,
    packet: ReceivedPacket<ItemsRequestUseItem>
  ) {
    debug(packet.data);
    const { itemGuid, itemUseOption, targetCharacterId, sourceCharacterId } =
      packet.data;
    const count =
      (packet.data.itemSubData as any)?.count ?? packet.data.itemCount;

    switch (itemUseOption) {
      case ItemUseOptions.HOTWIRE_OFFROADER:
      case ItemUseOptions.HOTWIRE_PICKUP:
      case ItemUseOptions.HOTWIRE_POLICE:
      case ItemUseOptions.HOTWIRE_ATV:
      case ItemUseOptions.HOTWIRE_ATV_NO_PARTS:
      case ItemUseOptions.HOTWIRE_OFFROADER_NO_PARTS:
      case ItemUseOptions.HOTWIRE_PICKUP_NO_PARTS:
      case ItemUseOptions.HOTWIRE_POLICE_NO_PARTS:
        break;
      default:
        if (!count || count < 1) return;
    }

    if (!itemGuid) {
      server.sendChatText(client, "[ERROR] ItemGuid is invalid!");
      return;
    }

    let character = server.getEntity(sourceCharacterId);

    if (!character && client.character.mountedContainer) {
      character = client.character.mountedContainer;
    }

    if (
      !character ||
      (!(character instanceof BaseLootableEntity) &&
        !(character instanceof Character2016))
    ) {
      server.sendChatText(client, "Invalid character!");
      return;
    }
    const animationId =
      server._itemUseOptions[itemUseOption ?? 0]?.animationId ?? 0;

    const item = character.getInventoryItem(itemGuid);
    if (!item) {
      server.containerError(client, ContainerErrors.NO_ITEM_IN_SLOT);
      return;
    }
    const loadoutSlotId = character.getActiveLoadoutSlot(itemGuid);
    if (
      loadoutSlotId &&
      character._containers[loadoutSlotId]?.itemGuid == itemGuid &&
      _.size(character._containers[loadoutSlotId].items) != 0
    ) {
      // prevents duping if client check is bypassed
      server.sendChatText(
        client,
        "[ERROR] Container must be empty to unequip."
      );
      return;
    }

    let container = character.getItemContainer(itemGuid);

    // check for item in mounted container
    if (!container && client.character.mountedContainer) {
      const mountedContainer = client.character.mountedContainer.getContainer();
      if (!mountedContainer) {
        server.containerError(client, ContainerErrors.NOT_CONSTRUCTED);
        return;
      }
      if (mountedContainer.items[item.itemGuid]) {
        container = mountedContainer;
      }
    }

    switch (itemUseOption) {
      case ItemUseOptions.DROP:
      case ItemUseOptions.DROP_BATTERY:
      case ItemUseOptions.DROP_SPARKS:
        server.dropItem(character, item, count, animationId);
        if (character instanceof BaseLootableEntity) {
          // remount container to keep items from changing slotIds
          client.character.mountContainer(server, character);
        }
        break;
      case ItemUseOptions.SLICE:
        server.sliceItem(client, character, item, animationId);
        break;
      case ItemUseOptions.EQUIP:
        const activeSlotId = client.character.getActiveLoadoutSlot(itemGuid);
        let loadoutSlotId = client.character.getAvailableLoadoutSlot(
          server,
          item.itemDefinitionId
        );
        if (server.isWeapon(item.itemDefinitionId)) {
          if (container) {
            const item = container.items[itemGuid];
            if (!item) {
              server.containerError(client, ContainerErrors.NO_ITEM_IN_SLOT);
              return;
            }
            if (!loadoutSlotId) {
              loadoutSlotId = server.getLoadoutSlot(item.itemDefinitionId);
            }
            client.character.currentLoadoutSlot = loadoutSlotId;
            client.character.equipContainerItem(
              server,
              item,
              loadoutSlotId,
              character
            );
          } else {
            if (!activeSlotId) {
              server.containerError(client, ContainerErrors.UNKNOWN_CONTAINER);
              return;
            }
            const loadoutItem = client.character._loadout[activeSlotId];
            if (!loadoutItem) {
              server.containerError(client, ContainerErrors.NO_ITEM_IN_SLOT);
              return;
            }
            server.switchLoadoutSlot(client, loadoutItem);
          }
        } else {
          if (activeSlotId) {
            server.sendChatText(client, "[ERROR] Item is already equipped!");
            return;
          }
          if (!container) {
            server.containerError(client, ContainerErrors.UNKNOWN_CONTAINER);
            return;
          }
          const item = container.items[itemGuid];
          if (!item) {
            server.containerError(client, ContainerErrors.NO_ITEM_IN_SLOT);
            return;
          }
          client.character.equipContainerItem(
            server,
            item,
            server.getLoadoutSlot(item.itemDefinitionId),
            character
          );
        }
        break;
      case ItemUseOptions.SHRED:
        server.shredItem(client, character, item, animationId);
        break;
      case ItemUseOptions.DRINK:
      case ItemUseOptions.EAT:
      case ItemUseOptions.USE_MEDICAL:
        server.useConsumable(client, character, item, animationId);
        break;
      case ItemUseOptions.USE_AIRDROP:
        const localCharacter = character;
        server.utilizeHudTimer(client, StringIds.AIRDROP_CODE, 3000, 0, () => {
          server.useAirdrop(client, localCharacter, item);
        });
        break;
      case ItemUseOptions.USE:
        server.useItem(client, character, item, animationId);
        break;
      case ItemUseOptions.REFUEL:
        server.refuelVehicle(
          client,
          character,
          item,
          targetCharacterId || "",
          animationId
        );
        break;
      case ItemUseOptions.IGNITE:
        server.igniteOption(client, item);
        break;
      case ItemUseOptions.UNLOAD:
        if (item.weapon) {
          item.weapon.unload(server, client);
        } else {
          const msg = `Unload weapon failed for item ${item.itemDefinitionId}. Please report this!`;
          server.sendAlert(client, msg);
          console.log(msg);
        }
        break;
      case ItemUseOptions.SALVAGE:
        for (let i = 0; i < count; i++) {
          await server.salvageAmmo(client, character, item, animationId);
        }
        break;
      case ItemUseOptions.LOOT:
        const containerEnt = client.character.mountedContainer,
          c = containerEnt?.getContainer();

        if (!containerEnt || !c) {
          server.containerError(client, ContainerErrors.UNKNOWN_CONTAINER);
          return;
        }

        client.character.lootItemFromContainer(server, c, item, count);

        // remount container to keep items from changing slotIds
        client.character.mountContainer(server, containerEnt);
        break;
      case ItemUseOptions.MOVE_VEHICLE_PARTS:
      case ItemUseOptions.MOVE_BATTERY:
      case ItemUseOptions.MOVE_SPARKS:
      case ItemUseOptions.MOVE:
        const sourceContainer = client.character.getItemContainer(itemGuid),
          targetCharacter = client.character.mountedContainer;

        if (
          !targetCharacter ||
          !(targetCharacter instanceof BaseLootableEntity) ||
          !isPosInRadius(
            targetCharacter.interactionDistance,
            client.character.state.position,
            targetCharacter.state.position
          )
        ) {
          server.sendChatText(client, "Invalid target character 1!");
          return;
        }

        if (!sourceContainer) {
          server.sendChatText(client, "Invalid source container 1!");
          return;
        }

        const targetContainer = targetCharacter.getContainer();

        if (!targetContainer) {
          server.sendChatText(client, "Invalid target container 1!");
          return;
        }

        if (targetCharacter instanceof Vehicle2016) {
          const loadOutSlot = targetCharacter.getAvailableLoadoutSlot(
            server,
            item.itemDefinitionId
          );
          if (loadOutSlot) {
            targetCharacter.equipContainerItem(
              server,
              item,
              loadOutSlot,
              character
            );
            return;
          }
        }

        sourceContainer.transferItem(server, targetContainer, item, 0, count);
        server.startInteractionTimer(client, 0, 0, 9);
        break;
      case ItemUseOptions.LOOT_BATTERY:
      case ItemUseOptions.LOOT_SPARKS:
      case ItemUseOptions.LOOT_VEHICLE_LOADOUT:
        const sourceCharacter = client.character.mountedContainer;
        if (!sourceCharacter) return;
        const loadoutItem =
          sourceCharacter.getLoadoutItem(itemGuid) ||
          sourceCharacter.getInventoryItem(itemGuid);
        const itemDef = server.getItemDefinition(loadoutItem?.itemDefinitionId);
        if (loadoutItem) {
          const container = client.character.getAvailableContainer(
            server,
            loadoutItem.itemDefinitionId,
            1
          );
          if (!container) {
            server.sendData<CharacterNoSpaceNotification>(
              client,
              "Character.NoSpaceNotification",
              {
                characterId: client.character.characterId
              }
            );
            return;
          }

          if (
            loadoutItem instanceof LoadoutItem &&
            character._loadout[item.slotId]
          ) {
            await server.pUtilizeHudTimer(
              client,
              itemDef?.NAME_ID ?? 0,
              1000,
              0
            );
            sourceCharacter.transferItemFromLoadout(
              server,
              container,
              loadoutItem
            );

            if (sourceCharacter instanceof Vehicle2016) {
              sourceCharacter.checkEngineRequirements(server, false);
            }

            return;
          }

          const sourceContainer = sourceCharacter.getContainerFromGuid(
            loadoutItem.containerGuid
          );
          if (sourceContainer) {
            sourceContainer.transferItem(
              server,
              container,
              loadoutItem,
              0,
              count
            );
          }
        }
        break;
      case ItemUseOptions.HOTWIRE_OFFROADER:
      case ItemUseOptions.HOTWIRE_PICKUP:
      case ItemUseOptions.HOTWIRE_POLICE:
      case ItemUseOptions.HOTWIRE_ATV:
        const vehicle = server._vehicles[client.vehicle.mountedVehicle || ""];
        if (!vehicle) return;
        vehicle.hotwire(server);
        break;
      case ItemUseOptions.HOTWIRE_ATV_NO_PARTS:
      case ItemUseOptions.HOTWIRE_OFFROADER_NO_PARTS:
      case ItemUseOptions.HOTWIRE_PICKUP_NO_PARTS:
      case ItemUseOptions.HOTWIRE_POLICE_NO_PARTS:
        const v = server._vehicles[client.vehicle.mountedVehicle || ""];
        if (!v) return;
        if (!v.hasFuel()) {
          server.sendAlert(
            client,
            "This vehicle will not run without fuel.  It can be created from animal fat or from corn based ethanol."
          );
          return;
        }
        server.sendAlert(
          client,
          "Parts may be required. Open vehicle loadout."
        );
        break;
      case ItemUseOptions.UNPACK:
      case ItemUseOptions.UNPACK_BUNDLE:
        server.useAmmoBox(client, character, item);
        break;
      case ItemUseOptions.REPAIR:
        const repairItem = client.character.getInventoryItem(
          (packet.data.itemSubData as any)?.targetItemGuid
        );
        if (!repairItem) {
          server.sendChatText(client, "[ERROR] Invalid weapon");
          return;
        }
        server.repairOption(client, character, item, repairItem, animationId);
        break;
      default:
        server.sendChatText(
          client,
          "[ERROR] ItemUseOption not mapped to a function."
        );
    }
  }
  ConstructionPlacementRequest(
    server: ZoneServer2016,
    client: Client,
    packet: ReceivedPacket<ConstructionPlacementRequest>
  ) {
    debug(packet.data);
    const modelId = server.getItemDefinition(
      packet.data.itemDefinitionId
    )?.PLACEMENT_MODEL_ID;
    if (!modelId) {
      server.sendChatText(
        client,
        `No PLACEMENT_MODEL_ID found for itemDefinitionId ${packet.data.itemDefinitionId}`
      );
      return;
    }
    server.sendData<ConstructionPlacementResponse>(
      client,
      "Construction.PlacementResponse",
      {
        itemDefinitionId: packet.data.itemDefinitionId,
        model: modelId
      }
    );
  }
  ContainerMoveItem(
    server: ZoneServer2016,
    client: Client,
    packet: ReceivedPacket</*ContainerMoveItem*/ any>
  ) {
    const {
      containerGuid,
      characterId,
      itemGuid,
      targetCharacterId,
      count,
      newSlotId
    } = packet.data;
    const sourceCharacterId = characterId;
    if (sourceCharacterId != targetCharacterId) {
      server.startInteractionTimer(client, 0, 0, 9);
    }
    if (client.character.mountedContainer) {
      if (
        !isPosInRadiusWithY(
          client.character.mountedContainer.interactionDistance,
          client.character.state.position,
          client.character.mountedContainer.state.position,
          2.5
        )
      ) {
        client.character.dismountContainer(server);
        return;
      }
    }

    if (sourceCharacterId == client.character.characterId) {
      const sourceCharacter = client.character;
      // from client container
      if (sourceCharacterId == targetCharacterId) {
        // from / to client container
        const sourceContainer = client.character.getItemContainer(
            itemGuid ?? ""
          ),
          targetContainer = client.character.getContainerFromGuid(
            containerGuid ?? ""
          );
        if (sourceContainer) {
          // from container
          const item = sourceContainer.items[itemGuid];
          if (!item) {
            server.containerError(client, ContainerErrors.NO_ITEM_IN_SLOT);
            return;
          }
          if (item.weapon) {
            const weaponAmmoId = server.getWeaponAmmoId(item.itemDefinitionId);
            if (item.itemDefinitionId != weaponAmmoId) {
              const ammo = server.generateItem(
                weaponAmmoId,
                item.weapon.ammoCount
              );
              if (
                ammo &&
                item.weapon.ammoCount > 0 &&
                item.weapon.itemDefinitionId != Items.WEAPON_REMOVER
              ) {
                sourceCharacter.lootContainerItem(
                  server,
                  ammo,
                  ammo.stackCount,
                  true
                );
              }
              item.weapon.ammoCount = 0;
            }
          }
          if (targetContainer) {
            // to container
            sourceContainer.transferItem(
              server,
              targetContainer,
              item,
              newSlotId,
              count
            );
          } else if (containerGuid == LOADOUT_CONTAINER_GUID) {
            // to loadout
            /*if (
              server.validateLoadoutSlot(
                item.itemDefinitionId,
                newSlotId,
                client.character.loadoutId
              )
            ) {*/
            sourceCharacter.equipContainerItem(server, item, newSlotId);
            //}
          } else {
            // invalid
            server.containerError(client, ContainerErrors.UNKNOWN_CONTAINER);
          }
        } else {
          // from loadout or invalid

          // loadout
          const loadoutItem = sourceCharacter.getLoadoutItem(itemGuid ?? "");
          if (!loadoutItem) {
            server.containerError(client, ContainerErrors.NO_ITEM_IN_SLOT);
            return;
          }
          if (targetContainer) {
            sourceCharacter.transferItemFromLoadout(
              server,
              targetContainer,
              loadoutItem
            );
          } else if (containerGuid == LOADOUT_CONTAINER_GUID) {
            // to loadout
            const loadoutItem = client.character.getLoadoutItem(itemGuid ?? "");
            if (!loadoutItem) {
              server.containerError(client, ContainerErrors.NO_ITEM_IN_SLOT);
              return;
            }
            if (loadoutItem.itemDefinitionId == 1899)
              loadoutItem.itemDefinitionId = 1373; // Remove this next wipe
            loadoutItem.transferLoadoutItem(
              server,
              targetCharacterId,
              newSlotId
            );
          } else {
            // invalid
            server.containerError(client, ContainerErrors.UNKNOWN_CONTAINER);
          }
        }
      } else {
        // to external container
        const sourceContainer = sourceCharacter.getItemContainer(
            itemGuid ?? ""
          ),
          targetCharacter = sourceCharacter.mountedContainer;

        if (
          !targetCharacter ||
          !(targetCharacter instanceof BaseLootableEntity) ||
          !isPosInRadius(
            targetCharacter.interactionDistance,
            sourceCharacter.state.position,
            targetCharacter.state.position
          )
        ) {
          server.sendChatText(client, "Invalid target character 2!");
          return;
        }

        const targetContainer = targetCharacter.getContainer();
        if (!targetContainer) {
          server.sendChatText(client, "Invalid target container 2!");
          return;
        }

        const loadoutItem = sourceCharacter.getLoadoutItem(itemGuid ?? "");
        if (loadoutItem) {
          if (
            !targetContainer.getHasSpace(
              server,
              loadoutItem.itemDefinitionId,
              loadoutItem.stackCount
            ) ||
            Object.values(targetContainer.items).length >=
              targetContainer.getMaxSlots(server)
          ) {
            server.containerError(client, ContainerErrors.NO_SPACE);
            return;
          }
          if (loadoutItem.itemDefinitionId == 1899)
            loadoutItem.itemDefinitionId = 1373; // Remove this next wipe
          sourceCharacter.transferItemFromLoadout(
            server,
            targetContainer,
            loadoutItem
          );
          sourceCharacter.mountContainer(server, targetCharacter);
          return;
        }

        if (!sourceContainer) {
          server.sendChatText(client, "Invalid source container 2!");
          return;
        }

        const item = sourceContainer.items[itemGuid ?? ""];
        if (!item) {
          server.containerError(client, ContainerErrors.NO_ITEM_IN_SLOT);
          return;
        }

        if (
          !targetContainer.getHasSpace(
            server,
            item.itemDefinitionId,
            item.stackCount
          ) ||
          Object.values(targetContainer.items).length >=
            targetContainer.getMaxSlots(server)
        ) {
          server.containerError(client, ContainerErrors.NO_SPACE);
          return;
        }

        if (containerGuid == LOADOUT_CONTAINER_GUID) {
          // to loadout
          if (
            !server.validateLoadoutSlot(
              item.itemDefinitionId,
              newSlotId,
              targetCharacter.loadoutId
            )
          ) {
            return;
          }

          targetCharacter.equipContainerItem(
            server,
            item,
            newSlotId,
            sourceCharacter
          );
          return;
        }

        sourceContainer.transferItem(
          server,
          targetContainer,
          item,
          newSlotId,
          count
        );
      }
    } else {
      // from external container
      const sourceCharacter = client.character.mountedContainer;
      if (
        !sourceCharacter ||
        !(sourceCharacter instanceof BaseLootableEntity) ||
        !isPosInRadius(
          sourceCharacter.interactionDistance,
          client.character.state.position,
          sourceCharacter.state.position
        )
      ) {
        server.sendChatText(client, "Invalid source character 1!");
        return;
      }

      const sourceContainer = sourceCharacter.getItemContainer(itemGuid ?? "");
      if (!sourceContainer) {
        server.sendChatText(client, "Invalid source container 3!");
        return;
      }

      const item = sourceContainer.items[itemGuid ?? ""];
      if (!item) {
        server.containerError(client, ContainerErrors.NO_ITEM_IN_SLOT);
        return;
      }

      if (server.isAccountItem(item.itemDefinitionId)) {
        if (!server.removeContainerItem(sourceCharacter, item, sourceContainer))
          return;
        client.character.lootItem(server, item, item.stackCount, true);
        return;
      }

      if (sourceCharacter instanceof Vehicle2016 && newSlotId) {
        const loadOutSlot = sourceCharacter.getAvailableLoadoutSlot(
          server,
          item.itemDefinitionId
        );
        if (loadOutSlot && loadOutSlot == newSlotId) {
          sourceCharacter.equipContainerItem(
            server,
            item,
            newSlotId,
            sourceCharacter
          );
          return;
        }
      }

      if (!Number(containerGuid)) {
        client.character.lootItemFromContainer(
          server,
          sourceContainer,
          item,
          item.stackCount
        );
        // remount container to keep items from changing slotIds
        //client.character.mountContainer(server, sourceCharacter);
        return;
      }

      const targetContainer = client.character.getContainerFromGuid(
        containerGuid ?? ""
      );

      if (targetContainer) {
        // to container

        if (
          !targetContainer.getHasSpace(server, item.itemDefinitionId, count)
        ) {
          server.sendData<CharacterNoSpaceNotification>(
            client,
            "Character.NoSpaceNotification",
            {
              characterId: client.character.characterId
            }
          );
          return;
        }

        sourceContainer.transferItem(
          server,
          targetContainer,
          item,
          newSlotId,
          count
        );
      } else if (containerGuid == LOADOUT_CONTAINER_GUID) {
        // to loadout
        if (
          server.validateLoadoutSlot(
            item.itemDefinitionId,
            newSlotId,
            client.character.loadoutId
          )
        ) {
          client.character.equipContainerItem(
            server,
            item,
            newSlotId,
            sourceCharacter
          );
        }
      } else if (sourceCharacter.getContainerFromGuid(containerGuid ?? "")) {
        // remount container if trying to move around items in one container since slotIds aren't setup yet
        client.character.mountContainer(server, sourceCharacter);
      } else {
        // invalid
        server.containerError(client, ContainerErrors.UNKNOWN_CONTAINER);
      }
      return;
    }
  }
  LoadoutSelectSlot(
    server: ZoneServer2016,
    client: Client,
    packet: ReceivedPacket<LoadoutSelectSlot>
  ) {
    const slotId = packet.data.slotId || 0,
      slot = client.character._loadout[slotId];
    if (!slot) {
      server.sendChatText(client, "[ERROR] Target slot is empty!");
      return;
    }
    server.switchLoadoutSlot(client, slot);
  }
  NpcFoundationPermissionsManagerEditPermission(
    server: ZoneServer2016,
    client: Client,
    packet: ReceivedPacket<NpcFoundationPermissionsManagerEditPermission>
  ) {
    const objectCharacterId = packet.data.objectCharacterId || "",
      foundation = server._constructionFoundations[
        objectCharacterId
      ] as ConstructionParentEntity;

    //Check if the client is the owner of the foundation / has demolistion perms or an admin in debug mode or if client has demolition perms
    if (
      foundation.ownerCharacterId !== client.character.characterId &&
      !foundation.permissions[client.character.characterId]?.demolish &&
      !(client.isAdmin && client.isDebugMode)
    )
      return;

    let characterId = "";
    for (const a in foundation.permissions) {
      const permissions = foundation.permissions[a];
      if (permissions.characterName === packet.data.characterName) {
        characterId = permissions.characterId;
      }
    }

    if (!characterId) {
      return;
    }

    // If the character ID matches the foundation owner's / own character ID, send an alert and exit
    if (
      characterId == foundation.ownerCharacterId ||
      characterId == client.character.characterId
    ) {
      server.sendAlert(client, "You can't edit your own permissions.");
      return;
    }

    // If not an owner and client tries to edit other players permissions with demolish perms, send an alert and exit
    if (
      client.character.characterId != foundation.ownerCharacterId &&
      foundation.permissions[characterId]?.demolish &&
      characterId != client.character.characterId
    ) {
      server.sendAlert(
        client,
        "You can't edit someone else's permissions if they have demolish permissions."
      );
      return;
    }

    const obj: ConstructionPermissions = foundation.permissions[characterId];
    if (!obj) return;
    switch (packet.data.permissionSlot) {
      case 1:
        obj.build = !obj.build;
        break;
      case 2:
        obj.demolish = !obj.demolish;
        break;
      case 3:
        obj.useContainers = !obj.useContainers;
        break;
      case 4:
        obj.visit = !obj.visit;
        break;
    }
    // update permissions
    if (!obj.build && !obj.demolish && !obj.useContainers && !obj.visit) {
      delete foundation.permissions[characterId];
    } else {
      foundation.permissions[characterId] = obj;
    }

    // update child expansion permissions
    Object.values(
      server._constructionFoundations[objectCharacterId].occupiedExpansionSlots
    ).forEach((expansion) => {
      expansion.permissions = foundation.permissions;
    });

    // update permissions list
    server.sendData<NpcFoundationPermissionsManagerBaseShowPermissions>(
      client,
      "NpcFoundationPermissionsManagerBase.ShowPermissions",
      {
        characterId: foundation.characterId,
        characterId2: foundation.characterId,
        permissions: Object.values(foundation.permissions).filter(
          (perm: ConstructionPermissions) =>
            perm.characterId != foundation.ownerCharacterId
        )
      }
    );
  }
  async NpcFoundationPermissionsManagerAddPermission(
    server: ZoneServer2016,
    client: Client,
    packet: ReceivedPacket<NpcFoundationPermissionsManagerAddPermission>
  ) {
    const objectCharacterId = packet.data.objectCharacterId || "",
      characterName = packet.data.characterName || "",
      foundation = server._constructionFoundations[
        objectCharacterId
      ] as ConstructionParentEntity;

    // Check if the client is the owner of the foundation / has demolistion perms or an admin in debug mode
    if (
      foundation.ownerCharacterId !== client.character.characterId &&
      !foundation.permissions[client.character.characterId]?.demolish &&
      !(client.isAdmin && client.isDebugMode)
    ) {
      return;
    }

    let targetClient = server.getClientByNameOrLoginSession(characterName);

    if (!targetClient) {
      targetClient = await server.getOfflineClientByName(characterName);
    }

    if (!targetClient || !(targetClient instanceof Client)) {
      server.sendChatText(client, "Player not found.");
      return;
    }

    let characterId = targetClient.character.characterId;

    // check existing characters in foundation permissions
    if (!characterId) {
      for (const a in foundation.permissions) {
        const permissions = foundation.permissions[a];
        if (permissions.characterName === characterName) {
          characterId = permissions.characterId;
        }
      }
    }

    // If the character ID matches the foundation owner's / own character ID, send an alert and exit
    if (
      characterId == foundation.ownerCharacterId ||
      characterId == client.character.characterId
    ) {
      server.sendAlert(client, "You can't edit your own permissions.");
      return;
    }
    if (!characterId) return;
    let obj: ConstructionPermissions = foundation.permissions[characterId];
    if (!obj) {
      if (Object.keys(foundation.permissions).length >= 16) {
        server.sendAlert(client, "Permissions limit reached.");
        return;
      }
      obj = {
        characterId,
        characterName,
        useContainers: false,
        build: false,
        demolish: false,
        visit: false
      };
    }
    switch (packet.data.permissionSlot) {
      case ConstructionPermissionIds.BUILD:
        obj.build = !obj.build;
        break;
      case ConstructionPermissionIds.DEMOLISH:
        obj.demolish = !obj.demolish;
        break;
      case ConstructionPermissionIds.CONTAINERS:
        obj.useContainers = !obj.useContainers;
        break;
      case ConstructionPermissionIds.VISIT:
        obj.visit = !obj.visit;
        break;
    }
    foundation.permissions[characterId] = obj;

    // update child expansion permissions
    Object.values(
      server._constructionFoundations[objectCharacterId].occupiedExpansionSlots
    ).forEach((expansion) => {
      expansion.permissions = foundation.permissions;
    });

    server.sendData<NpcFoundationPermissionsManagerBaseShowPermissions>(
      client,
      "NpcFoundationPermissionsManagerBase.ShowPermissions",
      {
        characterId: foundation.characterId,
        characterId2: foundation.characterId,
        permissions: Object.values(foundation.permissions).filter(
          (perm: ConstructionPermissions) =>
            perm.characterId != foundation.ownerCharacterId
        )
      }
    );
  }

  handleWeaponPacket(server: ZoneServer2016, client: Client, packet: any) {
    const weaponItem = client.character.getEquippedWeapon();
    if (!weaponItem || !weaponItem.weapon) return;
    switch (packet.packetName) {
      case "Weapon.FireStateUpdate":
        server.handleWeaponFireStateUpdate(
          client,
          weaponItem,
          packet.packet.firestate
        );
        break;
      case "Weapon.Fire":
        server.handleWeaponFire(client, weaponItem, packet);
        break;
      case "Weapon.ProjectileHitReport":
        const weapon = client.character.getEquippedWeapon();
        if (weapon && weapon.itemDefinitionId == Items.WEAPON_REMOVER) {
          if (!client.isAdmin) return;
          const characterId = packet.packet.hitReport.characterId,
            entity = server.getEntity(characterId);
          if (!entity) {
            server.sendAlert(client, "Entity is undefined!");
            return;
          }
          if (entity instanceof Character2016) return;
          if (entity instanceof Vehicle2016) {
            if (!entity.destroy(server, true)) return;
            server.sendAlert(client, "Object removed.");
            return;
          }
          if (entity.destroy(server)) {
            server.sendAlert(client, "Object removed.");
          }
          return;
        }
        if (client.banType === "nodamage") return;
        server.registerHit(client, packet.packet, packet.gameTime);
        break;
      case "Weapon.ReloadRequest":
        server.handleWeaponReload(client, weaponItem);
        break;
      case "Weapon.ReloadInterrupt":
        server.reloadInterrupt(client, weaponItem);
        break;
      case "Weapon.SwitchFireModeRequest":
        // workaround so aiming in doesn't sometimes make the shooting sound
        if (!weaponItem.weapon?.ammoCount) return;

        // temp workaround to fix 308 sound while aiming
        // this workaround applies to all weapons
        if (packet.packet.firemodeIndex == 1) return;
        server.sendRemoteWeaponUpdateDataToAllOthers(
          client,
          client.character.transientId,
          weaponItem.itemGuid,
          "Update.SwitchFireMode",
          {
            firegroupIndex: packet.packet.firegroupIndex,
            firemodeIndex: packet.packet.firemodeIndex
          }
        );
        break;
      case "Weapon.WeaponFireHint":
        debug("WeaponFireHint");
        break;
      case "Weapon.ProjectileContactReport":
        debug("ProjectileContactReport");
        break;
      case "Weapon.MeleeHitMaterial":
        debug("MeleeHitMaterial");
        /* workaround melee hit logic since UpdateAbility packet isn't always sent */
        /*
        if (client.character.abilityInitTime > 0) {
          // ignore melee hit if ability packet was sent
          return;
        }

        const entity = server.getEntity(
          client.character.currentInteractionGuid
        );

        client.character.checkCurrentInteractionGuid();
        if (!entity || !weaponItem) return;
        server.abilitiesManager.handleMeleeHit(
          server,
          client,
          entity,
          weaponItem
        );
        */
        break;
      case "Weapon.AimBlockedNotify":
        server.sendRemoteWeaponUpdateDataToAllOthers(
          client,
          client.character.transientId,
          weaponItem.itemGuid,
          "Update.AimBlocked",
          {
            aimBlocked: packet.packet.aimBlocked
          }
        );
        break;
      case "Weapon.ProjectileSpawnNpc":
        server.createProjectileNpc(client, packet.packet);
        break;
      case "Weapon.ProjectileSpawnAttachedNpc":
        debug("Weapon.ProjectileSpawnAttachedNpc");
        if (client.fireHints[packet.packet.sessionProjectileCount]) {
          client.fireHints[packet.packet.sessionProjectileCount].marked = {
            characterId: packet.packet.characterId,
            position: packet.packet.position,
            rotation: packet.packet.rotation,
            gameTime: packet.gameTime
          };
        }
        break;
      case "Weapon.GuidedExplode":
        for (const a in server._throwableProjectiles) {
          const projectile = server._throwableProjectiles[a];
          if (projectile.transientId == packet.packet.transientId) {
            projectile.state.position = new Float32Array([
              packet.packet.position[0],
              packet.packet.position[1],
              packet.packet.position[2],
              1
            ]);
            projectile.onTrigger(server, client);
          }
        }
        break;
      default:
        debug(`Unhandled weapon packet type: ${packet.packetName}`);
        break;
    }
  }

  Weapon(
    server: ZoneServer2016,
    client: Client,
    packet: ReceivedPacket<WeaponWeapon>
  ) {
    debug("Weapon.Weapon");
    if (client.character.tempGodMode) {
      // used to disable spawn godmode
      server.setTempGodMode(client, false);
    }

    const weaponpacket = packet.data.weaponPacket as any;

    switch (weaponpacket?.packetName) {
      case "Weapon.MultiWeapon":
        weaponpacket?.packet.packets.forEach((p: any) => {
          this.handleWeaponPacket(server, client, p);
        });
        break;
      default:
        this.handleWeaponPacket(server, client, packet.data.weaponPacket);
        break;
    }
  }
  CommandRun(
    server: ZoneServer2016,
    client: Client,
    packet: ReceivedPacket<CommandRunSpeed>
  ) {
    server.commandHandler.executeInternalCommand(server, client, "run", packet);
  }
  CommandSpectate(
    server: ZoneServer2016,
    client: Client,
    packet: ReceivedPacket<object>
  ) {
    server.commandHandler.executeInternalCommand(
      server,
      client,
      "spectate",
      packet
    );
  }
  VoiceRadioChannel(
    server: ZoneServer2016,
    client: Client,
    packet: ReceivedPacket<VoiceRadioChannel>
  ) {
    if (!client.character._loadout[LoadoutSlots.RADIO]) return;
    if (
      client.character._loadout[LoadoutSlots.RADIO].itemDefinitionId !=
      Items.EMERGENCY_RADIO
    )
      return;
    client.radio = true;
  }
  VoiceLeaveRadio(
    server: ZoneServer2016,
    client: Client,
    packet: ReceivedPacket<VoiceLeaveRadio>
  ) {
    client.radio = false;
  }
  EndCharacterAccess(
    server: ZoneServer2016,
    client: Client,
    packet: ReceivedPacket<AccessedCharacterEndCharacterAccess>
  ) {
    client.character.dismountContainer(server);
  }

  GroupInvite(
    server: ZoneServer2016,
    client: Client,
    packet: ReceivedPacket<GroupInvite>
  ) {
    const targetCharacterId =
        packet.data.inviteData?.targetCharacter?.characterId || "",
      targetCharacterName =
        packet.data.inviteData?.targetCharacter?.identity?.characterFirstName ||
        "";
    let target: Client | string | undefined;

    if (Number(targetCharacterId)) {
      target = server.getClientByCharId(targetCharacterId);
    } else {
      target = server.getClientByNameOrLoginSession(targetCharacterName);
    }

    if (!(target instanceof Client)) return;

    server.groupManager.sendGroupInvite(server, client, target);
  }

  GroupJoin(
    server: ZoneServer2016,
    client: Client,
    packet: ReceivedPacket<GroupJoin>
  ) {
    const characterName =
        packet.data.inviteData?.sourceCharacter?.identity?.characterName || "",
      source = server.getClientByNameOrLoginSession(characterName);
    if (!(source instanceof Client)) return;

    server.groupManager.handleGroupJoin(
      server,
      source,
      client,
      packet.data.joinState == 1
    );
  }

  async GroupKick(
    server: ZoneServer2016,
    client: Client,
    packet: ReceivedPacket<GroupKick>
  ) {
    if (!client.character.groupId || !packet.data.characterId) return;

    const group: Group | null = await server.groupManager.getGroup(
      server,
      client.character.groupId
    );

    if (!group) return;

    server.groupManager.handleGroupKick(
      server,
      client.character.characterId,
      packet.data.characterId,
      group
    );
  }

  EffectAddEffect(
    server: ZoneServer2016,
    client: Client,
    packet: ReceivedPacket<EffectAddEffect>
  ) {
    server.abilitiesManager.processAddEffectPacket(server, client, packet.data);
  }
  EffectRemoveEffect(
    server: ZoneServer2016,
    client: Client,
    packet: ReceivedPacket<EffectRemoveEffect>
  ) {
    server.abilitiesManager.processRemoveEffectPacket(
      server,
      client,
      packet.data
    );
  }
  AbilitiesInitAbility(
    server: ZoneServer2016,
    client: Client,
    packet: ReceivedPacket<AbilitiesInitAbility>
  ) {
    server.abilitiesManager.processAbilityInit(server, client, packet.data);
  }
  AbilitiesUninitAbility(
    server: ZoneServer2016,
    client: Client,
    packet: ReceivedPacket<AbilitiesUninitAbility>
  ) {
    if (!client.vehicle.mountedVehicle) return;
    const vehicle = server._vehicles[client.vehicle.mountedVehicle];
    if (!vehicle) return;
    server.abilitiesManager.processAbilityUninit(
      server,
      client,
      vehicle,
      packet.data
    );
  }
  AbilitiesUpdateAbility(
    server: ZoneServer2016,
    client: Client,
    packet: ReceivedPacket<AbilitiesUpdateAbility>
  ) {
    /*
      AbilityUpdate is sent twice for each melee hit, once as soon as you click,
      and a second time on the actual hit. hitLocation is only in the first packet,
      so it's ignored for now so the melee hit can be processed when the melee actually
      collides with an object. -Meme
    */
    const hitLocation = (packet.data.abilityData as any)?.hitLocation;
    const characterId =
      (packet.data.abilityData as any)?.hitLocation ??
      client.character.currentInteractionGuid;

    if (hitLocation) {
      client.character.abilityInitTime = Date.now();
      client.character.meleeHit = {
        abilityHitLocation: hitLocation,
        characterId: characterId
      };
      return;
    }

    const entity =
      server.getEntity(packet.data.targetCharacterId ?? "") ??
      server.getEntity(client.character.currentInteractionGuid);

    if (!entity) return;

    server.abilitiesManager.processAbilityUpdate(
      server,
      client,
      packet.data,
      entity
    );
  }

  ProjectileDebug(server: ZoneServer2016, client: Client, packet: any) {
    debug(`ProjectileDebug from ${client.character.characterId}`);
    debug(packet.data);
  }

  VehicleItemDefinitionRequest(
    server: ZoneServer2016,
    client: Client,
    packet: any
  ) {
    debug(`VehicleItemDefinitionRequest: ${packet.data.itemDefinitionId}`);
  }
  FairPlayInternal(server: ZoneServer2016, client: Client, packet: any) {}
  //#endregion

  async requestUseAccountItem(
    server: ZoneServer2016,
    client: Client,
    packet: ReceivedPacket<ItemsRequestUseAccountItem>
  ) {
    if (!packet.data.itemDefinitionId) {
      return;
    }
    const item = await server.accountInventoriesManager.getAccountItem(
      client.loginSessionId,
      packet.data.itemDefinitionId
    );
    if (!item) return;

    const itemSubData: any = packet.data.itemSubData;

    switch (packet.data.unknownDword3) {
      case ItemUseOptions.OPEN_CRATE:
        const rewards = server.getCrateRewards(packet.data.itemDefinitionId),
          rewardResult = server.getRandomCrateReward(
            packet.data.itemDefinitionId
          );
        const reward = rewardResult?.reward;
        if (!rewards || !reward) return;

        if (
          itemSubData?.unknownBoolean1 == 0 &&
          !server.removeInventoryItem(client.character, item)
        ) {
          return;
        }
        server.sendData(client, "Items.ReportRewardCrateContents", {
          winningRewards:
            reward > 0 && itemSubData?.unknownBoolean1 == 0
              ? [{ itemDefinitionId: reward }]
              : [],
          possibleRewards: Object.values(rewards).map((rew) => {
            return {
              itemDefinitionId: rew.itemDefinitionId
            };
          })
        });

        if (reward > 0 && itemSubData.unknownBoolean1 == 0) {
          setTimeout(() => {
            if (rewardResult.isRare) {
              server.sendAlertToAll(
                `Player ${client.character.name} opened ${server.getItemDefinition(reward)?.NAME} `
              );
            }
            server.lootAccountItem(
              server,
              client,
              server.generateAccountItem(reward),
              true
            );
          }, 12_000);
        }
        break;
      case ItemUseOptions.APPLY_SKIN:
        const oitem = client.character.getInventoryItem(
            itemSubData.targetItemGuid
          ),
          accountItem = [
            ...Object.values(server._accountItemDefinitions),
            { ACCOUNT_ITEM_ID: Items.AIRDROP_TICKET, REWARD_ITEM_ID: 0 }
          ].find((a) => a.ACCOUNT_ITEM_ID == packet.data.itemDefinitionId);

        if (!oitem || !accountItem) return;
        if (oitem.itemDefinitionId == accountItem.REWARD_ITEM_ID) {
          // prevent skinning if same skin is already applied
          return;
        }

        const newItem = server.generateItem(
            accountItem.REWARD_ITEM_ID,
            1,
            true
          ),
          containerItems = client.character.getContainerFromGuid(
            oitem.itemGuid
          )?.items;

        if (!newItem) return;

        // Copy over item data to new item
        newItem.currentDurability = oitem.currentDurability;
        newItem.itemGuid = oitem.itemGuid;
        if (oitem.weapon) {
          newItem.weapon = oitem.weapon;
        }

        const oldSlot = client.character.currentLoadoutSlot,
          oldLoadoutItem = client.character._loadout[oitem.slotId];
        if (!server.removeInventoryItem(client.character, oitem)) return;
        if (
          !oldLoadoutItem ||
          oldLoadoutItem.itemDefinitionId !== oitem.itemDefinitionId
        ) {
          // Determine if the item is equipped; if it isn't, loot it instead.
          client.character.lootContainerItem(
            server,
            newItem,
            newItem.stackCount,
            false
          );
          return;
        }

        client.character.equipItem(server, newItem);
        client.character.updateEquipment(server);

        // Copy over items from the old container to the new container
        if (containerItems && _.size(containerItems) !== 0) {
          const newContainer = client.character.getContainerFromGuid(
            newItem.itemGuid
          );
          // Normally it should always find this container as it's constructed above, if not then we'll cross that bridge when we get to it
          if (newContainer) {
            Object.values(containerItems).forEach((i) => {
              server.addContainerItem(client.character, i, newContainer, false);
            });
          }
        }

        // switch back to weapon if it was previously selected
        if (oldSlot == client.character.currentLoadoutSlot) return;
        const loadoutItem = client.character.getLoadoutItem(newItem.itemGuid);
        if (!loadoutItem) return;

        server.switchLoadoutSlot(client, loadoutItem);
        break;
      case ItemUseOptions.CALL_AIRDROP:
        server.useAirdrop(client, client.character, item);
        break;
      case ItemUseOptions.OPEN_BAG:
        const bagRewards = server.getCrateRewards(packet.data.itemDefinitionId),
          bagReward = server.getRandomCrateReward(packet.data.itemDefinitionId);
        if (!bagRewards || !bagReward) return;
        server.utilizeHudTimer(
          client,
          server.getItemDefinition(packet.data.itemDefinitionId)?.NAME_ID ?? 0,
          1000,
          0,
          () => {
            if (!server.removeInventoryItem(client.character, item)) return;
            server.lootAccountItem(
              server,
              client,
              server.generateAccountItem(bagReward.reward)
            );
          }
        );
        break;
      case ItemUseOptions.OPEN_PACKAGE:
        let packageRewards: number[] = [];
        switch (packet.data.itemDefinitionId) {
          case Items.REWARD_SET_WOODLAND_GHILLIE:
            packageRewards = [
              Items.SKIN_WOODLAND_GHILLIE_SUIT_BOOTS,
              Items.SKIN_GREEN_GLOVES
            ];
            break;
          case Items.REWARD_SET_GHILLIE:
            packageRewards = [
              Items.SKIN_GHILLIE_SUIT_BOOTS,
              Items.SKIN_GHILLIE_SUIT_GLOVES
            ];
            break;
          case Items.REWARD_SET_RED_FACE_BANDANA:
            packageRewards = [
              Items.SKIN_RED_FACE_BANDANA,
              Items.SKIN_RED_BIKER_SHADES
            ];
            break;
          case Items.REWARD_SET_EVIL_CLOWN_BANDANA:
            packageRewards = [
              Items.SKIN_EVIL_CLOWN_FACE_BANDANA,
              Items.SKIN_EVIL_CLOWN_GLASSES
            ];
            break;
          case Items.REWARD_SET_BLUE_FACE_BANDANA:
            packageRewards = [
              Items.SKIN_BLUE_FACE_BANDANA,
              Items.SKIN_BLUE_BIKER_SHADES
            ];
            break;
          case Items.REWARD_SET_CAMO_FACE_BANDANA:
            packageRewards = [
              Items.SKIN_CAMO_FACE_BANDANA,
              Items.SKIN_GREEN_BIKER_SHADES
            ];
            break;
          case Items.REWARD_SET_AMERICAN_FACE_BANDANA:
            packageRewards = [
              Items.SKIN_AMERICAN_FACE_BANDANA,
              Items.SKIN_WHITE_BIKER_SHADES
            ];
            break;
          case Items.REWARD_SET_PINK_FACE_BANDANA:
            packageRewards = [
              Items.SKIN_PINK_FACE_BANDANA,
              Items.SKIN_PINK_BIKER_SHADES
            ];
            break;
          case Items.REWARD_SET_SKULL_FACE_BANDANA:
            packageRewards = [
              Items.SKIN_SKULL_FACE_BANDANA,
              Items.SKIN_BLACK_BIKER_SHADES
            ];
            break;
        }

        server.utilizeHudTimer(
          client,
          server.getItemDefinition(packet.data.itemDefinitionId)?.NAME_ID ?? 0,
          1000,
          0,
          () => {
            if (
              !server.removeInventoryItem(client.character, item) &&
              packageRewards.length <= 0
            )
              return;
            Object.values(packageRewards).forEach((itemDefId) => {
              client.character.lootItem(server, server.generateItem(itemDefId));
            });
          }
        );
        break;
      default:
        debug(packet.data);
    }
  }

  disbandGroup(server: ZoneServer2016, client: Client) {
    server.groupManager.handleGroupCommand(server, client, ["disband"]);
  }

  leaveGroup(server: ZoneServer2016, client: Client) {
    server.groupManager.handleGroupCommand(server, client, ["leave"]);
  }

  commerceSessionRequest(server: ZoneServer2016, client: Client) {
    server.sendData(client, "CommerceSessionResponse", {
      unknownBoolean1: true,
      sessionToken: "TICKET"
    });
  }

  RagdollUpdatePose(
    server: ZoneServer2016,
    client: Client,
    packet: ReceivedPacket<RagdollUpdatePose>
  ) {
    // currently all ragdoll are client sided, less work for server but creates corpse position desync (shouldnt really be important)
    //server.sendDataToAllOthersWithSpawnedEntity(server._characters, client, client.character.characterId, "Ragdoll.UpdatePose", packet.data)
  }

  async grinderExchangeRequest(
    server: ZoneServer2016,
    client: Client,
    packet: ReceivedPacket<GrinderExchangeRequest>
  ) {
    if (!packet.data.items || packet.data.items.length === 0) return;

    const items = packet.data.items as GrinderItem[];
    let rarity = -1;
    let itemCount = 0;

    const rarityMap = items.reduce(
      (acc, item) => {
        const definition = server.getItemDefinition(item.itemDefinitionId);
        if (definition) {
          if (rarity === -1) rarity = definition.RARITY;
          if (rarity === definition.RARITY) {
            acc[item.itemDefinitionId] =
              (acc[item.itemDefinitionId] || 0) + item.count;
            itemCount += item.count;
          }
        }
        return acc;
      },
      {} as Record<number, number>
    );

    const itemsNeeded = rarity === 6 ? 4 : 5;
    if (itemCount < itemsNeeded) return;

    const rewardCratesFound: RewardCrateDefinition[] = [];
    const removedItems: { inventoryItem: AccountItem; count: number }[] = [];
    let itemsRemoved = false;

    try {
      for (const [itemDefinitionId, count] of Object.entries(rarityMap)) {
        let remainingCount = count;
        while (remainingCount > 0) {
          const inventoryItem =
            await server.accountInventoriesManager.getAccountItem(
              client.loginSessionId,
              parseInt(itemDefinitionId)
            );
          if (!inventoryItem) throw new Error("Inventory item not found");

          const removeCount = Math.min(
            inventoryItem.stackCount,
            remainingCount
          );
          remainingCount -= removeCount;

          removedItems.push({ inventoryItem, count: removeCount });
          server.removeAccountItem(
            client.character,
            inventoryItem,
            removeCount
          );

          server._rewardCrateDefinitions.forEach((crate) => {
            if (
              crate.rewards.some(
                (reward) =>
                  reward.itemDefinitionId === inventoryItem.itemDefinitionId
              )
            ) {
              rewardCratesFound.push(crate);
            }
          });
        }
      }
      itemsRemoved = true;
    } catch (error) {
      debug("Error during item removal, performing rollback:", error);
      await server.accountInventoriesManager.rollbackItems(
        client.loginSessionId,
        removedItems
      );
      return;
    }

    if (itemsRemoved) {
      const crateWeights = rewardCratesFound.reduce(
        (acc, crate) => {
          acc[crate.itemDefinitionId] = (acc[crate.itemDefinitionId] || 0) + 1;
          return acc;
        },
        {} as Record<number, number>
      );

      const totalWeight = Object.values(crateWeights).reduce(
        (sum, weight) => sum + weight,
        0
      );
      let random = Math.random() * totalWeight;
      let selectedCrate: RewardCrateDefinition | null = null;

      for (const crate of rewardCratesFound) {
        random -= crateWeights[crate.itemDefinitionId];
        if (random <= 0) {
          selectedCrate = crate;
          break;
        }
      }

      if (!selectedCrate) {
        await server.accountInventoriesManager.rollbackItems(
          client.loginSessionId,
          removedItems
        );
        return;
      }

      const higherRarityRewards = selectedCrate.rewards.filter((reward) => {
        const itemDefinition = server._itemDefinitions[reward.itemDefinitionId];
        return itemDefinition && itemDefinition.RARITY === rarity + 1;
      });

      if (higherRarityRewards.length > 0) {
        const weightedRewards = higherRarityRewards.flatMap((reward) =>
          Array(reward.rewardChance).fill(reward)
        );
        const selectedReward =
          weightedRewards[Math.floor(Math.random() * weightedRewards.length)];
        const item = server.generateItem(
          selectedReward.itemDefinitionId,
          1,
          true
        );

        server.lootAccountItem(server, client, item, false);
        server.sendData<GrinderExchangeResponse>(
          client,
          "Grinder.ExchangeResponse",
          {
            items: [{ itemDefinitionId: item?.itemDefinitionId || 0, count: 1 }]
          }
        );
      } else {
        await server.accountInventoriesManager.rollbackItems(
          client.loginSessionId,
          removedItems
        );
      }
    }
  }

  processPacket(
    server: ZoneServer2016,
    client: Client,
    packet: ReceivedPacket<any>
  ) {
    switch (packet.name) {
      case "ClientIsReady":
        this.ClientIsReady(server, client, packet);
        break;
      case "ClientFinishedLoading":
        this.ClientFinishedLoading(server, client, packet);
        break;
      case "Security":
        this.Security(server, client, packet);
        break;
      case "Command.RecipeStart":
        this.CommandRecipeStart(server, client, packet);
        break;
      case "Command.SpawnVehicle":
        this.CommandSpawnVehicle(server, client, packet);
      case "Command.FreeInteractionNpc":
        this.CommandFreeInteractionNpc(server, client, packet);
        break;
      case "Command.SetInWater":
        this.CommandSetInWater(server, client, packet);
        break;
      case "Command.ClearInWater":
        this.CommandClearInWater(server, client, packet);
        break;
      case "Collision.Damage":
        this.CollisionDamage(server, client, packet);
        break;
      case "VehicleCollision":
        this.VehicleCollision(server, client, packet);
        break;
      case "LobbyGameDefinition.DefinitionsRequest":
        this.LobbyGameDefinitionDefinitionsRequest(server, client, packet);
        break;
      case "KeepAlive":
        this.KeepAlive(server, client, packet);
        break;
      case "ClientUpdate.MonitorTimeDrift":
        this.ClientUpdateMonitorTimeDrift(server, client, packet);
        break;
      case "ClientLog":
        this.ClientLog(server, client, packet);
        break;
      case "WallOfData.UIEvent":
        this.WallOfDataUIEvent(server, client, packet);
        break;
      case "SetLocale":
        this.SetLocale(server, client, packet);
        break;
      case "GetContinentBattleInfo":
        this.GetContinentBattleInfo(server, client, packet);
        break;
      case "Chat.Chat":
        this.ChatChat(server, client, packet);
        break;
      case "ClientInitializationDetails":
        this.ClientInitializationDetails(server, client, packet);
        break;
      case "ClientLogout":
        this.ClientLogout(server, client, packet);
        break;
      case "GameTimeSync":
        this.GameTimeSync(server, client, packet);
        break;
      case "NpcFoundationPermissionsManager.EditPermission":
        this.NpcFoundationPermissionsManagerEditPermission(
          server,
          client,
          packet
        );
        break;
      case "NpcFoundationPermissionsManager.AddPermission":
        this.NpcFoundationPermissionsManagerAddPermission(
          server,
          client,
          packet
        );
        break;
      case "Locks.SetLock":
        this.LocksSetLock(server, client, packet);
        break;
      case "Synchronization":
        this.Synchronization(server, client, packet);
        break;
      case "Command.ExecuteCommand":
        this.CommandExecuteCommand(server, client, packet);
        break;
      case "Command.InteractRequest":
        this.CommandInteractRequest(server, client, packet);
        break;
      case "Command.InteractCancel":
        this.CommandInteractCancel(server, client, packet);
        break;
      case "Vehicle.CurrentMoveMode":
        this.VehicleCurrentMoveMode(server, client, packet);
        break;
      case "Vehicle.Dismiss":
        this.VehicleDismiss(server, client, packet);
        break;
      case "Command.StartLogoutRequest":
        this.CommandStartLogoutRequest(server, client, packet);
        break;
      case "CharacterSelectSessionRequest":
        this.CharacterSelectSessionRequest(server, client, packet);
        break;
      case "ProfileStats.GetPlayerProfileStats":
        this.ProfileStatsGetPlayerProfileStats(server, client, packet);
        break;
      case "WallOfData.ClientSystemInfo":
        this.WallOfDataClientSystemInfo(server, client, packet);
        break;
      case "DtoHitSpeedTreeReport":
        this.DtoHitSpeedTreeReport(server, client, packet);
        break;
      case "Command.PointAndReport":
        this.CommandPointAndReport(server, client, packet);
        break;
      case "Command.ReportLastDeath":
        this.CommandReportLastDeath(server, client, packet);
        break;
      case "GetRewardBuffInfo":
        this.GetRewardBuffInfo(server, client, packet);
        break;
      case "PlayerUpdateManagedPosition":
        this.PlayerUpdateManagedPosition(server, client, packet);
        break;
      case "Vehicle.StateData":
        this.VehicleStateData(server, client, packet);
        break;
      case "Vehicle.AccessType":
        this.VehicleAccessType(server, client, packet);
        break;
      case "PlayerUpdatePosition":
        this.PlayerUpdatePosition(server, client, packet);
        break;
      case "Character.Respawn":
        this.CharacterRespawn(server, client, packet);
        break;
      case "Spectator.Teleport":
        this.SpectatorTeleport(server, client, packet);
        break;
      case "Character.FullCharacterDataRequest":
        this.CharacterFullCharacterDataRequest(server, client, packet);
        break;
      case "Command.PlayerSelect":
        this.CommandPlayerSelect(server, client, packet);
        break;
      case "Mount.DismountRequest":
        this.MountDismountRequest(server, client, packet);
        break;
      case "Command.InteractionString":
        this.CommandInteractionString(server, client, packet);
        break;
      case "Mount.SeatChangeRequest":
        this.MountSeatChangeRequest(server, client, packet);
        break;
      case "Construction.PlacementFinalizeRequest":
        this.ConstructionPlacementFinalizeRequest(server, client, packet);
        break;
      case "Command.ItemDefinitionRequest":
        this.CommandItemDefinitionRequest(server, client, packet);
        break;
      case "Character.WeaponStance":
        this.CharacterWeaponStance(server, client, packet);
        break;
      case "Command.Redeploy":
        this.CommandRedeploy(server, client, packet);
        break;
      case "FirstTimeEvent.Unknown1":
        this.FirstTimeEventInventoryAccess(server, client, packet);
        break;
      case "Items.RequestUseItem":
        this.RequestUseItem(server, client, packet);
        break;
      case "Construction.PlacementRequest":
        this.ConstructionPlacementRequest(server, client, packet);
        break;
      case "Container.MoveItem":
        this.ContainerMoveItem(server, client, packet);
        break;
      case "Command.Suicide":
        this.CommandSuicide(server, client, packet);
        break;
      case "Loadout.SelectSlot":
        this.LoadoutSelectSlot(server, client, packet);
        break;
      case "Weapon.Weapon":
        this.Weapon(server, client, packet);
        break;
      case "Command.RunSpeed":
        this.CommandRun(server, client, packet);
        break;
      case "Command.Spectate":
        this.CommandSpectate(server, client, packet);
        break;
      case "Voice.RadioChannel":
        this.VoiceRadioChannel(server, client, packet);
        break;
      case "Voice.LeaveRadio":
        this.VoiceLeaveRadio(server, client, packet);
        break;
      case "AccessedCharacter.EndCharacterAccess":
        this.EndCharacterAccess(server, client, packet);
        break;
      case "Group.Invite":
        this.GroupInvite(server, client, packet);
        break;
      case "Group.Join":
        this.GroupJoin(server, client, packet);
        break;
      case "Group.Kick":
        this.GroupKick(server, client, packet);
        break;
      case "Effect.AddEffect":
        this.EffectAddEffect(server, client, packet);
        break;
      case "Effect.RemoveEffect":
        this.EffectRemoveEffect(server, client, packet);
        break;
      case "Abilities.InitAbility":
        this.AbilitiesInitAbility(server, client, packet);
        break;
      case "Abilities.UninitAbility":
        this.AbilitiesUninitAbility(server, client, packet);
        break;
      case "Abilities.UpdateAbility":
        this.AbilitiesUpdateAbility(server, client, packet);
        break;
      case "ProjectileDebug":
        this.ProjectileDebug(server, client, packet);
        break;
      case "Vehicle.ItemDefinitionRequest":
        this.VehicleItemDefinitionRequest(server, client, packet);
        break;
      case "FairPlay.Internal":
        this.FairPlayInternal(server, client, packet);
        break;
      case "Recipe.Discovery":
        break;
      case "InGamePurchase.AcccountInfoRequest":
        server.sendData(client, "InGamePurchase.AcccountInfoResponse", {
          unknownDword1: 1,
          locale: "en_US",
          currency: "USD"
        });
        break;
      case "InGamePurchase.CountryCodesRequest":
        server.sendData(client, "InGamePurchase.CountryCodesResponse", {
          unknownDword1: 1,
          countryCodes: [
            {
              countryCode: "US",
              country: "United States"
            }
          ]
        });
        break;
      case "InGamePurchase.WalletInfoRequest":
        break;
      case "InGamePurchase.StationCashProductsRequest":
        break;
      case "Items.RequestUseAccountItem":
        this.requestUseAccountItem(server, client, packet);
        break;
      case "CommerceSessionRequest":
        this.commerceSessionRequest(server, client);
        break;
      case "Group.Disband":
        this.disbandGroup(server, client);
        break;
      case "Group.Leave":
        this.leaveGroup(server, client);
        break;
      case "Ping":
        server.sendData(client, "Pong", {});
        break;
      case "Ragdoll.UpdatePose":
        this.RagdollUpdatePose(server, client, packet);
        break;
      case "Grinder.ExchangeRequest":
        this.grinderExchangeRequest(server, client, packet);
        break;
      case "InGamePurchase.StoreBundleContentRequest":
        debug(JSON.stringify(packet.data));
        server.sendData<InGamePurchaseStoreBundleContentResponse>(
          client,
          "InGamePurchase.StoreBundleContentResponse",
          {
            bundles: [
              {
                itemDefId: 1791,
                bundleId: packet.data.bundles[0].bundleId
              }
            ]
          }
        );
        break;
      default:
        debug(packet);
        debug("Packet not implemented in packetHandlers");
        break;
    }
  }

  handleCustomPacket(server: ZoneServer2016, client: Client, raw: string) {
    const opcode = raw.substring(0, 2),
      data = raw.slice(2);

    switch (opcode) {
      case "01": // asset validator
        server.fairPlayManager.handleAssetCheck(server, client, data);
        break;
      case "02": // client messages
        server.sendChatTextToAdmins(`${client.character.name}: ${data}`);
        break;
      case "09":
        break;
      default:
        console.log(
          `Unknown custom packet opcode: ${opcode} from ${client.loginSessionId}`
        );
        break;
    }
  }
}
