NPC hill-bouncing fix — 2026-10-31
=================================

AI-assisted diagnosis, implementation and validation by Codex.
Applied checkout: C:\Users\Nightcore\Downloads\h1z1-2016-complete-patched-server\h1z1-server-0.50.0

Verified defects
----------------

The ground sampler was not alternating terrain/navmesh/road on the tested road
trajectories. The sampled road heights were monotonic in each travel direction,
with zero source changes. The oscillation-producing errors were in NPC movement
prediction packets:

1. Npc.goTo used Math.abs(deltaY), so downhill positions carried UPWARD vertical
   velocity. The position codec explicitly supports signed verticalSpeed.
2. Vertical velocity was scaled by instantaneous crowd speed / distance travelled,
   rather than measured deltaY / elapsed time. Instantaneous crowd speed and
   observed displacement between publication times differ during acceleration,
   avoidance and delayed fixed-step updates. That generated inconsistent uphill
   and downhill prediction magnitudes. The existing feet/sec wire conversion
   was preserved.
3. Npc.lookAt sent another timestamped position update containing stale XYZ and
   zero horizontal/vertical speed between regular movement publications. This
   reset client movement interpolation while the crowd agent could still move.

These are verified server/packet defects consistent with the reported visual
bouncing. Actual game-client rendering is not automated here; the final visual
result still needs an uphill/downhill client check.

Y-write audit
-------------

- Spawn: Npc constructor creates its Detour agent, converts that agent's actual
  X/Z to ground Y, then initializes persistent motion state once at spawn time.
- TerrainHeight: exact upper terrain-triangle intersection; never writes an NPC.
- RoadSurfaces: original transformed CDTA road-triangle intersection; never
  writes an NPC. Its higher-road/terrain selection rule is preserved.
- NavManager.npcNavToGame: converts the authoritative Detour position into world
  coordinates and chooses ground Y. No agent teleport or corridor reset occurs.
- ZoneServer2016.updatePathfindingPositions: reads agent.position(), computes
  world ground position, then calls Npc.goTo. Player/vehicle agents are untouched.
- Npc.goTo: assigns authoritative state.position and publishes movement packets.
- Npc.lookAt: previously republished stale XYZ/zero speeds; now publishes facing
  fields only, with the packet's position/velocity flags absent.
- Developer zombie command: explicitly replaces its debug agent/spawn position;
  it now resets motion state at that explicit relocation too.
- Incoming PlayerUpdateManagedPosition updates vehicles/projectiles/spectators,
  not these NPC positions. There is no client NPC-Y feedback loop in that handler.

Implementation
--------------

NpcGroundMotion stores each NPC's previous grounded position, supporting surface,
publication timestamp and filtered signed vertical velocity. It is persistent
across updates and is reset only at spawn/explicit debug relocation.

Signed vertical speed is measured from consecutive grounded positions and actual
elapsed time. Exponential damping applies ONLY to prediction velocity:

    alpha = 1 - exp(-elapsedSeconds / responseSeconds)

responseSeconds is the configured pathfinding publication interval. A crest or
direction reversal immediately changes sign; stopping immediately emits zero
velocity. NPC world/packet Y remains the exact valid sampled height, without
position lag or clearance offsets. Horizontal paths, targets, avoidance and AI
state transitions are unchanged. Existing horizontal animation speed semantics
are retained.

Terrain and road samples now also expose their actual triangle-plane derivatives.
They select the same heights/triangles as before. A geometric continuity bound
uses the endpoint plane slopes and horizontal distance, with a Float32 rounding
allowance. Missing geometry, an unproven discontinuity/cliff, nonpositive elapsed
time or stopping resets vertical prediction to zero. No velocity filter bridges
such a discontinuity; the authoritative position uses the existing ground/fallback
immediately. The bound is conservative, not a general reconstruction of every
intermediate triangle along a long segment.

An unchanged-position agent that was previously moving now emits one final stop
packet. Subsequent stationary ticks do not keep sending stop packets. That stop
update preserves facing and does not pitch a stationary NPC during Y correction.

No road/terrain coordinates, geometry files, Y offsets, path targets, foundation
obstacles, navigation scheduling or zombie FSM code were changed.

Diagnostics
-----------

Existing region-configured NPC_GROUND_DIAGNOSTICS logging now includes:
consecutive previous XYZ, current/final XYZ, elapsed seconds, raw terrain Y,
road collision Y/provenance, navmesh XYZ, selected ground surface/height,
previous/current road instance IDs, raw signed vertical speed, filtered vertical
speed, packet speed, continuity and stopping flags, plus failed terrain queries.
Speeds in the motion object are metres/sec; packetVerticalSpeed is feet/sec.

Logging remains rate-limited and expires ten minutes after zone startup. Region
coordinates occur only in the diagnostic override/test trajectories, not in
production surface-selection or damping rules.

Live corrected capture: 107 samples, 87 moving samples, 35 downhill samples,
zero wrong upward velocities on those downhill samples, zero failed terrain
queries. Final Y differs from selected surface by at most 0.00000190735 m from
Float32 rounding. Moving publication intervals ranged from 139 to 249 ms.
See npc-bounce-live-validation.json for actual consecutive values and examples.

Validation
----------

Six real-geometry trajectories, 100 samples each: forward/reverse on the first
reported road, both directions over terrain at the positive-X point as supplied,
and both directions on the additional negative-X road identified earlier.
The positive-X terrain transect contains genuine crests; those height reversals
were preserved rather than smoothed into an invented surface.

Baseline: 289 downward samples sent positive upward velocity. Fixed: ZERO.
All 600 authoritative Y values match the baseline EXACTLY; all tested road
trajectories retain zero surface-source changes and zero spurious height reversals.
Data: npc-slope-baseline.json, npc-slope-fixed.json, npc-slope-comparison.json.

Focused tests cover irregular update intervals, signed speed, time-based damping,
crests, stopping, cliffs, invalid/missing geometry, orientation-only packets,
signed wire-codec roundtrips, fluctuating instantaneous crowd speed, and keeping
the NPC's facing on the final stop packet.

Passed: full TypeScript build, build-zone-2016, build-tests, lint and Prettier.
Final general suite: 103 passed, zero failed, five skipped, excluding only the
previously known broken PluginManager fixture described in TERRAIN_FIX.md.
An initial diagnostic-argument TypeScript signature error was corrected before
deployment; final local and Docker compilation passed.

Real-navmesh regression: both targeted road chases still reach attack; the
broader 24 paired routes retain 22 successes and the same two baseline failures.
Five cases follow >1 m of elevation change. No surface-position regression was
observed (maximum error <0.000004 m).

Foundation obstacle regression: ray hit fraction 0.38480225; the crowd agent
routed around the foundation-style box and reached its target in 562 grounded
samples without entering its bounds. The Detour path/obstacle code is unchanged.

The zone Docker image was rebuilt and recreated with diagnostics. Login/MongoDB
dependencies were checked/restored when absent, and registration was checked.
The existing authentication configuration remains intact. No allowedAccess
override, version-check removal or terrain/road data replacement was performed.

Files changed
-------------

Production:
  src/servers/ZoneServer2016/entities/npc.ts
  src/servers/ZoneServer2016/zoneserver.ts
  src/servers/ZoneServer2016/handlers/commands/dev.ts
  src/utils/npcgroundmotion.ts (new)
  src/utils/npcgrounddiagnostics.ts
  src/utils/recast.ts
  src/utils/terrainheight.ts (same height selection; adds plane derivatives)
  src/utils/roadsurfaces.ts (same height selection; adds plane derivatives)

Tests/reproduction:
  tests/npcgroundmotion.test.cjs (new)
  scripts/profile-npc-slopes.cjs (new)
  scripts/validate-terrain-navigation.cjs (accepts orientation-only packets)

Reports:
  NPC_BOUNCE_FIX.md
  npc-slope-baseline.json
  npc-slope-fixed.json
  npc-slope-comparison.json
  npc-bounce-live-validation.json
  terrain-navigation-validation.json

Detailed test logs are in the validated working copy under the extractor's
server-terrain-fix folder: npc-bounce-final-test-validation.log.
Original-file backup: .npc-bounce-backup-20261031-174010.
The final stop-facing guard also has .npc-stop-facing-backup-20261031-174148.

The original terrain and client collision data remain unchanged. The road dataset
still has SHA256 a3e66ca3192e237934eccd1759c05c65f48cf3f12a21f0df867fa73dfa9ae130.

Reproduce
---------

    npm run build-zone-2016
    node --test tests/npcgroundmotion.test.cjs tests/terrainheight.test.cjs tests/roadsurfaces.test.cjs
    node scripts/profile-npc-slopes.cjs npc-slope-fixed.json
    node scripts/validate-terrain-navigation.cjs
    node scripts/verify-foundation-navigation.cjs

For the general suite, use workspace-isolated APPDATA with DISABLE_AI=true,
DISABLE_PLUGINS=true, FAKE_NAVMESH=1 after building tests:

    node --no-warnings --experimental-require-module --no-experimental-strip-types --test --test-concurrency=2 --test-skip-pattern '^PluginManager$'

Normal deployment keeps diagnostics off:

    docker compose --profile 2016 build zone-server-2016
    docker compose --profile 2016 up -d zone-server-2016

For the temporary existing diagnostic regions:

    docker compose -f docker-compose.yml -f road-diagnostics.override.yml --profile 2016 up -d zone-server-2016
    docker compose logs --tail=150 -f zone-server-2016

In game, walk uphill/downhill and stop/restart NPC pursuit near the affected
roads. The server packet/geometry checks pass; final visual confirmation still
requires the actual game client.
