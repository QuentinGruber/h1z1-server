import { BaseSimpleNpc } from "./basesimplenpc";
import { LoadoutContainer } from "./loadoutcontainer";

export class BaseLootableEntity extends BaseSimpleNpc {
  container: LoadoutContainer;
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
}
