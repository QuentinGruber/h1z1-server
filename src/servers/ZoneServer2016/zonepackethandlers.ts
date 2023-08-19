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

/* eslint-disable @typescript-eslint/no-unused-vars */
// TODO enable @typescript-eslint/no-unused-vars
import { ZoneClient2016 as Client } from "./classes/zoneclient";
import { ZoneServer2016 } from "./zoneserver";
const debug = require("debug")("ZoneServer");

import {
  _,
  Int64String,
  isPosInRadius,
  toHex,
  quat2matrix,
  logClientActionToMongo,
  eul2quat,
  getDistance,
  getDistance1d,
  isPosInRadiusWithY
} from "../../utils/utils";

import { CraftManager } from "./managers/craftmanager";
import {
  ConstructionPermissionIds,
  ContainerErrors,
  EntityTypes,
  Items,
  ConstructionErrors,
  ResourceIds,
  ResourceTypes,
  ItemUseOptions,
  LoadoutSlots
} from "./models/enums";
import { BaseFullCharacter } from "./entities/basefullcharacter";
import { BaseLightweightCharacter } from "./entities/baselightweightcharacter";
import { ConstructionParentEntity } from "./entities/constructionparententity";
import { ConstructionDoor } from "./entities/constructiondoor";
import { CommandHandler } from "./handlers/commands/commandhandler";
import { ChatChat, Synchronization } from "types/zone2016packets";
import { VehicleCurrentMoveMode } from "types/zone2015packets";
import {
  ClientBan,
  ConstructionPermissions,
  DamageInfo,
  StanceFlags,
  fireHint
} from "types/zoneserver";
import { positionUpdate } from "types/savedata";
import { GameTimeSync } from "types/zone2016packets";
import { LootableProp } from "./entities/lootableprop";
import { Vehicle2016 } from "./entities/vehicle";
import { Plant } from "./entities/plant";
import { ConstructionChildEntity } from "./entities/constructionchildentity";
import { Collection } from "mongodb";
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

export class ZonePacketHandlers {
  commandHandler: CommandHandler;
  constructor() {
    this.commandHandler = new CommandHandler();
  }

  ClientIsReady(server: ZoneServer2016, client: Client, packet: any) {
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
    server.firstRoutine(client);
    server.setGodMode(client, true);

    server.sendData(client, "ClientUpdate.DoneSendingPreloadCharacters", {
      done: true
    }); // Required for WaitForWorldReady

    // Required for WaitForWorldReady
    setTimeout(() => {
      // makes loading longer but gives game time to spawn objects and reduce lag
      server.sendData(
        client,
        "ClientUpdate.NetworkProximityUpdatesComplete",
        {}
      );
    }, 5000);

    server.customizeDTO(client);

    client.character.startResourceUpdater(client, server);
    server.sendData(client, "Character.CharacterStateDelta", {
      guid1: client.guid,
      guid2: "0x0000000000000000",
      guid3: "0x0000000040000000",
      guid4: "0x0000000000000000",
      gameTime: (server.getServerTime() & 0xffffffff) >>> 0
    });

    server.sendRawData(client, server.projectileDefinitionsCache);

    server.sendRawData(client, server.profileDefinitionsCache);
    /*
      server.sendData(client, "Loadout.SetCurrentLoadout", {
        guid: client.character.guid,
        loadoutId: client.character.currentLoadoutId,
      });
      */

    server.sendData(client, "ZoneDoneSendingInitialData", {}); // Required for WaitForWorldReady
  }
  ClientFinishedLoading(server: ZoneServer2016, client: Client, packet: any) {
    if (!server.hookManager.checkHook("OnClientFinishedLoading", client))
      return;
    server.tempGodMode(client, 15000);
    client.currentPOI = 0; // clears currentPOI for POIManager
    server.sendGameTimeSync(client);
    server.constructionManager.sendConstructionData(server, client);
    if (client.firstLoading) {
      client.character.lastLoginDate = toHex(Date.now());
      server.setGodMode(client, false);
      setTimeout(() => {
        if (server.welcomeMessage)
          server.sendAlert(client, server.welcomeMessage);
        server.sendChatText(
          client,
          `server population : ${_.size(server._characters)}`
        );
        if (client.isAdmin) {
          if (server.adminMessage)
            server.sendAlert(client, server.adminMessage);
        }
      }, 10000);
      if (client.banType != "") {
        server.sendChatTextToAdmins(
          `Silently banned ${client.character.name} has joined the server !`
        );
      }
      client.firstLoading = false;
      client.pingTimer?.refresh();

      server.sendData(client, "Command.AddWorldCommand", {
        command: "help"
      });
      Object.values(this.commandHandler.commands).forEach((command) => {
        server.sendData(client, "Command.AddWorldCommand", {
          command: command.name
        });
      });

      server.sendData(client, "Character.WeaponStance", {
        // activates weaponstance key
        characterId: client.character.characterId,
        stance: 1
      });
      client.character.updateEquipment(server); // needed or third person character will be invisible
      client.character.updateLoadout(server); // needed or all loadout context menu entries aren't shown
      // clear /hax run since switching servers doesn't automatically clear it
      server.sendData(client, "Command.RunSpeed", {
        runSpeed: 0
      });
      client.character.isReady = true;
      server.airdropManager(client, true);
    }
    if (!client.character.isAlive || client.character.isRespawning) {
      // try to fix stuck on death screen
      server.sendData(client, "Character.StartMultiStateDeath", {
        characterId: client.character.characterId
      });
    }
    server.spawnWorkAroundLightWeight(client);
    server.setTickRate();
  }
  Security(server: ZoneServer2016, client: Client, packet: any) {
    debug(packet);
  }
  CommandRecipeStart(server: ZoneServer2016, client: Client, packet: any) {
    new CraftManager(client, server, packet.data.recipeId, packet.data.count);
  }
  CommandSpawnVehicle(server: ZoneServer2016, client: Client, packet: any) {
    this.commandHandler.executeInternalCommand(
      server,
      client,
      "vehicle",
      packet
    );
  }
  CommandSetInWater(server: ZoneServer2016, client: Client, packet: any) {
    debug(packet);
    client.character.characterStates.inWater = true;
  }
  CommandClearInWater(server: ZoneServer2016, client: Client, packet: any) {
    debug(packet);
    client.character.characterStates.inWater = false;
  }
  CommandFreeInteractionNpc(
    server: ZoneServer2016,
    client: Client,
    packet: any
  ) {
    debug("FreeInteractionNpc");
    server.sendData(client, "Command.FreeInteractionNpc", {});
  }
  CollisionDamage(server: ZoneServer2016, client: Client, packet: any) {
    if (packet.data.objectCharacterId != client.character.characterId) {
      const objVehicle = server._vehicles[packet.data.objectCharacterId];
      if (objVehicle && objVehicle.engineRPM > 4500) {
        for (const a in server._destroyables) {
          const destroyable = server._destroyables[a];
          if (destroyable.destroyedModel) continue;
          if (
            !isPosInRadius(
              4.5,
              destroyable.state.position,
              packet.data.position
            )
          )
            continue;
          const damageInfo: DamageInfo = {
            entity: `${objVehicle.characterId} collision`,
            damage: 1000000
          };
          destroyable.OnProjectileHit(server, damageInfo);
        }
      }
      if (objVehicle && packet.data.characterId != objVehicle.characterId) {
        if (objVehicle.getNextSeatId(server) == "0") return;
      }
    }
    const characterId = packet.data.characterId,
      damage: number = packet.data.damage,
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

  VehicleCollision(server: ZoneServer2016, client: Client, packet: any) {
    const characterId: string = server._transientIds[packet.data.transientId],
      vehicle = characterId ? server._vehicles[characterId] : undefined;

    if (!vehicle) return;
    const damage = packet.data.damage.toFixed(0);
    vehicle.damage(server, { entity: "", damage: damage });
    //server.DTOhit(client, packet);
  }

  CommandPointAndReport(server: ZoneServer2016, client: Client, packet: any) {
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
  CommandReportLastDeath(server: ZoneServer2016, client: Client, packet: any) {
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
      { title: "Time:", info: `${server.getDateString(Date.now())}` },
      { title: "Total reports this session:", info: `${targetClient.reports}` }
    ];
    delete client.lastDeathReport;
  }

  LobbyGameDefinitionDefinitionsRequest(
    server: ZoneServer2016,
    client: Client,
    packet: any
  ) {
    server.sendData(client, "LobbyGameDefinition.DefinitionsResponse", {
      definitionsData: { data: "" }
    });
  }
  KeepAlive(server: ZoneServer2016, client: Client, packet: any) {
    if (client.isLoading && client.characterReleased && client.isSynced) {
      setTimeout(() => {
        client.isLoading = false;
        if (!client.characterReleased) return;
        if (
          client.firstReleased &&
          client.startingPos &&
          client.character.state.position[1] < client.startingPos[1]
        ) {
          client.firstReleased = false;
          server.sendData(client, "ClientUpdate.UpdateLocation", {
            position: client.startingPos,
            triggerLoadingScreen: false
          });
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
    packet: any
  ) {
    // nothing for now
  }
  ClientLog(server: ZoneServer2016, client: Client, packet: any) {
    if (
      packet.data.file ===
        server.fairPlayManager.fairPlayValues?.requiredFile2 &&
      !client.clientLogs.includes(packet.data.message) &&
      !client.isAdmin
    ) {
      const obj = { log: packet.data.message, isSuspicious: false };
      for (let x = 0; x < server.fairPlayManager._suspiciousList.length; x++) {
        if (
          packet.data.message
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
    debug(packet);
  }
  WallOfDataUIEvent(server: ZoneServer2016, client: Client, packet: any) {
    debug("UIEvent");
  }
  SetLocale(server: ZoneServer2016, client: Client, packet: any) {
    debug("SetLocale");
  }
  GetContinentBattleInfo(server: ZoneServer2016, client: Client, packet: any) {
    server.sendData(client, "ContinentBattleInfo", {
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
    packet: { data: ChatChat }
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

    if (!client.radio) {
      server.chatManager.sendChatToAllInRange(
        server,
        client,
        message as string,
        300
      );
    } else if (client.radio) {
      server.chatManager.sendChatToAllWithRadio(
        server,
        client,
        message as string
      );
    }
  }
  ClientInitializationDetails(
    server: ZoneServer2016,
    client: Client,
    packet: any
  ) {
    // just in case
    if (packet.data.unknownDword1) {
      debug("ClientInitializationDetails : ", packet.data.unknownDword1);
    }
  }
  ClientLogout(server: ZoneServer2016, client: Client, packet: any) {
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
    packet: { data: GameTimeSync }
  ) {
    server.sendGameTimeSync(client);
  }
  Synchronization(server: ZoneServer2016, client: Client, packet: any) {
    const serverTime = Int64String(server.getServerTime());
    const reflectedPacket: Synchronization = {
      ...packet.data,
      serverTime: serverTime,
      serverTime2: serverTime,
      time3: Int64String(Number(packet.data.clientTime)) + 2
    };
    server.sendData(client, "Synchronization", reflectedPacket);
    if (client.isSynced) return;
    client.isSynced = true;
    client.character.lastLoginDate = toHex(Date.now());
    server.constructionManager.constructionPermissionsManager(server, client);
  }
  CommandExecuteCommand(server: ZoneServer2016, client: Client, packet: any) {
    this.commandHandler.executeCommand(server, client, packet);
  }
  CommandInteractRequest(server: ZoneServer2016, client: Client, packet: any) {
    const entity = server.getEntity(packet.data.characterId);
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
  CommandInteractCancel(server: ZoneServer2016, client: Client, packet: any) {
    debug("Interaction Canceled");
  }
  CommandStartLogoutRequest(
    server: ZoneServer2016,
    client: Client,
    packet: any
  ) {
    client.posAtTimerStart = client.character.state.position;
    if (!client.character.isAlive) {
      client.properlyLogout = true;
      // Exit to menu button on respawn screen
      server.sendData(client, "ClientUpdate.CompleteLogoutProcess", {});
      return;
    }
    server.dismountVehicle(client);
    client.character.dismountContainer(server);
    const timerTime = 10000;
    server.sendData(client, "ClientUpdate.StartTimer", {
      stringId: 0,
      time: timerTime
    });
    if (client.hudTimer != null) {
      clearTimeout(client.hudTimer);
    }
    client.hudTimer = setTimeout(() => {
      client.properlyLogout = true;
      server.sendData(client, "ClientUpdate.CompleteLogoutProcess", {});
    }, timerTime);
  }
  CharacterSelectSessionRequest(
    server: ZoneServer2016,
    client: Client,
    packet: any
  ) {
    server.sendData(client, "CharacterSelectSessionResponse", {
      status: 1,
      sessionId: client.loginSessionId
    });
  }
  ProfileStatsGetPlayerProfileStats(
    server: ZoneServer2016,
    client: Client,
    packet: any
  ) {
    // server.sendData(
    //   client,
    //   "ProfileStats.PlayerProfileStats",
    //   require("../../../data/profilestats.json")
    // );
  }
  async WallOfDataClientSystemInfo(
    server: ZoneServer2016,
    client: Client,
    packet: any
  ) {
    const info = packet.data.info;
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
  DtoHitSpeedTreeReport(server: ZoneServer2016, client: Client, packet: any) {
    server.speedtreeManager.use(
      server,
      client,
      packet.data.id,
      packet.data.name
    );
  }
  GetRewardBuffInfo(server: ZoneServer2016, client: Client, packet: any) {
    server.sendData(client, "RewardBuffInfo", {
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
  PlayerUpdateManagedPosition(
    server: ZoneServer2016,
    client: Client,
    packet: any
  ) {
    if (!packet.data || !packet.data.transientId) {
      console.log("TransientId error detected");
      console.log(packet);
      return;
    }
    if (packet.data.positionUpdate.unknown3_int8 == 5) {
      if (!server._airdrop || !packet.data.positionUpdate.position) return;
      if (
        server._airdrop.manager?.character.characterId !=
        client.character.characterId
      )
        return;
      server._airdrop.plane.state.position = new Float32Array([
        packet.data.positionUpdate.position[0],
        400,
        packet.data.positionUpdate.position[2],
        1
      ]);
      server._airdrop.plane.positionUpdate.orientation =
        packet.data.positionUpdate.orientation;
      server._airdrop.plane.state.rotation = eul2quat(
        new Float32Array([packet.data.positionUpdate.orientation, 0, 0, 0])
      );
      server._airdrop.plane.positionUpdate.frontTilt =
        packet.data.positionUpdate.frontTile;
      server._airdrop.plane.positionUpdate.sideTilt =
        packet.data.positionUpdate.sideTilt;
      if (
        isPosInRadius(
          150,
          packet.data.positionUpdate.position,
          server._airdrop.destinationPos
        ) &&
        !server._airdrop.cargoSpawned &&
        server._airdrop.cargo
      ) {
        server._airdrop.cargoSpawned = true;
        setTimeout(() => {
          if (server._airdrop && server._airdrop.cargo) {
            for (const a in server._clients) {
              if (!client.firstLoading && !client.isLoading) {
                server.sendData(server._clients[a], "AddLightweightVehicle", {
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
                  server._airdrop.cargo.pGetFullVehicle(server)
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
    } else if (packet.data.positionUpdate.unknown3_int8 == 6) {
      if (
        !server._airdrop ||
        !packet.data.positionUpdate.position ||
        !server._airdrop.cargo
      )
        return;
      if (
        server._airdrop.manager?.character.characterId !=
        client.character.characterId
      )
        return;
      server._airdrop.cargo.state.position = new Float32Array([
        server._airdrop.cargo.state.position[0],
        packet.data.positionUpdate.position[1],
        server._airdrop.cargo.state.position[2],
        1
      ]);
      server._airdrop.cargo.positionUpdate.orientation =
        packet.data.positionUpdate.orientation;
      server._airdrop.cargo.positionUpdate.frontTilt =
        packet.data.positionUpdate.frontTile;
      server._airdrop.cargo.positionUpdate.sideTilt =
        packet.data.positionUpdate.sideTilt;
      if (
        packet.data.positionUpdate.position[1] <=
          server._airdrop.destinationPos[1] + 2 &&
        !server._airdrop.containerSpawned
      ) {
        server._airdrop.containerSpawned = true;
        server.worldObjectManager.createAirdropContainer(
          server,
          server._airdrop.destinationPos
        );
        for (const a in server._clients) {
          server.airdropManager(server._clients[a], false);
        }
        delete server._airdrop;
      }
    }
    const characterId: string = server._transientIds[packet.data.transientId],
      vehicle = characterId ? server._vehicles[characterId] : undefined;

    if (!vehicle) {
      const pos = packet.data.positionUpdate.position;
      if (client.character.isSpectator && pos)
        client.character.state.position = pos;
      return;
    }
    // for cheaters spawning cars on top of peoples heads
    if (!client.managedObjects.includes(vehicle.characterId)) return;
    if (!client.character.isAlive) {
      client.blockedPositionUpdates += 1;
      if (client.blockedPositionUpdates >= 50) {
        server.updateCharacterState(
          client,
          client.character.characterId,
          client.character.characterStates,
          false
        );
        server.sendData(client, "Character.StartMultiStateDeath", {
          characterId: client.character.characterId
        });
        client.blockedPositionUpdates = 0;
        return;
      }
    } else client.blockedPositionUpdates = 0;
    if (packet.data.positionUpdate.position) {
      if (
        server.fairPlayManager.checkVehicleSpeed(
          server,
          client,
          packet.data.positionUpdate.sequenceTime,
          packet.data.positionUpdate.position,
          vehicle
        )
      )
        return;
      let kick = false;
      const dist = getDistance(
        vehicle.positionUpdate.position,
        packet.data.positionUpdate.position
      );
      if (dist > 220) {
        kick = true;
      }
      if (
        getDistance1d(
          vehicle.oldPos.position[1],
          packet.data.positionUpdate.position[1]
        ) > 100
      ) {
        kick = true;
        server.kickPlayer(client);
        server.sendChatTextToAdmins(
          `FairPlay: kicking ${client.character.name} for suspeced teleport in vehicle by ${dist} from [${vehicle.positionUpdate.position[0]} ${vehicle.positionUpdate.position[1]} ${vehicle.positionUpdate.position[2]}] to [${packet.data.positionUpdate.position[0]} ${packet.data.positionUpdate.position[1]} ${packet.data.positionUpdate.position[2]}]`,
          false
        );
      }
      vehicle.getPassengerList().forEach((passenger: string) => {
        if (server._characters[passenger]) {
          if (kick) {
            const c = server.getClientByCharId(passenger);
            if (!c) return;
            server.kickPlayer(c);
            server.sendChatTextToAdmins(
              `FairPlay: kicking ${c.character.name} for suspeced teleport in vehicle by ${dist} from [${vehicle.positionUpdate.position[0]} ${vehicle.positionUpdate.position[1]} ${vehicle.positionUpdate.position[2]}] to [${packet.data.positionUpdate.position[0]} ${packet.data.positionUpdate.position[1]} ${packet.data.positionUpdate.position[2]}]`,
              false
            );
            return;
          }
          server._characters[passenger].state.position = new Float32Array([
            packet.data.positionUpdate.position[0],
            packet.data.positionUpdate.position[1],
            packet.data.positionUpdate.position[2],
            1
          ]);
          const c = server.getClientByCharId(passenger);
          if (c) c.startLoc = packet.data.positionUpdate.position[1];
        } else {
          debug(`passenger ${passenger} not found`);
          vehicle.removePassenger(passenger);
        }
      });
      if (kick) return;
      if (
        client.hudTimer != null &&
        !isPosInRadius(
          1,
          client.character.state.position,
          client.posAtTimerStart
        )
      ) {
        server.stopHudTimer(client);
        delete client.hudTimer;
      }
      vehicle.state.position = new Float32Array([
        packet.data.positionUpdate.position[0],
        packet.data.positionUpdate.position[1] - 0.4,
        packet.data.positionUpdate.position[2],
        1
      ]);
      // disabled, dont think we need it and wastes alot of resources
      /*if (client.vehicle.mountedVehicle === characterId) {
        if (
          !client.posAtLastRoutine ||
          !isPosInRadius(
            server._charactersRenderDistance / 2.5,
            client.character.state.position,
            client.posAtLastRoutine
          )
        ) {
          server.executeFuncForAllReadyClients(() => server.vehicleManager);
        }
      }*/
    }
    //if (!server._soloMode) {
    server.sendDataToAllOthersWithSpawnedEntity(
      server._vehicles,
      client,
      characterId,
      "PlayerUpdatePosition",
      {
        transientId: packet.data.transientId,
        positionUpdate: packet.data.positionUpdate
      }
    );
    //}
    if (packet.data.positionUpdate.engineRPM) {
      vehicle.engineRPM = packet.data.positionUpdate.engineRPM;
    }

    const positionUpdate: positionUpdate = packet.data.positionUpdate;
    if (positionUpdate.orientation) {
      vehicle.positionUpdate.orientation = positionUpdate.orientation;
      vehicle.state.rotation = eul2quat(
        new Float32Array([packet.data.positionUpdate.orientation, 0, 0, 0])
      );
    }
    if (positionUpdate.frontTilt) {
      vehicle.positionUpdate.frontTilt = positionUpdate.frontTilt;
    }
    if (positionUpdate.sideTilt) {
      vehicle.positionUpdate.sideTilt = positionUpdate.sideTilt;
    }
  }
  VehicleStateData(server: ZoneServer2016, client: Client, packet: any) {
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
  PlayerUpdateUpdatePositionClientToZone(
    server: ZoneServer2016,
    client: Client,
    packet: any
  ) {
    if (client.character.tempGodMode) {
      server.setTempGodMode(client, false);
    }
    client.character.positionUpdate = packet.data;
    if (packet.data.flags === 513) {
      // head rotation when in vehicle, client spams this packet every 1ms even if you dont move, disabled for now(it doesnt work anyway)
      return;
    }
    if (!client.character.isAlive) {
      client.blockedPositionUpdates += 1;
      if (client.blockedPositionUpdates >= 30) {
        server.updateCharacterState(
          client,
          client.character.characterId,
          client.character.characterStates,
          false
        );
        server.sendData(client, "Character.StartMultiStateDeath", {
          characterId: client.character.characterId
        });
        return;
      }
    } else client.blockedPositionUpdates = 0;

    if (packet.data.stance) {
      const stanceFlags = getStanceFlags(packet.data.stance);

      server.fairPlayManager.detectJumpXSMovement(server, client, stanceFlags);

      server.fairPlayManager.detectDroneMovement(server, client, stanceFlags);

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
      client.character.isRunning = stanceFlags.SPRINTING;
      if (
        stanceFlags.JUMPING &&
        !stanceFlags.FLOATING &&
        // temporary fix for multiplying jump penalty until exact flags are found
        client.character.lastJumpTime < packet.data.sequenceTime &&
        !client.character.isGodMode()
      ) {
        client.character.lastJumpTime = packet.data.sequenceTime + 1100;
        client.character._resources[ResourceIds.STAMINA] -= 12; // 2% stamina jump penalty
        if (client.character._resources[ResourceIds.STAMINA] < 0)
          client.character._resources[ResourceIds.STAMINA] = 0;
        server.updateResourceToAllWithSpawnedEntity(
          client.character.characterId,
          client.character._resources[ResourceIds.STAMINA],
          ResourceIds.STAMINA,
          ResourceTypes.STAMINA,
          server._characters
        );
      }
      client.character.stance = packet.data.stance;
    }
    const movingCharacter = server._characters[client.character.characterId];
    if (movingCharacter) {
      server.sendRawToAllOthersWithSpawnedCharacter(
        client,
        movingCharacter.characterId,
        server._protocol.createPositionBroadcast2016(
          packet.data.raw,
          movingCharacter.transientId
        )
      );
    }
    if (packet.data.position) {
      if (!client.characterReleased) {
        client.characterReleased = true;
      }
      if (
        server.fairPlayManager.checkPlayerSpeed(
          server,
          client,
          packet.data.sequenceTime,
          packet.data.position
        )
      )
        return;
      /*if (!client.isAdmin) {
        const distance = getDistance(
          client.character.state.position,
          packet.data.position
        );
        if (distance >= 1) {
          server.sendChatTextToAdmins(
            `FairPlay: kicking ${client.character.name}`
          );
          server.kickPlayer(client);
          const pos = packet.data.position;
          server.sendChatTextToAdmins(
            `FairPlay: ${
              client.character.name
            } position desynced by ${distance.toFixed(2)} at [${pos[0]} ${
              pos[1]
            } ${pos[2]}]`
          );
        }
      }*/
      client.character.state.position = new Float32Array([
        packet.data.position[0],
        packet.data.position[1],
        packet.data.position[2],
        0
      ]);
      if (
        client.hudTimer != null &&
        !isPosInRadius(
          1,
          client.character.state.position,
          client.posAtTimerStart
        )
      ) {
        server.stopHudTimer(client);
        delete client.hudTimer;
      }

      if (
        client.character.mountedContainer &&
        !server._vehicles[client.character.mountedContainer.characterId]
      ) {
        if (
          !isPosInRadius(
            client.character.mountedContainer.interactionDistance,
            client.character.state.position,
            client.character.mountedContainer.state.position
          )
        ) {
          client.character.dismountContainer(server);
        }
      }

      // mainly for melee workaround (3s timeout)
      if (
        client.character.currentInteractionGuid &&
        client.character.lastInteractionStringTime + 3000 > Date.now()
      ) {
        client.character.currentInteractionGuid = "";
        client.character.lastInteractionStringTime = 0;
      }

      // for door locks (1m timeout)
      if (
        client.character.lastInteractionRequestGuid &&
        client.character.lastInteractionTime + 60000 > Date.now()
      ) {
        // should timeout lock ui here if possible
        client.character.lastInteractionRequestGuid = "";
        client.character.lastInteractionTime = 0;
      }
    } else if (packet.data.vehicle_position && client.vehicle.mountedVehicle) {
      server._vehicles[client.vehicle.mountedVehicle].state.position =
        new Float32Array([
          packet.data.vehicle_position[0],
          packet.data.vehicle_position[1],
          packet.data.vehicle_position[2],
          0
        ]);
    }
    if (packet.data.rotation) {
      client.character.state.rotation = new Float32Array([
        packet.data.rotation[0],
        packet.data.rotation[1],
        packet.data.rotation[2],
        packet.data.rotation[3]
      ]);
      client.character.state.yaw = packet.data.rotationRaw[0];
      client.character.state.lookAt = new Float32Array([
        packet.data.lookAt[0],
        packet.data.lookAt[1],
        packet.data.lookAt[2],
        packet.data.lookAt[3]
      ]);
    }
    if (
      client.character.isSpectator &&
      _.size(server._decoys) > 0 &&
      client.isDecoy
    ) {
      server.sendDataToAll("PlayerUpdatePosition", {
        transientId: client.character.transientId,
        positionUpdate: packet.data
      });
    }
  }
  CharacterRespawn(server: ZoneServer2016, client: Client, packet: any) {
    this.commandHandler.executeInternalCommand(
      server,
      client,
      "respawn",
      packet
    );
  }
  SpectatorTeleport(server: ZoneServer2016, client: Client, packet: any) {
    server.dropAllManagedObjects(client);
    server.sendData(client, "ClientUpdate.UpdateLocation", {
      position: [packet.data.x, 355, packet.data.y, 1],
      triggerLoadingScreen: false
    });
    server.sendData(client, "ClientUpdate.UpdateManagedLocation", {
      characterId: OBSERVER_GUID,
      position: [
        packet.data.x,
        client.character.state.position[1],
        packet.data.y,
        1
      ],
      triggerLoadingScreen: false
    });
  }
  CharacterFullCharacterDataRequest(
    server: ZoneServer2016,
    client: Client,
    packet: any
  ) {
    if (packet.data.characterId == EXTERNAL_CONTAINER_GUID) {
      server.sendData(client, "LightweightToFullNpc", {
        transientId: 0,
        attachmentData: {},
        characterId: EXTERNAL_CONTAINER_GUID,
        resources: {
          data: {}
        },
        effectTags: [],
        unknownData1: {},
        targetData: {},
        unknownArray1: [],
        unknownArray2: [],
        unknownArray3: { data: {} },
        unknownArray4: { data: {} },
        unknownArray5: { data: {} },
        remoteWeapons: {
          isVehicle: false,
          data: {}
        },
        itemsData: {
          items: {},
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
  CommandPlayerSelect(server: ZoneServer2016, client: Client, packet: any) {
    debug("Command.PlayerSelect");
  }
  LockssetLock(server: ZoneServer2016, client: Client, packet: any) {
    if (!client.character.isAlive || client.isLoading) return;

    // if player hits cancel
    if (packet.data.password === 1) return;

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
    if (doorEntity.ownerCharacterId === client.character.characterId) {
      if (doorEntity.passwordHash != packet.data.password) {
        doorEntity.passwordHash = packet.data.password;
        doorEntity.grantedAccess = [];
        doorEntity.grantedAccess.push(client.character.characterId);
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
  MountDismountRequest(server: ZoneServer2016, client: Client, packet: any) {
    // only for driver seat
    server.dismountVehicle(client);
  }
  VehicleCurrentMoveMode(
    server: ZoneServer2016,
    client: Client,
    packet: { data: VehicleCurrentMoveMode }
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
  VehicleDismiss(server: ZoneServer2016, client: Client, packet: any) {
    const vehicleGuid = client.vehicle.mountedVehicle;
    if (vehicleGuid) {
      server.dismountVehicle(client);
      server.dismissVehicle(vehicleGuid);
    }
  }
  VehicleAccessType(server: ZoneServer2016, client: Client, packet: any) {
    const vehicleGuid = packet.data.vehicleGuid;
    const accessType = packet.data.accessType;
    server._vehicles[vehicleGuid].handleVehicleLock(server, accessType);
  }
  CommandInteractionString(
    server: ZoneServer2016,
    client: Client,
    packet: any
  ) {
    const entity = server.getEntity(packet.data.guid);
    if (!entity) return;
    if (entity instanceof Crate) {
      client.character.currentInteractionGuid = packet.data.guid;
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
    )
      return;
    client.character.currentInteractionGuid = packet.data.guid;
    client.character.lastInteractionStringTime = Date.now();
    if (
      entity instanceof BaseLightweightCharacter &&
      !(entity instanceof Destroyable) &&
      !client.sentInteractionData.includes(entity)
    ) {
      server.sendData(client, "Replication.NpcComponent", {
        transientId: entity.transientId,
        nameId: entity.nameId
      });
      client.sentInteractionData.push(entity);
      if (
        !(
          entity instanceof ConstructionParentEntity ||
          entity instanceof ConstructionChildEntity
        )
      ) {
        server.sendData(client, "Replication.InteractionComponent", {
          transientId: entity.transientId
        });
      }
    }
    entity.OnInteractionString(server, client);
  }
  MountSeatChangeRequest(server: ZoneServer2016, client: Client, packet: any) {
    //server.changeSeat(client, packet); disabled for now
  }
  ConstructionPlacementFinalizeRequest(
    server: ZoneServer2016,
    client: Client,
    packet: any
  ) {
    if (packet.data.itemDefinitionId === 0) return;
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
    if (Number(final[0].toFixed(2)) === 0.0) {
      final[0] = 0;
    }
    const modelId = server.getItemDefinition(
      packet.data.itemDefinitionId
    ).PLACEMENT_MODEL_ID;
    server.constructionManager.placement(
      server,
      client,
      packet.data.itemDefinitionId,
      modelId,
      packet.data.position2,
      final,
      packet.data.parentObjectCharacterId,
      packet.data.BuildingSlot
    );
  }
  CommandItemDefinitionRequest(
    server: ZoneServer2016,
    client: Client,
    packet: any
  ) {
    debug(`ItemDefinitionRequest ID: ${packet.data.ID}`);

    const itemDef = server.getItemDefinition(packet.data.ID);

    if (!itemDef) {
      debug(
        `ERROR: No ItemDefinition found for ItemDefinitonID: ${packet.data.ID}`
      );
      return;
    }
    server.sendData(client, "Command.ItemDefinitionReply", {
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
    });
    if (server.isContainer(itemDef.ID)) {
      // Fixes containers missing an itemdefinition not showing in inventory
      client.character.updateLoadout(server);
    }
  }
  CharacterWeaponStance(server: ZoneServer2016, client: Client, packet: any) {
    if (client.character.positionUpdate) {
      client.character.weaponStance = packet.data.stance;
    }
    server.sendDataToAllOthersWithSpawnedEntity(
      server._characters,
      client,
      client.character.characterId,
      "Character.WeaponStance",
      {
        characterId: client.character.characterId,
        stance: packet.data.stance
      }
    );
  }
  CommandRedeploy(server: ZoneServer2016, client: Client, packet: any) {
    const damageInfo: DamageInfo = {
      entity: "",
      damage: 0
    };
    server.killCharacter(client, damageInfo);
  }
  FirstTimeEventInventoryAccess(
    server: ZoneServer2016,
    client: Client,
    packet: any
  ) {
    const proximityItems = server.getProximityItems(client.character);
    server.sendData(client, "ClientUpdate.ProximateItems", proximityItems);
  }
  CommandSuicide(server: ZoneServer2016, client: Client, packet: any) {
    server.killCharacter(client, {
      entity: client.character.characterId,
      damage: 9999
    });
  }
  //#region ITEMS
  RequestUseItem(server: ZoneServer2016, client: Client, packet: any) {
    debug(packet.data);
    const { itemGuid, itemUseOption, targetCharacterId, sourceCharacterId } =
      packet.data;
    const { count } = packet.data.itemSubData;

    if (count < 1) return;
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

    // temporarily block most use options from external containers
    switch (itemUseOption) {
      case ItemUseOptions.LOOT:
      case ItemUseOptions.LOOT_BATTERY:
      case ItemUseOptions.LOOT_SPARKS:
      case ItemUseOptions.LOOT_VEHICLE_LOADOUT:
      case ItemUseOptions.DROP:
      case ItemUseOptions.DROP_BATTERY:
      case ItemUseOptions.DROP_SPARKS:
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
        if (!(character instanceof Character2016)) {
          server.sendAlert(
            client,
            "This use option is temporarily disabled from use in containers."
          );
          return;
        }
    }

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
        server.dropItem(character, item, count);
        if (character instanceof BaseLootableEntity) {
          // remount container to keep items from changing slotIds
          client.character.mountContainer(server, character);
        }
        break;
      case ItemUseOptions.SLICE:
        server.sliceItem(client, item);
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
        server.shredItem(client, item);
        break;
      case ItemUseOptions.DRINK:
      case ItemUseOptions.EAT:
      case ItemUseOptions.USE_MEDICAL:
        server.useConsumable(client, item);
        break;
      case ItemUseOptions.USE_AIRDROP:
        server.useAirdrop(client, item);
        break;
      case ItemUseOptions.USE:
        server.useItem(client, item);
        break;
      case ItemUseOptions.REFUEL:
        server.refuelVehicle(client, item, targetCharacterId);
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
        server.salvageAmmo(client, item);
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

        sourceContainer.transferItem(server, targetContainer, item, 0, count);
        break;

      case ItemUseOptions.LOOT_BATTERY:
      case ItemUseOptions.LOOT_SPARKS:
      case ItemUseOptions.LOOT_VEHICLE_LOADOUT:
        const sourceCharacter = client.character.mountedContainer;
        if (!sourceCharacter) return;
        const loadoutItem = sourceCharacter.getLoadoutItem(itemGuid);
        if (loadoutItem) {
          const container = client.character.getAvailableContainer(
            server,
            loadoutItem.itemDefinitionId,
            1
          );
          if (!container) {
            server.sendData(client, "Character.NoSpaceNotification", {
              characterId: client.character.characterId
            });
            return;
          }
          sourceCharacter.transferItemFromLoadout(
            server,
            container,
            loadoutItem
          );
          if (sourceCharacter instanceof Vehicle2016) {
            sourceCharacter.checkEngineRequirements(server);
          }
          return;
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
      case ItemUseOptions.REPAIR:
        /*
        const repairItem = character.getInventoryItem(packet.data.itemGuid);
        if(!repairItem) {
          server.sendChatText(client, "[ERROR] Invalid weapon");
          return;
        }
        server.repairOption(client, item, repairItem);*/
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
    packet: any
  ) {
    debug(packet.data);
    const modelId = server.getItemDefinition(
      packet.data.itemDefinitionId
    ).PLACEMENT_MODEL_ID;
    if (!modelId) {
      server.sendChatText(
        client,
        `No PLACEMENT_MODEL_ID found for itemDefinitionId ${packet.data.itemDefinitionId}`
      );
      return;
    }
    server.sendData(client, "Construction.PlacementResponse", {
      itemDefinitionId: packet.data.itemDefinitionId,
      model: modelId
    });
  }
  ContainerMoveItem(server: ZoneServer2016, client: Client, packet: any) {
    const {
      containerGuid,
      characterId,
      itemGuid,
      targetCharacterId,
      count,
      newSlotId
    } = packet.data;
    const sourceCharacterId = characterId;
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
        const sourceContainer = client.character.getItemContainer(itemGuid),
          targetContainer =
            client.character.getContainerFromGuid(containerGuid);
        if (sourceContainer) {
          // from container
          const item = sourceContainer.items[itemGuid];
          if (!item) {
            server.containerError(client, ContainerErrors.NO_ITEM_IN_SLOT);
            return;
          }
          if (item.weapon) {
            const ammo = server.generateItem(
              server.getWeaponAmmoId(item.itemDefinitionId),
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
          const loadoutItem = sourceCharacter.getLoadoutItem(itemGuid);
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
            const loadoutItem = client.character.getLoadoutItem(itemGuid);
            if (!loadoutItem) {
              server.containerError(client, ContainerErrors.NO_ITEM_IN_SLOT);
              return;
            }
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
        const sourceContainer = sourceCharacter.getItemContainer(itemGuid),
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

        const loadoutItem = sourceCharacter.getLoadoutItem(itemGuid);
        if (loadoutItem) {
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

        const item = sourceContainer.items[itemGuid];
        if (!item) {
          server.containerError(client, ContainerErrors.NO_ITEM_IN_SLOT);
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
          )
            return;

          targetCharacter.equipContainerItem(
            server,
            item,
            newSlotId,
            sourceCharacter
          );
          if (targetCharacter instanceof Vehicle2016) {
            targetCharacter.checkEngineRequirements(server);
          }
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

      const sourceContainer = sourceCharacter.getItemContainer(itemGuid);
      if (!sourceContainer) {
        server.sendChatText(client, "Invalid source container 3!");
        return;
      }

      const item = sourceContainer.items[itemGuid];
      if (!item) {
        server.containerError(client, ContainerErrors.NO_ITEM_IN_SLOT);
        return;
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

      const targetContainer =
        client.character.getContainerFromGuid(containerGuid);

      if (targetContainer) {
        // to container

        if (
          !targetContainer.getHasSpace(server, item.itemDefinitionId, count)
        ) {
          server.sendData(client, "Character.NoSpaceNotification", {
            characterId: client.character.characterId
          });
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
      } else if (sourceCharacter.getContainerFromGuid(containerGuid)) {
        // remount container if trying to move around items in one container since slotIds aren't setup yet
        client.character.mountContainer(server, sourceCharacter);
      } else {
        // invalid
        server.containerError(client, ContainerErrors.UNKNOWN_CONTAINER);
      }
      return;
    }
  }
  LoadoutSelectSlot(server: ZoneServer2016, client: Client, packet: any) {
    const slot = client.character._loadout[packet.data.slotId];
    if (!slot) {
      server.sendChatText(client, "[ERROR] Target slot is empty!");
      return;
    }
    server.switchLoadoutSlot(client, slot);
  }
  NpcFoundationPermissionsManagerEditPermission(
    server: ZoneServer2016,
    client: Client,
    packet: any
  ) {
    const foundation = server._constructionFoundations[
      packet.data.objectCharacterId
    ] as ConstructionParentEntity;
    if (
      foundation.ownerCharacterId != client.character.characterId &&
      (!client.isAdmin || !client.isDebugMode) // allows debug mode
    )
      return; // add debug admin
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
    if (characterId == foundation.ownerCharacterId) {
      server.sendAlert(client, "You can't edit your own permissions.");
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
      foundation.permissions[characterId] == obj;
    }

    // update child expansion permissions
    Object.values(
      server._constructionFoundations[packet.data.objectCharacterId]
        .occupiedExpansionSlots
    ).forEach((expansion) => {
      expansion.permissions = foundation.permissions;
    });

    // update permissions list
    server.sendData(
      client,
      "NpcFoundationPermissionsManagerBase.showPermissions",
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
  NpcFoundationPermissionsManagerAddPermission(
    server: ZoneServer2016,
    client: Client,
    packet: any
  ) {
    const foundation = server._constructionFoundations[
      packet.data.objectCharacterId
    ] as ConstructionParentEntity;
    if (
      foundation.ownerCharacterId != client.character.characterId &&
      (!client.isAdmin || !client.isDebugMode)
    )
      return;
    let characterId = "";
    for (const a in server._characters) {
      const character = server._characters[a];
      if (character.name === packet.data.characterName) {
        characterId = character.characterId;
      }
    }

    // check existing characters in foundation permissions
    if (!characterId) {
      for (const a in foundation.permissions) {
        const permissions = foundation.permissions[a];
        if (permissions.characterName === packet.data.characterName) {
          characterId = permissions.characterId;
        }
      }
    }

    if (characterId == foundation.ownerCharacterId) {
      server.sendAlert(client, "You can't edit your own permissions.");
      return;
    }
    if (!characterId) return;
    let obj: ConstructionPermissions = foundation.permissions[characterId];
    if (!obj) {
      obj = {
        characterId: characterId,
        characterName: packet.data.characterName,
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
      server._constructionFoundations[packet.data.objectCharacterId]
        .occupiedExpansionSlots
    ).forEach((expansion) => {
      expansion.permissions = foundation.permissions;
    });

    server.sendData(
      client,
      "NpcFoundationPermissionsManagerBase.showPermissions",
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
  Weapon(server: ZoneServer2016, client: Client, packet: any) {
    debug("Weapon.Weapon");
    if (client.character.tempGodMode) {
      server.setTempGodMode(client, false);
    }
    switch (packet.data.weaponPacket.packetName) {
      case "Weapon.MultiWeapon":
        packet.data.weaponPacket.packet.packets.forEach((p: any) => {
          handleWeaponPacket(p);
        });
        break;
      default:
        handleWeaponPacket(packet.data.weaponPacket);
        break;
    }

    // this function is disgusting: TODO: FIX IT - MEME

    function handleWeaponPacket(p: any) {
      const weaponItem = client.character.getEquippedWeapon();
      if (!weaponItem || !weaponItem.weapon) return;
      switch (p.packetName) {
        case "Weapon.FireStateUpdate":
          // wrench workaround
          if (
            weaponItem.itemDefinitionId == Items.WEAPON_WRENCH &&
            client.character.currentInteractionGuid
          ) {
            if (
              !client.character.temporaryScrapTimeout &&
              server.getEntityType(client.character.currentInteractionGuid) ==
                EntityTypes.VEHICLE
            ) {
              const vehicle = server.getEntity(
                client.character.currentInteractionGuid
              ) as Vehicle2016;
              if (!client.character.temporaryScrapSoundTimeout) {
                server.sendCompositeEffectToAllInRange(
                  15,
                  client.character.characterId,
                  vehicle.state.position,
                  1605
                );
                client.character.temporaryScrapSoundTimeout = setTimeout(() => {
                  delete client.character.temporaryScrapSoundTimeout;
                }, 1000);
              }
              if (
                vehicle &&
                vehicle._resources[ResourceIds.CONDITION] < 100000
              ) {
                vehicle.damage(server, { entity: "", damage: -2000 });
                server.damageItem(client, weaponItem, 40);
                if (Math.abs(vehicle.positionUpdate.sideTilt) > 2) {
                  let c: Client | undefined;
                  for (const a in server._clients) {
                    if (
                      server._clients[a].managedObjects.includes(
                        vehicle.characterId
                      )
                    ) {
                      c = server._clients[a];
                    }
                  }
                  if (c) {
                    vehicle.positionUpdate.sideTilt = 0;
                    server.sendData(c, "ClientUpdate.UpdateManagedLocation", {
                      characterId: vehicle.characterId,
                      position: vehicle.state.position,
                      rotation: eul2quat(
                        new Float32Array([
                          vehicle.positionUpdate.orientation,
                          vehicle.positionUpdate.sideTilt,
                          vehicle.positionUpdate.frontTilt
                        ])
                      )
                    });
                  }
                }
                client.character.temporaryScrapTimeout = setTimeout(() => {
                  delete client.character.temporaryScrapTimeout;
                }, 300);
              }
            }
          }
          // crowbar workaround
          if (
            weaponItem.itemDefinitionId == Items.WEAPON_CROWBAR &&
            client.character.currentInteractionGuid
          ) {
            const entity = server.getLootableEntity(
              client.character.currentInteractionGuid
            ) as LootableProp;
            if (entity) {
              const allowedSpawners = [
                "Wrecked Van",
                "Wrecked Car",
                "Wrecked Truck"
              ];
              if (!client.character.temporaryScrapSoundTimeout) {
                server.sendCompositeEffectToAllInRange(
                  15,
                  client.character.characterId,
                  entity.state.position,
                  1605
                );
                client.character.temporaryScrapSoundTimeout = setTimeout(() => {
                  delete client.character.temporaryScrapSoundTimeout;
                }, 1000);
              }
              if (
                allowedSpawners.includes(entity.lootSpawner) &&
                !client.character.temporaryScrapTimeout
              ) {
                const chance = Math.floor(Math.random() * 100) + 1;
                if (chance <= 60) {
                  client.character.lootItem(
                    server,
                    server.generateItem(Items.METAL_SCRAP)
                  );
                  server.damageItem(client, weaponItem, 50);
                }
                client.character.temporaryScrapTimeout = setTimeout(
                  () => {
                    delete client.character.temporaryScrapTimeout;
                  },
                  Math.floor(Math.random() * (6000 - 1000 + 1) + 1000)
                );
              }
            }
          }
          // demolition hammer workaround
          if (
            weaponItem.itemDefinitionId == Items.WEAPON_HAMMER_DEMOLITION &&
            client.character.currentInteractionGuid
          ) {
            const entity = server.getConstructionEntity(
                client.character.currentInteractionGuid
              ),
              permission = entity?.getHasPermission(
                server,
                client.character.characterId,
                ConstructionPermissionIds.DEMOLISH
              );
            if (
              entity &&
              !(
                entity.itemDefinitionId == Items.FOUNDATION ||
                entity.itemDefinitionId == Items.FOUNDATION_EXPANSION ||
                entity.itemDefinitionId == Items.GROUND_TAMPER
              )
            ) {
              if (permission) {
                if (entity.canUndoPlacement(server, client)) {
                  // give back item only if can undo
                  client.character.lootItem(
                    server,
                    server.generateItem(entity.itemDefinitionId)
                  );
                  entity.destroy(server);
                } else {
                  if (
                    entity.itemDefinitionId != Items.FOUNDATION_RAMP &&
                    entity.itemDefinitionId != Items.FOUNDATION_STAIRS
                  ) {
                    if (!client.character.temporaryScrapSoundTimeout) {
                      client.character.temporaryScrapSoundTimeout = setTimeout(
                        () => {
                          delete client.character.temporaryScrapSoundTimeout;
                        },
                        375
                      );
                      server.sendCompositeEffectToAllInRange(
                        15,
                        client.character.characterId,
                        entity.state.position,
                        1667
                      );
                      const damageInfo: DamageInfo = {
                        entity: "Server.DemoHammer",
                        damage: 250000
                      };
                      if (entity instanceof ConstructionParentEntity) {
                        entity.damageSimpleNpc(
                          server,
                          damageInfo,
                          server._constructionFoundations
                        );
                      } else if (entity instanceof ConstructionChildEntity) {
                        entity.damageSimpleNpc(
                          server,
                          damageInfo,
                          server._constructionSimple
                        );
                      } else if (entity instanceof ConstructionDoor) {
                        entity.damageSimpleNpc(
                          server,
                          damageInfo,
                          server._constructionDoors
                        );
                      } else if (entity instanceof LootableConstructionEntity) {
                        entity.damageSimpleNpc(
                          server,
                          damageInfo,
                          server._lootableConstruction
                        );
                      }

                      if (entity.health > 0) return;
                      entity.destroy(server);
                    }
                  }
                }
              } else {
                server.constructionManager.placementError(
                  server,
                  client,
                  ConstructionErrors.DEMOLISH_PERMISSION
                );
              }
            }
          }

          // hammer workaround
          if (
            weaponItem.itemDefinitionId == Items.WEAPON_HAMMER &&
            client.character.currentInteractionGuid
          ) {
            server.constructionManager.hammerConstructionEntity(
              server,
              client,
              weaponItem
            );
            return;
          }

          // crate damaging workaround
          if (client.character.currentInteractionGuid) {
            const entity =
              server._crates[client.character.currentInteractionGuid];
            if (
              entity &&
              entity.spawnTimestamp < Date.now() &&
              isPosInRadius(
                3,
                entity.state.position,
                client.character.state.position
              )
            ) {
              if (!client.character.temporaryScrapSoundTimeout) {
                client.character.temporaryScrapSoundTimeout = setTimeout(() => {
                  delete client.character.temporaryScrapSoundTimeout;
                }, 375);
                server.sendCompositeEffectToAllInRange(
                  15,
                  client.character.characterId,
                  entity.state.position,
                  1667
                );
                const damageInfo: DamageInfo = {
                  entity: "Server.WorkAroundMelee",
                  damage: 1250
                };
                entity.OnProjectileHit(server, damageInfo);
              }
            }
          }

          // windows damaging workaround
          if (client.character.currentInteractionGuid) {
            const entity =
              server._destroyables[client.character.currentInteractionGuid];
            if (
              entity &&
              entity.destroyedModel &&
              isPosInRadius(
                3,
                entity.state.position,
                client.character.state.position
              )
            ) {
              if (!client.character.temporaryScrapSoundTimeout) {
                client.character.temporaryScrapSoundTimeout = setTimeout(() => {
                  delete client.character.temporaryScrapSoundTimeout;
                }, 210);
                server.sendCompositeEffectToAllInRange(
                  15,
                  client.character.characterId,
                  entity.state.position,
                  1663
                );
                const damageInfo: DamageInfo = {
                  entity: "Server.WorkAroundMelee",
                  damage: 700
                };
                entity.OnProjectileHit(server, damageInfo);
              }
            }
          }

          if (p.packet.firestate == 64) {
            // empty firestate
            server.sendRemoteWeaponUpdateDataToAllOthers(
              client,
              client.character.transientId,
              weaponItem.itemGuid,
              "Update.Empty",
              {}
            );
            server.sendRemoteWeaponUpdateDataToAllOthers(
              client,
              client.character.transientId,
              weaponItem.itemGuid,
              "Update.FireState",
              {
                state: {
                  firestate: 64,
                  transientId: client.character.transientId,
                  position: client.character.state.position
                }
              }
            );
          }
          // prevent empty weapons from entering an active firestate
          if (
            !weaponItem.weapon?.ammoCount &&
            weaponItem.itemDefinitionId != Items.WEAPON_BOW_MAKESHIFT &&
            weaponItem.itemDefinitionId != Items.WEAPON_BOW_RECURVE &&
            weaponItem.itemDefinitionId != Items.WEAPON_BOW_WOOD
          )
            return;
          if (p.packet.firestate > 0) {
            server.sendRemoteWeaponUpdateDataToAllOthers(
              client,
              client.character.transientId,
              weaponItem.itemGuid,
              "Update.Chamber",
              {}
            );
          }
          server.sendRemoteWeaponUpdateDataToAllOthers(
            client,
            client.character.transientId,
            weaponItem.itemGuid,
            "Update.FireState",
            {
              state: {
                firestate: p.packet.firestate,
                transientId: client.character.transientId,
                position: client.character.state.position
              }
            }
          );
          if (weaponItem.weapon.ammoCount)
            server.damageItem(client, weaponItem, 2);
          break;
        case "Weapon.Fire":
          if (weaponItem.weapon.ammoCount <= 0) return;
          if (weaponItem.weapon.ammoCount > 0) {
            weaponItem.weapon.ammoCount -= 1;
          }
          if (
            !client.vehicle.mountedVehicle &&
            server.fairPlayManager.fairPlayValues
          ) {
            if (
              getDistance(client.character.state.position, p.packet.position) >
              server.fairPlayManager.fairPlayValues?.maxPositionDesync
            ) {
              server.sendChatText(
                client,
                `FairPlay: Your shot didnt register due to position desync`
              );
              server.sendChatTextToAdmins(
                `FairPlay: ${
                  client.character.name
                }'s shot didnt register due to position desync by ${getDistance(
                  client.character.state.position,
                  p.packet.position
                )}`
              );
            }
          }
          const drift = Math.abs(p.gameTime - server.getServerTime());
          if (drift > server.fairPlayManager.maxPing + 200) {
            server.sendChatText(
              client,
              `FairPlay: Your shot didnt register due to packet loss or high ping`
            );
            server.sendChatTextToAdmins(
              `FairPlay: ${client.character.name}'s shot wasnt registered due to time drift by ${drift}`
            );
            return;
          }
          const keys = Object.keys(client.fireHints);
          const lastFireHint = client.fireHints[Number(keys[keys.length - 1])];
          if (lastFireHint) {
            let blockedTime = 50;
            switch (weaponItem.itemDefinitionId) {
              case Items.WEAPON_308:
              case Items.WEAPON_REAPER:
                blockedTime = 1300;
                break;
              case Items.WEAPON_SHOTGUN:
              case Items.WEAPON_NAGAFENS_RAGE:
                blockedTime = 400;
                break;
            }
            if (p.gameTime - lastFireHint.timeStamp < blockedTime) return;
          }
          let hitNumber = 0;
          if (
            !client.vehicle.mountedVehicle &&
            !isPosInRadius(
              3,
              client.character.state.position,
              p.packet.position
            )
          )
            hitNumber = 1;
          const shotProjectiles =
            weaponItem.itemDefinitionId == Items.WEAPON_SHOTGUN ||
            weaponItem.itemDefinitionId == Items.WEAPON_NAGAFENS_RAGE
              ? 12
              : 1;
          for (let x = 0; x < shotProjectiles; x++) {
            const fireHint: fireHint = {
              id: p.packet.sessionProjectileCount + x,
              position: p.packet.position,
              rotation: client.character.state.yaw,
              hitNumber: hitNumber,
              weaponItem: weaponItem,
              timeStamp: p.gameTime
            };
            client.fireHints[p.packet.sessionProjectileCount + x] = fireHint;
            setTimeout(() => {
              delete client.fireHints[p.packet.sessionProjectileCount + x];
            }, 10000);
          }
          server.fairPlayManager.hitMissFairPlayCheck(
            server,
            client,
            false,
            ""
          );
          server.stopHudTimer(client);
          server.sendRemoteWeaponUpdateDataToAllOthers(
            client,
            client.character.transientId,
            weaponItem.itemGuid,
            "Update.ProjectileLaunch",
            {}
          );
          break;
        case "Weapon.ProjectileHitReport":
          const weapon = client.character.getEquippedWeapon();
          if (!weapon) return;
          if (weapon.itemDefinitionId == Items.WEAPON_REMOVER) {
            if (!client.isAdmin) return;
            const characterId = p.packet.hitReport.characterId,
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
          server.registerHit(client, p.packet, p.gameTime);
          break;
        case "Weapon.ReloadRequest":
          if (weaponItem.weapon.reloadTimer) return;
          const maxAmmo = server.getWeaponMaxAmmo(weaponItem.itemDefinitionId); // max clip size
          if (weaponItem.weapon.ammoCount >= maxAmmo) return;
          // force 0 firestate so gun doesnt shoot randomly after reloading
          server.sendRemoteWeaponUpdateDataToAllOthers(
            client,
            client.character.transientId,
            weaponItem.itemGuid,
            "Update.FireState",
            {
              state: {
                firestate: 0,
                transientId: client.character.transientId,
                position: client.character.state.position
              }
            }
          );
          server.sendRemoteWeaponUpdateDataToAllOthers(
            client,
            client.character.transientId,
            weaponItem.itemGuid,
            "Update.Reload",
            {}
          );
          const weaponAmmoId = server.getWeaponAmmoId(
              weaponItem.itemDefinitionId
            ),
            reloadTime = server.getWeaponReloadTime(
              weaponItem.itemDefinitionId
            );

          if (
            weaponItem.itemDefinitionId == Items.WEAPON_BOW_MAKESHIFT ||
            weaponItem.itemDefinitionId == Items.WEAPON_BOW_RECURVE ||
            weaponItem.itemDefinitionId == Items.WEAPON_BOW_WOOD
          ) {
            const currentWeapon = client.character.getEquippedWeapon();
            if (
              !currentWeapon ||
              currentWeapon.itemGuid != weaponItem.itemGuid
            ) {
              return;
            }
            const maxReloadAmount = maxAmmo - weaponItem.weapon.ammoCount, // how much ammo is needed for full clip
              reserveAmmo = // how much ammo is in inventory
                client.character.getInventoryItemAmount(weaponAmmoId),
              reloadAmount =
                reserveAmmo >= maxReloadAmount ? maxReloadAmount : reserveAmmo; // actual amount able to reload

            if (
              !server.removeInventoryItems(client, weaponAmmoId, reloadAmount)
            ) {
              return;
            }
            server.sendWeaponReload(
              client,
              weaponItem,
              (weaponItem.weapon.ammoCount += reloadAmount)
            );
            return;
          }
          //#region SHOTGUN ONLY
          if (weaponAmmoId == Items.AMMO_12GA) {
            weaponItem.weapon.reloadTimer = setTimeout(() => {
              if (!weaponItem.weapon?.reloadTimer) {
                client.character.clearReloadTimeout();
                return;
              }
              const reserveAmmo = // how much ammo is in inventory
                client.character.getInventoryItemAmount(weaponAmmoId);
              if (
                !reserveAmmo ||
                (weaponItem.weapon.ammoCount < maxAmmo &&
                  !server.removeInventoryItems(client, weaponAmmoId, 1)) ||
                ++weaponItem.weapon.ammoCount == maxAmmo
              ) {
                server.sendWeaponReload(client, weaponItem);
                server.sendRemoteWeaponUpdateDataToAllOthers(
                  client,
                  client.character.transientId,
                  weaponItem.itemGuid,
                  "Update.ReloadLoopEnd",
                  {
                    endLoop: true
                  }
                );
                client.character.clearReloadTimeout();
                return;
              }
              if (reserveAmmo - 1 < 0) {
                // updated reserve ammo
                server.sendWeaponReload(client, weaponItem);
                server.sendRemoteWeaponUpdateDataToAllOthers(
                  client,
                  client.character.transientId,
                  weaponItem.itemGuid,
                  "Update.ReloadLoopEnd",
                  {
                    endLoop: true
                  }
                );
                client.character.clearReloadTimeout();
                return;
              }
              weaponItem.weapon.reloadTimer.refresh();
            }, reloadTime);
            return;
          }
          //#endregion
          weaponItem.weapon.reloadTimer = setTimeout(() => {
            const currentWeapon = client.character.getEquippedWeapon();
            if (
              !weaponItem.weapon?.reloadTimer ||
              !currentWeapon ||
              currentWeapon.itemGuid != weaponItem.itemGuid
            ) {
              return;
            }
            const maxReloadAmount = maxAmmo - weaponItem.weapon.ammoCount, // how much ammo is needed for full clip
              reserveAmmo = // how much ammo is in inventory
                client.character.getInventoryItemAmount(weaponAmmoId),
              reloadAmount =
                reserveAmmo >= maxReloadAmount ? maxReloadAmount : reserveAmmo; // actual amount able to reload

            if (
              !server.removeInventoryItems(client, weaponAmmoId, reloadAmount)
            ) {
              return;
            }
            server.sendWeaponReload(
              client,
              weaponItem,
              (weaponItem.weapon.ammoCount += reloadAmount)
            );
            client.character.clearReloadTimeout();
          }, reloadTime);
          break;
        case "Weapon.ReloadInterrupt":
          server.reloadInterrupt(client, weaponItem);
          break;
        case "Weapon.SwitchFireModeRequest":
          // workaround so aiming in doesn't sometimes make the shooting sound
          if (!weaponItem.weapon?.ammoCount) return;

          // temp workaround to fix 308 sound while aiming
          // this workaround applies to all weapons
          if (p.packet.firemodeIndex == 1) return;
          server.sendRemoteWeaponUpdateDataToAllOthers(
            client,
            client.character.transientId,
            weaponItem.itemGuid,
            "Update.SwitchFireMode",
            {
              firegroupIndex: p.packet.firegroupIndex,
              firemodeIndex: p.packet.firemodeIndex
            }
          );
          break;
        case "Weapon.WeaponFireHint":
          debug("WeaponFireHint");
          /*if (weaponItem.weapon.ammoCount <= 0) return;
          if (weaponItem.weapon.ammoCount > 0) {
            weaponItem.weapon.ammoCount -= 1;
          }
          const driftH = Math.abs(p.gameTime - server.getServerTime());
          if (driftH > server.maxPing + 200) {
            server.sendChatText(
              client,
              `FairPlay: Your shots didnt register due to packet loss`
            );
            return;
          }
          const keysH = Object.keys(client.fireHints);
          const lastFireHintH =
            client.fireHints[Number(keysH[keysH.length - 1])];
          if (lastFireHintH) {
            let blockedTime = 50;
            switch (weaponItem.itemDefinitionId) {
              case Items.WEAPON_308:
                blockedTime = 1300;
                break;
              case Items.WEAPON_SHOTGUN:
                blockedTime = 400;
                break;
            }
            if (p.gameTime - lastFireHintH.timeStamp < blockedTime) return;
          }
          let hitNumberH = 0;
          if (
            !client.vehicle.mountedVehicle &&
            !isPosInRadius(
              3,
              client.character.state.position,
              p.packet.position
            )
          )
            hitNumberH = 1;
          const shotProjectilesH =
            weaponItem.itemDefinitionId == Items.WEAPON_SHOTGUN ? 12 : 1;
          for (let x = 0; x < shotProjectilesH; x++) {
            const fireHint: fireHint = {
              id: p.packet.sessionProjectileCount + x,
              position: p.packet.position,
              rotation: new Float32Array([...p.packet.rotation, 0]),
              hitNumber: hitNumberH,
              weaponItem: weaponItem,
              timeStamp: p.gameTime,
            };
            client.fireHints[p.packet.sessionProjectileCount + x] = fireHint;
            setTimeout(() => {
              delete client.fireHints[p.packet.sessionProjectileCount + x];
            }, 10000);
          }*/
          break;
        case "Weapon.ProjectileContactReport":
          debug("ProjectileContactReport");
          break;
        case "Weapon.MeleeHitMaterial":
          debug("MeleeHitMaterial");
          break;
        case "Weapon.AimBlockedNotify":
          server.sendRemoteWeaponUpdateDataToAllOthers(
            client,
            client.character.transientId,
            weaponItem.itemGuid,
            "Update.AimBlocked",
            {
              aimBlocked: p.packet.aimBlocked
            }
          );
          break;
        case "Weapon.ProjectileSpawnNpc":
          server.createProjectileNpc(client, p.packet);
          break;
        case "Weapon.ProjectileSpawnAttachedNpc":
          debug("Weapon.ProjectileSpawnAttachedNpc");
          if (client.fireHints[p.packet.sessionProjectileCount]) {
            client.fireHints[p.packet.sessionProjectileCount].marked = {
              characterId: p.packet.characterId,
              position: p.packet.position,
              rotation: p.packet.rotation,
              gameTime: p.gameTime
            };
          }
          break;
        default:
          debug(`Unhandled weapon packet type: ${p.packetName}`);
          break;
      }
    }
  }
  CommandRun(server: ZoneServer2016, client: Client, packet: any) {
    this.commandHandler.executeInternalCommand(server, client, "run", packet);
  }
  CommandSpectate(server: ZoneServer2016, client: Client, packet: any) {
    this.commandHandler.executeInternalCommand(
      server,
      client,
      "spectate",
      packet
    );
  }
  VoiceRadioChannel(server: ZoneServer2016, client: Client, packet: any) {
    if (!client.character._loadout[LoadoutSlots.RADIO]) return;
    if (
      client.character._loadout[LoadoutSlots.RADIO].itemDefinitionId !=
      Items.EMERGENCY_RADIO
    )
      return;
    client.radio = true;
  }
  VoiceLeaveRadio(server: ZoneServer2016, client: Client, packet: any) {
    client.radio = false;
  }
  EndCharacterAccess(server: ZoneServer2016, client: Client, packet: any) {
    client.character.dismountContainer(server);
  }

  GroupInvite(server: ZoneServer2016, client: Client, packet: any) {
    const characterId = packet.data.inviteData.targetCharacter.characterId;
    let target: Client | string | undefined;

    if (Number(characterId)) {
      target = server.getClientByCharId(characterId);
    } else {
      target = server.getClientByNameOrLoginSession(
        packet.data.inviteData.targetCharacter.identity.characterFirstName
      );
    }

    if (!(target instanceof Client)) return;

    server.groupManager.sendGroupInvite(server, client, target);
  }

  GroupJoin(server: ZoneServer2016, client: Client, packet: any) {
    const source = server.getClientByNameOrLoginSession(
      packet.data.inviteData.sourceCharacter.identity.characterName
    );
    if (!(source instanceof Client)) return;

    server.groupManager.handleGroupJoin(
      server,
      source,
      client,
      packet.data.joinState == 1
    );
  }
  //#endregion

  processPacket(server: ZoneServer2016, client: Client, packet: any) {
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
      case "Locks.setLock":
        this.LockssetLock(server, client, packet);
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
      case "PlayerUpdateUpdatePositionClientToZone":
        this.PlayerUpdateUpdatePositionClientToZone(server, client, packet);
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
      default:
        debug(packet);
        debug("Packet not implemented in packetHandlers");
        break;
    }
  }
  async reloadCommandCache() {
    delete require.cache[require.resolve("./commands/commandhandler")];
    const CommandHandler = (require("./commands/commandhandler") as any)
      .CommandHandler;
    this.commandHandler = new CommandHandler();
    this.commandHandler.reloadCommands();
  }
}
