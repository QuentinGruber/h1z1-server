import { BaseLootableEntity } from "./baselootableentity";
import { LoadoutContainer } from "./loadoutcontainer";

export class Lootbag extends BaseLootableEntity {
  creationTime = Date.now();
  canAcceptItems = false;
  constructor(
    characterId: string,
    transientId: number,
    actorModelId: number,
    position: Float32Array,
    rotation: Float32Array,
    container: LoadoutContainer
  ) {
    super(
      characterId,
      transientId,
      actorModelId,
      position,
      rotation,
      container
    );
    this.container.canAcceptItems = false;
  }
}
