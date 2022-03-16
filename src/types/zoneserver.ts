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

import { ZoneClient } from "../servers/ZoneServer2015/classes/zoneclient";
import { ZoneServer2015 } from "../servers/ZoneServer2015/zoneserver";
import { ZoneClient2016 } from "../servers/ZoneServer2016/classes/zoneclient";
import { ZoneServer2016 } from "../servers/ZoneServer2016/zoneserver";

export interface HandledZonePackets {
  ClientIsReady: (
    server: ZoneServer2015,
    client: ZoneClient,
    packet: any
  ) => void;
  ClientFinishedLoading: (
    server: ZoneServer2015,
    client: ZoneClient,
    packet: any
  ) => void;
  Security: (server: ZoneServer2015, client: ZoneClient, packet: any) => void;
  "Command.RecipeStart": (
    server: ZoneServer2015,
    client: ZoneClient,
    packet: any
  ) => void;
  "Command.FreeInteractionNpc": (
    server: ZoneServer2015,
    client: ZoneClient,
    packet: any
  ) => void;
  "Collision.Damage": (
    server: ZoneServer2015,
    client: ZoneClient,
    packet: any
  ) => void;
  "LobbyGameDefinition.DefinitionsRequest": (
    server: ZoneServer2015,
    client: ZoneClient,
    packet: any
  ) => void;
  "PlayerUpdate.EndCharacterAccess": (
    server: ZoneServer2015,
    client: ZoneClient,
    packet: any
  ) => void;
  KeepAlive: (server: ZoneServer2015, client: ZoneClient, packet: any) => void;
  ClientLog: (server: ZoneServer2015, client: ZoneClient, packet: any) => void;
  "WallOfData.UIEvent": (
    server: ZoneServer2015,
    client: ZoneClient,
    packet: any
  ) => void;
  SetLocale: (server: ZoneServer2015, client: ZoneClient, packet: any) => void;
  GetContinentBattleInfo: (
    server: ZoneServer2015,
    client: ZoneClient,
    packet: any
  ) => void;
  "Command.SetInWater": (
    server: ZoneServer2015,
    client: ZoneClient,
    packet: any
  ) => void;
  "Command.ClearInWater": (
    server: ZoneServer2015,
    client: ZoneClient,
    packet: any
  ) => void;
  "Chat.Chat": (
    server: ZoneServer2015,
    client: ZoneClient,
    packet: any
  ) => void;
  "Loadout.SelectSlot": (
    server: ZoneServer2015,
    client: ZoneClient,
    packet: any
  ) => void;
  ClientInitializationDetails: (
    server: ZoneServer2015,
    client: ZoneClient,
    packet: any
  ) => void;
  ClientLogout: (
    server: ZoneServer2015,
    client: ZoneClient,
    packet: any
  ) => void;
  GameTimeSync: (
    server: ZoneServer2015,
    client: ZoneClient,
    packet: any
  ) => void;
  Synchronization: (
    server: ZoneServer2015,
    client: ZoneClient,
    packet: any
  ) => void;
  "Command.ExecuteCommand": (
    server: ZoneServer2015,
    client: ZoneClient,
    packet: any
  ) => void;
  "Command.SetProfile": (
    server: ZoneServer2015,
    client: ZoneClient,
    packet: any
  ) => void;
  "Mount.DismountRequest": (
    server: ZoneServer2015,
    client: ZoneClient,
    packet: any
  ) => void;
  "Command.InteractRequest": (
    server: ZoneServer2015,
    client: ZoneClient,
    packet: any
  ) => void;
  "Command.InteractionString": (
    server: ZoneServer2015,
    client: ZoneClient,
    packet: any
  ) => void;
  "Command.InteractionSelect": (
    server: ZoneServer2015,
    client: ZoneClient,
    packet: any
  ) => void;
  "PlayerUpdate.VehicleCollision": (
    server: ZoneServer2015,
    client: ZoneClient,
    packet: any
  ) => void;
  "Vehicle.Dismiss": (
    server: ZoneServer2015,
    client: ZoneClient,
    packet: any
  ) => void;
  "Vehicle.Spawn": (
    server: ZoneServer2015,
    client: ZoneClient,
    packet: any
  ) => void;
  "Vehicle.AutoMount": (
    server: ZoneServer2015,
    client: ZoneClient,
    packet: any
  ) => void;
  "AdminCommand.SpawnVehicle": (
    server: ZoneServer2015,
    client: ZoneClient,
    packet: any
  ) => void;
  "Command.InteractCancel": (
    server: ZoneServer2015,
    client: ZoneClient,
    packet: any
  ) => void;
  "Command.StartLogoutRequest": (
    server: ZoneServer2015,
    client: ZoneClient,
    packet: any
  ) => void;
  CharacterSelectSessionRequest: (
    server: ZoneServer2015,
    client: ZoneClient,
    packet: any
  ) => void;
  "ProfileStats.GetPlayerProfileStats": (
    server: ZoneServer2015,
    client: ZoneClient,
    packet: any
  ) => void;
  Pickup: (server: ZoneServer2015, client: ZoneClient, packet: any) => void;
  GetRewardBuffInfo: (
    server: ZoneServer2015,
    client: ZoneClient,
    packet: any
  ) => void;
  PlayerUpdateManagedPosition: (
    server: ZoneServer2015,
    client: ZoneClient,
    packet: any
  ) => void;
  PlayerUpdateUpdatePositionClientToZone: (
    server: ZoneServer2015,
    client: ZoneClient,
    packet: any
  ) => void;
  "Command.PlayerSelect": (
    server: ZoneServer2015,
    client: ZoneClient,
    packet: any
  ) => void;
  "Construction.PlacementRequest": (
    server: ZoneServer2015,
    client: ZoneClient,
    packet: any
  ) => void;
  "Construction.PlacementFinalizeRequest": (
    server: ZoneServer2015,
    client: ZoneClient,
    packet: any
  ) => void;
  "PlayerUpdate.Respawn": (
    server: ZoneServer2015,
    client: ZoneClient,
    packet: any
  ) => void;
  "PlayerUpdate.FullCharacterDataRequest": (
    server: ZoneServer2015,
    client: ZoneClient,
    packet: any
  ) => void;
}

export interface HandledZonePackets2016 {
  ClientIsReady: (
    server: ZoneServer2016,
    client: ZoneClient2016,
    packet: any
  ) => void;
  ClientFinishedLoading: (
    server: ZoneServer2016,
    client: ZoneClient2016,
    packet: any
  ) => void;
  Security: (
    server: ZoneServer2016,
    client: ZoneClient2016,
    packet: any
  ) => void;
  "Command.RecipeStart": (
    server: ZoneServer2016,
    client: ZoneClient2016,
    packet: any
  ) => void;
  "Command.FreeInteractionNpc": (
    server: ZoneServer2016,
    client: ZoneClient2016,
    packet: any
  ) => void;
  "Collision.Damage": (
    server: ZoneServer2016,
    client: ZoneClient2016,
    packet: any
  ) => void;
  "LobbyGameDefinition.DefinitionsRequest": (
    server: ZoneServer2016,
    client: ZoneClient2016,
    packet: any
  ) => void;
  KeepAlive: (
    server: ZoneServer2016,
    client: ZoneClient2016,
    packet: any
  ) => void;
  "ClientUpdate.MonitorTimeDrift": (
    server: ZoneServer2016,
    client: ZoneClient2016,
    packet: any
  ) => void;
  ClientLog: (
    server: ZoneServer2016,
    client: ZoneClient2016,
    packet: any
  ) => void;
  "WallOfData.UIEvent": (
    server: ZoneServer2016,
    client: ZoneClient2016,
    packet: any
  ) => void;
  SetLocale: (
    server: ZoneServer2016,
    client: ZoneClient2016,
    packet: any
  ) => void;
  GetContinentBattleInfo: (
    server: ZoneServer2016,
    client: ZoneClient2016,
    packet: any
  ) => void;
  "Chat.Chat": (
    server: ZoneServer2016,
    client: ZoneClient2016,
    packet: any
  ) => void;
  ClientInitializationDetails: (
    server: ZoneServer2016,
    client: ZoneClient2016,
    packet: any
  ) => void;
  ClientLogout: (
    server: ZoneServer2016,
    client: ZoneClient2016,
    packet: any
  ) => void;
  GameTimeSync: (
    server: ZoneServer2016,
    client: ZoneClient2016,
    packet: any
  ) => void;
  Synchronization: (
    server: ZoneServer2016,
    client: ZoneClient2016,
    packet: any
  ) => void;
  "Command.ExecuteCommand": (
    server: ZoneServer2016,
    client: ZoneClient2016,
    packet: any
  ) => void;
  "Command.InteractRequest": (
    server: ZoneServer2016,
    client: ZoneClient2016,
    packet: any
  ) => void;
  "Command.InteractCancel": (
    server: ZoneServer2016,
    client: ZoneClient2016,
    packet: any
  ) => void;
  "Command.StartLogoutRequest": (
    server: ZoneServer2016,
    client: ZoneClient2016,
    packet: any
  ) => void;
  CharacterSelectSessionRequest: (
    server: ZoneServer2016,
    client: ZoneClient2016,
    packet: any
  ) => void;
  "ProfileStats.GetPlayerProfileStats": (
    server: ZoneServer2016,
    client: ZoneClient2016,
    packet: any
  ) => void;
  Pickup: (server: ZoneServer2016, client: ZoneClient2016, packet: any) => void;
  GetRewardBuffInfo: (
    server: ZoneServer2016,
    client: ZoneClient2016,
    packet: any
  ) => void;
  PlayerUpdateUpdatePositionClientToZone: (
    server: ZoneServer2016,
    client: ZoneClient2016,
    packet: any
  ) => void;
  "Character.Respawn": (
    server: ZoneServer2016,
    client: ZoneClient2016,
    packet: any
  ) => void;
  "Character.FullCharacterDataRequest": (
    server: ZoneServer2016,
    client: ZoneClient2016,
    packet: any
  ) => void;
  "Command.PlayerSelect": (
    server: ZoneServer2016,
    client: ZoneClient2016,
    packet: any
  ) => void;
  "Mount.DismountRequest": (
    server: ZoneServer2016,
    client: ZoneClient2016,
    packet: any
  ) => void;
  "Command.InteractionString": (
    server: ZoneServer2016,
    client: ZoneClient2016,
    packet: any
  ) => void;
  "Mount.SeatChangeRequest": (
    server: ZoneServer2016,
    client: ZoneClient2016,
    packet: any
  ) => void;
  "Construction.PlacementFinalizeRequest": (
    server: ZoneServer2016,
    client: ZoneClient2016,
    packet: any
  ) => void;
}

export interface npcData {
  guid: string;
  characterId: string;
  transientId: number;
  modelId: number;
  scale: number[];
  resources: any;
  position: Float32Array;
  rotation: Float32Array;
  attachedObject: any;
  vehicleId: number;
  positionUpdateType: number;
  color: any;
  unknownArray1: any[];
  destroyedState: number;
  array5: any[];
  array17: any[];
  array18: any[];
}
export interface seats {
  seat1: boolean;
  seat2: boolean;
  seat3: boolean;
  seat4: boolean;
}

export interface passengers {
  passenger1?: any;
  passenger2?: any;
  passenger3?: any;
  passenger4?: any;
}

export interface positionUpdate {
  position?: any;
  orientation?: any;
  engineRPM?: any;
}

export interface characterEquipment {
  modelName: string;
  slotId: number;
  guid?: string;
  defaultTextureAlias?: string;
  textureAlias?: string;
  tintAlias?: string;
  decalAlias?: string;
}

export interface inventoryItem {
  itemDefinitionId: number;
  slotId: number;
  itemGuid: string;
  containerGuid: string;
  currentDurability: number;
  stackCount: number;
}

export interface loadoutItem extends inventoryItem {
  loadoutItemOwnerGuid: string;
}

export interface loadoutContainer extends loadoutItem {
  containerDefinitionId: number;
  items: { [itemGuid: string]: inventoryItem };
}

export interface Client {
  currentPOI?: number;
  firstLoading: boolean;
  isLoading: boolean;
  isInteracting: boolean;
  posAtLastRoutine: Float32Array;
  posAtLogoutStart: Float32Array;
  timer: NodeJS.Timeout | null;
  spawnedEntities: any[];
  managedObjects: any[];
  vehicle: {
    falling: number;
    mountedVehicle?: string;
    mountedVehicleType?: string;
    vehicleState: number;
  };
  character: {
    characterId: string;
    transientId: number;
    name?: string;
    loadouts?: any;
    extraModel?: string;
    isRunning: boolean;
    resourcesUpdater?: any;
    equipment: characterEquipment[];
    resources: {
      health: number;
      stamina: number;
      virus: number;
      food: number;
      water: number;
    };
    currentLoadoutTab?: number;
    currentLoadoutId?: number;
    currentLoadout?: number;
    guid?: string;
    inventory?: Array<any>;
    factionId?: number;
    spawnLocation?: string;
    state: {
      position: Float32Array;
      rotation: Float32Array;
      lookAt: Float32Array;
      health: number;
      shield: number;
    };
    // 2016 only
    actorModelId?: number;
    headActor?: string;
    isRespawning?: boolean;
    gender?: number;
    creationDate?: string;
    lastLoginDate?: string;
  };
  loginSessionId?: string;
  sessionId: number;
  address: string;
  port: number;
  crcSeed: number;
  crcLength: number;
  clientUdpLength: number;
  serverUdpLength: number;
  sequences: any;
  compression: number;
  useEncryption: boolean;
  outQueue: any;
  outOfOrderPackets: any;
  nextAck: number;
  lastAck: number;
  inputStream: () => void;
  outputStream: () => void;
  outQueueTimer: () => void;
  ackTimer: () => void;
  lastPingTime: number;
  pingTimer: NodeJS.Timeout;
  savePositionTimer?: NodeJS.Timeout;
  outOfOrderTimer: () => void;
}

export interface SendZoneDetailsPacket {
  zoneName: string;
  zoneType: number;
  unknownBoolean1: boolean;
  skyData: Weather;
  zoneId1: number;
  zoneId2: number;
  nameId: number;
  unknownBoolean7: boolean;
}

export interface Weather {
  templateName?: string;
  name: string;
  unknownDword1: number;
  unknownDword2: number;
  unknownDword3: number;
  unknownDword4: number;
  fogDensity: number;
  fogGradient: number;
  fogFloor: number;
  unknownDword7: number;
  rain: number;
  temp: number;
  skyColor: number;
  cloudWeight0: number;
  cloudWeight1: number;
  cloudWeight2: number;
  cloudWeight3: number;
  sunAxisX: number;
  sunAxisY: number;
  sunAxisZ: number;
  unknownDword18: number;
  unknownDword19: number;
  unknownDword20: number;
  wind: number;
  unknownDword22: number;
  unknownDword23: number;
  unknownDword24: number;
  unknownDword25: number;
  unknownArray: UnknownArray[];
}

export interface UnknownArray {
  unknownDword1: number;
  unknownDword2: number;
  unknownDword3: number;
  unknownDword4: number;
  unknownDword5: number;
  unknownDword6: number;
  unknownDword7: number;
}

export interface skyData {
  templateName?: string;
  snow: number;
  snowMap: number;
  colorGradient: number;
  sunAxisX: number;
  sunAxisY: number;
  wind: number;
}

export interface Weather2016 {
  templateName?: string;
  name: string;
  unknownDword1: number;
  unknownDword2: number;
  skyBrightness1: number;
  skyBrightness2: number;
  snow: number;
  snowMap: number;
  colorGradient: number;
  unknownDword8: number;
  unknownDword9: number;
  unknownDword10: number;
  unknownDword11: number;
  unknownDword12: number;
  sunAxisX: number;
  sunAxisY: number;
  unknownDword15: number;
  windDirectionX: number;
  windDirectionY: number;
  windDirectionZ: number;
  wind: number;
  unknownDword20: number;
  unknownDword21: number;
  unknownDword22: number;
  unknownDword23: number;
  unknownDword24: number;
  unknownDword25: number;
  unknownDword26: number;
  unknownDword27: number;
  unknownDword28: number;
  unknownDword29: number;
  AOSize: number;
  AOGamma: number;
  AOBlackpoint: number;
  unknownDword33: number;
}

export interface SoeServer {
  on: (arg0: string, arg1: any) => void;
  start: (
    compression: any,
    crcSeed: any,
    crcLength: any,
    udpLength: any
  ) => void;
  stop: () => void;
  _sendPacket: () => void;
  sendAppData: (arg0: Client, arg1: any, arg2: undefined | any) => void;
  toggleEncryption: (arg0: Client) => void;
  setEncryption: (arg0: boolean) => void;
  deleteClient: (client: Client) => void;
}
