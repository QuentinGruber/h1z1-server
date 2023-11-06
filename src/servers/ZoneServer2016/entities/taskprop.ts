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

import { Items, ResourceIds, StringIds } from "../models/enums";
import { ZoneServer2016 } from "../zoneserver";
import { BaseLightweightCharacter } from "./baselightweightcharacter";
import { ZoneClient2016 } from "../classes/zoneclient";
import { randomIntFromInterval } from "../../../utils/utils";

export class TaskProp extends BaseLightweightCharacter {
  detonated = false;
  actorModel: string;
  spawnerId: number;
  requiredItemId: number = 0;
  rewardItems: number[] = [];
  constructor(
    characterId: string,
    transientId: number,
    actorModelId: number,
    position: Float32Array,
    rotation: Float32Array,
    server: ZoneServer2016,
    scale: Float32Array,
    zoneId: number,
    renderDistance: number,
    actorModel: string
  ) {
    super(characterId, transientId, actorModelId, position, rotation, server);
    this.actorModel = actorModel;
    this.spawnerId = zoneId;
    this.scale = scale;
    this.npcRenderDistance = renderDistance;
    this.getTaskPropData();
    this.useSimpleStruct = true;
  }

  getRewardItemCount(itemId: number): number {
    switch (itemId) {
      case Items.AMMO_45:
      case Items.AMMO_9MM:
      case Items.AMMO_12GA:
        return randomIntFromInterval(6, 8);
      case Items.FIRST_AID:
      case Items.ANTIBIOTICS:
        return 3;
    }
    return 1;
  }

  getTaskPropData(): void {
    switch (this.actorModel) {
      case "Task_Hospital_Researcher_Locker.adr":
        this.nameId = 12781;
        this.requiredItemId = 2645;
        this.rewardItems = [
          Items.AMMO_45,
          Items.AMMO_9MM,
          Items.AMMO_12GA,
          Items.ANTIBIOTICS,
          Items.CAP_SCRUBS_BLUE,
          Items.PANTS_SCRUBS_BLUE,
          Items.SHIRT_SCRUBS_BLUE,
          Items.SURGEON_MASK_AQUA,
          Items.FIRST_AID
        ];
        break;
      case "Task_Hospital_Researcher_Locker02.adr":
        this.nameId = 12785;
        this.requiredItemId = 2646;
        this.rewardItems = [
          Items.AMMO_45,
          Items.AMMO_9MM,
          Items.AMMO_12GA,
          Items.ANTIBIOTICS,
          Items.CAP_SCRUBS_BLUE,
          Items.PANTS_SCRUBS_BLUE,
          Items.SHIRT_SCRUBS_BLUE,
          Items.SURGEON_MASK_AQUA,
          Items.FIRST_AID
        ];
        break;
      case "Task_Hospital_Researcher_Locker03.adr":
        this.nameId = 12787;
        this.requiredItemId = 2647;
        this.rewardItems = [
          Items.AMMO_45,
          Items.AMMO_9MM,
          Items.AMMO_12GA,
          Items.ANTIBIOTICS,
          Items.CAP_SCRUBS_BLUE,
          Items.PANTS_SCRUBS_BLUE,
          Items.SHIRT_SCRUBS_BLUE,
          Items.SURGEON_MASK_AQUA,
          Items.FIRST_AID
        ];
        break;
      case "Task_Hospital_Researcher_Locker04.adr":
        this.nameId = 12790;
        this.requiredItemId = 2648;
        this.rewardItems = [
          Items.AMMO_45,
          Items.AMMO_9MM,
          Items.AMMO_12GA,
          Items.ANTIBIOTICS,
          Items.CAP_SCRUBS_BLUE,
          Items.PANTS_SCRUBS_BLUE,
          Items.SHIRT_SCRUBS_BLUE,
          Items.SURGEON_MASK_AQUA,
          Items.FIRST_AID
        ];
        break;
    }
  }

  destroy(server: ZoneServer2016): boolean {
    return server.deleteEntity(this.characterId, server._taskProps);
  }

  OnInteractionString(server: ZoneServer2016, client: ZoneClient2016) {
    switch (this.actorModel) {
      case "Common_Props_Bedroom_Mattress01.adr":
      case "Common_Props_MilitaryBase_BunkBed.adr":
      case "Common_Props_Bedroom_BedCombined01.adr":
      case "Common_Props_Bedroom_BedCombined02.adr":
      case "Common_Props_Bedroom_BedCombined03.adr":
        if (client.character._resources[ResourceIds.ENDURANCE] <= 3501) {
          server.sendData(client, "Command.InteractionString", {
            guid: this.characterId,
            stringId: StringIds.REST
          });
        }
        break;

      default:
        server.sendData(client, "Command.InteractionString", {
          guid: this.characterId,
          stringId: StringIds.OPEN
        });
        break;
    }

  }
  /* eslint-disable @typescript-eslint/no-unused-vars */
  OnPlayerSelect(
    server: ZoneServer2016,
    client: ZoneClient2016,
    isInstant?: boolean
    /* eslint-enable @typescript-eslint/no-unused-vars */
  ) {
    switch (this.actorModel) {
      case "Common_Props_Bedroom_Mattress01.adr":
      case "Common_Props_MilitaryBase_BunkBed.adr":
      case "Common_Props_Bedroom_BedCombined01.adr":
      case "Common_Props_Bedroom_BedCombined02.adr":
      case "Common_Props_Bedroom_BedCombined03.adr":
        if (client.character._resources[ResourceIds.ENDURANCE] <= 3501) {
          server.utilizeHudTimer(client, StringIds.RESTING, 30000, 0, () => {
            server.sleep(client);
          });
        }
        break;
      default:
        if (!this.requiredItemId) return;
        // return empty ones, need more info and time to get other quests working
        const removedItem = client.character.getItemById(this.requiredItemId);
        if (!removedItem) {
          server.sendAlert(client, "This locker is locked.");
          return;
        }
        const itemsPassed: { itemDefinitionId: number; count: number }[] = [];
        const itemCount = randomIntFromInterval(2, 4);
        for (let x = 0; x < itemCount; x++) {
          const item =
            this.rewardItems[randomIntFromInterval(0, this.rewardItems.length - 1)];
          itemsPassed.push({
            itemDefinitionId: item,
            count: this.getRewardItemCount(item)
          });
        }
        server.taskOption(client, 1000, this.nameId, removedItem, itemsPassed);
        break;
    }
  }
}
