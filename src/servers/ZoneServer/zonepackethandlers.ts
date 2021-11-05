import { ZoneClient } from "./classes/zoneclient";

import { ZoneServer } from "./zoneserver";

import packetHandlerMap from "./zonepackethandlersMap";

const debug = require("debug")("zonepacketHandlers");

const ClientIsReady = packetHandlerMap["ClientIsReady"];
const ClientFinishedLoading = packetHandlerMap["ClientFinishedLoading"];
const Security = packetHandlerMap["Security"];
const commandRecipeStart = packetHandlerMap["Command.RecipeStart"];
const commandFreeInteractionNpc =
  packetHandlerMap["Command.FreeInteractionNpc"];
const collisionDamage = packetHandlerMap["Collision.Damage"];
const lobbyGameDefinitionDefinitionsRequest =
  packetHandlerMap["LobbyGameDefinition.DefinitionsRequest"];
const playerUpdateEndCharacterAccess =
  packetHandlerMap["PlayerUpdate.EndCharacterAccess"];
const KeepAlive = packetHandlerMap["KeepAlive"];
const ClientLog = packetHandlerMap["ClientLog"];
const wallOfDataUIEvent = packetHandlerMap["WallOfData.UIEvent"];
const SetLocale = packetHandlerMap["SetLocale"];
const GetContinentBattleInfo = packetHandlerMap["GetContinentBattleInfo"];
const chatChat = packetHandlerMap["Chat.Chat"];
const loadoutSelectSlot = packetHandlerMap["Loadout.SelectSlot"];
const ClientInitializationDetails =
  packetHandlerMap["ClientInitializationDetails"];
const ClientLogout = packetHandlerMap["ClientLogout"];
const GameTimeSync = packetHandlerMap["GameTimeSync"];
const Synchronization = packetHandlerMap["Synchronization"];
const commandExecuteCommand = packetHandlerMap["Command.ExecuteCommand"];
const commandSetProfile = packetHandlerMap["Command.SetProfile"];
const playerUpdateWeaponStance = packetHandlerMap["PlayerUpdate.WeaponStance"];
const mountDismountRequest = packetHandlerMap["Mount.DismountRequest"];
const commandInteractRequest = packetHandlerMap["Command.InteractRequest"];
const commandInteractionString = packetHandlerMap["Command.InteractionString"];
const commandSetInWater = packetHandlerMap["Command.SetInWater"];
const commandClearInWater = packetHandlerMap["Command.ClearInWater"];
const commandInteractionSelect = packetHandlerMap["Command.InteractionSelect"];
const playerUpdateVehicleCollision =
  packetHandlerMap["PlayerUpdate.VehicleCollision"];
const vehicleDismiss = packetHandlerMap["Vehicle.Dismiss"];
const vehicleSpawn = packetHandlerMap["Vehicle.Spawn"];
const vehicleAutoMount = packetHandlerMap["Vehicle.AutoMount"];
const adminCommandSpawnVehicle = packetHandlerMap["AdminCommand.SpawnVehicle"];
const commandInteractCancel = packetHandlerMap["Command.InteractCancel"];
const commandStartLogoutRequest =
  packetHandlerMap["Command.StartLogoutRequest"];
const CharacterSelectSessionRequest =
  packetHandlerMap["CharacterSelectSessionRequest"];
const profileStatsGetPlayerProfileStats =
  packetHandlerMap["ProfileStats.GetPlayerProfileStats"];
const Pickup = packetHandlerMap["Pickup"];
const GetRewardBuffInfo = packetHandlerMap["GetRewardBuffInfo"];
const vehicleStateData = packetHandlerMap["Vehicle.StateData"];
const PlayerUpdateManagedPosition =
  packetHandlerMap["PlayerUpdateManagedPosition"];
const PlayerUpdateUpdatePositionClientToZone =
  packetHandlerMap["PlayerUpdateUpdatePositionClientToZone"];
const commandPlayerSelect = packetHandlerMap["Command.PlayerSelect"];
const constructionPlacementRequest =
  packetHandlerMap["Construction.PlacementRequest"];
const constructionPlacementFinalizeRequest =
  packetHandlerMap["Construction.PlacementFinalizeRequest"];
const playerUpdateRespawn = packetHandlerMap["PlayerUpdate.Respawn"];
const playerUpdateFullCharacterDataRequest =
  packetHandlerMap["PlayerUpdate.FullCharacterDataRequest"];
export function packetHandlerSwitch(
  server: ZoneServer,
  client: ZoneClient,
  packet: any
) {
  switch (packet.name) {
    case "ClientIsReady":
      ClientIsReady(server, client, packet);
      break;
    case "ClientFinishedLoading":
      ClientFinishedLoading(server, client, packet);
      break;
    case "Security":
      Security(server, client, packet);
      break;
    case "Command.RecipeStart":
      commandRecipeStart(server, client, packet);
      break;
    case "Command.FreeInteractionNpc":
      commandFreeInteractionNpc(server, client, packet);
      break;
    case "Collision.Damage":
      collisionDamage(server, client, packet);
      break;
    case "LobbyGameDefinition.DefinitionsRequest":
      lobbyGameDefinitionDefinitionsRequest(server, client, packet);
      break;
    case "PlayerUpdate.EndCharacterAccess":
      playerUpdateEndCharacterAccess(server, client, packet);
      break;
    case "KeepAlive":
      KeepAlive(server, client, packet);
      break;
    case "ClientLog":
      ClientLog(server, client, packet);
      break;
    case "WallOfData.UIEvent":
      wallOfDataUIEvent(server, client, packet);
      break;
    case "SetLocale":
      SetLocale(server, client, packet);
      break;
    case "GetContinentBattleInfo":
      GetContinentBattleInfo(server, client, packet);
      break;
    case "Chat.Chat":
      chatChat(server, client, packet);
      break;
    case "Loadout.SelectSlot":
      loadoutSelectSlot(server, client, packet);
      break;
    case "ClientInitializationDetails":
      ClientInitializationDetails(server, client, packet);
      break;
    case "ClientLogout":
      ClientLogout(server, client, packet);
      break;
    case "GameTimeSync":
      GameTimeSync(server, client, packet);
      break;
    case "Synchronization":
      Synchronization(server, client, packet);
      break;
    case "Command.ExecuteCommand":
      commandExecuteCommand(server, client, packet);
      break;
    case "Command.SetProfile":
      commandSetProfile(server, client, packet);
      break;
    case "PlayerUpdate.WeaponStance":
      playerUpdateWeaponStance(server, client, packet);
      break;
    case "Mount.DismountRequest":
      mountDismountRequest(server, client, packet);
      break;
    case "Command.InteractRequest":
      commandInteractRequest(server, client, packet);
      break;
    case "Command.InteractionString":
      commandInteractionString(server, client, packet);
      break;
    case "Command.SetInWater":
      commandSetInWater(server, client, packet);
      break;
    case "Command.ClearInWater":
      commandClearInWater(server, client, packet);
      break;
    case "Command.InteractionSelect":
      commandInteractionSelect(server, client, packet);
      break;
    case "PlayerUpdate.VehicleCollision":
      playerUpdateVehicleCollision(server, client, packet);
      break;
    case "Vehicle.Dismiss":
      vehicleDismiss(server, client, packet);
      break;
    case "Vehicle.Spawn":
      vehicleSpawn(server, client, packet);
      break;
    case "Vehicle.AutoMount":
      vehicleAutoMount(server, client, packet);
      break;
    case "AdminCommand.SpawnVehicle":
      adminCommandSpawnVehicle(server, client, packet);
      break;
    case "Command.InteractCancel":
      commandInteractCancel(server, client, packet);
      break;
    case "Command.StartLogoutRequest":
      commandStartLogoutRequest(server, client, packet);
      break;
    case "CharacterSelectSessionRequest":
      CharacterSelectSessionRequest(server, client, packet);
      break;
    case "ProfileStats.GetPlayerProfileStats":
      profileStatsGetPlayerProfileStats(server, client, packet);
      break;
    case "Pickup":
      Pickup(server, client, packet);
      break;
    case "GetRewardBuffInfo":
      GetRewardBuffInfo(server, client, packet);
      break;
    case "Vehicle.StateData":
      vehicleStateData(server, client, packet);
      break;
    case "PlayerUpdateManagedPosition":
      PlayerUpdateManagedPosition(server, client, packet);
      break;
    case "PlayerUpdateUpdatePositionClientToZone":
      PlayerUpdateUpdatePositionClientToZone(server, client, packet);
      break;
    case "Command.PlayerSelect":
      commandPlayerSelect(server, client, packet);
      break;
    case "Construction.PlacementRequest":
      constructionPlacementRequest(server, client, packet);
      break;
    case "Construction.PlacementFinalizeRequest":
      constructionPlacementFinalizeRequest(server, client, packet);
      break;
    case "PlayerUpdate.Respawn":
      playerUpdateRespawn(server, client, packet);
      break;
    case "PlayerUpdate.FullCharacterDataRequest":
      playerUpdateFullCharacterDataRequest(server, client, packet);
      break;
    default:
      debug(packet);
      debug("Packet not implemented in packetHandlers");
      break;
  }
}
exports.packetHandlerSwitch = packetHandlerSwitch;
