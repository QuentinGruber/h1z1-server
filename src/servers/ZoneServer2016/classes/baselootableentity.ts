import { ZoneServer2016 } from "../zoneserver";
import { BaseFullCharacter } from "./basefullcharacter";
import { BaseSimpleNpc } from "./basesimplenpc";
import { LoadoutContainer } from "./loadoutcontainer";
import { ZoneClient2016 } from "./zoneclient";

export class BaseLootableEntity extends BaseFullCharacter {
  container: LoadoutContainer;
  mountedCharacter?: string;
  constructor(
    characterId: string,
    transientId: number,
    actorModelId: number,
    position: Float32Array,
    rotation: Float32Array,
    container: LoadoutContainer
  ) {
    super(characterId, transientId, actorModelId, position, rotation);
    this.container = container;
  }

  OnInteractionString(server: ZoneServer2016, client: ZoneClient2016): void {
    server.sendData(client, "Command.InteractionString", {
      guid: this.characterId,
      stringId: 31,
    });
  }

  OnPlayerSelect(server: ZoneServer2016, client: ZoneClient2016): void {
    this.mountedCharacter = client.character.characterId;

    server.sendData(client, "Container.InitEquippedContainers", {
      ignore: client.character.characterId,
      characterId: client.character.characterId,
      containers: [
        ...client.character.pGetContainers(server),
        {
          loadoutSlotId: this.container.slotId,
          containerData: client.character.pGetContainerData(
            server,
            this.container
          ),
        },
      ],
    });

    server.addItem(client, this.container, 101);

    const slots = Object.keys(client.character._loadout).map((slotId: any) => {
      const slot = client.character._loadout[slotId];
      return {
        hotbarSlotId: slot.slotId, // affects Equip Item context entry packet, and Container.MoveItem
        loadoutId: client.character.loadoutId,
        slotId: slot.slotId,
        loadoutItemData: {
          itemDefinitionId: slot.itemDefinitionId,
          loadoutItemOwnerGuid: slot.itemGuid,
          unknownByte1: 255, // flags?
        },
        unknownDword4: slot.slotId,
      };
    });

    server.sendData(client, "Loadout.SetLoadoutSlots", {
      characterId: client.character.characterId,
      loadoutId: client.character.loadoutId, // needs to be 3
      loadoutData: {
        loadoutSlots: [
          ...slots,
          {
            loadoutId: client.character.loadoutId,
            slotId: this.container.slotId,
            loadoutItemData: {
              itemDefinitionId: this.container.itemDefinitionId,
              loadoutItemOwnerGuid: this.container.itemGuid,
              unknownByte1: 255, // flags?
            },
            unknownDword1: this.container.slotId,
          },
        ],
      },
      currentSlotId: client.character.currentLoadoutSlot,
    });

    server.sendData(client, "AccessedCharacter.BeginCharacterAccess", {
      objectCharacterId: this.characterId,
      containerGuid: this.container.itemGuid,
      unknownBool1: false,
      itemsData: {
        items: [],
        unknownDword1: 92, // idk
      },
    });
  }
}
