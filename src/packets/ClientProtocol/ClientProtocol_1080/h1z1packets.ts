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

import PacketTableBuild from "../../packettable";
import { abilitiesPackets } from "./abilities";
import { abilityPackets } from "./ability";
import { achievementPackets } from "./achievement";
import { acquaintancePackets } from "./acquaintance";
import { activityManagerPackets } from "./activityManager";
import { activityServicePackets } from "./activityService";
import { basePackets } from "./base";
import { chatPackets } from "./chat";
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
import { itemsPackets } from "./items";
import { loadoutPackets } from "./loadout";
import { lobbyPackets } from "./lobby";
import { lobbyGameDefinitionPackets } from "./lobbyGameDefinition";
import { lootPackets } from "./loot";
import { mapRegionPackets } from "./mapRegion";
import { MetaGameEventPackets } from "./metaGameEvent";
import { missionsPackets } from "./missions";
import { mountPackets } from "./mount";
import { operationPackets } from "./operation";
import { characterPackets } from "./character";
import { profileStatsPackets } from "./profileStats";
import { quickChatPackets } from "./quickChat";
import { ragdollPackets } from "./ragdoll";
import { recipePackets } from "./recipe";
import { referenceDataPackets } from "./referenceData";
import { rewardBuffsPackets } from "./rewardBuffs";
import { skillPackets } from "./skill";
import { staticFacilityInfoPackets } from "./staticFacilityInfo";
import { targetPackets } from "./target";
import { uiPackets } from "./ui";
import { vehiclePackets } from "./vehicle";
import { voicePackets } from "./voice";
import { wallOfDataPackets } from "./wallOfData";
import { wordFilterPackets } from "./wordFilter";
import { zoneSettingPackets } from "./zoneSetting";
import { clientPathPackets } from "./clientPath";
import { groupPackets } from "./group";
import { accessedCharacterPackets } from "./accessedCharacter";
import { replicationPackets } from "./replication";
import { spectatorPackets } from "./spectator";
import { h1emuPackets } from "./h1emu";
import { PacketStructures } from "types/packetStructure";

const packets: PacketStructures = [
  ...basePackets,
  ...abilitiesPackets,
  ...abilityPackets,
  ...achievementPackets,
  ...acquaintancePackets,
  ...activityManagerPackets,
  ...activityServicePackets,
  ...chatPackets,
  ...clientUpdatePackets,
  ...implantPackets,
  ...coinStorePackets,
  ...collisionPackets,
  ...combatPackets,
  ...commandPackets,
  ...constructionPackets,
  ...containerPackets,
  ...currencyPackets,
  ...definitionFilterPackets,
  ...deployablePackets,
  ...dtoPackets,
  ...effectsPackets,
  ...equipmentPackets,
  ...experiencePackets,
  ...facilityPackets,
  ...friendPackets,
  ...guildPackets,
  ...inGamePurchasePackets,
  ...itemsPackets,
  ...loadoutPackets,
  ...lobbyPackets,
  ...lobbyGameDefinitionPackets,
  ...lootPackets,
  ...mapRegionPackets,
  ...MetaGameEventPackets,
  ...missionsPackets,
  ...mountPackets,
  ...operationPackets,
  ...characterPackets,
  ...profileStatsPackets,
  ...quickChatPackets,
  ...ragdollPackets,
  ...recipePackets,
  ...referenceDataPackets,
  ...rewardBuffsPackets,
  ...skillPackets,
  ...staticFacilityInfoPackets,
  ...targetPackets,
  ...uiPackets,
  ...vehiclePackets,
  ...voicePackets,
  ...wallOfDataPackets,
  ...wordFilterPackets,
  ...zoneSettingPackets,
  ...clientPathPackets,
  ...groupPackets,
  ...accessedCharacterPackets,
  ...replicationPackets,
  ...spectatorPackets,
  ...h1emuPackets
];

const [packetTypes, packetDescriptors] = PacketTableBuild(packets);

exports.PacketTypes = packetTypes;
exports.Packets = packetDescriptors;
