# Navmesh streaming (fine tilecache)

Optional mode that loads a **fine, whole-map navmesh** as a compressed
`TileCache` streamed from RAM, instead of the coarse pre-baked navmesh in
`data/2016/navData/`. Enabled with the `NAV_STREAMING=1` environment variable.

## Why streaming

A fine monolithic navmesh of the whole map (~108k tiles) overflows Detour's
32-bit `dtPolyRef` budget (`tileBits + polyBits = 22`), so only a handful of
polys per tile survive and paths get truncated. Streaming keeps the **active**
navmesh bounded: the full compressed tilecache is preloaded into RAM, but only
the tiles within `STREAM_RADIUS` of a live player are materialised into the
navmesh (`buildNavMeshTilesAt`); tiles leaving the window are removed. The
navmesh therefore stays well under the polyref budget while covering the whole
map at fine resolution.

## Enabling it

```bash
NAV_STREAMING=1 npm start
```

At boot the server loads `data/2016/collision/z1_cache_*.bin` (TileCacheSet,
magic `TSET`). If those files are **absent**, it logs a warning and falls back
to the standard navmesh — no crash, but no streaming.

Debug namespaces (via the `debug` module):

- `DEBUG=nav:stream` — tile window changes (`+N -M columns (loaded: K)`)
- `DEBUG=nav` — obstacle carving (`requests`, obstacle `total`)

## Regenerating the tilecache

The tilecache (~600 MB) is **gitignored** (`/data/2016/collision/`) and must be
generated with the official h1emu pipeline (it replaces the old in-repo
tooling). High-level steps:

1. Build [`h1emu-map-data-extraction`](https://github.com/H1emu/h1emu-map-data-extraction)
   (Rust) and [`h1emu-recast`](https://github.com/H1emu/h1emu-recast)
   (C++/CMake).
2. Extract the Z1 map (from the game's `Assets_*.pack`) to a `world.obj` with
   `h1emu-map-data-extraction`.
3. Set the **fine** parameters in `h1emu-recast/main.cpp` before building:
   | Constant | Fine value |
   |---|---|
   | `CELL_SIZE` | `0.2f` |
   | `CELL_HEIGHT` | `0.1f` |
   | `AGENT_MAX_CLIMB` | `1.5f` |
   | `AGENT_MAX_SLOPE` | `70.0f` |
   | `TILE_SIZE` | `128` |
   (On MSVC, wrap the GCC-only flags in `if(MSVC) ... else() ... endif()` in
   `CMakeLists.txt`.)
4. Run the builder on `world.obj`; it writes `z1_cache_*.bin` (the `TSET`
   tilecache) next to the navmesh.
5. Copy `z1_cache_*.bin` into `data/2016/collision/`.

The default (coarse) parameters reproduce the stock `data/2016/navData` navmesh
exactly, which is a good sanity check that the pipeline is set up correctly.

## Runtime (`src/utils/recast.ts`)

- **`loadNavStreaming`** — reads the `TSET` header, inits an empty `TileCache`
  and an empty tiled `NavMesh`, then `addTile`s every compressed layer (~1 s for
  ~108k layers / ~600 MB).
- **`streamAround(playerPositions)`** — called from
  `zoneserver.updatePathfindingPositions()`; materialises the column window
  around players and removes columns that left it. Throttled by
  `STREAM_INTERVAL`.
- **Carving** — `addObstacle` / `removeObstacle` feed the tilecache
  (`addBoxObstacle`) and `updt()` pumps `tilecache.update()`, so player
  constructions carve the streamed navmesh natively (NPCs route around them).

## Tunables (`src/utils/recast.ts`)

| Constant | Default | Meaning |
|---|---|---|
| `STREAM_RADIUS` | `300` | meters around a player kept materialised |
| `STREAM_INTERVAL` | `1000` | ms between window updates |
