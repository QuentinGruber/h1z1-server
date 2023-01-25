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
  Stances,
  VehicleIds,
  LoadoutSlots,
} from "./models/enums";
import { BaseFullCharacter } from "./entities/basefullcharacter";
import { ConstructionParentEntity } from "./entities/constructionparententity";
import { ConstructionDoor } from "./entities/constructiondoor";
import { CommandHandler } from "./commands/commandhandler";
import { Synchronization } from "types/zone2016packets";
import { VehicleCurrentMoveMode } from "types/zone2015packets";
import { Ban, ConstructionPermissions } from "types/zoneserver";
import { GameTimeSync } from "types/zone2016packets";
import { LootableProp } from "./entities/lootableprop";
import { Vehicle2016 } from "./entities/vehicle";
import { Plant } from "./entities/plant";
import { ConstructionChildEntity } from "./entities/constructionchildentity";
import { Collection } from "mongodb";
import { DB_COLLECTIONS } from "../../utils/enums";

export class zonePacketHandlers {
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

    server.setGodMode(client, true);

    server.sendData(client, "ClientUpdate.DoneSendingPreloadCharacters", {
      done: true,
    }); // Required for WaitForWorldReady

    // Required for WaitForWorldReady
    server.sendData(client, "ClientUpdate.NetworkProximityUpdatesComplete", {});

    server.customizeDTO(client);

    client.character.startRessourceUpdater(client, server);
    server.sendData(client, "Character.CharacterStateDelta", {
      guid1: client.guid,
      guid2: "0x0000000000000000",
      guid3: "0x0000000040000000",
      guid4: "0x0000000000000000",
      gameTime: (server.getServerTime() & 0xffffffff) >>> 0,
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
    server.sendConstructionData(client);
    if (client.firstLoading) {
      client.character.lastLoginDate = toHex(Date.now());
      server.setGodMode(client, false);
      setTimeout(() => {
        server.sendAlert(client, "Welcome to H1emu! :D");
        server.sendChatText(
          client,
          `server population : ${_.size(server._characters)}`
        );
        if (client.isAdmin) {
          server.sendAlert(client, "You are an admin!");
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
        command: "help",
      });
      Object.values(this.commandHandler.commands).forEach((command) => {
        server.sendData(client, "Command.AddWorldCommand", {
          command: command.name,
        });
      });

      server.sendData(client, "Synchronization", {
        serverTime: Int64String(server.getServerTime()),
        serverTime2: Int64String(server.getServerTime()),
      } as Synchronization);

      server.sendData(client, "Character.WeaponStance", {
        // activates weaponstance key
        characterId: client.character.characterId,
        stance: 1,
      });
      client.character.updateEquipment(server); // needed or third person character will be invisible
      client.character.updateLoadout(server); // needed or all loadout context menu entries aren't shown
      if (!server._soloMode) {
        server.sendZonePopulationUpdate();
      }
      // clear /hax run since switching servers doesn't automatically clear it
      server.sendData(client, "Command.RunSpeed", {
        runSpeed: 0,
      });
      client.character.isReady = true;
    }
    if (!client.character.isAlive || client.character.isRespawning) {
      // try to fix stuck on death screen
      server.sendData(client, "Character.StartMultiStateDeath", {
        characterId: client.character.characterId,
      });
    }
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
    const characterId = packet.data.characterId,
      damage: number = packet.data.damage,
      vehicle = server._vehicles[characterId];
    if (characterId === client.character.characterId) {
      if (client.character.vehicleExitDate + 3000 > new Date().getTime()) {
        return;
      }
      if (!client.vehicle.mountedVehicle) {
        // if not mounted
        // fixes collision dmg bug on login
        if (Number(client.character.lastLoginDate) + 4000 >= Date.now()) {
          return;
        }
        client.character.damage(server, { entity: "", damage: damage });
      }
    } else if (vehicle) {
      vehicle.damage(server, { entity: "", damage: damage / 50 });
      //server.DTOhit(client, packet);
    }
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
        info: `name: ${targetClient.character.name}, id:${targetClient.loginSessionId}`,
      },
      {
        title: "Reported player position:",
        info: `${targetClient.character.state.position[0]}   ${targetClient.character.state.position[1]}   ${targetClient.character.state.position[2]}`,
      },
      {
        title: "Distance between players:",
        info: `${client.lastDeathReport?.distance}`,
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
        ).toFixed(0)}%`,
      },
      { title: "Reported player suspicious processes:", info: `:${logs}` },
      {
        title: "Reported by:",
        info: `name: ${client.character.name}, id: ${client.loginSessionId}`,
      },
      {
        title: "Position:",
        info: `${client.character.state.position[0]}   ${client.character.state.position[1]}   ${client.character.state.position[2]}`,
      },
      { title: "Time:", info: `${server.getDateString(Date.now())}` },
      { title: "Total reports this session:", info: `${targetClient.reports}` },
    ];
    delete client.lastDeathReport;
  }

  LobbyGameDefinitionDefinitionsRequest(
    server: ZoneServer2016,
    client: Client,
    packet: any
  ) {
    server.sendData(client, "LobbyGameDefinition.DefinitionsResponse", {
      definitionsData: { data: "" },
    });
  }
  KeepAlive(server: ZoneServer2016, client: Client, packet: any) {
    if (client.isLoading && client.characterReleased) {
      setTimeout(() => {
        client.isLoading = false;
        if (client.routineInterval || !client.characterReleased) return;
        server.executeRoutine(client);
        server.startClientRoutine(client);
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
    if (packet.data.file === "Synchronization.log") {
      if (
        packet.data.message
          .toLowerCase()
          .includes("client clock drifted forward")
      ) {
        const pruned = packet.data.message
          .replace("Client clock drifted forward by ", "")
          .replace("ms over the server interval of ", "");
        const drifted = Number(pruned.match(/\d+/).join("")) / 1000;
        const interval = Number(
          pruned.replace(pruned.match(/\d+/).join(""), "").replace(" s", "")
        );
        if (!server._soloMode) {
          logClientActionToMongo(
            server._db?.collection(DB_COLLECTIONS.FAIRPLAY) as Collection,
            client,
            server._worldId,
            {
              type: "time drifted",
              drifted,
              interval,
              accelerating: (drifted / interval) * 100,
            }
          );
        }
        server.sendChatTextToAdmins(
          `FairPlay: ${
            client.character.name
          } time drifted forward ${drifted} s span of ${interval} s, accelerating by: ${(
            (drifted / interval) *
            100
          ).toFixed(0)}%`,
          false
        );
      }
    }
    if (
      packet.data.file === "ClientProc.log" &&
      !client.clientLogs.includes(packet.data.message)
    ) {
      const suspicious = [
        "cheatengine",
        "injector",
        "gameover",
        "processhacker",
      ];
      const obj = { log: packet.data.message, isSuspicious: false };
      for (let x = 0; x < suspicious.length; x++) {
        if (packet.data.message.toLowerCase().includes(suspicious[x])) {
          obj.isSuspicious = true;
          if (!server._soloMode) {
            logClientActionToMongo(
              server._db?.collection(DB_COLLECTIONS.FAIRPLAY) as Collection,
              client,
              server._worldId,
              { type: "suspicious software", suspicious: suspicious[x] }
            );
          }
          server.sendChatTextToAdmins(
            `FairPlay: ${client.character.name} is using suspicious software - ${suspicious[x]}`,
            false
          );
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
          isProductionZone: 1,
        },
      ],
    });
  }
  ChatChat(server: ZoneServer2016, client: Client, packet: any) {
    const { channel, message } = packet.data; // leave channel for later
    if (!client.radio) {
      server.sendChatToAllInRange(client, message, 300);
    } else if (client.radio) {
      server.sendChatToAllWithRadio(client, message);
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
    server.deleteClient(client);
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
      time3: Int64String(Number(packet.data.clientTime)) + 2,
    };
    server.sendData(client, "Synchronization", reflectedPacket);
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
    if (
      !isPosInRadius(
        isConstruction ? 4 : server._interactionDistance,
        client.character.state.position,
        isConstruction
          ? entity.fixedPosition || entity.state.position
          : entity.state.position
      )
    )
      return;

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
    client.posAtLogoutStart = client.character.state.position;
    if (!client.character.isAlive) {
      // Exit to menu button on respawn screen
      server.sendData(client, "ClientUpdate.CompleteLogoutProcess", {});
      return;
    }
    server.dismountVehicle(client);
    client.character.dismountContainer(server);
    const timerTime = 10000;
    server.sendData(client, "ClientUpdate.StartTimer", {
      stringId: 0,
      time: timerTime,
    });
    if (client.hudTimer != null) {
      clearTimeout(client.hudTimer);
    }
    client.hudTimer = setTimeout(() => {
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
      sessionId: client.loginSessionId,
    });
  }
  ProfileStatsGetPlayerProfileStats(
    server: ZoneServer2016,
    client: Client,
    packet: any
  ) {
    server.sendData(
      client,
      "ProfileStats.PlayerProfileStats",
      require("../../../data/profilestats.json")
    );
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
    const hwidBanned: Ban = (await server._db
      ?.collection(DB_COLLECTIONS.BANNED)
      .findOne({ HWID: client.HWID, active: true })) as unknown as Ban;
    if (hwidBanned?.expirationDate < Date.now()) {
      client.banType = hwidBanned.banType;
      server.enforceBan(client);
    }
  }
  DtoHitSpeedTreeReport(server: ZoneServer2016, client: Client, packet: any) {
    debug(packet);
    server.speedTreeUse(client, packet);
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
      unknownFloat12: 12,
    });
  }
  PlayerUpdateManagedPosition(
    server: ZoneServer2016,
    client: Client,
    packet: any
  ) {
    const characterId: string = server._transientIds[packet.data.transientId],
      vehicle = characterId ? server._vehicles[characterId] : undefined;

    if (!vehicle) return;

    //if (!server._soloMode) {
    server.sendDataToAllOthersWithSpawnedEntity(
      server._vehicles,
      client,
      characterId,
      "PlayerUpdatePosition",
      {
        transientId: packet.data.transientId,
        positionUpdate: packet.data.positionUpdate,
      }
    );
    //}
    if (packet.data.positionUpdate.engineRPM) {
      vehicle.positionUpdate = packet.data.positionUpdate;
    }
    if (packet.data.positionUpdate.position) {
      if (packet.data.positionUpdate.position[1] < -100) {
        // If the vehicle is falling trough the map
        server.deleteEntity(vehicle.characterId, server._vehicles);
        return;
      }
      vehicle.state.position = new Float32Array([
        packet.data.positionUpdate.position[0],
        packet.data.positionUpdate.position[1],
        packet.data.positionUpdate.position[2],
        1,
      ]);
      vehicle.getPassengerList().forEach((passenger: string) => {
        if (server._characters[passenger]) {
          server._characters[passenger].state.position = new Float32Array([
            packet.data.positionUpdate.position[0],
            packet.data.positionUpdate.position[1],
            packet.data.positionUpdate.position[2],
            1,
          ]);
        } else {
          debug(`passenger ${passenger} not found`);
          vehicle.removePassenger(passenger);
        }
      });
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
  }
  VehicleStateData(server: ZoneServer2016, client: Client, packet: any) {
    server.sendDataToAllOthersWithSpawnedEntity(
      server._vehicles,
      client,
      packet.data.guid,
      "Vehicle.StateData",
      {
        ...packet.data,
      }
    );
  }
  PlayerUpdateUpdatePositionClientToZone(
    server: ZoneServer2016,
    client: Client,
    packet: any
  ) {
    if (client.character.tempGodMode) {
      server.setGodMode(client, false);
      client.character.tempGodMode = false;
    }
    client.character.positionUpdate = packet.data;
    if (packet.data.flags === 513) {
      // head rotation when in vehicle, client spams this packet every 1ms even if you dont move, disabled for now(it doesnt work anyway)
      return;
    }
    if (packet.data.flags === 510) {
      // falling flag, ignore for now
    }
    if (packet.data.stance) {
      if (packet.data.stance == Stances.STANCE_XS) {
        const pos = client.character.state.position;
        if (!server._soloMode) {
          logClientActionToMongo(
            server._db?.collection(DB_COLLECTIONS.FAIRPLAY) as Collection,
            client,
            server._worldId,
            { type: "XS glitching", pos }
          );
        }
        server.sendChatTextToAdmins(
          `FairPlay: Possible XS glitching detected by ${client.character.name} at position [${pos[0]} ${pos[1]} ${pos[2]}]`
        );
        setTimeout(() => {
          server.sendData(client, "ClientUpdate.UpdateLocation", {
            position: pos,
            triggerLoadingScreen: false,
          });
        }, 1000);
      }
      client.character.isRunning =
        packet.data.stance == Stances.MOVE_STANDING_SPRINTING ? true : false;
      const penaltiedStances = [
        Stances.JUMPING_BACKWARDS,
        Stances.JUMPING_BACKWARDS_LEFT,
        Stances.JUMPING_BACKWARDS_RIGHT,
        Stances.JUMPING_FORWARD_LEFT,
        Stances.JUMPING_FORWARD_RIGHT,
        Stances.JUMPING_FORWARD_SPRINTING,
        Stances.JUMPING_LEFT,
        Stances.JUMPING_RIGHT,
        Stances.JUMPING_STANDING,
        Stances.JUMPING_WORWARD,
        Stances.JUMPING_FORWARD_LEFT_SPRINTING,
        Stances.JUMPING_FORWARD_RIGHT_SPRINTING,
      ];
      if (penaltiedStances.includes(packet.data.stance)) {
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
      server.speedFairPlayCheck(
        client,
        packet.data.sequenceTime,
        packet.data.position
      );
      client.character.state.position = new Float32Array([
        packet.data.position[0],
        packet.data.position[1],
        packet.data.position[2],
        0,
      ]);
      if (
        client.hudTimer != null &&
        !isPosInRadius(
          1,
          client.character.state.position,
          client.posAtLogoutStart
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

      if (
        client.character.currentInteractionGuid &&
        client.character.lastInteractionTime + 1100 > Date.now()
      ) {
        client.character.currentInteractionGuid = "";
        client.character.lastInteractionTime = 0;
      }
    } else if (packet.data.vehicle_position && client.vehicle.mountedVehicle) {
      server._vehicles[client.vehicle.mountedVehicle].state.position =
        new Float32Array([
          packet.data.vehicle_position[0],
          packet.data.vehicle_position[1],
          packet.data.vehicle_position[2],
          0,
        ]);
    }
    if (packet.data.rotation) {
      client.character.state.rotation = new Float32Array([
        packet.data.rotation[0],
        packet.data.rotation[1],
        packet.data.rotation[2],
        packet.data.rotation[3],
      ]);

      client.character.state.lookAt = new Float32Array([
        packet.data.lookAt[0],
        packet.data.lookAt[1],
        packet.data.lookAt[2],
        packet.data.lookAt[3],
      ]);
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
  CharacterFullCharacterDataRequest(
    server: ZoneServer2016,
    client: Client,
    packet: any
  ) {
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
    if (!client.character.currentInteractionGuid || packet.data.password === 1)
      return;
    const doorEntity = server._constructionDoors[
      client.character.currentInteractionGuid
    ] as ConstructionDoor;
    if (!doorEntity) return;
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
  CommandInteractionString(
    server: ZoneServer2016,
    client: Client,
    packet: any
  ) {
    const entity = server.getEntity(packet.data.guid);
    if (!entity) return;
    const isConstruction =
      entity instanceof ConstructionParentEntity ||
      entity instanceof ConstructionChildEntity ||
      entity instanceof ConstructionDoor;
    if (
      !isPosInRadius(
        isConstruction ? 4 : server._interactionDistance,
        client.character.state.position,
        isConstruction
          ? entity.fixedPosition || entity.state.position
          : entity.state.position
      )
    )
      return;

    client.character.currentInteractionGuid = packet.data.guid;
    client.character.lastInteractionTime = Date.now();
    entity.OnInteractionString(server, client);
  }
  MountSeatChangeRequest(server: ZoneServer2016, client: Client, packet: any) {
    server.changeSeat(client, packet);
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
      packet.data.rotation2[2],
    ]);
    const matrix = quat2matrix(array);
    const euler = [
      Math.atan2(matrix[7], matrix[8]),
      Math.atan2(
        -matrix[6],
        Math.sqrt(Math.pow(matrix[7], 2) + Math.pow(matrix[8], 2))
      ),
      Math.atan2(matrix[3], matrix[0]),
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
    server.placement(
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
            ...itemDef,
          },
          flags2: {
            ...itemDef,
          },
          stats: [],
        },
      },
    });
    if (server.isContainer(itemDef.ID)) {
      // Fixes containers missing an itemdefinition not showing in inventory
      client.character.updateLoadout(server);
    }
  }
  CharacterWeaponStance(server: ZoneServer2016, client: Client, packet: any) {
    if (client.character.positionUpdate) {
      client.character.positionUpdate.stance = packet.data.stance;
    }
    server.sendDataToAllOthersWithSpawnedEntity(
      server._characters,
      client,
      client.character.characterId,
      "Character.WeaponStance",
      {
        characterId: client.character.characterId,
        stance: packet.data.stance,
      }
    );
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
      damage: 9999,
    });
  }
  //#region ITEMS
  RequestUseItem(server: ZoneServer2016, client: Client, packet: any) {
    debug(packet.data);
    if (packet.data.itemSubData?.count < 1) return;
    const { itemGuid } = packet.data;
    if (!itemGuid) {
      server.sendChatText(client, "[ERROR] ItemGuid is invalid!");
      return;
    }
    const item = client.character.getInventoryItem(itemGuid);
    if (!item) {
      server.containerError(client, ContainerErrors.NO_ITEM_IN_SLOT);
      return;
    }
    const loadoutSlotId = client.character.getActiveLoadoutSlot(itemGuid);
    if (
      loadoutSlotId &&
      client.character._containers[loadoutSlotId]?.itemGuid == itemGuid &&
      _.size(client.character._containers[loadoutSlotId].items) != 0
    ) {
      // prevents duping if client check is bypassed
      server.sendChatText(
        client,
        "[ERROR] Container must be empty to unequip."
      );
      return;
    }

    let container = client.character.getItemContainer(itemGuid);

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
    switch (packet.data.itemUseOption) {
      case ItemUseOptions.DROP:
      case ItemUseOptions.DROP_BATTERY:
      case ItemUseOptions.DROP_SPARKS:
        server.dropItem(client, item, packet.data.itemSubData?.count);
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
            server.equipContainerItem(client, item, loadoutSlotId);
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
          server.equipContainerItem(
            client,
            item,
            server.getLoadoutSlot(item.itemDefinitionId)
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
      case ItemUseOptions.USE:
        server.useItem(client, item);
        break;
      case ItemUseOptions.REFUEL:
        server.refuelVehicle(client, item, packet.data.characterId2);
        break;
      case ItemUseOptions.IGNITE:
        server.igniteOption(client, item);
        break;
      case ItemUseOptions.UNLOAD:
        item.weapon?.unload(server, client);
        break;
      case ItemUseOptions.SALVAGE:
        server.salvageAmmo(client, item);
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
      model: modelId,
    });
  }
  ContainerMoveItem(server: ZoneServer2016, client: Client, packet: any) {
    const {
      containerGuid,
      characterId,
      itemGuid,
      targetCharacterId,
      count,
      newSlotId,
    } = packet.data;
    if (characterId == client.character.characterId) {
      // from client container
      if (characterId == targetCharacterId) {
        // from / to client or mounted container
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
          if (targetContainer) {
            // to container
            sourceContainer.transferItem(
              server,
              targetContainer,
              item,
              newSlotId,
              count
            );
          } else if (containerGuid == "0xffffffffffffffff") {
            // to loadout
            if (
              server.validateLoadoutSlot(
                item.itemDefinitionId,
                newSlotId,
                client.character.loadoutId
              )
            ) {
              server.equipContainerItem(client, item, newSlotId);
            }
          } else {
            // invalid
            server.containerError(client, ContainerErrors.UNKNOWN_CONTAINER);
          }
        } else {
          // from loadout or invalid

          // loadout
          const loadoutItem = client.character.getLoadoutItem(itemGuid);
          if (!loadoutItem) {
            server.containerError(client, ContainerErrors.NO_ITEM_IN_SLOT);
            return;
          }
          if (targetContainer) {
            // to container
            if (
              !targetContainer.getHasSpace(
                server,
                loadoutItem.itemDefinitionId,
                count
              )
            ) {
              server.containerError(client, ContainerErrors.NO_SPACE);
              return;
            }
            if (!server.removeLoadoutItem(client, loadoutItem.slotId)) {
              server.containerError(client, ContainerErrors.NO_ITEM_IN_SLOT);
              return;
            }
            server.addContainerItem(
              client.character,
              loadoutItem,
              targetContainer,
              count,
              false
            );
          } else if (containerGuid == "0xffffffffffffffff") {
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
        // not used for now with the external container workaround
      }
    } else {
      // from external container
      // not used for now with the external container workaround
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
    for (const a in server._characters) {
      const character = server._characters[a];
      if (character.name === packet.data.characterName) {
        characterId = character.characterId;
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
        ),
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
        visit: false,
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
        ),
      }
    );
  }
  Weapon(server: ZoneServer2016, client: Client, packet: any) {
    debug("Weapon.Weapon");
    if (client.character.tempGodMode) {
      server.setGodMode(client, false);
      client.character.tempGodMode = false;
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
    function handleWeaponPacket(p: any) {
      const weaponItem = client.character.getEquippedWeapon();
      if (!weaponItem.weapon) return;
      switch (p.packetName) {
        case "Weapon.FireStateUpdate":
          debug("Weapon.FireStateUpdate");
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
                "Wrecked Truck",
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
                if (chance <= 70) {
                  client.character.lootItem(
                    server,
                    server.generateItem(Items.METAL_SCRAP)
                  );
                  server.damageItem(client, weaponItem, 35);
                }
                client.character.temporaryScrapTimeout = setTimeout(() => {
                  delete client.character.temporaryScrapTimeout;
                }, Math.floor(Math.random() * (6000 - 1000 + 1) + 1000));
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
            if (entity && !(entity instanceof ConstructionParentEntity)) {
              if (permission) {
                entity.destroy(server);
                client.character.lootItem(
                  server,
                  server.generateItem(entity.itemDefinitionId)
                );
              } else {
                server.placementError(
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
            const entity = server.getConstructionEntity(
              client.character.currentInteractionGuid
            );
            if (!entity) return;
            if (!client.character.temporaryScrapSoundTimeout) {
              server.sendCompositeEffectToAllInRange(
                15,
                client.character.characterId,
                entity.state.position,
                1605
              );
              server.damageItem(client, weaponItem, 50);
              const damageInfo = {
                entity: "",
                damage: -100000,
              };
              entity.damage(server, damageInfo);
              server.updateResourceToAllWithSpawnedEntity(
                entity.characterId,
                entity.health,
                ResourceIds.CONSTRUCTION_CONDITION,
                ResourceTypes.CONDITION,
                server.getConstructionDictionary(entity.characterId)
              );
              client.character.temporaryScrapSoundTimeout = setTimeout(() => {
                delete client.character.temporaryScrapSoundTimeout;
              }, 1000);
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
                  position: client.character.state.position,
                },
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
                position: client.character.state.position,
              },
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
          server.hitMissFairPlayCheck(client, false, "");
          server.stopHudTimer(client);
          server.sendRemoteWeaponUpdateDataToAllOthers(
            client,
            client.character.transientId,
            weaponItem.itemGuid,
            "Update.ProjectileLaunch",
            {}
          );
          const projectilesCount =
            server.getWeaponAmmoId(weaponItem.itemDefinitionId) ==
            Items.AMMO_12GA
              ? 12
              : 1;
          client.allowedProjectiles += projectilesCount;
          break;
        case "Weapon.ProjectileHitReport":
          if (!client.allowedProjectiles) {
            server.sendChatTextToAdmins(
              `FairPlay: ${client.character.name} is hitting projectiles without ammunition`
            );
            return;
          }
          client.allowedProjectiles--;
          if (
            client.character.getEquippedWeapon().itemDefinitionId ==
            Items.WEAPON_REMOVER
          ) {
            if (!client.isAdmin) return;
            const characterId = p.packet.hitReport.characterId,
              entityType = server.getEntityType(characterId);
            switch (entityType) {
              case EntityTypes.NPC:
                if (!server._npcs[characterId]) {
                  return;
                }
                server.deleteEntity(characterId, server._npcs);
                break;
              case EntityTypes.VEHICLE:
                if (!server._vehicles[characterId]) {
                  return;
                }
                server.deleteEntity(characterId, server._vehicles);
                break;
              case EntityTypes.OBJECT:
                if (!server._spawnedItems[characterId]) {
                  return;
                }
                delete server.worldObjectManager._spawnedLootObjects[
                  server._spawnedItems[characterId].spawnerId
                ];
                server.deleteEntity(characterId, server._spawnedItems);
                break;
              case EntityTypes.EXPLOSIVE:
                server.deleteEntity(characterId, server._explosives);
                break;
              case EntityTypes.CONSTRUCTION_DOOR:
              case EntityTypes.CONSTRUCTION_SIMPLE:
              case EntityTypes.CONSTRUCTION_FOUNDATION:
              case EntityTypes.LOOTABLE_CONSTRUCTION:
                const entity = server.getConstructionEntity(characterId);
                if (!entity) return;
                entity.destroy(server);
                break;
              default:
                return;
            }
            server.sendAlert(client, "Object removed.");
            return;
          }
          if (client.banType === "nodamage") return;
          server.registerHit(client, p.packet);
          debug("Weapon.ProjectileHitReport");
          break;
        case "Weapon.ReloadRequest":
          if (weaponItem.weapon.reloadTimer) return;
          setTimeout(() => {
            client.allowedProjectiles = 0;
          }, 100);
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
                position: client.character.state.position,
              },
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
            maxAmmo = server.getWeaponMaxAmmo(weaponItem.itemDefinitionId), // max clip size
            reloadTime = server.getWeaponReloadTime(
              weaponItem.itemDefinitionId
            );

          if (
            weaponItem.itemDefinitionId == Items.WEAPON_BOW_MAKESHIFT ||
            weaponItem.itemDefinitionId == Items.WEAPON_BOW_RECURVE ||
            weaponItem.itemDefinitionId == Items.WEAPON_BOW_WOOD
          ) {
            if (
              client.character.getEquippedWeapon().itemGuid !=
              weaponItem.itemGuid
            )
              return;
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
            server.sendWeaponData(client, "Weapon.Reload", {
              weaponGuid: p.packet.characterId,
              unknownDword1: maxAmmo,
              ammoCount: (weaponItem.weapon.ammoCount += reloadAmount),
              unknownDword3: maxAmmo,
              currentReloadCount: toHex(++weaponItem.weapon.currentReloadCount),
            });
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
                server.sendWeaponData(client, "Weapon.Reload", {
                  weaponGuid: p.packet.characterId,
                  unknownDword1: maxAmmo,
                  ammoCount: weaponItem.weapon.ammoCount,
                  unknownDword3: maxAmmo,
                  currentReloadCount: toHex(
                    ++weaponItem.weapon.currentReloadCount
                  ),
                });
                server.sendRemoteWeaponUpdateDataToAllOthers(
                  client,
                  client.character.transientId,
                  weaponItem.itemGuid,
                  "Update.ReloadLoopEnd",
                  {
                    endLoop: true,
                  }
                );
                client.character.clearReloadTimeout();
                return;
              }
              if (!(reserveAmmo - 1)) {
                // updated reserve ammo
                server.sendWeaponData(client, "Weapon.Reload", {
                  weaponGuid: p.packet.characterId,
                  unknownDword1: maxAmmo,
                  ammoCount: weaponItem.weapon.ammoCount,
                  unknownDword3: maxAmmo,
                  currentReloadCount: toHex(
                    ++weaponItem.weapon.currentReloadCount
                  ),
                });
                server.sendRemoteWeaponUpdateDataToAllOthers(
                  client,
                  client.character.transientId,
                  weaponItem.itemGuid,
                  "Update.ReloadLoopEnd",
                  {
                    endLoop: true,
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
            if (
              !weaponItem.weapon?.reloadTimer ||
              client.character.getEquippedWeapon().itemGuid !=
                weaponItem.itemGuid
            )
              return;
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
            server.sendWeaponData(client, "Weapon.Reload", {
              weaponGuid: p.packet.characterId,
              unknownDword1: maxAmmo,
              ammoCount: (weaponItem.weapon.ammoCount += reloadAmount),
              unknownDword3: maxAmmo,
              currentReloadCount: toHex(++weaponItem.weapon.currentReloadCount),
            });
            client.character.clearReloadTimeout();
          }, reloadTime);

          debug("Weapon.ReloadRequest");
          break;
        case "Weapon.ReloadInterrupt":
          server.reloadInterrupt(client, weaponItem);
          break;
        case "Weapon.SwitchFireModeRequest":
          debug("SwitchFireModeRequest");
          // workaround so aiming in doesn't sometimes make the shooting sound
          if (!weaponItem.weapon?.ammoCount) return;

          // temp workaround to fix 308 sound while aiming
          if (
            p.packet.firemodeIndex == 1 &&
            server.getItemDefinition(weaponItem.itemDefinitionId).PARAM1 == 1373
          )
            return;
          server.sendRemoteWeaponUpdateDataToAllOthers(
            client,
            client.character.transientId,
            weaponItem.itemGuid,
            "Update.SwitchFireMode",
            {
              firegroupIndex: p.packet.firegroupIndex,
              firemodeIndex: p.packet.firemodeIndex,
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
          break;
        case "Weapon.AimBlockedNotify":
          server.sendRemoteWeaponUpdateDataToAllOthers(
            client,
            client.character.transientId,
            weaponItem.itemGuid,
            "Update.AimBlocked",
            {
              aimBlocked: p.packet.aimBlocked,
            }
          );
          debug("AimBlockedNotify");
          break;
        case "Weapon.ProjectileSpawnNpc":
          server.createProjectileNpc(client, p.packet);
          debug("Weapon.ProjectileSpawnNpc");
          break;
        case "Weapon.ProjectileSpawnAttachedNpc":
          debug("Weapon.ProjectileSpawnAttachedNpc");
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
      case "PlayerUpdateUpdatePositionClientToZone":
        this.PlayerUpdateUpdatePositionClientToZone(server, client, packet);
        break;
      case "Character.Respawn":
        this.CharacterRespawn(server, client, packet);
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
        client.allowedProjectiles = 0; // reset allowed projectile after weapon switch
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
