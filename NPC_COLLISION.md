# Shared NPC collision, vehicle impacts and locomotion — 2016

Implemented in the active v0.50.0 source. The existing terrain triangles, road
collision surfaces, ground selection, height damping, and AI FSM definitions
are retained. This adds server-side collision proxies, damage resolution and
corrected locomotion packets. **It is not a server PhysX implementation or a
claim that client vehicle impulses/animations have been validated.**

## Findings

- Previously all NPC agents had radius 0.3 and height 2, including animals.
- Vehicles had one circular avoidance agent, with no full-footprint route obstacle.
- `Collision.Damage` inflicted a fixed 3,000 NPC damage from a reported position,
  at most three targets, with a timer. It missed fast sweeps and trusted a client hint.
- `VehicleCollision` accepted an unverified client vehicle-damage amount.
- Every NPC movement/facing packet declared forward+sprinting, including stops.
  Animation speed used instantaneous crowd velocity, and body tilt aimed at the
  chase target's elevation instead of following the sampled ground plane.

## Shared collision profiles

`data/2016/npcCollisionProfiles.json` is generated from original ADR references,
Models.json scales and DME v4 LOD0 bounds. It records source file hashes and APX
references. Deer/buck, wolf, bear and rabbit have individual profiles; humanoids
retain the original human crowd dimensions. Other humanoid NPC variants share
that fallback. Offroader, pickup, police car and ATV have individual envelopes.
Spectator/parachute objects are not road vehicles and do not create these obstacles.

| Creature | Crowd radius (m) | Body height (m) | Existing health |
|---|---:|---:|---:|
| Zombie/humanoid | 0.300000 | 2.000000 | 10,000 default |
| Wolf | 0.731084 | 0.947627 | 7,500 |
| Deer | 1.025674 | 1.370656 | 7,500 |
| Bear | 1.690755 | 1.397754 | 20,000 |

These are **conservative body envelopes**, not decoded articulated APX shapes
or animated bone hitboxes. Animal bounds are the model's authored LOD0 bounds;
they do not follow every animated limb/rearing pose. The police car's referenced
APX file was absent in the supplied extraction, recorded as a null hash. Its
LOD0 bounds were available. No original client/terrain files were modified.

The shared Recast crowd uses each creature's radius/height. Parked vehicles
receive temporary oriented tile-cache boxes; occupied and unoccupied vehicles
use the same physical rules. Routing clearance derives from the largest measured
NPC radius, since the shared navmesh is not rebuilt for each species. This is
conservative for smaller creatures and can make a narrow route unavailable.
The real bear test initially stalled at a vehicle corner; this clearance and
removal of redundant parked-car crowd markers corrected that failure.

Moving/rotating vehicles remove their parked obstacle immediately and use
several overlapping local-avoidance circles along the body. An obstacle is
recreated after the configured stationary delay. Destruction, ordinary deletion,
batch deletion and periodic reconciliation clean up obstacle and crowd handles.
Obstacle count now decreases when obstacles are removed. Vertical route coverage
includes the queried navmesh floor under raised roads, using measured heights.

A publication guard sweeps each moving NPC body against nearby vehicles. A
newly penetrating horizontal step restores the last accepted nav position and
preserves a valid target. Ground Y is then selected through the original terrain
pipeline. Stationary NPCs are not retargeted, and existing overlaps can escape.

## Impacts and damage

Only authenticated managed-position updates enter the vehicle sweep. Finite
coordinates, plausible speed and monotonic timestamps are checked. Sequence
spacing can absorb delivery bursts only within a server-clock skew window;
management handoffs reset its clock origin. Neither client collision damage
nor client-reported velocity determines NPC damage.

The shared geometry kernel performs continuous separating-axis tests on 3D
oriented boxes. Translation is continuous, including when both segment endpoints
miss the NPC. Pitch/roll are included. Rotation is subdivided and conservatively
enclosed. NPCs are queried at their latest published pose, with their measured
velocity used in normal closing speed; this is not full historical skeletal CCD.

Damage uses normal relative closing speed and reduced mass:

```
reducedMass = vehicleMass * npcMass / (vehicleMass + npcMass)
energy = 0.5 * reducedMass * closingSpeed^2
npcDamage = energy * npcDamagePerJoule / npcResistance
vehicleDamage = energy * vehicleDamagePerJoule * npcResistance
```

Masses, resistance, damage scales, contact threshold, stationary delay, speed,
sampling and clock bounds are configurable **balance approximations**, not
recovered original game physics rules. There was no equivalent trustworthy
server implementation to reuse. Existing NPC health, vehicle condition,
combat attribution, kill/loot, death packets and destruction paths are reused.
Survivors receive the existing model-network `Flinch` event. Animal AI and
animations are not replaced with zombie AI/animations.

With the default offroader profile and a stationary target at 20 m/s normal
closing speed, the formula gives approximately 7,595 zombie damage, 8,491 deer
damage and 14,286 bear damage. Original health makes the deer die while the bear
survives; vehicle condition damage is approximately 304, 340 and 1,286 respectively.
At 1 m/s, zombie damage is approximately 19. Below the 0.5 m/s contact threshold,
contact causes no damage. Individual contacts are latched until separation;
separate impacts rearm and different NPCs have independent latches. Dead NPCs
ignore further ordinary damage, preventing duplicate kills/loot.

Legacy world-collision packets now act as hints to consume a recent measured
kinetic-energy loss once. They cannot supply arbitrary damage amounts, and
recent NPC impacts suppress a duplicate legacy collision charge. World wall/crash
damage consequently requires an observed speed loss; its feel/balance needs a
client test as well. Existing client vehicle handling is retained, but implausible
movement packets may be rejected by the configured limits.

**Vehicle impulse limitation:** the server receives client-managed kinematics;
the available vehicle protocol has no verified general vehicle impulse command
in this codebase. The response implemented here is authoritative damage,
health/death/destruction and supported NPC hit reactions. It does **not** add
vehicle momentum exchange, forced braking or physically simulated NPC knockback.
Vehicles are not universally stopped or teleported on contact. A surviving NPC
can therefore still be passed through by the client physics after taking an
impact. Accurate blocking/impulses require verified protocol/client physics work;
this implementation must not be represented as completing that part.

## Locomotion

NPC horizontal packet speed now equals actual X/Z displacement divided by the
elapsed publication interval, converted to the existing wire units. Grounded,
forward, stationary and sprint flags reflect measured movement. Walk/run
thresholds are profile settings; the actor's own animation network interprets
those fields. No guessed `Run`/`Walk` animation names are broadcast to animals.
Signed vertical prediction remains per NPC. Ground-plane derivatives determine
body tilt, and facing-only packets do not reset XYZ, gait, speed or tilt.

This corrects demonstrated packet defects. Actual model-specific animation
blending, including any remaining downhill gliding, still needs game-client
verification; packet tests cannot establish what the client renders.

## Validation

- Full TypeScript build, 2016 zone build, test build and repository Oxlint pass.
- Focused tests: continuous sweeps, species sizes/damage, low/high speed, occupied
  and unoccupied vehicles, independent multiple targets, contact latching,
  re-impact, dead/loot guards, destruction, both grades, vertical separation,
  cleanup, stationary target preservation, forged/unmanaged reports, delivery
  bursts, management handoff and the actual managed-position handler.
- Encoded walk/run/stop/downhill packets checked for six creature models,
  including actor-specific thresholds and independence from target elevation.
- Real Z1 navmesh: all four species route around an occupied parked vehicle,
  with no envelope penetration; 344 direct-route ground samples and maximum
  error 0.00000190735 m. Actual zombie, bear and wolf FSMs progress through chase
  and attack to a hit; actual deer FSM flees past the vehicle. All retain ground Y.
- Existing paired terrain regression: both road chases pass, 22/24 routes pass,
  two are also blocked in the unchanged baseline; 5,630 ground samples, 420
  attack hits, maximum ground error 0.00000381470 m.
- Existing foundation regression: obstacle blocks the direct ray, NPC avoids it,
  reaches the target, and all 562 ground samples pass.
- An initial full-build error involving the packet transient-ID type was fixed.
  The first slow-contact test used a stale five-second sample, outside the
  configured one-second window; it now tests a real sequence of low-speed moves.
  The first bear route failure led to the measured-clearance correction above.
- Full suite: 135 passed, zero failures, five skips (the runner also discovers
  compiled copies of the new CJS tests). The 16 focused source cases pass.
  The known
  unrelated PluginManager fixture is excluded with `--test-skip-pattern '^PluginManager$'`.

The automated matrix covers the requested server scenarios. It does not replace
real multiplayer collision, vehicle handling, latency, terrain-origin alignment,
species animation, death animation or perceived hit-response testing with the game.

## Changed files

- `src/utils/collisiongeometry.ts` — shared oriented-body/sweep geometry.
- `src/utils/npccollisionprofiles.ts` — validated immutable configuration/profiles.
- `src/utils/recast.ts` — per-profile agent dimensions and obstacle-count cleanup.
- `src/servers/ZoneServer2016/managers/npccollisionmanager.ts` — vehicle proxies,
  obstacles, motion validation, sweeps, contact latches and damage resolution.
- `src/servers/ZoneServer2016/entities/npc.ts` — per-profile agents, dead-damage
  guard, measured locomotion speed/stance and terrain-derived tilt.
- `src/servers/ZoneServer2016/zoneserver.ts` — publication and entity-cleanup hooks.
- `src/servers/ZoneServer2016/zonepackethandlers.ts` — managed motion integration,
  removal of the client NPC-damage shortcut and authoritative collision hints.
- `data/2016/npcCollisionProfiles.json` — measured envelopes, provenance and tuning.
- `scripts/build-npc-collision-profiles.cjs` — reproducible client-asset extraction.
- `scripts/verify-npc-vehicle-navigation.cjs` — real navmesh/four-species/FSM checks.
- `tests/npccollision.test.cjs`, `tests/npclocomotion.test.cjs` — focused regressions.
- `npc-collision.override.yml` — optional impact and time-limited movement diagnostics.
- `npc-vehicle-navigation-validation.json` — measured navigation/FSM results.
- This report and saved final validation logs.

## Docker deployment and client testing

From the active server source:

```cmd
docker compose --profile 2016 up -d mongodb login-server
docker compose -f docker-compose.yml -f npc-collision.override.yml --profile 2016 up -d --build --no-deps zone-server-2016
docker compose --profile 2016 ps -a
docker compose --profile 2016 logs --tail=150 zone-server-2016
```

The existing config.yaml bind mount, Docker networking, authentication and DB
settings are preserved. Changing the built-in profile JSON requires rebuilding
the zone image. Alternatively mount a complete JSON file and set
`NPC_COLLISION_PROFILES_PATH` to that container path; restart to load changes.
Do not regenerate profiles over intentional tuning without saving that tuning.

For a client run, test all four species around a parked/occupied car, then slow,
fast and repeated impacts, multiple targets, uphill/downhill, and coasting without
a driver. Check condition loss, attribution, kills/loot and species-specific gait.
Watch `[NPC-IMPACT]` and `[NPC-MOTION-FRAME]`. Movement traces expire ten minutes
after startup; impact diagnostics remain enabled while this override is active.
Disable diagnostics by recreating with only the base Compose file:

```cmd
docker compose --profile 2016 up -d --force-recreate --no-deps zone-server-2016
```

## Final deployment result

The final Docker image built and the recreated zone reported ready and registered
Zone 2 with `login-server:1110`. MongoDB and login are healthy; the zone is up.
A smoke test inside that running image loaded all four vehicle profiles, verified
their broad-phase radii enclose the complete 3D geometry on slopes, and detected
an endpoint-missing sweep at t=0.43433945. Installed files were verified against
the tested staging hashes. Backups are in `.npc-collision-backup-*` directories,
starting with `.npc-collision-backup-20261031-192925` in the active project.

`npc-collision-final-tests.log`, `npc-collision-navigation.log`,
`npc-collision-terrain-regression.log`, `npc-collision-runtime.log` and
`npc-collision-runtime-summary.json` preserve the checks and live capture.
There was no client connected during this capture, so no actual player-driven
impact or visual animation test has been claimed. Runtime logs contained no
uncaught/connection/range errors in the captured interval.

Docker dependency installation was slow on one build but completed; Docker
also reported existing dependency audit findings (six build-tree findings,
one high severity production finding). No dependency upgrades were included.
