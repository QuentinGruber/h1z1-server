# Vehicle-impact corpse separation — 2016

## Proven server defects

Fatal vehicle damage reused the final living `Npc.state.position` without
separating it from the vehicle. The living crowd agent was not removed at death;
position publication skipped dead NPCs, leaving that agent active in the crowd.
Each observer was independently assigned as its own ragdoll manager, while
`Ragdoll.UpdatePose` was discarded and `Ragdoll.Stop` rejected NPC IDs. No shared
final corpse position was reconciled after client simulation.

There is no vehicle-parent attachment in this pipeline. Apparent attachment to
the car can arise from overlapping client ragdoll/vehicle physics, rather than a
server attachment field. The user reports the visible embedding; code and tests
establish the server defects above, **not the exact native client physics behavior**.

## Correction

Only fatal impacts create a death-placement context. It records the original
NPC position, normal-based contact estimate, velocity/speed, global swept time of impact,
and vehicle sweep segments. Existing collision detection, contact normal, damage
calculation and nonfatal behavior are retained. Rotation-substep hit times are
combined for the death record without changing how impacts are detected.

Before loot creation or death packets, the shared death handler removes the
living crowd agent, clears collision/navigation bookkeeping and selects a new
corpse anchor. It checks the complete impact sweep and one geometry-derived
vehicle length of forward travel. Contact and lateral directions are considered;
the nearest validated candidate wins. Geometry-derived clearance encloses the
species' authored body under root rotation. This is conservative placement, not
a new living hitbox or a simulation of articulated bones.

Candidates must clear vehicle bodies, registered construction obstacles and
previous impact corpses. Root navmesh queries/rays and body sweeps reject invalid
routes through walls or gaps. Exact existing terrain/road sampling determines Y;
missing heights never fall back to guessed terrain or navmesh Y. Float32 and
centimetre-quantized wire positions are both checked. No map coordinates or fixed
height offsets occur in production placement logic.

A just-moved parked car can still be carved into the previous navmesh until the
next update. Fatal placement commits the already-queued tile-cache updates first,
without advancing the crowd or changing living targets. A real-map regression
reproduces an initially carved-out NPC point and verifies successful separation
after the queued car removal is committed.

The anchor is replicated with zero horizontal/vertical speed **before**
`Character.StartMultiStateDeath`/`Character.ManagedObject`. The existing NPC/GUID,
loot and harvest functions remain. Its render-grid membership is reindexed at the
new position. There is no immediate corpse deletion or new vehicle-following task.

Fatal vehicle corpses use one ready observer as ragdoll manager, preferring the
driver where available. Only that manager, while observing the NPC, may relay
ragdoll poses or settle it. Supported rotation fields are retained; roots and
velocities are clamped to the authoritative anchor. A drifting owner receives
the corrected pose. Incoming stop coordinates cannot move the corpse arbitrarily.
On authorized stop, existing `Ragdoll.Stop` and a zero-speed anchor are broadcast.
Safe native stop rotation is retained. Late full-data requests receive the same
anchor and death/settling state without rerunning loot creation.

A five-second fallback settles bodies whose manager never sends a stop, including
disconnects. `NPC_CORPSE_SETTLE_TIMEOUT_MS` can set a value in (0,60000]. Timers do
not keep the server process alive and are cancelled on entity removal. Settling
rechecks current vehicle/obstacle geometry and only relocates again if the anchor
became blocked; it does not copy a vehicle position every update.

If no valid grounded placement exists, the server logs `[NPC-CORPSE]` explicitly
and retains the existing position rather than inventing a height, losing loot or
deleting the body. This remains a geometry-limited failure, not a claimed success.
Dense obstacles can force a longer exit; in one foundation/map test the nearest
validated exit was about 12 m behind the sweep. This is derived from the swept
vehicle/body clearance and map restrictions, not an arbitrary teleport destination.

## Measured checks

All four species started at approximately (-1822.2400, 57.55471, -2234.6001).
The controlled 32 m/s fatal sweep used the existing road/navmesh geometry:

| Case | Final X | Final Y | Final Z | Surface |
|---|---:|---:|---:|---|
| Zombie | -1822.23999 | 57.566277 | -2237.81006 | Road |
| Bear / police car | -1822.23999 | 57.567032 | -2238.02002 | Road |
| Deer | -1822.23999 | 57.544331 | -2231.72998 | Road |
| Wolf | -1822.23999 | 57.563221 | -2236.95996 | Road |

Maximum selected-ground rounding error was 0.000004178 m. All six real-map
cases, including a foundation and stopped-car stale carve, passed removal,
ground, envelope clearance, encoded-position and packet-order checks.

Fifteen focused corpse tests cover fatal low/high speed, each species, police car,
moving/stopped vehicles, steep raised road, foundation, multiple independent
corpses, nonfatal preservation, ordinary death cleanup, authorized pose/stop,
timeout, late observers, grid relocation and the original skinning/harvest branch.
Tests confirm one loot creation, removal only on normal harvest, and rejection
of missing ground/blocked nav. Both full 2016 ragdoll packet encoders were checked
with valid GUIDs and anchor coordinates.

Full suite: **165 passed, zero failures, five skips**, with the known unrelated
PluginManager fixture excluded using `--test-skip-pattern '^PluginManager$'`.
The runner includes compiled CJS copies. Full build, 2016 zone build, test build,
Oxlint and changed-file formatting pass.

Existing regressions also pass: all four vehicle-avoidance routes and actual FSM
chase/attack/flee tests; foundation obstacle avoidance with 562 ground samples;
both road chases, 22/24 paired routes (two baseline-blocked routes), 5,630 ground
samples and 420 attack hits. Terrain maximum rounding error remains 0.000003815 m.

The first build identified an obstacle-reference type mismatch, corrected using
Recast's actual reference type. The first real-map impact fixture was not aligned
with the randomized agent spawn, so it was aligned to the intended test point.
The stale-carve test needed a flat navmesh location rather than the layered road
location to reproduce its prerequisite; the reproducing case now passes.

## Client verification still required

No game-client visual test has been performed for this change. Existing packet
schemas/encoding support the messages used, but their native rendering behavior
and the final bear/deer/wolf/zombie poses still need an actual client check.
Authored body envelopes cannot prove every animated skeletal limb will clear
the vehicle. The change preserves death/ragdoll reactions and provides explicit
pose/stop reconciliation; it does not add a server skeletal physics solver.

Test a bear struck by a police car, low/high-speed fatal zombie hits, deer/wolf
hits, stopping/continuing vehicles, hills, foundations and several kills. Check
the corpse remains independent, grounded, visible and harvestable to driver and
another observer. Watch `[NPC-CORPSE]`, `[NPC-CORPSE-POSE]` and `[NPC-IMPACT]` logs.

## Changed files

- `src/utils/npccorpseplacement.ts` — pure geometry/ground-validated placement.
- `src/servers/ZoneServer2016/managers/npccorpsemanager.ts` — death anchors,
  ragdoll ownership/replication, settling, grid and timer lifecycle.
- `src/servers/ZoneServer2016/managers/npccollisionmanager.ts` — fatal context
  capture and shared death/removal hooks; damage/detection formulas retained.
- `src/servers/ZoneServer2016/entities/npc.ts` — death navigation cleanup,
  pre-loot/pre-death integration, consistent ragdoll manager and late full data.
- `src/servers/ZoneServer2016/zonepackethandlers.ts` — authenticated impact-corpse
  ragdoll pose/stop handling; other ragdoll paths retain existing behavior.
- `tests/npccorpse.test.cjs` — new focused death/placement/replication tests.
- `tests/npccollision.test.cjs`, `tests/helpers/npc-collision-scene.cjs` — shared
  collision fixture now forwards the optional fatal context.
- `scripts/verify-npc-corpse-placement.cjs` — real Z1 geometry/lifecycle checks.
- `npc-corpse-map-validation.json` and `npc-corpse-*-tests.log`,
  `npc-corpse-*-regression.log` — saved measurements/checks.
- This report.

Original terrain/road files, collision profiles, living movement, Recast stepping,
damage parameters and Compose base/config.yaml are unchanged.

## Docker

From the active server source:

```cmd
docker compose -f docker-compose.yml -f npc-collision.override.yml --profile 2016 up -d --build --no-deps zone-server-2016
docker compose --profile 2016 ps -a
docker compose --profile 2016 logs --tail=150 zone-server-2016
```

The existing diagnostic override enables the corpse logs as well. The normal base
Compose file can run the fix without diagnostics. Backups and actual deployment
results are recorded below after the build/start check.

## Deployed result

The zone image built successfully and `zone-server-2016` was recreated. It reported
ready and registered Zone 2 with `login-server:1110`. Login and MongoDB were healthy.
The startup/runtime capture showed no recurring connection, uncaught or range
exception. `npc-corpse-runtime.log` preserves that capture. No dependency changes
were made; Docker reported the existing dependency audit findings.

A controlled smoke fixture using the compiled modules **inside the deployed
container** killed a bear with a police car at 30 m/s, selected anchor (0,0,3.25),
verified the body cleared the impact/future sweep, removed its living agent,
created loot once, retained the anchor after further vehicle travel and settled
it. This is an automated server fixture, not a player/game-client test.

All 15 installed source/test/report files were hash-verified against the tested
staging copy before the documentation/runtime-capture append. Original files
are backed up under `.npc-corpse-backup-20261031-202256` in the active project.
The final documentation/runtime-log append is backed up separately.

**Visual ragdoll behavior remains unverified until an actual game-client test.**
