import { BaseEntity } from "../entities/baseentity";

/**
 * A Set<BaseEntity> that keeps an external inverse-observer registry in sync.
 * The registry maps entity.characterId → Set<TOwner> so callers can look up
 * which owners have a given entity without iterating the full owner list.
 *
 * Optionally accepts a filterSet + filterPredicate pair: entities matching the
 * predicate are mirrored into filterSet on add/delete/clear automatically.
 */
export class TrackedEntitySet<TOwner> extends Set<BaseEntity> {
  private readonly _filterSet?: Set<BaseEntity>;
  private readonly _filterPredicate?: (entity: BaseEntity) => boolean;

  constructor(
    private readonly _registry: Map<string, Set<TOwner>>,
    private readonly _owner: TOwner,
    filterSet?: Set<BaseEntity>,
    filterPredicate?: (entity: BaseEntity) => boolean
  ) {
    super();
    this._filterSet = filterSet;
    this._filterPredicate = filterPredicate;
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
      if (this._filterSet && this._filterPredicate?.(entity)) {
        this._filterSet.add(entity);
      }
    }
    return this;
  }

  delete(entity: BaseEntity): boolean {
    if (super.delete(entity)) {
      this._registry.get(entity.characterId)?.delete(this._owner);
      this._filterSet?.delete(entity);
      return true;
    }
    return false;
  }

  clear(): void {
    for (const entity of this) {
      this._registry.get(entity.characterId)?.delete(this._owner);
    }
    this._filterSet?.clear();
    super.clear();
  }
}
