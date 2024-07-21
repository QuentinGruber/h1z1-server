// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2024 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

/* eslint-disable @typescript-eslint/no-unused-vars */
// TODO enable @typescript-eslint/no-unused-vars
import { h1z1PacketsType2016 } from "types/packets";
import {
  CharacterManagedObject,
  CharacterPlayWorldCompositeEffect,
  CharacterSeekTarget,
  ClientUpdateTextAlert,
  ItemsAddAccountItem
} from "types/zone2016packets";
import { Npc } from "../../entities/npc";
import { ZoneClient2016 as Client } from "../../classes/zoneclient";
import { ZoneServer2016 } from "../../zoneserver";
import { Items, ModelIds, VehicleIds } from "../../models/enums";
import { LootableConstructionEntity } from "../../entities/lootableconstructionentity";
import { ConstructionChildEntity } from "../../entities/constructionchildentity";
import { ConstructionDoor } from "../../entities/constructiondoor";
import {
  getCurrentServerTimeWrapper,
  getDistance,
  movePoint3DByAngles,
  randomIntFromInterval
} from "../../../../utils/utils";
import { Zombie } from "../../entities/zombie";
import { Wolf } from "../../entities/wolf";
import { Bear } from "../../entities/bear";
import { Deer } from "../../entities/deer";
import { WorldObjectManager } from "servers/ZoneServer2016/managers/worldobjectmanager";

const abilities = require("../../../../../data/2016/dataSources/Abilities.json"),
  vehicleAbilities = require("../../../../../data/2016/dataSources/VehicleAbilities.json");

const dev: any = {
  netstats: function (
    server: ZoneServer2016,
    client: Client,
    args: Array<string>
  ) {
    setInterval(async () => {
      const stats = await server._gatewayServer.getSoeClientNetworkStats(
        client.soeClientId
      );
      if (stats) {
        for (let index = 0; index < stats.length; index++) {
          const stat = stats[index];
          server.sendChatText(client, stat, index == 0);
        }
      }
    }, 500);
  },
  sc: function (server: ZoneServer2016, client: Client, args: Array<string>) {
    console.log(WorldObjectManager.itemSpawnersChances);
  },
  lag: function (server: ZoneServer2016, client: Client, args: Array<string>) {
    const startTime = Date.now();
    const interval = setInterval(() => {
      if (Date.now() - startTime > 20000) {
        clearInterval(interval);
      }
      for (let i = 0; i < 1_000_000_000; i++) {
        // do nothing but hold the event loop
        const a = i;
        a;
      }
    }, 0);
  },
  o: function (server: ZoneServer2016, client: Client, args: Array<string>) {
    server.sendOrderedData(client, "ClientUpdate.TextAlert", {
      message: "hello ordered !"
    } as ClientUpdateTextAlert);
  },
  path: function (server: ZoneServer2016, client: Client, args: Array<string>) {
    const characterId = server.generateGuid();
    const npc = new Zombie(
      characterId,
      server.getTransientId(characterId),
      9510,
      client.character.state.position,
      client.character.state.rotation,
      server
    );
    server._npcs[characterId] = npc;
    setTimeout(() => {
      setInterval(() => {
        if (
          getDistance(client.character.state.position, npc.state.position) < 1.5
        ) {
          const angleInRadians2 = Math.atan2(
            client.character.state.position[0] - npc.state.position[0],
            client.character.state.position[2] - npc.state.position[2]
          );
          server.sendData(client, "PlayerUpdatePosition", {
            transientId: npc.transientId,
            positionUpdate: {
              sequenceTime: getCurrentServerTimeWrapper().getTruncatedU32() + 500,
              position: npc.state.position,
              unknown3_int8: 0,
              stance: 66565,
              engineRPM: 2,
              orientation: angleInRadians2,
              frontTilt: 0,
              sideTilt: 0,
              angleChange: 0,
              verticalSpeed: 0,
              horizontalSpeed: 0
            }
          });
          if (!npc.isAttacking) {
            npc.setAttackingState(server);
            server.sendDataToAllWithSpawnedEntity(
              server._npcs,
              npc.characterId,
              "Character.PlayAnimation",
              {
                characterId: npc.characterId,
                animationName: "KnifeSlash"
              }
            );
          }
          return;
        }
        const height1 = Math.abs(npc.state.position[1]);
        const height2 = Math.abs(client.character.state.position[1]);
        const distance = Math.abs(
          getDistance(npc.state.position, client.character.state.position)
        );
        // Calculate the angle in radians
        const angleInRadians = Math.atan2(height2 - height1, distance);
        const angleInRadians2 = Math.atan2(
          client.character.state.position[0] - npc.state.position[0],
          client.character.state.position[2] - npc.state.position[2]
        );
        server.sendData(client, "PlayerUpdatePosition", {
          transientId: npc.transientId,
          positionUpdate: {
            sequenceTime: getCurrentServerTimeWrapper().getTruncatedU32(),
            unknown3_int8: 0,
            stance: 66565,
            engineRPM: 2,
            orientation: angleInRadians2,
            frontTilt: 0,
            sideTilt: 0,
            angleChange: 0,
            verticalSpeed: angleInRadians,
            horizontalSpeed: 4
          }
        });
        movePoint3DByAngles(
          npc.state.position,
          angleInRadians,
          angleInRadians2,
          2
        );
        server.sendData(client, "PlayerUpdatePosition", {
          transientId: npc.transientId,
          positionUpdate: {
            sequenceTime: getCurrentServerTimeWrapper().getTruncatedU32() + 500,
            position: npc.state.position,
            unknown3_int8: 0,
            stance: 66565,
            engineRPM: 2,
            orientation: angleInRadians2,
            frontTilt: 0,
            sideTilt: 0,
            angleChange: 0,
            verticalSpeed: angleInRadians,
            horizontalSpeed: 0
          }
        });
      }, 500);
    }, 3000);
  },
  acc: function (server: ZoneServer2016, client: Client, args: Array<string>) {
    server.sendData<ItemsAddAccountItem>(client, "Items.AddAccountItem", {});
  },
  ui: function (server: ZoneServer2016, client: Client, args: Array<string>) {
    server.sendData(client, "Effect.AddUiIndicator", {
      characterId: client.character.characterId,
      hudElementGuid: server.generateGuid(),
      unknownData1: {
        hudElementId: Number(args[1])
      },
      hudElementData: {
        nameId: Number(args[1]),
        descriptionId: Number(args[2]),
        imageSetId: Number(args[3])
      },
      unknownData3: {},
      unknownData4: {},
      unknownData5: {}
    });
  },
  uioff: function (
    server: ZoneServer2016,
    client: Client,
    args: Array<string>
  ) {
    server.sendData(client, "Effect.RemoveUiIndicators", {
      unknownData1: {
        unknownQword1: client.character.characterId
      },
      unknownData2: {}
    });
  },
  zombie: function (
    server: ZoneServer2016,
    client: Client,
    args: Array<string>
  ) {
    // spawn a zombie
    const characterId = server.generateGuid();
    const transient = server.getTransientId(characterId);
    const zombie = new Zombie(
      characterId,
      transient,
      9510,
      client.character.state.position,
      client.character.state.rotation,
      server
    );
    server._npcs[characterId] = zombie;
  },
  wolf: function (server: ZoneServer2016, client: Client, args: Array<string>) {
    // spawn a zombie
    const characterId = server.generateGuid();
    const transient = server.getTransientId(characterId);
    const wolf = new Wolf(
      characterId,
      transient,
      9003,
      client.character.state.position,
      client.character.state.rotation,
      server
    );
    server._npcs[characterId] = wolf;
  },
  bear: function (server: ZoneServer2016, client: Client, args: Array<string>) {
    // spawn a zombie
    const characterId = server.generateGuid();
    const transient = server.getTransientId(characterId);
    const bear = new Bear(
      characterId,
      transient,
      9187,
      client.character.state.position,
      client.character.state.rotation,
      server
    );
    server._npcs[characterId] = bear;
  },
  deer: function (server: ZoneServer2016, client: Client, args: Array<string>) {
    // spawn a zombie
    const characterId = server.generateGuid();
    const transient = server.getTransientId(characterId);
    const deer = new Deer(
      characterId,
      transient,
      9253,
      client.character.state.position,
      client.character.state.rotation,
      server
    );
    server._npcs[characterId] = deer;
  },
  abilities: function (
    server: ZoneServer2016,
    client: Client,
    args: Array<string>
  ) {
    /*server.sendData(client, "Abilities.ClearAbilityLineManager", {});

    server.sendData(client, "Abilities.SetProfileAbilityLineMembers", {});
    server.sendData(client, "Abilities.SetProfileRankAbilities", {
      abilities: [
        {
          abilityId: 1111157,
          abilityId2: 1111157
        },
        {
          abilityId: 1111272,
          abilityId2: 1111272
        },
        {
          abilityId: 1111278,
          abilityId2: 1111278
        }
      ]
    });

    server.sendData(client, "Abilities.SetProfileRankAbilities", {
      abilities: [
        {
          abilitySlotId: 8,
          abilityData: {
            abilitySlotId: 8,
            abilityId: 1111278,
            guid1: client.character.characterId,
            guid2: client.character.characterId
          }
        }
      ]
    });

      server.sendData(client, "Abilities.AddLoadoutAbility", {
          abilitySlotId: 12,
          abilityId: 1111278,
          unknownDword1: 0,
          guid1: client.character.characterId,
          guid2: client.character.characterId
      });

      server.sendData(client, "Abilities.AddLoadoutAbility", {
          abilitySlotId: 11,
          abilityId: 1111157,
          unknownDword1: 0,
          guid1: client.character.characterId,
          guid2: client.character.characterId
      });

      server.sendData(client, "Abilities.AddPersistentAbility", {
          unk: 1111278
      });*/

    server.sendData(
      client,
      "Abilities.SetActivatableAbilityManager",
      abilities
    );

    server.sendData(
      client,
      "Abilities.SetVehicleActivatableAbilityManager",
      vehicleAbilities
    );
  },
  abilitiesoff: function (
    server: ZoneServer2016,
    client: Client,
    args: Array<string>
  ) {
    server.sendData(client, "Abilities.SetActivatableAbilityManager", {
      abilities: []
    });

    server.sendData(client, "Abilities.SetVehicleActivatableAbilityManager", {
      abilities: []
    });
  },
  animation: function (
    server: ZoneServer2016,
    client: Client,
    args: Array<string>
  ) {
    server.sendDataToAllWithSpawnedEntity(
      server._characters,
      client.character.characterId,
      "AnimationBase",
      {
        characterId: client.character.characterId,
        unknownDword1: args[1]
      }
    );
  },
  deletesmallshacks: function (server: ZoneServer2016, client: Client) {
    let counter = 0;
    for (const a in server._constructionFoundations) {
      const foundation = server._constructionFoundations[a];
      if (foundation.itemDefinitionId == Items.SHACK_SMALL) {
        Object.values(foundation.freeplaceEntities).forEach(
          (
            entity:
              | LootableConstructionEntity
              | ConstructionChildEntity
              | ConstructionDoor
          ) => {
            entity.destroy(server);
          }
        );
        Object.values(foundation.occupiedWallSlots).forEach(
          (entity: ConstructionChildEntity | ConstructionDoor) => {
            entity.destroy(server);
          }
        );
        foundation.destroy(server);
        counter++;
      }
    }
    server.sendChatText(client, `Deleted ${counter} small shacks`);
  },
  zombiemove: function (
    server: ZoneServer2016,
    client: Client,
    args: Array<string>
  ) {
    // spawn a zombie
    const characterId = server.generateGuid();
    const transient = server.getTransientId(characterId);
    const zombie = new Npc(
      characterId,
      transient,
      9510,
      client.character.state.position,
      client.character.state.rotation,
      server
    );
    server._npcs[characterId] = zombie;
    setTimeout(() => {
      server.sendData(client, "Character.ManagedObject", {
        characterId: client.character.characterId,
        objectCharacterId: characterId
      } as CharacterManagedObject);
      server.sendData(client, "Character.SeekTarget", {
        characterId,
        TargetCharacterId: client.character.characterId
      } as CharacterSeekTarget);
    }, 5000);
  },
  spam: function (server: ZoneServer2016, client: Client, args: Array<string>) {
    const spamNb = Number(args[1]) || 1;
    for (let i = 0; i < spamNb; i++) {
      server.sendChatText(client, `spam ${i}`);
    }
  },
  list: function (server: ZoneServer2016, client: Client, args: Array<string>) {
    server.sendChatText(
      client,
      `/dev commands list: \n/dev ${Object.keys(this).join("\n/dev ")}`
    );
  },
  r: function (server: ZoneServer2016, client: Client, args: Array<string>) {
    // quick respawn
    server.respawnPlayer(
      client,
      server._spawnGrid[randomIntFromInterval(0, 99)]
    );
  },
  testpacket: function (
    server: ZoneServer2016,
    client: Client,
    args: Array<string>
  ) {
    const packetName = args[1];
    server.sendData(client, packetName as h1z1PacketsType2016, {});
  },
  findmodel: function (
    server: ZoneServer2016,
    client: Client,
    args: Array<string>
  ) {
    const models = require("../../../../../data/2016/dataSources/Models.json");
    const wordFilter = args[1];
    if (wordFilter) {
      const result = models.filter((word: any) =>
        word?.MODEL_FILE_NAME?.toLowerCase().includes(wordFilter.toLowerCase())
      );
      server.sendChatText(client, `Found models for ${wordFilter}:`);
      for (let index = 0; index < result.length; index++) {
        const element = result[index];
        server.sendChatText(client, `${element.ID} ${element.MODEL_FILE_NAME}`);
      }
    } else {
      server.sendChatText(client, `missing word filter`);
    }
  },
  reloadpackets: function (
    server: ZoneServer2016,
    client: Client,
    args: Array<string>
  ) {
    server.reloadPackets(client);
  },
  systemmessage: function (
    server: ZoneServer2016,
    client: Client,
    args: Array<string>
  ) {
    if (!args[1]) {
      server.sendChatText(client, "Missing 'message' parameter");
      return;
    }
    const msg = {
      unknownDword1: 0,
      message: args[1],
      unknownDword2: 0,
      color: 2
    };
    server.sendChatText(client, "Sending system message");
    server.sendData(client, "ShowSystemMessage", msg);
  },
  setresource: function (
    server: ZoneServer2016,
    client: Client,
    args: Array<string>
  ) {
    if (!args[2]) {
      server.sendChatText(client, "Missing resourceId, and value args");
      return;
    }

    client.character._resources[Number(args[1])] = Number(args[2]);

    server.sendChatText(client, "Setting character resource");
  },
  selectloadout: function (
    server: ZoneServer2016,
    client: Client,
    args: Array<string>
  ) {
    if (!args[1]) {
      server.sendChatText(client, "Missing loadoutSlotId arg");
      return;
    }
    server.sendChatText(client, "Sending selectloadout packet");
    server.sendData(client, "Loadout.SelectLoadout", {
      loadoutId: Number(args[1])
    });
  },
  selectslot: function (
    server: ZoneServer2016,
    client: Client,
    args: Array<string>
  ) {
    if (!args[1]) {
      server.sendChatText(client, "Missing loadoutSlotId arg");
      return;
    }
    server.sendChatText(client, "Sending SelectSlot packet");
    server.sendData(client, "Loadout.SelectSlot", {
      characterId: client.character.characterId,
      loadoutSlotId: Number(args[1])
    });
  },
  createcustomloadout: function (
    server: ZoneServer2016,
    client: Client,
    args: Array<string>
  ) {
    if (!args[2]) {
      server.sendChatText(client, "Missing slotId and loadoutSlotId args");
      return;
    }
    const loadout = {
      slotId: Number(args[1]),
      loadoutSlotId: Number(args[2])
    };
    server.sendChatText(client, "Sending setcurrentloadout packet");
    server.sendData(client, "Loadout.CreateCustomLoadout", loadout);
  },
  setslot: function (
    server: ZoneServer2016,
    client: Client,
    args: Array<string>
  ) {
    if (!args[2]) {
      server.sendChatText(client, "Missing slotId and itemDefinitionId args.");
      return;
    }
    server.sendChatText(client, "Sending selectslot packet");
    server.sendData(client, "Loadout.SetLoadoutSlot", {
      characterId: client.character.characterId,
      loadoutSlot: {
        itemDefinitionId: Number(args[2]),
        slotId: Number(args[1]),
        unknownData1: {
          itemDefinitionId: Number(args[2]),
          loadoutItemGuid: client.character.characterId,
          unknownByte1: 17
        },
        unknownDword1: 16
      },
      unknownDword1: 18
    });
  },
  containererror: function (
    server: ZoneServer2016,
    client: Client,
    args: Array<string>
  ) {
    if (!args[1]) {
      server.sendChatText(client, "Missing containerError arg");
      return;
    }
    const container = {
      characterId: client.character.characterId,
      containerError: parseInt(args[1])
    };

    server.sendData(client, "Container.Error", container);
  },
  setequipment: function (
    server: ZoneServer2016,
    client: Client,
    args: Array<string>
  ) {
    if (!args[5]) {
      server.sendChatText(client, "Missing 5 args");
      return;
    }
    const equipmentEvent = {
      characterData: {
        characterId: client.character.characterId
      },
      equipmentSlot: {
        equipmentSlotId: 3,
        equipmentSlotData: {
          equipmentSlotId: 3,
          guid: "0x1", // needs to be non-zero
          tintAlias: "",
          decalAlias: "#"
        }
      },
      attachmentData: {
        modelName: "Survivor<gender>_Legs_Pants_Warmups.adr",
        unknownDword1: Number(args[1]),
        unknownDword2: Number(args[2]), // 1, 2, 4
        effectId: Number(args[3]), // 0 - 16 // 3 = glow
        slotId: Number(args[4]), // backpack: 10
        unknownDword4: Number(args[5]),
        unknownArray1: []
      }
    };
    server.sendData(
      client,
      "Equipment.SetCharacterEquipmentSlot",
      equipmentEvent
    );
    /*
    const equipment = {
      // not working yet, attachment error (texture related?)
      characterData: {
        characterId: client.character.characterId,
      },
      gameTime: 1,
      slots: [
        {
          index: 1, // needs to be non-zero
          slotId: 3, // needs to be non-zero
        },
      ],
      unknownDword1: 1,
      equipmentSlots: [
        {
          equipmentSlotId: 3,
          equipmentSlotData: {
            equipmentSlotId: 3,
            guid: "0x1", // needs to be non-zero
            tintAlias: "",
            decalAlias: "#",
          },
        },
      ],
      attachmentData: [
        {
          modelName: "SurvivorMale_Chest_Hoodie_Up_Tintable.adr",
          unknownDword1: 1,
          unknownDword2: 1, // 1, 2, 4
          effectId: 6, // 0 - 16
          slotId: 3,
          unknownDword4: 0,
          unknownArray1: [],
        },
      ],
    };
    server.sendChatText(client, "Setting character equipment");
    server.sendData(client, "Equipment.SetCharacterEquipmentSlots", equipment);*/
  },

  tpvehicle: function (
    server: ZoneServer2016,
    client: Client,
    args: Array<string>
  ) {
    if (!args[1]) {
      server.sendChatText(client, "Missing vehicleId arg");
      return;
    }
    const location = {
      position: new Float32Array([0, 80, 0, 1]),
      rotation: [0, 0, 0, 1],
      triggerLoadingScreen: true
    };
    let found = false;
    for (const v in server._vehicles) {
      console.log(server._vehicles[v]);
      if (server._vehicles[v].actorModelId === parseInt(args[1])) {
        location.position = server._vehicles[v].state.position;
        server.sendData(client, "ClientUpdate.UpdateLocation", location);
        found = true;
        break;
      }
    }
    if (found) {
      server.sendChatText(client, "TPed successfully");
    } else {
      server.sendChatText(client, `No vehicles of ID: ${args[1]} found`);
    }
  },

  tpnpc: function (
    server: ZoneServer2016,
    client: Client,
    args: Array<string>
  ) {
    if (!args[1]) {
      server.sendChatText(client, "Missing npc modelId arg");
      return;
    }
    const location = {
      position: new Float32Array([0, 80, 0, 1]),
      rotation: new Float32Array([0, 0, 0, 1]),
      triggerLoadingScreen: true
    };
    let found = false;
    for (const n in server._npcs) {
      if (server._npcs[n].actorModelId === parseInt(args[1])) {
        console.log(server._npcs[n]);
        location.position = server._npcs[n].state.position;
        server.sendData(client, "ClientUpdate.UpdateLocation", location);
        found = true;
        break;
      }
    }
    if (found) {
      server.sendChatText(client, "TPed successfully");
    } else {
      server.sendChatText(client, `No npcs of ID: ${args[1]} found`);
    }
  },
  stat: function (server: ZoneServer2016, client: Client, args: Array<string>) {
    if (!args[3]) {
      server.sendChatText(client, "missing statId, baseValue, modifierValue");
      return;
    }

    server.sendData(client, "ClientUpdate.UpdateStat", {
      statId: Number(args[1]),
      statValue: {
        type: 0,
        value: {
          baseValue: Number(args[2]),
          modifierValue: Number(args[3])
        }
      }
    });
  },
  listcontainers: function (
    server: ZoneServer2016,
    client: Client,
    args: Array<string>
  ) {
    server.sendData(client, "Container.ListAll", {
      characterId: client.character.characterId,
      containers: client.character.pGetContainers(server)
    });
  },
  fte: function (server: ZoneServer2016, client: Client, args: Array<string>) {
    if (!args[3]) {
      server.sendChatText(client, "Missing 3 args");
      return;
    }
    server.sendData(client, "FirstTimeEvent.State", {
      unknownDword1: Number(args[1]),
      unknownDword2: Number(args[2]),
      unknownBoolean1: Boolean(args[3])
    });
  },
  poi: function (server: ZoneServer2016, client: Client, args: Array<string>) {
    server.sendData(client, "POIChangeMessage", {
      messageStringId: Number(args[1]) || 0,
      id: Number(args[1]) || 0
    });
  },

  vehicleaccess: function (
    server: ZoneServer2016,
    client: Client,
    args: Array<string>
  ) {
    const characterId = client.vehicle.mountedVehicle,
      vehicle = server._vehicles[characterId || ""],
      container = vehicle?.getContainer();
    if (!container) {
      server.sendChatText(client, "No container!");
      return;
    }

    server.initializeContainerList(client, vehicle);

    vehicle.updateLoadout(server);

    server.sendData(client, "AccessedCharacter.BeginCharacterAccess", {
      objectCharacterId: characterId,
      mutatorCharacterId: client.character.characterId,
      dontOpenInventory: true,
      itemsData: {
        items: Object.values(container.items).map((item) => {
          return vehicle.pGetItemData(
            server,
            item,
            container.containerDefinitionId
          );
        }),
        unknownDword1: 92 // idk
      }
    });

    Object.values(vehicle._loadout).forEach((item) => {
      server.sendData(client, "ClientUpdate.ItemAdd", {
        characterId: characterId,
        data: {
          ...vehicle.pGetItemData(server, item, 101)
        }
      });
    });

    Object.values(container.items).forEach((item) => {
      server.sendData(client, "ClientUpdate.ItemAdd", {
        characterId: characterId,
        data: vehicle.pGetItemData(
          server,
          item,
          container.containerDefinitionId
        )
      });
    });
  },

  stop: function (server: ZoneServer2016, client: Client, args: Array<string>) {
    server.sendData(client, "PlayerStop", {
      transientId: client.character.transientId,
      state: true
    });
  },

  group: function (
    server: ZoneServer2016,
    client: Client,
    args: Array<string>
  ) {
    server.sendData(client, "Group.Invite", {
      unknownDword1: Number(args[1]),
      unknownDword2: Number(args[2]),
      unknownDword3: Number(args[3]),
      inviteData: {
        sourceCharacter: {
          characterId: client.character.characterId,
          identity: {
            characterFirstName: client.character.name
          }
        },
        targetCharacter: {
          characterId: client.character.characterId,
          identity: {
            characterFirstName: client.character.name
          }
        }
      }
    });
  },

  spectateflag: function (
    server: ZoneServer2016,
    client: Client,
    args: Array<string>
  ) {
    switch (Number(args[1])) {
      case 1:
        server.sendData(client, "Spectator.SetUnknownFlag1", {});
        break;
      case 2:
        server.sendData(client, "Spectator.SetUnknownFlag2", {});
        break;
      default:
        server.sendChatText(client, "Unknown spectator flag");
        break;
    }
  },

  vehicledecay: function (
    server: ZoneServer2016,
    client: Client,
    args: Array<string>
  ) {
    server.sendChatText(client, "Decaying all vehicles");
    server.decayManager.vehicleDecayDamage(server);
  },

  basedecay: function (
    server: ZoneServer2016,
    client: Client,
    args: Array<string>
  ) {
    server.sendChatText(client, "Decaying all bases");
    server.decayManager.contructionDecayDamage(server);
  },

  script: function (
    server: ZoneServer2016,
    client: Client,
    args: Array<string>
  ) {
    server.sendData(client, "Ui.ExecuteScript", {
      unknownString1: args[1],
      unknownArray1: []
    });
  },

  print: function (
    server: ZoneServer2016,
    client: Client,
    args: Array<string>
  ) {
    server.sendData(client, "H1emu.PrintToConsole", {
      message: args.slice(1).join(" ")
    });
  },

  messagebox: function (
    server: ZoneServer2016,
    client: Client,
    args: Array<string>
  ) {
    server.sendData(client, "H1emu.MessageBox", {
      title: "TITLE",
      message: "MESSAGE"
    });
  },
  groupjoin: function (
    server: ZoneServer2016,
    client: Client,
    args: Array<string>
  ) {
    server.sendData(client, "Group.Join", {
      unknownDword1: Number(args[0]),
      unknownDword2: Number(args[1]),
      unknownDword3: Number(args[2]),
      unknownDword4: Number(args[3]),
      inviteData: {
        sourceCharacter: {
          characterId: client.character.characterId,
          identity: {
            characterFirstName: client.character.name
          }
        },
        targetCharacter: {
          characterId: client.character.characterId,
          identity: {
            characterFirstName: client.character.name
          }
        }
      }
    });
  },

  shader: function (
    server: ZoneServer2016,
    client: Client,
    args: Array<string>
  ) {
    if (!args[3]) {
      server.sendChatText(client, "Missing 3 args");
      return;
    }
    Object.values(server._clients).forEach((c) => {
      server.sendData(client, "ShaderParameterOverrideBase", {
        characterId: c.character.characterId,
        unknownDword1: Number(args[1]),
        slotId: Number(args[2]),
        unknownDword2: Number(args[3]),
        shaderGroupId: 588 // maybe try setting other character's shaderGroupId on spawn
      });
    });
  },
  reloadplugins: async function (
    server: ZoneServer2016,
    client: Client,
    args: Array<string>
  ) {
    // THIS IS CURRENTLY UNSAFE AND WILL RESULT IN THE SAME HOOK BEING CALLED MULTIPLE TIMES!

    server.sendChatText(client, "Reloading plugins...");
    await server.pluginManager.initializePlugins(server);
    server.sendChatText(client, `Loaded ${server.pluginManager.pluginCount}`);
  },

  bounds: function (
    server: ZoneServer2016,
    client: Client,
    args: Array<string>
  ) {
    const entityId = client.character.currentInteractionGuid,
      entity = server.getEntity(entityId || "");
    if (!entity || !(entity instanceof ConstructionChildEntity)) {
      server.sendChatText(client, "Invalid entity!");
      return;
    }

    const cubebounds = entity.cubebounds;
    if (!cubebounds) {
      server.sendChatText(client, "Bounds not defined!");
      return;
    }

    for (const point of cubebounds) {
      server.constructionManager.placeTemporaryEntity(
        server,
        1,
        new Float32Array(point),
        new Float32Array([0, 0, 0, 1]),
        30000
      );
    }

    server.sendChatText(client, "Displaying 3d bounds");
  },

  boundson: function (
    server: ZoneServer2016,
    client: Client,
    args: Array<string>
  ) {
    const entityId = client.character.currentInteractionGuid,
      entity = server.getEntity(entityId || "");
    if (!entity || !(entity instanceof ConstructionChildEntity)) {
      server.sendChatText(client, "Invalid entity!");
      return;
    }

    const boundsOn = entity.boundsOn;
    if (!boundsOn) {
      server.sendChatText(client, "BoundsOn not defined!");
      return;
    }

    for (const point of boundsOn) {
      server.constructionManager.placeTemporaryEntity(
        server,
        1,
        new Float32Array(point),
        new Float32Array([0, 0, 0, 1]),
        30000
      );
    }
    server.sendChatText(client, "Displaying 3d bounds");
  },

  getparent: function (
    server: ZoneServer2016,
    client: Client,
    args: Array<string>
  ) {
    const entityId = client.character.currentInteractionGuid,
      entity = server.getEntity(entityId || "");
    if (
      !entity ||
      (!(entity instanceof ConstructionChildEntity) &&
        !(entity instanceof LootableConstructionEntity))
    ) {
      server.sendChatText(client, "Invalid entity!");
      return;
    }

    const parent = entity.getParent(server);
    if (!parent) {
      server.sendChatText(
        client,
        `No parent found for ${entity.itemDefinitionId}`
      );
      return;
    }

    server.sendChatText(
      client,
      `Parent itemDefinitionId: ${parent.itemDefinitionId} characterId: ${parent.characterId}`
    );
  },
  hashes: function (
    server: ZoneServer2016,
    client: Client,
    args: Array<string>
  ) {
    server.sendData(client, "H1emu.RequestAssetHashes", {});
    server.sendChatText(client, "Requested asset hashes from client");
  },
  compositeeffect: function (
    server: ZoneServer2016,
    client: Client,
    args: Array<string>
  ) {
    if (!args[2]) {
      server.sendChatText(client, "Missing effectId and time");
      return;
    }

    const effectId = Number(args[1]),
      time = Number(args[2]);
    server.sendDataToAllInRange<CharacterPlayWorldCompositeEffect>(
      100,
      client.character.state.position,
      "Character.PlayWorldCompositeEffect",
      {
        characterId: client.character.characterId,
        effectId: effectId,
        position: client.character.state.position,
        effectTime: time
      }
    );
    server.sendChatText(client, "Sent composite effect");
  },
  sleep: function (
    server: ZoneServer2016,
    client: Client,
    args: Array<string>
  ) {
    server.sleep(client);
  }
  /*
  shutdown: function (
    server: ZoneServer2016,
    client: Client,
    args: Array<string>
  ) {
    server.isRebooting = true;
    server.shutdown(300, "test")
  }
  */
};
export default dev;
