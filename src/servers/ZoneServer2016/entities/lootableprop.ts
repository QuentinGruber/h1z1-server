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

import { StringIds, Items } from "../models/enums";

function getContainerAndTime(entity: LootableProp) {
  switch (entity.actorModelId) {
    case 9110:
      entity.containerId = Items.CONTAINER_WRECKED_VAN;
      entity.searchTime = 2500;
      entity.lootSpawner = "Wrecked Van";
      break;
    case 9105:
    case 9179:
      entity.containerId = Items.CONTAINER_WRECKED_CAR;
      entity.searchTime = 2500;
      entity.lootSpawner = "Wrecked Car";
      break;
    case 9108:
    case 9178:
      entity.containerId = Items.CONTAINER_WRECKED_TRUCK;
      entity.searchTime = 2500;
      entity.lootSpawner = "Wrecked Truck";
      break;
    case 9255:
      entity.containerId = Items.CONTAINER_WEAPONS_LOCKER;
      entity.searchTime = 1000;
      entity.lootSpawner = "Weapons Locker";
      break;
    case 9254:
      entity.containerId = Items.CONTAINER_LOCKER;
      entity.searchTime = 1000;
      entity.lootSpawner = "Locker";
      break;
    case 9038:
      entity.containerId = Items.CONTAINER_DESK;
      entity.searchTime = 1000;
      entity.lootSpawner = "Desk";
      break;
    case 9226:
    case 9225:
    case 9227:
    case 9228:
    case 9256: // glass lab cabinets
      entity.containerId = Items.CONTAINER_CABINETS;
      entity.searchTime = 700;
      entity.lootSpawner = "Cabinets";
      break;
    case 9229:
      entity.containerId = Items.CONTAINER_CABINETS_CUBE;
      entity.searchTime = 300;
      entity.lootSpawner = "Cabinets Cube";
      break;
    case 9012:
    case 9026:
    case 9028:
    case 9027:
    case 9011:
    case 9365:
    case 9363:
    case 9239:
    case 9353:
    case 9364:
    case 9362:
    case 9352:
    case 9369:
    case 9367:
    case 9366:
    case 9368:
    case 9370:
      entity.containerId = Items.CONTAINER_CABINETS_KITCHEN;
      entity.searchTime = 1000;
      entity.lootSpawner = "Cabinets Kitchen";
      break;
    case 9031:
    case 9032:
    case 9237:
      entity.containerId = Items.CONTAINER_CABINETS_BATHROOM;
      entity.searchTime = 1000;
      entity.lootSpawner = "Cabinets Bathroom";
      break;
    case 9074:
      entity.containerId = Items.CONTAINER_TOOL_CABINETS;
      entity.searchTime = 1000;
      entity.lootSpawner = "Tool Cabinet";
      break;
    case 9037:
      entity.containerId = Items.CONTAINER_DUMPSTER;
      entity.searchTime = 1000;
      entity.lootSpawner = "Dumpster";
      break;
    case 9034:
      entity.containerId = Items.CONTAINER_FILE_CABINET;
      entity.searchTime = 200;
      entity.lootSpawner = "File Cabinet";
      break;
    case 9030:
      entity.containerId = Items.CONTAINER_FRIDGE;
      entity.searchTime = 1000;
      entity.lootSpawner = "Fridge";
      break;
    case 9149:
    case 9150:
      entity.containerId = Items.CONTAINER_OTTOMAN;
      entity.searchTime = 300;
      entity.lootSpawner = "Ottoman";
      break;
    case 9005:
    case 9125:
      entity.containerId = Items.CONTAINER_DRESSER;
      entity.searchTime = 700;
      entity.lootSpawner = "Dresser";
      break;
    case 9124:
    case 9006:
      entity.containerId = Items.CONTAINER_ARMOIRE;
      entity.searchTime = 700;
      entity.lootSpawner = "Armoire";
      break;
    case 9007:
      entity.containerId = Items.CONTAINER_GARBAGE_CAN;
      entity.searchTime = 1000;
      entity.lootSpawner = "Garbage Can";
      break;
    case 9552:
      entity.containerId = Items.CONTAINER_DRUG_CABINET;
      entity.searchTime = 1000;
      entity.lootSpawner = "Drug Cabinets";
      break;
    case 9563:
      entity.containerId = Items.CONTAINER_MEDICAL_STATION;
      entity.searchTime = 1000;
      entity.lootSpawner = "Medical Station";
      break;
    case 9551:
    case 9553:
      entity.containerId = Items.CONTAINER_HOSPITAL_DESK;
      entity.searchTime = 1000;
      entity.lootSpawner = "Hospital Desk";
      break;
    case 9556:
      entity.containerId = Items.CONTAINER_GROSSING_STATION;
      entity.searchTime = 1000;
      entity.lootSpawner = "Grossing Station";
      break;
    case 9555:
      entity.containerId = Items.CONTAINER_HOSPITAL_REFRIGERATOR;
      entity.searchTime = 1000;
      entity.lootSpawner = "Hospital Refrigerator";
      break;
    case 9554:
      entity.containerId = Items.CONTAINER_HOSPITAL_CABINET;
      entity.searchTime = 1000;
      entity.lootSpawner = "Hospital Cabinets";
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
  positionUpdateType = 0;
  containerId: number = Items.CONTAINER_STORAGE;
  lootSpawner: string = "Wrecked Car";
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
        server.getItemDefinition(this._containers["31"].itemDefinitionId)
          .NAME_ID,
        this.searchTime,
        () => {
          super.OnPlayerSelect(server, client);
          client.searchedProps.push(this);
        }
      );
    } else {
      super.OnPlayerSelect(server, client);
    }
  }
  OnInteractionString(server: ZoneServer2016, client: ZoneClient2016) {
    if (client.searchedProps.includes(this)) {
      server.sendData(client, "Command.InteractionString", {
        guid: this.characterId,
        stringId: StringIds.OPEN
      });
    } else {
      server.sendData(client, "Command.InteractionString", {
        guid: this.characterId,
        stringId: StringIds.SEARCH
      });
    }
  }

  destroy(server: ZoneServer2016) {
    return server.deleteEntity(this.characterId, server._lootableProps);
  }
}
