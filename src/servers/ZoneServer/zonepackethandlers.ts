// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2022 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

import { ZoneClient as Client } from "./classes/zoneclient";

import { ZoneServer } from "./zoneserver";

const debug = require("debug")("zonepacketHandlers");

const debugWOD = require("debug")("wallOfData");

import { joaat } from "h1emu-core";

let hax = require("./commands/hax").default;

let dev = require("./commands/dev").default;

import admin from "./commands/admin";

import {
  _,
  generateRandomGuid,
  Int64String,
  isPosInRadius,
} from "../../utils/utils";

import { UpdatePositionObject } from "../../protocols/h1z1protocol";
const modelToName = require("../../../data/2015/sampleData/ModelToName.json");

export class zonePacketHandlers {
  hax: any = hax;
  dev: any = dev;
  admin: any = admin;
  ClientIsReady: any;
  ClientFinishedLoading: any;
  Security: any;
  commandRecipeStart: any;
  commandFreeInteractionNpc: any;
  collisionDamage: any;
  VehicleItemDefinitionRequest: any;
  CurrentMoveMode: any;
  lobbyGameDefinitionDefinitionsRequest: any;
  playerUpdateEndCharacterAccess: any;
  KeepAlive: any;
  ClientLog: any;
  ClientMetrics: any;
  WallOfDataClientSystemInfo: any;
  WallOfDataLaunchPadFingerprint: any;
  wallOfDataUIEvent: any;
  SetLocale: any;
  GetContinentBattleInfo: any;
  chatChat: any;
  loadoutSelectSlot: any;
  ClientInitializationDetails: any;
  ClientLogout: any;
  GameTimeSync: any;
  Synchronization: any;
  commandExecuteCommand: any;
  commandSetProfile: any;
  playerUpdateWeaponStance: any;
  mountDismountRequest: any;
  commandInteractRequest: any;
  commandInteractionString: any;
  commandSetInWater: any;
  commandClearInWater: any;
  commandInteractionSelect: any;
  playerUpdateVehicleCollision: any;
  vehicleDismiss: any;
  vehicleSpawn: any;
  vehicleAutoMount: any;
  commandInteractCancel: any;
  commandStartLogoutRequest: any;
  CharacterSelectSessionRequest: any;
  profileStatsGetPlayerProfileStats: any;
  DtoHitSpeedTreeReport: any;
  GetRewardBuffInfo: any;
  vehicleStateData: any;
  VehicleAccessType: any;
  PlayerUpdateManagedPosition: any;
  PlayerUpdateUpdatePositionClientToZone: any;
  commandPlayerSelect: any;
  constructionPlacementRequest: any;
  constructionPlacementFinalizeRequest: any;
  playerUpdateRespawn: any;
  playerUpdateFullCharacterDataRequest: any;
  commandRedeploy: any;
  constructor() {
    this.ClientIsReady = function (
      server: ZoneServer,
      client: Client,
      packet: any
    ) {
      /* still disable
            server.sendData(client, "ClientBeginZoning", {
              position: client.character.state.position,
              rotation: client.character.state.rotation,
              skyData: server._weather,
            });
            */
      server.customizeDTO(client);
      server.sendData(client, "QuickChat.SendData", { commands: [] });
      server.sendData(client, "ClientUpdate.ActivateProfile", {
        profiles: server._profiles,
        attachmentData: client.character.equipment,
      });
      server.sendData(client, "ClientUpdate.DoneSendingPreloadCharacters", {
        unknownBoolean1: 1,
      });

      server.sendData(client, "ClientUpdate.UpdateStat", { stats: [] });

      server.sendData(client, "Operation.ClientClearMissions", {});

      server.sendData(client, "ZoneSetting.Data", {
        settings: [
          {
            hash: joaat("zonesetting.deploy.on.login".toUpperCase()),
            value: 1,
            settingType: 2,
            unknown1: 0,
            unknown2: 0,
          },
          {
            hash: joaat("zonesetting.no.acquisition.timers".toUpperCase()),
            value: 1,
            settingType: 2,
            unknown1: 0,
            unknown2: 0,
          },
          {
            hash: joaat("zonesetting.XpMultiplier".toUpperCase()),
            value: 1,
            settingType: 1,
            unknown1: 0,
            unknown2: 0,
          },
          {
            hash: joaat("zonesetting.disabletrialitems".toUpperCase()),
            value: 1,
            settingType: 2,
            unknown1: 0,
            unknown2: 0,
          },
          {
            hash: joaat("zonesetting.isvrzone".toUpperCase()),
            value: 0,
            settingType: 2,
            unknown1: 0,
            unknown2: 0,
          },
          {
            hash: joaat("zonesetting.no.resource.costs".toUpperCase()),
            value: 1,
            settingType: 2,
            unknown1: 0,
            unknown2: 0,
          },
        ],
      });

      server.sendData(client, "PlayerUpdate.CharacterStateDelta", {
        guid1: client.character.guid,
        guid2: "0x0000000000000000",
        guid3: "0x0000000040000000",
        guid4: "0x0000000000000000",
        gameTime: (server.getSequenceTime() & 0xffffffff) >>> 0,
      });
      server.sendData(client, "ReferenceData.ClientProfileData", {
        profiles: server._profiles,
      });

      client.character.currentLoadoutId = 3;
      server.sendData(client, "Loadout.SetCurrentLoadout", {
        guid: client.character.guid,
        loadoutId: client.character.currentLoadoutId,
      });

      server.updateResource(
        // send health once or it wont show in hud later
        client,
        client.character.characterId,
        client.character.resources.health,
        48,
        1
      );

      const commands = [
        "hax",
        "dev",
        "admin",
        "location",
        "respawn",
        "clientinfo",
        "serverinfo",
        "spawninfo",
        "help",
      ];

      commands.forEach((command) => {
        server.sendData(client, "Command.AddWorldCommand", {
          command: command,
        });
      });

      server.sendData(client, "Synchronization", {
        serverTime: Int64String(server.getSequenceTime()),
        serverTime2: Int64String(server.getSequenceTime()),
      });
      client.character.startRessourceUpdater(client, server);
      server.sendDataToAll("PlayerUpdate.WeaponStance", {
        characterId: client.character.characterId,
        stance: 1,
      });
    };
    this.ClientFinishedLoading = (
      server: ZoneServer,
      client: Client,
      packet: any
    ) => {
      server.sendGameTimeSync(client);
      if (client.firstLoading) {
        server.sendChatText(client, "Welcome to H1emu ! :D", true);
        server.sendGlobalChatText(
          `${client.character.name} has joined the server !`
        );
        client.firstLoading = false;
        client.pingTimer?.refresh();
        client.savePositionTimer = setTimeout(
          () => server.saveCharacterPosition(client, true),
          30000
        );
        if (!server._soloMode) {
          server.sendZonePopulationUpdate();
        }
      }
      client.isLoading = false;
      client.isInteracting = false;
      delete client.vehicle.mountedVehicle;
      client.vehicle.mountedVehicleType = "0";
    };
    this.Security = function (server: ZoneServer, client: Client, packet: any) {
      debug(packet);
    };
    this.commandRecipeStart = function (
      server: ZoneServer,
      client: Client,
      packet: any
    ) {
      debug(packet);
      server.sendData(client, "Command.RecipeAction", {});
    };
    this.commandFreeInteractionNpc = function (
      server: ZoneServer,
      client: Client,
      packet: any
    ) {
      debug("FreeInteractionNpc");
      server.sendData(client, "Command.FreeInteractionNpc", {});
    };
    this.collisionDamage = function (
      server: ZoneServer,
      client: Client,
      packet: any
    ) {
      const characterId = packet.data.characterId;
      const damage = packet.data.damage;
      const vehicle = server._vehicles[characterId];
      if (characterId === client.character.characterId) {
        server.playerDamage(client, damage);
      } else if (vehicle) {
        server.damageVehicle(damage / 100, vehicle);
        server.DTOhit(client, packet);
      }
    };
    this.lobbyGameDefinitionDefinitionsRequest = function (
      server: ZoneServer,
      client: Client,
      packet: any
    ) {
      server.sendData(client, "LobbyGameDefinition.DefinitionsResponse", {
        definitionsData: { data: "" },
      });
    };
    this.VehicleItemDefinitionRequest = function (
      server: ZoneServer,
      client: Client,
      packet: any
    ) {
      debug(
        `Character "${client.character.name}" (${client.character.characterId}) ask for VehicleItemDefinition`
      );
    };
    this.CurrentMoveMode = function (
      server: ZoneServer,
      client: Client,
      packet: any
    ) {
      debug(
        `Vehicle "${packet.data.characterId}" move mode : ${packet.data.moveMode}`
      );
    };
    this.playerUpdateEndCharacterAccess = function (
      server: ZoneServer,
      client: Client,
      packet: any
    ) {
      debug("EndCharacterAccess");
    };
    this.KeepAlive = function (
      server: ZoneServer,
      client: Client,
      packet: any
    ) {
      server.sendData(client, "KeepAlive", {
        gameTime: packet.data.gameTime,
      });
    };
    this.ClientMetrics = function (
      server: ZoneServer,
      client: Client,
      packet: any
    ) {
      debugWOD(packet);
    };
    this.WallOfDataClientSystemInfo = function (
      server: ZoneServer,
      client: Client,
      packet: any
    ) {
      debugWOD(packet.data.ClientSystemInfo);
    };
    this.WallOfDataLaunchPadFingerprint = function (
      server: ZoneServer,
      client: Client,
      packet: any
    ) {
      debugWOD(`LaunchPadFingerprint : ${packet.data.LaunchPadFingerprint}`);
    };
    this.ClientLog = function (
      server: ZoneServer,
      client: Client,
      packet: any
    ) {
      debug(packet);
    };
    this.wallOfDataUIEvent = function (
      server: ZoneServer,
      client: Client,
      packet: any
    ) {
      debug(packet);
    };
    this.SetLocale = function (
      server: ZoneServer,
      client: Client,
      packet: any
    ) {
      debug("Do nothing");
    };
    this.GetContinentBattleInfo = function (
      server: ZoneServer,
      client: Client,
      packet: any
    ) {
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
    };
    this.chatChat = function (server: ZoneServer, client: Client, packet: any) {
      const { channel, message } = packet.data;
      server.sendChat(client, message, channel);
    };
    this.loadoutSelectSlot = function (
      server: ZoneServer,
      client: Client,
      packet: any
    ) {
      /*
        if (client.character.currentLoadout) {
          const loadout = client.character.currentLoadout,
            loadoutSlotId = packet.data.loadoutSlotId;
          client.character.currentLoadoutSlot = packet.data.loadoutSlotId;
          const loadoutSlots = loadout.loadoutSlots;
          for (let i = 0; i < loadoutSlots.length; i++) {
            if (loadoutSlots[i].loadoutSlotId == loadoutSlotId) {
              const itemLineId =
                loadoutSlots[i].loadoutSlotData.loadoutSlotItem.itemLineId;
              server
                .data("item_line_members")
                .findOne(
                  { itemLineId: itemLineId, itemLineIndex: 0 },
                  function (err, itemLineMember) {
                    const itemId = itemLineMember.itemId;
                    const inventoryItems = client.character.inventory.items;
                    for (let j = 0; j < inventoryItems.length; j++) {
                      if (inventoryItems[j].itemData.baseItem.itemId == itemId) {
                        client.character.currentLoadoutSlotItem =
                          inventoryItems[j].itemData;
                        break;
                      }
                    }
                  }
                );
              break;
            }
          }
        }
        */
    };
    this.ClientInitializationDetails = function (
      server: ZoneServer,
      client: Client,
      packet: any
    ) {
      // just in case
      if (packet.data.unknownDword1) {
        debug("ClientInitializationDetails : ", packet.data.unknownDword1);
      }
    };
    this.ClientLogout = function (
      server: ZoneServer,
      client: Client,
      packet: any
    ) {
      debug("ClientLogout");
      clearInterval(client.character.resourcesUpdater);
      server.saveCharacterPosition(client);
      client.managedObjects.forEach((characterId: any) => {
        server.dropVehicleManager(client, characterId);
      });
      server.deleteEntity(client.character.characterId, server._characters);
      server._gatewayServer._soeServer.deleteClient(client);
      delete server._characters[client.character.characterId];
      delete server._clients[client.sessionId];
      if (!server._soloMode) {
        server.sendZonePopulationUpdate();
      }
    };
    this.GameTimeSync = function (
      server: ZoneServer,
      client: Client,
      packet: any
    ) {
      server.sendGameTimeSync(client);
    };
    this.Synchronization = function (
      server: ZoneServer,
      client: Client,
      packet: any
    ) {
      const serverTime = Int64String(server.getSequenceTime());
      server.sendData(client, "Synchronization", {
        time1: packet.data.time1,
        time2: packet.data.time2,
        clientTime: serverTime,
        serverTime: serverTime,
        serverTime2: serverTime,
        time3: serverTime,
      });
    };
    this.commandExecuteCommand = async function (
      server: ZoneServer,
      client: Client,
      packet: any
    ) {
      const args: string[] = packet.data.arguments.toLowerCase().split(" ");
      const commandName = args[0];
      switch (packet.data.commandHash) {
        case 3720768430: // /respawn
          server.killCharacter(client);
          break;
        case 3357274581: // /clientinfo
          server.sendChatText(
            client,
            `Spawned entities count : ${client.spawnedEntities.length}`
          );
          break;
        case 2371122039: // /serverinfo
          if (commandName === "mem") {
            const used = process.memoryUsage().rss / 1024 / 1024;
            server.sendChatText(
              client,
              `Used memory ${Math.round(used * 100) / 100} MB`
            );
            break;
          } else {
            const {
              _clients: clients,
              _characters: characters,
              _npcs: npcs,
              _objects: objects,
              _vehicles: vehicles,
              _doors: doors,
              _props: props,
            } = server;
            const delta = Date.now() - server._startTime;
            const datakur = new Date(
              (server._serverTime + delta) * server._timeMultiplier
            );
            const monthNames = [
              "January",
              "February",
              "March",
              "April",
              "May",
              "June",
              "July",
              "August",
              "September",
              "October",
              "November",
              "December",
            ];
            const serverVersion = require("../../../package.json").version;
            server.sendChatText(client, `h1z1-server V${serverVersion}`, true);
            server.sendChatText(
              client,
              `clients: ${_.size(clients)} characters : ${_.size(characters)}`
            );
            server.sendChatText(
              client,
              `npcs : ${_.size(npcs)} doors : ${_.size(doors)}`
            );
            server.sendChatText(
              client,
              `objects : ${_.size(objects)} props : ${_.size(
                props
              )} vehicles : ${_.size(vehicles)}`
            );
            server.sendChatText(
              client,
              "Gametime: " +
                datakur.getUTCDate() +
                " " +
                monthNames[datakur.getUTCMonth()] +
                " " +
                (datakur.getUTCFullYear() + 50) +
                ", " +
                datakur.getUTCHours() +
                ":" +
                datakur.getUTCMinutes()
            );
            break;
          }
        case 1757604914: // /spawninfo
          server.sendChatText(
            client,
            `You spawned at "${client.character.spawnLocation}"`,
            true
          );
          break;
        case joaat("HELP"):
        case 3575372649: // /help
          const haxCommandList: string[] = [];
          Object.keys(this.hax).forEach((key) => {
            haxCommandList.push(`/hax ${key}`);
          });
          const devCommandList: string[] = [];
          Object.keys(this.dev).forEach((key) => {
            devCommandList.push(`/dev ${key}`);
          });
          const adminCommandList: string[] = [];
          Object.keys(this.admin).forEach((key) => {
            adminCommandList.push(`/admin ${key}`);
          });
          const commandList = [
            "/help",
            "/loc",
            "/spawninfo",
            "/serverinfo",
            "/player_air_control",
            "/player_fall_through_world_test",
          ];
          server.sendChatText(client, `Commands list:`);
          commandList
            .concat(haxCommandList, devCommandList, adminCommandList)
            .sort((a: string, b: string) => a.localeCompare(b))
            .forEach((command: string) => {
              server.sendChatText(client, `${command}`);
            });
          break;
        case joaat("LOCATION"):
        case 3270589520: // /loc
          const { position, rotation } = client.character.state;
          server.sendChatText(
            client,
            `position: ${position[0].toFixed(2)},${position[1].toFixed(
              2
            )},${position[2].toFixed(2)}`
          );
          server.sendChatText(
            client,
            `rotation: ${rotation[0].toFixed(2)},${rotation[1].toFixed(
              2
            )},${rotation[2].toFixed(2)}`
          );
          break;
        case joaat("HAX"):
          if (
            client.isAdmin ||
            commandName === "list" ||
            ((server._allowedCommands.length === 0 ||
              server._allowedCommands.includes(commandName)) &&
              !!this.hax[commandName])
          ) {
            // using !! is faster but ugly
            this.hax[commandName](server, client, args);
          } else {
            if (!server._allowedCommands.includes(commandName)) {
              server.sendChatText(client, "You don't have access to that.");
            } else {
              server.sendChatText(
                client,
                `Unknown command: /hax ${commandName} , display hax all commands by using /hax list`
              );
            }
          }
          break;
        case joaat("DEV"):
        case 552078457: // dev
        if (
          client.isAdmin ||
          commandName === "list" ||
          ((server._allowedCommands.length === 0 ||
            server._allowedCommands.includes(commandName)) &&
            !!this.dev[commandName])
        ) {
          // using !! is faster but ugly
          this.dev[commandName](server, client, args);
        } else {
          if (!server._allowedCommands.includes(commandName)) {
            server.sendChatText(client, "You don't have access to that.");
          } else {
            server.sendChatText(
              client,
              `Unknown command: /dev ${commandName} , display dev all commands by using /dev list`
            );
          }
        }
        break;
        case joaat("ADMIN"):
        case 997464845: // admin
           if (
            client.isAdmin ||
            commandName === "list" ||
            ((server._allowedCommands.length === 0 ||
              server._allowedCommands.includes(commandName)) &&
              !!this.admin[commandName])
          ) {
            // using !! is faster but ugly
            this.admin[commandName](server, client, args);
          } else {
            if (!server._allowedCommands.includes(commandName)) {
              server.sendChatText(client, "You don't have access to that.");
            } else {
              server.sendChatText(
                client,
                `Unknown command: /admin ${commandName} , display admin all commands by using /admin list`
              );
            }
          }
          break;
      }
    };
    this.commandSetProfile = function (
      server: ZoneServer,
      client: Client,
      packet: any
    ) {
      server.sendData(client, "Loadout.SetCurrentLoadout", {
        type: 2,
        unknown1: 0,
        loadoutId: 15,
        tabId: 256,
        unknown2: 1,
      });
    };
    this.playerUpdateWeaponStance = function (
      server: ZoneServer,
      client: Client,
      packet: any
    ) {
      server.sendDataToAll("PlayerUpdate.WeaponStance", {
        characterId: client.character.characterId,
        stance: packet.data.stance,
      });
    };
    this.mountDismountRequest = function (
      server: ZoneServer,
      client: Client,
      packet: any
    ) {
      if (client?.vehicle?.mountedVehicle)
        // TODO: fix that in a better way
        server.dismountVehicle(client, client.vehicle.mountedVehicle);
    };
    this.commandInteractRequest = function (
      server: ZoneServer,
      client: Client,
      packet: any
    ) {
      server.sendData(client, "Command.InteractionList", {
        guid: packet.data.guid,
        unknownArray1: [
          {
            unknownDword1: 0,
            unknownDword2: 0,
            unknownDword3: 0,
            unknownDword4: 0,
            unknownDword5: 0,
            unknownDword6: 0,
            unknownDword7: 0,
          },
        ],
        unknownArray2: [
          {
            unknownString1: "test",
            unknownDword1: 0,
            unknownDword2: 0,
            unknownDword3: 0,
            unknownDword4: 0,
            unknownDword5: 0,
            unknownDword6: 0,
            unknownDword7: 0,
          },
        ],
      });
    };
    this.commandInteractionString = function (
      server: ZoneServer,
      client: Client,
      packet: any
    ) {
      const { guid } = packet.data,
        entityData =
          server._objects[guid] ||
          server._vehicles[guid] ||
          server._doors[guid] ||
          server._props[guid],
        entityType = server._objects[guid]
          ? 1
          : 0 || server._vehicles[guid]
          ? 2
          : 0 || server._doors[guid]
          ? 3
          : 0 || server._props[guid]
          ? 4
          : 0;

      if (
        !entityData ||
        !isPosInRadius(
          server._interactionDistance,
          client.character.state.position,
          entityData.npcData ? entityData.npcData.position : entityData.position
        )
      )
        return;

      switch (entityType) {
        case 1: // object
          server.sendData(client, "Command.InteractionString", {
            guid: guid,
            stringId: 29,
          });
          delete client.vehicle.mountedVehicle;
          break;
        case 2: // vehicle
          if (!client.vehicle.mountedVehicle) {
            server.sendData(client, "Command.InteractionString", {
              guid: guid,
              stringId: 15,
            });
          }
          break;
        case 3: // door
          server.sendData(client, "Command.InteractionString", {
            guid: guid,
            stringId: 78,
          });
          delete client.vehicle.mountedVehicle;
          break;
        case 4: {
          // prop
          let stringId = 0;
          switch (entityData.modelId) {
            case 9330: // beds
              stringId = 9041;
              break;
            case 9329:
              stringId = 9041;
              break;
            case 9328:
              stringId = 9041;
              break;
            case 9331:
              stringId = 9041;
              break;
            case 9336:
              stringId = 9041;
              break;
            case 9:
              stringId = 31;
              break;
            case 57: // Openable
              stringId = 31;
              break;
            case 36: // interactables
              stringId = 1186;
              break;
            case 9205:
              stringId = 1186;
              break;
            case 9041:
              stringId = 1186;
              break;
            case 8014: // NoString
              stringId = 0;
              break;
            case 8013:
              stringId = 0;
              break;
            case 9088:
              stringId = 0;
              break;
            case 8012: // NoString
              stringId = 0;
              break;
            case 9069:
              stringId = 0;
              break;
            case 9061:
              stringId = 0;
              break;
            case 9032: // collect water
              stringId = 1008;
              break;
            case 9033:
              stringId = 1008;
              break;
            default:
              // searchable
              stringId = 1191;
              break;
          }
          server.sendData(client, "Command.InteractionString", {
            guid: guid,
            stringId: stringId,
          });
          delete client.vehicle.mountedVehicle;
          break;
        }
        default:
          break;
      }
    };
    this.commandSetInWater = function (
      server: ZoneServer,
      client: Client,
      packet: any
    ) {};
    this.commandClearInWater = function (
      server: ZoneServer,
      client: Client,
      packet: any
    ) {};
    this.commandInteractionSelect = function (
      server: ZoneServer,
      client: Client,
      packet: any
    ) {
      debug(packet);
      debug("select");
    };
    this.playerUpdateVehicleCollision = function (
      server: ZoneServer,
      client: Client,
      packet: any
    ) {
      debug(packet);
    };
    this.vehicleDismiss = function (
      server: ZoneServer,
      client: Client,
      packet: any
    ) {
      const vehicleGuid = client.vehicle.mountedVehicle;
      if (vehicleGuid) {
        server.dismountVehicle(client, vehicleGuid);
        server.dismissVehicle(vehicleGuid);
      }
    };
    this.vehicleSpawn = function (
      server: ZoneServer,
      client: Client,
      packet: any
    ) {
      server.sendData(client, "Vehicle.Expiration", {
        expireTime: 300000,
      });
      const guid = server.generateGuid();
      server.sendData(client, "Vehicle.Owner", {
        guid: guid,
        characterId: client.character.characterId,
        unknownDword1: 305,
        vehicleId: 1712,
        passengers: [
          {
            passengerData: {
              characterId: "0x0000000000000000",
              characterData: {
                unknownDword1: 0,
                unknownDword2: 0,
                unknownDword3: 0,
                characterName: "",
                unknownString1: "",
              },
              unknownDword1: 0,
              unknownString1: "",
            },
            unknownByte1: 0,
          },
          {
            passengerData: {
              characterId: "0x0000000000000000",
              characterData: {
                unknownDword1: 0,
                unknownDword2: 0,
                unknownDword3: 0,
                characterName: "",
                unknownString1: "",
              },
              unknownDword1: 0,
              unknownString1: "",
            },
            unknownByte1: 1,
          },
        ],
      });
      server.sendData(client, "Loadout.SetCurrentLoadout", {
        type: 2,
        unknown1: 1,
        loadoutId: 10,
        tabId: 256,
        unknown2: 1,
      });
      const position = new Float32Array([
        client.character.state.position[0],
        client.character.state.position[1] + 10,
        client.character.state.position[2],
      ]);
      const rotation = [-1.570796012878418, 0, 0, 0];
      server.sendData(client, "PlayerUpdate.AddLightweightVehicle", {
        guid: guid,
        unknownUint1: 95,
        unknownString0: "",
        nameId: 310,
        unknownDword2: 0,
        unknownDword3: 0,
        unknownByte1: 1,
        unknownDword4: 20,
        scale: [1, 1, 1, 1],
        unknownString1: "",
        unknownString2: "",
        unknownDword5: 0,
        unknownDword6: 0,
        position: position,
        unknownVector1: [0, -0.7071066498756409, 0, 0.70710688829422],
        rotation: rotation,
        unknownDword7: 0,
        unknownFloat1: 3,
        unknownString3: "",
        unknownString4: "",
        unknownString5: "",
        unknownDword8: 4,
        unknownDword9: 0,
        unknownDword10: 305,
        unknownByte2: 2,
        profileId: 29,
        unknownBoolean1: false,
        unknownByte3: 16,
        unknownByte4: 9,
        unknownByte5: 0,
        unknownByte6: 0,
        unknownDword11: 0,
        unknownGuid1: "0x0000000000000000",
        unknownGuid2: "0x0000000000000000",
        unknownDword12: 2484,
        unknownDword13: 1528,
        unknownDword14: 0,
        unknownByte7: 0,
        unknownArray1: [],
        unknownGuid3: "0x0000000000000000",
        unknownDword15: 0,
        unknownDword16: 0,
        positionUpdate: server.createPositionUpdate(position, rotation),
        unknownString6: "",
      });
      server.sendData(client, "PlayerUpdate.SetFaction", {
        guid: guid,
        factionId: 1,
      });
      server.sendData(client, "Vehicle.SetAutoDrive", {
        guid: guid,
      });
    };
    this.vehicleAutoMount = function (
      server: ZoneServer,
      client: Client,
      packet: any
    ) {
      server.sendData(client, "Mount.MountResponse", {
        characterId: client.character.characterId,
        guid: packet.data.guid,
        unknownDword1: 0,
        unknownDword2: 1,
        unknownDword3: 1,
        unknownDword4: 0,
        characterData: {
          unknownDword1: 0,
          unknownDword2: 0,
          unknownDword3: 0,
          characterName: client.character.name,
          unknownString1: "",
        },
        tagString: "",
        unknownDword5: 19,
      });

      server.sendData(client, "PlayerUpdate.ManagedObject", {
        guid: packet.data.guid,
        guid2: "0x0000000000000000",
        characterId: client.character.characterId,
      });

      server.sendData(client, "Vehicle.Occupy", {
        guid: packet.data.guid,
        characterId: client.character.characterId,
        vehicleId: 4,
        unknownDword1: 0,
        unknownArray1: [
          {
            unknownDword1: 0,
            unknownBoolean1: true,
          },
          {
            unknownDword1: 1,
            unknownBoolean1: true,
          },
        ],
        passengers: [
          {
            passengerData: {
              characterId: client.character.characterId,
              characterData: {
                unknownDword1: 0,
                unknownDword2: 0,
                unknownDword3: 0,
                characterName: "LocalPlayer",
                unknownString1: "",
              },
              unknownDword1: 19,
              unknownString1: "SCNC",
            },
            unknownByte1: 0,
          },
          {
            passengerData: {
              characterId: "0x0000000000000000",
              characterData: {
                unknownDword1: 0,
                unknownDword2: 0,
                unknownDword3: 0,
                characterName: "",
                unknownString1: "",
              },
              unknownDword1: 0,
              unknownString1: "",
            },
            unknownByte1: 1,
          },
        ],
        unknownArray2: [
          {
            unknownQword1: "0x29e5d0ef80000003",
          },
          {
            unknownQword1: "0x29e5d0ef80000004",
          },
          {
            unknownQword1: "0x29e5d0ef80000005",
          },
          {
            unknownQword1: "0x29e5d0ef80000006",
          },
          {
            unknownQword1: "0x29e5d0ef80000007",
          },
        ],
        unknownData1: {
          unknownDword1: 10,
          unknownData1: {
            unknownDword1: 4,
            unknownByte1: 1,
          },
          unknownString1: "",
          unknownDword2: 256,
          unknownDword3: 76362,
          unknownDword4: 0,
          unknownDword5: 0,
          unknownArray3: [
            {
              unknownDword1: 1,
              unknownData1: {
                unknownDword1: 1,
                unknownData1: {
                  unknownDword1: 1401,
                  unknownByte1: 0,
                  unknownArray1: [],
                  unknownArray2: [],
                },
                unknownDword2: 0,
                unknownDword3: 0,
              },
            },
            {
              unknownDword1: 2,
              unknownData1: {
                unknownDword1: 2,
                unknownData1: {
                  unknownDword1: 3404,
                  unknownByte1: 0,
                  unknownArray1: [],
                  unknownArray2: [],
                },
                unknownDword2: 0,
                unknownDword3: 0,
              },
            },
            {
              unknownDword1: 3,
              unknownData1: {
                unknownDword1: 3,
                unknownData1: {
                  unknownDword1: 0,
                  unknownByte1: 0,
                  unknownArray1: [],
                  unknownArray2: [],
                },
                unknownDword2: 0,
                unknownDword3: 0,
              },
            },
            {
              unknownDword1: 4,
              unknownData1: {
                unknownDword1: 4,
                unknownData1: {
                  unknownDword1: 3409,
                  unknownByte1: 0,
                  unknownArray1: [],
                  unknownArray2: [],
                },
                unknownDword2: 0,
                unknownDword3: 0,
              },
            },
            {
              unknownDword1: 5,
              unknownData1: {
                unknownDword1: 5,
                unknownData1: {
                  unknownDword1: 0,
                  unknownByte1: 0,
                  unknownArray1: [],
                  unknownArray2: [],
                },
                unknownDword2: 0,
                unknownDword3: 0,
              },
            },
            {
              unknownDword1: 6,
              unknownData1: {
                unknownDword1: 6,
                unknownData1: {
                  unknownDword1: 75436,
                  unknownByte1: 0,
                  unknownArray1: [],
                  unknownArray2: [],
                },
                unknownDword2: 0,
                unknownDword3: 0,
              },
            },
            {
              unknownDword1: 7,
              unknownData1: {
                unknownDword1: 7,
                unknownData1: {
                  unknownDword1: 0,
                  unknownByte1: 0,
                  unknownArray1: [],
                  unknownArray2: [],
                },
                unknownDword2: 0,
                unknownDword3: 0,
              },
            },
            {
              unknownDword1: 8,
              unknownData1: {
                unknownDword1: 8,
                unknownData1: {
                  unknownDword1: 0,
                  unknownByte1: 0,
                  unknownArray1: [],
                  unknownArray2: [],
                },
                unknownDword2: 0,
                unknownDword3: 0,
              },
            },
            {
              unknownDword1: 9,
              unknownData1: {
                unknownDword1: 9,
                unknownData1: {
                  unknownDword1: 5780,
                  unknownByte1: 0,
                  unknownArray1: [],
                  unknownArray2: [],
                },
                unknownDword2: 0,
                unknownDword3: 0,
              },
            },
            {
              unknownDword1: 14,
              unknownData1: {
                unknownDword1: 14,
                unknownData1: {
                  unknownDword1: 1406,
                  unknownByte1: 0,
                  unknownArray1: [],
                  unknownArray2: [],
                },
                unknownDword2: 0,
                unknownDword3: 0,
              },
            },
            {
              unknownDword1: 15,
              unknownData1: {
                unknownDword1: 15,
                unknownData1: {
                  unknownDword1: 0,
                  unknownByte1: 0,
                  unknownArray1: [],
                  unknownArray2: [],
                },
                unknownDword2: 0,
                unknownDword3: 0,
              },
            },
            {
              unknownDword1: 16,
              unknownData1: {
                unknownDword1: 16,
                unknownData1: {
                  unknownDword1: 1428,
                  unknownByte1: 0,
                  unknownArray1: [],
                  unknownArray2: [],
                },
                unknownDword2: 0,
                unknownDword3: 0,
              },
            },
            {
              unknownDword1: 17,
              unknownData1: {
                unknownDword1: 17,
                unknownData1: {
                  unknownDword1: 0,
                  unknownByte1: 0,
                  unknownArray1: [],
                  unknownArray2: [],
                },
                unknownDword2: 0,
                unknownDword3: 0,
              },
            },
          ],
        },
        unknownBytes1: {
          itemData: {
            baseItem: {
              itemId: 3400,
              unknownDword2: 0,
              unknownGuid1: "0x29e5d0ef80000001",
              unknownDword3: 1,
              unknownDword4: 0,
              unknownDword5: 0,
              unknownDword6: 0,
              unknownDword7: 0,
              unknownDword8: 0,
              unknownByte1: 0,
              unknownData: {
                type: 0,
                value: {},
              },
            },
            detail: {
              unknownBoolean1: false,
              unknownArray1: [
                {
                  unknownDword1: 1,
                  unknownDword2: 24,
                },
              ],
              unknownArray2: [
                {
                  unknownDword1: 300,
                  unknownArray1: [
                    {
                      unknownByte1: 0,
                      unknownDword1: 0,
                      unknownDword2: 1410,
                      unknownDword3: 750,
                    },
                    {
                      unknownByte1: 0,
                      unknownDword1: 0,
                      unknownDword2: 1410,
                      unknownDword3: 750,
                    },
                  ],
                },
              ],
              unknownByte1: 30,
              unknownByte2: 1,
              unknownDword1: 0,
              unknownByte3: 0,
              unknownFloat1: 0,
              unknownByte4: 0,
              unknownDword2: 0,
              unknownArray3: [],
              unknownArray4: [],
            },
          },
        },
      });
    };
    this.commandRedeploy = function (
      server: ZoneServer,
      client: Client,
      packet: any
    ) {
      debug("Redeploy");
      server.sendData(client, "ClientUpdate.UpdateLocation", {
        position: new Float32Array([0, 50, 0, 1]),
        triggerLoadingScreen: true,
      });
    };
    this.commandInteractCancel = function (
      server: ZoneServer,
      client: Client,
      packet: any
    ) {
      debug("Interaction Canceled");
    };
    this.commandStartLogoutRequest = function (
      server: ZoneServer,
      client: Client,
      packet: any
    ) {
      const timerTime = client.character.isAlive ? 10000 : 0;
      server.sendData(client, "ClientUpdate.StartTimer", {
        stringId: 0,
        time: timerTime,
      });
      client.posAtLogoutStart = client.character.state.position;
      if (client.hudTimer != null) {
        clearTimeout(client.hudTimer);
      }
      client.hudTimer = setTimeout(() => {
        client.managedObjects.forEach((object: string) => {
          server._vehicles[object].isManaged = false;
        });
        server.sendData(client, "ClientUpdate.CompleteLogoutProcess", {});
      }, timerTime);
    };
    this.CharacterSelectSessionRequest = function (
      server: ZoneServer,
      client: Client,
      packet: any
    ) {
      server.sendData(client, "CharacterSelectSessionResponse", {
        status: 1,
        sessionId: client.loginSessionId,
      });
    };
    this.profileStatsGetPlayerProfileStats = function (
      server: ZoneServer,
      client: Client,
      packet: any
    ) {
      server.sendData(
        client,
        "ProfileStats.PlayerProfileStats",
        require("../../../data/2015/sampleData/profilestats.json")
      );
    };
    this.DtoHitSpeedTreeReport = function (
      server: ZoneServer,
      client: Client,
      packet: any
    ) {
      debug(packet);
      server.speedTreeUse(client, packet);
    };
    this.GetRewardBuffInfo = function (
      server: ZoneServer,
      client: Client,
      packet: any
    ) {
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
    };
    this.vehicleStateData = function (
      server: ZoneServer,
      client: Client,
      packet: any
    ) {
      server.sendDataToAllOthers(client, "Vehicle.StateData", {
        guid: packet.data.guid,
        unknown3: packet.data.unknown3,
        unknown4: packet.data.unknown4,
        unknown5: packet.data.unknown5,
      });
    };
    this.VehicleAccessType = function (
      server: ZoneServer,
      client: Client,
      packet: any
    ) {
      const { vehicleGuid, accessType } = packet.data;
      server._vehicles[vehicleGuid].isLocked = accessType;
      server.sendData(client, "Vehicle.AccessType", {
        vehicleGuid: vehicleGuid,
        accessType: accessType,
      });
    };
    this.PlayerUpdateManagedPosition = function (
      server: ZoneServer,
      client: Client,
      packet: any
    ) {
      if (!packet.data) {
        return;
      }
      const characterId = server._transientIds[packet.data.transientId];
      if (characterId) {
        if (
          client.hudTimer != null &&
          !isPosInRadius(
            1,
            client.character.state.position,
            client.posAtLogoutStart
          )
        ) {
          client.clearHudTimer();
          server.sendData(client, "ClientUpdate.StartTimer", {
            stringId: 0,
            time: 0,
          }); // don't know how it was done so
        }
        server.sendDataToAllOthers(client, "PlayerUpdate.UpdatePosition", {
          transientId: packet.data.transientId,
          positionUpdate: packet.data.PositionUpdate,
        });

        if (packet.data.PositionUpdate.engineRPM) {
          server._vehicles[characterId].positionUpdate.engineRPM =
            packet.data.PositionUpdate.engineRPM;
        }

        if (packet.data.PositionUpdate.position) {
          server._vehicles[characterId].positionUpdate.position =
            packet.data.PositionUpdate.position;
          server._vehicles[characterId].npcData.position = new Float32Array([
            packet.data.PositionUpdate.position[0],
            packet.data.PositionUpdate.position[1],
            packet.data.PositionUpdate.position[2],
            0,
          ]);
          if (client.vehicle.mountedVehicle === characterId) {
            client.character.state.position = new Float32Array([
              packet.data.PositionUpdate.position[0],
              packet.data.PositionUpdate.position[1],
              packet.data.PositionUpdate.position[2],
              0,
            ]);
            if (server._vehicles[characterId].passengers.passenger1) {
              const character =
                server._vehicles[characterId].passengers.passenger1;
              server.updatePosition(
                character,
                packet.data.PositionUpdate.position
              );
            }
            if (server._vehicles[characterId].passengers.passenger2) {
              const character =
                server._vehicles[characterId].passengers.passenger2;
              server.updatePosition(
                character,
                packet.data.PositionUpdate.position
              );
            }
            if (server._vehicles[characterId].passengers.passenger3) {
              const character =
                server._vehicles[characterId].passengers.passenger3;
              server.updatePosition(
                character,
                packet.data.PositionUpdate.position
              );
            }
            if (server._vehicles[characterId].passengers.passenger4) {
              const character =
                server._vehicles[characterId].passengers.passenger4;
              server.updatePosition(
                character,
                packet.data.PositionUpdate.position
              );
            }

            if (
              !client.posAtLastRoutine ||
              !isPosInRadius(
                server._npcRenderDistance *
                  server._worldRoutineRadiusPercentage,
                client.character.state.position,
                client.posAtLastRoutine
              )
            ) {
              server.worldRoutine();
            }
          }
        }
      }
    };
    interface PlayerUpdateUpdatePositionClientToZoneData {
      data: UpdatePositionObject;
    }
    this.PlayerUpdateUpdatePositionClientToZone = function (
      server: ZoneServer,
      client: Client,
      packet: PlayerUpdateUpdatePositionClientToZoneData
    ) {
      if (packet.data.flags === 510) {
        client.vehicle.falling = packet.data.verticalSpeed;
      }
      const movingCharacter = server._characters[client.character.characterId];
      if (movingCharacter && !server._soloMode) {
        server.sendRawToAllOthers(
          client,
          server._protocol.createPositionBroadcast(
            packet.data.raw,
            movingCharacter.transientId
          )
        );
      }
      client.character.isMoving = !!packet.data.horizontalSpeed;
      if (packet.data.position) {
        client.character.state.position = new Float32Array([
          packet.data.position[0],
          packet.data.position[1],
          packet.data.position[2],
          0,
        ]);
        client.character.isRunning =
          packet.data.horizontalSpeed > (client.character.isExhausted ? 5 : 6);

        if (
          client.hudTimer != null &&
          !isPosInRadius(
            1,
            client.character.state.position,
            client.posAtLogoutStart
          )
        ) {
          client.clearHudTimer();
          server.sendData(client, "ClientUpdate.StartTimer", {
            stringId: 0,
            time: 0,
          }); // don't know how it was done so
        }
        if (
          !client.posAtLastRoutine ||
          (!isPosInRadius(
            server._npcRenderDistance / 2.5,
            client.character.state.position,
            client.posAtLastRoutine
          ) &&
            !client.isLoading)
        ) {
          server.worldRoutine();
        }
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
    };
    this.commandPlayerSelect = function (
      server: ZoneServer,
      client: Client,
      packet: any
    ) {
      debug(packet);
      const { guid } = packet.data,
        entityData =
          server._objects[guid] ||
          server._vehicles[guid] ||
          server._doors[guid] ||
          server._props[guid],
        entityType = server._objects[guid]
          ? 1
          : 0 || server._vehicles[guid]
          ? 2
          : 0 || server._doors[guid]
          ? 3
          : 0 || server._props[guid]
          ? 4
          : 0;

      if (
        !entityData ||
        !isPosInRadius(
          server._interactionDistance,
          client.character.state.position,
          entityData.npcData ? entityData.npcData.position : entityData.position
        )
      )
        return;

      switch (entityType) {
        case 1: // object
          // TODO : use strings from the game, will add to h1z1-string-finder the option to export to JSON
          const model_index = modelToName.findIndex(
            (x: any) => x.modelId === entityData.modelId
          );
          const pickupMessage = modelToName[model_index]?.itemName;
          server.sendData(client, "ClientUpdate.TextAlert", {
            message: pickupMessage,
          });
          const { water, health, food } = client.character.resources;
          switch (entityData.modelId) {
            case 9159:
              client.character.resources.water = water + 4000;
              server.updateResource(
                client,
                client.character.characterId,
                client.character.resources.water,
                5,
                5
              );
              break;
            case 8020:
            case 9250:
              client.character.resources.food = food + 4000;
              server.updateResource(
                client,
                client.character.characterId,
                client.character.resources.food,
                4,
                4
              );
              break;
            case 9221:
              client.character.resources.health = health + 10000;
              server.updateResource(
                client,
                client.character.characterId,
                client.character.resources.health,
                48,
                1
              );
              break;
            default:
              break;
          }
          server.deleteEntity(entityData.characterId, server._objects);
          break;
        case 2: // vehicle
          server.enterVehicle(client, entityData);
          break;
        case 3: // door
          debug("tried to open ", entityData.characterId);
          if (entityData.isOpen === false) {
            entityData.moving = true;
            setTimeout(function () {
              entityData.moving = false;
            }, 500);
            server.sendDataToAll("PlayerUpdate.UpdatePosition", {
              transientId: entityData.transientId,
              positionUpdate: {
                sequenceTime: server.getSequenceTime(),
                unknown3_int8: 0,
                position: entityData.position,
                orientation: entityData.openAngle,
              },
            });
            server.sendDataToAll("PlayerUpdate.PlayWorldCompositeEffect", {
              soundId: 5048,
              position: entityData.position,
              unk3: 0,
            });
            entityData.isOpen = true;
          } else {
            entityData.moving = true;
            setTimeout(function () {
              entityData.moving = false;
            }, 500);
            server.sendDataToAll("PlayerUpdate.UpdatePosition", {
              transientId: entityData.transientId,
              positionUpdate: {
                sequenceTime: server.getSequenceTime(),
                unknown3_int8: 0,
                stance: 1089,
                position: entityData.position,
                orientation: entityData.closedAngle,
              },
            });
            server.sendDataToAll("PlayerUpdate.PlayWorldCompositeEffect", {
              soundId: 5049,
              position: entityData.position,
              unk3: 0,
            });
            entityData.isOpen = false;
          }
          break;
        case 4: // prop
          let interactType;
          let timerTime = 0;
          switch (entityData.modelId) {
            case 8013:
              interactType = "destroy";
              break;
            case 8014:
              interactType = "destroy";
              break;
            case 9088:
              interactType = "destroy";
              break;
            case 9328:
              interactType = "sleep";
              timerTime = 20000;
              break;
            case 9330:
              interactType = "sleep";
              timerTime = 20000;
              break;
            case 9329:
              interactType = "sleep";
              timerTime = 20000;
              break;
            case 9331:
              interactType = "sleep";
              timerTime = 20000;
              break;
            case 9336:
              interactType = "sleep";
              timerTime = 20000;
              break;
            case 36:
              interactType = "use";
              break;
            case 9205:
              interactType = "use";
              break;
            case 9041:
              interactType = "use";
              break;
            case 57:
              interactType = "open";
              break;
            case 9127:
              interactType = "open";
              break;
            case 9032:
              interactType = "collectWater";
              break;
            case 9033:
              interactType = "collectWater";
              break;
            default:
              interactType = "search";
              timerTime = 1500;
              break;
          }
          switch (interactType) {
            case "destroy":
              server.sendData(client, "PlayerUpdate.Destroyed", {
                characterId: entityData.characterId,
                unknown1: 242,
                unknown2: 8015,
                unknown3: 0,
                disableWeirdPhysics: true,
              });
              break;
            case "sleep":
              if (!client.isInteracting) {
                client.isInteracting = true;
                server.sendData(client, "ClientUpdate.StartTimer", {
                  stringId: 9051,
                  time: timerTime,
                });
                client.posAtLogoutStart = client.character.state.position;
                if (client.hudTimer != null) {
                  clearTimeout(client.hudTimer);
                }
                client.hudTimer = setTimeout(() => {
                  server.sendData(client, "ClientUpdate.TextAlert", {
                    message: "You feel refreshed after sleeping well.",
                  });
                  client.isInteracting = false;
                }, timerTime);
              }
              break;
            case "use":
              server.sendData(client, "ClientUpdate.TextAlert", {
                message: "Nothing in there... yet :P",
              });
              break;
            case "open":
              server.sendData(client, "PlayerUpdate.BeginCharacterAccess", {
                characterId: entityData.characterId,
                state: true,
                unk1: 0,
              });
              break;
            case "collectWater":
              server.sendData(client, "ClientUpdate.TextAlert", {
                message: "You dont have an Empty Bottle",
              });
              break;
            case "search":
              if (!client.isInteracting) {
                client.isInteracting = true;
                server.sendData(client, "ClientUpdate.StartTimer", {
                  stringId: entityData.nameId,
                  time: timerTime,
                });
                client.posAtLogoutStart = client.character.state.position;
                if (client.hudTimer != null) {
                  clearTimeout(client.hudTimer);
                }
                client.hudTimer = setTimeout(() => {
                  server.sendData(client, "PlayerUpdate.BeginCharacterAccess", {
                    characterId: entityData.characterId,
                    state: true,
                    unk1: 0,
                  });
                  client.isInteracting = false;
                }, timerTime);
              }
              break;
            default:
              break;
          }
          break;
        default:
          break;
      }
    };
    this.constructionPlacementRequest = function (
      server: ZoneServer,
      client: Client,
      packet: any
    ) {
      debug("Construction.PlacementRequest");
      // TODO
      //server.sendData(client, "Construction.PlacementResponse", {model:modelChoosen});
    };
    this.constructionPlacementFinalizeRequest = function (
      server: ZoneServer,
      client: Client,
      packet: any
    ) {
      debug(packet);
      debug("Construction.PlacementFinalizeRequest");
      server.sendData(client, "Construction.PlacementFinalizeResponse", {
        status: true,
      });
    };
    this.playerUpdateRespawn = function (
      server: ZoneServer,
      client: Client,
      packet: any
    ) {
      debug(packet);
      server.respawnPlayer(client);
    };
    this.playerUpdateFullCharacterDataRequest = function (
      server: ZoneServer,
      client: Client,
      packet: any
    ) {
      const { characterId } = packet.data;
      const entityType: number = server.getEntityType(characterId);
      switch (entityType) {
        case 1: {
          // npc
          const entityData = server._npcs[characterId];
          if (entityData) {
            server.sendData(client, "PlayerUpdate.LightweightToFullNpc", {
              transientId: entityData.transientId,
              unknownDword1: 16777215, // Data from PS2 dump that fits into h1 packets (i believe these were used for vehicle)
              unknownDword2: 13951728,
              unknownDword3: 1,
              unknownDword6: 100,
            });
            if (entityData.onReadyCallback) {
              entityData.onReadyCallback();
            }
          }
          break;
        }
        case 2: {
          // vehicle
          const entityData = server._vehicles[characterId];
          if (entityData) {
            if (entityData.npcData.vehicleId === 13) return;
            // ignore parachute
            const npcData = {
              transientId: entityData.npcData.transientId,
            };
            server.sendData(client, "PlayerUpdate.LightweightToFullVehicle", {
              npcData: npcData,
              characterId: characterId,
            });
            if (entityData.destroyedEffect != 0) {
              server.sendData(client, "Command.PlayDialogEffect", {
                characterId: entityData.npcData.characterId,
                effectId: entityData.destroyedEffect,
              });
            }
            if (
              entityData.onReadyCallback &&
              entityData.onReadyCallback(client)
            ) {
              delete server._vehicles[characterId].onReadyCallback;
            }
          }
          break;
        }
        case 3: {
          // character
          const entityData = server._characters[characterId];
          if (entityData) {
            server.sendData(client, "PlayerUpdate.LightweightToFullNpc", {
              transientId: entityData.transientId,
              unknownDword1: 16777215, // Data from PS2 dump that fits into h1 packets (i believe these were used for vehicle)
              unknownDword2: 13951728,
              unknownDword3: 1,
              unknownDword6: 100,
            });
            server.sendData(client, "Equipment.SetCharacterEquipment", {
              profileId: 3,
              characterId: entityData.characterId,
              equipmentSlots: entityData.equipment.map((equipment: any) => {
                return {
                  equipmentSlotId: equipment.slotId,
                  equipmentSlotData: {
                    equipmentSlotId: equipment.slotId,
                    guid: generateRandomGuid(),
                  },
                };
              }),
              attachmentData: entityData.equipment,
            });
          }
          break;
        }
        case 4: {
          // object
          const entityData = server._objects[characterId];
          if (entityData) {
            server.sendData(client, "PlayerUpdate.LightweightToFullNpc", {
              transientId: entityData.transientId,
              unknownDword1: 16777215, // Data from PS2 dump that fits into h1 packets (i believe these were used for vehicle)
              unknownDword2: 13951728,
              unknownDword3: 1,
              unknownDword6: 100,
            });
            if (entityData.onReadyCallback) {
              entityData.onReadyCallback();
            }
          }
          break;
        }
        case 5: {
          // prop
          const entityData = server._props[characterId];
          if (entityData) {
            server.sendData(client, "PlayerUpdate.LightweightToFullNpc", {
              transientId: entityData.transientId,
              unknownDword1: 16777215, // Data from PS2 dump that fits into h1 packets (i believe these were used for vehicle)
              unknownDword2: 13951728,
              unknownDword3: 1,
              unknownDword6: 100,
            });
            if (entityData.onReadyCallback) {
              entityData.onReadyCallback();
            }
          }
          break;
        }
        case 6: {
          // door
          const entityData = server._doors[characterId];
          if (entityData) {
            server.sendData(client, "PlayerUpdate.LightweightToFullNpc", {
              transientId: entityData.transientId,
              unknownDword1: 16777215, // Data from PS2 dump that fits into h1 packets (i believe these were used for vehicle)
              unknownDword2: 13951728,
              unknownDword3: 1,
              unknownDword6: 100,
            });
            if (entityData.isOpen === true) {
              server.sendData(client, "PlayerUpdate.UpdatePosition", {
                transientId: entityData.transientId,
                positionUpdate: {
                  sequenceTime: server.getSequenceTime(),
                  unknown3_int8: 0,
                  stance: 1025,
                  orientation: entityData.openAngle,
                },
              });
              server.sendData(client, "PlayerUpdate.PlayWorldCompositeEffect", {
                soundId: 5048,
                position: entityData.position,
                unk3: 0,
              });
            }
          }
          break;
        }
      }
    };
  }
  processPacket(server: ZoneServer, client: Client, packet: any) {
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
        this.commandRecipeStart(server, client, packet);
        break;
      case "Command.FreeInteractionNpc":
        this.commandFreeInteractionNpc(server, client, packet);
        break;
      case "Collision.Damage":
        this.collisionDamage(server, client, packet);
        break;
      case "Vehicle.CurrentMoveMode":
        this.CurrentMoveMode(server, client, packet);
        break;
      case "Vehicle.ItemDefinitionRequest":
        this.VehicleItemDefinitionRequest(server, client, packet);
        break;
      case "LobbyGameDefinition.DefinitionsRequest":
        this.lobbyGameDefinitionDefinitionsRequest(server, client, packet);
        break;
      case "PlayerUpdate.EndCharacterAccess":
        this.playerUpdateEndCharacterAccess(server, client, packet);
        break;
      case "KeepAlive":
        this.KeepAlive(server, client, packet);
        break;
      case "WallOfData.ClientSystemInfo":
        this.WallOfDataClientSystemInfo(server, client, packet);
        break;
      case "WallOfData.LaunchPadFingerprint":
        this.WallOfDataLaunchPadFingerprint(server, client, packet);
        break;
      case "ClientMetrics":
        this.ClientMetrics(server, client, packet);
        break;
      case "ClientLog":
        this.ClientLog(server, client, packet);
        break;
      case "WallOfData.UIEvent":
        this.wallOfDataUIEvent(server, client, packet);
        break;
      case "SetLocale":
        this.SetLocale(server, client, packet);
        break;
      case "Combat.AutoAttackOff":
        break;
      case "GetRespawnLocations":
        break;
      case "GetContinentBattleInfo":
        this.GetContinentBattleInfo(server, client, packet);
        break;
      case "Chat.Chat":
        this.chatChat(server, client, packet);
        break;
      case "Loadout.SelectSlot":
        this.loadoutSelectSlot(server, client, packet);
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
      case "Synchronization":
        this.Synchronization(server, client, packet);
        break;
      case "Command.ExecuteCommand":
        this.commandExecuteCommand(server, client, packet);
        break;
      case "Command.SetProfile":
        this.commandSetProfile(server, client, packet);
        break;
      case "PlayerUpdate.WeaponStance":
        this.playerUpdateWeaponStance(server, client, packet);
        break;
      case "Mount.DismountRequest":
        this.mountDismountRequest(server, client, packet);
        break;
      case "Command.InteractRequest":
        this.commandInteractRequest(server, client, packet);
        break;
      case "Command.InteractionString":
        this.commandInteractionString(server, client, packet);
        break;
      case "Command.SetInWater":
        this.commandSetInWater(server, client, packet);
        break;
      case "Command.ClearInWater":
        this.commandClearInWater(server, client, packet);
        break;
      case "Command.InteractionSelect":
        this.commandInteractionSelect(server, client, packet);
        break;
      case "PlayerUpdate.VehicleCollision":
        this.playerUpdateVehicleCollision(server, client, packet);
        break;
      case "Vehicle.Dismiss":
        this.vehicleDismiss(server, client, packet);
        break;
      case "Vehicle.Spawn":
        this.vehicleSpawn(server, client, packet);
        break;
      case "Vehicle.AutoMount":
        this.vehicleAutoMount(server, client, packet);
        break;
      case "Command.Redeploy":
        this.commandRedeploy(server, client, packet);
        break;
      case "Command.InteractCancel":
        this.commandInteractCancel(server, client, packet);
        break;
      case "Command.StartLogoutRequest":
        this.commandStartLogoutRequest(server, client, packet);
        break;
      case "CharacterSelectSessionRequest":
        this.CharacterSelectSessionRequest(server, client, packet);
        break;
      case "ProfileStats.GetPlayerProfileStats":
        this.profileStatsGetPlayerProfileStats(server, client, packet);
        break;
      case "DtoHitSpeedTreeReport":
        this.DtoHitSpeedTreeReport(server, client, packet);
        break;
      case "GetRewardBuffInfo":
        this.GetRewardBuffInfo(server, client, packet);
        break;
      case "Vehicle.StateData":
        this.vehicleStateData(server, client, packet);
        break;
      case "Vehicle.AccessType":
        this.VehicleAccessType(server, client, packet);
        break;
      case "PlayerUpdateManagedPosition":
        this.PlayerUpdateManagedPosition(server, client, packet);
        break;
      case "PlayerUpdateUpdatePositionClientToZone":
        this.PlayerUpdateUpdatePositionClientToZone(server, client, packet);
        break;
      case "Command.PlayerSelect":
        this.commandPlayerSelect(server, client, packet);
        break;
      case "Construction.PlacementRequest":
        this.constructionPlacementRequest(server, client, packet);
        break;
      case "Construction.PlacementFinalizeRequest":
        this.constructionPlacementFinalizeRequest(server, client, packet);
        break;
      case "PlayerUpdate.Respawn":
        this.playerUpdateRespawn(server, client, packet);
        break;
      case "PlayerUpdate.FullCharacterDataRequest":
        this.playerUpdateFullCharacterDataRequest(server, client, packet);
        break;
      case "Fotomat":
        break;
      default:
        console.error(packet);
        console.error("Packet not implemented in packetHandlers");
        break;
    }
  }
  async reloadCommandCache() {
    delete require.cache[require.resolve("./commands/hax")];
    delete require.cache[require.resolve("./commands/dev")];
    hax = require("./commands/hax").default;
    dev = require("./commands/dev").default;
    this.hax = require("./commands/hax").default;
    this.dev = require("./commands/dev").default;
  }
}
