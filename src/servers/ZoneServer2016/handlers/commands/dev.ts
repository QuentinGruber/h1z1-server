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
import { h1z1PacketsType2016 } from "types/packets";
import {
  CharacterManagedObject,
  CharacterSeekTarget
} from "types/zone2016packets";
import { BaseLightweightCharacter } from "../../entities/baselightweightcharacter";
import { Npc } from "../../entities/npc";
import { ZoneClient2016 as Client } from "../../classes/zoneclient";
import { ZoneServer2016 } from "../../zoneserver";
import { Items } from "../../models/enums";
import { LootableConstructionEntity } from "../../entities/lootableconstructionentity";
import { ConstructionChildEntity } from "../../entities/constructionchildentity";
import { ConstructionDoor } from "../../entities/constructiondoor";
import { randomIntFromInterval } from "../../../../utils/utils";
import { Zombie } from "../../entities/zombie";

const debug = require("debug")("zonepacketHandlers");

const dev: any = {
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
    server.addLightweightNpc(client, npc);
    setTimeout(() => {
      server.sendData(client, "ClientPath.Reply", {
        unknownDword2: npc.transientId,
        nodes: [{ node: client.character.state.position }]
      });
    }, 2000);
  },
  zombie: function (
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
  stats: function (
    server: ZoneServer2016,
    client: Client,
    args: Array<string>
  ) {
    server.logStats();
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
    const models = require("../../../../data/2016/dataSources/Models.json");
    const wordFilter = args[1];
    if (wordFilter) {
      const result = models.filter(
        (word: any) =>
          word?.MODEL_FILE_NAME?.toLowerCase().includes(
            wordFilter.toLowerCase()
          )
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
    if (!args[3]) {
      server.sendChatText(
        client,
        "Missing resourceId, resourceType, and value args"
      );
      return;
    }
    const resourceEvent = {
      eventData: {
        type: 2,
        value: {
          characterId: client.character.characterId,
          resourceData: {
            resourceId: Number(args[1]),
            resourceType: Number(args[2]),
            unknownArray1: [],
            value: Number(args[3]),
            unknownArray2: []
          }
        }
      }
    };
    server.sendChatText(client, "Setting character resource");
    server.sendData(client, "ResourceEvent", resourceEvent);
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
  shutdown: function (
    server: ZoneServer2016,
    client: Client,
    args: Array<string>
  ) {
    server.sendData(client, "WorldShutdownNotice", {
      timeLeft: 0,
      message: " "
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
  proximateitems: function (
    server: ZoneServer2016,
    client: Client,
    args: Array<string>
  ) {
    const item: any = server.generateItem(2425)?.itemGuid,
      guid1 = server.generateGuid(),
      guid2 = server.generateGuid(),
      guid3 = server.generateGuid();
    console.log(
      `item: ${item}, guid1: ${guid1}, guid2: ${guid2}, guid3: ${guid3}`
    );
    server.sendData(client, "ClientUpdate.ProximateItems", {
      items: [
        {
          //itemDefinitionId: server._items[item].itemDefinitionId,
          itemData: {
            //itemDefinitionId: server._items[item].itemDefinitionId,
            tintId: 43,
            guid: item,
            count: 44,
            itemSubData: {
              unknownBoolean1: false /*
                unknownDword1: 1,
                unknownData1: {
                  unknownQword1: guid4,
                  unknownDword1: 99,
                  unknownDword2: 101,
                }*/
            },
            containerGuid: guid1,
            containerDefinitionId: 45,
            containerSlotId: 46,
            baseDurability: 47,
            currentDurability: 48,
            maxDurabilityFromDefinition: 49,
            unknownBoolean1: true,
            unknownQword3: guid2,
            unknownDword9: 54
          },
          associatedCharacterGuid: guid3
        }
      ]
    });
  },
  /*
    proxiedobjects: function(server: ZoneServer2016, client: Client, args: Array<string>) {

      objects.runtime_object.runtime_objects.forEach((object) => {
        if(object.actor_file === "Common_Props_Dryer.adr") {
          object.instances.forEach((instance) => {
            console.log("proxied object")
            const obj = {
              guid: instance.id,
              transientId: server.getTransientId(client, instance.id),
              unknownByte1: 0,
              position: [instance.position[0], instance.position[1], instance.position[2]],
              rotation: [instance.rotation[1], instance.rotation[0], instance.rotation[2]],
            };
            server.sendData(client, "AddProxiedObject", obj);
          });
          server.sendChatText(client, `Sent ${object.instance_count} ProxiedObject Packets`);
        }
      });
    }
    */
  /*
  //region norman testing
  norman: function (server: ZoneServer2016, client: Client, args: Array<string>) {
    NormanTest.TestEntry(server, client, args);
  },
  //endregion
  */

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
        shaderGroupId: 665 // maybe try setting other character's shaderGroupId on spawn
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

    const bounds = entity.bounds;
    if (!bounds) {
      server.sendChatText(client, "Bounds not defined!");
      return;
    }

    for (const point of bounds) {
      server.constructionManager.placeTemporaryEntity(
        server,
        1,
        new Float32Array([
          point[0],
          client.character.state.position[1],
          point[1]
        ]),
        new Float32Array([0, 0, 0, 1]),
        30000
      );
    }
  }
};
export default dev;
