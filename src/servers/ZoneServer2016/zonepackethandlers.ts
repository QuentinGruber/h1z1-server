// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (c) 2020 - 2021 Quentin Gruber
//   copyright (c) 2021 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

// delete commands cache if exist so /dev reloadPackets reload them too
try {
  // delete commands cache if exist so /dev reloadPackets reload them too
  delete require.cache[require.resolve("./commands/hax")];
  delete require.cache[require.resolve("./commands/dev")];
} catch (e) {}

import { joaat } from "h1emu-core"
import hax from "./commands/hax";
import dev from "./commands/dev";
import admin from "./commands/admin";

import { Int64String, isPosInRadius } from "../../utils/utils";
import { ZoneServer2016 } from "./zoneserver";
import {ZoneClient2016 as Client} from "./zoneclient";
// TOOD: UPDATE THIS FOR 2016
// const modelToName = require("../../../data/2016/dataSources/ModelToName.json");

import { _ } from "../../utils/utils";
const debug = require("debug")("zonepacketHandlers");

const packetHandlers = {
  ClientIsReady: function (
    server: ZoneServer2016,
    client: Client,
    packet: any
  ) {
    server.sendData(client, "ClientBeginZoning", {
      skyData: server._weather2016,
    }); // Needed for trees

    server.sendData(client, "QuickChat.SendData", { commands: [] });

    server.sendData(client, "ClientUpdate.ActivateProfile", {
      profileData: {
        profileId: 1,
        nameId: 12,
        descriptionId: 13,
        type: 3,
        unknownDword1: 0,
        abilityBgImageSet: 4,
        badgeImageSet: 5,
        buttonImageSet: 6,
        unknownByte1: 0,
        unknownByte2: 0,
        unknownDword4: 0,
        unknownArray1: [],
        unknownDword5: 0,
        unknownDword6: 0,
        unknownByte3: 1,
        unknownDword7: 0,
        unknownDword8: 0,
        unknownDword9: 0,
        unknownDword10: 0,
        unknownDword11: 0,
        unknownDword12: 0,
        unknownDword13: 0,
        unknownDword14: 0,
        unknownDword15: 0,
        unknownDword16: 0,
      },
      equipmentModels: client.character.equipment,
      unknownDword1: 1,
      unknownDword2: 1,
      actorModelId: 9240,
      tintAlias: "",
      decalAlias: "#",
    });

    server.sendData(client, "ClientUpdate.DoneSendingPreloadCharacters", {
      done: true,
    }); // Required for WaitForWorldReady

    server.sendData(client, "ClientUpdate.NetworkProximityUpdatesComplete", {
      done: true,
    }); // Required for WaitForWorldReady
    //server.sendData(client, "ClientUpdate.UpdateStat", { stats: [] });

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
  },
  ClientFinishedLoading: function (
    server: ZoneServer2016,
    client: Client,
    packet: any
  ) {
    client.currentPOI = 0; // clears currentPOI for POIManager
    server.sendGameTimeSync(client);
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
        () => server.saveCharacterPosition(client, 30000),
        30000
      );
      server._characters[client.character.characterId] = {
        ...client.character,
        identity: {},
      };
      server.executeFuncForAllClients("spawnCharacters");
    }

    client.isLoading = false;
  },
  Security: function (server: ZoneServer2016, client: Client, packet: any) {
    debug(packet);
  },
  "Command.RecipeStart": function (
    server: ZoneServer2016,
    client: Client,
    packet: any
  ) {
    debug(packet);
    server.sendData(client, "Command.RecipeAction", {});
  },
  "Command.FreeInteractionNpc": function (
    server: ZoneServer2016,
    client: Client,
    packet: any
  ) {
    debug("FreeInteractionNpc");
    server.sendData(client, "Command.FreeInteractionNpc", {});
  },
  "Collision.Damage": function (
    server: ZoneServer2016,
    client: Client,
    packet: any
  ) {
    debug("Collision.Damage");
    debug(packet);
  },
  "LobbyGameDefinition.DefinitionsRequest": function (
    server: ZoneServer2016,
    client: Client,
    packet: any
  ) {
    server.sendData(client, "LobbyGameDefinition.DefinitionsResponse", {
      definitionsData: { data: "" },
    });
  },
  KeepAlive: function (server: ZoneServer2016, client: Client, packet: any) {
    server.sendData(client, "KeepAlive", {
      gameTime: packet.data.gameTime,
    });
  },
  "ClientUpdate.MonitorTimeDrift": function (
    server: ZoneServer2016,
    client: Client,
    packet: any
  ) {},
  ClientLog: function (server: ZoneServer2016, client: Client, packet: any) {
    debug(packet);
  },
  "WallOfData.UIEvent": function (
    server: ZoneServer2016,
    client: Client,
    packet: any
  ) {
    debug("UIEvent");
  },
  SetLocale: function (server: ZoneServer2016, client: Client, packet: any) {
    debug("Do nothing");
  },
  GetContinentBattleInfo: function (
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
  },
  "Chat.Chat": function (server: ZoneServer2016, client: Client, packet: any) {
    const { channel, message } = packet.data;
    server.sendChat(client, message, channel);
  },
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
    
  },
  */
  ClientInitializationDetails: function (
    server: ZoneServer2016,
    client: Client,
    packet: any
  ) {
    // just in case
    if (packet.data.unknownDword1) {
      debug("ClientInitializationDetails : ", packet.data.unknownDword1);
    }
  },
  ClientLogout: function (server: ZoneServer2016, client: Client, packet: any) {
    debug("ClientLogout");
    server.saveCharacterPosition(client);
    server.deleteEntity(client.character.characterId, server._characters);
    server._gatewayServer._soeServer.deleteClient(client);
    delete server._characters[client.character.characterId];
    delete server._clients[client.sessionId];
  },
  GameTimeSync: function (server: ZoneServer2016, client: Client, packet: any) {
    server.sendGameTimeSync(client);
  },
  Synchronization: function (
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
  },
  "Command.ExecuteCommand": async function (
    server: ZoneServer2016,
    client: Client,
    packet: any
  ) {
    const args: any[] = packet.data.arguments.toLowerCase().split(" ");

    switch (packet.data.commandHash) {
      case 2371122039: // /serverinfo
        if (args[0] === "mem") {
          const used = process.memoryUsage().heapUsed / 1024 / 1024;
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
          } = server;
          const serverVersion = require("../../../package.json").version;
          server.sendChatText(client, `h1z1-server V${serverVersion}`, true);
          server.sendChatText(client, `Connected clients : ${_.size(clients)}`);
          server.sendChatText(client, `characters : ${_.size(characters)}`);
          server.sendChatText(client, `npcs : ${_.size(npcs)}`);
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
        const haxCommandList: any = [];
        Object.keys(hax).forEach((key) => {
          haxCommandList.push(`/hax ${key}`);
        });
        const devCommandList: any = [];
        Object.keys(dev).forEach((key) => {
          devCommandList.push(`/dev ${key}`);
        });
        const commandList = ["/help", "/loc", "/spawninfo", "/serverinfo"];
        server.sendChatText(client, `Commands list:`);
        commandList
          .concat(haxCommandList, devCommandList)
          .sort((a, b) => a.localeCompare(b))
          .forEach((command) => {
            server.sendChatText(client, `${command}`);
          });
        break;
      case joaat("LOCATION"):
      case 3270589520: // /loc
        const { position, rotation } = client.character.state;
        server.sendChatText(
          client,
          `position: ${position[0]},${position[1]},${position[2]}`
        );
        server.sendChatText(
          client,
          `rotation: ${rotation[0]},${rotation[1]},${rotation[2]}`
        );
        break;
      case joaat("HAX"):
        hax[args[0]]
          ? hax[args[0]](server, client, args)
          : server.sendChatText(client, `Unknown command: /dev ${args[0]} , display all dev commands by using /hax list`);
        break;
      case joaat("DEV"):
      case 552078457: // dev
        dev[args[0]]
          ? dev[args[0]](server, client, args)
          : server.sendChatText(client, `Unknown command: /dev ${args[0]} , display all dev commands by using /dev list`);
        break;
      case joaat("ADMIN"):
      case 997464845: // admin
        admin[args[0]]
          ? admin[args[0]](server, client, args)
          : server.sendChatText(client, `Unknown command: /dev ${args[0]} , display all dev commands by using /admin list`);
        break;
    }
  },
  /*
  "Command.SetProfile": function (server: ZoneServer2016, client: Client, packet: any) {
    server.sendData(client, "Loadout.SetCurrentLoadout", {
      type: 2,
      unknown1: 0,
      loadoutId: 15,
      tabId: 256,
      unknown2: 1,
    });
  },
  */
  "Command.InteractRequest": function (
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
  },
  /*
  "Command.InteractionSelect": function (server: ZoneServer2016, client: Client, packet: any) {
    server.sendData(client, "Loadout.SetLoadouts", {
      type: 2,
      guid: packet.data.guid,
      unknownDword1: 1,
    });
  },
  */

  "Command.InteractCancel": function (
    server: ZoneServer2016,
    client: Client,
    packet: any
  ) {
    debug("Interaction Canceled");
  },
  "Command.StartLogoutRequest": function (
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
    if (client.timer != null) {
      clearTimeout(client.timer);
    }
    client.timer = setTimeout(() => {
      server.sendData(client, "ClientUpdate.CompleteLogoutProcess", {});
    }, timerTime);
  },
  CharacterSelectSessionRequest: function (
    server: ZoneServer2016,
    client: Client,
    packet: any
  ) {
    server.sendData(client, "CharacterSelectSessionResponse", {
      status: 1,
      sessionId: client.loginSessionId,
    });
  },
  "ProfileStats.GetPlayerProfileStats": function (
    server: ZoneServer2016,
    client: Client,
    packet: any
  ) {
    server.sendData(
      client,
      "ProfileStats.PlayerProfileStats",
      require("../../../data/profilestats.json")
    );
  },
  Pickup: function (server: ZoneServer2016, client: Client, packet: any) {
    debug(packet);
    const { data: packetData } = packet;
    server.sendData(client, "ClientUpdate.StartTimer", {
      stringId: 582,
      time: 100,
    });
    if (packetData.name === "SpeedTree.Blackberry") {
      server.sendData(client, "ClientUpdate.TextAlert", {
        message: "Blackberries...miss you...",
      });
    } else {
      server.sendData(client, "ClientUpdate.TextAlert", {
        message: packetData.name.replace("SpeedTree.", ""),
      });
    }
  },
  GetRewardBuffInfo: function (
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
  },
  PlayerUpdateManagedPosition: function (
    server: ZoneServer2016,
    client: Client,
    packet: any
  ) {
    console.log(packet);
    console.log(packet.data)
    const characterId = server._transientIds[packet.data.transientId];
    console.log(characterId)
    console.log(server._vehicles[characterId])
    if (characterId) {
      if (!server._soloMode) {
        server.sendRawToAllOthers(
          client,
          server._protocol.createVehiclePositionBroadcast(
            packet.data.positionUpdate.raw.slice(1)
          )
        );
      }
      if (packet.data.positionUpdate.position) {
        //server._vehicles[characterId].positionUpdate =
        //  packet.data.positionUpdate;
        server._vehicles[characterId].npcData.position = new Float32Array([
          packet.data.positionUpdate.position[0],
          packet.data.positionUpdate.position[1],
          packet.data.positionUpdate.position[2],
          0,
        ]);
        if (client.vehicle.mountedVehicle === characterId) {
          client.character.state.position = new Float32Array([
            packet.data.positionUpdate.position[0],
            packet.data.positionUpdate.position[1],
            packet.data.positionUpdate.position[2],
            0,
          ]);
          if (
            !client.posAtLastRoutine ||
            !isPosInRadius(
              server._npcRenderDistance / 2.5,
              client.character.state.position,
              client.posAtLastRoutine
            )
          ) {
            server.worldRoutine2016();
          }
        }
      }
    }
  },
  PlayerUpdateUpdatePositionClientToZone: function (
    server: ZoneServer2016,
    client: Client,
    packet: any
  ) {
    if (packet.data.flags === 510) {
      client.vehicle.falling = packet.data.unknown10_float;
    }
    const movingCharacter = server._characters[client.character.characterId];
    if (movingCharacter /*&& !server._soloMode*/) {
      if (client.vehicle.mountedVehicle) {
        const vehicle = server._vehicles[client.vehicle.mountedVehicle];
        //console.log(vehicle);
        server.sendRawToAllOthers(
          client,
          server._protocol.createPositionBroadcast(
            packet.data.raw.slice(1),
            vehicle.npcData.transientId
          )
        );
      } else {
        /*
        server.sendRawToAllOthers(
          client,
          server._protocol.createPositionBroadcast(
            packet.data.raw,
            movingCharacter.transientId
          )
        );
        */
        server.sendDataToAllOthers(client, "PlayerUpdatePosition", {
          transientId: movingCharacter.transientId,
          positionUpdate: server.createPositionUpdate(
            movingCharacter.state.position,
            movingCharacter.state.lookAt
          ),
        });
      }
    }
    if (packet.data.position) {
      // TODO: modify array element beside re-creating it
      client.character.state.position = new Float32Array([
        packet.data.position[0],
        packet.data.position[1],
        packet.data.position[2],
        0,
      ]);
      if (packet.data.unknown11_float > 6) {
        client.character.isRunning = true;
      } else {
        client.character.isRunning = false;
      }

      if (
        client.timer != null &&
        !isPosInRadius(
          1,
          client.character.state.position,
          client.posAtLogoutStart
        )
      ) {
        clearTimeout(client.timer);
        client.timer = null;
        client.isInteracting = false;
        server.sendData(client, "ClientUpdate.StartTimer", {
          stringId: 0,
          time: 0,
        }); // don't know how it was done so
      }
      if (!client.posAtLastRoutine) {
        server.spawnProps(client);
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
        server.worldRoutine2016();
      }
    } else if (packet.data.vehicle_position && client.vehicle.mountedVehicle) {
      server._vehicles[
        client.vehicle.mountedVehicle
      ].npcData.position = new Float32Array([
        packet.data.vehicle_position[0],
        packet.data.vehicle_position[1],
        packet.data.vehicle_position[2],
        0,
      ]);
    }
    if (packet.data.rotation) {
      // TODO: modify array element beside re-creating it
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
  },
  "Character.Respawn": function (
    server: ZoneServer2016,
    client: Client,
    packet: any
  ) {
    debug(packet);
    server.sendData(client, "Character.RespawnReply", {
      characterId: client.character.characterId,
      position: [0, 200, 0, 1],
    });
  },
  "Character.FullCharacterDataRequest": function (
    server: ZoneServer2016,
    client: Client,
    packet: any
  ) {
    const {
      data: { characterId },
    } = packet;
    const npc =
      server._npcs[characterId] || server._objects[characterId] || server._doors[characterId];
    if (npc) {
      server.sendData(client, "LightweightToFullNpc", {
        transientId: npc.transientId,
        equipmentModels: [
          {
            modelName: "SurvivorMale_Chest_Hoodie_Up_Tintable.adr",
            effectId: 0,
            slotId: 3,
          },
        ],
        effectTags: [],
        unknownData1: {},
        targetData: {},
        unknownArray1: [],
        unknownArray2: [],
      });
    } else if (server._characters[characterId]) {
      server.sendData(client, "LightweightToFullPc", {
        positionUpdate: server.createPositionUpdate(
          new Float32Array([0, 0, 0, 0]),
          [0, 0, 0, 0]
        ),
        array1: [],
        unknownData1: {
          transientId: server._characters[characterId].transientId,
          equipmentModels: [],
          unknownData1: {},
          effectTags: [],
        },
      });
    } else if (server._vehicles[characterId]) {
      server.sendData(client, "LightweightToFullVehicle", {
        npcData: {
          transientId: server._vehicles[characterId].npcData.transientId,
          equipmentModels: [],
          effectTags: [],
          unknownData1: {},
          targetData: {},
          unknownArray1: [],
          unknownArray2: [],
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
    }
  },

  "Command.PlayerSelect": function (
    server: ZoneServer2016,
    client: Client,
    packet: any
  ) {
    if (server._vehicles[packet.data.guid] && !client.vehicle.mountedVehicle) {
      server.mountVehicle(client, packet);
    } else if (
      server._vehicles[packet.data.guid] &&
      client.vehicle.mountedVehicle
    ) {
      // other seats
      server.dismountVehicle(client);
    }
  },

  "Mount.DismountRequest": function (
    server: ZoneServer2016,
    client: Client,
    packet: any
  ) {
    // only for driver seat
    server.dismountVehicle(client);
  },
  "Command.InteractionString": function (
    server: ZoneServer2016,
    client: Client,
    packet: any
  ) {
    const { guid } = packet.data;
    const objectData = server._objects[guid];
    const doorData = server._doors[guid];
    const vehicleData = server._vehicles[guid];

    if (
      objectData &&
      isPosInRadius(
        server._interactionDistance,
        client.character.state.position,
        objectData.position
      )
    ) {
      server.sendData(client, "Command.InteractionString", {
        guid: guid,
        stringId: 29,
      });
    } else if (
      doorData &&
      isPosInRadius(
        server._interactionDistance,
        client.character.state.position,
        doorData.position
      )
    ) {
      server.sendData(client, "Command.InteractionString", {
        guid: guid,
        stringId: 31,
      });
    } else if (
      vehicleData &&
      isPosInRadius(
        server._interactionDistance,
        client.character.state.position,
        vehicleData.npcData.position
      )
    ) {
      if (!client.vehicle.mountedVehicle) {
        server.sendData(client, "Command.InteractionString", {
          guid: guid,
          stringId: 15,
        });
      }
    }
  },

  "Mount.SeatChangeRequest": function (
    server: ZoneServer2016,
    client: Client,
    packet: any
  ) {
    server.changeSeat(client, packet);
  },
  "Construction.PlacementFinalizeRequest": function (
    server: ZoneServer2016,
    client: Client,
    packet: any
  ) {
    server.sendData(client, "Construction.PlacementFinalizeResponse", {
      status: 1,
      unknownString1: "",
    });
  },
  /*
  "Command.ItemDefinitionRequest": function (server: ZoneServer2016, client: Client, packet: any) {
    console.log("ItemDefinitionRequest\n\n\n\n\n\n\n\n\n");
    console.log(packet.data);

    server.sendData(client, "Command.ItemDefinitionReply", {data: {
      ID: 2425,
      unknownArray1: [
        {
          unknownData1: {}
        }
      ]
    }})
  }
  */
};

export default packetHandlers;
