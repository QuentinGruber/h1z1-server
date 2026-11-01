# C8 road walkability repair

The generated tile cache had no walkable road surface at the empty door-side
standing positions. Normal obstacle rebuilds replaced the standalone navigation
there with the incomplete cached layers. Approach-distance and animation changes
could not make those missing positions traversable.

The approved repair is additive and restricted to tile (27,24), covering the
existing RoadStraightSlope_512.adr instance 2777289806 inside that tile. It reads
the existing collision samples to add road walkability; it does not edit the
road collision model or terrain data. Existing cached heights and area bytes
are identical; 219 boundary connectivity bytes connect the supplemental road
layer to the surrounding original navigation. The original navigation binary
files are unchanged. The supplement validates their SHA-256 before loading.

The supplemental road layer has its own precise cache. It receives the exact
same obstacle positions, rotations and dimensions as the original cache. This
was necessary to pass the foundation-boundary regression without changing any
physical collision geometry or the original world-cache settings.

Production changes:
- src/utils/recast.ts: apply the supplement at load and keep both caches updated.
- src/utils/roadnavpatch.ts: verify/apply the scoped data and initialise its cache.
- data/2016/navData/roadWalkabilityPatch.json: the supplemental layer and boundary data.

Validation on the final 2016 Docker image:
- Clean TypeScript build passed.
- 50 tests passed: animation/locomotion, cache/source integrity, NPC collision,
  vehicle impact energy/damage, attribution, packet timing and authentication.
- Captured 33-zombie replay: door-side occupancy 0 to 10; attackers 23 to 26;
  blocked movement publications 1264 to 458. No penetration/ground-height assertion
  failures and no horizontal spawn displacement used to obtain the result.
- Foundation direct path blocked; agent detoured outside the unchanged bounds
  and reached its target. The test used a 2 m vertical obstacle half-extent.
- Zombie, bear and wolf reached their normal attack states and delivered a hit;
  deer fled successfully inside the repaired tile. Their behavior source is unchanged.
- Full paths connected both banks and both road approaches to each door side.
- All 1047 protected-file hashes matched before/after, including all terrain
  tiles, original navigation binaries, road collision data, physical collision
  and vehicle damage code, wildlife FSMs, corpse handling and the working NPC
  animation code. The authoritative ground sampling functions were not edited.

Only the zone service was rebuilt and redeployed successfully. Login and MongoDB remained running. In-game surround/staggering validation
is pending; the replay results are not a claim of visual success.

