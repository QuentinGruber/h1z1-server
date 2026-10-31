Terrain height fix for H1Emu v0.50.0 / 2016
==========================================

AI-assisted implementation and validation by Codex, 2026-10-31.

Selected source: C:\Users\Nightcore\Downloads\h1z1-2016-complete-patched-server\h1z1-server-0.50.0

Findings
--------

The actual terrain-only.obj contains 1,024 CNK0 objects, 32,312,437 vertices
and 60,397,802 triangles. Coverage is X/Z [-4096,4096], Y [0,359.59375].
Coordinates are game XYZ with Y up, without an additional scale or offset.
Chunk origins are 256 metres apart. Z1.zone specifies tile_size=64 and
tile_height=0.03125. For a chunk named Z1_A_B.cnk0, the verified conversion is:

    worldX = B*64 + (tile.y-minTileY)*64 + vertex.x
    worldY = vertex.hn/32
    worldZ = A*64 + (tile.x-minTileX)*64 + vertex.y

The tile assigned to a vertex follows sorted unique batch.vertex_offset values.
The two filename axes are swapped. No guessed height offsets are used.
Every packed vertex and face was independently compared to the decompressed
original CNK0 data: all matched. There are 69,222,400 original height samples
(67,600 per chunk); these are not one simple map-wide square height grid.
A fresh LZHAM decompression of Z1_-12_-20.cnk0 also matched the existing .dec
file byte-for-byte (SHA256 6dabfda549c57ab0611bc9f8398eaa040220b560b7d9009363fc6db2d37a6019).

terrain-heights.gz is gzipped OBJ vertex text with NO faces, not a binary
heightmap. It has 32,312,437 vertices. world.obj has the terrain and speedtree
geometry, but no road/building object meshes. The original files were not edited.
terrain-only.obj SHA256:
4d44184bd7c2125baf59bb7e1d605e3089b3c3c6cdb4e2a048b2c879e3e4c696

Implementation
--------------

TerrainHeight intersects vertical lines with the actual triangles using
barycentric interpolation. It preserves original triangle diagonals and holes,
ignores vertical/degenerate triangles, and takes the upper terrain intersection
when triangles overlap. It returns null outside coverage, without extrapolation.
The NPC adapter keeps the navmesh height when there is no terrain intersection.

Data is packed into 1,024 gzip binary tiles plus manifest.json (about 330 MiB).
SHA256 and index checks protect loaded tiles. Two bounded LRU caches hold
32 decoded tiles and 8,192 small query cells; no multi-gigabyte OBJ is parsed
at server startup. An invalid/missing manifest fails startup; tile corruption
throws on first access rather than inventing a height.

Detour retains its own agent/corridor coordinates and move targets. Only the
NPC world/packet Y is grounded at Detour's X/Z. Spawn grounding, stationary
Y correction, dead-NPC protection, and terrain-derived vertical packet speed
are included. Zombie FSMs, aggro, attack logic, speeds and path requests are
unchanged. Player/vehicle passive crowd agents are unchanged.

NPC synchronization now reads agent.position(), since recast-navigation 0.43.1
can leave interpolatedPosition unchanged at exact fixed-step boundaries.
The developer zombie test command also uses the terrain adapter.

The Dockerfile explicitly runs the 2016 TypeScript build after npm ci, rather
than relying on a package installation lifecycle script to compile the server.
An existing broken packet-schema test import was also corrected.

Exact changed/added paths
------------------------

Modified:
  src/utils/recast.ts
  src/servers/ZoneServer2016/entities/npc.ts
  src/servers/ZoneServer2016/zoneserver.ts
  src/servers/ZoneServer2016/handlers/commands/dev.ts
  docker/2016/ZoneServer.Dockerfile
  tests/testIssuesInPacketSchemas.test.ts

Added:
  src/utils/terrainheight.ts
  scripts/build-terrain.cjs
  scripts/validate-terrain-chunks.cjs
  scripts/validate-terrain-navigation.cjs
  scripts/benchmark-terrain.cjs
  tests/terrainheight.test.cjs
  data/2016/terrainData/manifest.json
  data/2016/terrainData/0.bin.gz through 1023.bin.gz
  TERRAIN_FIX.md
  terrain-navigation-validation.json
  terrain-benchmark.json

change-manifest.json and Apply-TerrainFix.ps1 in the validated working copy
are installer artifacts. Dependencies, generated out/ files, test save data,
and the test plugin's modified/generated files are NOT part of the patch.

Validation and limits
---------------------

Passed: npm run build; npm run build-zone-2016; npm run build-tests;
npm run lint-quiet; Prettier on changed source/test files; focused lookup test;
Docker Compose configuration validation; full geometry-to-CNK0 comparison.

Paired real-navmesh simulation: 24 routes, 22 reaching chase/attack in both
baseline and grounded runs; five routes with >1 metre of elevation change;
5,228 terrain samples, 376 grounded attack callbacks, 9,350 movement packets
across paired runs. Maximum ground discrepancy: 0.000003814697265625 metres
(Float32 rounding). NPC tests cover stationary grounding and dead-body protection.
Two routes return to wandering in BOTH baseline and grounded runs: existing
horizontal path/chase limitations remain. See terrain-navigation-validation.json
for coordinates and individual results. The baseline disables terrain grounding
while using the same authoritative crowd-position adapter and FSM defaults.

All 803 source NPC positions have terrain coverage. On this machine: cold first
lookup pass ~1.35 s; warm 803-position passes ~0.525 ms median / 6.86 ms p95;
benchmark process RSS ~341 MiB. These are local measurements, not capacity guarantees.

Initial npm/test runs hit sandbox restrictions on npm cache and user save files.
Re-running with workspace-isolated APPDATA resolved world/account save tests.
The full suite then reported 84 passed, 2 failed, 5 skipped: the failures are
the PluginManager suite and its Plugin Load subtest. Investigation found an
uncompiled TestPlugin fixture and a dependency on h1z1-server@0.38.0. A fresh
fixture install/build still fails TS2307 for its server imports. No terrain
or production plugin code was changed to hide that unrelated failure.

The latest suite run excluding only PluginManager passes: 85 passed, 0 failed,
5 skipped. MongoDB tests are skipped without MONGO_TESTS=true and a database.
Logs remain in the validated working copy: test-validation.log and
test-without-plugin-validation.log.

The Docker engine is not running here, so image build/container/game-client
validation could not be performed. Compose config validation passed. No live
server was restarted. Ground-following is validated against the supplied terrain,
not against an in-game road/bridge survey. Raised road decks, bridges and building
floors absent from these OBJs are NOT represented: this terrain-only fix cannot
provide their surface heights or preserve their layers. Those require matching
world collision geometry and layer-aware surface selection; do not treat this
patch as validation of NPC movement on those structures.

Docker deployment
-----------------

Apply-TerrainFix.ps1 copies only the listed patch files and derived terrain
data into the selected source folder, after verifying original-file hashes and
backing up existing files. It does not copy test runtime/config/save data.
Run Docker commands from the selected source folder once Docker Engine is up:

    docker compose --profile 2016 config --quiet
    docker compose --profile 2016 build zone-server-2016
    docker compose --profile 2016 up -d --no-deps zone-server-2016
    docker compose --profile 2016 logs --tail=150 -f zone-server-2016

The existing Dockerfile COPY data/ includes terrainData automatically. Expected
startup line: [TERRAIN] Loaded 1024 terrain tile records ...
For an existing Linux server checkout, transfer the exact changed source paths
and the complete data/2016/terrainData directory before building. No raw OBJ,
CNK, or terrain-heights.gz file is required in the container.
TERRAIN_DATA_PATH can point to an alternate directory INSIDE the container;
otherwise the packaged data/2016/terrainData location is used.

If login/MongoDB are not already running, start the profile dependencies first:

    docker compose --profile 2016 up -d mongodb login-server

Verify in game on level terrain, hills and chunk boundaries, while pursuing a
moving player and attacking. Inspect elevated structures separately using the
limitations above. The existing Compose network_mode: host also requires an
appropriate host networking setup; that configuration was not changed.

Reproduce the checks in the validated working copy
------------------------------------------------

    npm ci --ignore-scripts
    npm run build
    npm run build-zone-2016
    npm run build-tests
    npm run lint-quiet
    node --test tests/terrainheight.test.cjs
    node scripts/validate-terrain-navigation.cjs
    node scripts/validate-terrain-chunks.cjs data/2016/terrainData ../assets
    node scripts/benchmark-terrain.cjs

To regenerate data, choose a NEW output directory (the tool refuses an existing
manifest): node scripts/build-terrain.cjs ../Z1/terrain-only.obj <new-directory>
The tool is streaming, does not modify its source and never rasterizes heights.

For the general suite, use a fresh workspace-owned APPDATA directory and npm
cache. npm test includes the known broken plugin fixture. To reproduce the
passing remainder after building tests, set DISABLE_AI=true, DISABLE_PLUGINS=true,
FAKE_NAVMESH=1, and run:

    node --no-warnings --experimental-require-module --no-experimental-strip-types --test --test-skip-pattern '^PluginManager$'

Rollback: restore the six modified original files from the installer's backup
directory and rebuild/recreate zone-server-2016 using the Docker commands above.
The added terrain files are inert once the original source has been restored.
