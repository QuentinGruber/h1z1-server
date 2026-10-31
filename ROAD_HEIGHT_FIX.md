Road collision height correction — 2026-10-31
===========================================

AI-assisted implementation/validation by Codex. Changes are applied to:
C:\Users\Nightcore\Downloads\h1z1-2016-complete-patched-server\h1z1-server-0.50.0

Measured results (coordinates preserved exactly as requested)
------------------------------------------------------------

| X | supplied Y | Z | terrain Y | navmesh Y | road collision Y | corrected NPC adapter Y |
|---|---|---|---|---|---|---|
| -1822.24 | 58.17 | -2234.60 | 55.31750000 | 55.85610580 | 57.55471392 | 57.55471420 |
| +1989.04 | 53.39 | -2235.25 | 92.06692708 | 92.38703156 | no road collision | 92.06692505 |

At the first point, the actual road is 2.23721392 m above the terrain and
1.69860811 m above the navigation mesh. That is why terrain-only grounding
placed NPCs below the road. The supplied Y is 0.61528608 m above the measured
collision triangle; it was NOT treated as a collision measurement or offset.

At the second, POSITIVE-X point, terrain is 38.67692708 m ABOVE the supplied Y.
The original zone's asphalt-road collision instances do not cover that X/Z.
Its terrain height is therefore preserved; forcing it to Y=53.39 would put
an NPC well underground. No coordinate sign was silently changed.

Additional sign cross-check, separate from the requested points:
at X=-1989.04, Z=-2235.25, terrain is 49.89453125 and collision on
RoadStraightSlope_512.adr is 53.38287356 (3.48834231 m above terrain).
That road height closely matches the supplied Y=53.39. Check the second X sign
in game; the same geometry-based implementation already covers this road too.

Coverage / boundaries / original heights
---------------------------------------

First point: Z1_-36_-32.cnk0, packed tile 197.bin.gz, terrain triangle 19797.
Chunk X=[-2048,-1792], Z=[-2304,-2048]. Subtile X=[-1856,-1792],
Z=[-2240,-2176]. Local subtile coordinate is (33.76,5.40).
Nearest chunk edge is 30.24 m away; this is not a chunk or tile seam.
Four surrounding original CNK0 height samples: 55.40625, 55.28125,
55.34375, 55.25 — consistent with terrain, not the elevated road.

Second point: Z1_-36_28.cnk0, packed tile 213.bin.gz, terrain triangle 29658.
Chunk X=[1792,2048], Z=[-2304,-2048]. Subtile X=[1984,2048],
Z=[-2240,-2176]. Local subtile coordinate is (5.04,4.75).
Nearest chunk edge is 58.96 m away; no chunk or tile seam occurs here either.
Surrounding original samples: 91.96875, 91.90625, 92.09375, 92.0.

Both lookups succeed. The original filename-axis swap/terrain transform remains
valid and unchanged. Original terrain OBJ, GZ, CNK and client asset files were
not modified.

Actual road geometry and correction
-----------------------------------

The extractor's assets/ folder contains terrain only. The supplied world.obj
contains terrain and trees, so it cannot supply the elevated road surface.
The additional client asset folder provided during investigation is:

    D:\Downloads\quickbms_win\extracted

It contains the ADR road definitions, their referenced CDTA collision files,
and LOD0 DME render meshes. The first point is inside collision triangle 121
of RoadStraightSlopeUp_256.adr, instance ID 1277429836. The original zone
places it at (-1775,54,-2235), yaw=-1.5707964897155762, scale=(1,1,0.6800003051757812).
The nonuniform instance scale is applied to the real local collision vertices,
followed by the original rotation and translation. No inferred road dimensions,
placement-Y-as-height, guessed heights, or clearance offsets are used.

The builder resolves only Road* actor definitions with MaterialType ASPHALT
and actual CollisionData. It validates CDTA magic/version, collision type
against ADR, shape/vertex/triangle counts, every index, cooked PhysX NXS blob
length and complete file consumption. The resulting dataset contains 27
collision models placed into 425 original zone instances, compressed to 118,991
bytes. RoadOverlay_Stop has no collision reference and is correctly omitted.

Independent checks against the two relevant LOD0 DMEs confirm all 289 collision
vertices and 432 triangles have matching render geometry/topology (triangle
order/winding is canonicalized for comparison). Source ADR/CDT and zone SHA256
values are retained in the generated dataset. Collision data is authoritative;
render mesh coordinates are used for this cross-check, not as fabricated heights.

RoadSurfaces builds a spatial index over transformed collision triangles.
The existing NPC adapter intersects triangles exactly at the crowd agent's X/Z.
Where an actual road collision surface is above terrain, it uses that surface;
elsewhere it keeps the existing terrain lookup. Valid road geometry can also
cover a terrain hole. It takes the upper collision surface for overlapping road
triangles. This is a road-height layer, not a general building/bridge multi-level
navigation system. Non-road structures and their height layers are not added.

The existing Detour agents, targets, crowd updates, horizontal routes, obstacle
insertion and zombie AI are unchanged. No production coordinate-specific branches
exist. The correction is restricted to exact road collision footprints. Of the
803 source NPC spawn positions, 36 intersect road geometry; 30 are raised above
terrain. All other spawn heights retain the previous behavior.

Temporary diagnostics
---------------------

road-diagnostics.override.yml configures 75 m diagnostic regions around BOTH
exact requested X/Z points. These coordinates are used only for logging.
Logging is rate-limited and automatically expires ten minutes after zone start.
Reference logs show terrain tile/triangle, terrain Y, navmesh Y and road collision
provenance. Live NPC logs show reported XYZ, crowd/navmesh XYZ, terrain Y,
selected tile/triangle, query failures, and selected road collision actor/triangle.

The corrected live capture contained 159 nearby NPC samples, 28 supported by
road collision surfaces, zero failed terrain queries, and at most
0.00000137090683 m difference between reported NPC Y and road collision Y.
Those are actual NPC observations nearby, not an invented observation at either
exact supplied point. The exact-point geometry measurements above are reproducible
offline and were also logged by the deployed container. No NPC was observed at
the positive-X point during capture.

To view current logs:

    docker compose logs --tail=150 zone-server-2016

To re-enable diagnostics after expiry (recreates only the zone):

    docker compose -f docker-compose.yml -f road-diagnostics.override.yml --profile 2016 up -d --no-deps --force-recreate zone-server-2016

To remove diagnostics from the container environment while retaining the fix:

    docker compose --profile 2016 up -d --no-deps zone-server-2016

The base Compose configuration and config.yaml were not changed by this road fix.

Validation
----------

Passed: full TypeScript build, 2016 build, test build, lint, focused terrain/road
tests and the zone Docker image build. The corrected image was deployed and
zone 2 re-registered successfully; MongoDB/login remain healthy.

Road tests verify exact triangle interpolation, footprint exclusion, rotation,
nonuniform scale, unchanged X/Z, terrain fallback, road-under-terrain handling,
and valid road geometry over a terrain hole.

Real-navmesh foundation obstacle test: direct path blocked at ray fraction
0.38480225; agent routed around the obstacle and reached its target in 562
grounded samples without entering foundation bounds.

AI regression: two targeted road chases reached chase/attack states. The broader
24 paired routes retain 22 successful chases; the same two baseline cases remain
unsuccessful. Five broader cases follow >1 m of elevation change. Across the
updated simulation: 5,630 grounded samples, 9,638 movement packets and 420 attack
callbacks; maximum selected-surface discrepancy <0.000004 m (Float32 rounding).

General suite with two workers: 95 passed, zero failed, five skipped, excluding
the previously known broken PluginManager fixture. An earlier diagnostic-only
parallel run timed out one construction suite under concurrent workload; its
isolated rerun passed all eight tests, followed by successful reduced-concurrency
suite runs. No production change or test-timeout increase was used to mask it.

Road index construction took ~142 ms locally. Warm road queries for all 803
spawn positions took ~0.076 ms median / ~0.249 ms p95 in a local benchmark.
These are measurements, not deployment capacity guarantees.

Actual in-game validation at the exact first point remains necessary to assess
visual foot contact. Confirm the second X sign before interpreting that location.

Exact source/data changes and artifacts
---------------------------------------

Modified production files:
  src/utils/recast.ts
  src/utils/terrainheight.ts (diagnostic provenance method only)
  src/servers/ZoneServer2016/zoneserver.ts (diagnostic call only)

Added production files:
  src/utils/roadsurfaces.ts
  src/utils/npcgrounddiagnostics.ts
  data/2016/roadSurfaces.json.gz

Diagnostics / generation / tests:
  road-diagnostics.override.yml
  scripts/build-road-surfaces.cjs
  scripts/verify-road-source.cjs
  scripts/measure-road-heights.cjs
  scripts/inspect-road-chunks.cjs
  scripts/inspect-road-placements.cjs
  scripts/verify-foundation-navigation.cjs
  scripts/validate-terrain-navigation.cjs (road-aware assertions and targeted cases)
  tests/roadsurfaces.test.cjs
  tests/terrainheight.test.cjs (provenance assertions)

Reports:
  ROAD_HEIGHT_FIX.md
  road-height-measurements.json
  road-source-validation.json
  road-placements-inspection.json
  road-live-corrected-diagnostics.json
  road-surface-benchmark.json
  terrain-navigation-validation.json

Original-file backups:
  .road-diagnostics-backup-20261031-162836
  .road-surface-backup-20261031-164032

Build/deploy from the selected server checkout:

    docker compose --profile 2016 build zone-server-2016
    docker compose --profile 2016 up -d --no-deps zone-server-2016

The Dockerfile's existing COPY data/ includes the small collision dataset. No
raw client assets are required at runtime. On another checkout/VPS, transfer
the production source changes AND data/2016/roadSurfaces.json.gz before building.
The login secret/configuration from LOGIN_FIX.md must remain in place.

Regenerate offline, without changing the source client assets:

    node scripts/build-road-surfaces.cjs "D:\Downloads\quickbms_win\extracted" <path-to-Z1.zone> data/2016/roadSurfaces.json.gz

Reproduce measurements and regression checks after building:

    node scripts/measure-road-heights.cjs
    node scripts/verify-road-source.cjs "D:\Downloads\quickbms_win\extracted"
    node --test tests/roadsurfaces.test.cjs tests/terrainheight.test.cjs
    node scripts/verify-foundation-navigation.cjs
    node scripts/validate-terrain-navigation.cjs

Detailed test logs remain in the validated working copy under the terrain
extractor workspace: road-surface-test-validation.log and diagnostic-stage logs.
