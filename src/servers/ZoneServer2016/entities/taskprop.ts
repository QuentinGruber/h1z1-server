// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2025 H1emu community
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
  /** ModelId of the TaskProp */
  actorModel: string;
  spawnerId: number;

  /** Id of the required item for the corresponding task */
  requiredItemId: number = 0;

  /** Array of items to be rewarded upon  */
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
      case Items.AMMO_223:
        return randomIntFromInterval(6, 8);
      case Items.FIRST_AID:
      case Items.ANTIBIOTICS:
        return 3;
    }
    return 1;
  }

  getRequiredItemCount(itemId: number): number {
    switch (itemId) {
      case Items.BRAIN_TREATED:
        return 10;
    }
    return 1;
  }

  getTaskPropData(): void {
    switch (this.actorModel) {
      case "Task_Patient_Safe_FileCabinet01.adr":
        this.nameId = StringIds.LOCKED_CABINET;
        this.requiredItemId = Items.WEICHS_WALLET;
        this.rewardItems = [Items.AMMO_9MM, Items.WEAPON_M9];
        break;
      case "Task_Patient_Hospital_Props_Desk01.adr":
        this.nameId = StringIds.MORGUE_DESK;
        this.requiredItemId = Items.WEICHS_REPORT;
        this.rewardItems = [Items.WEICHS_WALLET];
        break;
      case "Task_Patient_Quarantine_FileCabinet01.adr":
        this.nameId = StringIds.EXAMINATION_CABINET;
        this.requiredItemId = Items.KLAVISK_NOTE;
        this.rewardItems = [Items.WEICHS_REPORT];
        break;
      case "Task_Patient_Records_FileCabinet01.adr":
        this.nameId = StringIds.RECORDS_CABINET;
        this.requiredItemId = Items.DOCTORS_FILE;
        this.rewardItems = [Items.KLAVISK_NOTE];
        break;
      case "Task_Nurse_Hospital_Props_DrugCabinet.adr":
        this.nameId = StringIds.SMALL_PHARMACY_CABINET;
        this.requiredItemId = Items.HANDWRITTEN_NOTE_CAROLINE;
        this.rewardItems = [
          Items.FIRST_AID,
          Items.ANTIBIOTICS,
          Items.VIAL_H1Z1_REDUCER,
          Items.EMPTY_SPECIMEN_BAG,
          Items.CAP_SCRUBS_GRAY,
          Items.PANTS_SCRUBS_GRAY,
          Items.SHIRT_SCRUBS_GRAY
        ];
        break;
      case "Task_Nurse_Hospital_Props_Desk01.adr":
        this.nameId = StringIds.ICU_DESK;
        this.requiredItemId = Items.CRACKED_CLIPBOARD;
        this.rewardItems = [Items.HANDWRITTEN_NOTE_CAROLINE];
        break;
      case "Task_Hospital_Orderly_ToolCabinet01.adr":
        this.nameId = StringIds.MAINTENANCE_TOOLBOX;
        this.requiredItemId = Items.SMALL_KEY;
        this.rewardItems = [Items.FIRST_AID, Items.WEAPON_MACHETE01];
        break;
      case "Task_Orderly_Hospital_PaperDebris.adr":
        this.nameId = StringIds.BATTERED_TRASHCAN;
        this.requiredItemId = Items.TORN_LETTERHEAD;
        this.rewardItems = [
          //Items.CRUMPLED_NOTE // TODO: This should spawn the nurse Zombie to retreive the small key
          Items.SMALL_KEY
        ];
        break;
      case "Task_Orderly_Hospital_Props_Desk01.adr":
        this.nameId = StringIds.RADIOLOGY_DESK;
        this.requiredItemId = Items.PHONE_CHARGED;
        this.rewardItems = [Items.TORN_LETTERHEAD];
        break;
      case "Task_Hospital_Researcher_Radio.adr":
        this.nameId = StringIds.LONG_RANGE_RADIO;
        break;
      case "Task_Hospital_Researcher_TreasureChest.adr":
        this.nameId = 12771;
        this.requiredItemId = Items.BRAIN_TREATED;
        this.rewardItems = [Items.CODED_MESSAGE];
        break;
      case "Task_Hospital_Researcher_Locker.adr":
        this.nameId = 12781;
        this.requiredItemId = Items.LOCKER_KEY_F1;
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
        this.requiredItemId = Items.LOCKER_KEY_F2;
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
        this.requiredItemId = Items.LOCKER_KEY_F3;
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
        this.requiredItemId = Items.LOCKER_KEY_F4;
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
      case "Task_Patient_Safe_FileCabinet01.adr":
        server.sendData(client, "Command.InteractionString", {
          guid: this.characterId,
          stringId: StringIds.OPEN_LOCKED_CABINET
        });
        break;
      case "Task_Patient_Records_FileCabinet01.adr":
        server.sendData(client, "Command.InteractionString", {
          guid: this.characterId,
          stringId: StringIds.SEARCH_RECORDS
        });
        break;
      case "Task_Nurse_Hospital_Props_DrugCabinet.adr":
        server.sendData(client, "Command.InteractionString", {
          guid: this.characterId,
          stringId: StringIds.OPEN_CABINET
        });
        break;
      case "Task_Hospital_Orderly_ToolCabinet01.adr":
        server.sendData(client, "Command.InteractionString", {
          guid: this.characterId,
          stringId: StringIds.OPEN_TOOLBOX
        });
        break;
      case "Task_Orderly_Hospital_PaperDebris.adr":
        server.sendData(client, "Command.InteractionString", {
          guid: this.characterId,
          stringId: StringIds.BATTERED_TRASHCAN
        });
        break;
      case "Task_Patient_Hospital_Props_Desk01.adr":
      case "Task_Patient_Quarantine_FileCabinet01.adr":
      case "Task_Nurse_Hospital_Props_Desk01.adr":
      case "Task_Orderly_Hospital_Props_Desk01.adr":
        server.sendData(client, "Command.InteractionString", {
          guid: this.characterId,
          stringId: StringIds.SEARCH
        });
        break;
      case "Task_Hospital_Researcher_Radio.adr":
        server.sendData(client, "Command.InteractionString", {
          guid: this.characterId,
          stringId: StringIds.USE_TARGET
        });
        break;
      case "Common_Props_Bedroom_Mattress01.adr":
      case "Common_Props_MilitaryBase_BunkBed.adr":
      case "Common_Props_Bedroom_BedCombined01.adr":
      case "Common_Props_Bedroom_BedCombined02.adr":
      case "Common_Props_Bedroom_BedCombined03.adr":
      case "Common_Props_Bedroom_BedFrame01.adr":
        if (client.character._resources[ResourceIds.ENDURANCE] <= 3501) {
          server.sendData(client, "Command.InteractionString", {
            guid: this.characterId,
            stringId: StringIds.REST
          });
        } else {
          server.sendData(client, "Command.InteractionString", {
            guid: this.characterId,
            stringId: StringIds.NOT_TIRED
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
      case "Task_Hospital_Researcher_Radio.adr":
        if (!client.character.hasItem(Items.AIRDROP_CODE)) return;
        const item = client.character.getItemById(Items.AIRDROP_CODE);
        if (!item || item.hasAirdropClearance) return;
        server.utilizeHudTimer(
          client,
          StringIds.LONG_RANGE_RADIO,
          1000,
          0,
          () => {
            item.hasAirdropClearance = true;
            server.sendAlert(
              client,
              "You hear an automated message requesting a code to call in an airdrop."
            );
          }
        );
        break;
      case "Common_Props_Bedroom_Mattress01.adr":
      case "Common_Props_MilitaryBase_BunkBed.adr":
      case "Common_Props_Bedroom_BedCombined01.adr":
      case "Common_Props_Bedroom_BedCombined02.adr":
      case "Common_Props_Bedroom_BedCombined03.adr":
        if (client.character._resources[ResourceIds.ENDURANCE] <= 3501) {
          server.utilizeHudTimer(client, StringIds.RESTING, 20000, 0, () => {
            server.sleep(client);
          });
        }
        break;
      default:
        const requiredItemCount = this.getRequiredItemCount(
          this.requiredItemId
        );
        const inventoryItemCount = client.character.getInventoryItemAmount(
          this.requiredItemId
        );

        if (requiredItemCount > inventoryItemCount) {
          switch (this.requiredItemId) {
            case Items.LOCKER_KEY_F1:
              server.sendAlert(client, "This locker requires key 207."); //String ID #12782
              break;
            case Items.LOCKER_KEY_F2:
              server.sendAlert(client, "This locker requires key 122."); //String ID #12786
              break;
            case Items.LOCKER_KEY_F3:
              server.sendAlert(client, "This locker requires key 591."); //String ID #12788
              break;
            case Items.LOCKER_KEY_F4:
              server.sendAlert(client, "This locker requires key 301."); //String ID #12791
              break;
          }
          return;
        }

        const itemsPassed: { itemDefinitionId: number; count: number }[] = [];
        const itemCount =
          this.rewardItems.length === 1 ? 1 : randomIntFromInterval(2, 4);

        for (let x = 0; x < itemCount; x++) {
          const randomIndex = randomIntFromInterval(
            0,
            this.rewardItems.length - 1
          );
          const item = this.rewardItems[randomIndex];
          if (itemsPassed.map((sItem) => sItem.itemDefinitionId).includes(item))
            continue; //TODO: Check if there's already a scrub received
          itemsPassed.push({
            itemDefinitionId: item,
            count: this.getRewardItemCount(item)
          });
        }

        const requiredItemInfo = {
          itemDefinitionId: this.requiredItemId,
          count: requiredItemCount
        };
        server.taskOption(
          client,
          1000,
          this.nameId,
          requiredItemInfo,
          itemsPassed
        );
        break;
    }
  }
}
