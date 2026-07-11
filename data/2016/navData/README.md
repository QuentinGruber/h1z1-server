# navData

The `.bin` files in this directory are **generated data**. They contain the precomputed navigation mesh used by the AI pathfinding (see `src/utils/recast.ts`).

## Files

- `z1_0.bin`, `z1_1.bin`, `z1_2.bin` — navmesh parts. Concatenated and loaded via `importNavMesh`.
- `z1_cache_0.bin`, `z1_cache_1.bin` — tile-cache parts. Concatenated and loaded via `importTileCache`.

## How they are generated

These files are produced with the following tools:

- <https://github.com/H1emu/h1emu-map-data-extraction> — extracts the map geometry from the game data.
- <https://github.com/H1emu/h1emu-recast> — builds the Recast navmesh and tile cache from the extracted geometry.
