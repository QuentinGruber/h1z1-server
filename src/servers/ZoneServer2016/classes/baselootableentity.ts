import { ContainerErrors } from "../models/enums";
import { ZoneServer2016 } from "../zoneserver";
import { BaseFullCharacter } from "./basefullcharacter";
import { LoadoutContainer } from "./loadoutcontainer";
import { ZoneClient2016 } from "./zoneclient";

export class BaseLootableEntity extends BaseFullCharacter {
  container: LoadoutContainer;
  mountedCharacter?: string;
  readonly interactionDistance = 4;
  isLootbag: boolean;
  constructor(
    characterId: string,
    transientId: number,
    actorModelId: number,
    position: Float32Array,
    rotation: Float32Array,
    container: LoadoutContainer
  ) {
    super(characterId, transientId, actorModelId, position, rotation);
    this.isLootbag = actorModelId == 9581 || actorModelId == 9391;
    this.container = container;
  }

  OnInteractionString(server: ZoneServer2016, client: ZoneClient2016): void {
    server.sendData(client, "Command.InteractionString", {
      guid: this.characterId,
      stringId: 31,
    });
  }

  OnPlayerSelect(server: ZoneServer2016, client: ZoneClient2016): void {
    if(client.character.characterId == this.mountedCharacter) {
      client.character.dismountContainer(server);
      return;
    }

    if(this.mountedCharacter) {
      server.containerError(client, ContainerErrors.IN_USE);
      return;
    }

    client.character.mountContainer(server, this);

  }

  OnFullCharacterDataRequest(server: ZoneServer2016, client: ZoneClient2016) {
    // do nothing for now
  }
}
