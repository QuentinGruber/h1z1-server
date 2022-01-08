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

import PacketTableBuild from "../../packettable";
import { abilitiesPackets } from "./abilities";
import { abilityPackets } from "./ability";
import { achievementPackets } from "./achievement";
import { acquaintancePackets } from "./acquaintance";
import { activityManagerPackets } from "./activityManager";
import { activityServicePackets } from "./activityService";
import { basePackets } from "./base";
import { chatPackets } from "./chat";
import { clientPcDataPackets } from "./clientPcData";
import { clientUpdatePackets } from "./clientUpdate";
import { coinStorePackets } from "./coinStore";
import { collisionPackets } from "./collision";
import { combatPackets } from "./combat";
import { commandPackets } from "./command";
import { constructionPackets } from "./construction";
import { containerPackets } from "./container";
import { currencyPackets } from "./currency";
import { definitionFilterPackets } from "./definitionFilter";
import { deployablePackets } from "./deployable";
import { dtoPackets } from "./dto";
import { effectsPackets } from "./effects";
import { equipmentPackets } from "./equipment";
import { experiencePackets } from "./experience";
import { facilityPackets } from "./facility";
import { friendPackets } from "./friend";
import { guildPackets } from "./guild";
import { implantPackets } from "./implant";
import { inGamePurchasePackets } from "./inGamePurchase";
import { loadoutPackets } from "./loadout";
import { lobbyPackets } from "./lobby";
import { lobbyGameDefinitionPackets } from "./lobbyGameDefinition";
import { lootPackets } from "./loot";
import { mapRegionPackets } from "./mapRegion";
import { MetaGameEventPackets } from "./metaGameEvent";
import { missionsPackets } from "./missions";
import { mountPackets } from "./mount";
import { operationPackets } from "./operation";
import { playerUpdatePackets } from "./playerUpdate";
import { profileStatsPackets } from "./profileStats";
import { quickChatPackets } from "./quickChat";
import { ragdollPackets } from "./ragdoll";
import { recipePackets } from "./recipe";
import { referenceDataPackets } from "./referenceData";
import { rewardBuffsPackets } from "./rewardBuffs";
import { itemBaseSchema } from "./shared/schemas";
import { skillPackets } from "./skill";
import { staticFacilityInfoPackets } from "./staticFacilityInfo";
import { targetPackets } from "./target";
import { ThrustPadPackets } from "./thrustPad";
import { uiPackets } from "./ui";
import { vehiclePackets } from "./vehicle";
import { voicePackets } from "./voice";
import { wallOfDataPackets } from "./wallOfData";
import { warpgatePackets } from "./warpgate";
import { wordFilterPackets } from "./wordFilter";
import { zoneSettingPackets } from "./zoneSetting";


const packets:any = [
  ...basePackets
  ,...abilitiesPackets
  ,...abilityPackets
  ,...achievementPackets
  ,...acquaintancePackets
  ,...activityManagerPackets
  ,...activityServicePackets
  ,...chatPackets
  ,...clientPcDataPackets
  ,...clientUpdatePackets
  ,...implantPackets
  ,...coinStorePackets
  ,...collisionPackets
  ,...combatPackets
  ,...commandPackets
  ,...constructionPackets
  ,...containerPackets
  ,...currencyPackets
  ,...definitionFilterPackets
  ,...deployablePackets
  ,...dtoPackets
  ,...effectsPackets
  ,...equipmentPackets
  ,...experiencePackets
  ,...facilityPackets
  ,...friendPackets
  ,...guildPackets
  ,...inGamePurchasePackets
  ,...itemBaseSchema
  ,...loadoutPackets
  ,...lobbyPackets
  ,...lobbyGameDefinitionPackets
  ,...lootPackets
  ,...mapRegionPackets
  ,...MetaGameEventPackets
  ,...missionsPackets
  ,...mountPackets
  ,...operationPackets
  ,...playerUpdatePackets
  ,...profileStatsPackets
  ,...quickChatPackets
  ,...ragdollPackets
  ,...recipePackets
  ,...referenceDataPackets
  ,...rewardBuffsPackets
  ,...skillPackets
  ,...staticFacilityInfoPackets
  ,...targetPackets
  ,...ThrustPadPackets
  ,...uiPackets
  ,...vehiclePackets
  ,...voicePackets
  ,...wallOfDataPackets
  ,...warpgatePackets
  ,...wordFilterPackets
  ,...zoneSettingPackets];

const [packetTypes, packetDescriptors] = PacketTableBuild(packets);

exports.PacketTypes = packetTypes;
exports.Packets = packetDescriptors;
