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

import { ZoneClient2016 as Client } from "./classes/zoneclient";

import { ZoneServer2016 } from "./zoneserver";

const debug = require("debug")("ZoneServer");

import { joaat } from "h1emu-core";

let hax = require("./commands/hax").default;

let dev = require("./commands/dev").default;

let admin = require("./commands/admin").default;

import { _, Int64String, isPosInRadius } from "../../utils/utils";

export class zonePacketHandlers {
  hax: any = hax;
  dev: any = dev;
  admin: any = admin;
  ClientIsReady: any;
  ClientFinishedLoading: any;
  Security: any;
  commandRecipeStart: any;
  commandFreeInteractionNpc: any;
  CommandSetInWater: any;
  CommandClearInWater;
  collisionDamage: any;
  lobbyGameDefinitionDefinitionsRequest: any;
  KeepAlive: any;
  clientUpdateMonitorTimeDrift: any;
  ClientLog: any;
  wallOfDataUIEvent: any;
  SetLocale: any;
  GetContinentBattleInfo: any;
  chatChat: any;
  ClientInitializationDetails: any;
  ClientLogout: any;
  GameTimeSync: any;
  Synchronization: any;
  commandExecuteCommand: any;
  commandInteractRequest: any;
  commandInteractCancel: any;
  commandStartLogoutRequest: any;
  CharacterSelectSessionRequest: any;
  profileStatsGetPlayerProfileStats: any;
  DtoHitSpeedTreeReport: any;
  GetRewardBuffInfo: any;
  PlayerUpdateManagedPosition: any;
  vehicleStateData: any;
  PlayerUpdateUpdatePositionClientToZone: any;
  characterRespawn: any;
  characterFullCharacterDataRequest: any;
  commandPlayerSelect: any;
  mountDismountRequest: any;
  commandInteractionString: any;
  mountSeatChangeRequest: any;
  constructionPlacementFinalizeRequest: any;
  commandItemDefinitionRequest: any;
  characterWeaponStance: any;
  firstTimeEvent: any;
  requestUseItem: any;
  constructionPlacementRequest: any;
  constructor() {
    this.ClientIsReady = function (
      server: ZoneServer2016,
      client: Client,
      packet: any
    ) {
      server.sendData(client, "ClientBeginZoning", {
        skyData: server._weather2016,
      }); // Needed for trees

      server.sendData(client, "QuickChat.SendData", { commands: [] });

      server.sendData(client, "ClientUpdate.DoneSendingPreloadCharacters", {
        done: true,
      }); // Required for WaitForWorldReady

      server.sendData(client, "ClientUpdate.NetworkProximityUpdatesComplete", {
        done: true,
      }); // Required for WaitForWorldReady

      server.customizeDTO(client);

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

      server.sendData(client, "Character.CharacterStateDelta", {
        guid1: client.character.guid,
        guid2: "0x0000000000000000",
        guid3: "0x0000000040000000",
        guid4: "0x0000000000000000",
        gameTime: (server.getServerTime() & 0xffffffff) >>> 0,
      });

      // client.character.currentLoadoutId = 3;
      /*
        server.sendData(client, "Loadout.SetCurrentLoadout", {
          guid: client.character.guid,
          loadoutId: client.character.currentLoadoutId,
        });
        */

      server.sendData(client, "ZoneDoneSendingInitialData", {}); // Required for WaitForWorldReady

      const commands = [
        "hax",
        "dev",
        "admin",
        "location",
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
        serverTime: Int64String(server.getServerTime()),
        serverTime2: Int64String(server.getServerTime()),
      });

      server.sendData(client, "Character.WeaponStance", {
        // activates weaponstance key
        characterId: client.character.characterId,
        stance: 1,
      });
    };
    this.ClientFinishedLoading = function (
      server: ZoneServer2016,
      client: Client,
      packet: any
    ) {
      client.currentPOI = 0; // clears currentPOI for POIManager
      server.sendGameTimeSync(client);
      server.startRessourceUpdater(client);
      if (client.firstLoading) {
        server.sendData(client, "POIChangeMessage", {
          // welcome POI message
          messageStringId: 20,
          id: 99,
        });
        server.sendChatText(client, "Welcome to H1emu ! :D", true);
        server.sendGlobalChatText(
          `${client.character.name} has joined the server !`
        );
        client.firstLoading = false;
        client.pingTimer?.refresh();
        client.savePositionTimer = setTimeout(
          () => server.saveCharacterPosition(client),
          30000
        );

        server.updateEquipment(client); // needed or third person character will be invisible
        server.updateLoadout(client); // needed or all loadout context menu entries aren't shown
        /*
        server.sendData(client, "Container.InitEquippedContainers", {
          ignore: client.character.characterId,
          characterId: client.character.characterId,
          containers: [],
        });
        */
        if (!server._soloMode) {
          server.sendZonePopulationUpdate();
        }
        server.executeFuncForAllReadyClients(() => server.spawnCharacters);
        server.lootItem(client, server.generateItem(1985), 1); // map
        server.lootItem(client, server.generateItem(1441), 1); // compass
      }

      client.isLoading = false;
    };
    this.Security = function (
      server: ZoneServer2016,
      client: Client,
      packet: any
    ) {
      debug(packet);
    };
    this.commandRecipeStart = function (
      server: ZoneServer2016,
      client: Client,
      packet: any
    ) {
      debug(packet);
      server.craftItem(client, packet.data.recipeId, packet.data.count);
    };
    this.CommandSetInWater = function (
      server: ZoneServer2016,
      client: Client,
      packet: any
    ) {
      debug(packet);
      client.character.characterStates.inWater = true;
    };
    this.CommandClearInWater = function (
      server: ZoneServer2016,
      client: Client,
      packet: any
    ) {
      debug(packet);
      client.character.characterStates.inWater = false;
    };
    this.commandFreeInteractionNpc = function (
      server: ZoneServer2016,
      client: Client,
      packet: any
    ) {
      debug("FreeInteractionNpc");
      server.sendData(client, "Command.FreeInteractionNpc", {});
    };
    this.collisionDamage = function (
      server: ZoneServer2016,
      client: Client,
      packet: any
    ) {
      const characterId = packet.data.characterId;
      const damage = packet.data.damage;
      const vehicle = server._vehicles[characterId];
      if (characterId === client.character.characterId) {
        server.playerDamage(client, damage * 5);
      } else if (vehicle) {
        server.damageVehicle(damage / 50, vehicle);
        //server.DTOhit(client, packet);
      }
    };
    this.lobbyGameDefinitionDefinitionsRequest = function (
      server: ZoneServer2016,
      client: Client,
      packet: any
    ) {
      server.sendData(client, "LobbyGameDefinition.DefinitionsResponse", {
        definitionsData: { data: "" },
      });
    };
    this.KeepAlive = function (
      server: ZoneServer2016,
      client: Client,
      packet: any
    ) {
      server.sendData(client, "KeepAlive", {
        gameTime: packet.data.gameTime,
      });
    };
    this.clientUpdateMonitorTimeDrift = function (
      server: ZoneServer2016,
      client: Client,
      packet: any
    ) {};
    this.ClientLog = function (
      server: ZoneServer2016,
      client: Client,
      packet: any
    ) {
      debug(packet);
    };
    this.wallOfDataUIEvent = function (
      server: ZoneServer2016,
      client: Client,
      packet: any
    ) {
      debug("UIEvent");
    };
    this.SetLocale = function (
      server: ZoneServer2016,
      client: Client,
      packet: any
    ) {
      debug("SetLocale");
    };
    this.GetContinentBattleInfo = function (
      server: ZoneServer2016,
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
    (this.chatChat = function (
      server: ZoneServer2016,
      client: Client,
      packet: any
    ) {
      const { channel, message } = packet.data;
      server.sendChat(client, message, channel);
    }),
      /*
    "Loadout.SelectSlot": function (server: ZoneServer2016, client: Client, packet: any) {

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

    }*/
      (this.ClientInitializationDetails = function (
        server: ZoneServer2016,
        client: Client,
        packet: any
      ) {
        // just in case
        if (packet.data.unknownDword1) {
          debug("ClientInitializationDetails : ", packet.data.unknownDword1);
        }
      });
    this.ClientLogout = function (
      server: ZoneServer2016,
      client: Client,
      packet: any
    ) {
      debug("ClientLogout");
      server.deleteClient(client);
    };
    this.GameTimeSync = function (
      server: ZoneServer2016,
      client: Client,
      packet: any
    ) {
      server.sendGameTimeSync(client);
    };
    this.Synchronization = function (
      server: ZoneServer2016,
      client: Client,
      packet: any
    ) {
      const serverTime = Int64String(server.getServerTime());
      server.sendData(client, "Synchronization", {
        time1: packet.data.time1,
        time2: packet.data.time2,
        clientTime: packet.data.clientTime,
        serverTime: serverTime,
        serverTime2: serverTime,
        time3: packet.data.clientTime + 2,
      });
    };
    (this.commandExecuteCommand = async function (
      server: ZoneServer2016,
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
    }),
      /*
    "Command.SetProfile": function (server: ZoneServer2016, client: Client, packet: any) {
      server.sendData(client, "Loadout.SetCurrentLoadout", {
        type: 2,
        unknown1: 0,
        loadoutId: 15,
        tabId: 256,
        unknown2: 1,
      });
    }*/
      (this.commandInteractRequest = function (
        server: ZoneServer2016,
        client: Client,
        packet: any
      ) {
        server.sendData(client, "Command.InteractionString", {
          guid: packet.data.guid,
          stringId: 5463,
          unknown4: 0,
        });
        server.sendData(client, "Command.InteractionList", {
          guid: packet.data.guid,
          unknownBoolean1: true,
          unknownArray1: [
            {
              unknownDword1: 11,
              unknownDword2: 0,
              unknownDword3: 5463,
              unknownDword4: 51,
              unknownDword5: 1,
              unknownDword6: 0,
              unknownDword7: 0,
            },
          ],
          unknownString1: "",
          unknownBoolean2: true,
          unknownArray2: [],
          unknownBoolean3: false,
        });
      }),
      /*
    "Command.InteractionSelect": function (server: ZoneServer2016, client: Client, packet: any) {
      server.sendData(client, "Loadout.SetLoadouts", {
        type: 2,
        guid: packet.data.guid,
        unknownDword1: 1,
      });
    }*/
      (this.commandInteractCancel = function (
        server: ZoneServer2016,
        client: Client,
        packet: any
      ) {
        debug("Interaction Canceled");
      });
    this.commandStartLogoutRequest = function (
      server: ZoneServer2016,
      client: Client,
      packet: any
    ) {
      const timerTime = 10000;
      server.sendData(client, "ClientUpdate.StartTimer", {
        stringId: 0,
        time: timerTime,
      });
      client.posAtLogoutStart = client.character.state.position;
      if (client.hudTimer != null) {
        clearTimeout(client.hudTimer);
      }
      client.hudTimer = setTimeout(() => {
        server.sendData(client, "ClientUpdate.CompleteLogoutProcess", {});
      }, timerTime);
    };
    this.CharacterSelectSessionRequest = function (
      server: ZoneServer2016,
      client: Client,
      packet: any
    ) {
      server.sendData(client, "CharacterSelectSessionResponse", {
        status: 1,
        sessionId: client.loginSessionId,
      });
    };
    this.profileStatsGetPlayerProfileStats = function (
      server: ZoneServer2016,
      client: Client,
      packet: any
    ) {
      server.sendData(
        client,
        "ProfileStats.PlayerProfileStats",
        require("../../../data/profilestats.json")
      );
    };
    this.DtoHitSpeedTreeReport = function (
      server: ZoneServer2016,
      client: Client,
      packet: any
    ) {
      debug(packet);
      server.speedTreeUse(client, packet);
    };
    this.GetRewardBuffInfo = function (
      server: ZoneServer2016,
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
    this.PlayerUpdateManagedPosition = function (
      server: ZoneServer2016,
      client: Client,
      packet: any
    ) {
      const characterId: string = server._transientIds[packet.data.transientId],
        vehicle = characterId ? server._vehicles[characterId] : undefined;
      if (!vehicle) return;
      //if (!server._soloMode) {
      server.sendDataToAllOthersWithSpawnedVehicle(
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
        vehicle.npcData.position = new Float32Array([
          packet.data.positionUpdate.position[0],
          packet.data.positionUpdate.position[1],
          packet.data.positionUpdate.position[2],
          0,
        ]);
        vehicle.getPassengerList().forEach((passenger: any) => {
          server._characters[passenger].state.position = new Float32Array([
            packet.data.positionUpdate.position[0],
            packet.data.positionUpdate.position[1],
            packet.data.positionUpdate.position[2],
            0,
          ]);
        });
        if (client.vehicle.mountedVehicle === characterId) {
          if (
            !client.posAtLastRoutine ||
            !isPosInRadius(
              server._npcRenderDistance / 2.5,
              client.character.state.position,
              client.posAtLastRoutine
            )
          ) {
            server.executeFuncForAllReadyClients(() => server.vehicleManager);
          }
        }
      }
    };
    this.vehicleStateData = function (
      server: ZoneServer2016,
      client: Client,
      packet: any
    ) {
      server.sendDataToAllOthersWithSpawnedVehicle(
        client,
        packet.data.guid,
        "Vehicle.StateData",
        {
          ...packet.data,
        }
      );
    };
    this.PlayerUpdateUpdatePositionClientToZone = function (
      server: ZoneServer2016,
      client: Client,
      packet: any
    ) {
      if (packet.data.flags === 510) {
        client.vehicle.falling = packet.data.unknown10_float;
      }
      const movingCharacter = server._characters[client.character.characterId];
      if (movingCharacter) {
        if (client.vehicle.mountedVehicle) {
          const vehicle = server._vehicles[client.vehicle.mountedVehicle];
          server.sendRawToAllOthersWithSpawnedCharacter(
            client,
            movingCharacter.characterId,
            server._protocol.createPositionBroadcast2016(
              packet.data.raw,
              vehicle.npcData.transientId
            )
          );
        } else {
          server.sendRawToAllOthersWithSpawnedCharacter(
            client,
            movingCharacter.characterId,
            server._protocol.createPositionBroadcast2016(
              packet.data.raw,
              movingCharacter.transientId
            )
          );
        }
      }
      if (packet.data.horizontalSpeed) {
        client.character.isRunning =
          packet.data.horizontalSpeed > (client.character.isExhausted ? 5 : 6);
      }

      if (packet.data.position) {
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
          clearTimeout(client.hudTimer);
          client.hudTimer = null;
          client.isInteracting = false;
          server.sendData(client, "ClientUpdate.StartTimer", {
            stringId: 0,
            time: 0,
          }); // don't know how it was done so
        }
      } else if (
        packet.data.vehicle_position &&
        client.vehicle.mountedVehicle
      ) {
        server._vehicles[client.vehicle.mountedVehicle].npcData.position =
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
    };
    this.characterRespawn = function (
      server: ZoneServer2016,
      client: Client,
      packet: any
    ) {
      debug(packet);
      server.respawnPlayer(client);
    };
    this.characterFullCharacterDataRequest = function (
      server: ZoneServer2016,
      client: Client,
      packet: any
    ) {
      const { characterId } = packet.data,
        entityData: any =
          server._npcs[characterId] ||
          server._vehicles[characterId] ||
          server._characters[characterId] ||
          0,
        entityType = server._npcs[characterId]
          ? 1
          : 0 || server._vehicles[characterId]
          ? 2
          : 0 || server._characters[characterId]
          ? 3
          : 0;

      if (!entityType) return;
      switch (entityType) {
        case 1: // npcs
          server.sendData(client, "LightweightToFullNpc", {
            transientId: entityData.transientId,
            attachmentData: [
              /*
              {
                modelName: "SurvivorMale_Chest_Hoodie_Up_Tintable.adr",
                effectId: 0,
                slotId: 3,
              },*/
            ],
            effectTags: [],
            unknownData1: {},
            targetData: {},
            unknownArray1: [],
            unknownArray2: [],
            //unknownArray3: {/*data:[]*/},
            //resources: {/*
            //  data:[
            /*{
                  resourceId: 1,
                  resourceData: {
                    resourceId: 1,
                    resourceType: 1,
                    value: 10000
                  }
                }
              ]*/
            //},
            //unknownArray4: {/*unknownArray1:[], unknownArray2:[]*/},
            //unknownArray5: {/*data:[]*/},
            //unknownArray6: {/*data:[]*/},
            //remoteWeapons: {/*data:[]*/},
            //itemsData: {/*data:[]*/}
          });
          break;
        case 2: // vehicles
          server.sendData(client, "LightweightToFullVehicle", {
            npcData: {
              transientId: entityData.npcData.transientId,
              attachmentData: [],
              effectTags: [],
              unknownData1: {},
              targetData: {},
              unknownArray1: [],
              unknownArray2: [],
              unknownArray3: { data: [] },
              resources: {
                data: [
                  {
                    resourceId: 1,
                    resourceData: {
                      resourceId: 561,
                      resourceType: 1,
                      value: entityData.npcData.resources.health,
                    },
                  },
                  {
                    resourceId: 50,
                    resourceData: {
                      resourceId: 396,
                      resourceType: 50,
                      value: entityData.npcData.resources.fuel,
                    },
                  },
                ],
              },
              unknownArray4: { data: [] },
              unknownArray5: { data: [] },
              unknownArray6: { data: [] },
              remoteWeapons: { data: [] },
              itemsData: { data: [] },
            },
            unknownArray1: [],
            unknownArray2: [],
            unknownArray3: [],
            unknownArray4: [],
            unknownArray5: [
              {
                unknownData1: {
                  unknownData1: {},
                },
              },
            ],
            unknownArray6: [],
            unknownArray7: [],
            unknownArray8: [
              {
                unknownArray1: [],
              },
            ],
          });
          if (entityData.destroyedEffect != 0) {
            server.sendData(client, "Command.PlayDialogEffect", {
              characterId: entityData.npcData.characterId,
              effectId: entityData.destroyedEffect,
            });
          }
          if (entityData.engineOn) {
            server.sendData(client, "Vehicle.Engine", {
              guid2: entityData.npcData.characterId,
              unknownBoolean: false,
            });
          }
          break;
        case 3: // characters
          server.sendData(client, "LightweightToFullPc", {
            positionUpdate: server.createPositionUpdate(
              entityData.state.position,
              entityData.state.rotation
            ),
            stats: [],
            fullPcData: {
              transientId: entityData.transientId,
              attachmentData: [],
              unknownData1: {},
              effectTags: [],
            },
          });
          server.updateEquipment(client, entityData);
          server.sendData(client, "Character.WeaponStance", {
            // activates weaponstance key
            characterId: entityData.characterId,
            stance: 1,
          });
          break;
        default:
          break;
      }
    };
    this.commandPlayerSelect = function (
      server: ZoneServer2016,
      client: Client,
      packet: any
    ) {
      const { guid } = packet.data,
        entityData: any =
          server._objects[guid] ||
          server._vehicles[guid] ||
          server._doors[guid] ||
          0,
        entityType = server._objects[guid]
          ? 1
          : 0 || server._vehicles[guid]
          ? 2
          : 0 || server._doors[guid]
          ? 3
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
          server.pickupItem(client, guid);
          break;
        case 2: // vehicle
          !client.vehicle.mountedVehicle
            ? server.mountVehicle(client, packet)
            : server.dismountVehicle(client);
          break;
        case 3: // door
          if (entityData.isOpen === false) {
            entityData.moving = true;
            setTimeout(function () {
              entityData.moving = false;
            }, 500);
            server.sendDataToAll("PlayerUpdatePosition", {
              transientId: entityData.transientId,
              positionUpdate: {
                sequenceTime: 0,
                unknown3_int8: 0,
                position: entityData.position,
                orientation: entityData.openAngle,
              },
            });
            server.sendDataToAll("Command.PlayDialogEffect", {
              characterId: entityData.characterId,
              effectId: 5049,
            });
            entityData.isOpen = true;
          } else {
            entityData.moving = true;
            setTimeout(function () {
              entityData.moving = false;
            }, 500);
            server.sendData(client, "PlayerUpdatePosition", {
              transientId: entityData.transientId,
              positionUpdate: {
                sequenceTime: 0,
                unknown3_int8: 0,
                stance: 1089,
                position: entityData.position,
                orientation: entityData.closedAngle,
              },
            });
            server.sendData(client, "Command.PlayDialogEffect", {
              characterId: entityData.characterId,
              effectId: 5049,
            });
            entityData.isOpen = false;
          }
          break;
        default:
          break;
      }
    };
    this.mountDismountRequest = function (
      server: ZoneServer2016,
      client: Client,
      packet: any
    ) {
      // only for driver seat
      server.dismountVehicle(client);
    };
    this.commandInteractionString = function (
      server: ZoneServer2016,
      client: Client,
      packet: any
    ) {
      const { guid } = packet.data,
        entityData: any =
          server._objects[guid] ||
          server._vehicles[guid] ||
          server._doors[guid] ||
          0,
        entityType = server._objects[guid]
          ? 1
          : 0 || server._vehicles[guid]
          ? 2
          : 0 || server._doors[guid]
          ? 3
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
            stringId: 13338,
          });
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
            stringId: 31,
          });
          break;
        default:
          break;
      }
    };
    this.mountSeatChangeRequest = function (
      server: ZoneServer2016,
      client: Client,
      packet: any
    ) {
      server.changeSeat(client, packet);
    };
    this.constructionPlacementFinalizeRequest = function (
      server: ZoneServer2016,
      client: Client,
      packet: any
    ) {
      server.sendData(client, "Construction.PlacementFinalizeResponse", {
        status: 1,
        unknownString1: "",
      });
    };
    this.commandItemDefinitionRequest = function (
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
          ID: packet.data.ID,
          definitionData: {
            ...itemDef,
            HUD_IMAGE_SET_ID: itemDef.IMAGE_SET_ID,
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
    };
    this.characterWeaponStance = function (
      server: ZoneServer2016,
      client: Client,
      packet: any
    ) {
      server.sendDataToAllOthersWithSpawnedCharacter(
        client,
        "Character.WeaponStance",
        {
          characterId: client.character.characterId,
        }
      );
    };
    this.firstTimeEvent = function (
      server: ZoneServer2016,
      client: Client,
      packet: any
    ) {
      server.sendData(client, "FirstTimeEvent.State", {
        unknownDword1: 0xffffffff,
        unknownDword2: 1,
        unknownBoolean1: false,
      });
    };
    //#region ITEMS
    this.requestUseItem = function (
      server: ZoneServer2016,
      client: Client,
      packet: any
    ) {
      debug(packet.data);
      if (!packet.data.itemGuid) {
        server.sendChatText(client, "[ERROR] ItemGuid is invalid!");
        return;
      }
      const itemDefinition = server.getItemDefinition(
        server._items[packet.data.itemGuid].itemDefinitionId
      );
      const nameId = itemDefinition.NAME_ID;
      switch (packet.data.itemUseOption) {
        case 4: // normal item drop option
        case 73: // battery drop option
        case 79: // sparks drop option
          server.dropItem(
            client,
            packet.data.itemGuid,
            packet.data.itemSubData?.count
          );
          break;
        case 60:
          const item = server._items[packet.data.itemGuid],
            loadoutId = server.getLoadoutSlot(item.itemDefinitionId),
            oldLoadoutItem = client.character._loadout[loadoutId];
          if (oldLoadoutItem) {
            // if target loadoutSlot is occupied
            if (oldLoadoutItem.itemGuid == packet.data.itemGuid) {
              server.sendChatText(client, "[ERROR] Item is already equipped!");
              return;
            }
            server.lootContainerItem(client, oldLoadoutItem.itemGuid, 1, false);
          }
          server.equipItem(client, packet.data.itemGuid);
          break;
        case 6: // shred
          server.shredItem(client, packet.data.itemGuid);
          break;
        case 1: //eat
          server.eatItem(client, packet.data.itemGuid, nameId);
          break;
        case 2: //drink
          server.drinkItem(client, packet.data.itemGuid, nameId);
          break;
        case 3: //use
          server.useItem(client, packet.data.itemGuid);
          break;
        case 17: //refuel
          server.refuelVehicle(
            client,
            packet.data.itemGuid,
            packet.data.characterId2
          );
          break;
        case 52: //use medical
          server.useMedical(client, packet.data.itemGuid, nameId);
          break;
        default:
          server.sendChatText(
            client,
            "[ERROR] ItemUseOption not mapped to a function."
          );
      }
    };
    this.constructionPlacementRequest = function (
      server: ZoneServer2016,
      client: Client,
      packet: any
    ) {
      debug(packet.data);
      server.sendData(client, "Construction.PlacementResponse", {
        unknownDword1: packet.data.itemDefinitionId,
        model: server.getItemDefinition(packet.data.itemDefinitionId)
          .PLACEMENT_MODEL_ID,
      });
    };
    //#endregion
  }

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
        this.commandRecipeStart(server, client, packet);
        break;
      case "Command.FreeInteractionNpc":
        this.commandFreeInteractionNpc(server, client, packet);
        break;
      case "Command.SetInWater":
        this.CommandSetInWater(server, client, packet);
        break;
      case "Command.ClearInWater":
        this.CommandClearInWater(server, client, packet);
        break;
      case "Collision.Damage":
        this.collisionDamage(server, client, packet);
        break;
      case "LobbyGameDefinition.DefinitionsRequest":
        this.lobbyGameDefinitionDefinitionsRequest(server, client, packet);
        break;
      case "KeepAlive":
        this.KeepAlive(server, client, packet);
        break;
      case "ClientUpdate.MonitorTimeDrift":
        this.clientUpdateMonitorTimeDrift(server, client, packet);
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
      case "GetContinentBattleInfo":
        this.GetContinentBattleInfo(server, client, packet);
        break;
      case "Chat.Chat":
        this.chatChat(server, client, packet);
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
      case "Command.InteractRequest":
        this.commandInteractRequest(server, client, packet);
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
      case "PlayerUpdateManagedPosition":
        this.PlayerUpdateManagedPosition(server, client, packet);
        break;
      case "Vehicle.StateData":
        this.vehicleStateData(server, client, packet);
        break;
      case "PlayerUpdateUpdatePositionClientToZone":
        this.PlayerUpdateUpdatePositionClientToZone(server, client, packet);
        break;
      case "Character.Respawn":
        this.characterRespawn(server, client, packet);
        break;
      case "Character.FullCharacterDataRequest":
        this.characterFullCharacterDataRequest(server, client, packet);
        break;
      case "Command.PlayerSelect":
        this.commandPlayerSelect(server, client, packet);
        break;
      case "Mount.DismountRequest":
        this.mountDismountRequest(server, client, packet);
        break;
      case "Command.InteractionString":
        this.commandInteractionString(server, client, packet);
        break;
      case "Mount.SeatChangeRequest":
        this.mountSeatChangeRequest(server, client, packet);
        break;
      case "Construction.PlacementFinalizeRequest":
        this.constructionPlacementFinalizeRequest(server, client, packet);
        break;
      case "Command.ItemDefinitionRequest":
        this.commandItemDefinitionRequest(server, client, packet);
        break;
      case "Character.WeaponStance":
        this.characterWeaponStance(server, client, packet);
        break;
      case "FirstTimeEvent.Unknown1":
        this.firstTimeEvent(server, client, packet);
        break;
      case "Items.RequestUseItem":
        this.requestUseItem(server, client, packet);
        break;
      case "Construction.PlacementRequest":
        this.constructionPlacementRequest(server, client, packet);
        break;
      default:
        debug(packet);
        debug("Packet not implemented in packetHandlers");
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
