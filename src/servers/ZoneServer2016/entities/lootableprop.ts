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
import { BaseLootableEntity } from "./baselootableentity";
import { ZoneServer2016 } from "../zoneserver";
import { ZoneClient2016 } from "../classes/zoneclient";

import { StringIds, Items, ModelIds } from "../models/enums";
import { DamageInfo } from "types/zoneserver";
import { eul2quat, randomIntFromInterval } from "../../../utils/utils";
import { AddSimpleNpc } from "types/zone2016packets";

function getContainerAndTime(entity: LootableProp) {
  switch (entity.actorModelId) {
    case ModelIds.WRECKED_VAN:
      entity.containerId = Items.CONTAINER_WRECKED_VAN;
      entity.searchTime = 1500;
      entity.lootSpawner = "Wrecked Van";
      break;
    case ModelIds.WRECKED_CAR:
    case ModelIds.WRECKED_CAR_OD_01:
      entity.containerId = Items.CONTAINER_WRECKED_CAR;
      entity.searchTime = 1500;
      entity.lootSpawner = "Wrecked Car";
      break;
    case ModelIds.WRECKED_TRUCK_01:
    case ModelIds.WRECKED_TRUCK_OD_01:
      entity.containerId = Items.CONTAINER_WRECKED_TRUCK;
      entity.searchTime = 1500;
      entity.lootSpawner = "Wrecked Truck";
      break;
    case ModelIds.LOCKERS_LOCKER_WEAPONS:
      entity.containerId = Items.CONTAINER_WEAPONS_LOCKER;
      entity.searchTime = 500;
      entity.lootSpawner = "Weapons Locker";
      break;
    case ModelIds.LOCKERS_LOCKER_POLICE:
      entity.containerId = Items.CONTAINER_LOCKER;
      entity.searchTime = 500;
      entity.lootSpawner = "Locker";
      break;
    case ModelIds.OFFICE_CABINETS_02:
    case ModelIds.DESK:
    case ModelIds.Commercial_Props_Desks01:
      entity.containerId = Items.CONTAINER_DESK;
      entity.searchTime = 500;
      entity.lootSpawner = "Desk";
      break;
    case ModelIds.Residential_Props_Bedroom_SideTableLarge:
    case ModelIds.Residential_Props_Bedroom_SideTableSmall:
      entity.containerId = Items.CONTAINER_SIDE_TABLE;
      entity.searchTime = 1000;
      entity.lootSpawner = "Desk";
      break;
    case ModelIds.LAB_GLASS_CABINET:
      entity.containerId = Items.CONTAINER_CABINETS;
      entity.searchTime = 700;
      entity.lootSpawner = "Cabinets";
      break;
    case ModelIds.OFFICE_CUBE_CABINET:
      entity.containerId = Items.CONTAINER_CABINETS_CUBE;
      entity.searchTime = 500;
      entity.lootSpawner = "Cabinets Cube";
      break;
    case ModelIds.Cabins_Props_Stoves_Square01:
    case ModelIds.Cabins_Props_Stoves_Round01:
      entity.containerId = Items.CONTAINER_FURNACE;
      entity.searchTime = 300;
      entity.lootSpawner = "Stove";
      break;
    case ModelIds.CABINETS_KITCHEN_02:
    case ModelIds.CABINETS_KITCHEN_03:
    case ModelIds.CABINETS_KITCHEN_05:
    case ModelIds.CABINETS_KITCHEN_04:
    case ModelIds.CABINETS_KITCHEN_01:
    case ModelIds.CABINET_SET_06:
    case ModelIds.CABINET_SET_04:
    case ModelIds.CABINETS_KITCHEN_06:
    case ModelIds.CABINET_SET_02:
    case ModelIds.CABINET_SET_05:
    case ModelIds.CABINET_SET_03:
    case ModelIds.CABINET_SET_01:
    case ModelIds.CABINET_SET_10:
    case ModelIds.CABINET_SET_08:
    case ModelIds.CABINET_SET_07:
    case ModelIds.CABINET_SET_09:
    case ModelIds.CABINET_SET_11:
    case ModelIds.Residential_Props_Kitchen_Cabinet01:
    case ModelIds.Cabins_Props_Counters_Kitchen01:
      entity.containerId = Items.CONTAINER_CABINETS_KITCHEN;
      entity.searchTime = 1000;
      entity.lootSpawner = "Cabinets Kitchen";
      break;
    case ModelIds.CABINETS_BATHROOM_01:
    case ModelIds.CABINETS_BATHROOM_SINK:
    case ModelIds.CABINETS_BATHROOM_02:
      entity.containerId = Items.CONTAINER_CABINETS_BATHROOM;
      entity.searchTime = 500;
      entity.lootSpawner = "Cabinets Bathroom";
      break;
    case ModelIds.BLUE_TOOL_CABINET:
    case ModelIds.RED_SILVER_TOOL_CABINET:
    case ModelIds.TOOL_CABINET_01:
    case ModelIds.Industrial_Props_Cabinets_ToolCabinet01:
    case ModelIds.Industrial_Props_Cabinets_ToolCabinet02:
    case ModelIds.Industrial_Props_Cabinets_ToolCabinet03:
    case ModelIds.TOOL_CABINET_02:
      entity.containerId = Items.CONTAINER_TOOL_CABINETS;
      entity.searchTime = 500;
      entity.lootSpawner = "Tool Cabinet";
      break;
    case ModelIds.DUMPSTER:
      entity.containerId = Items.CONTAINER_DUMPSTER;
      entity.searchTime = 500;
      entity.lootSpawner = "Dumpster";
      break;
    case ModelIds.OFFICE_CABINETS_01:
    case ModelIds.OFFICE_CABINETS_03:
    case ModelIds.OFFICE_FILING_CABINET:
    case ModelIds.FILE_CABINETS:
    case ModelIds.Office_Props_FilingCabinets:
      entity.containerId = Items.CONTAINER_FILE_CABINET;
      entity.searchTime = 500;
      entity.lootSpawner = "File Cabinet";
      break;
    case ModelIds.KITCHEN_FRIDGE:
    case ModelIds.Residential_Props_Kitchen_Fridge:
    case ModelIds.Restaurant_Props_CommercialFridge_01:
      entity.containerId = Items.CONTAINER_FRIDGE;
      entity.searchTime = 500;
      entity.lootSpawner = "Fridge";
      break;
    case ModelIds.WASHER:
      entity.containerId = Items.CONTAINER_WASHING_MACHINE;
      entity.searchTime = 500;
      entity.lootSpawner = "Washer";
      break;
    case ModelIds.DRYER:
      entity.containerId = Items.CONTAINER_DRYER;
      entity.searchTime = 500;
      entity.lootSpawner = "Dryer";
      break;
    case ModelIds.OTTOMAN_01:
    case ModelIds.OTTOMAN_02:
    case ModelIds.Residential_Props_Seating_Ottoman01:
      entity.containerId = Items.CONTAINER_OTTOMAN;
      entity.searchTime = 500;
      entity.lootSpawner = "Ottoman";
      break;
    case ModelIds.Residential_Props_Suitcase:
      entity.containerId = Items.CONTAINER_SUITCASE;
      entity.searchTime = 300;
      entity.lootSpawner = "Ottoman";
      break;
    case ModelIds.Industrial_Props_MetalCabinet:
      entity.containerId = Items.CONTAINER_METAL_CABINET;
      entity.searchTime = 1000;
      entity.lootSpawner = "Metal Cabinet";
      break;
    case ModelIds.Farm_Props_CordsofWood:
      entity.containerId = Items.CONTAINER_CORDS_OF_WOOD;
      entity.searchTime = 1000;
      entity.lootSpawner = "Wood";
      break;
    case ModelIds.Residential_Props_DuffelBag:
      entity.nameId = StringIds.DUFFEL_BAG_;
      entity.containerId = Items.CONTAINER_DUFFEL_BAG;
      entity.searchTime = 1000;
      entity.lootSpawner = "Duffel Bag";
      break;
    case ModelIds.DRESSER_01:
    case ModelIds.DRESSER_02:
    case ModelIds.Residential_Props_LivingRoom_EntertainmentCenter:
    case ModelIds.Residential_Props_Bedroom_Dresser:
      entity.containerId = Items.CONTAINER_DRESSER;
      entity.searchTime = 500;
      entity.lootSpawner = "Dresser";
      break;
    case ModelIds.ARMOIRE_02:
    case ModelIds.ARMOIRE_01:
    case ModelIds.Residential_Props_Bedroom_Armoire:
      entity.containerId = Items.CONTAINER_ARMOIRE;
      entity.searchTime = 500;
      entity.lootSpawner = "Armoire";
      break;
    case ModelIds.Commercial_Props_ModularServiceCounter:
      entity.containerId = Items.CONTAINER_COUNTER;
      entity.searchTime = 700;
      entity.lootSpawner = "Desk";
      break;
    case ModelIds.GARBAGE_CAN_01:
    case ModelIds.City_Props_GarbageCan01:
    case ModelIds.City_Props_GarbageCan02:
    case ModelIds.City_Props_Dumpster:
      entity.containerId = Items.CONTAINER_GARBAGE_CAN;
      entity.searchTime = 500;
      entity.lootSpawner = "Garbage Can";
      break;
    case ModelIds.Commercial_Props_GasPump:
      entity.containerId = Items.CONTAINER_GAS_PUMP;
      entity.searchTime = 1000;
      entity.lootSpawner = "Gas Pump";
      entity.nameId = StringIds.GAS_PUMP_;
      break;
    case ModelIds.Commercial_Props_Cooler:
      entity.containerId = Items.CONTAINER_COOLER;
      entity.searchTime = 1000;
      entity.lootSpawner = "Cooler";
      break;
    case ModelIds.Commercial_Props_SodaMachine:
      entity.containerId = Items.CONTAINER_SODA_MACHINE;
      entity.searchTime = 1000;
      entity.lootSpawner = "Cooler";
      entity.nameId = StringIds.SODA_MACHINE_;
      break;
    case ModelIds.HOSPITAL_DRUG_CABNINET:
    case ModelIds.Residential_Props_MedicineCabinet:
      entity.containerId = Items.CONTAINER_DRUG_CABINET;
      entity.searchTime = 1000;
      entity.lootSpawner = "Drug Cabinets";
      break;
    case ModelIds.Hospital_Props_AmbulanceWrecked:
      entity.containerId = Items.CONTAINER_AMBULANCE;
      entity.searchTime = 2000;
      entity.lootSpawner = "Ambulance";
      break;
    case ModelIds.HOSPITAL_LAB_WORKBENCH:
      entity.containerId = Items.CONTAINER_MEDICAL_STATION;
      entity.searchTime = 0;
      entity.lootSpawner = "Medical Station";
      break;
    case ModelIds.HOSPITAL_DESK:
    case ModelIds.HOSPITAL_LAB_COUNTERTOP:
      entity.containerId = Items.CONTAINER_HOSPITAL_DESK;
      entity.searchTime = 1000;
      entity.lootSpawner = "Hospital Desk";
      break;
    case ModelIds.HOSPITAL_GROSSING_STATION:
      entity.containerId = Items.CONTAINER_GROSSING_STATION;
      entity.searchTime = 1000;
      entity.lootSpawner = "Grossing Station";
      break;
    case ModelIds.HOSPITAL_REFRIGERATOR:
      entity.containerId = Items.CONTAINER_HOSPITAL_REFRIGERATOR;
      entity.searchTime = 1000;
      entity.lootSpawner = "Hospital Refrigerator";
      break;
    case ModelIds.HOSPITAL_SINK_COUNTERTOP:
      entity.containerId = Items.CONTAINER_HOSPITAL_CABINET;
      entity.searchTime = 1000;
      entity.lootSpawner = "Hospital Cabinets";
      break;
    case ModelIds.TREASURE_CHEST:
      entity.containerId = Items.CONTAINER_LOOT_CACHE;
      entity.nameId = Items.CONTAINER_LOOT_CACHE;
      entity.searchTime = 1000;
    case ModelIds.METAL_STORAGE_CHEST:
      entity.containerId = Items.CONTAINER_STORAGE;
      entity.searchTime = 1000;
      entity.lootSpawner = "Cabinets";
      break;
    case ModelIds.Residential_Props_WasherDryerCombo:
      entity.containerId = Items.CONTAINER_DRYER;
      entity.searchTime = 1000;
      entity.lootSpawner = "Armoire";
      break;
    case ModelIds.FURNACE:
      entity.containerId = Items.CONTAINER_FURNACE;
      entity.searchTime = 0;
      break;
    case ModelIds.CAMPFIRE:
      entity.containerId = Items.CONTAINER_CAMPFIRE;
      entity.searchTime = 0;
      break;
    case ModelIds.BARBEQUE:
      entity.containerId = Items.BARBEQUE;
      entity.searchTime = 0;
      break;
    default:
      entity.containerId = Items.CONTAINER_STORAGE;
      entity.searchTime = 500;
      return;
  }
}

export class LootableProp extends BaseLootableEntity {
  spawnerId: number;
  npcRenderDistance = 150;
  containerId: number = Items.CONTAINER_STORAGE;

  /** Determines the loot table to distribute to the LootableProp */
  lootSpawner: string = "Wrecked Car";

  /** Time (milliseconds) it takes before the container loads for the player */
  searchTime: number = 1000;
  constructor(
    characterId: string,
    transientId: number,
    actorModelId: number,
    position: Float32Array,
    rotation: Float32Array,
    server: ZoneServer2016,
    scale: Float32Array,
    spawnerId: number,
    renderDistance: number
  ) {
    super(characterId, transientId, actorModelId, position, rotation, server);
    this.scale = new Float32Array(scale);
    this.spawnerId = spawnerId;
    this.npcRenderDistance = renderDistance;
    this.loadoutId = 5;
    getContainerAndTime(this);
    switch (this.lootSpawner) {
      case "Wrecked Van":
      case "Wrecked Car":
      case "Wrecked Truck":
        this.useSimpleStruct = false;
        this.state.rotation = eul2quat(
          new Float32Array([
            this.state.rotation[1],
            this.state.rotation[0],
            this.state.rotation[2],
            0
          ])
        );
        break;
    }
  }

  pGetSimpleNpc(): AddSimpleNpc {
    return {
      characterId: this.characterId,
      transientId: this.transientId,
      position: this.state.position,
      rotation: this.state.rotation,
      modelId: this.actorModelId,
      scale: this.scale,
      health: (this.health / this.maxHealth) * 100
      //terrainObjectId: this.spawnerId
    };
  }

  /* eslint-disable @typescript-eslint/no-unused-vars */
  OnPlayerSelect(
    server: ZoneServer2016,
    client: ZoneClient2016,
    isInstant?: boolean
    /* eslint-enable @typescript-eslint/no-unused-vars */
  ) {
    if (!client.searchedProps.includes(this)) {
      server.utilizeHudTimer(
        client,
        server.getItemDefinition(this.getContainer()?.itemDefinitionId)
          ?.NAME_ID ?? 0,
        this.searchTime,
        0,
        () => {
          super.OnPlayerSelect(server, client);
          client.searchedProps.push(this);
          server.lootCrateWithChance(client, 5);
        }
      );
    } else {
      super.OnPlayerSelect(server, client);
    }
  }
  OnInteractionString(server: ZoneServer2016, client: ZoneClient2016) {
    if (this.actorModelId == ModelIds.HOSPITAL_LAB_WORKBENCH) {
      server.sendData(client, "Command.InteractionString", {
        guid: this.characterId,
        stringId: StringIds.USE_TARGET
      });
      return;
    }
    if (client.searchedProps.includes(this)) {
      server.sendData(client, "Command.InteractionString", {
        guid: this.characterId,
        stringId: StringIds.OPEN
      });
    } else {
      switch (this.actorModelId) {
        case ModelIds.CABINET_SET_05:
          server.sendData(client, "Command.InteractionString", {
            guid: this.characterId,
            stringId: StringIds.SEARCH_ALL_CABINETS
          });
          break;
        default:
          server.sendData(client, "Command.InteractionString", {
            guid: this.characterId,
            stringId: StringIds.SEARCH
          });
          return;
      }
    }
  }

  destroy(server: ZoneServer2016): boolean {
    return server.deleteEntity(this.characterId, server._lootableProps);
  }

  OnMeleeHit(server: ZoneServer2016, damageInfo: DamageInfo) {
    switch (this.lootSpawner) {
      case "Wrecked Van":
      case "Wrecked Car":
      case "Wrecked Truck":
        break;
      default:
        return;
    }

    const client = server.getClientByCharId(damageInfo.entity);
    const weapon = client?.character.getEquippedWeapon();

    if (!client || !weapon || weapon.itemDefinitionId != Items.WEAPON_CROWBAR) {
      return;
    }

    if (randomIntFromInterval(0, 100) <= server.crowbarHitRewardChance) {
      client.character.lootItem(server, server.generateItem(Items.METAL_SCRAP));
    }

    server.damageItem(client.character, weapon, server.crowbarHitDamage);
  }
}
