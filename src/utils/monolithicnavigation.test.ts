import assert from "node:assert";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  indexMonolithicCache,
  loadNavigationTransitions,
  resolveNavigationTransitionsPath,
  selectMonolithic64ReferenceCapacity,
  sortTileCacheParts
} from "./monolithicnavigation";

const TSET_MAGIC =
  ("T".charCodeAt(0) << 24) |
  ("S".charCodeAt(0) << 16) |
  ("E".charCodeAt(0) << 8) |
  "T".charCodeAt(0);

function makeCache(layers: Array<{ tx: number; ty: number }>): Buffer {
  const header = Buffer.alloc(92);
  let offset = 0;
  const int = (value: number) => {
    header.writeInt32LE(value, offset);
    offset += 4;
  };
  const float = (value: number) => {
    header.writeFloatLE(value, offset);
    offset += 4;
  };
  int(TSET_MAGIC);
  int(1);
  int(layers.length);
  float(-4096);
  float(-100);
  float(-4096);
  float(25.6);
  float(25.6);
  int(32768);
  int(128);
  float(-4096);
  float(-100);
  float(-4096);
  float(0.2);
  float(0.1);
  int(128);
  int(128);
  float(2);
  float(0.3);
  float(0.9);
  float(1.3);
  int(32768);
  int(20000);

  const entries = layers.map(({ tx, ty }, layer) => {
    const entry = Buffer.alloc(28);
    entry.writeUInt32LE(layer + 1, 0);
    entry.writeInt32LE(20, 4);
    entry.writeInt32LE(0x44544c52, 8);
    entry.writeInt32LE(1, 12);
    entry.writeInt32LE(tx, 16);
    entry.writeInt32LE(ty, 20);
    entry.writeInt32LE(layer, 24);
    return entry;
  });
  return Buffer.concat([header, ...entries]);
}

test("tile-cache parts are sorted numerically", () => {
  assert.deepEqual(
    sortTileCacheParts([
      "z1_cache_10.bin",
      "z1_cache_2.bin",
      "z1_cache_1.bin",
      "z1_cache_0.bin"
    ]),
    ["z1_cache_0.bin", "z1_cache_1.bin", "z1_cache_2.bin", "z1_cache_10.bin"]
  );
});

test("64-bit reference capacity admits the complete fine cache", () => {
  assert.deepEqual(selectMonolithic64ReferenceCapacity(104935), {
    meshMaxTiles: 131072,
    meshMaxPolys: 1048576,
    cacheMaxTiles: 131072
  });
  assert.throws(() => selectMonolithic64ReferenceCapacity(0));
  assert.throws(() => selectMonolithic64ReferenceCapacity(1.5));
});

test("authored transitions follow the selected cache bundle", () => {
  assert.equal(
    resolveNavigationTransitionsPath(undefined, "C:/bundle/collision"),
    join("C:/bundle/collision", "..", "navigationTransitions.json")
  );
  assert.equal(
    resolveNavigationTransitionsPath(
      "C:/override/transitions.json",
      "C:/bundle/collision"
    ),
    "C:/override/transitions.json"
  );
});

test("authored transition files are validated and converted", () => {
  const directory = mkdtempSync(join(tmpdir(), "h1emu-transitions-"));
  const path = join(directory, "navigationTransitions.json");
  try {
    writeFileSync(
      path,
      JSON.stringify([
        {
          name: "front step",
          start: [1, 2, 3],
          end: [4, 5, 6],
          radius: 0.35,
          bidirectional: false
        }
      ])
    );
    assert.deepEqual(loadNavigationTransitions(path, true), [
      {
        name: "front step",
        startPosition: { x: 1, y: 2, z: 3 },
        endPosition: { x: 4, y: 5, z: 6 },
        radius: 0.35,
        bidirectional: false,
        area: 0,
        flags: 1,
        userId: 0x48000000
      }
    ]);
    writeFileSync(path, JSON.stringify([{ name: "bad", start: [1, 2] }]));
    assert.throws(() => loadNavigationTransitions(path, true), /bad/);
    assert.deepEqual(
      loadNavigationTransitions(join(directory, "missing.json"), false),
      []
    );
    assert.throws(
      () => loadNavigationTransitions(join(directory, "missing.json"), true),
      /is missing/
    );
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("split TSET index preserves every layer and column", () => {
  const directory = mkdtempSync(join(tmpdir(), "h1emu-nav64-"));
  try {
    const cache = makeCache([
      { tx: 7, ty: 9 },
      { tx: 7, ty: 9 },
      { tx: 8, ty: 9 }
    ]);
    writeFileSync(join(directory, "z1_cache_0.bin"), cache.subarray(0, 101));
    writeFileSync(join(directory, "z1_cache_1.bin"), cache.subarray(101));
    const indexed = indexMonolithicCache(directory);
    try {
      assert.equal(indexed.layerCount, 3);
      assert.equal(indexed.columns.size, 2);
      assert.equal(indexed.columns.get("7,9")?.length, 2);
      assert.equal(indexed.columns.get("8,9")?.length, 1);
      assert.equal(indexed.mesh.maxTiles, 4);
      assert.equal(indexed.mesh.maxPolys, 1 << 20);
      assert.equal(indexed.bytes, cache.length);
    } finally {
      indexed.store.close();
    }
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("split TSET index rejects truncation", () => {
  const directory = mkdtempSync(join(tmpdir(), "h1emu-nav64-"));
  try {
    const cache = makeCache([{ tx: 1, ty: 2 }]);
    writeFileSync(join(directory, "z1_cache_0.bin"), cache.subarray(0, -1));
    assert.throws(
      () => indexMonolithicCache(directory),
      /truncated tilecache before layer/
    );
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
