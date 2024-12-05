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

const debugName = "ZoneServer",
  debug = require("debug")(debugName);

import { EventEmitter } from "node:events";
import { H1Z1Protocol } from "../../protocols/h1z1protocol";
import { LoginConnectionManager } from "../LoginZoneConnection/loginconnectionmanager";
import { LZConnectionClient } from "../LoginZoneConnection/shared/lzconnectionclient";
import { Resolver } from "node:dns";

import { promisify } from "node:util";
import { ZonePacketHandlers } from "./zonepackethandlers";
import { ZoneClient2016 as Client } from "./classes/zoneclient";
import { Vehicle2016 as Vehicle, Vehicle2016 } from "./entities/vehicle";
import { GridCell } from "./classes/gridcell";
import { SpawnCell } from "./classes/spawncell";
import { WorldObjectManager } from "./managers/worldobjectmanager";
import { VoiceChatManager } from "./managers/voicechatmanager";
import { SmeltingManager } from "./managers/smeltingmanager";
import { DecayManager } from "./managers/decaymanager";
import { AbilitiesManager } from "./managers/abilitiesmanager";
import {
  ContainerErrors,
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
  HealTypes,
  Effects,
  WeaponDefinitionIds,
  StringIds,
  ModelIds,
  ItemTypes,
  ItemClasses
} from "./models/enums";
import { WeatherManager } from "./managers/weathermanager";

import {
  AccountDefinition,
  ClientBan,
  clientEffect,
  ConstructionEntity,
  DamageInfo,
  DamageRecord,
  EntityDictionary,
  FireHint,
  HudIndicator,
  ItemDefinition,
  modelData,
  PropInstance,
  RandomReward,
  RewardCrateDefinition,
  ScreenEffect,
  UseOption
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
  generateTransientId,
  getRandomFromArray,
  getRandomKeyFromAnObject,
  toBigHex,
  toHex,
  calculate_falloff,
  resolveHostAddress,
  getDifference,
  logClientActionToMongo,
  removeUntransferableFields,
  movePoint,
  getAngle,
  getDistance2d,
  TimeWrapper,
  getCurrentServerTimeWrapper,
  flhash,
  getDateString,
  loadJson,
  chance
} from "../../utils/utils";

import { Db, MongoClient, WithId } from "mongodb";
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
  PlantingDiameterSaveData,
  TrapSaveData
} from "types/savedata";
import {
  constructContainers,
  constructLoadout,
  FetchedWorldData,
  WorldDataManager
} from "./managers/worlddatamanager";
import { UseOptions } from "./data/useoptions";
import {
  CONNECTION_REJECTION_FLAGS,
  DB_COLLECTIONS,
  GAME_VERSIONS,
  LOGIN_KICK_REASON
} from "../../utils/enums";

import {
  AddLightweightNpc,
  AddLightweightPc,
  AddLightweightVehicle,
  AddSimpleNpc,
  CharacterAddEffectTagCompositeEffect,
  CharacterDroppedItemNotification,
  CharacterKilledBy,
  CharacterManagedObject,
  CharacterMovementVersion,
  CharacterPlayWorldCompositeEffect,
  CharacterRemovePlayer,
  CharacterRespawnReply,
  CharacterSeekTarget,
  CharacterSelectSessionResponse,
  CharacterStartMultiStateDeath,
  CharacterUpdateCharacterState,
  CharacterWeaponStance,
  ClientExitLaunchUrl,
  ClientGameSettings,
  ClientUpdateDeathMetrics,
  ClientUpdateItemAdd,
  ClientUpdateItemDelete,
  ClientUpdateItemUpdate,
  ClientUpdateManagedObjectResponseControl,
  ClientUpdateModifyMovementSpeed,
  ClientUpdateProximateItems,
  ClientUpdateStartTimer,
  ClientUpdateUpdateLocation,
  ClientUpdateUpdateLockoutTimes,
  CommandPlayDialogEffect,
  ContainerError,
  ContainerInitEquippedContainers,
  ContainerUpdateEquippedContainer,
  DtoObjectInitialData,
  GameTimeSync,
  H1emuPrintToConsole,
  InitializationParameters,
  LightweightToFullVehicle,
  LoginFailed,
  MountDismountResponse,
  MountMountResponse,
  MountSeatChangeRequest,
  MountSeatChangeResponse,
  POIChangeMessage,
  PlayerUpdatePosition,
  ResourceEvent,
  RewardAddNonRewardItem,
  SendSelfToClient,
  SendZoneDetails,
  UiConfirmHit,
  VehicleOccupy,
  VehicleOwner,
  WeaponWeapon,
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
import {
  RConManager,
  RconMessage,
  RconMessageType
} from "./managers/rconmanager";
import { GroupManager } from "./managers/groupmanager";
import { SpeedTreeManager } from "./managers/speedtreemanager";
import { ConstructionManager } from "./managers/constructionmanager";
import { FairPlayManager } from "./managers/fairplaymanager";
import { PluginManager } from "./managers/pluginmanager";
import { Destroyable } from "./entities/destroyable";
import { Plane } from "./entities/plane";
import { FileHashTypeList, ReceivedPacket } from "types/shared";
import { SOEOutputChannels } from "../../servers/SoeServer/soeoutputstream";
import { scheduler } from "node:timers/promises";
import { GatewayChannels } from "h1emu-core";
import { IngameTimeManager } from "./managers/gametimemanager";
import { H1z1ProtocolReadingFormat } from "types/protocols";
import { GatewayServer } from "../GatewayServer/gatewayserver";
import { WaterSource } from "./entities/watersource";
import { WebSocket } from "ws";
import { CommandHandler } from "./handlers/commands/commandhandler";
import { AccountInventoryManager } from "./managers/accountinventorymanager";
import { PlayTimeManager } from "./managers/playtimemanager";
import { RewardManager } from "./managers/rewardmanager";
import { DynamicAppearance } from "types/zonedata";
import { AiManager } from "h1emu-ai";
import { clearInterval, setInterval } from "node:timers";
import { NavManager } from "../../utils/recast";

const spawnLocations2 = require("../../../data/2016/zoneData/Z1_gridSpawns.json"),
  deprecatedDoors = require("../../../data/2016/sampleData/deprecatedDoors.json"),
  itemDefinitions = require("./../../../data/2016/dataSources/ServerItemDefinitions.json"),
  containerDefinitions = require("./../../../data/2016/dataSources/ContainerDefinitions.json"),
  profileDefinitions = require("./../../../data/2016/dataSources/ServerProfileDefinitions.json"),
  projectileDefinitons = require("./../../../data/2016/dataSources/ServerProjectileDefinitions.json"),
  itemClassDefinitions = require("./../../../data/2016/dataSources/ServerItemClassDefinitions.json"),
  loadoutSlotItemClasses = require("./../../../data/2016/dataSources/LoadoutSlotItemClasses.json"),
  equipSlotItemClasses = require("./../../../data/2016/dataSources/EquipSlotItemClasses.json"),
  weaponDefinitions = require("../../../data/2016/dataSources/ServerWeaponDefinitions"),
  resourceDefinitions = require("../../../data/2016/dataSources/Resources"),
  Z1_POIs = require("../../../data/2016/zoneData/Z1_POIs"),
  hudIndicators = require("../../../data/2016/dataSources/HudIndicators"),
  screenEffects = require("../../../data/2016/sampleData/screenEffects.json"),
  clientEffectsDataSource = require("../../../data/2016/dataSources/ClientEffects.json"),
  itemUseOptionsDataSource = require("../../../data/2016/dataSources/ItemUseOptions"),
  gameRulesSource = require("../../../data/2016/dataSources/ServerGameRules"),
  models = require("../../../data/2016/dataSources/Models"),
  accountItemConversions = require("./../../../data/2016/dataSources/AcctItemConversions.json"),
  rewardCrates = require("./../../../data/2016/dataSources/AccountCrates.json"),
  equipmentModelTexturesMapping: Record<
    string,
    Record<string, string[]>
  > = require("../../../data/2016/sampleData/equipmentModelTexturesMapping.json");

export class ZoneServer2016 extends EventEmitter {
  /** Networking layer - allows sending game data to the game client,
   * lays on top of the H1Z1 protocol (on top of the actual H1Z1 packets)
   */
  _gatewayServer: GatewayServer;
  readonly _protocol: H1Z1Protocol;
  _db!: Db;
  readonly _soloMode: boolean;
  _serverName = process.env.SERVER_NAME || "";
  readonly _mongoAddress: string;
  private readonly _clientProtocol = "ClientProtocol_1080";
  protected _loginConnectionManager!: LoginConnectionManager;
  _serverGuid = generateRandomGuid();
  _worldId = 0;
  _grid: GridCell[] = [];
  _spawnGrid: SpawnCell[] = [];

  saveTimeInterval: number = 600000;

  nextSaveTime: number = Date.now() + this.saveTimeInterval;

  /** Total amount of clients on the server */
  readonly _clients: { [characterId: string]: Client } = {};

  /** Global dictionaries for all entities */
  _characters: EntityDictionary<Character> = {};
  _npcs: EntityDictionary<Npc> = {};
  _spawnedItems: EntityDictionary<ItemObject> = {};
  _plants: EntityDictionary<Plant> = {};
  _doors: EntityDictionary<DoorEntity> = {};
  _explosives: EntityDictionary<ExplosiveEntity> = {};
  _traps: EntityDictionary<TrapEntity> = {};
  _temporaryObjects: EntityDictionary<TemporaryEntity | PlantingDiameter> = {};
  _vehicles: EntityDictionary<Vehicle> = {};
  _lootbags: EntityDictionary<Lootbag> = {};
  _lootableConstruction: EntityDictionary<LootableConstructionEntity> = {};
  _constructionFoundations: EntityDictionary<ConstructionParentEntity> = {};
  _constructionDoors: EntityDictionary<ConstructionDoor> = {};
  _constructionSimple: EntityDictionary<ConstructionChildEntity> = {};
  _lootableProps: EntityDictionary<LootableProp> = {};
  _taskProps: EntityDictionary<TaskProp> = {};
  _crates: EntityDictionary<Crate> = {};
  _destroyables: EntityDictionary<Destroyable> = {};
  _worldLootableConstruction: EntityDictionary<LootableConstructionEntity> = {};
  _worldSimpleConstruction: EntityDictionary<ConstructionChildEntity> = {};

  _destroyableDTOlist: number[] = [];
  _hudIndicators: { [indicatorId: string]: HudIndicator } = {};
  _screenEffects: { [screenEffectName: string]: ScreenEffect } = {};
  _clientEffectsData: { [effectId: number]: clientEffect } = {};
  _modelsData: { [modelId: number]: modelData } = {};

  /** Interactible options for items - See (ZonePacketHandlers.ts or datasources/ItemUseOptions) */
  _itemUseOptions: { [optionId: number]: UseOption } = {};
  _decoys: {
    [transientId: number]: {
      characterId: string;
      transientId: number;
      position: Float32Array;
      action: string;
    };
  } = {};

  /** Airdrop information - includes:
   * plane (Plane), cargo (Plane), planeTarget (string),
   * planeTargetPos (Float32Array), cargoTarget (string), cargoTargetPos(Float32Array),
   * destination (string), destinationPos (Float32Array), cargoSpawned (boolean),
   * hospitalCrate (boolean), manager (Client)
   */
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
    hospitalCrate: boolean;
    manager?: Client;
  };

  _serverStartTime: TimeWrapper = new TimeWrapper(0);
  _transientIds: { [transientId: number]: string } = {};
  _characterIds: { [characterId: string]: number } = {};

  /** Determines which login server is used, Localhost by default. */
  readonly _loginServerInfo: { address?: string; port: number } = {
    address: process.env.LOGINSERVER_IP,
    port: 1110
  };
  worldRoutineTimer!: NodeJS.Timeout;
  _allowedCommands: string[] = process.env.ALLOWED_COMMANDS
    ? JSON.parse(process.env.ALLOWED_COMMANDS)
    : [];

  /** Handles all packets for H1Z1 */
  _packetHandlers: ZonePacketHandlers;

  /** Managers used for handling core functionalities */
  accountInventoriesManager: AccountInventoryManager;
  rewardManager: RewardManager;
  worldObjectManager: WorldObjectManager;
  voiceChatManager: VoiceChatManager;
  smeltingManager: SmeltingManager;
  decayManager: DecayManager;
  abilitiesManager: AbilitiesManager;
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
  playTimeManager: PlayTimeManager;
  aiManager: AiManager;

  _ready: boolean = false;

  /** Information from ServerItemDefinitions.json */
  _itemDefinitions: { [itemDefinitionId: number]: ItemDefinition } =
    itemDefinitions;
  _weaponDefinitions: { [weaponDefinitionId: number]: any } =
    weaponDefinitions.WEAPON_DEFINITIONS;
  _firegroupDefinitions: { [firegroupId: number]: any } =
    weaponDefinitions.FIRE_GROUP_DEFINITIONS;
  _firemodeDefinitions: { [firemodeId: number]: any } =
    weaponDefinitions.FIRE_MODE_DEFINITIONS;
  _accountItemDefinitions: { [ACCOUNT_ITEM_ID: number]: AccountDefinition } =
    accountItemConversions;
  _rewardCrateDefinitions: RewardCrateDefinition[] = rewardCrates;
  itemDefinitionsCache?: Buffer;
  dynamicAppearanceCache?: Buffer;
  weaponDefinitionsCache?: Buffer;
  initialDataStaticDtoCache?: Buffer;
  projectileDefinitionsCache?: Buffer;
  profileDefinitionsCache?: Buffer;
  itemClassDefinitionsCache?: Buffer;
  _containerDefinitions: { [containerDefinitionId: number]: any } =
    containerDefinitions;
  lastItemGuid: bigint = 0x3000000000000000n;
  private readonly _transientIdGenerator = generateTransientId();
  enableWorldSaves: boolean;
  readonly gameVersion: GAME_VERSIONS = GAME_VERSIONS.H1Z1_6dec_2016;
  isSaving: boolean = false;
  private _isSaving: boolean = false;
  readonly worldSaveVersion: number = 2;
  enablePacketInputLogging: boolean = false;
  shutdownStartedTime: number = 0;
  isRebooting: boolean = false;
  abortShutdown: boolean = false;
  shutdownStarted: boolean = false;
  isLocked: boolean = false;
  staticDTOs: Array<PropInstance> = [];
  serverGameRules: string;
  routinesLoopTimer?: NodeJS.Timeout;
  private _mongoClient?: MongoClient;
  rebootTimeTimer?: NodeJS.Timeout;
  inGameTimeManager: IngameTimeManager = new IngameTimeManager();
  commandHandler: CommandHandler;
  dynamicappearance: DynamicAppearance;

  /** MANAGED BY CONFIGMANAGER - See defaultConfig.yaml for more information */
  proximityItemsDistance!: number;
  interactionDistance!: number;
  charactersRenderDistance!: number;
  tickRate!: number;
  worldRoutineRate!: number;
  welcomeMessage!: string;
  adminMessage!: string;
  enableLoginServerKickRequests!: boolean;
  rebootTime!: number; // in hours
  rebootWarnTime!: number; // in seconds
  isPvE!: boolean;
  isHeadshotOnly!: boolean;
  isFirstPersonOnly!: boolean;
  isNoBuildInPois!: boolean;
  baseConstructionDamage!: number;
  crowbarHitRewardChance!: number;
  crowbarHitDamage!: number;
  /*                          */
  navManager: NavManager;
  staticBuildings: AddSimpleNpc[] = require("../../../data/2016/sampleData/staticbuildings.json");

  constructor(
    serverPort: number,
    gatewayKey: Uint8Array = Buffer.from(DEFAULT_CRYPTO_KEY),
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
    this.voiceChatManager = new VoiceChatManager();
    this.smeltingManager = new SmeltingManager();
    this.decayManager = new DecayManager();
    this.abilitiesManager = new AbilitiesManager();
    this.weatherManager = new WeatherManager();
    this.hookManager = new HookManager();
    this.chatManager = new ChatManager();
    this.rconManager = new RConManager();
    this.groupManager = new GroupManager();
    this.speedtreeManager = new SpeedTreeManager();
    this.rewardManager = new RewardManager(this);
    this.constructionManager = new ConstructionManager();
    this.fairPlayManager = new FairPlayManager();
    this.pluginManager = new PluginManager();
    this.commandHandler = new CommandHandler();
    this.playTimeManager = new PlayTimeManager();
    this.aiManager = new AiManager();
    this.navManager = new NavManager();
    /* CONFIG MANAGER MUST BE INSTANTIATED LAST ! */
    this.configManager = new ConfigManager(this, process.env.CONFIG_PATH);
    this.enableWorldSaves =
      process.env.ENABLE_SAVES?.toLowerCase() == "false" ? false : true;

    /** Determines what rulesets are used. */
    const serverGameRules = [];
    serverGameRules.push(this.isPvE ? "PvE" : "PvP");
    if (this.isFirstPersonOnly) serverGameRules.push("FirstPersonOnly");
    if (this.isHeadshotOnly) serverGameRules.push("Headshots");
    if (this.isNoBuildInPois) serverGameRules.push("NoBuildNearPois");
    this.serverGameRules = serverGameRules.join(",");

    this._soloMode = false;

    if (!this._mongoAddress) {
      this._soloMode = true;
      this.fairPlayManager.useFairPlay = false;
      console.log("Server in solo mode !");
    }

    this.accountInventoriesManager = new AccountInventoryManager(this);
    this.on("login", async (client) => {
      if (!this._soloMode) {
        this.sendZonePopulationUpdate();
      }
      await this.onZoneLoginEvent(client);
    });

    this._gatewayServer.on(
      "login",
      async (
        soeClientId: string,
        characterId: string,
        guid: string,
        clientProtocol: string
      ) => {
        debug(
          `Client logged in from ${soeClientId} with character id: ${characterId}`
        );
        if (!this._soloMode) {
          this._loginConnectionManager.sendData(
            {
              ...this._loginServerInfo,
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
        const sessionId =
          this._gatewayServer.getSoeClientSessionId(soeClientId);
        if (!sessionId) {
          return;
        }
        const zoneClient = this.createClient(
          sessionId,
          soeClientId,
          guid,
          characterId,
          generatedTransient
        );
        if (clientProtocol !== this._clientProtocol) {
          debug(`${soeClientId} is using the wrong client protocol`);
          debug(`Protocol ${clientProtocol}`);
          this.sendData<LoginFailed>(zoneClient, "LoginFailed", {});
          return;
        }
        if (!this._soloMode) {
          const address =
            this._gatewayServer.getSoeClientNetworkInfos(soeClientId)?.address;
          if (!address) {
            return;
          }
          if (
            await this.isClientBanned(
              zoneClient.loginSessionId,
              address,
              zoneClient
            )
          ) {
            this.enforceBan(zoneClient);
            return;
          }
          const adminData = (await this._db
            ?.collection(DB_COLLECTIONS.ADMINS)
            .findOne({
              sessionId: zoneClient.loginSessionId
            })) as WithId<{ permissionLevel: number }>;
          if (adminData) {
            zoneClient.isAdmin = true;
            zoneClient.permissionLevel = adminData.permissionLevel ?? 3;
          }
        } else {
          zoneClient.isAdmin = true;
          zoneClient.permissionLevel = 3;
        }

        // If the client is already connected, we kick the old one
        const oldClient = this.getClientByGuid(guid);
        if (oldClient) {
          this.sendData<LoginFailed>(oldClient, "LoginFailed", {});
          this.deleteClient(oldClient);
        }
        this._clients[sessionId] = zoneClient;
        this._characters[characterId] = zoneClient.character;
        this.emit("login", zoneClient);
      }
    );
    this._gatewayServer.on("disconnect", (sessionId: number) => {
      // this happen when the connection is close without a regular logout
      this.deleteClient(this._clients[sessionId]);
    });

    this._gatewayServer.on(
      "tunneldata",
      async (soeClientSessionId: string, data: Buffer, flags: number) => {
        if (!this._soloMode && this.enablePacketInputLogging) {
          this._db.collection("packets").insertOne({
            data,
            flags,
            loginSessionId: this._clients[soeClientSessionId].loginSessionId
          });
        }
        // Idk if this is really efficient , we may lose too much time on context switching
        // if (flags < GatewayChannels.UpdatePosition) {
        //   // if the packet isn't a high priority one, we can wait for the next tick to process it
        //   // If there is a lot of packet to process, it's better, if there is none then we only add like some µsec
        //   await scheduler.yield();
        // }
        const packet = this._protocol.parse(data, flags);

        // for reversing new packets
        /*
        if(
          packet?.name == ""
        ) {
          let hexString = '';
          for (let i = 0; i < data.length; i++) {
              const byte = data[i].toString(16).padStart(2, '0');
              hexString += byte + ' ';
          }
          console.log(`<Buffer ${hexString.trim()}>`);
        }
        */

        if (packet) {
          this.onZoneDataEvent(this._clients[soeClientSessionId], packet);
        } else {
          debug("zonefailed : ", data);
        }
      }
    );

    if (!this._soloMode) {
      this.registerLoginConnectionListeners(internalServerPort);
    }

    const dynamicappearance = loadJson(
      __dirname + "/../../../data/2016/sampleData/dynamicappearance.json"
    );
    this.dynamicappearance = dynamicappearance;
    if (this._mongoAddress && this.rebootTime) {
      console.log("Reboot time set to " + this.rebootTime + " hours");
      this.rebootTimeTimer = setTimeout(
        () => {
          console.log("Rebooting server due to reboot time set");
          this.shutdown(this.rebootWarnTime, "Server rebooting");
        },
        this.rebootTime * 60 * 60 * 1000
      );
    }
    for (let i = 0; i < this.staticBuildings.length; i++) {
      const v = this.staticBuildings[i];
      v.characterId = this.generateGuid();
      v.transientId = this.getTransientId(v.characterId);
    }
  }

  async reloadCommandCache() {
    delete require.cache[require.resolve("./handlers/commands/commandhandler")];
    const CommandHandler = (
      require("./handlers/commands/commandhandler") as any
    ).CommandHandler;
    this.commandHandler = new CommandHandler();
    this.commandHandler.reloadCommands();
  }
  async registerLoginConnectionListeners(internalServerPort?: number) {
    this._loginConnectionManager = new LoginConnectionManager(
      this._worldId,
      internalServerPort
    ); // opens local socket to connect to loginserver

    this._loginConnectionManager.on(
      "session",
      (err: string, client: LZConnectionClient) => {
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

    this._loginConnectionManager.on(
      "sessionfailed",
      (err: string, client: LZConnectionClient) => {
        console.error(`h1emuServer sessionfailed for ${client.sessionId}`);
        console.error(err);
        process.exitCode = 11;
      }
    );

    this._loginConnectionManager.on(
      "disconnect",
      (err: string, client: LZConnectionClient, reason: number) => {
        debug(
          `LoginConnection dropped: ${
            reason ? "Connection Lost" : "Unknown Error"
          }`
        );
      }
    );

    this._loginConnectionManager.on(
      "data",
      async (err: string, client: LZConnectionClient, packet: any) => {
        if (err) {
          console.error(err);
        } else {
          switch (packet.name) {
            case "CharacterCreateRequest":
              this.onCharacterCreateRequest(client, packet);
              break;
            case "ClientIsAdminRequest":
              this.onClientIsAdminRequest(client, packet);
              break;
            case "CharacterAllowedRequest":
              this.onClientAllowedRequest(client, packet);
              break;
            case "CharacterDeleteRequest": {
              const { characterId, reqId } = packet.data;
              try {
                const collection = this._db.collection(
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
                  this._loginConnectionManager.sendData(
                    client,
                    "CharacterDeleteReply",
                    { status: 1, reqId: reqId }
                  );
                  const groupId = charactersArray[0]?.groupId;
                  if (groupId) {
                    this.groupManager.removeGroupMember(
                      this,
                      characterId,
                      groupId
                    );
                  }
                } else {
                  this._loginConnectionManager.sendData(
                    client,
                    "CharacterDeleteReply",
                    { status: 1, reqId: reqId }
                  );
                }
              } catch (error) {
                console.error(error);
                this._loginConnectionManager.sendData(
                  client,
                  "CharacterDeleteReply",
                  {
                    status: 0,
                    reqId: reqId
                  }
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
                default:
                  reasonString = "INVALID";
                  break;
              }

              const client = this.getClientByGuid(guid);

              if (!client) {
                console.log(
                  `LoginServer requested to kick INVALID client with guid ${guid} for reason: ${reason}!`
                );
                return;
              }

              console.log(
                `LoginServer kicking ${client.character.name} for reason: ${reasonString}`
              );

              this.kickPlayerWithReason(client, reasonString);
              break;
            }
            case "OverrideAllowedFileHashes":
              debug("Received OverrideAllowedFileHashes from loginserver");
              const hashTypesList: FileHashTypeList = packet.data.types,
                assetHashes = hashTypesList.find(
                  (entry) => entry.type == "assets"
                );
              if (assetHashes) {
                debug("Using defaultAssetHashes from loginserver");
                this.fairPlayManager.defaultHashes = assetHashes.hashes;
              }
              break;
            default:
              debug(`Unhandled h1emu packet: ${packet.name}`);
              break;
          }
        }
      }
    );
  }

  async stop() {
    for (const trap of Object.values(this._traps)) {
      clearTimeout(trap.trapTimer);
    }
    this.worldDataManager.kill();
    this.inGameTimeManager.stop();
    this.smeltingManager.clearTimers();
    this.decayManager.clearTimers();
    clearTimeout(this.worldRoutineTimer);
    clearTimeout(this.weatherManager.dynamicWorker);
    clearTimeout(this.routinesLoopTimer);
    clearTimeout(this.rebootTimeTimer);
    if (this._loginConnectionManager) {
      await this._loginConnectionManager.stop();
    }
    if (this._mongoClient) {
      await this._mongoClient.close();
    }
    await this._gatewayServer.stop();
    await this.rconManager.stop();
  }

  async shutdown(timeLeft: number, message: string) {
    this.shutdownStarted = true;
    if (this.abortShutdown) {
      this.abortShutdown = false;
      this.shutdownStarted = false;
      this.sendAlertToAll(`Server shutdown aborted.`);
      return;
    }

    if (this.shutdownStartedTime === 0) {
      this.shutdownStartedTime = Date.now();
    }

    const timeLeftMs = timeLeft * 1000;
    const currentTimeLeft =
      timeLeftMs - (Date.now() - this.shutdownStartedTime);
    if (currentTimeLeft < 0) {
      this.sendAlertToAll(`Server will shutdown now`);
      this.enableWorldSaves = false;
      await this.saveWorld();
      Object.values(this._clients).forEach((client: Client) => {
        this.sendData<CharacterSelectSessionResponse>(
          client,
          "CharacterSelectSessionResponse",
          {
            status: 0,
            sessionId: client.loginSessionId
          }
        );
      });
      setTimeout(async () => {
        await this.stop();
        process.exit(0);
      }, 30000);
    } else {
      this.sendAlertToAll(
        `Server will shutdown in ${Math.ceil(
          currentTimeLeft / 1000
        )} seconds. Reason: ${message}`
      );

      if (currentTimeLeft / 1000 <= 60) {
        // block client connections for last minute
        this.isRebooting = true;
      }

      setTimeout(
        () => this.shutdown(timeLeft, message),
        currentTimeLeft <= 60 * 1000 ? timeLeftMs / 6 : timeLeftMs / 10
      );
    }
  }

  async onZoneLoginEvent(client: Client) {
    debug("zone login");
    try {
      await this.sendInitData(client);
    } catch (error) {
      debug(error);
      console.log(error);
      this.sendData<LoginFailed>(client, "LoginFailed", {});
    }
  }

  onZoneDataEvent(client: Client, packet: H1z1ProtocolReadingFormat) {
    if (!client) {
      return;
    }
    if (
      packet.name != "Command.ExecuteCommand" &&
      packet.name != "H1emu.RequestModules" &&
      packet.name != "KeepAlive" &&
      packet.name != "PlayerUpdatePosition" &&
      packet.name != "PlayerUpdateManagedPosition" &&
      packet.name != "ClientUpdate.MonitorTimeDrift"
    ) {
      debug(`Receive Data ${[packet.name]}`);
    }
    if (packet.flag === GatewayChannels.UpdatePosition) {
      if (packet.data.flags === 513) return;
      const movingCharacter = this._characters[client.character.characterId];
      if (movingCharacter) {
        this.sendRawToAllOthersWithSpawnedCharacter(
          client,
          movingCharacter.characterId,
          this._protocol.createPositionBroadcast2016(
            packet.data.raw,
            movingCharacter.transientId
          )
        );
      }
    }

    try {
      this._packetHandlers.processPacket(
        this,
        client,
        packet as ReceivedPacket<any>
      );
    } catch (error) {
      console.error(error);
      console.error(`An error occurred while processing a packet : `, packet);
      logVersion();
    }
  }

  async getIsAdmin(loginSessionId: string) {
    return Boolean(
      await this._db
        ?.collection(DB_COLLECTIONS.ADMINS)
        .findOne({ sessionId: loginSessionId })
    );
  }

  async onCharacterCreateRequest(client: LZConnectionClient, packet: any) {
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
        playTime: 0,
        worldSaveVersion: this.worldSaveVersion
      };
      const collection = this._db.collection(DB_COLLECTIONS.CHARACTERS);
      const charactersArray = await collection.findOne({
        characterId: character.characterId
      });
      if (!charactersArray) {
        await collection.insertOne(character);
      }
      this._loginConnectionManager.sendData(client, "CharacterCreateReply", {
        reqId: reqId,
        status: 1
      });
    } catch (error) {
      console.error(error);
      this._loginConnectionManager.sendData(client, "CharacterCreateReply", {
        reqId: reqId,
        status: 0
      });
    }
  }
  async onClientIsAdminRequest(client: LZConnectionClient, packet: any) {
    const { guid, reqId } = packet.data;
    const isAdmin = await this.getIsAdmin(guid);
    try {
      this._loginConnectionManager.sendData(client, "ClientIsAdminReply", {
        reqId: reqId,
        status: isAdmin
      });
    } catch (error) {
      console.error(error);
      this._loginConnectionManager.sendData(client, "ClientIsAdminReply", {
        reqId: reqId,
        status: 0
      });
    }
  }

  sendCharacterAllowedReply(
    client: LZConnectionClient,
    reqId: number,
    status: boolean,
    rejectionFlag?: CONNECTION_REJECTION_FLAGS,
    message = ""
  ) {
    this._loginConnectionManager.sendData(client, "CharacterAllowedReply", {
      reqId,
      status: status ? 1 : 0,
      rejectionFlag,
      message
    });
  }

  async onClientAllowedRequest(client: LZConnectionClient, packet: any) {
    const { characterId, loginSessionId, reqId } = packet.data;
    if (this.isRebooting) {
      console.log(
        `Character (${characterId}) connection rejected due to reboot`
      );
      this.sendCharacterAllowedReply(
        client,
        reqId,
        false,
        CONNECTION_REJECTION_FLAGS.SERVER_REBOOT
      );
      return;
    }

    if (this.isLocked && !(await this.getIsAdmin(loginSessionId))) {
      console.log(
        `Character (${characterId}) connection rejected due to server lock`
      );
      this.sendCharacterAllowedReply(
        client,
        reqId,
        false,
        CONNECTION_REJECTION_FLAGS.SERVER_LOCKED
      );
      return;
    }

    const ban = await this.isClientBanned(loginSessionId, client.address);
    if (ban) {
      console.log(
        `Character (${characterId}) connection rejected due to local ban`
      );

      const unbanTime = ban.expirationDate
          ? getDateString(ban.expirationDate)
          : 0,
        reason = ban.banReason;

      const reasonString = `You have been ${
        unbanTime ? "" : "permanently "
      }banned from the server${
        unbanTime ? ` until ${unbanTime}` : ""
      }. Reason: ${reason}.`;

      this.sendCharacterAllowedReply(
        client,
        reqId,
        false,
        CONNECTION_REJECTION_FLAGS.LOCAL_BAN,
        reasonString
      );
      return;
    }

    const rejectionFlags = packet.data.rejectionFlags ?? [];
    try {
      for (let i = 0; i < rejectionFlags.length; i++) {
        const rejectionFlag: number = rejectionFlags[i].rejectionFlag;
        if (
          this.fairPlayManager.acceptedRejectionTypes.includes(rejectionFlag)
        ) {
          if (rejectionFlag === CONNECTION_REJECTION_FLAGS.VPN) {
            const userIsAllowedToUseVPN = await this._db
              .collection(DB_COLLECTIONS.VPN_WHITELIST)
              .findOne({
                zoneSessionId: loginSessionId
              });
            if (userIsAllowedToUseVPN) {
              continue;
            }
          }
          console.log(
            `Character (${characterId}) connection rejected due to rejection type ${rejectionFlag}`
          );
          this.sendCharacterAllowedReply(client, reqId, false, rejectionFlag);
          return;
        }
      }
      const collection = this._db.collection(DB_COLLECTIONS.CHARACTERS);
      const character = await collection.findOne({
        characterId: characterId,
        serverId: this._worldId,
        status: 1
      });
      if (!character) {
        this.sendCharacterAllowedReply(
          client,
          reqId,
          false,
          CONNECTION_REJECTION_FLAGS.CHARACTER_NOT_FOUND
        );
      }
      this.sendCharacterAllowedReply(client, reqId, true);
    } catch (error) {
      console.log(error);
      this.sendCharacterAllowedReply(
        client,
        reqId,
        false,
        CONNECTION_REJECTION_FLAGS.ERROR
      );
    }
  }

  getProximityItems(client: Client): ClientUpdateProximateItems {
    const proximityItems: ClientUpdateProximateItems = { items: [] };

    for (const object of client.spawnedEntities) {
      if (object instanceof ItemObject) {
        if (
          isPosInRadiusWithY(
            this.proximityItemsDistance,
            client.character.state.position,
            object.state.position,
            1
          )
        ) {
          const proximityItem = {
            itemDefinitionId: object.item.itemDefinitionId,
            associatedCharacterGuid: object.characterId,
            itemData: {
              itemDefinitionId: object.item.itemDefinitionId,
              tintId: 0,
              guid: object.item.itemGuid,
              count: object.item.stackCount,
              itemSubData: {
                hasSubData: false
              },
              unknownBoolean1: true,
              ownerCharacterId: object.characterId,
              unknownDword9: 1
            }
          };
          (proximityItems.items as any[]).push(proximityItem);
        }
      }

      if (object instanceof LootableConstructionEntity) {
        if (
          isPosInRadiusWithY(
            2,
            client.character.state.position,
            object.state.position,
            1
          )
        ) {
          if (object.parentObjectCharacterId) {
            const parent = object.getParent(this);
            if (
              parent &&
              parent.isSecured &&
              client.character.isHidden != parent.characterId
            ) {
              continue;
            }
          }
          const container = object.getContainer();
          if (container) {
            Object.values(container.items).forEach((item: BaseItem) => {
              const proximityItem = {
                itemDefinitionId: item.itemDefinitionId,
                associatedCharacterGuid: client.character.characterId,
                itemData: object.pGetItemData(
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

      if (object instanceof LootableProp) {
        if (
          isPosInRadiusWithY(
            2,
            client.character.state.position,
            object.state.position,
            1
          ) &&
          client.searchedProps.includes(object)
        ) {
          const container = object.getContainer();
          if (container) {
            Object.values(container.items).forEach((item: BaseItem) => {
              const proximityItem = {
                itemDefinitionId: item.itemDefinitionId,
                associatedCharacterGuid: client.character.characterId,
                itemData: object.pGetItemData(
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

      if (object instanceof Lootbag) {
        if (
          isPosInRadiusWithY(
            2,
            client.character.state.position,
            object.state.position,
            1
          )
        ) {
          const container = object.getContainer();
          if (container) {
            Object.values(container.items).forEach((item: BaseItem) => {
              const proximityItem = {
                itemDefinitionId: item.itemDefinitionId,
                associatedCharacterGuid: client.character.characterId,
                itemData: object.pGetItemData(
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
    }

    return proximityItems;
  }

  async fetchCharacterData(client: Client) {
    if (!this.hookManager.checkHook("OnSendCharacterData", client)) return;
    if (!(await this.hookManager.checkAsyncHook("OnSendCharacterData", client)))
      return;
    let savedCharacter: FullCharacterSaveData;
    try {
      savedCharacter = await this.worldDataManager.fetchCharacterData(
        client.character.characterId
      );
    } catch (e) {
      console.log(e);
      this.sendData<LoginFailed>(client, "LoginFailed", {});
      return;
    }
    await this.loadCharacterData(
      client,
      savedCharacter as FullCharacterSaveData
    );
    client.startingPos = client.character.state.position;
  }

  sendCharacterData(client: Client) {
    this.sendData<SendSelfToClient>(
      client,
      "SendSelfToClient",
      client.character.pGetSendSelf(this, client)
    );
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

    // temp custom logic for items with custom itemDefintion data

    const defs: Array<any> = [];
    Object.values(this._itemDefinitions).forEach((itemDef: ItemDefinition) => {
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
      if (itemDef.ID >= 3941 && itemDef.ID < 3959) {
        // new js base stuff for fun
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

    const itemDefinitionsCache = this._protocol.pack(
      "Command.ItemDefinitions",
      {
        data: {
          itemDefinitions: defs
        }
      }
    );
    if (!itemDefinitionsCache) return;
    this.itemDefinitionsCache = itemDefinitionsCache;
  }

  private packDynamicAppearance() {
    const dynamicAppearanceCache = this._protocol.pack(
      "ReferenceData.DynamicAppearance",
      {
        ITEM_APPEARANCE_DEFINITIONS:
          this.dynamicappearance.ITEM_APPEARANCE_DEFINITIONS,
        SHADER_SEMANTIC_DEFINITIONS:
          this.dynamicappearance.SHADER_SEMANTIC_DEFINITIONS,
        SHADER_PARAMETER_DEFINITIONS:
          this.dynamicappearance.SHADER_PARAMETER_DEFINITIONS
      }
    );
    if (!dynamicAppearanceCache) return;
    this.dynamicAppearanceCache = dynamicAppearanceCache;
  }
  /**
   * Caches weapon definitons so they aren't packed every time a client logs in.
   */
  private packWeaponDefinitions() {
    const weaponDefinitionsCache = this._protocol.pack(
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
    if (!weaponDefinitionsCache) return;
    this.weaponDefinitionsCache = weaponDefinitionsCache;
  }

  /**
   * Caches projectile definitons so they aren't packed every time a client logs in.
   */
  private packProjectileDefinitions() {
    const projectileDefinitionsCache = this._protocol.pack(
      "ReferenceData.ProjectileDefinitions",
      {
        definitionsData: projectileDefinitons
      }
    );

    if (!projectileDefinitionsCache) return;
    this.projectileDefinitionsCache = projectileDefinitionsCache;
  }

  /**
   * Caches profile definitons so they aren't packed every time a client logs in.
   */
  private packProfileDefinitions() {
    const profileDefinitionsCache = this._protocol.pack(
      "ReferenceData.ProfileDefinitions",
      {
        data: {
          profiles: profileDefinitions
        }
      }
    );

    if (!profileDefinitionsCache) return;
    this.profileDefinitionsCache = profileDefinitionsCache;
  }

  /**
   * Caches itemClass definitons so they aren't packed every time a client logs in.
   */
  private packitemClassDefinitions() {
    const itemClassDefinitionsCache = this._protocol.pack(
      "ReferenceData.ItemClassDefinitions",
      {
        ITEMCLASS_DEFINITIONS: Object.values(itemClassDefinitions).map(
          (itemClassDefinition: any) => {
            return {
              ID: itemClassDefinition.ID,
              ITEMCLASS_DATA: {
                ...itemClassDefinition
              }
            };
          }
        )
      }
    );

    if (!itemClassDefinitionsCache) return;
    this.itemClassDefinitionsCache = itemClassDefinitionsCache;
  }

  private async initializeLoginServerConnection() {
    debug("Starting H1emuZoneServer");
    if (!this._loginServerInfo.address) {
      await this.fetchLoginInfo();
    }
    this._loginConnectionManager.setLoginInfo(this._loginServerInfo, {
      serverId: this._worldId,
      h1emuVersion: process.env.H1Z1_SERVER_VERSION || "unknown",
      serverRuleSets: this.serverGameRules
    });
    this._loginConnectionManager.start();
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
    if (savedCharacter.characterName == undefined) {
      console.log(
        `ERROR: Undefined character name found for client ${client.loginSessionId}`
      );
      savedCharacter.characterName =
        "CharacterNameError" + savedCharacter.characterId.slice(-5);
    }
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
    client.character.groupId = savedCharacter.groupId || 0;
    client.character.playTime = savedCharacter.playTime || 0;
    client.character.lastDropPlaytime = savedCharacter.lastDropPlayTime || 0;

    let newCharacter = false;
    if (_.isEqual(savedCharacter.position, [0, 0, 0, 1])) {
      // if position hasn't changed
      newCharacter = true;
    }
    // https://github.com/QuentinGruber/h1z1-server/issues/2117
    if (savedCharacter.position.length < 4) {
      newCharacter = true;
      setTimeout(() => {
        this.sendAlert(
          client,
          "You've been respawned due to lost position data"
        );
      }, 30000);
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
    // TODO: Disabled for now
    // await this.navManager.loadNav();
    this.weatherManager.init();
    this.playTimeManager.init(this);
    this.initModelsDataSource();
    this.worldDataManager = (await spawn(
      new Worker("./managers/worlddatamanagerthread")
    )) as unknown as WorldDataManagerThreaded;
    await this.worldDataManager.initialize(this._worldId, this._mongoAddress);
    if (!this._soloMode) {
      [this._db, this._mongoClient] = await WorldDataManager.getDatabase(
        this._mongoAddress
      );
    }
    let isANewWorld: boolean = true;
    if (this.enableWorldSaves) {
      const loadedWorld = await this.worldDataManager.getServerData(
        this._worldId
      );
      if (loadedWorld != null) {
        isANewWorld = false;
        if (loadedWorld.lastItemGuid) {
          this.lastItemGuid = BigInt(loadedWorld.lastItemGuid);
        }
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
      fetchedWorldData.traps.forEach((entityData) => {
        WorldDataManager.loadTraps(this, entityData);
      });
      fetchedWorldData.vehicles.forEach((entityData) => {
        WorldDataManager.loadVehicles(this, entityData);
      });
      console.timeEnd("fetch world data");
    }

    if (isANewWorld) {
      // Looks like there's no player spawned objects on the map, so we can assume an object can be spawned
      const stash = this.constructionManager.placeStashEntity(
        this,
        1697,
        9248,
        new Float32Array([481.47, 109.86, 2848.61, 1]),
        new Float32Array([0, 2.49, 0, 0]),
        new Float32Array([1, 1, 1, 1]),
        ""
      );
      stash.lootItem(this, this.generateItem(Items.WEAPON_AR15, 1, true)); // A gift from Legends
      stash.lootItem(this, this.generateItem(Items.CANDLE, 1, true)); // A gift from Jason - We've discussed the Crossbow so many times, but with storage limits its not possible to put here so I'll burn a candle for you, for sure.
      stash.lootItem(this, this.generateItem(Items.WATER_PURE, 1, true)); // A gift from TaxMax
      stash.lootItem(this, this.generateItem(Items.WEAPON_308, 1, true)); // A gift from Ghost
      stash.lootItem(this, this.generateItem(Items.WEAPON_AK47, 1, true)); // A gift from Doggo
      stash.lootItem(this, this.generateItem(Items.GROUND_TILLER, 1, true)); // A gift from Meme - He found out that people were using ground tillers to float decks in the air, we discussed this issue in DMs. RIP, friend.
    }

    if (!this._soloMode) {
      await this.initializeLoginServerConnection();
    }

    // !!ANYTHING THAT USES / GENERATES ITEMS MUST BE CALLED AFTER WORLD DATA IS LOADED!!

    //this.packItemDefinitions(); // No longer necessary, we'll see if only sending the required items will impact server performance
    this.packWeaponDefinitions();
    this.packProjectileDefinitions();
    this.packProfileDefinitions();
    this.packitemClassDefinitions();
    this.packDynamicAppearance();
    this.worldObjectManager.createDoors(this);
    this.worldObjectManager.createProps(this);

    await this.pluginManager.initializePlugins(this);

    this.customizeStaticDTOs();

    this._ready = true;
    console.log(
      `Server saving ${this.enableWorldSaves ? "enabled" : "disabled"}.`
    );
    debug("Server ready");
  }

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
        if (
          entity.parentObjectCharacterId == this._serverGuid ||
          entity instanceof WaterSource ||
          (entity instanceof TrapEntity && entity?.worldOwned)
        )
          return; // Don't save world spawned campfires / barbeques
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
      const traps: TrapSaveData[] = [];
      Object.values(this._traps).forEach((entity) => {
        if (entity instanceof TrapEntity && !entity.worldOwned) {
          traps.push(WorldDataManager.getTrapSaveData(entity, this._worldId));
        }
      });
      Object.values(this._explosives).forEach((entity) => {
        if (entity instanceof ExplosiveEntity && entity.isLandmine()) {
          traps.push(WorldDataManager.getTrapSaveData(entity, this._worldId));
        }
      });

      console.timeEnd("ZONE: processing");

      await this.worldDataManager.saveWorld({
        lastGuidItem: this.lastItemGuid,
        characters,
        worldConstructions,
        crops,
        traps,
        constructions,
        vehicles
      });
      this._isSaving = false;
      this.sendChatTextToAdmins("World saved!");
      this.nextSaveTime = Date.now() + this.saveTimeInterval;
      debug("World saved!");
    } catch (e) {
      console.log(e);
      this._isSaving = false;
      this.sendChatTextToAdmins("World save failed!");
    }
  }

  executeRconCommand(ws: WebSocket, payload: string) {
    payload = payload.replaceAll("/", "");
    const splitMessage = payload.split(" ");
    const commandName = splitMessage[0];
    console.log(`[RCON]Execute command "${commandName}"`);
    const commandHash: number = flhash(commandName.toUpperCase());
    const args: string = payload.replace(commandName, "").trim();
    const fakeClient = this.createClient(0, "", "", "", 0);
    // Admin rights for the Rcon client but we should add that as an option in the config
    fakeClient.permissionLevel = 2;
    this.commandHandler.executeCommand(this, fakeClient, {
      name: "Command.ExecuteCommand",
      data: { commandHash, arguments: args }
    });
    ws.send(`Execute ${payload}`);
  }

  handleRconMessage(ws: WebSocket, message: RconMessage) {
    switch (message.type) {
      case RconMessageType.ExecCommand:
        if (typeof message.payload === "string") {
          this.executeRconCommand(ws, message.payload);
        }
    }
  }

  startH1emuAi() {
    setInterval(() => {
      if (process.env.ENABLE_AI_TIME_LOGS) {
        const start = performance.now();
        this.aiManager.run();
        const end = performance.now();
        console.log(`H1emu-ai took ${end - start}ms`);
      } else {
        this.aiManager.run();
      }
    }, 100);
  }

  async start(): Promise<void> {
    debug("Starting server");
    debug(`Protocol used : ${this._protocol.protocolName}`);
    if (!this.hookManager.checkHook("OnServerInit")) return;
    if (!(await this.hookManager.checkAsyncHook("OnServerInit"))) return;

    await this.setupServer();
    if (this.isPvE) {
      console.log("Server in PvE mode");
    }
    this.fairPlayManager.decryptFairPlayValues();
    this._spawnGrid = this.divideMapIntoSpawnGrid(7448, 7448, 744);
    this.speedtreeManager.initiateList();
    this.startRoutinesLoop();
    this.smeltingManager.checkSmeltables(this);
    this.smeltingManager.checkCollectors(this);
    this.decayManager.run(this);
    this._serverStartTime = getCurrentServerTimeWrapper();
    this.weatherManager.startWeatherWorker(this);
    this.inGameTimeManager.start();
    if (!this._soloMode) {
      this.accountInventoriesManager.init(
        this._db.collection(DB_COLLECTIONS.ACCOUNT_ITEMS)
      );
    }
    this._gatewayServer.start();
    this.worldRoutineTimer = setTimeout(
      () => this.worldRoutine.bind(this)(),
      this.worldRoutineRate
    );
    this.initHudIndicatorDataSource();
    this.initScreenEffectDataSource();
    this.initClientEffectsDataSource();
    this.initUseOptionsDataSource();
    this.rconManager.start();
    this.rconManager.on("message", this.handleRconMessage.bind(this));
    this.rewardManager.start();
    this.hookManager.checkHook("OnServerReady");
    if (this._soloMode || process.env.ENABLE_AI) {
      this.startH1emuAi();
    }
  }

  async sendInitData(client: Client) {
    // Load character before sending sendSelf, as we need to send item definitions for the inventory to the client first. This is the same behaviour as Z1BR
    await this.fetchCharacterData(client);

    // This packet is only necessary for transitioning between different zones.
    // KOTK / Z1BR handle it this way because the main menu is also considered a zone, which is not the case in JS.
    /*this.sendData<ClientBeginZoning>(client, "ClientBeginZoning", {
      position: client.character.state.position,
      rotation: client.character.state.rotation,
      skyData: this.weatherManager.weather
    });*/

    this.sendData<InitializationParameters>(
      client,
      "InitializationParameters",
      {
        ENVIRONMENT: "LIVE", // LOCAL, MAIN, QA, TEST, STAGE, LIVE, //THE_NINE, INNOVA
        unknownString1: "SKU_Is_JustSurvive", //JS.Environment
        rulesetDefinitions: Object.values(gameRulesSource).map(
          (gameRule: any) => {
            return {
              RULESET_ID: gameRule.ID,
              RULESET_ID_: gameRule.ID,
              ruleset: gameRule.RULESET,
              rulesets: Object.values(gameRule?.RULESETS || []).map(
                (ruleSet: any) => {
                  return {
                    ID: ruleSet.ID,
                    DATA: {
                      ...ruleSet
                    }
                  };
                }
              )
            };
          }
        )
      }
    );

    this.sendData<SendZoneDetails>(client, "SendZoneDetails", {
      zoneName: "Z1",
      zoneType: 4,
      unknownBoolean1: false,
      skyData: this.weatherManager.weather,
      zoneId1: 5,
      geometryId: 5,
      nameId: 7699,
      unknownBoolean2: true,
      lighting: "Lighting_JustSurvive.txt",
      isInvitational: false
    });

    this.sendData<ClientGameSettings>(client, "ClientGameSettings", {
      interactionCheckRadius: 16, // need it high for tampers
      unknownBoolean1: true,
      timescale: 1.0,
      enableWeapons: 1, // no longer seems to do anything, used to disable weapons from working
      Unknown5: 1,
      unknownFloat1: 0.0,
      fallDamageVelocityThreshold: 15,
      fallDamageVelocityMultiplier: 11
    });

    // Item definitions are only required if custom icons for items or entirely custom items are needed.
    // This could be an interesting feature to implement in a plugin.
    /*const inventoryItemIds = client.character
      .pGetInventoryItems(this)
      .map((it) => it.itemDefinitionId);
    if (inventoryItemIds) {
      this.sendData(client, "Command.ItemDefinitions", {
        data: {
          itemDefinitions: Object.values(this._itemDefinitions)
            .filter(
              (item) =>
                inventoryItemIds.includes(item.ID) &&
                !["Foundation", "ConstructionSocketBound"].includes(
                  item.CODE_FACTORY_NAME
                )
            ) // Filter out construction items that aren't freeplace, because they will be handled as freeplace objects if you do. My guess is that this packet structure isn't 100% correct yet. - Jason
            .map((itemDef) => {
              return {
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
              };
            })
        }
      });
    }*/
    if (!this.weaponDefinitionsCache) {
      this.packWeaponDefinitions();
    }
    if (this.weaponDefinitionsCache) {
      this.sendRawDataReliable(client, this.weaponDefinitionsCache);
    }

    // Initially, send only the skin tones to ensure the character displays the correct skin tone.
    this.sendData(client, "ReferenceData.DynamicAppearance", {
      ITEM_APPEARANCE_DEFINITIONS: [],
      SHADER_SEMANTIC_DEFINITIONS: [],
      SHADER_PARAMETER_DEFINITIONS:
        this.dynamicappearance.SHADER_PARAMETER_DEFINITIONS.filter((def) =>
          [125, 129, 122].includes(def?.ID)
        )
    });

    this.sendCharacterData(client);

    // Now we can send all the rest of the data while the player is at the loading screen.
    // This ensures the player doesn't have to wait on the loading screen after clicking 'join', as this packet is large.
    // Z1BR resolved this issue by using LZ4 to compress this block. We can easily add this in the patch, but we'll implement it if users start experiencing network issues.
    // FYI: This was tested with 40 players on my server without any issues. - Jason
    if (!this.dynamicAppearanceCache) {
      this.packDynamicAppearance();
    }
    if (this.dynamicAppearanceCache) {
      this.sendRawDataReliable(client, this.dynamicAppearanceCache);
    }
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
      this._grid = this.divideMapIntoGrid(8196, 8196, 250);
    if (
      obj instanceof Vehicle ||
      obj instanceof Character // ||
      //(obj instanceof ConstructionChildEntity && !obj.getParent(this)) ||
      //(obj instanceof LootableConstructionEntity && !obj.getParent(this))
    ) {
      // dont push objects that can change its position
      return;
    }
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
    client.chunkRenderDistance = lowerRenderDistance ? 600 : 700;
  }

  private async worldRoutine() {
    if (!this.hookManager.checkHook("OnWorldRoutine")) return;
    else {
      if (this._ready) {
        this.constructionManager.plantManager(this);
        await scheduler.yield();
        this.worldObjectManager.run(this);
        await scheduler.yield();
        this.checkVehiclesInMapBounds();
        await scheduler.yield();
        this.setTickRate();
        this.syncAirdrop();
        await scheduler.yield();
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

  async deleteClient(client: Client) {
    if (!client) {
      this.setTickRate();
      return;
    }

    if (client.afkTimer) {
      clearInterval(client.afkTimer);
    }

    if (client.character) {
      if (client.character.h1emu_ai_id) {
        this.aiManager.remove_entity(client.character.h1emu_ai_id);
      }
      client.isLoading = true; // stop anything from acting on character

      clearTimeout(client.character?.resourcesUpdater);
      try {
        const characterSave = WorldDataManager.convertToCharacterSaveData(
          client.character,
          this._worldId
        );
        if (this.enableWorldSaves) {
          if (this._soloMode) {
            await this.saveWorld();
          } else {
            await this.worldDataManager.saveCharacterData(
              characterSave,
              this.lastItemGuid
            );
          }
        }
      } catch (e) {
        console.error("Failed to save a character");
        console.error(e);
      }
      this.dismountVehicle(client);
      client.managedObjects?.forEach((characterId: string) => {
        this.dropVehicleManager(client, characterId);
      });
      this.deleteEntity(client.character.characterId, this._characters);

      if (!this._soloMode) {
        this.groupManager.handlePlayerDisconnect(this, client);
      }
    }
    delete this._clients[client.sessionId];
    this._gatewayServer.deleteSoeClient(client.soeClientId);
    if (!this._soloMode) {
      this.sendZonePopulationUpdate();
    }
    this.setTickRate();
  }

  async generateDamageRecord(
    targetCharacterId: string,
    damageInfo: DamageInfo,
    oldHealth: number
  ): Promise<DamageRecord> {
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
      const sourceSOEClientAvgPing = this._gatewayServer.getSoeClientAvgPing(
        sourceClient.soeClientId
      );
      sourcePing = sourceSOEClientAvgPing ?? 0;
    } else if (!sourceClient && targetClient) {
      targetName = targetClient.character.name || "Unknown";
      const targetSOEClientAvgPing = this._gatewayServer.getSoeClientAvgPing(
        targetClient.soeClientId
      );
      targetPing = targetSOEClientAvgPing ?? 0;
    } else if (sourceClient && targetClient) {
      const sourceSOEClientAvgPing = this._gatewayServer.getSoeClientAvgPing(
        sourceClient.soeClientId
      );
      const targetSOEClientAvgPing = this._gatewayServer.getSoeClientAvgPing(
        targetClient.soeClientId
      );
      sourcePing = sourceSOEClientAvgPing ?? 0;
      sourceName = sourceClient.character.name || "Unknown";
      targetName = targetClient.character.name || "Unknown";
      targetPing = targetSOEClientAvgPing ?? 0;
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
    this.sendData<ClientUpdateDeathMetrics>(
      client,
      "ClientUpdate.DeathMetrics",
      {
        recipesDiscovered: client.character.metrics.recipesDiscovered,
        zombiesKilled: client.character.metrics.zombiesKilled,
        minutesSurvived:
          (Date.now() - client.character.metrics.startedSurvivingTP) / 60000,
        wildlifeKilled: client.character.metrics.wildlifeKilled
      }
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

    this.sendData<ClientUpdateUpdateLockoutTimes>(
      client,
      "ClientUpdate.UpdateLockoutTimes",
      {
        unk: gridArr,
        bool: true
      }
    );
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
      this.sendDataToAllWithSpawnedEntity<CharacterStartMultiStateDeath>(
        this._characters,
        client.character.characterId,
        "Character.StartMultiStateDeath",
        {
          characterId: client.character.characterId
        }
      );
    } else {
      this.sendDataToAllOthersWithSpawnedEntity<CharacterStartMultiStateDeath>(
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
          this.damageItem(client.character, slot, 350);
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
      this.sendData<CharacterKilledBy>(this._clients[a], "Character.KilledBy", {
        killer: damageInfo.entity,
        killed: client.character.characterId
      });
    }
  }

  async explosionDamage(sourceEntity: BaseEntity, client?: Client) {
    const position = sourceEntity.state.position;

    if (!sourceEntity) return;

    // render distance is max client.chunkRenderDistance, could probably be lowered a lot
    // - meme
    for (const gridCell of this._grid) {
      if (!isPosInRadius(400, gridCell.position, position)) {
        continue;
      }
      for (const object of gridCell.objects) {
        // explosives still chain explode on PvE
        if (!(object instanceof ExplosiveEntity) && this.isPvE) continue;

        // await is for ExplosiveEntity, ignore error
        object.OnExplosiveHit(this, sourceEntity, client);
      }
    }

    if (this.isPvE) return;

    // these entities do not use the grid system

    for (const characterId in this._characters) {
      const character = this._characters[characterId];
      character.OnExplosiveHit(this, sourceEntity);
    }
    for (const vehicleKey in this._vehicles) {
      const vehicle = this._vehicles[vehicleKey];
      await vehicle.OnExplosiveHit(this, sourceEntity);
    }
  }
  createProjectileNpc(client: Client, data: any) {
    const fireHint = client.fireHints[data.projectileId];
    if (!fireHint) return;
    const weaponItem = fireHint.weaponItem;
    if (!weaponItem) return;
    const itemDefId = weaponItem.itemDefinitionId,
      itemDef = this.getItemDefinition(itemDefId);
    if (!itemDef) return;
    const weaponDefId = itemDef.PARAM1;

    switch (weaponDefId) {
      case WeaponDefinitionIds.WEAPON_BOW_MAKESHIFT:
      case WeaponDefinitionIds.WEAPON_BOW_RECURVE:
      case WeaponDefinitionIds.WEAPON_CROSSBOW:
      case WeaponDefinitionIds.WEAPON_BOW_WOOD:
        delete client.fireHints[data.projectileId];
        this.worldObjectManager.createLootEntity(
          this,
          this.generateItem(Items.AMMO_ARROW),
          data.position,
          data.rotation
        );
        break;
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

    this.sendDataToAllWithSpawnedEntity<CommandPlayDialogEffect>(
      this._characters,
      client.character.characterId,
      "Command.PlayDialogEffect",
      {
        characterId: client.character.characterId,
        effectId: 0
      }
    );

    const randomSpawnIndex = Math.floor(
      Math.random() * cell.spawnPoints.length
    );
    if (client.character.initialized) {
      client.managedObjects?.forEach((characterId) => {
        this.dropVehicleManager(client, characterId);
      });
      this.sendData<CharacterRespawnReply>(client, "Character.RespawnReply", {
        characterId: client.character.characterId,
        status: true
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
      this.sendData<ClientUpdateUpdateLocation>(
        client,
        "ClientUpdate.UpdateLocation",
        {
          position: tempPos2
        }
      );
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
    client.character.resetResources(this);
    this.updateCharacterState(
      client,
      client.character.characterId,
      client.character.characterStates,
      true
    );

    // fixes characters showing up as dead if they respawn close to other characters
    if (client.character.initialized) {
      this.sendDataToAllOthersWithSpawnedEntity<CharacterRemovePlayer>(
        this._characters,
        client,
        client.character.characterId,
        "Character.RemovePlayer",
        {
          characterId: client.character.characterId
        }
      );
      setTimeout(() => {
        if (!client?.character) return;
        this.sendDataToAllOthersWithSpawnedEntity<AddLightweightPc>(
          this._characters,
          client,
          client.character.characterId,
          "AddLightweightPc",
          client.character.pGetLightweightPC(this, client)
        );
      }, 2000);
    }
    client.character.updateEquipment(this);
    this.hookManager.checkHook("OnPlayerRespawned", client);
  }

  requestModules(client: Client) {
    if (!client.isLoading && client.characterReleased && client.isSynced) {
      this.sendData(client, "H1emu.RequestModules", {});
    }
  }

  updateResource(
    client: Client,
    entityId: string,
    value: number,
    resourceId: number,
    resourceType?: number // most resources have the same id and type
  ) {
    this.sendData<ResourceEvent>(client, "ResourceEvent", {
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
    dictionary: EntityDictionary<BaseEntity>
  ) {
    this.sendDataToAllWithSpawnedEntity<ResourceEvent>(
      dictionary,
      entityId,
      "ResourceEvent",
      {
        eventData: {
          type: 3,
          value: {
            characterId: entityId,
            resourceId: resourceId,
            resourceType: resourceType,
            initialValue: value >= 0 ? value : 0
          }
        }
      }
    );
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

  getEntity(entityKey: string = ""): BaseEntity | undefined {
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
      this._traps[entityKey] ||
      undefined
    );
  }

  getEntityDictionary(
    entityKey: string
  ): EntityDictionary<BaseEntity> | undefined {
    switch (true) {
      case !!this._npcs[entityKey]:
        return this._npcs;
      case !!this._vehicles[entityKey]:
        return this._vehicles;
      case !!this._characters[entityKey]:
        return this._characters;
      case !!this._spawnedItems[entityKey]:
        return this._spawnedItems;
      case !!this._doors[entityKey]:
        return this._doors;
      case !!this._explosives[entityKey]:
        return this._explosives;
      case !!this._constructionFoundations[entityKey]:
        return this._constructionFoundations;
      case !!this._constructionDoors[entityKey]:
        return this._constructionDoors;
      case !!this._constructionSimple[entityKey]:
        return this._constructionSimple;
      case !!this._lootbags[entityKey]:
        return this._lootbags;
      case !!this._lootableConstruction[entityKey]:
        return this._lootableConstruction;
      case !!this._lootableProps[entityKey]:
        return this._lootableProps;
      case !!this._worldLootableConstruction[entityKey]:
        return this._worldLootableConstruction;
      case !!this._worldSimpleConstruction[entityKey]:
        return this._worldSimpleConstruction;
      case !!this._plants[entityKey]:
        return this._plants;
      case !!this._taskProps[entityKey]:
        return this._taskProps;
      case !!this._crates[entityKey]:
        return this._crates;
      case !!this._destroyables[entityKey]:
        return this._destroyables;
      case !!this._temporaryObjects[entityKey]:
      default:
        return;
    }
  }

  damageItem(
    character: BaseFullCharacter,
    item: LoadoutItem | BaseItem,
    damage: number
  ) {
    if (item.itemDefinitionId == Items.WEAPON_FISTS) return;

    // break armor if it goes below 100 health, this helps in shotgun fights
    // so 1 pump fully breaks an armor if most pellets are hit
    if (
      this.isArmor(item.itemDefinitionId) &&
      item.currentDurability - damage <= 100
    ) {
      damage = item.currentDurability;
    }

    item.currentDurability -= damage;
    if (item.currentDurability <= 0) {
      this.removeInventoryItem(character, item);
      if (this.isWeapon(item.itemDefinitionId)) {
        character.lootContainerItem(
          this,
          this.generateItem(Items.BROKEN_METAL_ITEM)
        );
      }
      return;
    }

    const client = this.getClientByCharId(character.characterId);
    if (client) this.updateItem(client, item);
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

  getClientByName(name: string) {
    let similar: string = "";
    const targetClient: Client | undefined = Object.values(this._clients).find(
      (c) => {
        const clientName = c.character.name?.toLowerCase().replaceAll(" ", "_");
        if (!clientName) return;
        if (clientName == name.toLowerCase()) {
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

  getClientByLoginSessionId(loginSessionId: string) {
    const targetClient: Client | undefined = Object.values(this._clients).find(
      (c) => {
        if (c.loginSessionId == loginSessionId) return c;
      }
    );
    return targetClient;
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

  async getOfflineClientByName(
    name: string
  ): Promise<string | Client | undefined> {
    const characters = await this._db
      .collection(DB_COLLECTIONS.CHARACTERS)
      .find({
        characterName: { $regex: `.*${name}.*`, $options: "i" }
      })
      .toArray();

    for (const c of characters) {
      const clientName = c.characterName?.toLowerCase().replaceAll(" ", "_");
      if (!clientName) return;
      if (clientName == name.toLowerCase()) {
        const client = this.createClient(
          -1,
          "",
          clientName,
          c.characterId,
          this.getTransientId(c.characterId)
        );
        client.character.name = c.characterName;
        client.character.mutedCharacters = c.mutedCharacters;
        return client;
      } else if (
        getDifference(name.toLowerCase(), clientName) <= 3 &&
        getDifference(name.toLowerCase(), clientName) != 0
      )
        return c.characterName;
    }

    return undefined;
  }

  applyHelmetDamageReduction(
    character: BaseFullCharacter,
    damage: number,
    weaponDmgModifier = 1
  ): number {
    // prevent helmet damage in godmode / temp godmode
    if (character instanceof Character && character.isGodMode()) {
      return damage;
    }

    if (!character.hasHelmet(this)) {
      return damage;
    }

    const helmetDmgModifier = 0.25;

    damage *= helmetDmgModifier;
    this.damageItem(
      character,
      character._loadout[LoadoutSlots.HEAD],
      damage / weaponDmgModifier
    );
    return damage;
  }

  applyArmorDamageReduction(
    character: BaseFullCharacter,
    damage: number,
    weaponDmgModifier = 4
  ): number {
    // prevent armor damage in godmode / temp godmode
    if (character instanceof Character && character.isGodMode()) {
      return damage;
    }

    // hasArmor is not used since itemDef is needed later in this function
    const slot = character._loadout[LoadoutSlots.ARMOR],
      itemDef = this.getItemDefinition(slot?.itemDefinitionId);
    if (!slot || !slot.itemDefinitionId || !itemDef) {
      return damage;
    }

    // these should be configurable
    const makeshiftDamageModifier = 0.7, // was 0.9
      kevlarDamageModifier = 0.5; // was 0.8

    // checking for plated or wooden armor, these don't have custom skins
    if (itemDef.DESCRIPTION_ID == 11151 || itemDef.DESCRIPTION_ID == 11153) {
      damage *= makeshiftDamageModifier;
      this.damageItem(character, slot, damage / (weaponDmgModifier / 2));
      return damage;
    }

    // all other kevlar armors
    damage *= kevlarDamageModifier;
    this.damageItem(character, slot, damage / (weaponDmgModifier / 2));

    return damage / weaponDmgModifier;
  }

  sendHitmarker(
    client: Client,
    hitLocation: string = "",
    hasHelmet: boolean,
    hasArmor: boolean,
    hasHelmetBefore: boolean,
    hasArmorBefore: boolean
  ) {
    let isHeadshot = 0;
    switch (hitLocation) {
      case "HEAD":
      case "GLASSES":
      case "NECK":
        isHeadshot = 1;
        break;
    }
    this.sendData<UiConfirmHit>(client, "Ui.ConfirmHit", {
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
            : !isHeadshot && hasArmorBefore && !hasArmor
              ? 1
              : 0
      }
    });
  }

  getWeaponHitEffect(itemDefinitionId?: Items) {
    const itemDefinition = this.getItemDefinition(itemDefinitionId);
    if (!itemDefinition) return;
    const weaponDefinitionId = itemDefinition.PARAM1;

    switch (weaponDefinitionId) {
      case WeaponDefinitionIds.WEAPON_SHOTGUN:
        return 1302;
      case WeaponDefinitionIds.WEAPON_308:
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
    const itemDefinition = this.getItemDefinition(itemDefinitionId);
    if (!itemDefinition) return 1000;
    const weaponDefinitionId = itemDefinition.PARAM1;

    switch (weaponDefinitionId) {
      case WeaponDefinitionIds.WEAPON_AR15:
      case WeaponDefinitionIds.WEAPON_1911:
      case WeaponDefinitionIds.WEAPON_BLAZE:
        return 2500;
      case WeaponDefinitionIds.WEAPON_M9:
        return 1800;
      case WeaponDefinitionIds.WEAPON_R380:
        return 1500;
      case WeaponDefinitionIds.WEAPON_SHOTGUN:
        return calculate_falloff(
          getDistance(sourcePos, targetPos),
          200,
          1400, //1667,
          1,
          12
        );
      case WeaponDefinitionIds.WEAPON_NAGAFENS_RAGE:
        return calculate_falloff(
          getDistance(sourcePos, targetPos),
          200,
          2000, //1667,
          3,
          20
        );
      case WeaponDefinitionIds.WEAPON_AK47:
      case WeaponDefinitionIds.WEAPON_FROSTBITE:
        return 2900;
      case WeaponDefinitionIds.WEAPON_308:
        return 6700;
      case WeaponDefinitionIds.WEAPON_REAPER:
        return 14000;
      case WeaponDefinitionIds.WEAPON_MAGNUM:
        return 3000;
      case WeaponDefinitionIds.WEAPON_BOW_MAKESHIFT:
        return 2500;
      case WeaponDefinitionIds.WEAPON_BOW_RECURVE:
        return 2500;
      case WeaponDefinitionIds.WEAPON_BOW_WOOD:
        return 2500;
      case WeaponDefinitionIds.WEAPON_CROSSBOW:
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
    if (!client.spawnedEntities.has(entity)) {
      return {
        isValid: false,
        message: "InvalidTarget"
      };
    }

    const target = this.getClientByCharId(entity.characterId);
    if (target) {
      if (!target.spawnedEntities.has(client.character)) {
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
    //if (!client.character.isAlive) return;
    // Should be able to trade while in combat

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
    // Don't allow hits registering over 350 as this is the render distance for NPC's
    if (
      getDistance2d(entity.state.position, client.character.state.position) >
      350
    )
      return;
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
      const itemDef = this.getItemDefinition(weaponItem.itemDefinitionId);
      if (!itemDef) return;
      const weaponDefinitionId = itemDef.PARAM1;

      switch (weaponDefinitionId) {
        case WeaponDefinitionIds.WEAPON_SHOTGUN:
        case WeaponDefinitionIds.WEAPON_NAGAFENS_RAGE:
          break;
        default:
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
      this.sendData<CharacterUpdateCharacterState>(
        client,
        "Character.UpdateCharacterState",
        updateCharacterStateBody
      );
    } else {
      this.sendDataToAllOthersWithSpawnedEntity<CharacterUpdateCharacterState>(
        this._characters,
        client,
        client.character.characterId,
        "Character.UpdateCharacterState",
        updateCharacterStateBody
      );
    }
  }

  customizeStaticDTOs() {
    // caches DTOs that should always be removed

    for (const object in this._lootableProps) {
      const prop = this._lootableProps[object];
      const propInstance = {
        objectId: prop.spawnerId,
        replacementModel: "Weapon_Empty.adr"
      };
      this.staticDTOs.push(propInstance);
    }

    for (const object in this._taskProps) {
      const prop = this._taskProps[object];
      const propInstance = {
        objectId: prop.spawnerId,
        replacementModel: "Weapon_Empty.adr"
      };
      this.staticDTOs.push(propInstance);
    }
    for (const object in this._crates) {
      const prop = this._crates[object];
      const propInstance = {
        objectId: prop.spawnerId,
        replacementModel: "Weapon_Empty.adr"
      };
      this.staticDTOs.push(propInstance);
    }
    for (let x = 0; x < this._destroyableDTOlist.length; x++) {
      const propInstance = {
        objectId: this._destroyableDTOlist[x],
        replacementModel: "Weapon_Empty.adr"
      };
      this.staticDTOs.push(propInstance);
    }
    deprecatedDoors.forEach((door: number) => {
      const DTOinstance = {
        objectId: door,
        replacementModel: "Weapon_Empty.adr"
      };
      this.staticDTOs.push(DTOinstance);
    });
    const cache = this._protocol.pack("DtoObjectInitialData", {
      unknownDword1: 1,
      unknownArray1: this.staticDTOs,
      unknownArray2: [{}]
    });
    if (cache) {
      this.initialDataStaticDtoCache = cache;
    }
  }

  customizeDTO(client: Client) {
    const speedtreeDTOs: Array<PropInstance> = [];
    this.speedtreeManager.customize(speedtreeDTOs);
    this.sendData<DtoObjectInitialData>(client, "DtoObjectInitialData", {
      unknownDword1: 1,
      unknownArray1: speedtreeDTOs,
      unknownArray2: [{}]
    });
    if (this.initialDataStaticDtoCache) {
      this.sendRawDataReliable(client, this.initialDataStaticDtoCache);
    }
  }

  private shouldRemoveEntity(client: Client, entity: BaseEntity): boolean {
    return (
      entity && // in case if entity is undefined somehow
      !(entity instanceof ConstructionParentEntity) &&
      !(entity instanceof Vehicle2016) &&
      (this.filterOutOfDistance(entity, client.character.state.position) ||
        this.constructionManager.shouldHideEntity(this, client, entity))
    );
  }

  private removeOutOfDistanceEntities(client: Client) {
    // does not include vehicles
    for (const entity of client.spawnedEntities) {
      if (this.shouldRemoveEntity(client, entity)) {
        this.sendData<CharacterRemovePlayer>(client, "Character.RemovePlayer", {
          characterId: entity.characterId
        });
        client.spawnedEntities.delete(entity);
      }
    }
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
    this.sendDataToAll<CharacterRemovePlayer>("Character.RemovePlayer", {
      characterId: characterId
    });
  }

  deleteEntity(
    characterId: string,
    dictionary: EntityDictionary<BaseEntity>,
    effectId?: number,
    timeToDisappear?: number
  ): boolean {
    if (!dictionary[characterId]) return false;
    this.sendDataToAllWithSpawnedEntity<CharacterRemovePlayer>(
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
      if (client.spawnedEntities.delete(dictionary[characterId])) {
        this.sendData<ClientUpdateProximateItems>(
          client,
          "ClientUpdate.ProximateItems",
          this.getProximityItems(client)
        );
      }
    }
    if (dictionary[characterId].h1emu_ai_id) {
      this.aiManager.remove_entity(dictionary[characterId].h1emu_ai_id);
    }
    delete dictionary[characterId];
    delete this._transientIds[this._characterIds[characterId]];
    delete this._characterIds[characterId];
    return true;
  }

  sendManagedObjectResponseControlPacket(
    client: Client,
    obj: ClientUpdateManagedObjectResponseControl
  ) {
    this.sendData<ClientUpdateManagedObjectResponseControl>(
      client,
      "ClientUpdate.ManagedObjectResponseControl",
      obj
    );
  }

  addLightweightNpc(
    client: Client,
    entity: BaseLightweightCharacter,
    nameId = 0
  ) {
    this.sendData<AddLightweightNpc>(client, "AddLightweightNpc", {
      ...entity.pGetLightweight(),
      nameId
    });
  }
  addSimpleNpc(client: Client, entity: BaseSimpleNpc) {
    this.sendData<AddSimpleNpc>(client, "AddSimpleNpc", entity.pGetSimpleNpc());
  }

  spawnSimpleNpcForAllInRange(entity: BaseSimpleNpc) {
    this.executeFuncForAllReadyClientsInRange((client) => {
      if (!client.spawnedEntities.has(entity)) {
        this.addSimpleNpc(client, entity);
        client.spawnedEntities.add(entity);
      }
    }, entity);
  }

  spawnContainerAccessNpc(client: Client) {
    /*
      Since all containers are now handled as SimpleNpcs instead of FullNpcs for 
      performance reasons, this npc is needed to act as a conduit between the 
      character and the simpleNpc's inventory so that the client thinks the target
      container is a FullNpc.
    */
    this.sendData<AddLightweightNpc>(client, "AddLightweightNpc", {
      characterId: EXTERNAL_CONTAINER_GUID,
      transientId: 0,
      actorModelId: 2,
      position: new Float32Array([0, 0, 0, 0]),
      rotation: new Float32Array([0, 0, 0, 0]),
      scale: new Float32Array([0.001, 0.001, 0.001, 0.001]),
      positionUpdateType: 0,
      profileId: 0,
      isLightweight: false,
      flags: {
        flags1: {},
        flags2: {},
        flags3: {}
      },
      headActor: "",
      attachedObject: {}
    });
  }

  spawnStaticBuildings(client: Client) {
    this.staticBuildings.forEach((v) => {
      this.sendData(client, "AddSimpleNpc", v);
    });
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
        !client.spawnedEntities.has(characterObj) &&
        characterObj.isAlive &&
        !characterObj.isSpectator &&
        !characterObj.isVanished &&
        (characterObj.isHidden == client.character.isHidden ||
          client.character.isSpectator) /* &&
        client.banType != "hiddenplayers"*/
      ) {
        this.sendData<AddLightweightPc>(
          client,
          "AddLightweightPc",
          characterObj.pGetLightweightPC(this, this._clients[c])
        );
        client.spawnedEntities.add(this._characters[characterObj.characterId]);
      }
    }
  }

  spawnCharacterToOtherClients(character: Character) {
    const client = this.getClientByCharId(character.characterId);
    if (!client) return;
    for (const a in this._clients) {
      const c = this._clients[a];
      if (
        isPosInRadius(
          character.npcRenderDistance || this.charactersRenderDistance,
          character.state.position,
          c.character.state.position
        ) &&
        !c.spawnedEntities.has(character) &&
        character != c.character
      ) {
        this.sendData<AddLightweightPc>(
          c,
          "AddLightweightPc",
          character.pGetLightweightPC(this, client)
        );
        c.spawnedEntities.add(character);
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
          client.spawnedEntities.has(object) ||
          !isPosInRadius(
            (object.npcRenderDistance as number) ||
              this.charactersRenderDistance,
            position,
            object.state.position
          )
        ) {
          continue;
        }

        if (object instanceof ConstructionParentEntity) {
          this.constructionManager.spawnConstructionParent(
            this,
            client,
            object
          );
          continue;
        }

        if (object instanceof ConstructionChildEntity) {
          this.constructionManager.spawnSimpleConstruction(
            this,
            client,
            object
          );
          continue;
        }

        if (object instanceof LootableConstructionEntity) {
          if (this.constructionManager.shouldHideEntity(this, client, object))
            continue;
          this.constructionManager.spawnLootableConstruction(
            this,
            client,
            object
          );
          continue;
        }

        if (object instanceof BaseSimpleNpc) {
          if (object instanceof Crate && object.spawnTimestamp > Date.now()) {
            continue;
          }
          client.spawnedEntities.add(object);
          this.addSimpleNpc(client, object);
          continue;
        }

        client.spawnedEntities.add(object);
        if (object instanceof BaseLightweightCharacter) {
          if (object.useSimpleStruct) {
            this.addSimpleNpc(client, object);
          } else {
            this.addLightweightNpc(client, object);
            if (object instanceof DoorEntity) {
              if (object.isOpen) {
                this.sendData<PlayerUpdatePosition>(
                  client,
                  "PlayerUpdatePosition",
                  {
                    transientId: object.transientId,
                    positionUpdate: {
                      sequenceTime: 0,
                      unknown3_int8: 0,
                      position: object.state.position,
                      orientation: object.openAngle
                    }
                  }
                );
              }
              continue;
            }
            if (object instanceof Npc) {
              object.updateEquipment(this);
              continue;
            }
          }
        }
      }
    }
  }

  private spawnLoadingGridObjects(client: Client) {
    const position = client.character.state.position;
    for (const gridCell of this._grid) {
      if (
        !isPosInRadius(client.chunkRenderDistance, gridCell.position, position)
      ) {
        continue;
      }
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

        if (client.spawnedEntities.has(object)) continue;

        if (object instanceof BaseSimpleNpc) {
          if (object instanceof Crate && object.spawnTimestamp > Date.now()) {
            continue;
          }
          client.spawnedEntities.add(object);
          this.addSimpleNpc(client, object);
          continue;
        }

        if (
          object instanceof BaseLightweightCharacter &&
          object.useSimpleStruct
        ) {
          client.spawnedEntities.add(object);
          this.addSimpleNpc(client, object);
        }
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
          this.sendData<POIChangeMessage>(client, "POIChangeMessage", {
            messageStringId: point.stringId,
            id: point.POIid
          });
          client.currentPOI = point.stringId;
        }
      }
    });
    if (!inPOI && client.currentPOI != 0) {
      // checks if POIChangeMessage was already cleared
      this.sendData<POIChangeMessage>(client, "POIChangeMessage", {
        messageStringId: 0,
        id: 115
      });
      client.currentPOI = 0;
    }
  }

  private _sendData<ZonePacket>(
    client: Client,
    packetName: h1z1PacketsType2016,
    obj: ZonePacket,
    channel: SOEOutputChannels
  ) {
    switch (packetName) {
      case "H1emu.RequestModules":
      case "Command.ExecuteCommand":
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
      this._gatewayServer.sendTunnelData(client.soeClientId, data, channel);
    }
  }

  sendUnbufferedData(
    client: Client,
    packetName: h1z1PacketsType2016,
    obj: zone2016packets
  ) {
    this._sendData(client, packetName, obj, SOEOutputChannels.Reliable);
  }

  sendOrderedData<ZonePacket>(
    client: Client,
    packetName: h1z1PacketsType2016,
    obj: ZonePacket
  ) {
    this._sendData<ZonePacket>(
      client,
      packetName,
      obj,
      SOEOutputChannels.Ordered
    );
  }

  sendData<ZonePacket>(
    client: Client,
    packetName: h1z1PacketsType2016,
    obj: ZonePacket
  ) {
    this._sendData<ZonePacket>(
      client,
      packetName,
      obj,
      SOEOutputChannels.Reliable
    );
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
    this.sendData<WeaponWeapon>(client, "Weapon.Weapon", {
      weaponPacket: {
        packetName: packetName,
        gameTime: getCurrentServerTimeWrapper().getTruncatedU32(),
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
    this.sendData<WeaponWeapon>(client, "Weapon.Weapon", {
      weaponPacket: {
        packetName: "Weapon.RemoteWeapon",
        gameTime: getCurrentServerTimeWrapper().getTruncatedU32(),
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
    this.sendDataToAllOthersWithSpawnedEntity<WeaponWeapon>(
      this._characters,
      client,
      client.character.characterId,
      "Weapon.Weapon",
      {
        weaponPacket: {
          packetName: "Weapon.RemoteWeapon",
          gameTime: getCurrentServerTimeWrapper().getTruncatedU32(),
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
    this.sendData<WeaponWeapon>(client, "Weapon.Weapon", {
      weaponPacket: {
        packetName: "Weapon.RemoteWeapon",
        gameTime: getCurrentServerTimeWrapper().getTruncatedU32(),
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
    this.sendDataToAllOthersWithSpawnedEntity<WeaponWeapon>(
      this._characters,
      client,
      client.character.characterId,
      "Weapon.Weapon",
      {
        weaponPacket: {
          packetName: "Weapon.RemoteWeapon",
          gameTime: getCurrentServerTimeWrapper().getTruncatedU32(),
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
      SOEOutputChannels.Reliable
    );
  }
  sendAlertToAll(message: string) {
    this._sendDataToAll("ClientUpdate.TextAlert", {
      message: message
    });
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

  isBanExpired(ban?: ClientBan) {
    if (!ban || !ban.expirationDate) return false;
    if (ban.expirationDate < Date.now()) return true;
    return false;
  }

  async isClientBanned(
    loginSessionId: string,
    address: string,
    client?: Client
  ): Promise<ClientBan | false> {
    const addressBan: WithId<ClientBan> = (await this._db
      ?.collection(DB_COLLECTIONS.BANNED)
      .findOne({
        IP: address,
        active: true
      })) as any;
    const idBan: WithId<ClientBan> = (await this._db
      ?.collection(DB_COLLECTIONS.BANNED)
      .findOne({
        loginSessionId,
        active: true
      })) as any;
    if (addressBan || idBan) {
      if (this.isBanExpired(addressBan)) {
        await this._db?.collection(DB_COLLECTIONS.BANNED).updateOne(
          { IP: address, active: true },
          {
            $set: {
              active: false // Set active to false to indicate that it has expired
            }
          }
        );
        return false;
      }
      if (this.isBanExpired(idBan)) {
        await this._db?.collection(DB_COLLECTIONS.BANNED).updateOne(
          { loginSessionId, active: true },
          {
            $set: {
              active: false // Set active to false to indicate that it has expired
            }
          }
        );
        return false;
      }

      if (client) {
        client.banType = addressBan ? addressBan.banType : idBan?.banType;
      }
      return addressBan || idBan;
    }
    return false;
  }

  async unbanClient(
    client: Client,
    name: string
  ): Promise<ClientBan | undefined> {
    const unBannedClient = (await this._db
      ?.collection(DB_COLLECTIONS.BANNED)
      .findOneAndUpdate(
        { name, active: true },
        { $set: { active: false, unBanAdminName: client.character.name } }
      )) as unknown as ClientBan | undefined;
    return unBannedClient;
  }

  async unbanClientId(
    client: Client,
    loginSessionId: string
  ): Promise<ClientBan | undefined> {
    const unBannedClient = (
      await this._db
        ?.collection(DB_COLLECTIONS.BANNED)
        .findOneAndUpdate(
          { loginSessionId, active: true },
          { $set: { active: false, unBanAdminName: client.character.name } }
        )
    )?.value as unknown as ClientBan | undefined;
    return unBannedClient;
  }

  async banClient(
    loginSessionId: string,
    characterName: string,
    reason: string,
    adminId: string,
    timestamp: number,
    isSilent: boolean
  ) {
    let client: Client | string | undefined =
      this.getClientByLoginSessionId(loginSessionId);

    if (!client) client = this.getClientByName(characterName);

    if (typeof client == "string") client = undefined;

    const object: ClientBan = {
      name: characterName,
      banType: "normal",
      banReason: reason ? reason : "no reason",
      loginSessionId: loginSessionId,
      IP:
        this._gatewayServer.getSoeClientNetworkInfos(client?.soeClientId ?? "")
          ?.address ?? "",
      adminId: adminId ? adminId : "",
      expirationDate: timestamp,
      active: true,
      unBanAdminName: ""
    };
    this._db?.collection(DB_COLLECTIONS.BANNED).insertOne(object);
    if (timestamp && !isSilent) {
      if (client) {
        this.sendAlert(
          client,
          reason
            ? `YOU HAVE BEEN BANNED FROM THE SERVER UNTIL ${getDateString(
                timestamp
              )}. REASON: ${reason}`
            : `YOU HAVE BEEN BANNED FROM THE SERVER UNTIL: ${getDateString(
                timestamp
              )}`
        );
      }
      this.sendAlertToAll(
        reason
          ? `${characterName} HAS BEEN BANNED FROM THE SERVER UNTIL ${getDateString(
              timestamp
            )}. REASON: ${reason}`
          : `${characterName} HAS BEEN BANNED FROM THE SERVER UNTIL: ${getDateString(
              timestamp
            )}`
      );
    } else if (!isSilent) {
      if (client) {
        this.sendAlert(
          client,
          reason
            ? `YOU HAVE BEEN PERMANENTLY BANNED FROM THE SERVER REASON: ${reason}`
            : "YOU HAVE BEEN BANNED FROM THE SERVER."
        );
      }

      this.sendAlertToAll(
        reason
          ? `${characterName} HAS BEEN BANNED FROM THE SERVER! REASON: ${reason}`
          : `${characterName} HAS BEEN BANNED FROM THE SERVER!`
      );
    }
    setTimeout(() => {
      if (!(client instanceof Client)) return;
      this.kickPlayer(client);
    }, 3000);
  }

  enforceBan(client: Client) {
    switch (client.banType) {
      case "normal":
        this.kickPlayer(client);
        return;
      case "rick":
        this.sendData<ClientExitLaunchUrl>(client, "ClientExitLaunchUrl", {
          url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        });
        this.sendData<LoginFailed>(client, "LoginFailed", {});
        this.deleteClient(client);
        setTimeout(() => {
          if (!client) return;
          this.deleteClient(client);
        }, 1000);
        break;
    }
  }

  kickPlayerWithReason(client: Client, reason: string, sendGlobal = false) {
    if (!client || client.isAdmin) return;
    for (let i = 0; i < 5; i++) {
      this.sendAlert(
        client,
        `You are being kicked from the server. Reason: ${reason}`
      );
    }

    if (!client) {
      return;
    }
    if (sendGlobal) {
      this.sendGlobalChatText(
        `${client.character.name} has been kicked from the server!`
      );
    }
    this.kickPlayer(client);
  }

  kickPlayer(client: Client) {
    if (!client || client.isAdmin) return;
    this.sendData<CharacterSelectSessionResponse>(
      client,
      "CharacterSelectSessionResponse",
      {
        status: 0,
        sessionId: client.loginSessionId
      }
    );
    this.deleteClient(client);
  }

  sendGameTimeSync(client: Client) {
    debug("GameTimeSync");
    this.sendData<GameTimeSync>(client, "GameTimeSync", {
      time: Int64String(this.inGameTimeManager.time),
      cycleSpeed: this.inGameTimeManager.getCycleSpeed(),
      unknownBoolean1: false
    });
  }

  sendRawToAllOthersWithSpawnedCharacter(
    client: Client,
    entityCharacterId: string = "",
    data: Buffer
  ) {
    for (const a in this._clients) {
      if (
        client != this._clients[a] &&
        this._clients[a].spawnedEntities.has(
          this._characters[entityCharacterId]
        )
      ) {
        this.sendRawDataReliable(this._clients[a], data);
      }
    }
  }

  sendRawToAllOthersWithSpawnedEntity(
    client: Client,
    dictionary: any,
    entityCharacterId: string = "",
    data: Buffer
  ) {
    for (const a in this._clients) {
      if (
        client != this._clients[a] &&
        this._clients[a].spawnedEntities.has(dictionary[entityCharacterId])
      ) {
        this.sendRawDataReliable(this._clients[a], data);
      }
    }
  }

  //#region ********************VEHICLE********************

  airdropManager(client: Client, spawn: boolean) {
    if (!this._airdrop) return;
    if (spawn) {
      // These lightWeight characters are only used like targets for the plane
      const lightWeight = {
        characterId: this._airdrop.planeTarget,
        transientId: 0,
        actorModelId: ModelIds.WEAPON_EMPTY,
        position: this._airdrop.planeTargetPos,
        rotation: new Float32Array([0, 0, 0, 0]),
        scale: new Float32Array([0.001, 0.001, 0.001, 0.001]),
        positionUpdateType: 0,
        profileId: 0,
        isLightweight: true,
        headActor: "",
        flags: {
          flags1: {},
          flags2: {},
          flags3: {}
        },
        attachedObject: {}
      };
      this.sendData<AddLightweightNpc>(
        client,
        "AddLightweightNpc",
        lightWeight
      );
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
        actorModelId: ModelIds.WEAPON_EMPTY,
        position: this._airdrop.cargoTargetPos,
        rotation: new Float32Array([0, 0, 0, 0]),
        scale: new Float32Array([0.001, 0.001, 0.001, 0.001]),
        positionUpdateType: 0,
        profileId: 0,
        isLightweight: true,
        headActor: "",
        flags: {
          flags1: {},
          flags2: {},
          flags3: {}
        },
        attachedObject: {}
      };
      this.sendData<AddLightweightNpc>(
        client,
        "AddLightweightNpc",
        lightWeight
      );
      //this.sendData<>(client, "AddLightweightNpc", lightWeight2);
      this.sendData<AddLightweightNpc>(
        client,
        "AddLightweightNpc",
        lightWeight3
      );
      this.sendData<AddLightweightVehicle>(client, "AddLightweightVehicle", {
        ...this._airdrop.plane.pGetLightweightVehicle(),
        unknownGuid1: this.generateGuid()
      });
      this.sendData<CharacterMovementVersion>(
        client,
        "Character.MovementVersion",
        {
          characterId: this._airdrop.plane.characterId,
          version: 5
        }
      );
      setTimeout(() => {
        if (this._airdrop) {
          this.sendData<LightweightToFullVehicle>(
            client,
            "LightweightToFullVehicle",
            this._airdrop.plane.pGetFullVehicle(this)
          );
        }
      }, 1000);

      this.sendData<CharacterSeekTarget>(client, "Character.SeekTarget", {
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
        this.sendData<CharacterManagedObject>(
          client,
          "Character.ManagedObject",
          {
            objectCharacterId: this._airdrop.plane.characterId,
            characterId: client.character.characterId
          }
        );
      }

      if (this._airdrop.cargoSpawned && this._airdrop.cargo) {
        this.sendData<AddLightweightVehicle>(client, "AddLightweightVehicle", {
          ...this._airdrop.cargo.pGetLightweightVehicle(),
          unknownGuid1: this.generateGuid()
        });
        this.sendData<CharacterMovementVersion>(
          client,
          "Character.MovementVersion",
          {
            characterId: this._airdrop.cargo.characterId,
            version: 6
          }
        );
        this.sendData<LightweightToFullVehicle>(
          client,
          "LightweightToFullVehicle",
          this._airdrop.cargo.pGetFullVehicle(this)
        );
        this.sendData<CharacterSeekTarget>(client, "Character.SeekTarget", {
          characterId: this._airdrop.cargo.characterId,
          TargetCharacterId: this._airdrop.cargoTarget,
          initSpeed: -5,
          acceleration: 0,
          speed: 0,
          turn: 5,
          yRot: 0
        });
        this.sendData<CharacterManagedObject>(
          client,
          "Character.ManagedObject",
          {
            objectCharacterId: this._airdrop.cargo.characterId,
            characterId: client.character.characterId
          }
        );
      }
    } else if (!spawn) {
      this.sendData<CharacterRemovePlayer>(client, "Character.RemovePlayer", {
        characterId: this._airdrop.plane.characterId
      });
      if (this._airdrop.cargo) {
        this.sendData<CharacterRemovePlayer>(client, "Character.RemovePlayer", {
          characterId: this._airdrop.cargo.characterId,
          unknownWord1: 1,
          effectId: Effects.PFX_Impact_Explosion_AirdropBomb_Default_10m,
          timeToDisappear: 0,
          effectDelay: 0
        });
      }
      // removing them seems to crash the client somehow
      /*this.sendData<>(client, "Character.RemovePlayer", {
        characterId: this._airdrop.destination,
      });
      this.sendData<>(client, "Character.RemovePlayer", {
        characterId: this._airdrop.planeTarget,
      });
      this.sendData<>(client, "Character.RemovePlayer", {
        characterId: this._airdrop.cargoTarget,
      });*/
    }
  }

  async syncAirdrop() {
    if (!this._airdrop) return;
    let choosenClient: Client | undefined;
    let currentDistance = 999999;
    for (const a in this._clients) {
      const client = this._clients[a];
      this.sendData<CharacterRemovePlayer>(client, "Character.RemovePlayer", {
        characterId: this._airdrop.plane.characterId
      });
      this.sendData<AddLightweightVehicle>(client, "AddLightweightVehicle", {
        ...this._airdrop.plane.pGetLightweightVehicle(),
        unknownGuid1: this.generateGuid()
      });
      this.sendData<CharacterMovementVersion>(
        client,
        "Character.MovementVersion",
        {
          characterId: this._airdrop.plane.characterId,
          version: 5
        }
      );
      if (this._airdrop.cargoSpawned && this._airdrop.cargo) {
        this.sendData<CharacterRemovePlayer>(client, "Character.RemovePlayer", {
          characterId: this._airdrop.cargo.characterId
        });
        this.sendData<AddLightweightVehicle>(client, "AddLightweightVehicle", {
          ...this._airdrop.cargo.pGetLightweightVehicle(),
          unknownGuid1: this.generateGuid()
        });
        this.sendData<CharacterMovementVersion>(
          client,
          "Character.MovementVersion",
          {
            characterId: this._airdrop.cargo.characterId,
            version: 6
          }
        );
        this.sendData<CharacterSeekTarget>(client, "Character.SeekTarget", {
          characterId: this._airdrop.cargo.characterId,
          TargetCharacterId: this._airdrop.cargoTarget,
          initSpeed: -5,
          acceleration: 0,
          speed: 0,
          turn: 5,
          yRot: 0,
          rotation: new Float32Array([0, 1, 0, 0])
        });
        this.sendData<CharacterManagedObject>(
          client,
          "Character.ManagedObject",
          {
            objectCharacterId: this._airdrop.cargo.characterId,
            characterId: client.character.characterId
          }
        );
        this.sendData<LightweightToFullVehicle>(
          client,
          "LightweightToFullVehicle",
          this._airdrop.cargo.pGetFullVehicle(this)
        );
      }
      setTimeout(() => {
        if (this._airdrop) {
          this.sendData<LightweightToFullVehicle>(
            client,
            "LightweightToFullVehicle",
            this._airdrop.plane.pGetFullVehicle(this)
          );
        }
      }, 1000);
      this.sendData<CharacterSeekTarget>(client, "Character.SeekTarget", {
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
        const avgPing = this._gatewayServer.getSoeClientAvgPing(
          client.soeClientId
        );
        choosenClient = client;
        if (avgPing) {
          if (avgPing < 130) {
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
    this.sendData<CharacterManagedObject>(
      this._airdrop.manager,
      "Character.ManagedObject",
      {
        objectCharacterId: this._airdrop.plane.characterId,
        characterId: this._airdrop.manager.character.characterId
      }
    );
  }

  vehicleManager(client: Client) {
    for (const key in this._vehicles) {
      const vehicle = this._vehicles[key];
      if (
        // vehicle spawning / managed object assignment logic
        isPosInRadius(
          vehicle.npcRenderDistance || this.charactersRenderDistance,
          client.character.state.position,
          vehicle.state.position
        )
      ) {
        if (!client.spawnedEntities.has(vehicle)) {
          this.sendData<AddLightweightVehicle>(
            client,
            "AddLightweightVehicle",
            {
              ...vehicle.pGetLightweightVehicle(),
              unknownGuid1: this.generateGuid()
            }
          );
          vehicle.effectTags.forEach((effectTag: number) => {
            this.sendData<CharacterAddEffectTagCompositeEffect>(
              client,
              "Character.AddEffectTagCompositeEffect",
              {
                characterId: vehicle.characterId,
                effectId: effectTag,
                unknownDword1: effectTag,
                unknownDword2: effectTag
              }
            );
          });
          /*
          if (vehicle.engineOn) {
            this.sendData<>(client, "Vehicle.Engine", {
              vehicleCharacterId: vehicle.characterId,
              engineOn: true,
            });
          }
          */
          /*this.sendData<>(client, "Vehicle.OwnerPassengerList", {
            characterId: client.character.characterId,
            passengers: vehicle.pGetPassengers(this),
          });*/
          client.spawnedEntities.add(vehicle);
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

        const vehicleExist = client.spawnedEntities.has(vehicle);
        if (vehicleExist) {
          if (vehicle.isManaged) {
            this.dropManagedObject(client, vehicle);
          }
          this.sendData<CharacterRemovePlayer>(
            client,
            "Character.RemovePlayer",
            {
              characterId: vehicle.characterId
            }
          );
          client.spawnedEntities.delete(vehicle);
        }
      }
    }
  }

  assignManagedObject(client: Client, vehicle: Vehicle) {
    // todo: vehicle seat swap managed object assignment logic
    debug("\n\n\n\n\n\n\n\n\n\n assign managed object");

    this.sendData<CharacterManagedObject>(client, "Character.ManagedObject", {
      objectCharacterId: vehicle.characterId,
      characterId: client.character.characterId
    });
    this.sendData<ClientUpdateManagedObjectResponseControl>(
      client,
      "ClientUpdate.ManagedObjectResponseControl",
      {
        control: true,
        objectCharacterId: vehicle.characterId
      }
    );
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
      this.sendData(client, "ClientUpdate.ManagedObjectResponseControl", {
        control: false,
        objectCharacterId: vehicle.characterId
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
        control: false,
        objectCharacterId: characterId
      });
      client.managedObjects.splice(
        client.managedObjects.findIndex((e: string) => e === characterId),
        1
      );
    });
  }

  sendCompositeEffectToAllWithSpawnedEntity(
    dictionary: EntityDictionary<BaseEntity>,
    object: BaseEntity,
    effectId: number
  ) {
    this.sendDataToAllWithSpawnedEntity<CharacterPlayWorldCompositeEffect>(
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
    effectId: Effects
  ) {
    this.sendDataToAllInRange<CharacterPlayWorldCompositeEffect>(
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
  sendDialogEffectToAllInRange(
    range: number,
    characterId: string,
    position: Float32Array,
    effectId: Effects
  ) {
    this.sendDataToAllInRange<CommandPlayDialogEffect>(
      range,
      position,
      "Command.PlayDialogEffect",
      {
        characterId: characterId,
        effectId: effectId
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
  debugSendData(packetName: h1z1PacketsType2016) {
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
  }

  sendDataToAllWithSpawnedEntity<ZonePacket>(
    dictionary: EntityDictionary<BaseEntity>,
    entityCharacterId: string = "",
    packetName: h1z1PacketsType2016,
    obj: ZonePacket
  ) {
    if (!entityCharacterId) return;
    const data = this._protocol.pack(packetName, obj);
    if (!data) return;
    this.debugSendData(packetName);
    for (const a in this._clients) {
      if (
        this._clients[a].spawnedEntities.has(dictionary[entityCharacterId]) ||
        this._clients[a].character.characterId == entityCharacterId
      ) {
        this.sendRawDataReliable(this._clients[a], data);
      }
    }
  }

  sendDataToAllInRange<ZonePacket>(
    range: number,
    position: Float32Array,
    packetName: h1z1PacketsType2016,
    obj: ZonePacket
  ) {
    const data = this._protocol.pack(packetName, obj);
    if (!data) return;
    this.debugSendData(packetName);
    for (const a in this._clients) {
      if (
        isPosInRadius(
          range,
          this._clients[a].character.state.position,
          position
        )
      ) {
        this.sendRawDataReliable(this._clients[a], data);
      }
    }
  }

  sendDataToAllOthersWithSpawnedEntity<ZonePacket>(
    dictionary: EntityDictionary<BaseEntity>,
    client: Client,
    entityCharacterId: string = "",
    packetName: h1z1PacketsType2016,
    obj: ZonePacket
  ) {
    if (!entityCharacterId) return;
    const data = this._protocol.pack(packetName, obj);
    if (!data) return;
    this.debugSendData(packetName);
    for (const a in this._clients) {
      if (
        client != this._clients[a] &&
        this._clients[a].spawnedEntities.has(dictionary[entityCharacterId])
      ) {
        this.sendRawDataReliable(this._clients[a], data);
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
      if (client) {
        this.dismountVehicle(client);
      }
    }
    vehicle.seats[seatId] = client.character.characterId;
    if (seatId == 0) {
      this.takeoverManagedObject(client, vehicle);
      this.abilitiesManager.sendVehicleAbilities(this, client, vehicle);
      //vehicle.checkEngineRequirements(this);
      this.sendData<VehicleOwner>(client, "Vehicle.Owner", {
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
    }

    // Mount container on all players in the vehicle
    if (vehicle.getContainer()) {
      client.character.mountContainer(this, vehicle);
    }

    this.sendDataToAllWithSpawnedEntity<MountMountResponse>(
      this._vehicles,
      vehicleGuid,
      "Mount.MountResponse",
      {
        characterId: client.character.characterId,
        vehicleGuid: vehicle.characterId,
        seatId: Number(seatId),
        isDriver: seatId == 0 ? 1 : 0,
        identity: {}
      }
    );

    this.sendData<VehicleOccupy>(client, "Vehicle.Occupy", {
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
      unknownArray2: [{}],
      unknownBytes1: { itemData: {} },
      unknownBytes2: { itemData: {} }
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
      this.sendData<MountDismountResponse>(client, "Mount.DismountResponse", {
        characterId: client.character.characterId
      });
      return;
    }
    vehicle.removeHotwireEffect(this);
    const seatId = vehicle.getCharacterSeat(client.character.characterId);
    client.character.vehicleExitDate = new Date().getTime();
    if (seatId == -1) {
      console.log(
        `Error: ${client.character.name} exited vehicle with no seatId set`
      );
      return;
    }
    if (vehicle.vehicleId == VehicleIds.SPECTATE) {
      this.sendData<MountDismountResponse>(client, "Mount.DismountResponse", {
        characterId: client.character.characterId
      });
      this.deleteEntity(vehicle.characterId, this._vehicles);
      return;
    }
    vehicle.seats[seatId] = "";
    this.sendDataToAllWithSpawnedEntity<MountDismountResponse>(
      this._characters,
      client.character.characterId,
      "Mount.DismountResponse",
      {
        characterId: client.character.characterId
      }
    );
    client.isInAir = false;

    if (!seatId) {
      if (vehicle.engineOn) vehicle.stopEngine(this);
      vehicle.isLocked = false;
    }

    client.vehicle.mountedVehicle = "";
    this.sendData<VehicleOccupy>(client, "Vehicle.Occupy", {
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
      unknownArray2: [],
      unknownBytes1: { itemData: {} },
      unknownBytes2: { itemData: {} }
    });
    this.sendDataToAllWithSpawnedEntity<VehicleOwner>(
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

  changeSeat(client: Client, packet: ReceivedPacket<MountSeatChangeRequest>) {
    if (!client.vehicle.mountedVehicle) return;
    const vehicle = this._vehicles[client.vehicle.mountedVehicle];
    if (!vehicle) return;
    const seatCount = vehicle.getSeatCount(),
      oldSeatId = vehicle.getCharacterSeat(client.character.characterId);
    const seatId = packet.data.seatId ?? 0,
      seat = vehicle.seats[seatId],
      passenger = this._characters[seat];
    if (
      seatId < seatCount &&
      (!vehicle.seats[seatId] || !passenger?.isAlive) &&
      oldSeatId != -1
    ) {
      if (seatId === 2) {
        if (!!vehicle.seats[5]) return;
      }
      if (seatId === 3) {
        if (!!vehicle.seats[6]) return;
      }
      if (passenger && !passenger?.isAlive) {
        const client = this.getClientByCharId(passenger.characterId);
        if (client) {
          this.dismountVehicle(client);
        }
      }
      this.sendDataToAllWithSpawnedEntity<MountSeatChangeResponse>(
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
      vehicle.seats[seatId] = client.character.characterId;
      if (!oldSeatId && vehicle.engineOn) {
        vehicle.stopEngine(this);
        client.character.dismountContainer(this);
      }
      if (seatId === 0) {
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
    this.sendData<ClientUpdateStartTimer>(client, "ClientUpdate.StartTimer", {
      stringId: stringId,
      time: time
    });
  }

  startInteractionTimer(
    client: Client,
    stringId: number,
    time: number,
    animationId: number
  ) {
    this.sendDataToAllWithSpawnedEntity(
      this._characters,
      client.character.characterId,
      "CharacterState.InteractionStart",
      {
        characterId: client.character.characterId,
        time: time,
        animationId: animationId,
        stringId: stringId
      }
    );
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
    const characterIds = new Set<string>();

    const vehicle = this._vehicles[character.characterId];
    if (vehicle) {
      vehicle.getPassengerList().forEach((characterId) => {
        characterIds.add(characterId);
      });
    } else {
      if (character instanceof BaseLootableEntity) {
        characterIds.add(character.mountedCharacter || "");
      } else {
        characterIds.add(character.characterId);
      }
    }

    characterIds.forEach((characterId) => {
      const client = this.getClientByCharId(characterId);
      if (!client || !client.character?.initialized) return;
      this.sendData<ClientUpdateItemAdd>(client, "ClientUpdate.ItemAdd", {
        characterId:
          character instanceof Character || character instanceof Vehicle2016
            ? character.characterId
            : EXTERNAL_CONTAINER_GUID,
        data: character.pGetItemData(this, item, containerDefinitionId)
      });
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

  isAccountItem(itemDefinitionId?: number): boolean {
    if (!itemDefinitionId) return false;
    const itemDef = this.getItemDefinition(itemDefinitionId);
    return [
      "RewardCrate",
      "RewardCrateKey",
      "AccountRecipe",
      "IncrementEntitlement",
      "EmoteAnimation",
      "AccountGiveRewardSet"
    ].includes(itemDef?.CODE_FACTORY_NAME ?? "");
  }

  /**
   * Gets the rewards for a given itemDefinitionId.
   *
   * @param {number} [itemDefinitionId] - The ID of the crate to retrieve rewards from.
   * @returns {RewardCrateRewardDefinition[]|undefined} The rewards.
   */
  getCrateRewards(itemDefinitionId?: number) {
    if (!itemDefinitionId) return;
    return Object.values(this._rewardCrateDefinitions).find(
      (i) => i.itemDefinitionId === itemDefinitionId
    )?.rewards;
  }

  /**
   * Gets a random reward for a given crate.
   *
   * @param {number} [itemDefinitionId] - The ID of the crate to retrieve rewards from.
   * @returns {number} Reward Item definition ID.
   */
  getRandomCrateReward(itemDefinitionId?: number): RandomReward | undefined {
    const rewards = this.getCrateRewards(itemDefinitionId);
    if (!rewards) return;
    const totalChances = rewards.reduce(
      (acc: any, reward: any) => acc + reward.rewardChance,
      0
    );
    let randomChance = Math.random() * totalChances;
    for (const rew of rewards) {
      if (randomChance < rew.rewardChance) {
        return { reward: rew.itemDefinitionId, isRare: rew.rewardChance === 1 };
      }
      randomChance -= rew.rewardChance;
    }
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
      weaponDefinition = this.getWeaponDefinition(itemDefinition?.PARAM1 || 0),
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
      weaponDefinition = this.getWeaponDefinition(itemDefinition?.PARAM1 || 0),
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
      weaponDefinition = this.getWeaponDefinition(itemDefinition?.PARAM1 || 0);

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
      weaponDefinition = this.getWeaponDefinition(itemDefinition?.PARAM1 || 0);

    return weaponDefinition.AMMO_SLOTS[0]?.CLIP_SIZE || 0;
  }

  /**
   * Gets the container definition for a given containerDefinitionId.
   *
   * @param {number} containerDefinitionId - The id of the container definition to retrieve.
   * @returns {ContainerDefinition} The container definition.
   */
  getContainerDefinition(containerDefinitionId: number) {
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
   * @param {boolean} [forceMaxDurability =false] - force the item to have his max durability.
   * @returns {BaseItem|undefined} The generated item, or undefined if the item definition is invalid.
   */
  generateItem(
    itemDefinitionId: number,
    count: number = 1,
    forceMaxDurability: boolean = false
  ): BaseItem | undefined {
    const itemDefinition = this.getItemDefinition(itemDefinitionId);
    if (!itemDefinition) {
      debug(
        `[ERROR] GenerateItem: Invalid item definition: ${itemDefinitionId}`
      );
      return;
    }
    const generatedGuid = toBigHex(this.generateItemGuid());
    let durability: number;
    let wornOffDurability: number = 0;
    switch (true) {
      case itemDefinitionId == Items.WEAPON_HATCHET_MAKESHIFT:
        durability = 250;
        break;
      case itemDefinitionId == Items.WEAPON_HATCHET:
        durability = 500;
        break;
      case itemDefinitionId == Items.WEAPON_AXE_WOOD:
        durability = 1000;
        break;
      case this.isWeapon(itemDefinitionId):
        durability = 2000;
        break;
      case this.isArmor(itemDefinitionId):
        durability = 1000;
        break;
      case this.isHelmet(itemDefinitionId):
        durability = 100;
        break;
      case this.isConvey(itemDefinitionId):
        durability = forceMaxDurability
          ? 5400
          : Math.floor(Math.random() * 5400);
        break;
      case this.isGeneric(itemDefinitionId):
        durability = 2000;
        break;
      default:
        durability = 2000;
        break;
    }

    const weaponDefinitionId = itemDefinition.PARAM1;
    switch (weaponDefinitionId) {
      case WeaponDefinitionIds.WEAPON_NAGAFENS_RAGE:
      case WeaponDefinitionIds.WEAPON_REAPER:
      case WeaponDefinitionIds.WEAPON_FROSTBITE:
      case WeaponDefinitionIds.WEAPON_BLAZE:
      case WeaponDefinitionIds.WEAPON_PURGE:
        durability = 1000;
        break;
      case WeaponDefinitionIds.WEAPON_WRENCH:
        durability = 2500;
        break;
      case WeaponDefinitionIds.WEAPON_HAMMER:
      case WeaponDefinitionIds.WEAPON_CROWBAR:
      case WeaponDefinitionIds.WEAPON_308:
      case WeaponDefinitionIds.WEAPON_SHOTGUN:
      case WeaponDefinitionIds.WEAPON_AK47:
      case WeaponDefinitionIds.WEAPON_AR15:
      case WeaponDefinitionIds.WEAPON_1911:
      case WeaponDefinitionIds.WEAPON_M9:
      case WeaponDefinitionIds.WEAPON_MAGNUM:
      case WeaponDefinitionIds.WEAPON_R380:
        if (!forceMaxDurability) {
          do {
            wornOffDurability = Math.floor(Math.random() * durability);
          } while (durability < 250);
          break;
        }
    }
    if (wornOffDurability > 0) durability = wornOffDurability;
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
  generateAccountItem(
    itemDefinitionId: number,
    count: number = 1
  ): BaseItem | undefined {
    const itemDefinition = this.getItemDefinition(itemDefinitionId);
    if (!itemDefinition) {
      debug(
        `[ERROR] GenerateItem: Invalid item definition: ${itemDefinitionId}`
      );
      return;
    }
    const generatedGuid = generateRandomGuid();

    const itemData: BaseItem = new BaseItem(
      itemDefinitionId,
      generatedGuid,
      100,
      count
    );
    return itemData;
  }

  /**
   * Checks if an item with the specified itemDefinitionId is a weapon.
   *
   * @param {number} itemDefinitionId - The itemDefinitionId to check.
   * @returns {boolean} True if the item is a weapon, false otherwise.
   */
  isWeapon(itemDefinitionId: number): boolean {
    return (
      this.getItemDefinition(itemDefinitionId)?.ITEM_TYPE == ItemTypes.WEAPON
    );
  }

  /**
   * Checks if an item with the specified itemDefinitionId is a container.
   *
   * @param {number} itemDefinitionId - The itemDefinitionId to check.
   * @returns {boolean} True if the item is a container, false otherwise.
   */
  isContainer(itemDefinitionId: number): boolean {
    return (
      this.getItemDefinition(itemDefinitionId)?.ITEM_TYPE == ItemTypes.CONTAINER
    );
  }

  /**
   * Checks if an item with the specified itemDefinitionId is an armor.
   *
   * @param {number} itemDefinitionId - The itemDefinitionId to check.
   * @returns {boolean} True if the item is an armor, false otherwise.
   */
  isArmor(itemDefinitionId: number): boolean {
    return (
      this.getItemDefinition(itemDefinitionId)?.ITEM_CLASS ==
      ItemClasses.BODY_ARMOR
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
      this.getItemDefinition(itemDefinitionId)?.DESCRIPTION_ID ==
        StringIds.TACTICAL_HELMET ||
      this.getItemDefinition(itemDefinitionId)?.DESCRIPTION_ID ==
        StringIds.SLEIGH_HELMET ||
      this.getItemDefinition(itemDefinitionId)?.DESCRIPTION_ID ==
        StringIds.GENERAL_HELMET_1 ||
      this.getItemDefinition(itemDefinitionId)?.DESCRIPTION_ID ==
        StringIds.CREEPY_MASK ||
      this.getItemDefinition(itemDefinitionId)?.DESCRIPTION_ID ==
        StringIds.SCRAY_HALLOWEEN_MASK ||
      this.getItemDefinition(itemDefinitionId)?.DESCRIPTION_ID ==
        StringIds.UNCLE_SAM_MASK
    );
  }

  /**
   * Checks if an item with the specified itemDefinitionId is a convey.
   *
   * @param {number} itemDefinitionId - The itemDefinitionId to check.
   * @returns {boolean} True if the item is a convey, false otherwise.
   */
  isConvey(itemDefinitionId: number): boolean {
    return (
      this.getItemDefinition(itemDefinitionId)?.DESCRIPTION_ID ==
      StringIds.CONVEYS
    );
  }

  /**
   * Checks if an item with the specified itemDefinitionId is a generic item type.
   *
   * @param {number} itemDefinitionId - The itemDefinitionId to check.
   * @returns {boolean} True if the item is a generic type, false otherwise.
   */
  isGeneric(itemDefinitionId: number): boolean {
    return this.getItemDefinition(itemDefinitionId)?.ITEM_TYPE == 1;
  }

  /**
   * Checks if an item with the specified itemDefinitionId is stackable.
   *
   * @param {number} itemDefinitionId - The itemDefinitionId to check.
   * @returns {boolean} True if the item is stackable, false otherwise.
   */
  isStackable(itemDefinitionId: number): boolean {
    const itemDefinition = this.getItemDefinition(itemDefinitionId);
    if (!itemDefinition) return false;
    return itemDefinition.MAX_STACK_SIZE > 1 ? true : false;
  }

  /**
   * Validates if an item can be equipped in the specified equipment slot.
   *
   * @param {number} itemDefinitionId - The itemDefinitionId of the item to validate.
   * @param {number} equipmentSlotId - The equipment slot ID.
   * @returns {boolean} True if the item can be equipped in the slot, false otherwise.
   */
  validateEquipmentSlot(itemDefinitionId: number, equipmentSlotId: number) {
    const itemDefinition = this.getItemDefinition(itemDefinitionId);
    if (!itemDefinition || !itemDefinition.FLAG_CAN_EQUIP) return false;
    return !!equipSlotItemClasses.find(
      (slot: any) =>
        slot.ITEM_CLASS === itemDefinition.ITEM_CLASS &&
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
    const itemDefinition = this.getItemDefinition(itemDefinitionId);
    if (!itemDefinition || !itemDefinition.FLAG_CAN_EQUIP) return false;
    return !!loadoutSlotItemClasses.find(
      (slot: any) =>
        slot.ITEM_CLASS == itemDefinition.ITEM_CLASS &&
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
    const itemDefinition = this.getItemDefinition(itemDefId);
    if (!itemDefinition) return 0;
    const loadoutSlotItemClass = loadoutSlotItemClasses.find(
      (slot: any) =>
        slot.ITEM_CLASS == itemDefinition.ITEM_CLASS &&
        loadoutId == slot.LOADOUT_ID
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

    // disable old ability
    const weapon = client.character.getEquippedWeapon(),
      currentWeaponItemDef = this.getItemDefinition(weapon?.itemDefinitionId);
    if (currentWeaponItemDef) {
      this.abilitiesManager.deactivateAbility(
        this,
        client,
        currentWeaponItemDef.ACTIVATABLE_ABILITY_ID
      );
    }

    // remove passive equip
    this.clearEquipmentSlot(
      client.character,
      client.character.getActiveEquipmentSlot(loadoutItem),
      true
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
      const itemDefinition = this.getItemDefinition(
        loadoutItem.itemDefinitionId
      );
      if (itemDefinition) {
        this.abilitiesManager.deactivateAbility(
          this,
          client,
          itemDefinition.ACTIVATABLE_ABILITY_ID
        );
      }
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

      this.sendDataToAllOthersWithSpawnedEntity<CharacterWeaponStance>(
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
      const data = {
        characterData: {
          characterId: client.character.characterId
        },
        slotId: equipmentSlotId
      };
      this.sendDataToAllWithSpawnedEntity(
        this._characters,
        client.character.characterId,
        "Equipment.UnsetCharacterEquipmentSlot",
        data
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
  async lootAccountItem(
    server: ZoneServer2016,
    client: Client,
    item?: BaseItem,
    sendUpdate: boolean = false
  ) {
    if (!item) {
      return;
    }
    const accountItems = await server.accountInventoriesManager.getAccountItems(
      client.loginSessionId
    );
    if (!accountItems) return false;
    const savedItem = accountItems.find((v) => {
      return v.itemDefinitionId === item.itemDefinitionId;
    });
    // if an itemdef is already in the account inventory we only update the stack count
    if (savedItem) {
      savedItem.stackCount += item.stackCount;
      await server.accountInventoriesManager.updateAccountItem(
        client.loginSessionId,
        savedItem
      );
      server.sendData(client, "Items.UpdateEscrowAccountItem", {
        itemData: {
          itemId: savedItem.itemGuid,
          itemDefinitionId: savedItem.itemDefinitionId,
          itemCount: savedItem.stackCount,
          itemGuid: savedItem.itemGuid
        }
      });
    } else {
      await server.accountInventoriesManager.addAccountItem(
        client.loginSessionId,
        item
      );
      server.sendData(client, "Items.AddEscrowAccountItem", {
        itemData: {
          itemId: item.itemGuid,
          itemDefinitionId: item.itemDefinitionId,
          itemCount: item.stackCount,
          itemGuid: item.itemGuid
        }
      });
    }

    if (!sendUpdate) return;
    server.sendData(client, "Reward.AddNonRewardItem", {
      itemDefId: item.itemDefinitionId,
      iconId: server.getItemDefinition(item.itemDefinitionId)?.IMAGE_SET_ID,
      nameId: server.getItemDefinition(item.itemDefinitionId)?.NAME_ID,
      count: item.stackCount
    });
  }

  lootCrateWithChance(client: Client, dropChance: number) {
    // dropChance ranges 0-1000
    if (chance(dropChance)) {
      const rewards = this.rewardManager.rewards;
      const randomIndex = randomIntFromInterval(0, rewards.length - 1);
      const randomCrateId = rewards[randomIndex].itemId;
      const randomCrate = this.generateItem(randomCrateId, 1, true);
      if (!randomCrate) return;
      this.lootAccountItem(this, client, randomCrate, true);
    }
  }
  /**
   * Removes an item from the account inventory.
   *
   * @param {BaseFullCharacter} character - The character to have their items removed.
   * @param {BaseItem} item - The item to remove.
   * @returns {boolean} Returns true if the item was successfully removed, false if there was an error.
   */
  removeAccountItem(character: BaseFullCharacter, item: BaseItem): boolean {
    const client = this.getClientByCharId(character.characterId);
    if (!client) return false;
    item.stackCount--;
    if (item.stackCount <= 0) {
      this.accountInventoriesManager.removeAccountItem(
        client.loginSessionId,
        item
      );
      this.sendData(client, "Items.RemoveEscrowAccountItem", {
        itemId: item.itemGuid,
        itemDefinitionId: item.itemDefinitionId
      });
      return true;
    } else {
      this.accountInventoriesManager.updateAccountItem(
        client.loginSessionId,
        item
      );
    }
    this.sendData(client, "Items.UpdateEscrowAccountItem", {
      itemData: {
        itemId: item.itemGuid,
        itemDefinitionId: item.itemDefinitionId,
        itemCount: item.stackCount,
        itemGuid: item.itemGuid
      }
    });
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
    if (client) {
      this.checkShoes(client);
      this.checkNightVision(client);
    }
    if (this.getItemDefinition(itemDefId)?.ITEM_TYPE === ItemTypes.CONTAINER) {
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

    if (this.isAccountItem(item.itemDefinitionId)) {
      return this.removeAccountItem(character, item);
    } else if (character._loadout[item.slotId]?.itemGuid == item.itemGuid) {
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
    character: BaseFullCharacter,
    itemDefinitionId: number,
    requiredCount: number = 1
  ): boolean {
    const loadoutSlotId = 0; //this.getActiveLoadoutSlot(client, itemDefinitionId);
    // loadout disabled for now
    if (
      character._loadout[loadoutSlotId]?.itemDefinitionId == itemDefinitionId
    ) {
      // todo: check multiple loadout slots for items
      return this.removeLoadoutItem(character, loadoutSlotId);
    } else {
      const removeItems: {
        container: LoadoutContainer;
        item: BaseItem;
        count: number;
      }[] = [];
      for (const container of Object.values(character._containers)) {
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
            character,
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
    count: number = 1,
    animationId: number
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
    this.sendData<CharacterDroppedItemNotification>(
      client,
      "Character.DroppedItemNotification",
      {
        characterId: client.character.characterId,
        itemDefId: item.itemDefinitionId,
        count: count
      }
    );
    this.startInteractionTimer(client, 0, 0, animationId);
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
    this.executeFuncForAllReadyClientsInRange((c) => {
      c.spawnedEntities.add(obj);
      this.addLightweightNpc(c, obj);
      this.sendData<ClientUpdateProximateItems>(
        c,
        "ClientUpdate.ProximateItems",
        this.getProximityItems(c)
      );
    }, obj);
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
      this.getItemDefinition(item.itemDefinitionId)?.PICKUP_EFFECT ??
        Effects.SFX_Item_PickUp_Generic
    );

    client.character.lootItem(this, item);
    this.startInteractionTimer(client, 0, 0, 9);
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
    const characterIds = new Set<string>();

    const vehicle = this._vehicles[character.characterId];
    if (vehicle) {
      vehicle.getPassengerList().forEach((characterId) => {
        characterIds.add(characterId);
      });
    } else {
      if (character instanceof BaseLootableEntity) {
        characterIds.add(character.mountedCharacter || "");
      } else {
        characterIds.add(character.characterId);
      }
    }

    characterIds.forEach((characterId) => {
      const client = this.getClientByCharId(characterId);
      if (!client || !client.character?.initialized) return;
      this.sendData<ClientUpdateItemDelete>(client, "ClientUpdate.ItemDelete", {
        characterId:
          character instanceof Character || character instanceof Vehicle2016
            ? character.characterId
            : EXTERNAL_CONTAINER_GUID,
        itemGuid: itemGuid
      });
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
    this.sendData<ContainerInitEquippedContainers>(
      client,
      "Container.InitEquippedContainers",
      {
        ignore: characterId,
        characterId: characterId,
        containers: character.pGetContainers(this)
      }
    );
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
      this.sendData<RewardAddNonRewardItem>(client, "Reward.AddNonRewardItem", {
        itemDefId: itemDefId,
        iconId: this.getItemDefinition(itemDefId)?.IMAGE_SET_ID ?? 0,
        nameId: this.getItemDefinition(itemDefId)?.NAME_ID ?? 0,
        count: item.stackCount
      });
    }
  }

  updateLoadoutItem(
    client: Client,
    item: LoadoutItem,
    character: BaseFullCharacter = client.character
  ) {
    this.sendData<ClientUpdateItemUpdate>(client, "ClientUpdate.ItemUpdate", {
      characterId: character.characterId,
      data: character.pGetItemData(this, item, LOADOUT_CONTAINER_ID)
    });
    //this.updateLoadout(client.character);
  }

  updateContainer(character: BaseFullCharacter, container: LoadoutContainer) {
    const characterIds = new Set<string>();

    const vehicle = this._vehicles[character.characterId];
    if (vehicle) {
      vehicle.getPassengerList().forEach((characterId) => {
        characterIds.add(characterId);
      });
    } else {
      if (character instanceof BaseLootableEntity) {
        characterIds.add(character.mountedCharacter || "");
      } else {
        characterIds.add(character.characterId);
      }
    }

    characterIds.forEach((characterId) => {
      const client = this.getClientByCharId(characterId);
      if (!client || !client.character?.initialized) return;
      this.sendData<ContainerUpdateEquippedContainer>(
        client,
        "Container.UpdateEquippedContainer",
        {
          ignore: character.characterId,
          characterId: character.characterId,
          containerData: character.pGetContainerData(this, container)
        }
      );
    });
  }

  updateContainerItem(
    character: BaseFullCharacter,
    item: BaseItem,
    container: LoadoutContainer
  ) {
    const client = this.getClientByContainerAccessor(character);
    if (!client || !client.character.initialized) return;
    this.sendData<ClientUpdateItemUpdate>(client, "ClientUpdate.ItemUpdate", {
      characterId:
        character instanceof Character || character instanceof Vehicle2016
          ? character.characterId
          : EXTERNAL_CONTAINER_GUID,
      data: character.pGetItemData(this, item, container.containerDefinitionId)
    });
    this.updateContainer(character, container);
  }

  updateItem(client: Client, item: BaseItem) {
    const loadoutItem = client.character.getLoadoutItem(item.itemGuid);
    if (loadoutItem) {
      this.updateLoadoutItem(client, loadoutItem);
      return;
    }

    const container = client.character.getItemContainer(item.itemGuid);
    if (container) {
      this.updateContainerItem(client.character, item, container);
      return;
    }

    const mountedContainer = client.character.mountedContainer;

    if (mountedContainer) {
      const container = mountedContainer.getContainer();
      if (!container) return;
      this.updateContainerItem(mountedContainer, item, container);
    }
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

  updateAirdropIndicator(client: Client | undefined = undefined) {
    let statusCode = 0;
    if (this._airdrop) {
      statusCode = 1;
    } else if (
      _.size(this._clients) < this.worldObjectManager.minAirdropSurvivors &&
      !this._soloMode
    ) {
      statusCode = 2;
    }

    const data = {
      indicator: statusCode == 0 ? 1 : 0,
      status: 0
    };

    if (!client) {
      this.sendDataToAll("Command.DeliveryManagerStatus", data);
      return;
    }

    this.sendData(client, "Command.DeliveryManagerStatus", data);
  }

  useAirdrop(
    client: Client,
    character: Character | BaseLootableEntity,
    item: BaseItem
  ) {
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

    if ((client.currentPOI || blockedArea) && !client.isDebugMode) {
      this.sendAlert(client, "You are too close to a restricted area.");
      return;
    }

    if (
      ![Items.AIRDROP_TICKET, Items.AIRDROP_CODE].includes(
        item.itemDefinitionId
      ) ||
      !this.removeInventoryItem(character, item)
    )
      return;
    this.sendAlert(client, "Your delivery is on the way!");
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
      ModelIds.AIRDROP_PLANE,
      moved,
      client.character.state.lookAt,
      this,
      getCurrentServerTimeWrapper().getTruncatedU32(),
      VehicleIds.SPECTATE
    );
    const cargo = new Plane(
      characterId4,
      this.getTransientId(characterId4),
      ModelIds.AIRDROP_CARGO_CONTAINER,
      new Float32Array([pos[0], pos[1] - 20, pos[2], 1]),
      client.character.state.lookAt,
      this,
      getCurrentServerTimeWrapper().getTruncatedU32(),
      VehicleIds.SPECTATE
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
      containerSpawned: false,
      hospitalCrate: item.hasAirdropClearance
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

    if (item.hasAirdropClearance) {
      item.hasAirdropClearance = false;
    }

    this.sendDeliveryStatus();

    setTimeout(() => {
      if (this._airdrop && this._airdrop.plane.characterId == characterId) {
        for (const a in this._clients) {
          if (!this._clients[a].isLoading) {
            this.airdropManager(this._clients[a], false);
          }
        }
        this.sendDeliveryStatus();
        delete this._airdrop;
      }
    }, 600000);
  }

  useAmmoBox(
    client: Client,
    character: Character | BaseLootableEntity,
    item: BaseItem
  ) {
    const itemDef = this.getItemDefinition(item.itemDefinitionId);
    if (!itemDef) return;
    this.utilizeHudTimer(client, itemDef.NAME_ID, 5000, 0, () => {
      if (!this.removeInventoryItem(character, item)) return;
      switch (item.itemDefinitionId) {
        case Items.BUNDLE_GAUZE:
        case Items.BUNDLE_EXPLOSIVE_ARROWS:
        case Items.BUNDLE_FLAMING_ARROWS:
        case Items.BUNDLE_WOODEN_ARROWS_1:
        case Items.BUNDLE_WOODEN_ARROWS_2:
        case Items.BUNDLE_WOODEN_ARROWS:
          character.lootItem(
            this,
            this.generateItem(itemDef.PARAM1, itemDef.PARAM2),
            undefined,
            character instanceof Character
          );
          break;
        case Items.AMMO_BOX_223:
          character.lootItem(
            this,
            this.generateItem(Items.AMMO_223, 60),
            undefined,
            character instanceof Character
          );
          break;
        case Items.AMMO_BOX_45:
          character.lootItem(
            this,
            this.generateItem(Items.AMMO_45, 60),
            undefined,
            character instanceof Character
          );
          break;
      }
    });
  }

  useConsumable(
    client: Client,
    character: Character | BaseLootableEntity,
    item: BaseItem,
    animationId: number
  ) {
    const itemDef = this.getItemDefinition(item.itemDefinitionId);
    if (!itemDef) return;
    let doReturn = true;
    let drinkCount = 0;
    let eatCount = 0;
    let comfortCount = 0;
    let staminaCount = 0;
    let enduranceCount = 0;
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
        if (useOption.comfortCount) comfortCount = useOption.comfortCount;
        if (useOption.staminaCount) staminaCount = useOption.staminaCount;
        if (useOption.enduranceCount) enduranceCount = useOption.enduranceCount;
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

    this.utilizeHudTimer(client, itemDef.NAME_ID, timeout, animationId, () => {
      this.useComsumablePass(
        client,
        character,
        item,
        eatCount,
        drinkCount,
        comfortCount,
        staminaCount,
        givetrash,
        healCount,
        bandagingCount,
        enduranceCount,
        healType
      );
    });
  }

  taskOptionPass(
    client: Client,
    removedItem: { itemDefinitionId: number; count: number },
    rewardItems: { itemDefinitionId: number; count: number }[]
  ) {
    if (
      !this.removeInventoryItems(
        client.character,
        removedItem.itemDefinitionId,
        removedItem.count
      )
    )
      return;
    rewardItems.forEach(
      (itemInstance: { itemDefinitionId: number; count: number }) => {
        const item = this.generateItem(
          itemInstance.itemDefinitionId,
          itemInstance.count
        );
        client.character.lootContainerItem(this, item);
      }
    );
    this.lootCrateWithChance(client, 25);
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
    this.utilizeHudTimer(client, itemDef.NAME_ID, timeout, 0, () => {
      this.igniteoptionPass(client);
    });
  }

  taskOption(
    client: Client,
    timeout: number,
    nameId: number,
    removedItem: { itemDefinitionId: number; count: number },
    rewardItems: { itemDefinitionId: number; count: number }[]
  ) {
    this.utilizeHudTimer(client, nameId, timeout, 0, () => {
      this.taskOptionPass(client, removedItem, rewardItems);
    });
  }

  fillPass(client: Client, character: BaseFullCharacter, item: BaseItem) {
    if (client.character.characterStates.inWater) {
      if (!this.removeInventoryItem(character, item)) return;
      character.lootContainerItem(this, this.generateItem(Items.WATER_DIRTY)); // give dirty water
    } else {
      this.sendAlert(client, "There is no water source nearby");
    }
  }

  sniffPass(client: Client, character: BaseFullCharacter, item: BaseItem) {
    if (!this.removeInventoryItem(character, item)) return;
    this.applyMovementModifier(client, MovementModifiers.SWIZZLE);
  }

  fertilizePlants(
    client: Client,
    character: BaseFullCharacter,
    item: BaseItem
  ) {
    if (!this.removeInventoryItem(character, item)) return;
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
          this.sendDataToAllWithSpawnedEntity<CharacterPlayWorldCompositeEffect>(
            // play burning effect & remove it after 15s
            this._plants,
            plant.characterId,
            "Character.PlayWorldCompositeEffect",
            {
              characterId: plant.characterId,
              effectId: Effects.EFX_Crop_Fertilizer,
              position: new Float32Array([
                plant.state.position[0],
                plant.state.position[1],
                plant.state.position[2],
                1
              ]),
              effectTime: 15
            }
          );
        });
      }
    }
  }

  usePills(client: Client, character: BaseFullCharacter, item: BaseItem) {
    if (!this.removeInventoryItem(character, item)) return;
    let hudIndicator: HudIndicator | undefined = undefined;
    switch (item.itemDefinitionId) {
      case Items.COLD_MEDICINE:
        hudIndicator = this._hudIndicators["COLD_MEDICINE"];
        break;
      case Items.IMMUNITY_BOOSTERS:
        hudIndicator = this._hudIndicators["IMMUNITY_BOOST_LOW"];
        break;
      case Items.VITAMINS:
        hudIndicator = this._hudIndicators["IMMUNITY_BOOST_LOW"];
        break;
    }
    if (!hudIndicator) return;
    if (client.character.hudIndicators[hudIndicator.typeName]) {
      client.character.hudIndicators[hudIndicator.typeName].expirationTime +=
        600000;
    } else {
      client.character.hudIndicators[hudIndicator.typeName] = {
        typeName: hudIndicator.typeName,
        expirationTime: Date.now() + 600000
      };
      this.sendHudIndicators(client);
    }
  }

  sleep(client: Client) {
    client.character._resources[ResourceIds.ENDURANCE] = 8000;
    client.character._resources[ResourceIds.STAMINA] = 600;
    this.applyMovementModifier(client, MovementModifiers.RESTED);
    this.sendDataToAllWithSpawnedEntity(
      this._characters,
      client.character.characterId,
      "AnimationBase",
      {
        characterId: client.character.characterId,
        animationId: 84 // yawning / waking up emote
      }
    );
    this.updateResourceToAllWithSpawnedEntity(
      client.character.characterId,
      client.character._resources[ResourceIds.STAMINA],
      ResourceIds.STAMINA,
      ResourceTypes.STAMINA,
      this._characters
    );
    this.updateResource(
      client,
      client.character.characterId,
      8000,
      ResourceIds.ENDURANCE,
      ResourceTypes.ENDURANCE
    );
  }

  useItem(
    client: Client,
    character: BaseFullCharacter,
    item: BaseItem,
    animationId: number
  ) {
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
        this.utilizeHudTimer(client, nameId, timeout, animationId, () => {
          this.fertilizePlants(client, character, item);
        });
        return;
      case Items.COLD_MEDICINE:
      case Items.VITAMINS:
      case Items.IMMUNITY_BOOSTERS:
        this.utilizeHudTimer(client, nameId, timeout, animationId, () => {
          this.usePills(client, character, item);
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
        this.utilizeHudTimer(client, nameId, timeout, animationId, () => {
          this.fillPass(client, character, item);
        });
        break;
      case "sniff": // swizzle
        this.utilizeHudTimer(client, nameId, timeout, animationId, () => {
          this.sniffPass(client, character, item);
        });
        break;
      default:
        return;
    }
  }

  sliceItem(
    client: Client,
    character: Character | BaseLootableEntity,
    item: BaseItem,
    animationId: number
  ) {
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
    this.utilizeHudTimer(client, nameId, timeout, animationId, () => {
      this.slicePass(character, item);
    });
  }

  refuelVehicle(
    client: Client,
    character: Character | BaseLootableEntity,
    item: BaseItem,
    vehicleGuid: string,
    animationId: number
  ) {
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
    const vehicle = this._vehicles[vehicleGuid];
    if (vehicle._resources[ResourceIds.FUEL] >= 10000) {
      // prevent players from wasting fuel while being at 100%
      this.sendAlert(client, "Fuel tank is full!");
      return;
    }
    this.utilizeHudTimer(client, nameId, timeout, animationId, () => {
      this.refuelVehiclePass(client, character, item, vehicleGuid, fuelValue);
    });
  }

  shredItem(
    client: Client,
    character: Character | BaseLootableEntity,
    item: BaseItem,
    animationId: number
  ) {
    const itemDefinition = this.getItemDefinition(item.itemDefinitionId);
    if (!itemDefinition) return;
    const nameId = itemDefinition.NAME_ID,
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
    this.utilizeHudTimer(client, nameId, timeout, animationId, () => {
      this.shredItemPass(character, item, count);
    });
  }

  async salvageAmmo(
    client: Client,
    character: BaseFullCharacter,
    item: BaseItem,
    animationId: number
  ): Promise<boolean> {
    const itemDefinition = this.getItemDefinition(item.itemDefinitionId);
    if (!itemDefinition) return false;
    const nameId = itemDefinition.NAME_ID;
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
      return false;
    }
    const count =
      item.itemDefinitionId == Items.AMMO_12GA ||
      item.itemDefinitionId == Items.AMMO_762 ||
      item.itemDefinitionId == Items.AMMO_308 ||
      item.itemDefinitionId == Items.AMMO_44
        ? 2
        : 1;

    return await new Promise<boolean>((resolve) => {
      this.utilizeHudTimer(client, nameId, timeout, animationId, async () => {
        resolve(await this.salvageItemPass(character, item, count));
      });
    });
  }

  async useComsumablePass(
    client: Client,
    character: Character | BaseLootableEntity,
    item: BaseItem,
    eatCount: number,
    drinkCount: number,
    comfortCount: number,
    staminaCount: number,
    givetrash: number,
    healCount: number,
    bandagingCount: number,
    enduranceCount: number,
    healType: HealTypes
  ) {
    if (!this.removeInventoryItem(character, item)) return;
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

    if (enduranceCount) {
      client.character._resources[ResourceIds.ENDURANCE] += enduranceCount;
      this.updateResource(
        client,
        client.character.characterId,
        client.character._resources[ResourceIds.ENDURANCE],
        ResourceIds.ENDURANCE
      );
    }

    if (comfortCount) {
      client.character._resources[ResourceIds.COMFORT] += comfortCount;
      this.updateResource(
        client,
        client.character.characterId,
        client.character._resources[ResourceIds.COMFORT],
        ResourceIds.COMFORT
      );
    }

    const poisonousFoods = [
      Items.MEAT_ROTTEN,
      Items.MEAT_BEAR,
      Items.MEAT_VENISON,
      Items.MEAT_RABBIT,
      Items.MEAT_WOLF
    ];
    if (poisonousFoods.includes(item.itemDefinitionId)) {
      client.character.isPoisoned = true;
      for (let i = 0; i < 12; i++) {
        const damageInfo: DamageInfo = {
          entity: "",
          damage: 25
        };
        client.character.damage(this, damageInfo);
        await scheduler.wait(500);
      }
      client.character.isPoisoned = false;
    }
    if (givetrash) {
      character.lootContainerItem(
        this,
        this.generateItem(givetrash),
        undefined,
        character instanceof Character
      );
    }
    if (bandagingCount && healCount) {
      if (!client.character.healingIntervals[healType]) {
        client.character.starthealingInterval(client, this, healType);
      }
      client.character.healType[healType].healingMaxTicks += healCount;
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
        if (client.character._resources[ResourceIds.BLEEDING] < 0)
          client.character._resources[ResourceIds.BLEEDING] = 0;
      }
      this.updateResourceToAllWithSpawnedEntity(
        client.character.characterId,
        client.character._resources[ResourceIds.BLEEDING],
        ResourceIds.BLEEDING,
        ResourceIds.BLEEDING,
        this._characters
      );
    }
  }

  slicePass(character: Character | BaseLootableEntity, item: BaseItem) {
    if (!this.removeInventoryItem(character, item)) return;
    if (item.itemDefinitionId == Items.BLACKBERRY_PIE) {
      character.lootContainerItem(
        this,
        this.generateItem(Items.BLACKBERRY_PIE_SLICE, 4)
      );
    }
  }

  async igniteoptionPass(client: Client) {
    for (const a in this._explosives) {
      const explosive = this._explosives[a];
      if (
        isPosInRadius(
          2.0,
          client.character.state.position,
          explosive.state.position
        )
      ) {
        await scheduler.wait(35);
        explosive.ignite(this, client);
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
            this.sendDataToAllWithSpawnedEntity<CharacterPlayWorldCompositeEffect>(
              smeltable.subEntity.dictionary,
              smeltable.characterId,
              "Character.PlayWorldCompositeEffect",
              {
                characterId: smeltable.characterId,
                effectId: smeltable.subEntity.workingEffect,
                position: smeltable.state.position,
                effectTime
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

            this.sendDataToAllWithSpawnedEntity<CharacterPlayWorldCompositeEffect>(
              smeltable.subEntity.dictionary,
              smeltable.characterId,
              "Character.PlayWorldCompositeEffect",
              {
                characterId: smeltable.characterId,
                effectId: smeltable.subEntity.workingEffect,
                position: smeltable.state.position,
                effectTime
              }
            );
          }
        }
      }
    }
  }

  refuelVehiclePass(
    client: Client,
    character: Character | BaseLootableEntity,
    item: BaseItem,
    vehicleGuid: string,
    fuelValue: number
  ) {
    // Also check if the vehicle is dismounted, jumping out of the car won't cancel the interaction
    if (
      !client.vehicle.mountedVehicle ||
      !this.removeInventoryItem(character, item)
    )
      return;
    const vehicle = this._vehicles[vehicleGuid];
    vehicle._resources[ResourceIds.FUEL] += fuelValue;
    // check if refuel amount is over 100, if so adjust to 100 to prevent over-fueling.
    if (vehicle._resources[ResourceIds.FUEL] >= 10000) {
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

  shredItemPass(
    character: Character | BaseLootableEntity,
    item: BaseItem,
    count: number
  ) {
    if (!this.removeInventoryItem(character, item)) return;
    character.lootItem(
      this,
      this.generateItem(Items.CLOTH, count),
      undefined,
      character instanceof Character
    );
  }

  async salvageItemPass(
    character: BaseFullCharacter,
    item: BaseItem,
    count: number
  ): Promise<boolean> {
    if (!this.removeInventoryItem(character, item)) return false;
    if (item.itemDefinitionId == Items.AMMO_12GA) {
      character.lootItem(this, this.generateItem(Items.SHARD_PLASTIC, 1));
    }
    character.lootItem(this, this.generateItem(Items.ALLOY_LEAD, count));
    character.lootItem(this, this.generateItem(Items.SHARD_BRASS, 1));
    character.lootItem(this, this.generateItem(Items.GUNPOWDER_REFINED, 1));
    return true;
  }

  repairOption(
    client: Client,
    character: Character | BaseLootableEntity,
    item: BaseItem,
    repairItem: BaseItem,
    animationId: number
  ) {
    const durability = repairItem.currentDurability;
    if (durability >= 2000) {
      // todo: get max durability from somewhere, do not hard-code
      this.sendChatText(client, "This weapon is already at max durability.");
      return;
    }

    const itemDefinition = this.getItemDefinition(repairItem.itemDefinitionId);
    if (!itemDefinition) return;
    const weaponDefinitionId = itemDefinition.PARAM1;

    switch (weaponDefinitionId) {
      case WeaponDefinitionIds.WEAPON_NAGAFENS_RAGE:
      case WeaponDefinitionIds.WEAPON_REAPER:
      case WeaponDefinitionIds.WEAPON_BLAZE:
      case WeaponDefinitionIds.WEAPON_FROSTBITE:
      case WeaponDefinitionIds.WEAPON_PURGE:
        this.sendChatText(client, "This weapon cannot be repaired.");
        return;
    }

    const itemDef = this.getItemDefinition(item.itemDefinitionId);
    if (!itemDef) return;
    const nameId = itemDef.NAME_ID;

    this.utilizeHudTimer(client, nameId, 5000, animationId, () => {
      this.repairOptionPass(client, character, item, repairItem, durability);
    });
  }

  repairOptionPass(
    client: Client,
    character: Character | BaseLootableEntity,
    item: BaseItem,
    repairItem: BaseItem,
    durability: number
  ) {
    const diff = 2000 - durability,
      isGunKit = item.itemDefinitionId == Items.GUN_REPAIR_KIT,
      repairAmount = diff < 500 ? diff : 500;

    if (!this.removeInventoryItem(character, item)) return;
    if (isGunKit) {
      repairItem.currentDurability = 2000;
    } else {
      repairItem.currentDurability += repairAmount;
    }

    // used to update the item's durability on-screen regardless of container / loadout
    this.updateItem(client, repairItem);
  }

  handleWeaponFireStateUpdate(
    client: Client,
    weaponItem: LoadoutItem,
    firestate: number
  ) {
    if (firestate == 64) {
      // empty firestate
      this.sendRemoteWeaponUpdateDataToAllOthers(
        client,
        client.character.transientId,
        weaponItem.itemGuid,
        "Update.Empty",
        {}
      );
      this.sendRemoteWeaponUpdateDataToAllOthers(
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
    const itemDefinition = this.getItemDefinition(weaponItem.itemDefinitionId);
    if (!itemDefinition) return;
    const weaponDefinitionId = itemDefinition.PARAM1;
    if (!weaponItem.weapon?.ammoCount) {
      switch (weaponDefinitionId) {
        case WeaponDefinitionIds.WEAPON_BOW_MAKESHIFT:
        case WeaponDefinitionIds.WEAPON_BOW_RECURVE:
        case WeaponDefinitionIds.WEAPON_BOW_WOOD:
          break;
        default:
          return;
      }
    }
    if (firestate > 0) {
      this.sendRemoteWeaponUpdateDataToAllOthers(
        client,
        client.character.transientId,
        weaponItem.itemGuid,
        "Update.Chamber",
        {}
      );
    }
    this.sendRemoteWeaponUpdateDataToAllOthers(
      client,
      client.character.transientId,
      weaponItem.itemGuid,
      "Update.FireState",
      {
        state: {
          firestate: firestate,
          transientId: client.character.transientId,
          position: client.character.state.position
        }
      }
    );
  }

  handleWeaponFire(client: Client, weaponItem: LoadoutItem, packet: any) {
    if (!weaponItem.weapon || weaponItem.weapon.ammoCount <= 0) {
      return;
    }
    if (weaponItem.weapon.ammoCount > 0) {
      weaponItem.weapon.ammoCount -= 1;
    }
    if (!client.vehicle.mountedVehicle && this.fairPlayManager.fairPlayValues) {
      if (
        getDistance(client.character.state.position, packet.packet.position) >
        this.fairPlayManager.fairPlayValues?.maxPositionDesync
      ) {
        this.sendChatText(
          client,
          `FairPlay: Your shot didnt register due to position desync`
        );
        this.sendChatTextToAdmins(
          `FairPlay: ${
            client.character.name
          }'s shot didnt register due to position desync by ${getDistance(
            client.character.state.position,
            packet.packet.position
          )}`
        );
      }
    }
    const drift = Math.abs(
      packet.gameTime - getCurrentServerTimeWrapper().getTruncatedU32()
    );
    if (drift > this.fairPlayManager.maxPing + 200) {
      this.sendChatText(
        client,
        `FairPlay: Your shot didnt register due to packet loss or high ping`
      );
      this.sendChatTextToAdmins(
        `FairPlay: ${client.character.name}'s shot wasnt registered due to time drift by ${drift}`
      );
      return;
    }
    const itemDefinition = this.getItemDefinition(weaponItem.itemDefinitionId);
    if (!itemDefinition) return;
    const weaponDefinitionId = itemDefinition.PARAM1;
    const keys = Object.keys(client.fireHints);
    const lastFireHint = client.fireHints[Number(keys[keys.length - 1])];
    if (lastFireHint) {
      let blockedTime = 50;
      switch (weaponDefinitionId) {
        case WeaponDefinitionIds.WEAPON_308:
        case WeaponDefinitionIds.WEAPON_REAPER:
          blockedTime = 1300;
          break;
        case WeaponDefinitionIds.WEAPON_SHOTGUN:
        case WeaponDefinitionIds.WEAPON_NAGAFENS_RAGE:
          blockedTime = 400;
          break;
      }
      if (packet.gameTime - lastFireHint.timeStamp < blockedTime) return;
    }
    let hitNumber = 0;
    if (
      !client.vehicle.mountedVehicle &&
      !isPosInRadius(3, client.character.state.position, packet.packet.position)
    ) {
      hitNumber = 1;
    }
    const shotProjectiles =
      weaponDefinitionId == WeaponDefinitionIds.WEAPON_SHOTGUN ||
      weaponDefinitionId == WeaponDefinitionIds.WEAPON_NAGAFENS_RAGE
        ? 12
        : 1;
    for (let x = 0; x < shotProjectiles; x++) {
      const fireHint: FireHint = {
        id: packet.packet.sessionProjectileCount + x,
        position: packet.packet.position,
        rotation: client.character.state.yaw,
        hitNumber: hitNumber,
        weaponItem: weaponItem,
        timeStamp: packet.gameTime
      };
      client.fireHints[packet.packet.sessionProjectileCount + x] = fireHint;
      setTimeout(() => {
        delete client.fireHints[packet.packet.sessionProjectileCount + x];
      }, 10000);
    }
    this.fairPlayManager.hitMissFairPlayCheck(this, client, false, "");
    this.stopHudTimer(client);
    this.sendRemoteWeaponUpdateDataToAllOthers(
      client,
      client.character.transientId,
      weaponItem.itemGuid,
      "Update.ProjectileLaunch",
      {}
    );

    if (itemDefinition.ITEM_CLASS == ItemClasses.THROWABLES) {
      const grenadeAmount = client.character.getInventoryItemAmount(
        weaponItem.itemDefinitionId
      );
      // Remove loadout item if there's no more grenades in the inventory, this check is only temporary until removeInventoryItems is fixed
      if (grenadeAmount <= 0) {
        this.removeInventoryItem(client.character, weaponItem);
        return;
      }
      this.removeInventoryItems(client.character, weaponItem.itemDefinitionId);
      return;
    }
    this.damageItem(client.character, weaponItem, 5);
  }

  handleWeaponReload(client: Client, weaponItem: LoadoutItem) {
    if (!weaponItem.weapon) return;
    if (weaponItem.weapon.reloadTimer) return;
    const maxAmmo = this.getWeaponMaxAmmo(weaponItem.itemDefinitionId); // max clip size
    if (weaponItem.weapon.ammoCount >= maxAmmo) return;
    // force 0 firestate so gun doesnt shoot randomly after reloading
    this.sendRemoteWeaponUpdateDataToAllOthers(
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
    this.sendRemoteWeaponUpdateDataToAllOthers(
      client,
      client.character.transientId,
      weaponItem.itemGuid,
      "Update.Reload",
      {}
    );
    const weaponAmmoId = this.getWeaponAmmoId(weaponItem.itemDefinitionId),
      reloadTime = this.getWeaponReloadTime(weaponItem.itemDefinitionId);

    const itemDefinition = this.getItemDefinition(weaponItem.itemDefinitionId);
    if (!itemDefinition) return;
    const weaponDefinitionId = itemDefinition.PARAM1;

    // Allow reloading for grenades
    if (itemDefinition.ITEM_CLASS == ItemClasses.WEAPON_THROWABLES) {
      weaponItem.weapon.ammoCount = 1;
      this.sendWeaponReload(client, weaponItem, 1);
      return;
    }

    switch (weaponDefinitionId) {
      case WeaponDefinitionIds.WEAPON_BOW_MAKESHIFT:
      case WeaponDefinitionIds.WEAPON_BOW_RECURVE:
      case WeaponDefinitionIds.WEAPON_BOW_WOOD:
        const currentWeapon = client.character.getEquippedWeapon();
        if (!currentWeapon || currentWeapon.itemGuid != weaponItem.itemGuid) {
          return;
        }
        const maxReloadAmount = maxAmmo - weaponItem.weapon.ammoCount, // how much ammo is needed for full clip
          reserveAmmo = client.character.getInventoryItemAmount(weaponAmmoId), // how much ammo is in inventory
          reloadAmount =
            reserveAmmo >= maxReloadAmount ? maxReloadAmount : reserveAmmo; // actual amount able to reload

        if (
          !this.removeInventoryItems(
            client.character,
            weaponAmmoId,
            reloadAmount
          )
        ) {
          return;
        }
        this.sendWeaponReload(
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
            !this.removeInventoryItems(client.character, weaponAmmoId, 1)) ||
          ++weaponItem.weapon.ammoCount == maxAmmo
        ) {
          this.sendWeaponReload(client, weaponItem);
          this.sendRemoteWeaponUpdateDataToAllOthers(
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
          this.sendWeaponReload(client, weaponItem);
          this.sendRemoteWeaponUpdateDataToAllOthers(
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
        reserveAmmo = client.character.getInventoryItemAmount(weaponAmmoId), // how much ammo is in inventory
        reloadAmount =
          reserveAmmo >= maxReloadAmount ? maxReloadAmount : reserveAmmo; // actual amount able to reload

      if (
        !this.removeInventoryItems(client.character, weaponAmmoId, reloadAmount)
      ) {
        return;
      }
      this.sendWeaponReload(
        client,
        weaponItem,
        (weaponItem.weapon.ammoCount += reloadAmount)
      );
      client.character.clearReloadTimeout();
    }, reloadTime);
  }

  pUtilizeHudTimer = promisify(this.utilizeHudTimer);

  stopHudTimer(client: Client) {
    if (client.hudTimer === null) {
      // No timer running so nothing to do
      return;
    }
    this.utilizeHudTimer(client, 0, 0, 0, () => {
      client.hudTimer = null;
      this.sendDataToAllWithSpawnedEntity(
        this._characters,
        client.character.characterId,
        "CharacterState.InteractionStop",
        {
          characterId: client.character.characterId
        }
      );
      // TODO: this should be somewhere else
      const vehicle = this._vehicles[client.vehicle.mountedVehicle ?? ""];
      if (!vehicle) return;
      vehicle.removeHotwireEffect(this);
    });
  }

  utilizeHudTimer(
    client: Client,
    nameId: number,
    timeout: number,
    animationId: number,
    callback: any
  ) {
    if (!animationId) {
      this.startTimer(client, nameId, timeout);
    } else {
      this.startInteractionTimer(client, nameId, timeout, animationId);
    }
    if (client.hudTimer != null) {
      clearTimeout(client.hudTimer);
    }
    client.posAtTimerStart = client.character.state.position;
    client.hudTimer = setTimeout(() => {
      callback.apply(this);
      client.hudTimer = null;
      this.sendDataToAllWithSpawnedEntity(
        this._characters,
        client.character.characterId,
        "CharacterState.InteractionStop",
        {
          characterId: client.character.characterId
        }
      );
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
        this.sendData<ContainerError>(client, "Container.Error", {
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
    let hudIndicator: HudIndicator | undefined;
    switch (modifier) {
      case MovementModifiers.SWIZZLE:
        hudIndicator = this._hudIndicators["SWIZZLE"];
        if (client.character.timeouts["swizzle"]) {
          client.character.timeouts["swizzle"]._onTimeout();
          clearTimeout(client.character.timeouts["swizzle"]);
          delete client.character.timeouts["swizzle"];
          if (client.character.hudIndicators[hudIndicator.typeName]) {
            client.character.hudIndicators[
              hudIndicator.typeName
            ].expirationTime += 30000;
          }
        }
        client.character.hudIndicators[hudIndicator.typeName] = {
          typeName: hudIndicator.typeName,
          expirationTime: Date.now() + 30000
        };
        this.sendHudIndicators(client);
        this.addScreenEffect(client, this._screenEffects["SWIZZLE"]);
        client.character.timeouts["swizzle"] = setTimeout(() => {
          if (!client.character.timeouts["swizzle"]) {
            return;
          }
          this.divideMovementModifier(client, modifier);
          delete client.character.timeouts["swizzle"];
        }, 30000);
        break;
      case MovementModifiers.RESTED:
        hudIndicator = this._hudIndicators["WELL_RESTED"];
        if (client.character.timeouts["WELL_RESTED"]) {
          client.character.timeouts["WELL_RESTED"]._onTimeout();
          clearTimeout(client.character.timeouts["WELL_RESTED"]);
          delete client.character.timeouts["WELL_RESTED"];
          if (client.character.hudIndicators[hudIndicator.typeName]) {
            client.character.hudIndicators[
              hudIndicator.typeName
            ].expirationTime += 120000;
          }
        }
        client.character.hudIndicators[hudIndicator.typeName] = {
          typeName: hudIndicator.typeName,
          expirationTime: Date.now() + 120000
        };
        this.sendHudIndicators(client);
        client.character.timeouts["WELL_RESTED"] = setTimeout(() => {
          if (!client.character.timeouts["WELL_RESTED"]) {
            return;
          }
          this.divideMovementModifier(client, modifier);
          delete client.character.timeouts["WELL_RESTED"];
        }, 120000);
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
    this.sendData<ClientUpdateModifyMovementSpeed>(
      client,
      "ClientUpdate.ModifyMovementSpeed",
      {
        speed: modifier
      }
    );
  }

  divideMovementModifier(client: Client, modifier: number) {
    const modifierFixed = 1 / modifier;
    if (!client.character.initialized) return;
    this.sendData<ClientUpdateModifyMovementSpeed>(
      client,
      "ClientUpdate.ModifyMovementSpeed",
      {
        speed: modifierFixed
      }
    );
  }

  checkShoes(client: Client, character = client.character) {
    if (!character._equipment["5"]) {
      if (character.hasConveys) {
        character.hasConveys = false;
        this.divideMovementModifier(client, MovementModifiers.CONVEYS);
      }

      if (character.hasBoots) {
        character.hasBoots = false;
        this.divideMovementModifier(client, MovementModifiers.BOOTS);
      }
    } else {
      if (character._equipment["5"].guid) {
        const item = client.character.getInventoryItem(
          character._equipment["5"].guid
        );
        const itemDefinition = this.getItemDefinition(
          item?.itemDefinitionId ?? 0
        );
        if (!item || !itemDefinition) return;

        if (itemDefinition.DESCRIPTION_ID == 11895 && !character.hasConveys) {
          character.hasConveys = true;
          this.multiplyMovementModifier(client, MovementModifiers.CONVEYS);
        } else if (
          itemDefinition.DESCRIPTION_ID != 11895 &&
          character.hasConveys
        ) {
          character.hasConveys = false;
          this.divideMovementModifier(client, MovementModifiers.CONVEYS);
        }

        if (itemDefinition.DESCRIPTION_ID == 11155 && !character.hasBoots) {
          character.hasBoots = true;
          this.multiplyMovementModifier(client, MovementModifiers.BOOTS);
        } else if (
          itemDefinition.DESCRIPTION_ID != 11895 &&
          character.hasBoots
        ) {
          character.hasBoots = false;
          this.divideMovementModifier(client, MovementModifiers.BOOTS);
        }
      }
    }
  }

  checkNightVision(client: Client, character = client.character) {
    if (
      character._loadout[29] &&
      character._loadout[29].itemDefinitionId == Items.NV_GOGGLES
    )
      return;
    const index = character.screenEffects.indexOf("NIGHTVISION");
    if (index > -1) {
      character.screenEffects.splice(index, 1);
      this.removeScreenEffect(client, this._screenEffects["NIGHTVISION"]);
    }
  }

  //#endregion

  async reloadZonePacketHandlers() {
    //@ts-ignore
    delete this._packetHandlers;
    delete require.cache[require.resolve("./zonepackethandlers")];
    this._packetHandlers =
      new (require("./zonepackethandlers").ZonePacketHandlers)();
    await this.reloadCommandCache();
  }
  generateGuid(): string {
    return generateRandomGuid();
  }
  private _sendRawDataReliable(client: Client, data: Buffer) {
    this._gatewayServer.sendTunnelData(
      client.soeClientId,
      data,
      SOEOutputChannels.Reliable
    );
  }
  sendRawDataReliable(client: Client, data: Buffer) {
    this._sendRawDataReliable(client, data);
  }
  sendUnbufferedRawDataReliable(client: Client, data: Buffer) {
    this._sendRawDataReliable(client, data);
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
      this.routinesLoopTimer = setTimeout(() => {
        this.startRoutinesLoop();
      }, 3000);
      return;
    }
    for (const a in this._clients) {
      while (this.isSaving) {
        await scheduler.wait(500);
      }
      const startTime = Date.now();
      const client = this._clients[a];
      if (!client.isLoading) {
        client.routineCounter++;
        this.constructionManager.constructionPermissionsManager(this, client);
        this.checkInMapBounds(client);
        this.checkZonePing(client);
        if (client.routineCounter >= 3) {
          this.createFairPlayInternalPacket(client);
          this.assignChunkRenderDistance(client);
          this.removeOutOfDistanceEntities(client);
          this.removeOODInteractionData(client);
          this.POIManager(client);
          client.routineCounter = 0;
        }
        //this.constructionManager.spawnConstructionParentsInRange(this, client); // put back into grid for now
        this.vehicleManager(client);
        this.spawnGridObjects(client); // Spawn base parts before the player
        this.spawnCharacters(client);
        //this.constructionManager.worldConstructionManager(this, client); // put into grid
        client.posAtLastRoutine = client.character.state.position;
      }
      const endTime = Date.now();
      const timeTaken = endTime - startTime;
      if (timeTaken > this.tickRate) {
        console.log(
          `Routine took ${timeTaken}ms to execute, which is more than the tickRate ${this.tickRate}`
        );
      }
      await scheduler.wait(this.tickRate, {});
    }
    this.startRoutinesLoop();
  }

  executeRoutine(client: Client) {
    this.constructionManager.constructionPermissionsManager(this, client);
    //this.constructionManager.spawnConstructionParentsInRange(this, client); // put into grid
    this.vehicleManager(client);
    this.removeOutOfDistanceEntities(client);
    this.spawnGridObjects(client); // Spawn base parts before the player
    this.spawnCharacters(client);
    //this.constructionManager.worldConstructionManager(this, client);
    this.POIManager(client);
    client.posAtLastRoutine = client.character.state.position;
  }

  firstRoutine(client: Client) {
    //this.constructionManager.spawnConstructionParentsInRange(this, client); // put into grid
    this.spawnLoadingGridObjects(client);
    this.spawnCharacters(client);
    //this.constructionManager.worldConstructionManager(this, client);
    this.POIManager(client);
    client.posAtLastRoutine = client.character.state.position;
  }

  async checkZonePing(client: Client) {
    const ping = this._gatewayServer.getSoeClientAvgPing(client.soeClientId);
    if (
      client.isAdmin ||
      Number(client.character.lastLoginDate) + 30000 > new Date().getTime() ||
      !ping
    ) {
      return;
    }

    client.zonePings.push(ping > 400 ? 400 : ping); // dont push values higher than 400, that would increase average value drasticaly and it's the resend rate
    if (ping >= this.fairPlayManager.maxPing) {
      this.sendAlert(
        client,
        `Your ping is very high: ${ping}. You may be kicked soon`
      );
      client.pingWarnings += 1;
    } else {
      client.pingWarnings = 0;
    }
    if (client.zonePings.length < 15) return;

    const averagePing =
      client.zonePings.reduce((a, b) => a + b, 0) / client.zonePings.length;
    if (
      averagePing >= this.fairPlayManager.maxPing &&
      client.pingWarnings > 3
    ) {
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
    const index = client.character.screenEffects.indexOf("OUTOFMAPBOUNDS");
    if (!inMapBounds && (!client.isAdmin || !client.isDebugMode)) {
      const damageInfo: DamageInfo = {
        entity: "Server.OutOfMapBounds",
        damage: 1000
      };
      this.sendAlert(client, `The radiation here seems to be dangerously high`);
      client.character.damage(this, damageInfo);
      if (index <= -1) {
        client.character.screenEffects.push("OUTOFMAPBOUNDS");
        this.addScreenEffect(client, this._screenEffects["OUTOFMAPBOUNDS"]);
      }
    } else {
      if (index > -1) {
        client.character.screenEffects.splice(index, 1);
        this.removeScreenEffect(client, this._screenEffects["OUTOFMAPBOUNDS"]);
      }
    }
  }

  initHudIndicatorDataSource() {
    hudIndicators.forEach((indicator: any) => {
      this._hudIndicators[indicator.typeName] = {
        id: indicator.ID,
        typeName: indicator.typeName,
        nameId: indicator.nameId,
        descriptionId: indicator.descriptionId,
        imageSetId: indicator.imageSetId
      };
    });
  }

  initScreenEffectDataSource() {
    screenEffects.forEach((effect: any) => {
      this._screenEffects[effect.typeName] = {
        effectId: effect.id,
        typeName: effect.typeName,
        duration: effect.duration,
        screenBrightness: effect.screenBrightness,
        colorGradingFilename: effect.colorGradingFilename,
        colorGrading: effect.colorGrading,
        screenCover: effect.screenCover,
        transparency: effect.transparency,
        color: parseInt(effect.color, 16),
        unknownDword3: effect?.unknownDword3 ?? 0,
        unknownDword7: effect?.unknownDword7 ?? 0,
        unknownDword16: effect?.unknownDword16 ?? 0,
        unknownDword17: effect?.unknownDword17 ?? 0,
        unknownDword18: effect?.unknownDword18 ?? 0,
        unknownDword19: effect?.unknownDword19 ?? 0
      };
    });
  }

  createFairPlayInternalPacket(client: Client) {
    // send fake packet for plugin to handle
    const packet: H1z1ProtocolReadingFormat = {
      name: "FairPlay.Internal",
      flag: 0,
      data: null
    };
    this.onZoneDataEvent(client, packet);
  }

  initClientEffectsDataSource() {
    clientEffectsDataSource.forEach((clientEffect: any) => {
      this._clientEffectsData[clientEffect.SERVER_EFFECT_ID] = {
        id: clientEffect.ABILITY_ID,
        typeName: clientEffect.TYPE_NAME,
        animationName: clientEffect.STRING1
      };
    });
  }

  initModelsDataSource() {
    models.forEach((model: any) => {
      this._modelsData[model.ID] = {
        id: model.ID,
        fileName: model.MODEL_FILE_NAME,
        materialType: model.MATERIAL_TYPE
      };
    });
  }

  initUseOptionsDataSource() {
    itemUseOptionsDataSource.forEach((useOption: any) => {
      this._itemUseOptions[useOption.ITEM_USE_OPTION_ID] = {
        id: useOption.ITEM_USE_OPTION_ID,
        typeName: useOption.TYPE_NAME,
        animationId: useOption.INTERACTION_ANIMATION_ID
      };
    });
  }

  sendHudIndicators(client: Client) {
    this.sendData(client, "Effect.RemoveUiIndicators", {
      unknownData1: {
        unknownQword1: client.character.characterId
      },
      unknownData2: {}
    });
    client.character.resourceHudIndicators.forEach(
      (typeName: string, index) => {
        const indicator = this._hudIndicators[typeName];
        if (!indicator) {
          // to help identifying the issue
          console.log(`Unknown hud indicator: ${typeName} removing it`);
          client.character.resourceHudIndicators.splice(index, 1);
          return;
        }
        this.sendData(client, "Effect.AddUiIndicator", {
          characterId: client.character.characterId,
          hudElementGuid: this.generateGuid(),
          unknownData1: {
            hudElementId: indicator.nameId
          },
          hudElementData: {
            nameId: indicator.nameId,
            descriptionId: indicator.descriptionId,
            imageSetId: indicator.imageSetId
          },
          unknownData3: {},
          unknownData4: {},
          unknownData5: {}
        });
      }
    );
    for (const a in client.character.hudIndicators) {
      const indicator =
        this._hudIndicators[client.character.hudIndicators[a].typeName];
      this.sendData(client, "Effect.AddUiIndicator", {
        characterId: client.character.characterId,
        hudElementGuid: this.generateGuid(),
        unknownData1: {
          hudElementId: indicator.nameId
        },
        hudElementData: {
          nameId: indicator.nameId,
          descriptionId: indicator.descriptionId,
          imageSetId: indicator.imageSetId
        },
        unknownData3: {},
        unknownData4: {},
        unknownData5: {}
      });
    }
  }

  addScreenEffect(client: Client, effect: ScreenEffect) {
    this.sendData(client, "ScreenEffect.ApplyScreenEffect", effect);
  }

  removeScreenEffect(client: Client, effect: ScreenEffect) {
    this.sendData(client, "ScreenEffect.RemoveScreenEffect", effect);
  }

  private _sendDataToAll<ZonePacket>(
    packetName: h1z1PacketsType2016,
    obj: ZonePacket
  ) {
    const data = this._protocol.pack(packetName, obj);
    if (data) {
      for (const a in this._clients) {
        this.sendRawDataReliable(this._clients[a], data);
      }
    }
  }

  sendDataToAll<ZonePacket>(packetName: h1z1PacketsType2016, obj: ZonePacket) {
    this._sendDataToAll(packetName, obj);
  }
  dropVehicleManager(client: Client, vehicleGuid: string) {
    this.sendManagedObjectResponseControlPacket(client, {
      control: false,
      objectCharacterId: vehicleGuid
    });
    client.managedObjects.splice(
      client.managedObjects.findIndex((e: string) => e === vehicleGuid),
      1
    );
    delete this._vehicles[vehicleGuid]?.manager;
  }
  sendZonePopulationUpdate() {
    let populationNumber = 0;
    for (const key in this._characters) {
      const char = this._characters[key];
      const client = this.getClientByCharId(char.characterId);
      if (!client?.isAdmin) {
        populationNumber++;
      }
    }
    this._loginConnectionManager.sendData(
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
  dismissVehicle(vehicleGuid: string) {
    this.sendDataToAll<CharacterRemovePlayer>("Character.RemovePlayer", {
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
  sendConsoleText(
    client: Client,
    message: string,
    showConsole = false,
    clearOutput = false
  ) {
    this.sendData<H1emuPrintToConsole>(client, "H1emu.PrintToConsole", {
      message,
      showConsole,
      clearOutput
    });
  }
  sendConsoleTextToAdmins(
    message: string,
    showConsole = false,
    clearOutput = false
  ) {
    for (const a in this._clients) {
      const client = this._clients[a];
      if (client.isAdmin) {
        this.sendData<H1emuPrintToConsole>(client, "H1emu.PrintToConsole", {
          message,
          showConsole,
          clearOutput
        });
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

  getShaderParameterGroup(itemDefinitionId: number): Array<any> {
    return (
      this.dynamicappearance.SHADER_SEMANTIC_DEFINITIONS.find(
        (definition: {
          SHADER_PARAMETER_GROUP_ID: number;
          SHADER_PARAMETER_GROUP: Array<{ SHADER_SEMANTIC_ID: number }>;
        }) => {
          return definition.SHADER_PARAMETER_GROUP_ID == itemDefinitionId;
        }
      )?.SHADER_PARAMETER_GROUP ?? []
    );
  }

  getShaderGroupId(itemDefinitionId: number): number {
    return (
      this.dynamicappearance.ITEM_APPEARANCE_DEFINITIONS.filter(
        (definition: {
          ID: number;
          ITEM_APPEARANCE_DATA: {
            ID: number;
            ITEM_ID: number;
            MODEL_ID: number;
            GENDER_ID: number;
            SHADER_PARAMETER_GROUP_ID: number;
          };
        }) => {
          return definition.ITEM_APPEARANCE_DATA.ITEM_ID == itemDefinitionId;
        }
      )[0]?.ITEM_APPEARANCE_DATA?.SHADER_PARAMETER_GROUP_ID ?? 0
    );
  }

  sendDeliveryStatus(client: Client | undefined = undefined) {
    const hasEnoughSurvivors =
      this._soloMode ||
      this.worldObjectManager.minAirdropSurvivors < _.size(this._clients);

    let status = 0;
    switch (true) {
      case !hasEnoughSurvivors:
        status = 2;
        break;
      case this._airdrop !== undefined:
        status = 1;
        break;
    }

    if (client) {
      this.sendData(client, "Command.DeliveryManagerStatus", {
        color: status == 0 ? 1 : 0,
        status: status
      });
      return;
    }

    this.sendDataToAll("Command.DeliveryManagerStatus", {
      color: status == 0 ? 1 : 0,
      status: status
    });
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
