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

const debugName = "ZoneServer",
  debug = require("debug")(debugName);

process.env.isBin && require("./managers/worlddatamanagerthread");
import { EventEmitter } from "node:events";
import { GatewayServer } from "../GatewayServer/gatewayserver";
import { H1Z1Protocol } from "../../protocols/h1z1protocol";
import SOEClient from "../SoeServer/soeclient";
import { H1emuZoneServer } from "../H1emuServer/h1emuZoneServer";
import { H1emuClient } from "../H1emuServer/shared/h1emuclient";
import { Resolver } from "node:dns";

import { promisify } from "node:util";
import { ZonePacketHandlers } from "./zonepackethandlers";
import { ZoneClient2016 as Client } from "./classes/zoneclient";
import { Vehicle2016 as Vehicle, Vehicle2016 } from "./entities/vehicle";
import { GridCell } from "./classes/gridcell";
import { SpawnCell } from "./classes/spawncell";
import { WorldObjectManager } from "./managers/worldobjectmanager";
import { SmeltingManager } from "./managers/smeltingmanager";
import { DecayManager } from "./managers/decaymanager";
import {
  ContainerErrors,
  EntityTypes,
  EquipSlots,
  Items,
  LoadoutIds,
  LoadoutSlots,
  MovementModifiers,
  ResourceIds,
  ResourceTypes,
  VehicleIds,
  ConstructionPermissionIds,
  ItemUseOptions,
  HealTypes
} from "./models/enums";
import { healthThreadDecorator } from "../shared/workers/healthWorker";
import { WeatherManager } from "./managers/weathermanager";

import {
  ClientBan,
  ConstructionEntity,
  DamageInfo,
  DamageRecord,
  Recipe
} from "../../types/zoneserver";
import { h1z1PacketsType2016 } from "../../types/packets";
import {
  remoteWeaponPacketsType,
  remoteWeaponUpdatePacketsType,
  weaponPacketsType
} from "../../types/weaponPackets";
import { Character2016 as Character } from "./entities/character";
import {
  _,
  generateRandomGuid,
  Int64String,
  isPosInRadius,
  isPosInRadiusWithY,
  getDistance,
  randomIntFromInterval,
  Scheduler,
  generateTransientId,
  getRandomFromArray,
  getRandomKeyFromAnObject,
  toBigHex,
  toHex,
  calculate_falloff,
  checkConstructionInRange,
  resolveHostAddress,
  getDifference,
  logClientActionToMongo,
  removeUntransferableFields,
  movePoint,
  getAngle,
  getDistance2d
} from "../../utils/utils";

import { Db } from "mongodb";
import { BaseFullCharacter } from "./entities/basefullcharacter";
import { ItemObject } from "./entities/itemobject";
import {
  DEFAULT_CRYPTO_KEY,
  EXTERNAL_CONTAINER_GUID,
  LOADOUT_CONTAINER_ID
} from "../../utils/constants";
import { TrapEntity } from "./entities/trapentity";
import { DoorEntity } from "./entities/doorentity";
import { Npc } from "./entities/npc";
import { ExplosiveEntity } from "./entities/explosiveentity";
import { BaseLightweightCharacter } from "./entities/baselightweightcharacter";
import { BaseSimpleNpc } from "./entities/basesimplenpc";
import { TemporaryEntity } from "./entities/temporaryentity";
import { BaseEntity } from "./entities/baseentity";
import { ConstructionDoor } from "./entities/constructiondoor";
import { ConstructionParentEntity } from "./entities/constructionparententity";
import { ConstructionChildEntity } from "./entities/constructionchildentity";
import {
  ConstructionParentSaveData,
  FullCharacterSaveData,
  LootableConstructionSaveData,
  PlantingDiameterSaveData
} from "types/savedata";
import {
  constructContainers,
  constructLoadout,
  FetchedWorldData,
  WorldDataManager
} from "./managers/worlddatamanager";
import { recipes } from "./data/Recipes";
import { UseOptions } from "./data/useoptions";
import {
  DB_COLLECTIONS,
  GAME_VERSIONS,
  LOGIN_KICK_REASON
} from "../../utils/enums";

import {
  ClientUpdateDeathMetrics,
  ClientUpdateProximateItems,
  zone2016packets
} from "types/zone2016packets";
import { getCharacterModelData } from "../shared/functions";
import { HookManager } from "./managers/hookmanager";
import { BaseItem } from "./classes/baseItem";
import { LoadoutItem } from "./classes/loadoutItem";
import { LoadoutContainer } from "./classes/loadoutcontainer";
import { Weapon } from "./classes/weapon";
import { Lootbag } from "./entities/lootbag";
import { BaseLootableEntity } from "./entities/baselootableentity";
import { LootableConstructionEntity } from "./entities/lootableconstructionentity";
import { LootableProp } from "./entities/lootableprop";
import { PlantingDiameter } from "./entities/plantingdiameter";
import { Plant } from "./entities/plant";
import { SmeltingEntity } from "./classes/smeltingentity";
import { spawn, Worker } from "threads";
import { WorldDataManagerThreaded } from "./managers/worlddatamanagerthread";
import { logVersion } from "../../utils/processErrorHandling";
import { TaskProp } from "./entities/taskprop";
import { ChatManager } from "./managers/chatmanager";
import { Crate } from "./entities/crate";
import { ConfigManager } from "./managers/configmanager";
import { RConManager } from "./managers/rconmanager";
import { GroupManager } from "./managers/groupmanager";
import { SpeedTreeManager } from "./managers/speedtreemanager";
import { ConstructionManager } from "./managers/constructionmanager";
import { FairPlayManager } from "./managers/fairplaymanager";
import { PluginManager } from "./managers/pluginmanager";
import { Destroyable } from "./entities/destroyable";
import { Plane } from "./entities/plane";

const spawnLocations2 = require("../../../data/2016/zoneData/Z1_gridSpawns.json"),
  deprecatedDoors = require("../../../data/2016/sampleData/deprecatedDoors.json"),
  itemDefinitions = require("./../../../data/2016/dataSources/ServerItemDefinitions.json"),
  containerDefinitions = require("./../../../data/2016/dataSources/ContainerDefinitions.json"),
  profileDefinitions = require("./../../../data/2016/dataSources/ServerProfileDefinitions.json"),
  projectileDefinitons = require("./../../../data/2016/dataSources/ServerProjectileDefinitions.json"),
  loadoutSlotItemClasses = require("./../../../data/2016/dataSources/LoadoutSlotItemClasses.json"),
  equipSlotItemClasses = require("./../../../data/2016/dataSources/EquipSlotItemClasses.json"),
  weaponDefinitions = require("../../../data/2016/dataSources/ServerWeaponDefinitions"),
  resourceDefinitions = require("../../../data/2016/dataSources/Resources"),
  Z1_POIs = require("../../../data/2016/zoneData/Z1_POIs"),
  equipmentModelTexturesMapping: Record<
    string,
    Record<string, string[]>
  > = require("../../../data/2016/sampleData/equipmentModelTexturesMapping.json");

@healthThreadDecorator
export class ZoneServer2016 extends EventEmitter {
  private _gatewayServer: GatewayServer;
  readonly _protocol: H1Z1Protocol;
  _db!: Db;
  readonly _soloMode: boolean;
  _serverName = process.env.SERVER_NAME || "";
  readonly _mongoAddress: string;
  private readonly _clientProtocol = "ClientProtocol_1080";
  private _h1emuZoneServer!: H1emuZoneServer;
  _worldId = 0;
  _grid: GridCell[] = [];
  _spawnGrid: SpawnCell[] = [];

  saveTimeInterval: number = 600000;

  nextSaveTime: number = Date.now() + this.saveTimeInterval;

  readonly _clients: { [characterId: string]: Client } = {};
  _characters: { [characterId: string]: Character } = {};
  _npcs: { [characterId: string]: Npc } = {};
  _spawnedItems: { [characterId: string]: ItemObject } = {};
  _plants: { [characterId: string]: Plant } = {};
  _doors: { [characterId: string]: DoorEntity } = {};
  _explosives: { [characterId: string]: ExplosiveEntity } = {};
  _traps: { [characterId: string]: TrapEntity } = {};
  _temporaryObjects: {
    [characterId: string]: TemporaryEntity | PlantingDiameter;
  } = {};
  _vehicles: { [characterId: string]: Vehicle } = {};
  _lootbags: { [characterId: string]: Lootbag } = {};
  _lootableConstruction: { [characterId: string]: LootableConstructionEntity } =
    {};
  _constructionFoundations: {
    [characterId: string]: ConstructionParentEntity;
  } = {};
  _constructionDoors: { [characterId: string]: ConstructionDoor } = {};
  _constructionSimple: { [characterId: string]: ConstructionChildEntity } = {};
  _lootableProps: { [characterId: string]: LootableProp } = {};
  _taskProps: { [characterId: string]: TaskProp } = {};
  _crates: { [characterId: string]: Crate } = {};
  _destroyables: { [characterId: string]: Destroyable } = {};
  _destroyableDTOlist: number[] = [];
  _decoys: {
    [transientId: number]: {
      characterId: string;
      transientId: number;
      position: Float32Array;
      action: string;
    };
  } = {};
  _worldLootableConstruction: {
    [characterId: string]: LootableConstructionEntity;
  } = {};
  _worldSimpleConstruction: { [characterId: string]: ConstructionChildEntity } =
    {};
  _airdrop?: {
    plane: Plane;
    cargo?: Plane;
    planeTarget: string;
    planeTargetPos: Float32Array;
    cargoTarget: string;
    cargoTargetPos: Float32Array;
    destination: string;
    destinationPos: Float32Array;
    cargoSpawned: boolean;
    containerSpawned: boolean;
    manager?: Client;
  };
  _gameTime: number = 0;
  readonly _serverTime = this.getCurrentTime();
  _startTime = 0;
  _startGameTime = 0;
  _timeMultiplier = 72;
  _transientIds: { [transientId: number]: string } = {};
  _characterIds: { [characterId: string]: number } = {};
  readonly _loginServerInfo: { address?: string; port: number } = {
    address: process.env.LOGINSERVER_IP,
    port: 1110
  };
  worldRoutineTimer!: NodeJS.Timeout;
  _allowedCommands: string[] = process.env.ALLOWED_COMMANDS
    ? JSON.parse(process.env.ALLOWED_COMMANDS)
    : [];
  _packetHandlers: ZonePacketHandlers;
  worldObjectManager: WorldObjectManager;
  smeltingManager: SmeltingManager;
  decayManager: DecayManager;
  weatherManager: WeatherManager;
  worldDataManager!: WorldDataManagerThreaded;
  hookManager: HookManager;
  chatManager: ChatManager;
  rconManager: RConManager;
  groupManager: GroupManager;
  speedtreeManager: SpeedTreeManager;
  constructionManager: ConstructionManager;
  fairPlayManager: FairPlayManager;
  pluginManager: PluginManager;

  configManager: ConfigManager;

  _ready: boolean = false;
  _itemDefinitions: { [itemDefinitionId: number]: any } = itemDefinitions;
  _weaponDefinitions: { [weaponDefinitionId: number]: any } =
    weaponDefinitions.WEAPON_DEFINITIONS;
  _firegroupDefinitions: { [firegroupId: number]: any } =
    weaponDefinitions.FIRE_GROUP_DEFINITIONS;
  _firemodeDefinitions: { [firemodeId: number]: any } =
    weaponDefinitions.FIRE_MODE_DEFINITIONS;
  itemDefinitionsCache: any;
  weaponDefinitionsCache: any;
  projectileDefinitionsCache: any;
  profileDefinitionsCache: any;
  _containerDefinitions: { [containerDefinitionId: number]: any } =
    containerDefinitions;
  _recipes: { [recipeId: number]: Recipe } = recipes;
  lastItemGuid: bigint = 0x3000000000000000n;
  private readonly _transientIdGenerator = generateTransientId();
  _packetsStats: Record<string, number> = {};
  enableWorldSaves: boolean;
  readonly gameVersion: GAME_VERSIONS = GAME_VERSIONS.H1Z1_6dec_2016;
  isSaving: boolean = false;
  private _isSaving: boolean = false;
  readonly worldSaveVersion: number = 2;
  enablePacketInputLogging: boolean = false;

  /* MANAGED BY CONFIGMANAGER */
  proximityItemsDistance!: number;
  interactionDistance!: number;
  charactersRenderDistance!: number;
  tickRate!: number;
  worldRoutineRate!: number;
  welcomeMessage!: string;
  adminMessage!: string;
  enableLoginServerKickRequests!: boolean;
  /*                          */

  constructor(
    serverPort: number,
    gatewayKey: Uint8Array,
    mongoAddress = "",
    worldId?: number,
    internalServerPort?: number
  ) {
    super();
    this._gatewayServer = new GatewayServer(serverPort, gatewayKey);
    this._packetHandlers = new ZonePacketHandlers();
    this._mongoAddress = mongoAddress;
    this._worldId = worldId || 0;
    this._protocol = new H1Z1Protocol("ClientProtocol_1080");
    this.worldObjectManager = new WorldObjectManager();
    this.smeltingManager = new SmeltingManager();
    this.decayManager = new DecayManager();
    this.weatherManager = new WeatherManager();
    this.hookManager = new HookManager();
    this.chatManager = new ChatManager();
    this.rconManager = new RConManager();
    this.groupManager = new GroupManager();
    this.speedtreeManager = new SpeedTreeManager();
    this.constructionManager = new ConstructionManager();
    this.fairPlayManager = new FairPlayManager();
    this.pluginManager = new PluginManager();
    /* CONFIG MANAGER MUST BE INSTANTIATED LAST ! */
    this.configManager = new ConfigManager(this, process.env.CONFIG_PATH);
    this.enableWorldSaves =
      process.env.ENABLE_SAVES?.toLowerCase() == "false" ? false : true;

    this._soloMode = false;

    if (!this._mongoAddress) {
      this._soloMode = true;
      this.fairPlayManager.useFairPlay = false;
      debug("Server in solo mode !");
    }

    this.on("data", this.onZoneDataEvent);

    this.on("login", (client) => {
      if (!this._soloMode) {
        this.sendZonePopulationUpdate();
      }
      this.onZoneLoginEvent(client);
    });

    this._gatewayServer._soeServer.on("fatalError", (soeClient: SOEClient) => {
      const client = this._clients[soeClient.sessionId];
      this.deleteClient(client);
      // TODO: force crash the client
    });
    this._gatewayServer.on(
      "login",
      async (
        client: SOEClient,
        characterId: string,
        guid: string,
        clientProtocol: string
      ) => {
        if (clientProtocol !== this._clientProtocol) {
          debug(`${client.address} is using the wrong client protocol`);
          this.sendData(client as any, "LoginFailed", {});
          return;
        }
        debug(
          `Client logged in from ${client.address}:${client.port} with character id: ${characterId}`
        );
        if (!this._soloMode) {
          this._h1emuZoneServer.sendData(
            {
              ...this._loginServerInfo,
              // TODO: what a dirty hack
              serverId: this._worldId
            } as any,
            "ClientMessage",
            {
              guid,
              message: `Connected to server with id: ${this._worldId}`,
              showConsole: false,
              clearOutput: true
            }
          );
        }
        const generatedTransient = this.getTransientId(characterId);
        const zoneClient = this.createClient(
          client.sessionId,
          client.soeClientId,
          guid,
          characterId,
          generatedTransient
        );
        if (!this._soloMode) {
          if (await this.isClientBanned(zoneClient)) {
            return;
          }
          const adminData = (await this._db
            ?.collection(DB_COLLECTIONS.ADMINS)
            .findOne({
              sessionId: zoneClient.loginSessionId
            })) as unknown as { permissionLevel: number };
          if (adminData) {
            zoneClient.isAdmin = true;
            zoneClient.permissionLevel = adminData.permissionLevel ?? 3;
          }
        } else {
          zoneClient.isAdmin = true;
          zoneClient.permissionLevel = 3;
        }

        if (this._characters[characterId]) {
          this.sendData(client as any, "LoginFailed", {});
          return;
        }
        this._clients[client.sessionId] = zoneClient;
        //zoneClient.sendLightWeightQueue(this);
        this._characters[characterId] = zoneClient.character;
        zoneClient.pingTimer = setTimeout(() => {
          this.timeoutClient(zoneClient);
        }, this.fairPlayManager.pingTimeoutTime);
        this.emit("login", zoneClient);
      }
    );
    this._gatewayServer.on("disconnect", (client: SOEClient) => {
      // this happen when the connection is close without a regular logout
      setTimeout(() => {
        this.deleteClient(this._clients[client.sessionId]);
      }, 10000);
    });

    this._gatewayServer.on(
      "tunneldata",
      (client: SOEClient, data: Buffer, flags: number) => {
        if (!this._soloMode && this.enablePacketInputLogging) {
          this._db.collection("packets").insertOne({
            data,
            flags,
            loginSessionId: this._clients[client.sessionId].loginSessionId
          });
        }
        const packet = this._protocol.parse(data, flags);
        if (packet) {
          this.emit("data", this._clients[client.sessionId], packet);
        } else {
          debug("zonefailed : ", data);
        }
      }
    );

    if (!this._soloMode) {
      this._h1emuZoneServer = new H1emuZoneServer(
        this._worldId,
        internalServerPort
      ); // opens local socket to connect to loginserver

      this._h1emuZoneServer.on(
        "session",
        (err: string, client: H1emuClient) => {
          if (err) {
            debug(
              `An error occured for LoginConnection with ${client.sessionId}`
            );
            console.error(err);
          } else {
            this.sendZonePopulationUpdate();
            debug(`LoginConnection established for ${client.sessionId}`);
          }
        }
      );

      this._h1emuZoneServer.on(
        "sessionfailed",
        (err: string, client: H1emuClient) => {
          console.error(`h1emuServer sessionfailed for ${client.sessionId}`);
          console.error(err);
          process.exitCode = 11;
        }
      );

      this._h1emuZoneServer.on(
        "disconnect",
        (err: string, client: H1emuClient, reason: number) => {
          debug(
            `LoginConnection dropped: ${
              reason ? "Connection Lost" : "Unknown Error"
            }`
          );
        }
      );

      this._h1emuZoneServer.on(
        "data",
        async (err: string, client: H1emuClient, packet: any) => {
          if (err) {
            console.error(err);
          } else {
            switch (packet.name) {
              case "CharacterCreateRequest": {
                this.onCharacterCreateRequest(client, packet);
                break;
              }
              case "ClientIsAdminRequest": {
                this.onClientIsAdminRequest(client, packet);
                break;
              }
              case "CharacterAllowedRequest": {
                const { characterId, reqId } = packet.data;
                const banInfos = packet.data.banInfos ?? [];
                try {
                  for (let i = 0; i < banInfos.length; i++) {
                    const banInfo = banInfos[i];
                    if (
                      this.fairPlayManager.banInfoAcceptance.includes(
                        banInfo.banInfo
                      )
                    ) {
                      console.log(
                        `Character (${characterId}) connection rejected due to banInfo ${banInfo.banInfo}`
                      );
                      this._h1emuZoneServer.sendData(
                        client,
                        "CharacterAllowedReply",
                        { status: 0, reqId: reqId }
                      );
                      return;
                    }
                  }
                  const collection = (this._db as Db).collection(
                    DB_COLLECTIONS.CHARACTERS
                  );
                  const charactersArray = await collection
                    .find({
                      characterId: characterId,
                      serverId: this._worldId,
                      status: 1
                    })
                    .toArray();
                  if (charactersArray.length) {
                    this._h1emuZoneServer.sendData(
                      client,
                      "CharacterAllowedReply",
                      { status: 1, reqId: reqId }
                    );
                  } else {
                    this._h1emuZoneServer.sendData(
                      client,
                      "CharacterAllowedReply",
                      { status: 0, reqId: reqId }
                    );
                  }
                } catch (error) {
                  console.log(error);
                  this._h1emuZoneServer.sendData(
                    client,
                    "CharacterAllowedReply",
                    { status: 0, reqId: reqId }
                  );
                }
                break;
              }
              case "CharacterDeleteRequest": {
                const { characterId, reqId } = packet.data;
                try {
                  const collection = (this._db as Db).collection(
                    DB_COLLECTIONS.CHARACTERS
                  );
                  const charactersArray = await collection
                    .find({ characterId: characterId })
                    .toArray();
                  if (charactersArray.length === 1) {
                    await collection.updateOne(
                      { characterId: characterId },
                      {
                        $set: {
                          status: 0
                        }
                      }
                    );
                    this._h1emuZoneServer.sendData(
                      client,
                      "CharacterDeleteReply",
                      { status: 1, reqId: reqId }
                    );
                  } else {
                    this._h1emuZoneServer.sendData(
                      client,
                      "CharacterDeleteReply",
                      { status: 1, reqId: reqId }
                    );
                  }
                } catch (error) {
                  this._h1emuZoneServer.sendData(
                    client,
                    "CharacterDeleteReply",
                    { status: 0, reqId: reqId }
                  );
                }
                break;
              }
              case "LoginKickRequest": {
                const { guid, reason } = packet.data;

                if (!this.enableLoginServerKickRequests) {
                  console.log(
                    `LoginServer requested to kick client with guid ${guid} for reason: ${reason}! Ignored due to configuration setting.`
                  );
                  return;
                }

                let reasonString = "";

                switch (reason) {
                  case LOGIN_KICK_REASON.UNDEFINED:
                    reasonString = "UNDEFINED";
                    break;
                  case LOGIN_KICK_REASON.GLOBAL_BAN:
                    reasonString = "Global ban.";
                    break;
                  case LOGIN_KICK_REASON.ASSET_VALIDATION:
                    reasonString = "Failed asset integrity check.";
                    break;
                  default:
                    reasonString = "INVALID";
                    break;
                }

                const client = this.getClientByGuid(guid);

                if (!client) {
                  console.log(
                    "LoginServer requested to kick INVALID client with guid ${guid} for reason: ${reason}!"
                  );
                  return;
                }

                console.log(
                  `LoginServer kicking ${client.character.name} for reason: ${reasonString}`
                );

                this.kickPlayerWithReason(client, reasonString);
                break;
              }
              default:
                debug(`Unhandled h1emu packet: ${packet.name}`);
                break;
            }
          }
        }
      );
    }
  }

  onZoneLoginEvent(client: Client) {
    debug("zone login");
    try {
      this.sendInitData(client);
    } catch (error) {
      debug(error);
      this.sendData(client, "LoginFailed", {});
    }
  }

  onZoneDataEvent(client: Client, packet: any) {
    if (!client) {
      return;
    }
    client.pingTimer?.refresh();
    if (
      packet.name != "KeepAlive" &&
      packet.name != "PlayerUpdateUpdatePositionClientToZone" &&
      packet.name != "PlayerUpdateManagedPosition" &&
      packet.name != "ClientUpdate.MonitorTimeDrift"
    ) {
      debug(`Receive Data ${[packet.name]}`);
    }
    try {
      this._packetHandlers.processPacket(this, client, packet);
    } catch (error) {
      console.error(error);
      console.error(`An error occurred while processing a packet : `, packet);
      logVersion();
    }
  }

  async onCharacterCreateRequest(client: any, packet: any) {
    const { characterObjStringify, reqId } = packet.data;
    try {
      const characterData = JSON.parse(characterObjStringify),
        characterModelData = getCharacterModelData(characterData.payload);
      let character: FullCharacterSaveData = require("../../../data/2016/sampleData/character.json");
      character = {
        ...character,
        serverId: characterData.serverId,
        creationDate: toHex(Date.now()),
        lastLoginDate: toHex(Date.now()),
        characterId: characterData.characterId,
        ownerId: characterData.ownerId,
        characterName: characterData.payload.characterName,
        actorModelId: characterModelData.modelId,
        headActor: characterModelData.headActor,
        hairModel: characterModelData.hairModel,
        gender: characterData.payload.gender,
        status: 1,
        worldSaveVersion: this.worldSaveVersion
      };
      const collection = (this._db as Db).collection(DB_COLLECTIONS.CHARACTERS);
      const charactersArray = await collection.findOne({
        characterId: character.characterId
      });
      if (!charactersArray) {
        await collection.insertOne(character);
      }
      this._h1emuZoneServer.sendData(client, "CharacterCreateReply", {
        reqId: reqId,
        status: 1
      });
    } catch (error) {
      this._h1emuZoneServer.sendData(client, "CharacterCreateReply", {
        reqId: reqId,
        status: 0
      });
    }
  }
  async onClientIsAdminRequest(client: any, packet: any) {
    const { guid, reqId } = packet.data;
    try {
      const isAdmin = Boolean(
        await this._db
          ?.collection(DB_COLLECTIONS.ADMINS)
          .findOne({ sessionId: guid })
      );
      this._h1emuZoneServer.sendData(client, "ClientIsAdminReply", {
        reqId: reqId,
        status: isAdmin
      });
    } catch (error) {
      this._h1emuZoneServer.sendData(client, "ClientIsAdminReply", {
        reqId: reqId,
        status: 0
      });
    }
  }

  getProximityItems(character: Character): ClientUpdateProximateItems {
    const items = Object.values(this._spawnedItems);
    const proximityItems: ClientUpdateProximateItems = { items: [] };
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (
        isPosInRadiusWithY(
          this.proximityItemsDistance,
          character.state.position,
          item.state.position,
          1
        )
      ) {
        const proximityItem = {
          itemDefinitionId: item.item.itemDefinitionId,
          associatedCharacterGuid: character.characterId,
          itemData: item.item // should change to it use getItemData method later
        };
        (proximityItems.items as any[]).push(proximityItem);
      }
    }
    for (const a in this._lootableConstruction) {
      const construction = this._lootableConstruction[a];
      if (
        isPosInRadiusWithY(
          2,
          character.state.position,
          construction.state.position,
          1
        )
      ) {
        if (construction && construction.parentObjectCharacterId) {
          const parent = construction.getParent(this);
          if (
            parent &&
            parent.isSecured &&
            character.isHidden != parent.characterId
          ) {
            continue;
          }
        }
        const container = construction.getContainer();
        if (container) {
          Object.values(container.items).forEach((item: BaseItem) => {
            const proximityItem = {
              itemDefinitionId: item.itemDefinitionId,
              associatedCharacterGuid: character.characterId,
              itemData: construction.pGetItemData(
                this,
                item,
                container.containerDefinitionId
              )
            };
            (proximityItems.items as any[]).push(proximityItem);
          });
        }
      }
    }
    for (const a in this._worldLootableConstruction) {
      const construction = this._worldLootableConstruction[a];
      if (
        isPosInRadiusWithY(
          2,
          character.state.position,
          construction.state.position,
          1
        )
      ) {
        const container = construction.getContainer();
        if (container) {
          Object.values(container.items).forEach((item: BaseItem) => {
            const proximityItem = {
              itemDefinitionId: item.itemDefinitionId,
              associatedCharacterGuid: character.characterId,
              itemData: construction.pGetItemData(
                this,
                item,
                container.containerDefinitionId
              )
            };
            (proximityItems.items as any[]).push(proximityItem);
          });
        }
      }
    }
    return proximityItems;
  }

  pGetRecipes(): any[] {
    // todo: change to per-character recipe lists
    const recipeKeys = Object.keys(this._recipes);
    return Object.values(this._recipes).map((recipe, idx) => {
      const def = this.getItemDefinition(Number(recipeKeys[idx]));
      return {
        recipeId: def.ID,
        itemDefinitionId: def.ID,
        nameId: def.NAME_ID,
        iconId: def.IMAGE_SET_ID,
        unknownDword1: 0, // idk
        descriptionId: def.DESCRIPTION_ID,
        unknownDword2: 1, // idk
        bundleCount: recipe.bundleCount || 1,
        membersOnly: false, // could be used for admin-only recipes?
        filterId: recipe.filterId,
        components: recipe.components.map((component: any) => {
          const def = this.getItemDefinition(component.itemDefinitionId);
          return {
            unknownDword1: 0, // idk
            nameId: def.NAME_ID,
            iconId: def.IMAGE_SET_ID,
            unknownDword2: 0, // idk
            requiredAmount: component.requiredAmount,
            unknownQword1: "0x0", // idk
            unknownDword3: 0, // idk
            itemDefinitionId: def.ID
          };
        })
      };
    });
  }

  async sendCharacterData(client: Client) {
    if (!this.hookManager.checkHook("OnSendCharacterData", client)) return;
    if (!(await this.hookManager.checkAsyncHook("OnSendCharacterData", client)))
      return;
    let savedCharacter: FullCharacterSaveData;
    try {
      savedCharacter = await this.worldDataManager.fetchCharacterData(
        client.character.characterId
      );
    } catch (e) {
      this.sendData(client, "LoginFailed", {});
      return;
    }
    await this.loadCharacterData(
      client,
      savedCharacter as FullCharacterSaveData
    );
    client.startingPos = client.character.state.position;
    // guid is sensitive for now, so don't send real one to client rn
    this.sendData(client, "SendSelfToClient", {
      data: client.character.pGetSendSelf(this, "0x665a2bff2b44c034", client)
    });
    client.character.initialized = true;
    this.initializeContainerList(client);

    this._characters[client.character.characterId] = client.character; // character will spawn on other player's screen(s) at this point
    this.hookManager.checkHook("OnSentCharacterData", client);
  }
  /**
   * Caches item definitons so they aren't packed every time a client logs in.
   */
  private packItemDefinitions() {
    /*
    this.itemDefinitionsCache = this._protocol.pack("Command.ItemDefinitions", {
      data: {
        itemDefinitions: Object.values(this._itemDefinitions).map(
          (itemDef: any) => {
            return {
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
            };
          }
        ),
      },
    });
    */

    // temp custom logic for external container workaround

    const defs: any[] = [];
    Object.values(this._itemDefinitions).forEach((itemDef: any) => {
      switch (itemDef.ID) {
        case Items.FANNY_PACK_DEV:
        case Items.HEADLIGHTS_ATV:
        case Items.HEADLIGHTS_OFFROADER:
        case Items.HEADLIGHTS_PICKUP:
        case Items.HEADLIGHTS_POLICE:
        case Items.AIRDROP_CODE:
          defs.push({
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
          });
      }
      if (itemDef.ID > 5000) {
        // custom h1emu definitons start at 5001
        defs.push({
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
        });
      }
    });

    this.itemDefinitionsCache = this._protocol.pack("Command.ItemDefinitions", {
      data: {
        itemDefinitions: defs
      }
    });
  }

  /**
   * Caches weapon definitons so they aren't packed every time a client logs in.
   */
  private packWeaponDefinitions() {
    this.weaponDefinitionsCache = this._protocol.pack(
      "ReferenceData.WeaponDefinitions",
      {
        data: {
          definitionsData: {
            WEAPON_DEFINITIONS: Object.values(
              weaponDefinitions.WEAPON_DEFINITIONS
            ),
            FIRE_GROUP_DEFINITIONS: Object.values(
              weaponDefinitions.FIRE_GROUP_DEFINITIONS
            ),
            FIRE_MODE_DEFINITIONS: Object.values(
              weaponDefinitions.FIRE_MODE_DEFINITIONS
            ),
            PLAYER_STATE_GROUP_DEFINITIONS: Object.values(
              weaponDefinitions.PLAYER_STATE_GROUP_DEFINITIONS
            ),
            FIRE_MODE_PROJECTILE_MAPPING_DATA: Object.values(
              weaponDefinitions.FIRE_MODE_PROJECTILE_MAPPING_DATA
            ),
            AIM_ASSIST_DEFINITIONS: Object.values(
              weaponDefinitions.AIM_ASSIST_DEFINITIONS
            )
          }
        }
      }
    );
  }

  /**
   * Caches projectile definitons so they aren't packed every time a client logs in.
   */
  private packProjectileDefinitions() {
    this.projectileDefinitionsCache = this._protocol.pack(
      "ReferenceData.ProjectileDefinitions",
      {
        definitionsData: projectileDefinitons
      }
    );
  }

  /**
   * Caches profile definitons so they aren't packed every time a client logs in.
   */
  private packProfileDefinitions() {
    this.profileDefinitionsCache = this._protocol.pack(
      "ReferenceData.ProfileDefinitions",
      {
        data: {
          profiles: profileDefinitions
        }
      }
    );
  }

  private async initializeLoginServerConnection() {
    debug("Starting H1emuZoneServer");
    if (!this._loginServerInfo.address) {
      await this.fetchLoginInfo();
    }
    this._h1emuZoneServer.setLoginInfo(this._loginServerInfo, {
      serverId: this._worldId,
      h1emuVersion: process.env.H1Z1_SERVER_VERSION
    });
    this._h1emuZoneServer.start();
    await this._db
      ?.collection(DB_COLLECTIONS.SERVERS)
      .findOneAndUpdate(
        { serverId: this._worldId },
        { $set: { populationNumber: 0, populationLevel: 0 } }
      );
  }

  async loadCharacterData(
    client: Client,
    savedCharacter: FullCharacterSaveData
  ) {
    if (!this.hookManager.checkHook("OnLoadCharacterData", client)) return;
    if (!(await this.hookManager.checkAsyncHook("OnLoadCharacterData", client)))
      return;

    client.guid = savedCharacter.ownerId;
    client.character.name = savedCharacter.characterName;
    client.character.actorModelId = savedCharacter.actorModelId;
    client.character.headActor = savedCharacter.headActor;
    client.character.isRespawning = savedCharacter.isRespawning;
    client.character.gender = savedCharacter.gender;
    client.character.creationDate = savedCharacter.creationDate;
    client.character.lastLoginDate = savedCharacter.lastLoginDate;
    client.character.hairModel = savedCharacter.hairModel || "";
    client.character.spawnGridData = savedCharacter.spawnGridData;
    client.character.mutedCharacters = savedCharacter.mutedCharacters || [];

    let newCharacter = false;
    if (
      _.isEqual(savedCharacter.position, [0, 0, 0, 1]) &&
      _.isEqual(savedCharacter.rotation, [0, 0, 0, 1])
    ) {
      // if position/rotation hasn't changed
      newCharacter = true;
    }

    if (
      newCharacter ||
      client.character.isRespawning ||
      !this.enableWorldSaves
    ) {
      client.character.isRespawning = true;
      this.respawnPlayer(
        client,
        this._spawnGrid[randomIntFromInterval(0, 99)],
        false
      );
    } else {
      client.character.state.position = new Float32Array(
        savedCharacter.position
      );
      client.character.state.rotation = new Float32Array(
        savedCharacter.rotation
      );
      constructLoadout(savedCharacter._loadout, client.character._loadout);
      constructContainers(
        savedCharacter._containers,
        client.character._containers
      );
      client.character._resources =
        savedCharacter._resources || client.character._resources;
      client.character.generateEquipmentFromLoadout(this);
    }

    this.hookManager.checkHook("OnLoadedCharacterData", client);
  }

  private async setupServer() {
    this.weatherManager.weather =
      this.weatherManager.templates[this.weatherManager.defaultTemplate];
    this.weatherManager.seasonstart();

    this.worldDataManager = (await spawn(
      new Worker("./managers/worlddatamanagerthread")
    )) as unknown as WorldDataManagerThreaded;
    await this.worldDataManager.initialize(this._worldId, this._mongoAddress);
    if (!this._soloMode) {
      this._db = await WorldDataManager.getDatabase(this._mongoAddress);
    }
    if (this.enableWorldSaves) {
      const loadedWorld = await this.worldDataManager.getServerData(
        this._worldId
      );
      if (loadedWorld && Object.keys(loadedWorld).length) {
        if (loadedWorld.worldSaveVersion !== this.worldSaveVersion) {
          console.log(
            `World save version mismatch, deleting world data. Current: ${this.worldSaveVersion} Old: ${loadedWorld.worldSaveVersion}`
          );
          await this.worldDataManager.deleteWorld();
          await this.worldDataManager.insertWorld(
            BigInt(loadedWorld.lastItemGuid)
          );
        }
      } else {
        await this.worldDataManager.insertWorld(this.lastItemGuid);
      }
      this.lastItemGuid = BigInt(
        loadedWorld?.lastItemGuid || this.lastItemGuid
      );
      console.time("fetch world data");
      const fetchedWorldData =
        (await this.worldDataManager.fetchWorldData()) as FetchedWorldData;
      WorldDataManager.loadConstructionParentEntities(
        fetchedWorldData.constructionParents,
        this
      );
      fetchedWorldData.freeplace.forEach((entityData) => {
        WorldDataManager.loadLootableConstructionEntity(this, entityData, true);
      });
      fetchedWorldData.crops.forEach((entityData) => {
        WorldDataManager.loadPlantingDiameter(this, entityData);
      });
      fetchedWorldData.vehicles.forEach((entityData) => {
        WorldDataManager.loadVehicles(this, entityData);
      });

      console.timeEnd("fetch world data");
    }
    if (!this._soloMode) {
      this.initializeLoginServerConnection();
    }

    // !!ANYTHING THAT USES / GENERATES ITEMS MUST BE CALLED AFTER WORLD DATA IS LOADED!!

    this.packItemDefinitions();
    this.packWeaponDefinitions();
    this.packProjectileDefinitions();
    this.packProfileDefinitions();
    this.worldObjectManager.createDoors(this);
    this.worldObjectManager.createProps(this);

    await this.pluginManager.initializePlugins(this);

    this._ready = true;
    console.log(
      `Server saving ${this.enableWorldSaves ? "enabled" : "disabled"}.`
    );
    debug("Server ready");
  }

  /* TODO: MOVE TO WORLDDATAMANAGER */
  async saveWorld() {
    if (this._isSaving) {
      this.sendChatTextToAdmins("A save is already in progress.");
      return;
    }
    this.sendChatTextToAdmins("World save started.");
    this._isSaving = true;
    console.time("ZONE: processing");
    try {
      const characters = WorldDataManager.convertCharactersToSaveData(
        Object.values(this._characters),
        this._worldId
      );
      const vehicles = WorldDataManager.convertVehiclesToSaveData(
        Object.values(this._vehicles),
        this._worldId
      );
      const worldConstructions: LootableConstructionSaveData[] = [];
      Object.values(this._worldLootableConstruction).forEach((entity) => {
        const lootableConstructionSaveData =
          WorldDataManager.getLootableConstructionSaveData(
            entity,
            this._worldId
          );
        removeUntransferableFields(lootableConstructionSaveData);
        worldConstructions.push(lootableConstructionSaveData);
      });
      const constructions: ConstructionParentSaveData[] = [];

      Object.values(this._constructionFoundations).forEach((entity) => {
        if (entity.itemDefinitionId != Items.FOUNDATION_EXPANSION) {
          const construction = WorldDataManager.getConstructionParentSaveData(
            entity,
            this._worldId
          );
          // isTransferable(construction) too complex will run on max recursive call error
          constructions.push(construction);
        }
      });
      const crops: PlantingDiameterSaveData[] = [];
      Object.values(this._temporaryObjects).forEach((entity) => {
        if (entity instanceof PlantingDiameter) {
          crops.push(
            WorldDataManager.getPlantingDiameterSaveData(entity, this._worldId)
          );
        }
      });

      console.timeEnd("ZONE: processing");

      console.time("ZONE: saveWorld");

      this.worldDataManager
        .saveWorld({
          lastGuidItem: this.lastItemGuid,
          characters,
          worldConstructions,
          crops,
          constructions,
          vehicles
        })
        .then(() => {
          this._isSaving = false;
          this.sendChatTextToAdmins("World saved!");
          this.nextSaveTime = Date.now() + this.saveTimeInterval;
          debug("World saved!");
        });
    } catch (e) {
      console.log(e);
      this._isSaving = false;
      console.timeEnd("ZONE: saveWorld");
      this.sendChatTextToAdmins("World save failed!");
    }
    console.timeEnd("ZONE: saveWorld");
  }

  async start(): Promise<void> {
    debug("Starting server");
    debug(`Protocol used : ${this._protocol.protocolName}`);
    if (!this.hookManager.checkHook("OnServerInit")) return;
    if (!(await this.hookManager.checkAsyncHook("OnServerInit"))) return;

    await this.setupServer();

    this.fairPlayManager.decryptFairPlayValues();
    this._spawnGrid = this.divideMapIntoSpawnGrid(7448, 7448, 744);
    this.startRoutinesLoop();
    this.smeltingManager.checkSmeltables(this);
    this.smeltingManager.checkCollectors(this);
    this.decayManager.run(this);
    this._startTime += Date.now();
    this._startGameTime += Date.now();
    this.weatherManager.startWeatherWorker(this);
    this._gatewayServer.start();
    this.worldRoutineTimer = setTimeout(
      () => this.worldRoutine.bind(this)(),
      this.worldRoutineRate
    );
    this.hookManager.checkHook("OnServerReady");
  }

  sendInitData(client: Client) {
    this.sendData(client, "InitializationParameters", {
      ENVIRONMENT: "LIVE",
      unknownString1: "",
      rulesetDefinitions: [
        /*
        {
          unknownDword1: 1,
          unknownDword2: 1,
          ruleset: "Permadeath",
          unknownString2: "",
          rulesets: [
            {
              ID: 1,
              DATA: {
                ID: 1,
                RULESET_ID: 1,
                CONTENT_PACK_ID: 112,
                CONTENT_PACK_ACTION_ID: 1,
              }
            }
          ]
        },
        {
          unknownDword1: 3,
          unknownDword2: 3,
          ruleset: "Headshots",
          unknownString2: "",
          rulesets: []
        },
        {
          unknownDword1: 4,
          unknownDword2: 4,
          ruleset: "FirstPersonOnly",
          unknownString2: "",
          rulesets: []
        },
        {
          unknownDword1: 5,
          unknownDword2: 5,
          ruleset: "PvE", //  could be "Normal"
          unknownString2: "",
          rulesets: [
            {
              ID: 3,
              DATA: {
                ID: 3,
                RULESET_ID: 5,
                CONTENT_PACK_ID: 119,
                CONTENT_PACK_ACTION_ID: 2,
              }
            },
          ]
        },
        {
          unknownDword1: 6,
          unknownDword2: 6,
          ruleset: "BattleRoyale",
          unknownString2: "",
          rulesets: [
            
          ]
        },*/
      ]
    });

    this.sendData(client, "SendZoneDetails", {
      zoneName: "Z1",
      zoneType: 4,
      unknownBoolean1: false,
      skyData: this.weatherManager.weather,
      zoneId1: 5,
      zoneId2: 5,
      nameId: 7699,
      unknownBoolean2: true,
      lighting: "Lighting.txt",
      unknownBoolean3: false
    });

    if (!this.itemDefinitionsCache) {
      this.packItemDefinitions();
    }
    // disabled since it breaks weapon inspect
    // re-enabled for just external container workaround custom definitions
    this.sendRawData(client, this.itemDefinitionsCache);
    if (!this.weaponDefinitionsCache) {
      this.packWeaponDefinitions();
    }
    this.sendRawData(client, this.weaponDefinitionsCache);
    // packet is just broken, idk why
    /*
    this.sendData(client, "ClientBeginZoning", {
      //position: Array.from(client.character.state.position),
      //rotation: Array.from(client.character.state.rotation),
      skyData: this.weather,
    });
    */

    this.sendData(client, "ClientGameSettings", {
      Unknown2: 0,
      interactGlowAndDist: 16, // need it high for tampers
      unknownBoolean1: true,
      timescale: 1.0,
      enableWeapons: 1,
      Unknown5: 1,
      unknownFloat1: 0.0,
      unknownFloat2: 15,
      damageMultiplier: 11
    });

    this.sendCharacterData(client);
  }

  private divideMapIntoSpawnGrid(
    mapWidth: number,
    mapHeight: number,
    gridCellSize: number
  ) {
    const grid = [];
    for (
      let i = -mapWidth / 2 + gridCellSize / 2;
      i < mapWidth / 2;
      i += gridCellSize
    ) {
      for (
        let j = mapHeight / 2 - gridCellSize / 2;
        j > -mapHeight / 2;
        j -= gridCellSize
      ) {
        const cell = new SpawnCell(i, j, gridCellSize, gridCellSize);
        spawnLocations2.forEach((location: number[]) => {
          if (!location) return;
          if (
            location[0] >= cell.position[0] - cell.width / 2 &&
            location[0] <= cell.position[0] + cell.width / 2 &&
            location[2] >= cell.position[2] - cell.height / 2 &&
            location[2] <= cell.position[2] + cell.height / 2
          ) {
            cell.spawnPoints.push(new Float32Array(location));
          }
        });
        grid.push(cell);
      }
    }
    return grid.reverse();
  }

  private divideMapIntoGrid(
    mapWidth: number,
    mapHeight: number,
    gridCellSize: number
  ) {
    const grid = [];
    for (let i = -mapWidth / 2; i < mapWidth / 2; i += gridCellSize) {
      for (let j = -mapHeight / 2; j < mapHeight / 2; j += gridCellSize) {
        const cell = new GridCell(i, j, gridCellSize, gridCellSize);
        grid.push(cell);
      }
    }
    return grid;
  }

  divideLargeCells(threshold: number) {
    const grid = this._grid;
    for (let i = 0; i < grid.length; i++) {
      const gridCell: GridCell = grid[i];
      if (gridCell.height < 250) continue;
      if (gridCell.objects.length > threshold) {
        const newGridCellWidth = gridCell.width / 2;
        const newGridCellHeight = gridCell.height / 2;
        // 4 cells made of 1
        const newGridCell1 = new GridCell(
          gridCell.position[0],
          gridCell.position[2],
          newGridCellWidth,
          newGridCellHeight
        );
        const newGridCell2 = new GridCell(
          gridCell.position[0] + newGridCellWidth,
          gridCell.position[2],
          newGridCellWidth,
          newGridCellHeight
        );
        const newGridCell3 = new GridCell(
          gridCell.position[0],
          gridCell.position[2] + newGridCellHeight,
          newGridCellWidth,
          newGridCellHeight
        );
        const newGridCell4 = new GridCell(
          gridCell.position[0] + newGridCellWidth,
          gridCell.position[2] + newGridCellHeight,
          newGridCellWidth,
          newGridCellHeight
        );
        // remove old grid cell
        const objects = this._grid[i].objects;
        this._grid.splice(i, 1);
        i--;

        this._grid.push(newGridCell1);
        this._grid.push(newGridCell2);
        this._grid.push(newGridCell3);
        this._grid.push(newGridCell4);
        objects.forEach((object: BaseEntity) => {
          this.pushToGridCell(object);
        });
      }
    }
  }

  pushToGridCell(obj: BaseEntity) {
    if (this._grid.length == 0)
      this._grid = this.divideMapIntoGrid(8000, 8000, 250);
    if (
      obj instanceof Vehicle ||
      obj instanceof Character ||
      (obj instanceof ConstructionChildEntity &&
        !obj.getParent(this) &&
        obj instanceof ConstructionParentEntity) ||
      (obj instanceof LootableConstructionEntity && !obj.getParent(this))
    )
      return; // dont push objects that can change its position
    for (let i = 0; i < this._grid.length; i++) {
      const gridCell = this._grid[i];
      if (
        obj.state.position[0] >= gridCell.position[0] &&
        obj.state.position[0] <= gridCell.position[0] + gridCell.width &&
        obj.state.position[2] >= gridCell.position[2] &&
        obj.state.position[2] <= gridCell.position[2] + gridCell.height
      ) {
        if (gridCell.objects.includes(obj)) {
          return;
        }
        gridCell.objects.push(obj);
      }
    }
  }

  assignChunkRenderDistance(client: Client) {
    let lowerRenderDistance = false;
    const character = client.character;
    for (let i = 0; i < this._grid.length; i++) {
      const gridCell: GridCell = this._grid[i];

      if (
        character.state.position[0] >= gridCell.position[0] &&
        character.state.position[0] <= gridCell.position[0] + gridCell.width &&
        character.state.position[2] >= gridCell.position[2] &&
        character.state.position[2] <= gridCell.position[2] + gridCell.height &&
        gridCell.height < 250
      ) {
        lowerRenderDistance = true;
      }
    }
    client.chunkRenderDistance = lowerRenderDistance ? 350 : 500;
  }

  private worldRoutine() {
    if (!this.hookManager.checkHook("OnWorldRoutine")) return;
    else {
      if (this._ready) {
        this.constructionManager.plantManager(this);
        this.worldObjectManager.run(this);
        this.checkVehiclesInMapBounds();
        this.setTickRate();
        this.syncAirdrop();
        if (
          this.enableWorldSaves &&
          !this.isSaving &&
          this.nextSaveTime - Date.now() < 0
        ) {
          this.saveWorld();
        }
      }
    }
    this.worldRoutineTimer.refresh();
  }

  setTickRate() {
    const size = _.size(this._clients);
    if (size <= 0) {
      this.tickRate = 3000;
      return;
    }
    this.tickRate = 3000 / size;
  }

  deleteClient(client: Client) {
    if (!client) {
      this.setTickRate();
      return;
    }

    if (client.character) {
      client.isLoading = true; // stop anything from acting on character

      clearTimeout(client.character?.resourcesUpdater);
      const characterSave = WorldDataManager.convertToCharacterSaveData(
        client.character,
        this._worldId
      );
      this.worldDataManager.saveCharacterData(characterSave, this.lastItemGuid);
      this.dismountVehicle(client);
      client.managedObjects?.forEach((characterId: any) => {
        this.dropVehicleManager(client, characterId);
      });
      this.deleteEntity(client.character.characterId, this._characters);

      this.groupManager.handlePlayerDisconnect(this, client);
    }
    delete this._clients[client.sessionId];
    const soeClient = this.getSoeClient(client.soeClientId);
    if (soeClient) {
      this._gatewayServer._soeServer.deleteClient(soeClient);
    }
    if (!this._soloMode) {
      this.sendZonePopulationUpdate();
    }
    this.setTickRate();
  }

  generateDamageRecord(
    targetCharacterId: string,
    damageInfo: DamageInfo,
    oldHealth: number
  ): DamageRecord {
    const targetEntity = this.getEntity(targetCharacterId),
      sourceEntity = this.getEntity(damageInfo.entity),
      targetClient = this.getClientByCharId(targetCharacterId),
      sourceClient = this.getClientByCharId(damageInfo.entity);

    let sourceName = damageInfo.entity,
      sourcePing = 0,
      targetName = "Generic",
      targetPing = 0;
    if (sourceClient && !targetClient) {
      sourceName = sourceClient.character.name || "Unknown";
      const sourceSOEClient = this.getSoeClient(sourceClient.soeClientId);
      sourcePing = sourceSOEClient ? sourceSOEClient.avgPing : 0;
    } else if (!sourceClient && targetClient) {
      targetName = targetClient.character.name || "Unknown";
      const targetSOEClient = this.getSoeClient(targetClient.soeClientId);
      targetPing = targetSOEClient ? targetSOEClient.avgPing : 0;
    } else if (sourceClient && targetClient) {
      const sourceSOEClient = this.getSoeClient(sourceClient.soeClientId),
        targetSOEClient = this.getSoeClient(targetClient.soeClientId);
      sourceName = sourceClient.character.name || "Unknown";
      sourcePing = sourceSOEClient ? sourceSOEClient.avgPing : 0;
      targetName = targetClient.character.name || "Unknown";
      targetPing = targetSOEClient ? targetSOEClient.avgPing : 0;
    }
    return {
      source: {
        name: sourceName,
        ping: sourcePing
      },
      target: {
        name: targetName,
        ping: targetPing
      },
      hitInfo: {
        timestamp: Date.now(),
        weapon: damageInfo.weapon,
        distance:
          sourceEntity && targetEntity
            ? getDistance(
                sourceEntity.state.position,
                targetEntity.state.position
              ).toFixed(1)
            : "0",
        hitLocation: damageInfo.hitReport?.hitLocation || "Unknown",
        hitPosition:
          damageInfo.hitReport?.position || new Float32Array([0, 0, 0, 0]),
        oldHP: oldHealth,
        newHP:
          oldHealth - damageInfo.damage < 0 ? 0 : oldHealth - damageInfo.damage,
        message: damageInfo.message || ""
      }
    };
  }

  sendDeathMetrics(client: Client) {
    const clientUpdateDeathMetricsPacket: ClientUpdateDeathMetrics = {
      recipesDiscovered: client.character.metrics.recipesDiscovered,
      zombiesKilled: client.character.metrics.zombiesKilled,
      minutesSurvived:
        (Date.now() - client.character.metrics.startedSurvivingTP) / 60000,
      wildlifeKilled: client.character.metrics.wildlifeKilled
    };
    this.sendData(
      client,
      "ClientUpdate.DeathMetrics",
      clientUpdateDeathMetricsPacket
    );
  }

  logPlayerDeath(client: Client, damageInfo: DamageInfo) {
    debug(client.character.name + " has died");
    const sourceClient = this.getClientByCharId(damageInfo.entity);
    if (!sourceClient) return;

    if (
      !this._soloMode &&
      client.character.name !== sourceClient.character.name
    ) {
      logClientActionToMongo(
        this._db.collection(DB_COLLECTIONS.KILLS),
        sourceClient,
        this._worldId,
        { type: "player", playerKilled: client.character.name }
      );
    }
    client.lastDeathReport = {
      position: client.character.state.position,
      attackerPosition: sourceClient.character.state.position,
      distance: Number(
        getDistance(
          client.character.state.position,
          sourceClient.character.state.position
        ).toFixed(2)
      ),
      attacker: sourceClient
    };
    //this.sendConsoleTextToAdmins()
  }

  killCharacter(client: Client, damageInfo: DamageInfo) {
    if (!client.character.isAlive) return;
    if (!this.hookManager.checkHook("OnPlayerDeath", client, damageInfo))
      return;
    for (const a in client.character._characterEffects) {
      const characterEffect = client.character._characterEffects[a];
      if (characterEffect.endCallback)
        characterEffect.endCallback(this, client.character);
    }
    const weapon = client.character.getEquippedWeapon();
    if (weapon && weapon.weapon) {
      this.sendRemoteWeaponUpdateDataToAllOthers(
        client,
        client.character.transientId,
        weapon.itemGuid,
        "Update.FireState",
        {
          state: {
            firestate: 0,
            transientId: client.character.transientId,
            position: client.character.state.position
          }
        }
      );
    }
    const pos = client.character.state.position;
    if (client.character.spawnGridData.length < 100) {
      // attemt to fix broken spawn grid after unban
      client.character.spawnGridData = new Array(100).fill(0);
    }
    this._spawnGrid.forEach((spawnCell: SpawnCell) => {
      // find current grid and add it to blocked ones
      if (
        pos[0] >= spawnCell.position[0] - spawnCell.width / 2 &&
        pos[0] <= spawnCell.position[0] + spawnCell.width / 2 &&
        pos[2] >= spawnCell.position[2] - spawnCell.height / 2 &&
        pos[2] <= spawnCell.position[2] + spawnCell.height / 2
      ) {
        client.character.spawnGridData[this._spawnGrid.indexOf(spawnCell)] =
          new Date().getTime() + 300000;
        // find neighboring grids and add to blocked ones
        this._spawnGrid.forEach((cell: SpawnCell) => {
          if (isPosInRadius(1100, cell.position, spawnCell.position)) {
            client.character.spawnGridData[this._spawnGrid.indexOf(cell)] =
              new Date().getTime() + 300000;
          }
        });
      }
    });
    const character = client.character,
      gridArr: any[] = [];
    character.spawnGridData.forEach((number: number) => {
      if (number <= new Date().getTime()) number = 0;
      gridArr.push({
        unk: number ? Math.floor((number - new Date().getTime()) / 1000) : 0
      });
    });

    this.sendData(client, "ClientUpdate.UpdateLockoutTimes", {
      unk: gridArr,
      bool: true
    });
    client.character._characterEffects = {};
    client.character.isRespawning = true;
    this.sendDeathMetrics(client);
    this.logPlayerDeath(client, damageInfo);

    client.character.isRunning = false;
    character.isAlive = false;
    this.updateCharacterState(
      client,
      client.character.characterId,
      client.character.characterStates,
      false
    );
    if (!client.isLoading) {
      this.sendDataToAllWithSpawnedEntity(
        this._characters,
        client.character.characterId,
        "Character.StartMultiStateDeath",
        {
          characterId: client.character.characterId
        }
      );
    } else {
      this.sendDataToAllOthersWithSpawnedEntity(
        this._characters,
        client,
        client.character.characterId,
        "Character.StartMultiStateDeath",
        {
          characterId: client.character.characterId
        }
      );
    }
    this.clearMovementModifiers(client);

    client.character.dismountContainer(this);

    if (client.vehicle.mountedVehicle) {
      const vehicle = this._vehicles[client.vehicle.mountedVehicle],
        container = vehicle?.getContainer();
      if (vehicle && container) {
        container.items = {
          ...container.items,
          ...client.character.getDeathItems(this)
        };
      }
    } else {
      Object.values(client.character._loadout).forEach((slot: LoadoutItem) => {
        // need to find a better way later, if out of bulk ammo will be outside of lootbag
        if (slot.weapon) {
          const ammo = this.generateItem(
            this.getWeaponAmmoId(slot.itemDefinitionId),
            slot.weapon.ammoCount
          );
          if (
            ammo &&
            slot.weapon.ammoCount > 0 &&
            slot.weapon.itemDefinitionId != Items.WEAPON_REMOVER
          ) {
            client.character.lootContainerItem(
              this,
              ammo,
              ammo.stackCount,
              true
            );
          }
          slot.weapon.ammoCount = 0;
          if (slot.itemDefinitionId != Items.WEAPON_FISTS) {
            this.damageItem(client, slot, 350);
          }
        }
      });
      this.worldObjectManager.createLootbag(this, character);
    }
    this.clearInventory(client, false);
    this.sendKillFeed(client, damageInfo);
    this.hookManager.checkHook("OnPlayerDied", client, damageInfo);
  }

  sendKillFeed(client: Client, damageInfo: DamageInfo) {
    if (
      !client.currentPOI ||
      client.character.characterId === damageInfo.entity
    )
      return;
    for (const a in this._clients) {
      if (
        this._clients[a].currentPOI != client.currentPOI ||
        this._clients[a].loginSessionId === client.loginSessionId
      )
        continue;
      this.sendData(this._clients[a], "Character.KilledBy", {
        killer: damageInfo.entity,
        killed: client.character.characterId
      });
    }
  }

  async explosionDamage(
    position: Float32Array,
    npcTriggered: string,
    source: string,
    client?: Client
  ) {
    // TODO: REDO THIS WITH AN OnExplosiveDamage method per class
    for (const characterId in this._characters) {
      const character = this._characters[characterId];
      if (isPosInRadiusWithY(3, character.state.position, position, 1.5)) {
        const distance = getDistance(position, character.state.position);
        const damage = 50000 / distance;
        character.damage(this, {
          entity: npcTriggered,
          damage: damage
        });
      }
    }
    for (const vehicleKey in this._vehicles) {
      const vehicle = this._vehicles[vehicleKey];
      if (vehicle.characterId != npcTriggered) {
        if (isPosInRadius(5, vehicle.state.position, position)) {
          const distance = getDistance(position, vehicle.state.position);
          const damage = 250000 / distance;
          await Scheduler.wait(150);
          vehicle.damage(this, { entity: npcTriggered, damage: damage });
        }
      }
    }

    for (const trapKey in this._traps) {
      const trap = this._traps[trapKey];
      if (!trap) continue;
      if (isPosInRadius(5, trap.state.position, position)) {
        trap.destroy(this);
      }
    }

    for (const construction in this._constructionSimple) {
      const constructionObject = this._constructionSimple[construction];
      if (
        constructionObject.itemDefinitionId == Items.FOUNDATION_RAMP ||
        constructionObject.itemDefinitionId == Items.FOUNDATION_STAIRS
      )
        continue;
      if (
        isPosInRadius(
          constructionObject.damageRange * 1.5,
          constructionObject.fixedPosition
            ? constructionObject.fixedPosition
            : constructionObject.state.position,
          position
        )
      ) {
        if (
          this.constructionManager.isConstructionInSecuredArea(
            this,
            constructionObject
          )
        ) {
          if (client) {
            this.constructionManager.sendBaseSecuredMessage(this, client);
          }
        } else {
          this.constructionManager.checkConstructionDamage(
            this,
            constructionObject.characterId,
            50000,
            this._constructionSimple,
            position,
            constructionObject.fixedPosition
              ? constructionObject.fixedPosition
              : constructionObject.state.position,
            source
          );
        }
      }
    }

    for (const construction in this._constructionDoors) {
      const constructionObject = this._constructionDoors[
        construction
      ] as ConstructionDoor;
      if (
        isPosInRadius(
          constructionObject.damageRange,
          constructionObject.fixedPosition
            ? constructionObject.fixedPosition
            : constructionObject.state.position,
          position
        )
      ) {
        if (
          this.constructionManager.isConstructionInSecuredArea(
            this,
            constructionObject
          )
        ) {
          if (client) {
            this.constructionManager.sendBaseSecuredMessage(this, client);
          }
        } else {
          this.constructionManager.checkConstructionDamage(
            this,
            constructionObject.characterId,
            50000,
            this._constructionDoors,
            position,
            constructionObject.fixedPosition
              ? constructionObject.fixedPosition
              : constructionObject.state.position,
            source
          );
        }
      }
    }

    for (const construction in this._constructionFoundations) {
      const constructionObject = this._constructionFoundations[
        construction
      ] as ConstructionParentEntity;
      if (
        isPosInRadius(
          constructionObject.damageRange * 1.5,
          constructionObject.state.position,
          position
        )
      ) {
        const allowed = [Items.SHACK, Items.SHACK_SMALL, Items.SHACK_BASIC];
        if (allowed.includes(constructionObject.itemDefinitionId)) {
          this.constructionManager.checkConstructionDamage(
            this,
            constructionObject.characterId,
            50000,
            this._constructionFoundations,
            position,
            constructionObject.state.position,
            source
          );
        }
      }
    }

    for (const construction in this._lootableConstruction) {
      const constructionObject = this._lootableConstruction[
        construction
      ] as LootableConstructionEntity;
      if (isPosInRadius(2, constructionObject.state.position, position)) {
        const parent = constructionObject.getParent(this);
        if (parent && parent.isSecured) {
          if (client) {
            this.constructionManager.sendBaseSecuredMessage(this, client);
          }
          continue;
        }
        this.constructionManager.checkConstructionDamage(
          this,
          constructionObject.characterId,
          50000,
          this._lootableConstruction,
          position,
          constructionObject.state.position,
          source
        );
      }
    }

    for (const construction in this._worldLootableConstruction) {
      const constructionObject = this._worldLootableConstruction[
        construction
      ] as LootableConstructionEntity;
      if (isPosInRadius(2, constructionObject.state.position, position)) {
        this.constructionManager.checkConstructionDamage(
          this,
          constructionObject.characterId,
          50000,
          this._worldLootableConstruction,
          position,
          constructionObject.state.position,
          source
        );
      }
    }

    for (const construction in this._worldSimpleConstruction) {
      const constructionObject = this._worldSimpleConstruction[
        construction
      ] as ConstructionChildEntity;
      if (isPosInRadius(4, constructionObject.state.position, position)) {
        this.constructionManager.checkConstructionDamage(
          this,
          constructionObject.characterId,
          50000,
          this._worldSimpleConstruction,
          position,
          constructionObject.state.position,
          source
        );
      }
    }

    for (const explosive in this._explosives) {
      const explosiveObj = this._explosives[explosive];
      if (explosiveObj.characterId != npcTriggered) {
        if (getDistance(position, explosiveObj.state.position) < 2) {
          await Scheduler.wait(100);
          if (this._spawnedItems[explosiveObj.characterId]) {
            const object = this._spawnedItems[explosiveObj.characterId];
            this.deleteEntity(explosiveObj.characterId, this._spawnedItems);
            delete this.worldObjectManager.spawnedLootObjects[object.spawnerId];
          }
          if (!explosiveObj.detonated) explosiveObj.detonate(this);
        }
      }
    }
  }

  createProjectileNpc(client: Client, data: any) {
    const fireHint = client.fireHints[data.projectileId];
    if (!fireHint) return;
    const weaponItem = fireHint.weaponItem;
    if (!weaponItem) return;
    const itemDefId = weaponItem.itemDefinitionId;
    if (
      itemDefId == Items.WEAPON_BOW_MAKESHIFT ||
      itemDefId == Items.WEAPON_BOW_RECURVE ||
      itemDefId == Items.WEAPON_CROSSBOW ||
      itemDefId == Items.WEAPON_BOW_WOOD
    ) {
      delete client.fireHints[data.projectileId];
      this.worldObjectManager.createLootEntity(
        this,
        this.generateItem(Items.AMMO_ARROW),
        data.position,
        data.rotation
      );
    }
  }

  respawnPlayer(
    client: Client,
    cell: SpawnCell,
    clearEquipment: boolean = true
  ) {
    if (!this.hookManager.checkHook("OnPlayerRespawn", client)) return;

    if (!client.character.isRespawning) return;

    if (client.vehicle.mountedVehicle) {
      this.dismountVehicle(client);
    }

    this.dropAllManagedObjects(client);

    client.isLoading = true;
    client.characterReleased = false;
    client.blockedPositionUpdates = 0;
    client.character.lastLoginDate = toHex(Date.now());
    client.character.resetMetrics();
    client.character.isAlive = true;
    client.character.isRunning = false;
    client.character.isRespawning = false;
    client.isInAir = false;

    this.sendDataToAllWithSpawnedEntity(
      this._characters,
      client.character.characterId,
      "Command.PlayDialogEffect",
      {
        characterId: client.character.characterId,
        effectId: 0
      }
    );

    client.character._resources[ResourceIds.HEALTH] = 10000;
    client.character._resources[ResourceIds.HUNGER] = 10000;
    client.character._resources[ResourceIds.HYDRATION] = 10000;
    client.character._resources[ResourceIds.STAMINA] = 600;
    client.character._resources[ResourceIds.BLEEDING] = -40;
    client.character.healingTicks = 0;
    client.character.healingMaxTicks = 0;
    client.character.resourcesUpdater?.refresh();

    const randomSpawnIndex = Math.floor(
      Math.random() * cell.spawnPoints.length
    );
    if (client.character.initialized) {
      client.managedObjects?.forEach((characterId: any) => {
        this.dropVehicleManager(client, characterId);
      });
      this.sendData(client, "Character.RespawnReply", {
        characterId: client.character.characterId,
        status: 1
      });
      const tempPos = client.character.state.position;
      const tempPos2 = new Float32Array([
        cell.spawnPoints[randomSpawnIndex][0],
        cell.spawnPoints[randomSpawnIndex][1] + 1,
        cell.spawnPoints[randomSpawnIndex][2],
        1
      ]);
      client.character.state.position = tempPos2;
      client.oldPos.position = tempPos2;
      this.sendData(client, "ClientUpdate.UpdateLocation", {
        position: tempPos2
      });
      const damageInfo: DamageInfo = {
        entity: "Server.Respawn",
        damage: 99999
      };
      if (this.fairPlayManager.fairPlayValues && !client.isAdmin) {
        for (
          let x = 1;
          x < this.fairPlayManager.fairPlayValues.respawnCheckIterations;
          x++
        ) {
          setTimeout(() => {
            if (
              isPosInRadius(
                this.fairPlayManager.fairPlayValues?.respawnCheckRange || 100,
                tempPos,
                client.character.state.position
              ) ||
              !isPosInRadius(
                this.fairPlayManager.fairPlayValues?.respawnCheckRange || 300,
                tempPos2,
                client.character.state.position
              )
            )
              this.killCharacter(client, damageInfo);
          }, x * this.fairPlayManager.fairPlayValues.respawnCheckTime);
        }
      }
    }
    if (clearEquipment) {
      Object.values(client.character._equipment).forEach((equipmentSlot) => {
        this.clearEquipmentSlot(client.character, equipmentSlot.slotId, false);
      });
      client.character.updateEquipment(this);
    }
    client.character.equipLoadout(this);
    client.character.state.position = cell.spawnPoints[randomSpawnIndex];
    this.updateResource(
      client,
      client.character.characterId,
      client.character._resources[ResourceIds.HEALTH],
      ResourceIds.HEALTH
    );
    this.updateResource(
      client,
      client.character.characterId,
      client.character._resources[ResourceIds.STAMINA],
      ResourceIds.STAMINA
    );
    this.updateResource(
      client,
      client.character.characterId,
      client.character._resources[ResourceIds.HUNGER],
      ResourceIds.HUNGER
    );
    this.updateResource(
      client,
      client.character.characterId,
      client.character._resources[ResourceIds.HYDRATION],
      ResourceIds.HYDRATION
    );
    this.updateResource(
      client,
      client.character.characterId,
      client.character._resources[ResourceIds.BLEEDING],
      ResourceIds.BLEEDING
    );
    this.updateCharacterState(
      client,
      client.character.characterId,
      client.character.characterStates,
      true
    );

    // fixes characters showing up as dead if they respawn close to other characters
    if (client.character.initialized) {
      this.sendDataToAllOthersWithSpawnedEntity(
        this._characters,
        client,
        client.character.characterId,
        "Character.RemovePlayer",
        {
          characterId: client.character.characterId
        }
      );
      const vehicleId = client.vehicle.mountedVehicle,
        vehicle = vehicleId ? this._vehicles[vehicleId] : false;
      setTimeout(() => {
        if (!client?.character) return;
        this.sendDataToAllOthersWithSpawnedEntity(
          this._characters,
          client,
          client.character.characterId,
          "AddLightweightPc",
          {
            ...client.character.pGetLightweight(),
            identity: {
              characterName: client.character.name
            },
            mountGuid: vehicleId || "",
            mountSeatId: vehicle
              ? vehicle.getCharacterSeat(client.character.characterId)
              : 0,
            mountRelatedDword1: vehicle ? 1 : 0,
            flags1: {
              isAdmin: client.isAdmin
            }
          }
        );
      }, 2000);
    }
    client.character.updateEquipment(this);
    this.hookManager.checkHook("OnPlayerRespawned", client);
  }

  updateResource(
    client: Client,
    entityId: string,
    value: number,
    resourceId: number,
    resourceType?: number // most resources have the same id and type
  ) {
    this.sendData(client, "ResourceEvent", {
      eventData: {
        type: 3,
        value: {
          characterId: entityId,
          resourceId: resourceId,
          resourceType: resourceType ? resourceType : resourceId,
          initialValue: value >= 0 ? value : 0
        }
      }
    });
  }

  updateResourceToAllWithSpawnedEntity(
    entityId: string,
    value: number,
    resourceId: number,
    resourceType: number,
    dictionary: any
  ) {
    this.sendDataToAllWithSpawnedEntity(dictionary, entityId, "ResourceEvent", {
      eventData: {
        type: 3,
        value: {
          characterId: entityId,
          resourceId: resourceId,
          resourceType: resourceType,
          initialValue: value >= 0 ? value : 0
        }
      }
    });
  }

  getEntityType(entityKey: string): number {
    switch (true) {
      case !!this._npcs[entityKey]:
        return EntityTypes.NPC;
      case !!this._vehicles[entityKey]:
        return EntityTypes.VEHICLE;
      case !!this._characters[entityKey]:
        return EntityTypes.PLAYER;
      case !!this._spawnedItems[entityKey]:
        return EntityTypes.OBJECT;
      case !!this._doors[entityKey]:
        return EntityTypes.DOOR;
      case !!this._explosives[entityKey]:
        return EntityTypes.EXPLOSIVE;
      case !!this._constructionFoundations[entityKey]:
        return EntityTypes.CONSTRUCTION_FOUNDATION;
      case !!this._constructionDoors[entityKey]:
        return EntityTypes.CONSTRUCTION_DOOR;
      case !!this._constructionSimple[entityKey]:
        return EntityTypes.CONSTRUCTION_SIMPLE;
      case !!this._lootableConstruction[entityKey]:
        return EntityTypes.LOOTABLE_CONSTRUCTION;
      case !!this._lootableProps[entityKey]:
        return EntityTypes.LOOTABLE_PROP;
      case !!this._worldLootableConstruction[entityKey]:
        return EntityTypes.WORLD_LOOTABLE_CONSTRUCTION;
      case !!this._worldSimpleConstruction[entityKey]:
        return EntityTypes.WORLD_CONSTRUCTION_SIMPLE;
      case !!this._plants[entityKey]:
        return EntityTypes.PLANT;
      case !!this._traps[entityKey]:
        return EntityTypes.TRAP;
      case !!this._taskProps[entityKey]:
        return EntityTypes.TASK_PROP;
      case !!this._crates[entityKey]:
        return EntityTypes.CRATE;
      case !!this._destroyables[entityKey]:
        return EntityTypes.DESTROYABLE;
      default:
        return EntityTypes.INVALID;
    }
  }

  getLootableEntity(
    entityKey: string
  ): BaseLootableEntity | Vehicle2016 | undefined {
    return (
      this._lootbags[entityKey] ||
      this._vehicles[entityKey] ||
      this._lootableConstruction[entityKey] ||
      this._worldLootableConstruction[entityKey] ||
      this._lootableProps[entityKey] ||
      undefined
    );
  }

  getConstructionEntity(entityKey: string): ConstructionEntity | undefined {
    return (
      this._constructionFoundations[entityKey] ||
      this._constructionSimple[entityKey] ||
      this._lootableConstruction[entityKey] ||
      this._constructionDoors[entityKey] ||
      this._worldLootableConstruction[entityKey] ||
      undefined
    );
  }

  getConstructionDictionary(entityKey: string): any | undefined {
    switch (true) {
      case !!this._constructionFoundations[entityKey]:
        return this._constructionFoundations;
      case !!this._constructionSimple[entityKey]:
        return this._constructionSimple;
      case !!this._lootableConstruction[entityKey]:
        return this._lootableConstruction;
      case !!this._constructionDoors[entityKey]:
        return this._constructionDoors;
      case !!this._worldLootableConstruction[entityKey]:
        return this._worldLootableConstruction;
      case !!this._worldSimpleConstruction[entityKey]:
        return this._worldSimpleConstruction;
      default:
        return;
    }
  }

  getEntity(entityKey: string): BaseEntity | undefined {
    return (
      this._npcs[entityKey] ||
      this._vehicles[entityKey] ||
      this._characters[entityKey] ||
      this._spawnedItems[entityKey] ||
      this._doors[entityKey] ||
      this._explosives[entityKey] ||
      this._constructionFoundations[entityKey] ||
      this._constructionDoors[entityKey] ||
      this._constructionSimple[entityKey] ||
      this._lootbags[entityKey] ||
      this._lootableConstruction[entityKey] ||
      this._lootableProps[entityKey] ||
      this._worldLootableConstruction[entityKey] ||
      this._worldSimpleConstruction[entityKey] ||
      this._plants[entityKey] ||
      this._taskProps[entityKey] ||
      this._crates[entityKey] ||
      this._destroyables[entityKey] ||
      this._temporaryObjects[entityKey] ||
      undefined
    );
  }

  damageItem(client: Client, item: LoadoutItem, damage: number) {
    item.currentDurability -= damage;
    if (item.currentDurability <= 0) {
      this.removeInventoryItem(client.character, item);
      if (this.isWeapon(item.itemDefinitionId)) {
        client.character.lootContainerItem(
          this,
          this.generateItem(Items.BROKEN_METAL_ITEM)
        );
      }
      return;
    }
    this.updateLoadoutItem(client, item);
  }

  getClientByCharId(characterId: string) {
    for (const a in this._clients) {
      const c: Client = this._clients[a];
      if (c.character.characterId === characterId) {
        return c;
      }
    }
  }

  getClientByGuid(guid: string) {
    for (const a in this._clients) {
      const c: Client = this._clients[a];
      if (c.guid === guid) {
        return c;
      }
    }
  }

  getClientByNameOrLoginSession(name: string): Client | string | undefined {
    let similar: string = "";
    const targetClient: Client | undefined = Object.values(this._clients).find(
      (c) => {
        const clientName = c.character.name?.toLowerCase().replaceAll(" ", "_");
        if (!clientName) return;
        if (clientName == name.toLowerCase() || c.loginSessionId == name) {
          return c;
        } else if (
          getDifference(name.toLowerCase(), clientName) <= 3 &&
          getDifference(name.toLowerCase(), clientName) != 0
        )
          similar = clientName;
      }
    );
    return targetClient ? targetClient : similar ? similar : undefined;
  }

  checkHelmet(
    characterId: string,
    damage: number,
    helmetDamageDivder = 1
  ): number {
    // TODO: REDO THIS
    const c = this.getClientByCharId(characterId);
    if (!c || !c.character.hasHelmet(this)) {
      return damage;
    }
    damage *= 0.25;
    this.damageItem(
      c,
      c.character._loadout[LoadoutSlots.HEAD],
      damage / helmetDamageDivder
    );
    return damage;
  }

  checkArmor(
    characterId: string,
    damage: any,
    kevlarDamageDivider = 4
  ): number {
    // TODO: REDO THIS
    const c = this.getClientByCharId(characterId),
      slot = c?.character._loadout[LoadoutSlots.ARMOR],
      itemDef = this.getItemDefinition(slot?.itemDefinitionId);
    if (!c || !slot || !slot.itemDefinitionId || !itemDef) {
      return damage;
    }
    if (itemDef.DESCRIPTION_ID == 12073) {
      damage *= 0.5; // was 0.8
      this.damageItem(
        c,
        c.character._loadout[LoadoutSlots.ARMOR],
        damage / kevlarDamageDivider
      );
    } else if (
      itemDef.DESCRIPTION_ID == 11151 ||
      itemDef.DESCRIPTION_ID == 11153
    ) {
      damage *= 0.7; // was 0.9
      this.damageItem(
        c,
        c.character._loadout[LoadoutSlots.ARMOR],
        damage / kevlarDamageDivider
      );
    }
    return damage;
  }

  sendHitmarker(
    client: Client,
    hitLocation: string = "",
    hasHelmet: boolean,
    hasArmor: boolean,
    hasHelmetBefore: boolean,
    hasArmorBefore: boolean
  ) {
    let isHeadshot = false;
    switch (hitLocation) {
      case "HEAD":
      case "GLASSES":
      case "NECK":
        isHeadshot = true;
        break;
    }
    this.sendData(client, "Ui.ConfirmHit", {
      hitType: {
        isAlly: 0,
        isHeadshot: isHeadshot,
        damagedArmor:
          (isHeadshot && hasHelmetBefore && hasHelmet) ||
          (!isHeadshot && hasArmorBefore && hasArmor)
            ? 1
            : 0,
        crackedArmor:
          isHeadshot && hasHelmetBefore && !hasHelmet
            ? 1
            : 0 || (!isHeadshot && hasArmorBefore && !hasArmor)
            ? 1
            : 0
      }
    });
  }

  getWeaponHitEffect(itemDefinitionId?: Items) {
    switch (itemDefinitionId) {
      case Items.WEAPON_SHOTGUN:
        return 1302;
      case Items.WEAPON_308:
        return 5414;
      default:
        return 1165;
    }
  }

  getProjectileDamage(
    itemDefinitionId: Items,
    sourcePos: Float32Array,
    targetPos: Float32Array
  ) {
    switch (itemDefinitionId) {
      case Items.WEAPON_AR15:
      case Items.WEAPON_1911:
      case Items.WEAPON_BLAZE:
        return 2500;
      case Items.WEAPON_M9:
        return 1800;
      case Items.WEAPON_R380:
        return 1500;
      case Items.WEAPON_SHOTGUN:
        return calculate_falloff(
          getDistance(sourcePos, targetPos),
          200,
          1400, //1667,
          1,
          12
        );
      case Items.WEAPON_NAGAFENS_RAGE:
        return calculate_falloff(
          getDistance(sourcePos, targetPos),
          200,
          2400, //1667,
          3,
          20
        );
      case Items.WEAPON_AK47:
      case Items.WEAPON_FROSTBITE:
        return 2900;
      case Items.WEAPON_308:
        return 6700;
      case Items.WEAPON_REAPER:
        return 14000;
      case Items.WEAPON_MAGNUM:
        return 3000;
      case Items.WEAPON_BOW_MAKESHIFT:
        return 2500;
      case Items.WEAPON_BOW_RECURVE:
        return 2500;
      case Items.WEAPON_BOW_WOOD:
        return 2500;
      case Items.WEAPON_CROSSBOW:
        return 2500;
      default:
        return 1000;
    }
  }

  validateHit(client: Client, entity: BaseEntity) {
    const ret = {
      isValid: true,
      message: ""
    };
    if (
      !isPosInRadius(
        entity.npcRenderDistance || this.charactersRenderDistance,
        client.character.state.position,
        entity.state.position
      )
    ) {
      return {
        isValid: false,
        message: "ProjectileDistance"
      };
    }
    if (!client.spawnedEntities.includes(entity)) {
      return {
        isValid: false,
        message: "InvalidTarget"
      };
    }

    const target = this.getClientByCharId(entity.characterId);
    if (target) {
      if (!target.spawnedEntities.includes(client.character)) {
        return {
          isValid: false,
          message: "InvalidTarget"
        };
      }
    }
    if (client.isFairPlayFlagged) {
      this.sendChatTextToAdmins(
        `FairPlay: blocked projectile of flagged client: ${client.character.name}`,
        false
      );
      return {
        isValid: false,
        message: "InvalidFlag"
      };
    }
    return ret;
  }

  registerHit(client: Client, packet: any, gameTime: number) {
    if (!client.character.isAlive) return;

    const { hitReport } = packet;
    if (!hitReport) return; // should never trigger

    for (const a in this._decoys) {
      const decoy = this._decoys[a];
      if (decoy.characterId === hitReport.characterId) {
        this.sendChatTextToAdmins(
          `FairPlay: ${
            client.character.name
          } hit a decoy entity at: [${decoy.position[0].toFixed(
            2
          )} ${decoy.position[1].toFixed(2)} ${decoy.position[2].toFixed(2)}]`,
          false
        );
      }
    }
    const message = `FairPlay: blocked incoming projectile from ${client.character.name}`;
    const entity = this.getEntity(hitReport.characterId);
    if (!entity) return;
    const fireHint = client.fireHints[hitReport.sessionProjectileCount];
    const targetClient = this.getClientByCharId(entity.characterId);
    if (!fireHint) {
      if (targetClient) {
        this.sendChatText(targetClient, message, false);
        this.sendChatTextToAdmins(
          `FairPlay: ${client.character.name} has hit ${targetClient.character.name} with non existing projectile`,
          false
        );
      }
      return;
    }
    const weaponItem = fireHint.weaponItem;
    if (!weaponItem) return;
    if (fireHint.hitNumber > 0) {
      if (targetClient) {
        this.sendChatTextToAdmins(
          `FairPlay: ${client.character.name} shot has been blocked due to desync / double usage`,
          false
        );
        this.sendChatText(targetClient, message, false);
      }
      return;
    }
    if (
      this.fairPlayManager.fairPlayValues &&
      !this.fairPlayManager.validateProjectileHit(
        this,
        client,
        entity,
        fireHint,
        weaponItem,
        hitReport,
        gameTime
      )
    ) {
      if (
        weaponItem.itemDefinitionId != Items.WEAPON_SHOTGUN &&
        weaponItem.itemDefinitionId != Items.WEAPON_NAGAFENS_RAGE
      ) {
        client.flaggedShots++;
        if (
          client.flaggedShots >=
          this.fairPlayManager.fairPlayValues.maxFlaggedShots
        ) {
          client.isFairPlayFlagged = true;
        }
      }
      return;
    } else {
      client.flaggedShots = 0;
    }
    const hitValidation = this.validateHit(client, entity);

    entity.OnProjectileHit(this, {
      entity: client.character.characterId,
      weapon: weaponItem.itemDefinitionId,
      damage: hitValidation.isValid
        ? this.getProjectileDamage(
            weaponItem.itemDefinitionId,
            client.character.state.position,
            entity.state.position
          )
        : 0,
      hitReport: packet.hitReport,
      message: hitValidation.message
    });
  }

  setGodMode(client: Client, godMode: boolean) {
    client.character.godMode = godMode;
    this.updateCharacterState(
      client,
      client.character.characterId,
      client.character.characterStates,
      false
    );
  }

  setTempGodMode(client: Client, godMode: boolean) {
    client.character.tempGodMode = godMode;
    this.updateCharacterState(
      client,
      client.character.characterId,
      client.character.characterStates,
      false
    );
  }

  /*toggleHiddenMode(client: Client) {
    client.character.isHidden = !client.character.isHidden;
    client.character.characterStates.gmHidden = client.character.isHidden;
    this.updateCharacterState(
      client,
      client.character.characterId,
      client.character.characterStates,
      false
    );
  }*/

  tempGodMode(client: Client, durationMs: number) {
    this.setTempGodMode(client, true);
    setTimeout(() => {
      this.setTempGodMode(client, false);
    }, durationMs);
  }

  updateCharacterState(
    client: Client,
    characterId: string,
    object: any,
    sendToAll: boolean
  ) {
    const updateCharacterStateBody = {
      characterId: characterId,
      states1: object,
      states2: object,
      states3: object,
      states4: object,
      states5: object,
      states6: object,
      states7: object
    };

    if (!sendToAll) {
      this.sendData(
        client,
        "Character.UpdateCharacterState",
        updateCharacterStateBody
      );
    } else {
      this.sendDataToAllOthersWithSpawnedEntity(
        this._characters,
        client,
        client.character.characterId,
        "Character.UpdateCharacterState",
        updateCharacterStateBody
      );
    }
  }

  customizeDTO(client: Client) {
    const DTOArray: Array<any> = [];
    for (const object in this._lootableProps) {
      const prop = this._lootableProps[object];
      const propInstance = {
        objectId: prop.spawnerId,
        unknownString1: "Weapon_Empty.adr"
      };
      DTOArray.push(propInstance);
    }
    for (const object in this._taskProps) {
      const prop = this._taskProps[object];
      const propInstance = {
        objectId: prop.spawnerId,
        unknownString1: "Weapon_Empty.adr"
      };
      DTOArray.push(propInstance);
    }
    for (const object in this._crates) {
      const prop = this._crates[object];
      const propInstance = {
        objectId: prop.spawnerId,
        unknownString1: "Weapon_Empty.adr"
      };
      DTOArray.push(propInstance);
    }
    for (let x = 0; x < this._destroyableDTOlist.length; x++) {
      const propInstance = {
        objectId: this._destroyableDTOlist[x],
        unknownString1: "Weapon_Empty.adr"
      };
      DTOArray.push(propInstance);
    }
    this.speedtreeManager.customize(DTOArray);
    deprecatedDoors.forEach((door: number) => {
      const DTOinstance = {
        objectId: door,
        unknownString1: "Weapon_Empty.adr"
      };
      DTOArray.push(DTOinstance);
    });
    this.sendData(client, "DtoObjectInitialData", {
      unknownDword1: 1,
      unknownArray1: DTOArray,
      unknownArray2: [{}]
    });
  }

  private shouldRemoveEntity(client: Client, entity: BaseEntity): boolean {
    return (
      entity && // in case if entity is undefined somehow
      !(entity instanceof ConstructionParentEntity) &&
      !(entity instanceof Vehicle2016) &&
      (this.filterOutOfDistance(entity, client.character.state.position) ||
        this.constructionManager.constructionShouldHideEntity(
          this,
          client,
          entity
        ))
    );
  }

  private removeOutOfDistanceEntities(client: Client) {
    // does not include vehicles
    const objectsToRemove = client.spawnedEntities.filter((e) =>
      this.shouldRemoveEntity(client, e)
    );
    client.spawnedEntities = client.spawnedEntities.filter((el) => {
      return !objectsToRemove.includes(el);
    });
    objectsToRemove.forEach((object: any) => {
      this.sendData(client, "Character.RemovePlayer", {
        characterId: object.characterId
      });
    });
  }

  private removeOODInteractionData(client: Client) {
    const objectsToRemove = client.sentInteractionData.filter((e) =>
      this.shouldRemoveEntity(client, e)
    );
    client.sentInteractionData = client.sentInteractionData.filter((el) => {
      return !objectsToRemove.includes(el);
    });
  }

  despawnEntity(characterId: string) {
    this.sendDataToAll("Character.RemovePlayer", {
      characterId: characterId
    });
  }

  deleteEntity(
    characterId: string,
    dictionary: any,
    effectId?: number,
    timeToDisappear?: number
  ): boolean {
    if (!dictionary[characterId]) return false;
    this.sendDataToAllWithSpawnedEntity(
      dictionary,
      characterId,
      "Character.RemovePlayer",
      {
        characterId: characterId,
        unknownWord1: effectId ? 1 : 0,
        effectId: effectId ? effectId : 0,
        timeToDisappear: timeToDisappear ? timeToDisappear : 0,
        effectDelay: timeToDisappear ? timeToDisappear : 0
      }
    );
    this._grid.forEach((cell: GridCell) => {
      if (cell.objects.includes(dictionary[characterId])) {
        cell.objects.splice(cell.objects.indexOf(dictionary[characterId]), 1);
      }
    });

    // remove deleted entity from spawned entities (correct me if we do it somewhere else)

    for (const a in this._clients) {
      const client = this._clients[a];
      const index = client.spawnedEntities.indexOf(dictionary[characterId]);
      if (index > -1) {
        client.spawnedEntities.splice(index, 1);
      }
    }
    delete dictionary[characterId];
    delete this._transientIds[this._characterIds[characterId]];
    delete this._characterIds[characterId];
    return true;
  }

  deleteCrate(crate: Crate, effectId?: number): boolean {
    if (!this._crates[crate.characterId]) return false;
    this.sendDataToAllWithSpawnedEntity(
      this._crates,
      crate.characterId,
      "Character.RemovePlayer",
      {
        characterId: crate.characterId,
        unknownWord1: effectId ? 1 : 0,
        effectId: 163,
        timeToDisappear: 0,
        effectDelay: 0
      }
    );
    crate.spawnTimestamp = Date.now() + 900000; // 15min respawn time
    crate.health = 5000;
    for (const a in this._clients) {
      const client = this._clients[a];
      const index = client.spawnedEntities.indexOf(crate);
      if (index > -1) {
        client.spawnedEntities.splice(index, 1);
      }
    }
    return true;
  }

  sendManagedObjectResponseControlPacket(client: Client, obj: zone2016packets) {
    this.sendData(client, "ClientUpdate.ManagedObjectResponseControl", obj);
  }

  addLightweightNpc(
    client: Client,
    entity: BaseLightweightCharacter,
    nameId = 0
  ) {
    this.sendData(client, "AddLightweightNpc", {
      ...entity.pGetLightweight(),
      nameId
    });
  }
  addSimpleNpc(client: Client, entity: BaseSimpleNpc) {
    this.sendData(client, "AddSimpleNpc", entity.pGetSimpleNpc());
  }

  spawnWorkAroundLightWeight(client: Client) {
    const lightWeight = {
      characterId: EXTERNAL_CONTAINER_GUID,
      transientId: 0,
      actorModelId: 2,
      position: new Float32Array([0, 0, 0, 0]),
      rotation: new Float32Array([0, 0, 0, 0]),
      scale: new Float32Array([0.001, 0.001, 0.001, 0.001]),
      positionUpdateType: 0,
      profileId: 0,
      isLightweight: false, //true,
      flags: {},
      headActor: ""
    };

    this.sendData(client, "AddLightweightNpc", lightWeight);
  }

  spawnCharacters(client: Client) {
    for (const c in this._clients) {
      const characterObj: Character = this._clients[c].character;
      if (
        client.character.characterId != characterObj.characterId &&
        characterObj.isReady &&
        isPosInRadius(
          characterObj.npcRenderDistance || this.charactersRenderDistance,
          client.character.state.position,
          characterObj.state.position
        ) &&
        !client.spawnedEntities.includes(characterObj) &&
        characterObj.isAlive &&
        !characterObj.isSpectator &&
        (characterObj.isHidden == client.character.isHidden ||
          client.character.isSpectator) /* &&
        client.banType != "hiddenplayers"*/
      ) {
        const vehicleId = this._clients[c].vehicle.mountedVehicle,
          vehicle = vehicleId ? this._vehicles[vehicleId] : false;
        this.sendData(client, "AddLightweightPc", {
          ...characterObj.pGetLightweight(),
          mountGuid: vehicleId || "",
          mountSeatId: vehicle
            ? vehicle.getCharacterSeat(characterObj.characterId)
            : 0,
          mountRelatedDword1: vehicle ? 1 : 0,
          flags1: {
            isAdmin: this.getClientByCharId(characterObj.characterId)?.isAdmin
          }
        });

        client.spawnedEntities.push(this._characters[characterObj.characterId]);
      }
    }
  }

  spawnCharacterToOtherClients(character: Character, isAdmin: boolean) {
    for (const a in this._clients) {
      const c = this._clients[a];
      if (
        isPosInRadius(
          character.npcRenderDistance || this.charactersRenderDistance,
          character.state.position,
          c.character.state.position
        ) &&
        !c.spawnedEntities.includes(character) &&
        character != c.character
      ) {
        this.sendData(c, "AddLightweightPc", {
          ...character.pGetLightweight(),
          mountGuid: "",
          mountSeatId: 0,
          mountRelatedDword1: 0,
          flags1: {
            isAdmin: isAdmin
          }
        });
        c.spawnedEntities.push(character);
      }
    }
  }

  private checkVehiclesInMapBounds() {
    for (const a in this._vehicles) {
      const vehicle = this._vehicles[a];
      let inMapBounds: boolean = false;
      this._spawnGrid.forEach((cell: SpawnCell) => {
        const position = vehicle.state.position;
        if (
          position[0] >= cell.position[0] - cell.width / 2 &&
          position[0] <= cell.position[0] + cell.width / 2 &&
          position[2] >= cell.position[2] - cell.height / 2 &&
          position[2] <= cell.position[2] + cell.height / 2
        ) {
          inMapBounds = true;
        }
      });

      if (!inMapBounds || vehicle.state.position[1] < -50) {
        vehicle.destroy(this, true);
      }
    }
  }

  private spawnGridObjects(client: Client) {
    const position = client.character.state.position;
    for (const gridCell of this._grid) {
      if (
        !isPosInRadius(client.chunkRenderDistance, gridCell.position, position)
      )
        continue;

      for (const object of gridCell.objects) {
        if (
          !isPosInRadius(
            (object.npcRenderDistance as number) ||
              this.charactersRenderDistance,
            position,
            object.state.position
          )
        ) {
          continue;
        }
        // removed for testing
        /*if (object instanceof ConstructionParentEntity) {
          this.spawnConstructionParent(client, object);
          continue;
        }*/

        if (client.spawnedEntities.includes(object)) continue;
        if (object instanceof Crate) {
          if (object.spawnTimestamp > Date.now()) continue;
        }
        client.spawnedEntities.push(object);
        if (object instanceof BaseLightweightCharacter) {
          if (object.useSimpleStruct) {
            this.addSimpleNpc(client, object);
          } else {
            this.addLightweightNpc(client, object);
            if (object instanceof DoorEntity) {
              if (object.isOpen) {
                this.sendData(client, "PlayerUpdatePosition", {
                  transientId: object.transientId,
                  positionUpdate: {
                    sequenceTime: 0,
                    unknown3_int8: 0,
                    position: object.state.position,
                    orientation: object.openAngle
                  }
                });
              }
              continue;
            }
            if (object instanceof Npc) {
              object.updateEquipment(this);
              continue;
            }
          }
        } else if (
          object instanceof TrapEntity ||
          object instanceof TemporaryEntity
        ) {
          this.addSimpleNpc(client, object);
        }
      }
    }
  }

  private spawnLoadingGridObjects(client: Client) {
    const position = client.character.state.position;
    for (const gridCell of this._grid) {
      if (
        !isPosInRadius(client.chunkRenderDistance, gridCell.position, position)
      )
        continue;
      for (const object of gridCell.objects) {
        if (
          !isPosInRadius(
            (object.npcRenderDistance as number) ||
              this.charactersRenderDistance,
            position,
            object.state.position
          )
        ) {
          continue;
        }
        if (client.spawnedEntities.includes(object)) continue;
        if (object instanceof Crate) {
          if (object.spawnTimestamp > Date.now()) continue;
        }
        if (object instanceof BaseLightweightCharacter) {
          if (object.useSimpleStruct) {
            this.addSimpleNpc(client, object);
          } else continue;
        } else if (
          object instanceof TrapEntity ||
          object instanceof TemporaryEntity
        ) {
          this.addSimpleNpc(client, object);
        }
        client.spawnedEntities.push(object);
      }
    }
  }

  private POIManager(client: Client) {
    // sends POIChangeMessage or clears it based on player location
    let inPOI = false;
    Z1_POIs.forEach((point: any) => {
      if (
        isPosInRadius(
          point.range,
          client.character.state.position,
          point.position
        )
      ) {
        inPOI = true;
        if (client.currentPOI != point.stringId) {
          // checks if player already was sent POIChangeMessage
          this.sendData(client, "POIChangeMessage", {
            messageStringId: point.stringId,
            id: point.POIid
          });
          client.currentPOI = point.stringId;
        }
      }
    });
    if (!inPOI && client.currentPOI != 0) {
      // checks if POIChangeMessage was already cleared
      this.sendData(client, "POIChangeMessage", {
        messageStringId: 0,
        id: 115
      });
      client.currentPOI = 0;
    }
  }

  logStats() {
    console.log(JSON.stringify(this._packetsStats));
  }

  private _sendData(
    client: Client,
    packetName: h1z1PacketsType2016,
    obj: zone2016packets,
    unbuffered: boolean
  ) {
    if (this._packetsStats[packetName]) this._packetsStats[packetName]++;
    else this._packetsStats[packetName] = 1;
    switch (packetName) {
      case "KeepAlive":
      case "PlayerUpdatePosition":
      case "GameTimeSync":
      case "Synchronization":
      case "Vehicle.StateData":
        break;
      default:
        debug("send data", packetName);
    }
    const data = this._protocol.pack(packetName, obj);
    if (data) {
      const soeClient = this.getSoeClient(client.soeClientId);
      if (soeClient) {
        if (unbuffered) {
          this._gatewayServer.sendUnbufferedTunnelData(soeClient, data);
        } else {
          this._gatewayServer.sendTunnelData(soeClient, data);
        }
      }
    }
  }

  sendUnbufferedData(
    client: Client,
    packetName: h1z1PacketsType2016,
    obj: zone2016packets
  ) {
    this._sendData(client, packetName, obj, true);
  }

  sendData(
    client: Client,
    packetName: h1z1PacketsType2016,
    obj: zone2016packets
  ) {
    this._sendData(client, packetName, obj, false);
  }

  /*addLightWeightNpcQueue(
    client: Client,
    packetName: h1z1PacketsType2016,
    obj: zone2016packets
  ) {
    client.lightWeightNpcQueue.push({ packetName: packetName, data: obj });
  }*/

  sendWeaponData(
    client: Client,
    packetName: weaponPacketsType,
    obj: zone2016packets
  ) {
    this.sendData(client, "Weapon.Weapon", {
      weaponPacket: {
        packetName: packetName,
        gameTime: this.getGameTime(),
        packet: obj
      }
    });
  }

  sendRemoteWeaponData(
    client: Client,
    transientId: number,
    packetName: remoteWeaponPacketsType,
    obj: zone2016packets
  ) {
    this.sendData(client, "Weapon.Weapon", {
      weaponPacket: {
        packetName: "Weapon.RemoteWeapon",
        gameTime: this.getGameTime(),
        remoteWeaponPacket: {
          packetName: packetName,
          transientId: transientId,
          packet: obj
        }
      }
    });
  }

  sendRemoteWeaponDataToAllOthers(
    client: Client,
    transientId: number,
    packetName: remoteWeaponPacketsType,
    obj: any
  ) {
    this.sendDataToAllOthersWithSpawnedEntity(
      this._characters,
      client,
      client.character.characterId,
      "Weapon.Weapon",
      {
        weaponPacket: {
          packetName: "Weapon.RemoteWeapon",
          gameTime: this.getGameTime(),
          remoteWeaponPacket: {
            packetName: packetName,
            transientId: transientId,
            packet: obj
          }
        }
      }
    );
  }

  sendRemoteWeaponUpdateData(
    client: Client,
    transientId: number,
    weaponGuid: string,
    packetName: remoteWeaponUpdatePacketsType,
    obj: zone2016packets
  ) {
    this.sendData(client, "Weapon.Weapon", {
      weaponPacket: {
        packetName: "Weapon.RemoteWeapon",
        gameTime: this.getGameTime(),
        remoteWeaponPacket: {
          packetName: "RemoteWeapon.Update",
          transientId: transientId,
          remoteWeaponUpdatePacket: {
            packetName: packetName,
            weaponGuid: weaponGuid,
            packet: obj
          }
        }
      }
    });
  }

  sendRemoteWeaponUpdateDataToAllOthers(
    client: Client,
    transientId: number,
    weaponGuid: string,
    packetName: remoteWeaponUpdatePacketsType,
    obj: any
  ) {
    this.sendDataToAllOthersWithSpawnedEntity(
      this._characters,
      client,
      client.character.characterId,
      "Weapon.Weapon",
      {
        weaponPacket: {
          packetName: "Weapon.RemoteWeapon",
          gameTime: this.getGameTime(),
          remoteWeaponPacket: {
            packetName: "RemoteWeapon.Update",
            transientId: transientId,
            remoteWeaponUpdatePacket: {
              packetName: packetName,
              weaponGuid: weaponGuid,
              packet: obj
            }
          }
        }
      }
    );
  }

  sendAlert(client: Client, message: string) {
    this._sendData(
      client,
      "ClientUpdate.TextAlert",
      {
        message: message
      },
      false
    );
  }
  sendAlertToAll(message: string) {
    this._sendDataToAll(
      "ClientUpdate.TextAlert",
      {
        message: message
      },
      false
    );
  }

  createClient(
    sessionId: number,
    soeClientId: string,
    loginSessionId: string,
    characterId: string,
    generatedTransient: number
  ) {
    const client = new Client(
      sessionId,
      soeClientId,
      loginSessionId,
      characterId,
      generatedTransient,
      this
    );
    return client;
  }

  async isClientBanned(client: Client): Promise<boolean> {
    const address: string | undefined = this.getSoeClient(client.soeClientId)
      ?.address;
    const addressBanned = await this._db
      ?.collection(DB_COLLECTIONS.BANNED)
      .findOne({
        IP: address,
        active: true,
        expirationDate: { $gt: Date.now() }
      });
    const idBanned = await this._db?.collection(DB_COLLECTIONS.BANNED).findOne({
      loginSessionId: client.loginSessionId,
      active: true,
      expirationDate: { $gt: Date.now() }
    });
    if (addressBanned || idBanned) {
      client.banType = addressBanned
        ? addressBanned.banType
        : idBanned?.banType;
      this.enforceBan(client);
      return true;
    }
    return false;
  }

  async unbanClient(
    client: Client,
    name: string
  ): Promise<ClientBan | undefined> {
    const unBannedClient = (
      await this._db
        ?.collection(DB_COLLECTIONS.BANNED)
        .findOneAndUpdate(
          { name, active: true },
          { $set: { active: false, unBanAdminName: client.character.name } }
        )
    )?.value as unknown as ClientBan;
    if (!unBannedClient) return;
    this.sendBanToLogin(unBannedClient.loginSessionId, false);
    return unBannedClient;
  }

  banClient(
    client: Client,
    reason: string,
    banType: string,
    adminName: string,
    timestamp: number
  ) {
    const object: ClientBan = {
      name: client.character.name || "",
      banType: banType,
      banReason: reason ? reason : "no reason",
      loginSessionId: client.loginSessionId,
      IP: this.getSoeClient(client.soeClientId)?.address || "",
      HWID: client.HWID,
      adminName: adminName ? adminName : "",
      expirationDate: 0,
      active: true,
      unBanAdminName: ""
    };
    if (timestamp) {
      object.expirationDate = timestamp;
    } else {
      // Do not send temp bans to loginserver
      this.sendBanToLogin(client.loginSessionId, true);
    }
    this._db?.collection(DB_COLLECTIONS.BANNED).insertOne(object);
    if (banType === "normal") {
      if (timestamp) {
        this.sendAlert(
          client,
          reason
            ? `YOU HAVE BEEN BANNED FROM THE SERVER UNTIL ${this.getDateString(
                timestamp
              )}. REASON: ${reason}`
            : `YOU HAVE BEEN BANNED FROM THE SERVER UNTIL: ${this.getDateString(
                timestamp
              )}`
        );
        this.sendAlertToAll(
          reason
            ? `${
                client.character.name
              } HAS BEEN BANNED FROM THE SERVER UNTIL ${this.getDateString(
                timestamp
              )}. REASON: ${reason}`
            : `${
                client.character.name
              } HAS BEEN BANNED FROM THE SERVER UNTIL: ${this.getDateString(
                timestamp
              )}`
        );
      } else {
        this.sendAlert(
          client,
          reason
            ? `YOU HAVE BEEN PERMANENTLY BANNED FROM THE SERVER REASON: ${reason}`
            : "YOU HAVE BEEN BANNED FROM THE SERVER."
        );
        this.sendAlertToAll(
          reason
            ? `${client.character.name} HAS BEEN BANNED FROM THE SERVER! REASON: ${reason}`
            : `${client.character.name} HAS BEEN BANNED FROM THE SERVER!`
        );
      }
      setTimeout(() => {
        this.kickPlayer(client);
      }, 3000);
    } else {
      client.banType = banType;
      this.enforceBan(client);
    }
  }

  enforceBan(client: Client) {
    switch (client.banType) {
      case "normal":
        this.kickPlayer(client);
        return;
      /*case "hiddenplayers":
        const objectsToRemove = client.spawnedEntities.filter(
          (e) => e && !(e instanceof Vehicle2016) && !(e instanceof ItemObject)
        );
        client.spawnedEntities = client.spawnedEntities.filter((el) => {
          return !objectsToRemove.includes(el);
        });
        objectsToRemove.forEach((object: any) => {
          this.sendData(client, "Character.RemovePlayer", {
            characterId: object.characterId,
          });
        });
        break;*/
      case "rick":
        this.sendData(client, "ClientExitLaunchUrl", {
          url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        });
        this.sendData(client, "LoginFailed", {});
        this.deleteClient(client);
        setTimeout(() => {
          if (!client) return;
          this.deleteClient(client);
        }, 1000);
        break;
    }
  }

  kickPlayerWithReason(client: Client, reason: string, sendGlobal = false) {
    for (let i = 0; i < 5; i++) {
      this.sendAlert(
        client,
        `You are being kicked from the server. Reason: ${reason}`
      );
    }

    setTimeout(() => {
      if (!client) {
        return;
      }
      if (sendGlobal) {
        this.sendGlobalChatText(
          `${client.character.name} has been kicked from the server!`
        );
      }
      this.kickPlayer(client);
    }, 2000);
  }

  kickPlayer(client: Client) {
    this.sendData(client, "CharacterSelectSessionResponse", {
      status: 1,
      sessionId: client.loginSessionId
    });
    setTimeout(() => {
      if (!client) return;
      this.deleteClient(client);
    }, 2000);
  }

  getDateString(timestamp: number) {
    const months = [
      "JAN",
      "FEB",
      "MAR",
      "APR",
      "MAY",
      "JUN",
      "JUL",
      "AUG",
      "SEP",
      "OCT",
      "NOV",
      "DEC"
    ];
    const date = new Date(timestamp);
    return `${date.getDate()} ${
      months[date.getMonth()]
    } ${date.getFullYear()} ${date.getHours()}:${date.getMinutes()}`;
  }

  getCurrentTime(): number {
    return Number((Date.now() / 1000).toFixed(0));
  }

  getGameTime(): number {
    //debug("get server time");
    const delta = Date.now() - this._startGameTime;
    return this.weatherManager.frozeCycle
      ? Number(((this._gameTime + delta) / 1000).toFixed(0))
      : Number((this._gameTime / 1000).toFixed(0));
  }

  sendGameTimeSync(client: Client) {
    debug("GameTimeSync");
    if (!this.weatherManager.frozeCycle) {
      this.sendData(client, "GameTimeSync", {
        time: Int64String(this.getServerTimeTest()),
        cycleSpeed: Math.round(this._timeMultiplier * 0.97222),
        unknownBoolean: false
      });
    } else if (this.weatherManager.frozeCycle) {
      this.sendData(client, "GameTimeSync", {
        time: Int64String(this.getGameTime()),
        cycleSpeed: 0.1,
        unknownBoolean: false
      });
    }
  }

  sendRawToAllOthersWithSpawnedCharacter(
    client: Client,
    entityCharacterId: string = "",
    data: any
  ) {
    for (const a in this._clients) {
      if (
        client != this._clients[a] &&
        this._clients[a].spawnedEntities.includes(
          this._characters[entityCharacterId]
        )
      ) {
        this.sendRawData(this._clients[a], data);
      }
    }
  }

  //#region ********************VEHICLE********************

  airdropManager(client: Client, spawn: boolean) {
    if (!this._airdrop) return;
    if (spawn) {
      const lightWeight = {
        characterId: this._airdrop.planeTarget,
        transientId: 0,
        actorModelId: 9770,
        position: this._airdrop.planeTargetPos,
        rotation: new Float32Array([0, 0, 0, 0]),
        scale: new Float32Array([0.001, 0.001, 0.001, 0.001]),
        positionUpdateType: 0,
        profileId: 0,
        isLightweight: true,
        flags: {},
        headActor: ""
      };
      this.sendData(client, "AddLightweightNpc", lightWeight);
      /*const lightWeight2 = {
        characterId: this._airdrop.destination,
        transientId: 0,
        actorModelId: 33,
        position: this._airdrop.destinationPos,
        rotation: new Float32Array([0, 0, 0, 0]),
        scale: new Float32Array([1, 1, 1, 1]),
        positionUpdateType: 0,
        profileId: 0,
        isLightweight: true,
        flags: {},
        headActor: "",
      };*/
      const lightWeight3 = {
        characterId: this._airdrop.cargoTarget,
        transientId: 0,
        actorModelId: 9770,
        position: this._airdrop.cargoTargetPos,
        rotation: new Float32Array([0, 0, 0, 0]),
        scale: new Float32Array([0.001, 0.001, 0.001, 0.001]),
        positionUpdateType: 0,
        profileId: 0,
        isLightweight: true,
        flags: {},
        headActor: ""
      };
      this.sendData(client, "AddLightweightNpc", lightWeight);
      //this.sendData(client, "AddLightweightNpc", lightWeight2);
      this.sendData(client, "AddLightweightNpc", lightWeight3);
      this.sendData(client, "AddLightweightVehicle", {
        ...this._airdrop.plane.pGetLightweightVehicle(),
        unknownGuid1: this.generateGuid()
      });
      this.sendData(client, "Character.MovementVersion", {
        characterId: this._airdrop.plane.characterId,
        version: 5
      });
      setTimeout(() => {
        if (this._airdrop) {
          this.sendData(
            client,
            "LightweightToFullVehicle",
            this._airdrop.plane.pGetFullVehicle(this)
          );
        }
      }, 1000);

      this.sendData(client, "Character.SeekTarget", {
        characterId: this._airdrop.plane.characterId,
        TargetCharacterId: this._airdrop.planeTarget,
        initSpeed: -20,
        acceleration: 0,
        speed: 0,
        turn: 5,
        yRot: 0,
        rotation: new Float32Array([
          0,
          this._airdrop.plane.positionUpdate.orientation || 0,
          0,
          0
        ])
      });
      if (
        this._airdrop.manager &&
        this._airdrop.manager.character.characterId ==
          client.character.characterId
      ) {
        this.sendData(client, "Character.ManagedObject", {
          objectCharacterId: this._airdrop.plane.characterId,
          characterId: client.character.characterId
        });
      }

      if (this._airdrop.cargoSpawned && this._airdrop.cargo) {
        this.sendData(client, "AddLightweightVehicle", {
          ...this._airdrop.cargo.pGetLightweightVehicle(),
          unknownGuid1: this.generateGuid()
        });
        this.sendData(client, "Character.MovementVersion", {
          characterId: this._airdrop.cargo.characterId,
          version: 6
        });
        this.sendData(
          client,
          "LightweightToFullVehicle",
          this._airdrop.cargo.pGetFullVehicle(this)
        );
        this.sendData(client, "Character.SeekTarget", {
          characterId: this._airdrop.cargo.characterId,
          TargetCharacterId: this._airdrop.cargoTarget,
          initSpeed: -5,
          acceleration: 0,
          speed: 0,
          turn: 5,
          yRot: 0
        });
        this.sendData(client, "Character.ManagedObject", {
          objectCharacterId: this._airdrop.cargo.characterId,
          characterId: client.character.characterId
        });
      }
    } else if (!spawn) {
      this.sendData(client, "Character.RemovePlayer", {
        characterId: this._airdrop.plane.characterId
      });
      if (this._airdrop.cargo) {
        this.sendData(client, "Character.RemovePlayer", {
          characterId: this._airdrop.cargo.characterId,
          unknownWord1: 1,
          effectId: 5328,
          timeToDisappear: 0,
          effectDelay: 0
        });
      }
      // removing them seems to crash the client somehow
      /*this.sendData(client, "Character.RemovePlayer", {
        characterId: this._airdrop.destination,
      });
      this.sendData(client, "Character.RemovePlayer", {
        characterId: this._airdrop.planeTarget,
      });
      this.sendData(client, "Character.RemovePlayer", {
        characterId: this._airdrop.cargoTarget,
      });*/
    }
  }

  syncAirdrop() {
    if (!this._airdrop) return;
    let choosenClient: Client | undefined;
    let currentDistance = 999999;
    for (const a in this._clients) {
      const client = this._clients[a];
      this.sendData(client, "Character.RemovePlayer", {
        characterId: this._airdrop.plane.characterId
      });
      this.sendData(client, "AddLightweightVehicle", {
        ...this._airdrop.plane.pGetLightweightVehicle(),
        unknownGuid1: this.generateGuid()
      });
      this.sendData(client, "Character.MovementVersion", {
        characterId: this._airdrop.plane.characterId,
        version: 5
      });
      if (this._airdrop.cargoSpawned && this._airdrop.cargo) {
        this.sendData(client, "Character.RemovePlayer", {
          characterId: this._airdrop.cargo.characterId
        });
        this.sendData(client, "AddLightweightVehicle", {
          ...this._airdrop.cargo.pGetLightweightVehicle(),
          unknownGuid1: this.generateGuid()
        });
        this.sendData(client, "Character.MovementVersion", {
          characterId: this._airdrop.cargo.characterId,
          version: 6
        });
        this.sendData(client, "Character.SeekTarget", {
          characterId: this._airdrop.cargo.characterId,
          TargetCharacterId: this._airdrop.cargoTarget,
          initSpeed: -5,
          acceleration: 0,
          speed: 0,
          turn: 5,
          yRot: 0,
          rotation: new Float32Array([0, 1, 0, 0])
        });
        this.sendData(client, "Character.ManagedObject", {
          objectCharacterId: this._airdrop.cargo.characterId,
          characterId: client.character.characterId
        });
        this.sendData(
          client,
          "LightweightToFullVehicle",
          this._airdrop.cargo.pGetFullVehicle(this)
        );
      }
      setTimeout(() => {
        if (this._airdrop) {
          this.sendData(
            client,
            "LightweightToFullVehicle",
            this._airdrop.plane.pGetFullVehicle(this)
          );
        }
      }, 1000);
      this.sendData(client, "Character.SeekTarget", {
        characterId: this._airdrop.plane.characterId,
        TargetCharacterId: this._airdrop.planeTarget,
        initSpeed: -20,
        acceleration: 0,
        speed: 0,
        turn: 5,
        yRot: 0,
        rotation: new Float32Array([
          0,
          this._airdrop.plane.positionUpdate.orientation || 0,
          0,
          0
        ])
      });
      if (!choosenClient) {
        choosenClient = client;
        currentDistance = getDistance2d(
          client.character.state.position,
          this._airdrop.cargo
            ? this._airdrop.cargo.state.position
            : this._airdrop.plane.state.position
        );
      }
      if (
        currentDistance >
        getDistance2d(
          client.character.state.position,
          this._airdrop.cargo
            ? this._airdrop.cargo.state.position
            : this._airdrop.plane.state.position
        )
      ) {
        const soeClient = this.getSoeClient(client.soeClientId);
        choosenClient = client;
        if (soeClient) {
          const ping = soeClient.avgPing;
          if (ping < 130) {
            choosenClient = client;
            currentDistance = getDistance2d(
              client.character.state.position,
              this._airdrop.plane.state.position
            );
          }
        }
      }
    }
    this._airdrop.manager = choosenClient;
    if (!this._airdrop.manager) return;
    this.sendData(this._airdrop.manager, "Character.ManagedObject", {
      objectCharacterId: this._airdrop.plane.characterId,
      characterId: this._airdrop.manager.character.characterId
    });
  }

  vehicleManager(client: Client) {
    for (const key in this._vehicles) {
      const vehicle = this._vehicles[key];
      //if (vehicle.vehicleId == VehicleIds.SPECTATE) continue; //ignore spectator cam // shouldnt be needed anymore
      if (
        // vehicle spawning / managed object assignment logic
        isPosInRadius(
          vehicle.npcRenderDistance || this.charactersRenderDistance,
          client.character.state.position,
          vehicle.state.position
        )
      ) {
        if (!client.spawnedEntities.includes(vehicle)) {
          this.sendData(client, "AddLightweightVehicle", {
            ...vehicle.pGetLightweightVehicle(),
            unknownGuid1: this.generateGuid()
          });
          vehicle.effectTags.forEach((effectTag: number) => {
            this.sendData(client, "Character.AddEffectTagCompositeEffect", {
              characterId: vehicle.characterId,
              effectId: effectTag,
              unknownDword1: effectTag,
              unknownDword2: effectTag
            });
          });
          /*
          if (vehicle.engineOn) {
            this.sendData(client, "Vehicle.Engine", {
              vehicleCharacterId: vehicle.characterId,
              engineOn: true,
            });
          }
          */
          /*this.sendData(client, "Vehicle.OwnerPassengerList", {
            characterId: client.character.characterId,
            passengers: vehicle.pGetPassengers(this),
          });*/
          client.spawnedEntities.push(vehicle);
        }
        // disable managing vehicles with routine, leaving only managed when entering it
        /*if (!vehicle.isManaged) {
          // assigns management to first client within radius
          this.assignManagedObject(client, vehicle);
        }*/
      } else if (
        !isPosInRadius(
          this.charactersRenderDistance,
          client.character.state.position,
          vehicle.state.position
        )
      ) {
        // vehicle despawning / managed object drop logic

        const index = client.spawnedEntities.indexOf(vehicle);
        if (index > -1) {
          if (vehicle.isManaged) {
            this.dropManagedObject(client, vehicle);
          }
          this.sendData(client, "Character.RemovePlayer", {
            characterId: vehicle.characterId
          });
          client.spawnedEntities.splice(index, 1);
        }
      }
    }
  }

  assignManagedObject(client: Client, vehicle: Vehicle) {
    // todo: vehicle seat swap managed object assignment logic
    debug("\n\n\n\n\n\n\n\n\n\n assign managed object");

    this.sendData(client, "Character.ManagedObject", {
      objectCharacterId: vehicle.characterId,
      characterId: client.character.characterId
    });
    this.sendData(client, "ClientUpdate.ManagedObjectResponseControl", {
      control: true,
      objectCharacterId: vehicle.characterId
    });
    client.managedObjects.push(vehicle.characterId);
    vehicle.isManaged = true;
  }

  dropManagedObject(
    client: Client,
    vehicle: Vehicle,
    keepManaged: boolean = false
  ) {
    const index = client.managedObjects.indexOf(vehicle.characterId);
    if (index > -1) {
      // todo: vehicle seat swap managed object drop logic
      debug("\n\n\n\n\n\n\n\n\n\n drop managed object");

      /*this.sendData(client, "ClientUpdate.ManagedObjectResponseControl", {
        control: true,
        objectCharacterId: vehicle.characterId,
      });*/ // dont work :/

      // workaround for managed object issue
      if (client.vehicle.mountedVehicle == vehicle.characterId) {
        this.sendData(client, "Mount.DismountResponse", {
          characterId: client.character.characterId
        });
        vehicle.droppedManagedClient = client;
      }
      this.sendData(client, "Character.RemovePlayer", {
        characterId: vehicle.characterId
      });

      this.sendData(client, "AddLightweightVehicle", {
        ...vehicle.pGetLightweightVehicle(),
        unknownGuid1: this.generateGuid()
      });
      client.managedObjects.splice(index, 1);
      // blocks vehicleManager from taking over management during a takeover
      if (!keepManaged) vehicle.isManaged = false;
    }
  }

  takeoverManagedObject(newClient: Client, vehicle: Vehicle) {
    const index = newClient.managedObjects.indexOf(vehicle.characterId);
    if (index === -1) {
      // if object is already managed by client, do nothing
      debug("\n\n\n\n\n\n\n\n\n\n takeover managed object");
      for (const characterId in this._clients) {
        const oldClient = this._clients[characterId];
        const idx = oldClient.managedObjects.indexOf(vehicle.characterId);
        if (idx > -1) {
          this.dropManagedObject(oldClient, vehicle, true);
          break;
        }
      }
      this.assignManagedObject(newClient, vehicle);
    }
  }

  dropAllManagedObjects(client: Client) {
    client.managedObjects.forEach((characterId: string) => {
      this.sendManagedObjectResponseControlPacket(client, {
        control: 0,
        objectCharacterId: characterId
      });
      client.managedObjects.splice(
        client.managedObjects.findIndex((e: string) => e === characterId),
        1
      );
    });
  }

  sendCompositeEffectToAllWithSpawnedEntity(
    dictionary: { [id: string]: any },
    object: BaseEntity,
    effectId: number
  ) {
    this.sendDataToAllWithSpawnedEntity(
      dictionary,
      object.characterId,
      "Character.PlayWorldCompositeEffect",
      {
        characterId: object.characterId,
        effectId: effectId,
        position: object.state.position
      }
    );
  }

  sendCompositeEffectToAllInRange(
    range: number,
    characterId: string,
    position: Float32Array,
    effectId: number
  ) {
    this.sendDataToAllInRange(
      range,
      position,
      "Character.PlayWorldCompositeEffect",
      {
        characterId: characterId,
        effectId: effectId,
        position: position
      }
    );
  }

  /*sendEffectToAllWithSpawnedEntity( idk whats wrong with it, sometimes works and sometimes doesnt
    characterId: string,
    effectId: number,
    dictionary: any,
  ) {
      this.sendDataToAllWithSpawnedEntity(
          dictionary,
          characterId,
          "Command.PlayDialogEffect",
          {
              characterId: characterId,
              effectId: effectId,
          }
      );
    
  }*/

  sendDataToAllWithSpawnedEntity(
    dictionary: { [id: string]: any },
    entityCharacterId: string = "",
    packetName: h1z1PacketsType2016,
    obj: zone2016packets
  ) {
    if (!entityCharacterId) return;
    for (const a in this._clients) {
      if (
        this._clients[a].spawnedEntities.includes(
          dictionary[entityCharacterId]
        ) ||
        this._clients[a].character.characterId == entityCharacterId
      ) {
        this.sendData(this._clients[a], packetName, obj);
      }
    }
  }

  /*addNpcQueueToAllWithSpawnedEntity(
    dictionary: { [id: string]: any },
    entityCharacterId: string = "",
    packetName: h1z1PacketsType2016,
    obj: zone2016packets
  ) {
    if (!entityCharacterId) return;
    for (const a in this._clients) {
      if (
        this._clients[a].spawnedEntities.includes(
          dictionary[entityCharacterId]
        ) ||
        this._clients[a].character.characterId == entityCharacterId
      ) {
        this.addLightWeightNpcQueue(this._clients[a], packetName, obj);
      }
    }
  }*/

  sendDataToAllInRange(
    range: number,
    position: Float32Array,
    packetName: any,
    obj: any
  ) {
    for (const a in this._clients) {
      if (
        isPosInRadius(
          range,
          this._clients[a].character.state.position,
          position
        )
      ) {
        this.sendData(this._clients[a], packetName, obj);
      }
    }
  }

  sendDataToAllOthersWithSpawnedEntity(
    dictionary: { [id: string]: any },
    client: Client,
    entityCharacterId: string = "",
    packetName: h1z1PacketsType2016,
    obj: zone2016packets
  ) {
    if (!entityCharacterId) return;
    for (const a in this._clients) {
      if (
        client != this._clients[a] &&
        this._clients[a].spawnedEntities.includes(dictionary[entityCharacterId])
      ) {
        this.sendData(this._clients[a], packetName, obj);
      }
    }
  }

  mountVehicle(client: Client, vehicleGuid: string) {
    const vehicle = this._vehicles[vehicleGuid];
    if (!vehicle || !vehicle.isMountable) return;

    if (vehicle.isLocked) {
      this.sendChatText(client, "Vehicle is locked.");
      return;
    }
    for (const a in this._constructionFoundations) {
      const foundation = this._constructionFoundations[a];
      if (
        foundation.isSecured &&
        foundation.isInside(vehicle.state.position) &&
        !foundation.getHasPermission(
          this,
          client.character.characterId,
          ConstructionPermissionIds.VISIT
        ) &&
        (!client.isAdmin || !client.isDebugMode)
      )
        return;
    }
    if (client.hudTimer != null) {
      clearTimeout(client.hudTimer);
      client.hudTimer = null;
    }
    client.character.isRunning = false; // maybe some async stuff make this useless need to test that
    const seatId = vehicle.getNextSeatId(this),
      seat = vehicle.seats[seatId],
      passenger = this._characters[seat];
    if (Number(seatId) < 0) return; // no available seats in vehicle
    client.vehicle.mountedVehicle = vehicle.characterId;
    client.isInAir = false;
    if (passenger) {
      // dismount the driver
      const client = this.getClientByCharId(passenger.characterId);
      !client || this.dismountVehicle(client);
    }
    vehicle.seats[seatId] = client.character.characterId;
    if (seatId === "0") {
      this.takeoverManagedObject(client, vehicle);
      vehicle.checkEngineRequirements(this);
      this.sendData(client, "Vehicle.Owner", {
        guid: vehicle.characterId,
        characterId: client.character.characterId,
        unknownDword1: 0,
        vehicleId: vehicle.vehicleId,
        passengers: [
          {
            characterId: client.character.characterId,
            identity: {
              characterName: client.character.name
            },
            unknownString1: "",
            unknownByte1: 1
          }
        ]
      });

      if (vehicle.getContainer()) {
        client.character.mountContainer(this, vehicle);
      }
    }
    this.sendDataToAllWithSpawnedEntity(
      this._vehicles,
      vehicleGuid,
      "Mount.MountResponse",
      {
        // mounts character
        characterId: client.character.characterId,
        vehicleGuid: vehicle.characterId, // vehicle guid
        seatId: Number(seatId),
        isDriver: seatId === "0" ? 1 : 0, //isDriver
        identity: {}
      }
    );

    this.sendData(client, "Vehicle.Occupy", {
      guid: vehicle.characterId,
      characterId: client.character.characterId,
      vehicleId: vehicle.vehicleId,
      clearLoadout: 0,
      unknownArray1: [
        {
          unknownDword1: 0,
          unknownBoolean1: 0
        }
      ],
      passengers: [
        {
          characterId: client.character.characterId,
          identity: {
            characterName: client.character.name
          }
        }
      ],
      unknownArray2: [{}]
    });
  }

  dismountVehicle(client: Client) {
    if (!client.vehicle.mountedVehicle) return;
    client.enableChecks = false;
    setTimeout(() => {
      client.enableChecks = true;
    }, 5000);
    const vehicle = this._vehicles[client.vehicle.mountedVehicle];
    if (!vehicle) {
      // return if vehicle doesnt exist
      console.log(
        `Error: ${client.character.name} exited non existing vehicle`
      );
      this.sendData(client, "Mount.DismountResponse", {
        characterId: client.character.characterId
      });
      return;
    }
    const seatId = vehicle.getCharacterSeat(client.character.characterId);
    client.character.vehicleExitDate = new Date().getTime();
    if (!seatId) {
      console.log(
        `Error: ${client.character.name} exited vehicle with no seatId set`
      );
      return;
    }
    if (vehicle.vehicleId == VehicleIds.SPECTATE) {
      this.sendData(client, "Mount.DismountResponse", {
        characterId: client.character.characterId
      });
      this.deleteEntity(vehicle.characterId, this._vehicles);
      return;
    }
    vehicle.seats[seatId] = "";
    this.sendDataToAllWithSpawnedEntity(
      this._characters,
      client.character.characterId,
      "Mount.DismountResponse",
      {
        characterId: client.character.characterId
      }
    );
    client.isInAir = false;
    if (seatId === "0" && vehicle.engineOn) {
      vehicle.stopEngine(this);
      vehicle.isLocked = false;
    }
    client.vehicle.mountedVehicle = "";
    this.sendData(client, "Vehicle.Occupy", {
      guid: "",
      characterId: client.character.characterId,
      vehicleId: 0,
      clearLoadout: 1,
      unknownArray1: [
        {
          unknownDword1: 0,
          unknownBoolean1: 0
        }
      ],
      passengers: [],
      unknownArray2: []
    });
    this.sendDataToAllWithSpawnedEntity(
      this._vehicles,
      vehicle.characterId,
      "Vehicle.Owner",
      {
        guid: vehicle.characterId,
        characterId: "",
        unknownDword1: 0,
        vehicleId: 0,
        passengers: []
      }
    );
    client.character.dismountContainer(this);
  }

  changeSeat(client: Client, packet: any) {
    if (!client.vehicle.mountedVehicle) return;
    const vehicle = this._vehicles[client.vehicle.mountedVehicle];
    if (!vehicle) return;
    const seatCount = vehicle.getSeatCount(),
      oldSeatId = vehicle.getCharacterSeat(client.character.characterId);

    const seatId = packet.data.seatId,
      seat = vehicle.seats[seatId],
      passenger = this._characters[seat];
    if (
      seatId < seatCount &&
      (!vehicle.seats[seatId] || !passenger?.isAlive) &&
      oldSeatId
    ) {
      if (passenger && !passenger?.isAlive) {
        const client = this.getClientByCharId(passenger.characterId);
        !client || this.dismountVehicle(client);
      }
      this.sendDataToAllWithSpawnedEntity(
        this._vehicles,
        client.vehicle.mountedVehicle,
        "Mount.SeatChangeResponse",
        {
          characterId: client.character.characterId,
          vehicleGuid: vehicle.characterId,
          identity: {},
          seatId: packet.data.seatId,
          unknownDword2: packet.data.seatId === 0 ? 1 : 0 // if set to 1 the select character will have drive access
        }
      );
      vehicle.seats[oldSeatId] = "";
      vehicle.seats[packet.data.seatId] = client.character.characterId;
      if (oldSeatId === "0" && vehicle.engineOn) {
        vehicle.stopEngine(this);
        client.character.dismountContainer(this);
      }
      if (packet.data.seatId === 0) {
        this.takeoverManagedObject(client, vehicle);
        vehicle.startEngine(this);
        if (vehicle.getContainer()) {
          client.character.mountContainer(this, vehicle);
        }
      }
    }
  }
  //#endregion

  startTimer(client: Client, stringId: number, time: number) {
    this.sendData(client, "ClientUpdate.StartTimer", {
      stringId: stringId,
      time: time
    });
  }

  reloadInterrupt(client: Client, weaponItem: LoadoutItem) {
    if (!weaponItem || !weaponItem.weapon || !weaponItem.weapon.reloadTimer)
      return;
    client.character.clearReloadTimeout();
    this.sendWeaponData(client, "Weapon.Reload", {
      weaponGuid: weaponItem.itemGuid,
      unknownDword1: weaponItem.weapon.ammoCount,
      ammoCount: weaponItem.weapon.ammoCount,
      unknownDword3: weaponItem.weapon.ammoCount,
      currentReloadCount: toHex(++weaponItem.weapon.currentReloadCount)
    });
    this.sendRemoteWeaponUpdateDataToAllOthers(
      client,
      client.character.transientId,
      weaponItem.itemGuid,
      "Update.ReloadInterrupt",
      {}
    );
  }

  combatLog(client: Client) {
    if (client.character.isAlive) {
      this.sendChatText(client, "You must be dead to use combatlog");
      return;
    }
    if (!client.character.getCombatLog().length) {
      this.sendChatText(client, "No combatlog info available");
      return;
    }
    const combatlog = client.character.getCombatLog();
    this.sendChatText(
      client,
      "---------------------------------COMBATLOG:--------------------------------"
    );
    this.sendChatText(
      client,
      `TIME | SOURCE | TARGET | WEAPON | DISTANCE | HITLOCATION | HITPOSITION | OLD HP | NEW HP | PING | ENEMY PING | MESSAGE`
    );
    combatlog.forEach((e) => {
      const time = `${((Date.now() - e.hitInfo.timestamp) / 1000).toFixed(1)}s`,
        source =
          e.source.name == client.character.name
            ? "YOU"
            : e.source.name || "undefined",
        target =
          e.target.name == client.character.name
            ? "YOU"
            : e.target.name || "undefined",
        hitPosition = `[${e.hitInfo.hitPosition[0].toFixed(
          0
        )}, ${e.hitInfo.hitPosition[1].toFixed(
          0
        )}, ${e.hitInfo.hitPosition[2].toFixed(0)}]`,
        oldHp = (e.hitInfo.oldHP / 100).toFixed(1),
        newHp = (e.hitInfo.newHP / 100).toFixed(1),
        ping = `${
          e.source.name == client.character.name ? e.source.ping : e.target.ping
        }ms`,
        enemyPing = `${
          e.source.name == client.character.name ? e.target.ping : e.source.ping
        }ms`;
      this.sendChatText(
        client,
        `${time} ${source} ${target} ${
          this.getItemDefinition(e.hitInfo.weapon || 0)?.MODEL_NAME || "N/A"
        } ${e.hitInfo.distance}m ${
          e.hitInfo.hitLocation
        } ${hitPosition} ${oldHp} ${newHp} ${ping} ${enemyPing} ${
          e.hitInfo.message
        }`
      );
    });
    this.sendChatText(
      client,
      "---------------------------------------------------------------------------------"
    );
  }

  //#region ********************INVENTORY********************   } }

  /**
   * Adds an item to a character's inventory.
   *
   * @param client - The client adding the item.
   * @param item - The item to add.
   * @param containerDefinitionId - The id of the container definition.
   * @param character [character=client.character] - The character to add the item to.
   */
  addItem(
    client: Client,
    item: BaseItem,
    containerDefinitionId: number,
    character: BaseFullCharacter = client.character
  ) {
    if (
      client.character.characterId == character.characterId &&
      !client.character.initialized
    )
      return;
    this.sendData(client, "ClientUpdate.ItemAdd", {
      characterId:
        character instanceof Character || character instanceof Vehicle2016
          ? character.characterId
          : EXTERNAL_CONTAINER_GUID,
      data: character.pGetItemData(this, item, containerDefinitionId)
    });
  }

  /**
   * Generates random equipment for the specified entity and slots (Zombies only).
   * To be deprecated soon
   *
   * @param entity - The entity to generate equipment for.
   * @param slots - The slots to generate equipment for.
   * @param excludedModels [excludedModels=[]] - The excluded equipment models.
   */
  generateRandomEquipmentsFromAnEntity(
    entity: BaseFullCharacter,
    slots: number[],
    excludedModels: string[] = []
  ) {
    slots.forEach((slot) => {
      entity._equipment[slot] = this.generateRandomEquipmentForSlot(
        slot,
        entity.gender,
        excludedModels
      );
    });
  }

  /**
   * Generates random equipment for a specific slot (Zombies only).
   *
   * @param slotId - The ID of the slot.
   * @param gender - The gender of the entity.
   * @param excludedModels [excludedModels=[]] - The excluded equipment models.
   * @returns The generated equipment.
   */
  generateRandomEquipmentForSlot(
    slotId: number,
    gender: number,
    excludedModels: string[] = []
  ) {
    const models = equipmentModelTexturesMapping[slotId];
    if (excludedModels.length) {
      for (const model in models) {
        if (excludedModels.includes(model)) {
          delete models[model];
        }
      }
    }
    const model = getRandomKeyFromAnObject(models);
    const skins = equipmentModelTexturesMapping[slotId][model];
    let skin;
    if (skins) {
      skin = getRandomFromArray(skins);
    } else {
      skin = "";
    }
    return {
      modelName: model.replace("<gender>", gender == 1 ? "Male" : "Female"),
      slotId,
      textureAlias: skin,
      guid: toBigHex(this.generateItemGuid())
    };
  }

  /**
   * Gets the item definition for a given itemDefinitionId.
   *
   * @param {number} [itemDefinitionId] - The ID of the item definition to retrieve.
   * @returns {ItemDefinition|undefined} The item definition or undefined.
   */
  getItemDefinition(itemDefinitionId?: number) {
    if (!itemDefinitionId) return;
    return this._itemDefinitions[itemDefinitionId];
  }

  /**
   * Gets the weapon definition for a given weaponDefinitionId.
   *
   * @param {number} weaponDefinitionId - The ID of the weapon definition to retrieve.
   * @returns {WeaponDefinition|undefined} The weapon definition or undefined.
   */
  getWeaponDefinition(weaponDefinitionId: number) {
    if (!weaponDefinitionId) return;
    return this._weaponDefinitions[weaponDefinitionId]?.DATA;
  }

  /**
   * Gets the firegroup definition for a given firegroupId.
   *
   * @param {number} firegroupId - The ID of the firegroup definition to retrieve.
   * @returns {FiregroupDefinition|undefined} The firegroup definition or undefined.
   */
  getFiregroupDefinition(firegroupId: number) {
    return this._firegroupDefinitions[firegroupId]?.DATA;
  }

  /**
   * Gets the firemode definition for a given firemodeId.
   *
   * @param {number} firemodeId - The ID of the firemode definition to retrieve.
   * @returns {FiremodeDefinition|undefined} The firemode definition or undefined.
   */
  getFiremodeDefinition(firemodeId: number) {
    return this._firemodeDefinitions[firemodeId]?.DATA.DATA;
  }

  /**
   * Gets the ammoId for a given weapon.
   *
   * @param {number} itemDefinitionId - The itemDefinitionId of the weapon.
   * @returns {number} The ammoId (0 if undefined).
   */
  getWeaponAmmoId(itemDefinitionId: number): number {
    const itemDefinition = this.getItemDefinition(itemDefinitionId),
      weaponDefinition = this.getWeaponDefinition(itemDefinition?.PARAM1),
      firegroupDefinition = this.getFiregroupDefinition(
        weaponDefinition?.FIRE_GROUPS[0]?.FIRE_GROUP_ID
      ),
      firemodeDefinition = this.getFiremodeDefinition(
        firegroupDefinition?.FIRE_MODES[0]?.FIRE_MODE_ID
      );

    return firemodeDefinition?.AMMO_ITEM_ID || 0;
  }

  /**
   * Gets the reload time in milliseconds for a given weapon.
   *
   * @param {number} itemDefinitionId - The itemDefinitionId of the weapon.
   * @returns {number} The reload time in milliseconds (0 if undefined).
   */
  getWeaponReloadTime(itemDefinitionId: number): number {
    const itemDefinition = this.getItemDefinition(itemDefinitionId),
      weaponDefinition = this.getWeaponDefinition(itemDefinition?.PARAM1),
      firegroupDefinition = this.getFiregroupDefinition(
        weaponDefinition?.FIRE_GROUPS[0]?.FIRE_GROUP_ID
      ),
      firemodeDefinition = this.getFiremodeDefinition(
        firegroupDefinition?.FIRE_MODES[0]?.FIRE_MODE_ID
      );

    return firemodeDefinition?.RELOAD_TIME_MS || 0;
  }

  /**
   * Gets the clip size for a given weapon.
   *
   * @param {number} itemDefinitionId - The itemDefinitionId of the weapon.
   * @returns {number} The clip size (0 if undefined).
   */
  getWeaponClipSize(itemDefinitionId: number): number {
    const itemDefinition = this.getItemDefinition(itemDefinitionId),
      weaponDefinition = this.getWeaponDefinition(itemDefinition?.PARAM1);

    return weaponDefinition.AMMO_SLOTS[0]?.CLIP_SIZE || 0;
  }

  /**
   * Gets the maximum amount of ammo a clip can hold for a given weapon.
   *
   * @param {number} itemDefinitionId - The itemDefinitionId of the weapon.
   * @returns {number} The maximum ammo (0 if undefined).
   */
  getWeaponMaxAmmo(itemDefinitionId: number): number {
    const itemDefinition = this.getItemDefinition(itemDefinitionId),
      weaponDefinition = this.getWeaponDefinition(itemDefinition?.PARAM1);

    return weaponDefinition.AMMO_SLOTS[0]?.CLIP_SIZE || 0;
  }

  /**
   * Gets the container definition for a given containerDefinitionId.
   *
   * @param {any} containerDefinitionId - The id of the container definition to retrieve.
   * @returns {ContainerDefinition} The container definition.
   */
  getContainerDefinition(containerDefinitionId: any) {
    if (this._containerDefinitions[containerDefinitionId]) {
      return this._containerDefinitions[containerDefinitionId];
    } else {
      console.log(
        `Tried to get containerDefinition for invalid containerDefinitionId ${containerDefinitionId}`
      );
      return this._containerDefinitions[119];
    }
  }

  /**
   * Gets the maximum value for a given resource.
   *
   * @param {ResourceIds} resourceId - The ID of the resource.
   * @returns {number} The maximum value of the resource (0 if undefined).
   */
  getResourceMaxValue(resourceId: ResourceIds): number {
    if (!resourceDefinitions[resourceId]) return 0;
    return resourceDefinitions[resourceId].MAX_VALUE || 0;
  }

  /**
   * Generates and returns an unused itemGuid.
   *
   * @returns {bigint} The generated itemGuid.
   */
  generateItemGuid(): bigint {
    return ++this.lastItemGuid;
  }

  /**
   * Generates a new item with the specified itemDefinitionId and count.
   *
   * @param {number} itemDefinitionId - The itemDefinitionId of the item to generate.
   * @param {number} [count=1] - The count of the item.
   * @returns {BaseItem|undefined} The generated item, or undefined if the item definition is invalid.
   */
  generateItem(
    itemDefinitionId: number,
    count: number = 1
  ): BaseItem | undefined {
    if (!this.getItemDefinition(itemDefinitionId)) {
      debug(
        `[ERROR] GenerateItem: Invalid item definition: ${itemDefinitionId}`
      );
      return;
    }
    const generatedGuid = toBigHex(this.generateItemGuid());
    let durability: number = 2000;
    switch (true) {
      case this.isWeapon(itemDefinitionId):
        durability = 2000;
        break;
      case this.isArmor(itemDefinitionId):
        durability = 1000;
        break;
      case this.isHelmet(itemDefinitionId):
        durability = 100;
        break;
    }
    if (
      itemDefinitionId == Items.WEAPON_REAPER ||
      itemDefinitionId == Items.WEAPON_NAGAFENS_RAGE ||
      itemDefinitionId == Items.WEAPON_FROSTBITE ||
      itemDefinitionId == Items.WEAPON_BLAZE
    ) {
      durability = 1000;
    }
    const itemData: BaseItem = new BaseItem(
      itemDefinitionId,
      generatedGuid,
      durability,
      count
    );
    if (this.isWeapon(itemDefinitionId)) {
      itemData.weapon = new Weapon(itemData);
    }
    return itemData;
  }

  /**
   * Checks if an item with the specified itemDefinitionId is a weapon.
   *
   * @param {number} itemDefinitionId - The itemDefinitionId to check.
   * @returns {boolean} True if the item is a weapon, false otherwise.
   */
  isWeapon(itemDefinitionId: number): boolean {
    return this.getItemDefinition(itemDefinitionId)?.ITEM_TYPE == 20;
  }

  /**
   * Checks if an item with the specified itemDefinitionId is a container.
   *
   * @param {number} itemDefinitionId - The itemDefinitionId to check.
   * @returns {boolean} True if the item is a container, false otherwise.
   */
  isContainer(itemDefinitionId: number): boolean {
    return this.getItemDefinition(itemDefinitionId)?.ITEM_TYPE == 34;
  }

  /**
   * Checks if an item with the specified itemDefinitionId is an armor.
   *
   * @param {number} itemDefinitionId - The itemDefinitionId to check.
   * @returns {boolean} True if the item is an armor, false otherwise.
   */
  isArmor(itemDefinitionId: number): boolean {
    return (
      this.getItemDefinition(itemDefinitionId)?.DESCRIPTION_ID == 12073 ||
      this.getItemDefinition(itemDefinitionId)?.DESCRIPTION_ID == 11151 ||
      this.getItemDefinition(itemDefinitionId)?.DESCRIPTION_ID == 11153
    );
  }

  /**
   * Checks if an item with the specified itemDefinitionId is a helmet.
   *
   * @param {number} itemDefinitionId - The itemDefinitionId to check.
   * @returns {boolean} True if the item is a helmet, false otherwise.
   */
  isHelmet(itemDefinitionId: number): boolean {
    return (
      this.getItemDefinition(itemDefinitionId)?.DESCRIPTION_ID == 9945 ||
      this.getItemDefinition(itemDefinitionId)?.DESCRIPTION_ID == 12994 ||
      this.getItemDefinition(itemDefinitionId)?.DESCRIPTION_ID == 9114 ||
      this.getItemDefinition(itemDefinitionId)?.DESCRIPTION_ID == 9945
    );
  }

  /**
   * Checks if an item with the specified itemDefinitionId is stackable.
   *
   * @param {number} itemDefinitionId - The itemDefinitionId to check.
   * @returns {boolean} True if the item is stackable, false otherwise.
   */
  isStackable(itemDefinitionId: number): boolean {
    return this.getItemDefinition(itemDefinitionId)?.MAX_STACK_SIZE > 1
      ? true
      : false;
  }

  /**
   * Validates if an item can be equipped in the specified equipment slot.
   *
   * @param {number} itemDefinitionId - The itemDefinitionId of the item to validate.
   * @param {number} equipmentSlotId - The equipment slot ID.
   * @returns {boolean} True if the item can be equipped in the slot, false otherwise.
   */
  validateEquipmentSlot(itemDefinitionId: number, equipmentSlotId: number) {
    // only for weapons at the moment
    if (!this.getItemDefinition(itemDefinitionId)?.FLAG_CAN_EQUIP) return false;
    return !!equipSlotItemClasses.find(
      (slot: any) =>
        slot.ITEM_CLASS ===
          this.getItemDefinition(itemDefinitionId).ITEM_CLASS &&
        equipmentSlotId === slot.EQUIP_SLOT_ID
    );
  }

  /**
   * Validates that a given itemDefinitionId can be equipped in a given loadout slot.
   *
   * @param {number} itemDefinitionId - The definition ID of an item to validate.
   * @param {number} loadoutSlotId - The loadoutSlotId to have the item validated for.
   * @param {number} loadoutId - The loadoutId of the entity to get the slot for.
   * @returns {boolean} Returns true/false if the item can go in a specified loadout slot.
   */
  validateLoadoutSlot(
    itemDefinitionId: number,
    loadoutSlotId: number,
    loadoutId: number
  ): boolean {
    //return true; // debug
    if (!this.getItemDefinition(itemDefinitionId)?.FLAG_CAN_EQUIP) return false;
    return !!loadoutSlotItemClasses.find(
      (slot: any) =>
        slot.ITEM_CLASS ==
          this.getItemDefinition(itemDefinitionId).ITEM_CLASS &&
        loadoutSlotId == slot.SLOT &&
        slot.LOADOUT_ID == loadoutId
    );
  }

  /**
   * Gets the first loadout slot that a specified item is able to go into.
   *
   * @param {number} itemDefId - The definition ID of an item to check.
   * @param {number} [loadoutId=LoadoutIds.CHARACTER] - Optional: The loadoutId of the entity to get the slot for, default LoadoutIds.CHARACTER.
   * @returns {number} Returns the ID of the first loadout slot that an item can go into (occupied or not).
   */
  getLoadoutSlot(itemDefId: number, loadoutId: number = LoadoutIds.CHARACTER) {
    const itemDef = this.getItemDefinition(itemDefId),
      loadoutSlotItemClass = loadoutSlotItemClasses.find(
        (slot: any) =>
          slot.ITEM_CLASS == itemDef.ITEM_CLASS && loadoutId == slot.LOADOUT_ID
      );
    return loadoutSlotItemClass?.SLOT || 0;
  }

  /**
   * Switches the loadout slot for a client.
   *
   * @param {Client} client - The client to switch the loadout slot for.
   * @param {LoadoutItem} loadoutItem - The new loadout item.
   */
  switchLoadoutSlot(client: Client, loadoutItem: LoadoutItem) {
    const oldLoadoutSlot = client.character.currentLoadoutSlot;
    this.reloadInterrupt(client, client.character._loadout[oldLoadoutSlot]);
    // remove passive equip
    this.clearEquipmentSlot(
      client.character,
      client.character.getActiveEquipmentSlot(loadoutItem)
    );
    client.character.currentLoadoutSlot = loadoutItem.slotId;
    client.character.equipItem(this, loadoutItem, true, loadoutItem.slotId);

    // equip passive slot
    client.character.equipItem(
      this,
      client.character._loadout[oldLoadoutSlot],
      true,
      oldLoadoutSlot
    );
    if (loadoutItem.weapon) loadoutItem.weapon.currentReloadCount = 0;
    if (this.isWeapon(loadoutItem.itemDefinitionId)) {
      this.sendRemoteWeaponUpdateDataToAllOthers(
        client,
        client.character.transientId,
        loadoutItem.itemGuid,
        "Update.SwitchFireMode",
        {
          firegroupIndex: 0,
          firemodeIndex: 0
        }
      );

      this.sendDataToAllOthersWithSpawnedEntity(
        this._characters,
        client,
        client.character.characterId,
        "Character.WeaponStance",
        {
          characterId: client.character.characterId,
          stance: client.character.weaponStance
        }
      );
    }
  }

  /**
   * Clears a character's equipment slot.
   *
   * @param {BaseFullCharacter} character - The character to have their equipment slot cleared.
   * @param {number} equipmentSlotId - The equipment slot to clear.
   * @param {boolean} [sendPacket=true] - Optional: Specifies whether to send a packet to other clients, default is true.
   * @returns {boolean} Returns true if the slot was cleared, false if the slot is invalid.
   */
  clearEquipmentSlot(
    character: BaseFullCharacter,
    equipmentSlotId: number,
    sendPacket = true
  ): boolean {
    if (!equipmentSlotId) return false;
    delete character._equipment[equipmentSlotId];

    const client = this.getClientByContainerAccessor(character);
    if (!client) return true;

    if (client.character.initialized && sendPacket) {
      this.sendDataToAllWithSpawnedEntity(
        this._characters,
        client.character.characterId,
        "Equipment.UnsetCharacterEquipmentSlot",
        {
          characterData: {
            characterId: client.character.characterId
          },
          slotId: equipmentSlotId
        }
      );
    }
    if (equipmentSlotId === EquipSlots.RHAND) {
      client.character.currentLoadoutSlot = LoadoutSlots.FISTS;
      client.character.equipItem(
        this,
        client.character._loadout[LoadoutSlots.FISTS]
      ); //equip fists
    }
    return true;
  }

  /**
   * Removes an item from the loadout.
   *
   * @param {BaseFullCharacter} character - The character to have their items removed.
   * @param {number} loadoutSlotId - The loadout slot containing the item to remove.
   * @param {boolean} [updateEquipment=true] - Optional: Specifies whether to update the equipment, default is true.
   * @returns {boolean} Returns true if the item was successfully removed, false if there was an error.
   */
  removeLoadoutItem(
    character: BaseFullCharacter,
    loadoutSlotId: number,
    updateEquipment: boolean = true
  ): boolean {
    const item = character._loadout[loadoutSlotId],
      itemDefId = item?.itemDefinitionId; // save before item gets deleted

    if (!item || !itemDefId) return false;

    const client = this.getClientByContainerAccessor(character);

    if (client && this.isWeapon(item.itemDefinitionId)) {
      this.sendRemoteWeaponDataToAllOthers(
        client,
        client.character.transientId,
        "RemoteWeapon.RemoveWeapon",
        {
          guid: item.itemGuid
        }
      );
    }
    if (client) this.deleteItem(character, item.itemGuid);
    delete character._loadout[loadoutSlotId];
    character.updateLoadout(this);
    if (updateEquipment) {
      this.clearEquipmentSlot(
        character,
        character.getActiveEquipmentSlot(item)
      );
    }
    if (client) this.checkConveys(client);
    if (this.getItemDefinition(itemDefId).ITEM_TYPE === 34) {
      delete character._containers[loadoutSlotId];
      if (client) this.initializeContainerList(client);
    }
    return true;
  }

  /**
   * Returns a client object by either the characterId of the passed character,
   * or the mountedCharacterId if the passed character is a BaseLootableEntity.
   *
   * @param {BaseFullCharacter | BaseLootableEntity} character - Either a Character or BaseLootableEntity to retrieve its accessing client.
   * @returns {Client | undefined} Returns client or undefined.
   */
  getClientByContainerAccessor(character: BaseFullCharacter) {
    let client: Client | undefined = this.getClientByCharId(
      character.characterId
    );
    if (!client && character instanceof BaseLootableEntity) {
      client = this.getClientByCharId(character.mountedCharacter || "");
    }
    return client;
  }

  /**
   * Removes items from a specific item stack in a container.
   *
   * @param {BaseFullCharacter} character - The character to have their items removed.
   * @param {BaseItem} item - The item object.
   * @param {LoadoutContainer} container - The container that has the item stack in it.
   * @param {number} [count] - Optional: The number of items to remove from the stack, default 1.
   * @returns {boolean} Returns true if the items were successfully removed, false if there was an error.
   */
  removeContainerItem(
    character: BaseFullCharacter,
    item?: BaseItem,
    container?: LoadoutContainer,
    count?: number
  ): boolean {
    if (item) item.debugFlag = "removeContainerItem";
    const client = this.getClientByContainerAccessor(character);
    if (!container || !item) return false;
    if (!count) count = item.stackCount;
    if (item.stackCount == count) {
      delete container.items[item.itemGuid];
      if (client) this.deleteItem(character, item.itemGuid);
    } else if (item.stackCount > count) {
      item.stackCount -= count;
      if (client) this.updateContainerItem(character, item, container);
    } else {
      // if count > removeItem.stackCount
      return false;
    }
    if (client) this.updateContainer(character, container);
    return true;
  }

  /**
   * Removes items from a specific item stack in the inventory, including containers and loadout.
   *
   * @param {BaseFullCharacter} character - The character to have their items removed.
   * @param {BaseItem} item - The item object.
   * @param {number} [count=1] - Optional: The number of items to remove from the stack, default 1.
   * @param {boolean} [updateEquipment=true] - Optional: Specifies whether to update the equipment, default is true.
   * @returns {boolean} Returns true if the items were successfully removed, false if there was an error.
   */
  removeInventoryItem(
    character: BaseFullCharacter,
    item: BaseItem,
    count: number = 1,
    updateEquipment: boolean = true
  ): boolean {
    item.debugFlag = "removeInventoryItem";
    if (count > item.stackCount) {
      console.error(
        `RemoveInventoryItem: Not enough items in stack! Count ${count} > Stackcount ${item.stackCount}`
      );
      count = item.stackCount;
    }

    if (character._loadout[item.slotId]?.itemGuid == item.itemGuid) {
      return this.removeLoadoutItem(character, item.slotId, updateEquipment);
    } else {
      return this.removeContainerItem(
        character,
        item,
        character.getItemContainer(item.itemGuid),
        count
      );
    }
  }

  /**
   * Removes a specified amount of an item across all inventory containers /
   * loadout (LOADOUT DISABLED FOR NOW).
   * @param client The client to have its items removed.
   * @param itemDefinitionId The itemDefinitionId of the item(s) to be removed.
   * @param requiredCount Optional: The number of items to remove, default 1.
   * @returns Returns true if all items were successfully removed, false if there was an error.
   */
  removeInventoryItems(
    client: Client,
    itemDefinitionId: number,
    requiredCount: number = 1
  ): boolean {
    const loadoutSlotId = 0; //this.getActiveLoadoutSlot(client, itemDefinitionId);
    // loadout disabled for now
    if (
      client.character._loadout[loadoutSlotId]?.itemDefinitionId ==
      itemDefinitionId
    ) {
      // todo: check multiple loadout slots for items
      return this.removeLoadoutItem(client.character, loadoutSlotId);
    } else {
      const removeItems: {
        container: LoadoutContainer;
        item: BaseItem;
        count: number;
      }[] = [];
      for (const container of Object.values(client.character._containers)) {
        if (!requiredCount) break;
        for (const item of Object.values(container.items)) {
          if (item.itemDefinitionId == itemDefinitionId) {
            if (item.stackCount >= requiredCount) {
              removeItems.push({ container, item, count: requiredCount });
              requiredCount = 0;
              break;
            } else {
              removeItems.push({ container, item, count: item.stackCount });
              requiredCount -= item.stackCount;
            }
          }
        }
      }
      if (requiredCount) {
        // inventory doesn't have enough items
        return false;
      }
      for (const itemStack of Object.values(removeItems)) {
        if (
          !this.removeContainerItem(
            client.character,
            itemStack.item,
            itemStack.container,
            itemStack.count
          )
        ) {
          return false;
        }
      }
      return true;
    }
  }

  /**
   * Removes a single item type from the inventory and spawns it on the ground
   * @param client The client to have its item dropped.
   * @param item The item object.
   * @param count Optional: The number of items to drop on the ground, default 1.
   */
  dropItem(
    character: BaseFullCharacter,
    item: BaseItem,
    count: number = 1
  ): void {
    const client = this.getClientByContainerAccessor(character);

    if (!client) return;

    item.debugFlag = "dropItem";
    if (!item) {
      this.containerError(client, ContainerErrors.NO_ITEM_IN_SLOT);
      return;
    }
    let dropItem: BaseItem | undefined;
    if (item.stackCount == count) {
      dropItem = item;
    } else if (item.stackCount > count) {
      dropItem = this.generateItem(item.itemDefinitionId, count);
    } else {
      return;
    }
    if (!this.removeInventoryItem(character, item, count)) return;
    this.sendData(client, "Character.DroppedIemNotification", {
      characterId: client.character.characterId,
      itemDefId: item.itemDefinitionId,
      count: count
    });
    if (dropItem && dropItem.weapon) {
      const ammo = this.generateItem(
        this.getWeaponAmmoId(dropItem.itemDefinitionId),
        dropItem.weapon.ammoCount
      );
      if (
        ammo &&
        dropItem.weapon.ammoCount > 0 &&
        dropItem.weapon.itemDefinitionId != Items.WEAPON_REMOVER
      ) {
        client.character.lootContainerItem(this, ammo, ammo.stackCount, true);
      }
      dropItem.weapon.ammoCount = 0;
    }
    const obj = this.worldObjectManager.createLootEntity(
      this,
      dropItem,
      client.character.state.position,
      new Float32Array([0, Number(Math.random() * 10 - 5), 0, 1])
    );

    if (!obj) return;
    for (const a in this._clients) {
      const c = this._clients[a];
      if (
        isPosInRadius(
          obj.npcRenderDistance
            ? obj.npcRenderDistance
            : this.charactersRenderDistance,
          obj.state.position,
          c.character.state.position
        )
      ) {
        c.spawnedEntities.push(obj);
        this.addLightweightNpc(c, obj);
      }
    }
  }

  pickupItem(client: Client, guid: string) {
    const object = this._spawnedItems[guid],
      item: BaseItem = object.item;
    if (!item) {
      this.sendChatText(client, `[ERROR] Invalid item`);
      return;
    }
    this.sendCompositeEffectToAllWithSpawnedEntity(
      this._spawnedItems,
      object,
      this.getItemDefinition(item.itemDefinitionId).PICKUP_EFFECT ?? 5151
    );

    client.character.lootItem(this, item);

    if (
      item.itemDefinitionId === Items.FUEL_BIOFUEL ||
      item.itemDefinitionId === Items.FUEL_ETHANOL
    ) {
      this.deleteEntity(object.characterId, this._explosives);
    }
    this.deleteEntity(guid, this._spawnedItems);
    delete this.worldObjectManager.spawnedLootObjects[object.spawnerId];
  }

  sendWeaponReload(
    client: Client,
    weaponItem: LoadoutItem,
    ammoCount?: number
  ) {
    if (!weaponItem.weapon) return;
    const maxAmmo = this.getWeaponMaxAmmo(weaponItem.itemDefinitionId);
    this.sendWeaponData(client, "Weapon.Reload", {
      weaponGuid: weaponItem.itemGuid,
      unknownDword1: maxAmmo,
      ammoCount: ammoCount || weaponItem.weapon.ammoCount,
      unknownDword3: maxAmmo,
      currentReloadCount: toHex(++weaponItem.weapon.currentReloadCount)
    });
  }

  deleteItem(character: BaseFullCharacter, itemGuid: string) {
    const client = this.getClientByContainerAccessor(character);
    if (!client || !client.character.initialized) return;

    this.sendData(client, "ClientUpdate.ItemDelete", {
      characterId:
        character instanceof Character || character instanceof Vehicle2016
          ? character.characterId
          : EXTERNAL_CONTAINER_GUID,
      itemGuid: itemGuid
    });
  }

  initializeContainerList(
    client: Client,
    character: BaseFullCharacter = client.character
  ): void {
    const characterId =
      character instanceof Character || character instanceof Vehicle2016
        ? character.characterId
        : EXTERNAL_CONTAINER_GUID;
    this.sendData(client, "Container.InitEquippedContainers", {
      ignore: characterId,
      characterId: characterId,
      containers: character.pGetContainers(this)
    });
  }

  addContainerItem(
    character: BaseFullCharacter,
    item: BaseItem | undefined,
    container: LoadoutContainer,
    sendUpdate: boolean = true
  ) {
    if (!item) return;

    const itemDefId = item.itemDefinitionId,
      client = this.getClientByContainerAccessor(character);
    item.slotId = Object.keys(container.items).length;
    item.containerGuid = container.itemGuid;
    container.items[item.itemGuid] = item;

    if (!client) return;
    if (item.weapon) {
      clearTimeout(item.weapon.reloadTimer);
      delete item.weapon.reloadTimer;
    }
    this.addItem(
      client,
      container.items[item.itemGuid],
      container.containerDefinitionId,
      character
    );
    this.updateContainer(character, container);
    if (sendUpdate && client.character.initialized) {
      this.sendData(client, "Reward.AddNonRewardItem", {
        itemDefId: itemDefId,
        iconId: this.getItemDefinition(itemDefId).IMAGE_SET_ID,
        count: item.stackCount
      });
    }
  }

  updateLoadoutItem(client: Client, item: LoadoutItem) {
    this.sendData(client, "ClientUpdate.ItemUpdate", {
      characterId: client.character.characterId,
      data: client.character.pGetItemData(this, item, LOADOUT_CONTAINER_ID)
    });
    //this.updateLoadout(client.character);
  }

  updateContainer(character: BaseFullCharacter, container: LoadoutContainer) {
    const client = this.getClientByContainerAccessor(character);
    if (!client || !client.character.initialized) return;
    this.sendData(client, "Container.UpdateEquippedContainer", {
      ignore: character.characterId,
      characterId: character.characterId,
      containerData: character.pGetContainerData(this, container)
    });
  }

  updateContainerItem(
    character: BaseFullCharacter,
    item: BaseItem,
    container: LoadoutContainer
  ) {
    const client = this.getClientByContainerAccessor(character);
    if (!client || !client.character.initialized) return;
    this.sendData(client, "ClientUpdate.ItemUpdate", {
      characterId:
        character instanceof Character || character instanceof Vehicle2016
          ? character.characterId
          : EXTERNAL_CONTAINER_GUID,
      data: character.pGetItemData(this, item, container.containerDefinitionId)
    });
    this.updateContainer(character, container);
  }

  /**
   * Clears all items from a character's inventory.
   * @param client The client that'll have it's character's inventory cleared.
   */
  clearInventory(client: Client, updateEquipment = true) {
    for (const item of Object.values(client.character._loadout)) {
      if (client.character._containers[item.slotId]) {
        const container = client.character._containers[item.slotId];
        for (const item of Object.values(container.items)) {
          this.removeInventoryItem(client.character, item, item.stackCount);
        }
      }
      if (item.slotId != LoadoutSlots.FISTS && item.itemDefinitionId) {
        this.removeInventoryItem(
          client.character,
          item,
          item.stackCount,
          updateEquipment
        );
      }
    }
  }

  isAdminItem(itemDefinitionId: Items): boolean {
    switch (itemDefinitionId) {
      case Items.WEAPON_REMOVER:
      case Items.FANNY_PACK_DEV:
        return true;
      default:
        return false;
    }
  }

  useAirdrop(client: Client, item: BaseItem) {
    if (this._airdrop) {
      this.sendAlert(client, "All planes are busy.");
      return;
    }

    if (
      _.size(this._clients) < this.worldObjectManager.minAirdropSurvivors &&
      !this._soloMode
    ) {
      this.sendAlert(client, "No planes ready. Not enough survivors.");
      return;
    }
    let blockedArea = false;
    for (const a in this._constructionFoundations) {
      if (
        isPosInRadius(
          50,
          this._constructionFoundations[a].state.position,
          client.character.state.position
        )
      ) {
        blockedArea = true;
        break;
      }
    }

    if (client.currentPOI || blockedArea) {
      this.sendAlert(client, "You are too close to the restricted area.");
      return;
    }

    if (
      item.itemDefinitionId != Items.AIRDROP_CODE ||
      !this.removeInventoryItem(client.character, item)
    )
      return;
    this.sendAlert(client, "You have called an airdrop.");
    const pos = new Float32Array([
      client.character.state.position[0],
      400,
      client.character.state.position[2],
      1
    ]);
    const angle = getAngle(
      client.character.state.position,
      new Float32Array([0, 0, 0, 0])
    );
    const distance =
      5000 +
      getDistance2d(
        client.character.state.position,
        new Float32Array([0, 0, 0, 0])
      );
    const moved = movePoint(pos, angle, distance);
    const moved2 = movePoint(moved, angle, 1500);
    const characterId = this.generateGuid();
    const characterId2 = this.generateGuid();
    const characterId3 = this.generateGuid();
    const characterId4 = this.generateGuid();
    const characterId5 = this.generateGuid();
    const plane = new Plane(
      characterId,
      this.getTransientId(characterId),
      0,
      moved,
      client.character.state.lookAt,
      this,
      this.getGameTime(),
      VehicleIds.OFFROADER
    );
    const cargo = new Plane(
      characterId4,
      this.getTransientId(characterId4),
      0,
      new Float32Array([pos[0], pos[1] - 20, pos[2], 1]),
      client.character.state.lookAt,
      this,
      this.getGameTime(),
      VehicleIds.PICKUP
    );
    this._airdrop = {
      plane: plane,
      cargo: cargo,
      planeTarget: characterId2,
      planeTargetPos: moved2,
      cargoTarget: characterId5,
      cargoTargetPos: new Float32Array([pos[0], pos[1] + 100, pos[2], 1]),
      destination: characterId3,
      destinationPos: client.character.state.position,
      cargoSpawned: false,
      containerSpawned: false
    };
    let choosenClient: Client | undefined;
    let currentDistance = 999999;
    for (const a in this._clients) {
      const client = this._clients[a];
      if (
        !choosenClient ||
        currentDistance >
          getDistance2d(
            client.character.state.position,
            this._airdrop.plane.state.position
          )
      ) {
        choosenClient = client;
        currentDistance = getDistance2d(
          client.character.state.position,
          this._airdrop.plane.state.position
        );
      }
    }
    this._airdrop.manager = choosenClient;
    for (const a in this._clients) {
      if (!this._clients[a].isLoading) {
        this.airdropManager(this._clients[a], true);
      }
    }
    setTimeout(() => {
      if (this._airdrop && this._airdrop.plane.characterId == characterId) {
        for (const a in this._clients) {
          if (!this._clients[a].isLoading) {
            this.airdropManager(this._clients[a], false);
          }
        }
        delete this._airdrop;
      }
    }, 600000);
  }

  useConsumable(client: Client, item: BaseItem) {
    const itemDef = this.getItemDefinition(item.itemDefinitionId);
    if (!itemDef) return;
    let doReturn = true;
    let drinkCount = 0;
    let eatCount = 0;
    let staminaCount = 0;
    let givetrash = 0;
    let healCount = 0;
    let bandagingCount = 0;
    let timeout = 0;
    let healType: HealTypes;
    for (const a in UseOptions) {
      if (
        UseOptions[a].itemDef == item.itemDefinitionId &&
        (UseOptions[a].type == ItemUseOptions.EAT ||
          UseOptions[a].type == ItemUseOptions.DRINK ||
          UseOptions[a].type == ItemUseOptions.USE_MEDICAL)
      ) {
        const useOption = UseOptions[a];
        doReturn = false;
        timeout = useOption.timeout;
        if (useOption.drinkCount) drinkCount = useOption.drinkCount;
        if (useOption.eatCount) eatCount = useOption.eatCount;
        if (useOption.staminaCount) staminaCount = useOption.staminaCount;
        if (useOption.givetrash) givetrash = useOption.givetrash;
        if (useOption.healCount) healCount = useOption.healCount;
        if (useOption.bandagingCount) bandagingCount = useOption.bandagingCount;
        if (useOption.healType) healType = useOption.healType;
      }
    }
    if (doReturn) {
      this.sendChatText(
        client,
        "[ERROR] consumable not mapped to item Definition " +
          item.itemDefinitionId
      );
      return;
    }

    this.utilizeHudTimer(client, itemDef.NAME_ID, timeout, () => {
      this.useComsumablePass(
        client,
        item,
        eatCount,
        drinkCount,
        staminaCount,
        givetrash,
        healCount,
        bandagingCount,
        healType
      );
    });
  }

  taskOptionPass(
    client: Client,
    removedItem: BaseItem,
    rewardItems: { itemDefinitionId: number; count: number }[]
  ) {
    if (!this.removeInventoryItem(client.character, removedItem)) return;
    rewardItems.forEach(
      (itemInstance: { itemDefinitionId: number; count: number }) => {
        const item = this.generateItem(
          itemInstance.itemDefinitionId,
          itemInstance.count
        );
        client.character.lootContainerItem(this, item);
      }
    );
  }

  igniteOption(client: Client, item: BaseItem) {
    const itemDef = this.getItemDefinition(item.itemDefinitionId);
    if (!itemDef) return;
    let timeout = 0;
    let doReturn = true;
    for (const a in UseOptions) {
      if (
        UseOptions[a].itemDef == item.itemDefinitionId &&
        UseOptions[a].type == ItemUseOptions.IGNITE
      ) {
        const useOption = UseOptions[a];
        doReturn = false;
        timeout = useOption.timeout;
      }
    }
    if (doReturn) {
      this.sendChatText(
        client,
        "[ERROR] use option not mapped to item Definition " +
          item.itemDefinitionId
      );
      return;
    }
    this.utilizeHudTimer(client, itemDef.NAME_ID, timeout, () => {
      this.igniteoptionPass(client);
    });
  }

  taskOption(
    client: Client,
    timeout: number,
    nameId: number,
    removedItem: BaseItem,
    rewardItems: { itemDefinitionId: number; count: number }[]
  ) {
    this.utilizeHudTimer(client, nameId, timeout, () => {
      this.taskOptionPass(client, removedItem, rewardItems);
    });
  }

  fillPass(client: Client, item: BaseItem) {
    if (client.character.characterStates.inWater) {
      if (!this.removeInventoryItem(client.character, item)) return;
      client.character.lootContainerItem(this, this.generateItem(1368)); // give dirty water
    } else {
      this.sendAlert(client, "There is no water source nearby");
    }
  }

  sniffPass(client: Client, item: BaseItem) {
    if (!this.removeInventoryItem(client.character, item)) return;
    this.applyMovementModifier(client, MovementModifiers.SWIZZLE);
  }

  fertilizePlants(client: Client, item: BaseItem) {
    if (!this.removeInventoryItem(client.character, item)) return;
    for (const characterId in this._temporaryObjects) {
      const object = this._temporaryObjects[characterId];
      if (
        object instanceof PlantingDiameter &&
        isPosInRadius(3, object.state.position, client.character.state.position)
      ) {
        object.isFertilized = true;
        object.fertilizedTimestamp = new Date().getTime() + 86400000; // + 1 day
        Object.values(object.seedSlots).forEach((plant) => {
          if (plant.isFertilized) return;
          plant.isFertilized = true;
          const roz = (plant.nextStateTime - new Date().getTime()) / 2;
          plant.nextStateTime = new Date().getTime() + roz;
          this.sendDataToAllWithSpawnedEntity(
            // play burning effect & remove it after 15s
            this._plants,
            plant.characterId,
            "Command.PlayDialogEffect",
            {
              characterId: plant.characterId,
              effectId: 5056
            }
          );
        });
      }
    }
  }

  useItem(client: Client, item: BaseItem) {
    const itemDef = this.getItemDefinition(item.itemDefinitionId);
    if (!itemDef) return;
    const nameId = itemDef.NAME_ID;
    let timeout = 0;
    let useoption = "";
    let doReturn = true;
    for (const a in UseOptions) {
      if (
        UseOptions[a].itemDef == item.itemDefinitionId &&
        UseOptions[a].type == ItemUseOptions.USE
      ) {
        const useOption = UseOptions[a];
        doReturn = false;
        timeout = useOption.timeout;
      }
    }
    if (doReturn) {
      this.sendChatText(
        client,
        "[ERROR] use option not mapped to item Definition " +
          item.itemDefinitionId
      );
      return;
    }
    switch (item.itemDefinitionId) {
      case Items.WATER_EMPTY:
        useoption = "fill";
        break;
      case Items.SWIZZLE:
        useoption = "sniff";
        timeout = 3000;
        break;
      case Items.FERTILIZER:
        this.utilizeHudTimer(client, nameId, timeout, () => {
          this.fertilizePlants(client, item);
        });
        return;
      default:
        this.sendChatText(
          client,
          "[ERROR] No use option mapped to item Definition " +
            item.itemDefinitionId
        );
    }
    switch (useoption) {
      case "fill": // empty bottle
        this.utilizeHudTimer(client, nameId, timeout, () => {
          this.fillPass(client, item);
        });
        break;
      case "sniff": // swizzle
        this.utilizeHudTimer(client, nameId, timeout, () => {
          this.sniffPass(client, item);
        });
        break;
      default:
        return;
    }
  }

  sliceItem(client: Client, item: BaseItem) {
    const itemDef = this.getItemDefinition(item.itemDefinitionId);
    if (!itemDef) return;
    const nameId = itemDef.NAME_ID;
    let timeout = 0;
    let doReturn = true;
    for (const a in UseOptions) {
      if (
        UseOptions[a].itemDef == item.itemDefinitionId &&
        UseOptions[a].type == ItemUseOptions.SLICE
      ) {
        const useOption = UseOptions[a];
        doReturn = false;
        timeout = useOption.timeout;
      }
    }
    if (doReturn) {
      this.sendChatText(
        client,
        "[ERROR] use option not mapped to item Definition " +
          item.itemDefinitionId
      );
      return;
    }
    this.utilizeHudTimer(client, nameId, timeout, () => {
      this.slicePass(client, item);
    });
  }

  refuelVehicle(client: Client, item: BaseItem, vehicleGuid: string) {
    const itemDef = this.getItemDefinition(item.itemDefinitionId);
    if (!itemDef) return;
    const nameId = itemDef.NAME_ID;
    let fuelValue = 0;
    let timeout = 0;
    let doReturn = true;
    for (const a in UseOptions) {
      if (
        UseOptions[a].itemDef == item.itemDefinitionId &&
        UseOptions[a].type == ItemUseOptions.REFUEL
      ) {
        const useOption = UseOptions[a];
        doReturn = false;
        timeout = useOption.timeout;
        if (useOption.refuelCount) fuelValue = useOption.refuelCount;
      }
    }
    if (doReturn) {
      this.sendChatText(
        client,
        "[ERROR] fuel not mapped to item Definition " + item.itemDefinitionId
      );
      return;
    }
    this.utilizeHudTimer(client, nameId, timeout, () => {
      this.refuelVehiclePass(client, item, vehicleGuid, fuelValue);
    });
  }

  shredItem(client: Client, item: BaseItem) {
    const itemDefinition = this.getItemDefinition(item.itemDefinitionId),
      nameId = itemDefinition.NAME_ID,
      itemType = itemDefinition.ITEM_TYPE;
    let count = 1;
    const timeout = 3000;
    switch (itemType) {
      case 36:
      case 39:
        count = 1;
        break;
      case 34: // salvage/shred
        count = 4;
        break;
      default:
        this.sendChatText(client, "[ERROR] Unknown salvage item or count.");
    }
    this.utilizeHudTimer(client, nameId, timeout, () => {
      this.shredItemPass(client, item, count);
    });
  }

  salvageAmmo(client: Client, item: BaseItem) {
    const itemDefinition = this.getItemDefinition(item.itemDefinitionId),
      nameId = itemDefinition.NAME_ID;
    const timeout = 1000;
    const allowedItems = [
      Items.AMMO_12GA,
      Items.AMMO_223,
      Items.AMMO_308,
      Items.AMMO_380,
      Items.AMMO_44,
      Items.AMMO_45,
      Items.AMMO_762,
      Items.AMMO_9MM
    ];
    if (!allowedItems.includes(item.itemDefinitionId)) {
      this.sendAlert(
        client,
        `[ERROR] Salvage option not mapped to item definition ${item.itemDefinitionId}`
      );
      return;
    }
    if (
      !checkConstructionInRange(
        this._constructionSimple,
        client.character.state.position,
        3,
        Items.WORKBENCH_WEAPON
      ) &&
      !checkConstructionInRange(
        this._worldSimpleConstruction,
        client.character.state.position,
        3,
        Items.WORKBENCH_WEAPON
      )
    ) {
      this.sendAlert(
        client,
        "You must be near a weapon workbench to complete this recipe"
      );
      return;
    }
    const count =
      item.itemDefinitionId == Items.AMMO_12GA ||
      item.itemDefinitionId == Items.AMMO_762 ||
      item.itemDefinitionId == Items.AMMO_308 ||
      item.itemDefinitionId == Items.AMMO_44
        ? 2
        : 1;
    this.utilizeHudTimer(client, nameId, timeout, () => {
      this.salvageItemPass(client, item, count);
    });
  }

  useComsumablePass(
    client: Client,
    item: BaseItem,
    eatCount: number,
    drinkCount: number,
    staminaCount: number,
    givetrash: number,
    healCount: number,
    bandagingCount: number,
    healType: HealTypes
  ) {
    if (!this.removeInventoryItem(client.character, item)) return;
    if (eatCount) {
      client.character._resources[ResourceIds.HUNGER] += eatCount;
      this.updateResource(
        client,
        client.character.characterId,
        client.character._resources[ResourceIds.HUNGER],
        ResourceIds.HUNGER
      );
    }
    if (drinkCount) {
      client.character._resources[ResourceIds.HYDRATION] += drinkCount;
      this.updateResource(
        client,
        client.character.characterId,
        client.character._resources[ResourceIds.HYDRATION],
        ResourceIds.HYDRATION
      );
    }
    if (staminaCount) {
      client.character._resources[ResourceIds.STAMINA] += staminaCount;
      this.updateResource(
        client,
        client.character.characterId,
        client.character._resources[ResourceIds.STAMINA],
        ResourceIds.STAMINA
      );
    }

    if (item.itemDefinitionId == Items.MEAT_ROTTEN) {
      const damageInfo: DamageInfo = {
        entity: "",
        damage: 1000
      };
      client.character.damage(this, damageInfo);
    }
    if (givetrash) {
      client.character.lootContainerItem(this, this.generateItem(givetrash));
    }
    if (bandagingCount && healCount) {
      if (!client.character.healingIntervals[healType]) {
        client.character.starthealingInterval(client, this, healType);
      }
      client.character.healingMaxTicks += healCount;
      if (client.character._resources[ResourceIds.BLEEDING] > 0) {
        client.character._resources[ResourceIds.BLEEDING] -= bandagingCount;
        const bleeding = client.character._resources[ResourceIds.BLEEDING];
        this.updateResourceToAllWithSpawnedEntity(
          client.character.characterId,
          bleeding,
          ResourceIds.BLEEDING,
          ResourceTypes.BLEEDING,
          this._characters
        );
      }
    }
  }

  slicePass(client: Client, item: BaseItem) {
    if (!this.removeInventoryItem(client.character, item)) return;
    if (item.itemDefinitionId == Items.BLACKBERRY_PIE) {
      client.character.lootContainerItem(
        this,
        this.generateItem(Items.BLACKBERRY_PIE_SLICE, 4)
      );
    }
  }

  igniteoptionPass(client: Client) {
    for (const a in this._explosives) {
      if (
        isPosInRadius(
          1,
          client.character.state.position,
          this._explosives[a].state.position
        )
      ) {
        this._explosives[a].ignite(this, client);
        return;
      }
    }
    for (const a in this._lootableConstruction) {
      const smeltable = this._lootableConstruction[a];
      if (
        isPosInRadius(
          1.5,
          client.character.state.position,
          smeltable.state.position
        )
      ) {
        if (smeltable instanceof LootableConstructionEntity) {
          if (smeltable.subEntity instanceof SmeltingEntity) {
            if (smeltable.subEntity.isWorking) continue;
            smeltable.subEntity.isWorking = true;
            const effectTime =
              Math.ceil(this.smeltingManager.burnTime / 1000) -
              Math.floor(
                (Date.now() - this.smeltingManager.lastBurnTime) / 1000
              );
            this.smeltingManager._smeltingEntities[smeltable.characterId] =
              smeltable.characterId;
            this.sendDataToAllWithSpawnedEntity(
              smeltable.subEntity.dictionary,
              smeltable.characterId,
              "Character.PlayWorldCompositeEffect",
              {
                characterId: smeltable.characterId,
                effectId: smeltable.subEntity.workingEffect,
                position: smeltable.state.position,
                unk3: effectTime
              }
            );
          }
        }
      }
    }
    for (const a in this._worldLootableConstruction) {
      const smeltable = this._worldLootableConstruction[a];
      if (
        isPosInRadius(
          1.5,
          client.character.state.position,
          smeltable.state.position
        )
      ) {
        if (smeltable instanceof LootableConstructionEntity) {
          if (smeltable.subEntity instanceof SmeltingEntity) {
            if (smeltable.subEntity.isWorking) continue;
            smeltable.subEntity.isWorking = true;
            const effectTime =
              Math.ceil(this.smeltingManager.burnTime / 1000) -
              Math.floor(
                (Date.now() - this.smeltingManager.lastBurnTime) / 1000
              );
            this.smeltingManager._smeltingEntities[smeltable.characterId] =
              smeltable.characterId;
            this.sendDataToAllWithSpawnedEntity(
              smeltable.subEntity.dictionary,
              smeltable.characterId,
              "Character.PlayWorldCompositeEffect",
              {
                characterId: smeltable.characterId,
                effectId: smeltable.subEntity.workingEffect,
                position: smeltable.state.position,
                unk3: effectTime
              }
            );
          }
        }
      }
    }
  }

  refuelVehiclePass(
    client: Client,
    item: BaseItem,
    vehicleGuid: string,
    fuelValue: number
  ) {
    if (!this.removeInventoryItem(client.character, item)) return;
    const vehicle = this._vehicles[vehicleGuid];
    vehicle._resources[ResourceIds.FUEL] += fuelValue;
    if (vehicle._resources[ResourceIds.FUEL] > 10000) {
      vehicle._resources[ResourceIds.FUEL] = 10000;
    }
    this.updateResourceToAllWithSpawnedEntity(
      vehicleGuid,
      vehicle._resources[ResourceIds.FUEL],
      ResourceIds.FUEL,
      ResourceTypes.FUEL,
      this._vehicles
    );
  }

  shredItemPass(client: Client, item: BaseItem, count: number) {
    if (!this.removeInventoryItem(client.character, item)) return;
    client.character.lootItem(this, this.generateItem(Items.CLOTH, count));
  }

  salvageItemPass(client: Client, item: BaseItem, count: number) {
    if (!this.removeInventoryItem(client.character, item)) return;
    client.character.lootItem(this, this.generateItem(Items.ALLOY_LEAD, count));
    client.character.lootItem(this, this.generateItem(Items.SHARD_BRASS, 1));
    client.character.lootItem(
      this,
      this.generateItem(Items.GUNPOWDER_REFINED, 1)
    );
  }

  repairOption(client: Client, item: BaseItem, repairItem: BaseItem) {
    const durability = repairItem.currentDurability;
    if (durability >= 2000) {
      // todo: get max durability from somewhere, do not hard-code
      this.sendChatText(client, "This weapon is already at max durability.");
      return;
    }

    const diff = 2000 - durability,
      repairAmount = diff < 500 ? diff : 500;

    if (!this.removeInventoryItem(client.character, item)) return;
    repairItem.currentDurability += repairAmount;

    // TODO: move below logic to it's own updateItem function

    // used to update the item's durability on-screen regardless of container / loadout

    const loadoutItem = client.character.getLoadoutItem(repairItem.itemGuid);
    if (loadoutItem) {
      this.updateLoadoutItem(client, loadoutItem);
      return;
    }

    const container = client.character.getItemContainer(repairItem.itemGuid);
    if (container) {
      this.updateContainerItem(client.character, repairItem, container);
      return;
    }

    const mountedContainer = client.character.mountedContainer;

    if (mountedContainer) {
      const container = mountedContainer.getContainer();
      if (!container) return;
      this.updateContainerItem(mountedContainer, item, container);
    }
  }

  pUtilizeHudTimer = promisify(this.utilizeHudTimer);

  stopHudTimer(client: Client) {
    this.utilizeHudTimer(client, 0, 0, () => {
      /*/*/
    });
  }

  utilizeHudTimer(
    client: Client,
    nameId: number,
    timeout: number,
    callback: any
  ) {
    this.startTimer(client, nameId, timeout);
    if (client.hudTimer != null) {
      clearTimeout(client.hudTimer);
    }
    client.posAtTimerStart = client.character.state.position;
    client.hudTimer = setTimeout(() => {
      callback.apply(this);
    }, timeout);
  }

  containerError(client: Client, error: ContainerErrors) {
    switch (error) {
      case ContainerErrors.DOES_NOT_ACCEPT_ITEMS:
        this.sendChatText(
          client,
          "Container Error: ContainerDoesNotAcceptItems"
        );
        break;
      case ContainerErrors.NOT_MUTABLE:
        this.sendChatText(client, "Container Error: ContainerIsNotMutable");
        break;
      case ContainerErrors.NOT_CONSTRUCTED:
        this.sendChatText(client, "Container Error: ContainerNotConstructed");
        break;
      case ContainerErrors.NO_SPACE:
        this.sendChatText(client, "Container Error: ContainerHasNoSpace");
        break;
      case ContainerErrors.INVALID_LOADOUT_SLOT:
        this.sendChatText(client, "Container Error: InvalidLoadoutSlot");
        break;
      case ContainerErrors.NO_PERMISSION:
        this.sendChatText(client, "Container Error: NoPermission");
      case ContainerErrors.UNACCEPTED_ITEM:
        this.sendChatText(client, "Container Error: Item not accepted");
        break;
      default:
        this.sendData(client, "Container.Error", {
          characterId: client.character.characterId,
          containerError: error
        });
        break;
    }
  }

  clearMovementModifiers(client: Client) {
    for (const a in client.character.timeouts) {
      client.character.timeouts[a]._onTimeout();
      clearTimeout(client.character.timeouts[a]);
      delete client.character.timeouts[a];
    }
  }

  applyMovementModifier(client: Client, modifier: MovementModifiers) {
    this.multiplyMovementModifier(client, modifier);
    switch (modifier) {
      case MovementModifiers.SWIZZLE:
        if (client.character.timeouts["swizzle"]) {
          client.character.timeouts["swizzle"]._onTimeout();
          clearTimeout(client.character.timeouts["swizzle"]);
          delete client.character.timeouts["swizzle"];
        }
        client.character.timeouts["swizzle"] = setTimeout(() => {
          if (!client.character.timeouts["swizzle"]) {
            return;
          }
          this.divideMovementModifier(client, modifier);
          delete client.character.timeouts["swizzle"];
        }, 30000);
        break;
      case MovementModifiers.SNARED:
        if (client.character.timeouts["snared"]) {
          client.character.timeouts["snared"]._onTimeout();
          clearTimeout(client.character.timeouts["snared"]);
          delete client.character.timeouts["snared"];
        }
        client.character.timeouts["snared"] = setTimeout(() => {
          if (!client.character.timeouts["snared"]) {
            return;
          }
          this.divideMovementModifier(client, modifier);
          delete client.character.timeouts["snared"];
        }, 15000);
        break;
      case MovementModifiers.BOOTS:
        // some stuff
        break;
    }
  }

  multiplyMovementModifier(client: Client, modifier: number) {
    this.sendData(client, "ClientUpdate.ModifyMovementSpeed", {
      speed: modifier
    });
  }

  divideMovementModifier(client: Client, modifier: number) {
    const modifierFixed = 1 / modifier;
    if (!client.character.initialized) return;
    this.sendData(client, "ClientUpdate.ModifyMovementSpeed", {
      speed: modifierFixed
    });
  }

  checkConveys(client: Client, character = client.character) {
    if (!character._equipment["5"]) {
      if (character.hasConveys) {
        character.hasConveys = false;
        this.divideMovementModifier(client, MovementModifiers.BOOTS);
      }
    } else {
      if (character._equipment["5"].guid) {
        const item = client.character.getInventoryItem(
          character._equipment["5"].guid
        );
        if (!item) return;
        const itemDef = this.getItemDefinition(item.itemDefinitionId);
        if (itemDef.DESCRIPTION_ID == 11895 && !character.hasConveys) {
          character.hasConveys = true;
          this.multiplyMovementModifier(client, MovementModifiers.BOOTS);
        } else if (itemDef.DESCRIPTION_ID != 11895 && character.hasConveys) {
          character.hasConveys = false;
          this.divideMovementModifier(client, MovementModifiers.BOOTS);
        }
      }
    }
  }

  //#endregion

  async reloadZonePacketHandlers() {
    //@ts-ignore
    delete this._packetHandlers;
    delete require.cache[require.resolve("./zonepackethandlers")];
    this._packetHandlers = new (
      require("./zonepackethandlers") as any
    ).ZonePacketHandlers();
    await this._packetHandlers.reloadCommandCache();
  }
  generateGuid(): string {
    return generateRandomGuid();
  }
  getSoeClient(soeClientId: string): SOEClient | undefined {
    return this._gatewayServer._soeServer.getSoeClient(soeClientId);
  }
  private _sendRawData(client: Client, data: Buffer, unbuffered: boolean) {
    const soeClient = this.getSoeClient(client.soeClientId);
    if (soeClient) {
      if (unbuffered) {
        this._gatewayServer.sendUnbufferedTunnelData(soeClient, data);
      } else {
        this._gatewayServer.sendTunnelData(soeClient, data);
      }
    }
  }
  sendRawData(client: Client, data: Buffer) {
    this._sendRawData(client, data, false);
  }
  sendUnbufferedRawData(client: Client, data: Buffer) {
    this._sendRawData(client, data, true);
  }
  getAllCurrentUsedTransientId() {
    const allTransient: any = {};
    for (const key in this._doors) {
      const door = this._doors[key];
      allTransient[door.transientId] = key;
    }
    for (const key in this._lootableProps) {
      const prop = this._lootableProps[key];
      allTransient[prop.transientId] = key;
    }
    for (const key in this._vehicles) {
      const vehicle = this._vehicles[key];
      allTransient[vehicle.transientId] = key;
    }
    for (const key in this._npcs) {
      const npc = this._npcs[key];
      allTransient[npc.transientId] = key;
    }
    for (const key in this._spawnedItems) {
      const object = this._spawnedItems[key];
      allTransient[object.transientId] = key;
    }
    return allTransient;
  }
  private async fetchLoginInfo() {
    const resolver = new Resolver();
    const loginServerAddress = await resolveHostAddress(
      resolver,
      "loginserver.h1emu.com"
    );
    this._loginServerInfo.address = loginServerAddress[0] as string;
  }
  executeFuncForAllReadyClients(callback: (client: Client) => void) {
    for (const client in this._clients) {
      const clientObj: Client = this._clients[client];
      if (!clientObj.isLoading) {
        callback(clientObj);
      }
    }
  }

  executeFuncForAllReadyClientsInRange(
    callback: (client: Client) => void,
    entity: BaseEntity
  ) {
    for (const client in this._clients) {
      const clientObj: Client = this._clients[client];
      if (
        !clientObj.isLoading &&
        isPosInRadius(
          entity.npcRenderDistance || this.charactersRenderDistance,
          clientObj.character.state.position,
          entity.state.position
        )
      ) {
        callback(clientObj);
      }
    }
  }
  async startRoutinesLoop() {
    if (_.size(this._clients) <= 0) {
      await Scheduler.wait(3000);
      this.startRoutinesLoop();
      return;
    }
    for (const a in this._clients) {
      const client = this._clients[a];
      if (!client.isLoading) {
        client.routineCounter++;
        this.constructionManager.constructionPermissionsManager(this, client);
        this.checkInMapBounds(client);
        this.checkZonePing(client);
        if (client.routineCounter >= 3) {
          this.assignChunkRenderDistance(client);
          this.removeOutOfDistanceEntities(client);
          this.removeOODInteractionData(client);
          this.POIManager(client);
          client.routineCounter = 0;
        }
        this.constructionManager.spawnConstructionParentsInRange(this, client);
        this.vehicleManager(client);
        this.spawnCharacters(client);
        this.spawnGridObjects(client);
        this.constructionManager.worldConstructionManager(this, client);
        client.posAtLastRoutine = client.character.state.position;
      }
      await Scheduler.wait(this.tickRate);
    }
    this.startRoutinesLoop();
  }

  executeRoutine(client: Client) {
    this.constructionManager.constructionPermissionsManager(this, client);
    this.constructionManager.spawnConstructionParentsInRange(this, client);
    this.vehicleManager(client);
    //this.npcManager(client);
    this.removeOutOfDistanceEntities(client);
    this.spawnCharacters(client);
    this.spawnGridObjects(client);
    this.constructionManager.worldConstructionManager(this, client);
    this.POIManager(client);
    client.posAtLastRoutine = client.character.state.position;
  }

  firstRoutine(client: Client) {
    this.constructionManager.spawnConstructionParentsInRange(this, client);
    this.spawnLoadingGridObjects(client);
    this.spawnCharacters(client);
    this.constructionManager.worldConstructionManager(this, client);
    this.POIManager(client);
    client.posAtLastRoutine = client.character.state.position;
  }

  checkZonePing(client: Client) {
    const soeClient = this.getSoeClient(client.soeClientId);
    if (
      client.isAdmin ||
      Number(client.character.lastLoginDate) + 30000 > new Date().getTime() ||
      !soeClient
    ) {
      return;
    }

    const ping = soeClient.avgPing;
    client.zonePings.push(ping > 600 ? 600 : ping); // dont push values higher than 600, that would increase average value drasticaly
    if (ping >= this.fairPlayManager.maxPing) {
      this.sendAlert(
        client,
        `Your ping is very high: ${ping}. You may be kicked soon`
      );
    }
    if (client.zonePings.length < 15) return;

    const averagePing =
      client.zonePings.reduce((a, b) => a + b, 0) / client.zonePings.length;
    if (averagePing >= this.fairPlayManager.maxPing) {
      this.kickPlayer(client);
      this.sendChatTextToAdmins(
        `${client.character.name} has been been kicked for average ping: ${averagePing}`
      );
      return;
    }
    client.zonePings.splice(0, 1); // remove oldest ping val
  }

  checkInMapBounds(client: Client) {
    let inMapBounds: boolean = false;
    this._spawnGrid.forEach((cell: SpawnCell) => {
      const pos = client.character.state.position;
      if (
        pos[0] >= cell.position[0] - cell.width / 2 &&
        pos[0] <= cell.position[0] + cell.width / 2 &&
        pos[2] >= cell.position[2] - cell.height / 2 &&
        pos[2] <= cell.position[2] + cell.height / 2
      ) {
        inMapBounds = true;
      }
    });

    if (!inMapBounds && !client.isAdmin) {
      const damageInfo: DamageInfo = {
        entity: "Server.OutOfMapBounds",
        damage: 1000
      };
      this.sendAlert(client, `The radiation here seems to be dangerously high`);
      client.character.damage(this, damageInfo);
    }
  }

  private _sendDataToAll(
    packetName: h1z1PacketsType2016,
    obj: zone2016packets,
    unbuffered: boolean
  ) {
    const data = this._protocol.pack(packetName, obj);
    if (data) {
      for (const a in this._clients) {
        if (unbuffered) {
          this.sendUnbufferedRawData(this._clients[a], data);
        } else {
          this.sendRawData(this._clients[a], data);
        }
      }
    }
  }

  sendDataToAll(packetName: h1z1PacketsType2016, obj: zone2016packets) {
    this._sendDataToAll(packetName, obj, false);
  }
  sendUnbufferedDataToAll(
    packetName: h1z1PacketsType2016,
    obj: zone2016packets
  ) {
    this._sendDataToAll(packetName, obj, true);
  }
  dropVehicleManager(client: Client, vehicleGuid: string) {
    this.sendManagedObjectResponseControlPacket(client, {
      control: 0,
      objectCharacterId: vehicleGuid
    });
    client.managedObjects.splice(
      client.managedObjects.findIndex((e: string) => e === vehicleGuid),
      1
    );
    delete this._vehicles[vehicleGuid]?.manager;
  }
  sendBanToLogin(loginSessionId: string, status: boolean) {
    this._h1emuZoneServer.sendData(
      {
        ...this._loginServerInfo,
        // TODO: what a dirty hack
        serverId: Infinity
      } as any,
      "ClientBan",
      { loginSessionId, status }
    );
  }
  sendZonePopulationUpdate() {
    const populationNumber = _.size(this._characters);
    this._h1emuZoneServer.sendData(
      {
        ...this._loginServerInfo,
        // TODO: what a dirty hack
        serverId: Infinity
      } as any,
      "UpdateZonePopulation",
      { population: populationNumber }
    );
  }

  private filterOutOfDistance(
    element: BaseEntity,
    playerPosition: Float32Array
  ): boolean {
    return !isPosInRadius(
      element.npcRenderDistance || this.charactersRenderDistance,
      playerPosition,
      element.state.position
    );
  }
  getServerTimeTest(): number {
    debug("get server time");
    const delta = Date.now() - this._startTime;
    return Number(
      (((this._serverTime + delta) * this._timeMultiplier) / 1000).toFixed(0)
    );
  }
  getServerTime(): number {
    const delta = Date.now() - this._startTime;
    return this._serverTime + delta;
  }
  dismissVehicle(vehicleGuid: string) {
    this.sendDataToAll("Character.RemovePlayer", {
      characterId: vehicleGuid
    });
    this.deleteEntity(vehicleGuid, this._vehicles);
  }

  /**
   * Generates a new transientId and maps it to a provided characterId.
   * @param characterId The characterId to map the transientId to.
   */
  getTransientId(characterId: string): number {
    const generatedTransient = this._transientIdGenerator.next()
      .value as number;
    this._transientIds[generatedTransient] = characterId;
    this._characterIds[characterId] = generatedTransient;
    return generatedTransient;
  }

  /**
   * Reloads all packet handlers, structures, and commands for the entire server.
   * @param client The client that called the function.
   */
  reloadPackets(client: Client) {
    this.reloadZonePacketHandlers();
    this._protocol.reloadPacketDefinitions();
    this.sendChatText(client, "[DEV] Packets reloaded", true);
  }

  /**
   * Disconnects a client from the zone.
   * @param client The client to be disconnected
   */
  timeoutClient(client: Client) {
    if (!!this._clients[client.sessionId]) {
      // if hasn't already deleted
      debug(`Client (${client.soeClientId}) disconnected ( ping timeout )`);
      this.deleteClient(client);
    }
  }

  pSetImmediate = promisify(setImmediate);
  pSetTimeout = promisify(setTimeout);

  sendChatText(client: Client, message: string, clearChat?: boolean) {
    this.chatManager.sendChatText(this, client, message, clearChat);
  }
  sendChatTextToAllOthers(client: Client, message: string, clearChat = false) {
    this.chatManager.sendChatText(this, client, message, clearChat);
  }
  sendChatTextToAdmins(message: string, clearChat = false) {
    this.chatManager.sendChatTextToAdmins(this, message, clearChat);
  }
  sendGlobalChatText(message: string, clearChat = false) {
    this.chatManager.sendGlobalChatText(this, message, clearChat);
  }
  sendConsoleText(client: Client, message: string) {
    this.sendData(client, "H1emu.PrintToConsole", { message });
  }
  sendConsoleTextToAdmins(message: string) {
    for (const a in this._clients) {
      const client = this._clients[a];
      if (client.isAdmin) {
        this.sendData(client, "H1emu.PrintToConsole", { message });
      }
    }
  }

  playerNotFound(
    client: Client,
    inputString: string,
    targetClient: string | Client | undefined
  ) {
    if (typeof targetClient == "string") {
      this.sendChatText(
        client,
        `Could not find player "${inputString.toLowerCase()}", did you mean "${targetClient}"?`
      );
      return true;
    }
    return false;
  }
}

if (process.env.VSCODE_DEBUG === "true") {
  const PackageSetting = require("../../../package.json");
  process.env.H1Z1_SERVER_VERSION = PackageSetting.version;
  new ZoneServer2016(
    1117,
    Buffer.from(DEFAULT_CRYPTO_KEY, "base64"),
    process.env.MONGO_URL,
    2
  ).start();
}
