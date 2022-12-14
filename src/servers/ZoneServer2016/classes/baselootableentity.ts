import { ZoneServer2016 } from "../zoneserver";
import { BaseFullCharacter } from "./basefullcharacter";
import { BaseLightweightCharacter } from "./baselightweightcharacter";
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

    Object.values(this.container.items).forEach((item)=> {
      server.addItem(client, item, this.container.containerDefinitionId);
    })

    server.sendData(client, "Loadout.SetLoadoutSlots", {
      characterId: client.character.characterId,
      loadoutId: client.character.loadoutId,
      loadoutData: {
        loadoutSlots: [
          ...Object.keys(client.character._loadout).map((slotId: any) => {
            return client.character.pGetLoadoutSlot(client.character._loadout[slotId]);
          }),
          client.character.pGetLoadoutSlot(this.container)
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

  OnFullCharacterDataRequest(server: ZoneServer2016, client: ZoneClient2016) {
    // do nothing for now
  }
}
