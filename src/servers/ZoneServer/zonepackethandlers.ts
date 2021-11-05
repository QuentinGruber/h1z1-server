import { ZoneClient } from "./classes/zoneclient";

import { ZoneServer } from "./zoneserver";

const debug = require("debug")("zonepacketHandlers");

export class zonePacketHandlers {
  ClientIsReady: any;
  ClientFinishedLoading: any;
  Security: any;
  commandRecipeStart: any;
  commandFreeInteractionNpc: any;
  collisionDamage: any;
  lobbyGameDefinitionDefinitionsRequest: any;
  playerUpdateEndCharacterAccess: any;
  KeepAlive: any;
  ClientLog: any;
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
  adminCommandSpawnVehicle: any;
  commandInteractCancel: any;
  commandStartLogoutRequest: any;
  CharacterSelectSessionRequest: any;
  profileStatsGetPlayerProfileStats: any;
  Pickup: any;
  GetRewardBuffInfo: any;
  vehicleStateData: any;
  PlayerUpdateManagedPosition: any;
  PlayerUpdateUpdatePositionClientToZone: any;
  commandPlayerSelect: any;
  constructionPlacementRequest: any;
  constructionPlacementFinalizeRequest: any;
  playerUpdateRespawn: any;
  playerUpdateFullCharacterDataRequest: any;
  constructor(packetHandlerMap: any) {
    this.ClientIsReady = packetHandlerMap["ClientIsReady"];
    this.ClientFinishedLoading = packetHandlerMap["ClientFinishedLoading"];
    this.Security = packetHandlerMap["Security"];
    this.commandRecipeStart = packetHandlerMap["Command.RecipeStart"];
    this.commandFreeInteractionNpc =
      packetHandlerMap["Command.FreeInteractionNpc"];
    this.collisionDamage = packetHandlerMap["Collision.Damage"];
    this.lobbyGameDefinitionDefinitionsRequest =
      packetHandlerMap["LobbyGameDefinition.DefinitionsRequest"];
    this.playerUpdateEndCharacterAccess =
      packetHandlerMap["PlayerUpdate.EndCharacterAccess"];
    this.KeepAlive = packetHandlerMap["KeepAlive"];
    this.ClientLog = packetHandlerMap["ClientLog"];
    this.wallOfDataUIEvent = packetHandlerMap["WallOfData.UIEvent"];
    this.SetLocale = packetHandlerMap["SetLocale"];
    this.GetContinentBattleInfo = packetHandlerMap["GetContinentBattleInfo"];
    this.chatChat = packetHandlerMap["Chat.Chat"];
    this.loadoutSelectSlot = packetHandlerMap["Loadout.SelectSlot"];
    this.ClientInitializationDetails =
      packetHandlerMap["ClientInitializationDetails"];
    this.ClientLogout = packetHandlerMap["ClientLogout"];
    this.GameTimeSync = packetHandlerMap["GameTimeSync"];
    this.Synchronization = packetHandlerMap["Synchronization"];
    this.commandExecuteCommand = packetHandlerMap["Command.ExecuteCommand"];
    this.commandSetProfile = packetHandlerMap["Command.SetProfile"];
    this.playerUpdateWeaponStance =
      packetHandlerMap["PlayerUpdate.WeaponStance"];
    this.mountDismountRequest = packetHandlerMap["Mount.DismountRequest"];
    this.commandInteractRequest = packetHandlerMap["Command.InteractRequest"];
    this.commandInteractionString =
      packetHandlerMap["Command.InteractionString"];
    this.commandSetInWater = packetHandlerMap["Command.SetInWater"];
    this.commandClearInWater = packetHandlerMap["Command.ClearInWater"];
    this.commandInteractionSelect =
      packetHandlerMap["Command.InteractionSelect"];
    this.playerUpdateVehicleCollision =
      packetHandlerMap["PlayerUpdate.VehicleCollision"];
    this.vehicleDismiss = packetHandlerMap["Vehicle.Dismiss"];
    this.vehicleSpawn = packetHandlerMap["Vehicle.Spawn"];
    this.vehicleAutoMount = packetHandlerMap["Vehicle.AutoMount"];
    this.adminCommandSpawnVehicle =
      packetHandlerMap["AdminCommand.SpawnVehicle"];
    this.commandInteractCancel = packetHandlerMap["Command.InteractCancel"];
    this.commandStartLogoutRequest =
      packetHandlerMap["Command.StartLogoutRequest"];
    this.CharacterSelectSessionRequest =
      packetHandlerMap["CharacterSelectSessionRequest"];
    this.profileStatsGetPlayerProfileStats =
      packetHandlerMap["ProfileStats.GetPlayerProfileStats"];
    this.Pickup = packetHandlerMap["Pickup"];
    this.GetRewardBuffInfo = packetHandlerMap["GetRewardBuffInfo"];
    this.vehicleStateData = packetHandlerMap["Vehicle.StateData"];
    this.PlayerUpdateManagedPosition =
      packetHandlerMap["PlayerUpdateManagedPosition"];
    this.PlayerUpdateUpdatePositionClientToZone =
      packetHandlerMap["PlayerUpdateUpdatePositionClientToZone"];
    this.commandPlayerSelect = packetHandlerMap["Command.PlayerSelect"];
    this.constructionPlacementRequest =
      packetHandlerMap["Construction.PlacementRequest"];
    this.constructionPlacementFinalizeRequest =
      packetHandlerMap["Construction.PlacementFinalizeRequest"];
    this.playerUpdateRespawn = packetHandlerMap["PlayerUpdate.Respawn"];
    this.playerUpdateFullCharacterDataRequest =
      packetHandlerMap["PlayerUpdate.FullCharacterDataRequest"];
  }
  processPacket(server: ZoneServer, client: ZoneClient, packet: any) {
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
      case "LobbyGameDefinition.DefinitionsRequest":
        this.lobbyGameDefinitionDefinitionsRequest(server, client, packet);
        break;
      case "PlayerUpdate.EndCharacterAccess":
        this.playerUpdateEndCharacterAccess(server, client, packet);
        break;
      case "KeepAlive":
        this.KeepAlive(server, client, packet);
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
      case "AdminCommand.SpawnVehicle":
        this.adminCommandSpawnVehicle(server, client, packet);
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
      case "Pickup":
        this.Pickup(server, client, packet);
        break;
      case "GetRewardBuffInfo":
        this.GetRewardBuffInfo(server, client, packet);
        break;
      case "Vehicle.StateData":
        this.vehicleStateData(server, client, packet);
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
      default:
        debug(packet);
        debug("Packet not implemented in packetHandlers");
        break;
    }
  }
}
