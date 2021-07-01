// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (c) 2021 Quentin Gruber
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

const Jenkins = require("hash-jenkins");
import hax from "./commands/hax";
import dev from "./commands/dev";
// import admin from "./commands/admin";

import { Int64String, isPosInRadius } from "../../utils/utils";

// TOOD: UPDATE THIS FOR 2016
// const modelToName = require("../../../data/2015/sampleData/ModelToName.json");

const _ = require("lodash");
const debug = require("debug")("zonepacketHandlers");

const packetHandlers = {
  ClientIsReady: function (server, client, packet) {
    server.sendData(client, "ClientBeginZoning", {}); // Needed for trees

    server.sendData(client, "QuickChat.SendData", { commands: [] });

    server.sendData(client, "ClientUpdate.DoneSendingPreloadCharacters", {
      done: true,
    }); // Required for WaitForWorldReady

    server.sendData(client, "ClientUpdate.NetworkProximityUpdatesComplete", {
      done: true,
    }); // Required for WaitForWorldReady
    server.sendData(client, "ClientUpdate.UpdateStat", { stats: [] });

    //server.sendData(client, "Operation.ClientClearMissions", {});

    server.sendData(client, "ZoneSetting.Data", {
      settings: [
        {
          hash: Jenkins.oaat("zonesetting.deploy.on.login".toUpperCase()),
          value: 1,
          settingType: 2,
          unknown1: 0,
          unknown2: 0,
        },
        {
          hash: Jenkins.oaat("zonesetting.no.acquisition.timers".toUpperCase()),
          value: 1,
          settingType: 2,
          unknown1: 0,
          unknown2: 0,
        },
        {
          hash: Jenkins.oaat("zonesetting.XpMultiplier".toUpperCase()),
          value: 1,
          settingType: 1,
          unknown1: 0,
          unknown2: 0,
        },
        {
          hash: Jenkins.oaat("zonesetting.disabletrialitems".toUpperCase()),
          value: 1,
          settingType: 2,
          unknown1: 0,
          unknown2: 0,
        },
        {
          hash: Jenkins.oaat("zonesetting.isvrzone".toUpperCase()),
          value: 0,
          settingType: 2,
          unknown1: 0,
          unknown2: 0,
        },
        {
          hash: Jenkins.oaat("zonesetting.no.resource.costs".toUpperCase()),
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
      gameTime: (server.getServerTime() & 0xffffffff) >>> 0,
    });
    server.sendGameTimeSync(client);

    client.character.currentLoadoutId = 3;
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
    /*
    // temp workaround
    server.sendData(client, "ClientUpdate.ModifyMovementSpeed", {
      speed: 11.0,
    });
    */
    server.sendData(client, "ResourceEvent", {
      eventData: {
        type: 2,
        value: {
          characterId: client.character.characterId,
          resourceId: 1,// health
          resourceType: 1,
          unknownArray1:[],
          value: 5000, // 10000 max
          unknownArray2: [],
        },
      },
    });
    server.sendData(client, "ResourceEvent", {
      eventData: {
        type: 2,
        value: {
          characterId: client.character.characterId,
          resourceId: 6, // stamina
          resourceType: 6,
          unknownArray1:[],
          value: 600, // 600 max
          unknownArray2: [],
        },
      },
    });
    server.sendData(client, "ResourceEvent", {
      eventData: {
        type: 2,
        value: {
          characterId: client.character.characterId,
          resourceId: 4, // food
          resourceType: 4,
          unknownArray1:[],
          value: 5000, // 10000 max
          unknownArray2: [],
        },
      },
    });
    server.sendData(client, "ResourceEvent", {
      eventData: {
        type: 2,
        value: {
          characterId: client.character.characterId,
          resourceId: 5, // water
          resourceType: 5,
          unknownArray1:[],
          value: 5000, // 10000 max
          unknownArray2: [],
        }
      }
    });
    server.sendData(client, "ResourceEvent", {
      eventData: {
        type: 2,
        value: {
          characterId: client.character.characterId,
          resourceId: 68, // comfort
          resourceType: 68,
          unknownArray1:[],
          value: 5000, // 5000 max
          unknownArray2: [],
        }
      }
    });
    server.sendData(client, "ResourceEvent", {
      eventData: {
        type: 2,
        value: {
          characterId: client.character.characterId,
          resourceId: 12, // h1z1 virus
          resourceType: 12,
          unknownArray1:[],
          value: 10000, // 10000 max
          unknownArray2: [],
        },
      },
    });
    const equipmentSlot = {
      characterData: {
        characterId: client.character.characterId
      },
      equipmentTexture: {
        index: 1, // needs to be non-zero
        slotId: 1, // needs to be non-zero
        unknownQword1: "0x1", // needs to be non-zero
        textureAlias: "",
        unknownString1: ""
      },
      equipmentModel: {
        model: "SurvivorMale_Hair_ShortMessy.adr",
        effectId: 0,
        equipmentSlotId: 27,
        unknownArray1: []
      }
    };
    server.sendData(client, "Equipment.SetCharacterEquipmentSlot", equipmentSlot);
  },
  ClientFinishedLoading: function (server, client, packet) {
    client.currentPOI = 0; // clears currentPOI for POIManager
    server.sendData(client, "POIChangeMessage", {
      messageStringId: 20,
      id: 99,
    });
    server.sendChatText(client, "Welcome to H1emu ! :D", true);
    client.lastPingTime = new Date().getTime();
    client.savePositionTimer = setTimeout(
      () => server.saveCharacterPosition(client, 30000),
      30000
    );
    server._characters[client.character.characterId] = {
      ...client.character,
      identity: {},
    };
    server.executeFuncForAllClients("spawnCharacters");
    client.isLoading = false;
    client.isMounted = false;

    setInterval(function () {
      server.worldRoutine(client);
    }, 3000);
  },
  Security: function (server, client, packet) {
    debug(packet);
  },
  "Command.RecipeStart": function (server, client, packet) {
    debug(packet);
    server.sendData(client, "Command.RecipeAction", {});
  },
  "Command.FreeInteractionNpc": function (server, client, packet) {
    debug("FreeInteractionNpc");
    server.sendData(client, "Command.FreeInteractionNpc", {});
  },
  "Collision.Damage": function (server, client, packet) {
    debug("Collision.Damage");
    debug(packet);
  },
  "LobbyGameDefinition.DefinitionsRequest": function (server, client, packet) {
    server.sendData(client, "LobbyGameDefinition.DefinitionsResponse", {
      definitionsData: { data: "" },
    });
  },
  "PlayerUpdate.EndCharacterAccess": function (server, client, packet) {
    debug("EndCharacterAccess");
  },
  KeepAlive: function (server, client, packet) {
    client.lastPingTime = new Date().getTime();
    server.sendData(client, "KeepAlive", {
      gameTime: packet.data.gameTime,
    });
  },
  ClientLog: function (server, client, packet) {
    debug(packet);
  },
  "WallOfData.UIEvent": function (server, client, packet) {
    debug("UIEvent");
  },
  SetLocale: function (server, client, packet) {
    debug("Do nothing");
  },
  GetContinentBattleInfo: function (server, client, packet) {
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
  "Chat.Chat": function (server, client, packet) {
    const { channel, message } = packet.data;
    server.sendChat(client, message, channel);
  },
  /*
  "Loadout.SelectSlot": function (server, client, packet) {
    
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
  ClientInitializationDetails: function (server, client, packet) {
    // just in case
    if (packet.data.unknownDword1) {
      debug("ClientInitializationDetails : ", packet.data.unknownDword1);
    }
  },
  ClientLogout: function (server, client, packet) {
    debug("ClientLogout");
    server.saveCharacterPosition(client);
    server.deleteEntity(client.character.characterId, server._characters);
    server._gatewayServer._soeServer.deleteClient(client);
    delete server._characters[client.character.characterId];
    delete server._clients[client.sessionId];
  },
  GameTimeSync: function (server, client, packet) {
    server.sendGameTimeSync(client);
  },
  Synchronization: function (server, client, packet) {
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
  "Command.ExecuteCommand": async function (server, client, packet) {
    const args = packet.data.arguments.split(" ");

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
      case Jenkins.oaat("HELP"):
      case 3575372649: // /help
        const haxCommandList = [];
        Object.keys(hax).forEach((key) => {
          haxCommandList.push(`/hax ${key}`);
        });
        const devCommandList = [];
        Object.keys(dev).forEach((key) => {
          devCommandList.push(`/dev ${key}`);
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
        _.concat(commandList, haxCommandList, devCommandList)
          .sort((a, b) => a.localeCompare(b))
          .forEach((command) => {
            server.sendChatText(client, `${command}`);
          });
        break;
      case Jenkins.oaat("LOCATION"):
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
      case Jenkins.oaat("HAX"):
        hax[args[0]]
          ? hax[args[0]](server, client, args)
          : server.sendChatText(client, `Unknown command: /hax ${args[0]}`);
        break;
      case Jenkins.oaat("DEV"):
      case 552078457: // dev
        dev[args[0]]
          ? dev[args[0]](server, client, args)
          : server.sendChatText(client, `Unknown command: /dev ${args[0]}`);
        break;
    }
  },
  /*
  "Command.SetProfile": function (server, client, packet) {
    server.sendData(client, "Loadout.SetCurrentLoadout", {
      type: 2,
      unknown1: 0,
      loadoutId: 15,
      tabId: 256,
      unknown2: 1,
    });
  },
  */
  "Command.InteractRequest": function (server, client, packet) {
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
  "Command.InteractionSelect": function (server, client, packet) {
    server.sendData(client, "Loadout.SetLoadouts", {
      type: 2,
      guid: packet.data.guid,
      unknownDword1: 1,
    });
  },
  */
  /*
  "Vehicle.Spawn": function (server, client, packet) {
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
    const position = [
      client.character.state.position[0],
      client.character.state.position[1] + 10,
      client.character.state.position[2],
    ];
    const rotation = [-1.570796012878418, 0, 0, 0];
    server.sendData(client, "AddLightweightVehicle", {
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
  },
  "Vehicle.AutoMount": function (server, client, packet) {
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
      objectCharacterId: packet.data.guid,
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
  },
  */
  "Command.InteractCancel": function (server, client, packet) {
    debug("Interaction Canceled");
  },
  "Command.StartLogoutRequest": function (server, client, packet) {
    const logoutTime = 10000;
    server.sendData(client, "ClientUpdate.StartTimer", {
      stringId: 0,
      time: logoutTime,
    });
    client.posAtLogoutStart = client.character.state.position;
    if (client.logoutTimer != null) {
      clearTimeout(client.logoutTimer);
    }
    client.logoutTimer = setTimeout(() => {
      server.sendData(client, "ClientUpdate.CompleteLogoutProcess", {});
    }, logoutTime);
  },
  CharacterSelectSessionRequest: function (server, client, packet) {
    server.sendData(client, "CharacterSelectSessionResponse", {
      status: 1,
      sessionId: client.loginSessionId,
    });
  },
  "ProfileStats.GetPlayerProfileStats": function (server, client, packet) {
    server.sendData(
      client,
      "ProfileStats.PlayerProfileStats",
      require("../../../data/profilestats.json")
    );
  },
  Pickup: function (server, client, packet) {
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
    // deprecated ?
    /*
    server.sendData(client, "PlayerUpdate.StartHarvest", {
      characterId: client.character.characterId,
      unknown4: 0,
      timeMs: 10,
      unknown6: 0,
      stringId: 10002,
      unknownGuid: Int64String(packetData.id),
    });
    */
  },
  GetRewardBuffInfo: function (server, client, packet) {
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
  PlayerUpdateUpdatePositionClientToZone: function (server, client, packet) {
    if (packet.data.position) {
      // TODO: modify array element beside re-creating it
      client.character.state.position = new Float32Array([
        packet.data.position[0],
        packet.data.position[1],
        packet.data.position[2],
        0,
      ]);

      if (
        client.logoutTimer != null &&
        !isPosInRadius(
          1,
          client.character.state.position,
          client.posAtLogoutStart
        )
      ) {
        clearTimeout(client.logoutTimer);
        client.logoutTimer = null;
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
        server.worldRoutine(client);
      }
      // todo
      /*
      const movingCharacter = server._characters[client.character.characterId];
      console.log(movingCharacter)

      server.sendDataToAllOthers(client,"PlayerUpdate.UpdatePosition",{transientId:movingCharacter.transientId,positionUpdate:server.createPositionUpdate(client.character.state.position,[0,0,0,0])})
      */
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
  "PlayerUpdate.Respawn": function (server, client, packet) {
    debug(packet);
    server.sendData(client, "PlayerUpdate.RespawnReply", {
      characterId: client.character.characterId,
      position: [0, 200, 0, 1],
    });
  },
  "PlayerUpdate.FullCharacterDataRequest": function (server, client, packet) {
    const {
      data: { guid },
    } = packet;
    const npc =
      server._npcs[guid] || server._objects[guid] || server._doors[guid];
    if (npc) {
      server.sendData(client, "LightweightToFullNpc", {
        transientId: npc.transientId,
        attachments: [],
        effectTags: [],
        unknownData1: {},
        targetData: {},
        characterVariables: [],
        unknownData2: {},
        resources: [],
        unknownData3: {},
      });
    } else if (server._characters[guid]) {
      server.sendData(client, "LightweightToFullPc", {
        fullPcSubDataSchema1: {
          transientIdMaybe: server._characters[guid].transientId,
        },
        array1: [],
        unknownData1: {
          transientId: server._characters[guid].transientId,
          unknownData1: {},
          array1: [],
          array2: [],
        },
      });
    } else if (server._vehicles[guid]) {
      server.sendData(client, "LightweightToFullVehicle", {
        npcData: {
          transientId: server._vehicles[guid].npcData.transientId,
          attachments: [],
          effectTags: [],
          unknownData1: {},
          targetData: {},
          characterVariables: [],
          unknownData2: {},
          resources: [],
          unknownData3: {},
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

  "Command.PlayerSelect": function (server, client, packet) {
    if (server._vehicles[packet.data.guid]) {
      // checking if vehicle
      server.sendData(client, "Mount.MountResponse", {
        // mounts character
        characterId: client.character.characterId,
        guid: packet.data.guid, // vehicle guid
        identity: {},
      });
      server.sendData(client, "Vehicle.Engine", {
        // starts engine
        guid2: packet.data.guid,
        unknownBoolean: true,
      });
      client.isMounted = true;
    }
  },

  "Mount.DismountRequest": function (server, client, packet) {
    debug(packet.data);
    server.sendData(client, "Mount.DismountResponse", {
      // dismounts character
      characterId: client.character.characterId,
    });
    client.isMounted = false;
  },
  "Command.InteractionString": function (server, client, packet) {
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
      /*
      server.sendData(client, "Command.InteractionString", {
        guid: guid,
        stringId: 29,
      });
      */
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
      if (!client.isMounted) {
        server.sendData(client, "Command.InteractionString", {
          guid: guid,
          stringId: 15,
        });
      }
    }
  },

  /*
  "Command.ItemDefinitionRequest": function (server, client, packet) {
    console.log("ItemDefinitionRequest\n\n\n\n\n\n\n\n\n");
    console.log(packet.data);

    server.sendData(client, "Command.ItemDefinitionReply", {data: {
      ID: 2425,
      unknownArray1Length: 1,
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
