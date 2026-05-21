import { BaseEntity } from "../entities/baseentity";

/**
 * A Set<BaseEntity> that keeps an external inverse-observer registry in sync.
 * The registry maps entity.characterId → Set<TOwner> so callers can look up
 * which owners have a given entity without iterating the full owner list.
 */
export class TrackedEntitySet<TOwner> extends Set<BaseEntity> {
  constructor(
    private readonly _registry: Map<string, Set<TOwner>>,
    private readonly _owner: TOwner
  ) {
    super();
  }

  add(entity: BaseEntity): this {
    if (!super.has(entity)) {
      super.add(entity);
      let obs = this._registry.get(entity.characterId);
      if (!obs) {
        obs = new Set<TOwner>();
        this._registry.set(entity.characterId, obs);
      }
      obs.add(this._owner);
    }
    return this;
  }

  delete(entity: BaseEntity): boolean {
    if (super.delete(entity)) {
      this._registry.get(entity.characterId)?.delete(this._owner);
      return true;
    }
    return false;
  }

  clear(): void {
    for (const entity of this) {
      this._registry.get(entity.characterId)?.delete(this._owner);
    }
    super.clear();
  }
}
