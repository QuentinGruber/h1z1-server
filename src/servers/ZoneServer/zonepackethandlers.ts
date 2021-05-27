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
delete require.cache[require.resolve("./commands/hax")];
delete require.cache[require.resolve("./commands/dev")];

const Jenkins = require("hash-jenkins");
import hax from "./commands/hax";
import dev from "./commands/dev";
import admin from "./commands/admin";
import { Int64String } from "../../utils/utils";
import { ZoneServer } from "./zoneserver";
import { Client } from "types/zoneserver";

const _ = require("lodash");
const debug = require("debug")("zonepacketHandlers");

const packetHandlers: any = {
  ClientIsReady: function (server: ZoneServer, client: Client, packet: any) {
    /* still disable
        server.sendData(client, "ClientBeginZoning", {
          position: client.character.state.position,
          rotation: client.character.state.rotation,
          skyData: server._weather,
        });
        */
    server.sendData(client, "QuickChat.SendData", { commands: [] });

    server.sendData(client, "ClientUpdate.DoneSendingPreloadCharacters", {
      unknownBoolean1: 1,
    });

    server.sendData(client, "ClientUpdate.UpdateStat", { stats: [] });

    server.sendData(client, "Operation.ClientClearMissions", {});

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
    server.sendData(client, "Loadout.SetCurrentLoadout", {
      guid: client.character.guid,
      loadoutId: client.character.currentLoadoutId,
    });

    server.sendData(client, "ZoneDoneSendingInitialData", {});

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
    server: ZoneServer,
    client: Client,
    packet: any
  ) {
    server.sendChatText(client, "Welcome to H1emu ! :D", true);
    client.lastPingTime = new Date().getTime();
    client.savePositionTimer = setTimeout(
      () => server.saveCharacterPosition(client, 30000),
      30000
    );
    server.spawnNpcs(client);
    server.spawnObjects(client);
  },
  Security: function (server: ZoneServer, client: Client, packet: any) {
    debug(packet);
  },
  "Command.RecipeStart": function (
    server: ZoneServer,
    client: Client,
    packet: any
  ) {
    debug(packet);
    server.sendData(client, "Command.RecipeAction", {});
  },
  "Command.FreeInteractionNpc": function (
    server: ZoneServer,
    client: Client,
    packet: any
  ) {
    debug("FreeInteractionNpc");
    server.sendData(client, "Command.FreeInteractionNpc", {});
  },
  "Collision.Damage": function (
    server: ZoneServer,
    client: Client,
    packet: any
  ) {
    debug("Collision.Damage");
    debug(packet);
  },
  "LobbyGameDefinition.DefinitionsRequest": function (
    server: ZoneServer,
    client: Client,
    packet: any
  ) {
    server.sendData(client, "LobbyGameDefinition.DefinitionsResponse", {
      definitionsData: { data: "" },
    });
  },
  "PlayerUpdate.EndCharacterAccess": function (
    server: ZoneServer,
    client: Client,
    packet: any
  ) {
    debug("EndCharacterAccess");
  },
  KeepAlive: function (server: ZoneServer, client: Client, packet: any) {
    client.lastPingTime = new Date().getTime();
    server.sendData(client, "KeepAlive", {
      gameTime: packet.data.gameTime,
    });
  },
  "AdminCommand.RunSpeed": function (
    server: ZoneServer,
    client: Client,
    packet: any
  ) {
    server.sendData(client, "AdminCommand.RunSpeed", {
      runSpeed: packet.data.runSpeed,
    });
  },
  ClientLog: function (server: ZoneServer, client: Client, packet: any) {
    debug(packet);
  },
  "WallOfData.UIEvent": function (
    server: ZoneServer,
    client: Client,
    packet: any
  ) {
    debug("UIEvent");
  },
  SetLocale: function (server: ZoneServer, client: Client, packet: any) {
    debug("Do nothing");
  },
  GetContinentBattleInfo: function (
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
  },
  "Chat.Chat": function (server: ZoneServer, client: Client, packet: any) {
    const { channel, message } = packet.data;
    server.sendChat(client, message, channel);
  },
  "Loadout.SelectSlot": function (
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
  },
  ClientInitializationDetails: function (
    server: ZoneServer,
    client: Client,
    packet: any
  ) {
    // just in case
    if (packet.data.unknownDword1) {
      debug("ClientInitializationDetails : ", packet.data.unknownDword1);
    }
  },
  ClientLogout: function (server: ZoneServer, client: Client, packet: any) {
    debug("ClientLogout");
    server.saveCharacterPosition(client);
    server._gatewayServer._soeServer.deleteClient(client);
    delete server._clients[client.sessionId];
  },
  GameTimeSync: function (server: ZoneServer, client: Client, packet: any) {
    // TODO: execute worldRoutine only when like 2/3 of the radius distance has been travelled by the player no matter on X or Z axis
    // this is a temp workaround
    server.worldRoutine(client);
    server.sendGameTimeSync(client);
  },
  Synchronization: function (server: ZoneServer, client: Client, packet: any) {
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
    server: ZoneServer,
    client: Client,
    packet: any
  ) {
    const args: any[] = packet.data.arguments.split(" ");

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
            _objects: objects,
          } = server;
          const serverVersion = require("../../../package.json").version;
          server.sendChatText(client, `h1z1-server V${serverVersion}`, true);
          server.sendChatText(client, `Connected clients : ${_.size(clients)}`);
          server.sendChatText(client, `characters : ${_.size(characters)}`);
          server.sendChatText(client, `npcs : ${_.size(npcs)}`);
          server.sendChatText(client, `objects : ${_.size(objects)}`);

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
        const haxCommandList: string[] = [];
        Object.keys(hax).forEach((key) => {
          haxCommandList.push(`/hax ${key}`);
        });
        const devCommandList: string[] = [];
        Object.keys(dev).forEach((key) => {
          devCommandList.push(`/dev ${key}`);
        });
        const adminCommandList: string[] = [];
        Object.keys(admin).forEach((key) => {
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
        _.concat(commandList, haxCommandList, devCommandList, adminCommandList)
          .sort((a: string, b: string) => a.localeCompare(b))
          .forEach((command: string) => {
            server.sendChatText(client, `${command}`);
          });
        break;
      case Jenkins.oaat("LOCATION"):
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
      case Jenkins.oaat("ADMIN"):
      case 997464845: // dev
        admin[args[0]]
          ? admin[args[0]](server, client, args)
          : server.sendChatText(client, `Unknown command: /admin ${args[0]}`);
        break;
    }
  },
  "Command.SetProfile": function (
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
  },
  "Command.InteractRequest": function (
    server: ZoneServer,
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
  "Command.InteractionSelect": function (
    server: ZoneServer,
    client: Client,
    packet: any
  ) {
    server.sendData(client, "Loadout.SetLoadouts", {
      type: 2,
      guid: packet.data.guid,
      unknownDword1: 1,
    });
  },
  "Vehicle.Spawn": function (server: ZoneServer, client: Client, packet: any) {
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
  },
  "Vehicle.AutoMount": function (
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
  },
  "AdminCommand.SpawnVehicle": function (
    server: ZoneServer,
    client: Client,
    packet: any
  ) {
    const guid = server.generateGuid(),
      transientId = server.getTransientId(client, guid);

    server
      .data("vehicles")
      .findOne(
        { id: packet.data.vehicleId },
        function (err: string, vehicle: any) {
          if (err || !vehicle) {
            server.sendChatText(client, "No such vehicle");
            return;
          }
          server
            .data("npc_vehicle_mappings")
            .findOne(
              { vehicle_id: packet.data.vehicleId },
              function (err: string, npcDefinitionMapping: any) {
                if (err || !npcDefinitionMapping) {
                  server.sendChatText(client, "Vehicle has no NPC mapping");
                  return;
                }
                server
                  .data("npcs")
                  .findOne(
                    { id: npcDefinitionMapping.npc_definition_id },
                    function (err: string, npc: any) {
                      if (err || !npc) {
                        server.sendChatText(
                          client,
                          "NPC definition " +
                            npcDefinitionMapping.npc_definition_id +
                            " not found"
                        );
                        return;
                      }
                      const nameId = vehicle.name_id > 0 ? vehicle.name_id : 0,
                        modelId = npc.model_id;
                      const vehicleData = {
                        npcData: {
                          guid: guid,
                          transientId: transientId,
                          unknownString0: "",
                          nameId: nameId,
                          unknownDword2: 0,
                          unknownDword3: 0,
                          unknownByte1: 1,
                          modelId: modelId,
                          scale: [1, 1, 1, 1],
                          unknownString1: "",
                          unknownString2: "",
                          unknownDword5: 0,
                          unknownDword6: 0,
                          position: packet.data.position,
                          unknownVector1: [
                            0, -0.7071066498756409, 0, 0.70710688829422,
                          ],
                          rotation: [packet.data.heading, 0, 0, 0],
                          unknownDword7: 0,
                          unknownFloat1: 3,
                          unknownString3: "",
                          unknownString4: "",
                          unknownString5: "",
                          vehicleId: packet.data.vehicleId,
                          unknownDword9: 0,
                          npcDefinitionId: npc.id,
                          unknownByte2: 2,
                          profileId: npc.profile_id,
                          unknownBoolean1: false,
                          unknownData1: {
                            unknownByte1: 16,
                            unknownByte2: 9,
                            unknownByte3: 0,
                          },
                          unknownByte6: 0,
                          unknownDword11: 0,
                          unknownGuid1: "0x0000000000000000",
                          unknownData2: {
                            unknownGuid1: "0x0000000000000000",
                          },
                          unknownDword12: 2484,
                          unknownDword13: 1528,
                          unknownDword14: 0,
                          unknownByte7: 0,
                          unknownArray1: [],
                        },
                        unknownGuid1: "0x0000000000000000",
                        unknownDword1: 0,
                        unknownDword2: 0,
                        positionUpdate: server.createPositionUpdate(
                          packet.data.position,
                          [packet.data.heading, 0, 0, 0]
                        ),
                        unknownString1: "",
                      };
                      console.log(JSON.stringify(vehicleData, null, 2));

                      server.sendData(
                        client,
                        "PlayerUpdate.AddLightweightVehicle",
                        vehicleData
                      );
                      server.sendData(client, "PlayerUpdate.SetFaction", {
                        guid: guid,
                        factionId:
                          packet.data.factionId || client.character.factionId,
                      });

                      server.sendData(client, "Vehicle.Owner", {
                        guid: guid,
                        characterId: client.character.characterId,
                        unknownDword1: 305,
                        vehicleId: packet.data.vehicleId,
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

                      server.sendData(client, "Vehicle.SetAutoDrive", {
                        guid: guid,
                      });

                      server.sendData(client, "PlayerUpdate.ManagedObject", {
                        guid: guid,
                        guid2: "0x0000000000000000",
                        characterId: client.character.characterId,
                      });
                    }
                  );
              }
            );
        }
      );
  },
  "Command.InteractCancel": function (
    server: ZoneServer,
    client: Client,
    packet: any
  ) {
    debug("Interaction Canceled");
  },
  "Command.StartLogoutRequest": function (
    server: ZoneServer,
    client: Client,
    packet: any
  ) {
    server.sendData(client, "ClientUpdate.CompleteLogoutProcess", {});
  },
  CharacterSelectSessionRequest: function (
    server: ZoneServer,
    client: Client,
    packet: any
  ) {
    server.sendData(client, "CharacterSelectSessionResponse", {
      status: 1,
      sessionId: client.loginSessionId,
    });
  },
  "ProfileStats.GetPlayerProfileStats": function (
    server: ZoneServer,
    client: Client,
    packet: any
  ) {
    server.sendData(
      client,
      "ProfileStats.PlayerProfileStats",
      require("../../../data/sampleData/profilestats.json")
    );
  },
  Pickup: function (server: ZoneServer, client: Client, packet: any) {
    debug(packet);
    const { data: packetData } = packet;
    server.sendData(client, "PlayerUpdate.StartHarvest", {
      characterId: client.character.characterId,
      unknown4: 0,
      timeMs: 10,
      unknown6: 0,
      stringId: 10002,
      unknownGuid: Int64String(packetData.id),
    });
  },
  GetRewardBuffInfo: function (
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
  },
  PlayerUpdateUpdatePositionClientToZone: function (
    server: ZoneServer,
    client: Client,
    packet: any
  ) {
    if (packet.data.position) {
      // TODO: modify array element beside re-creating it
      client.character.state.position = new Float32Array([
        packet.data.position[0],
        packet.data.position[1],
        packet.data.position[2],
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
    }
  },
  "PlayerUpdate.Respawn": function (
    server: ZoneServer,
    client: Client,
    packet: any
  ) {
    debug(packet);
    server.sendData(client, "PlayerUpdate.RespawnReply", {
      characterId: client.character.characterId,
      position: [0, 200, 0, 1],
    });
  },
  "PlayerUpdate.FullCharacterDataRequest": function (
    server: ZoneServer,
    client: Client,
    packet: any
  ) {
    // debug(packet);
    server.sendData(client, "PlayerUpdate.LightweightToFullNpc", {
      characterId: client.character.characterId,
    });
  },
};

export default packetHandlers;
