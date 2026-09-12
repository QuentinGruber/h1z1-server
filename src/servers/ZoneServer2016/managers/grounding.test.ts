import assert from "node:assert";
import test from "node:test";
import {
  decodeHeightmapPixel,
  sampleTerrainHeight,
  selectGroundSurface
} from "./grounding";

function encodeHeight(height: number): [number, number, number, number] {
  const units = Math.round(height * 32) + 4096;
  return [units >> 8, units & 0xff, 0, 255];
}

function heightmap(
  topLeft: number,
  topRight: number,
  bottomLeft: number,
  bottomRight: number
): Uint8ClampedArray {
  return new Uint8ClampedArray([
    ...encodeHeight(topLeft),
    ...encodeHeight(topRight),
    ...encodeHeight(bottomLeft),
    ...encodeHeight(bottomRight)
  ]);
}

test("heightmap pixels use the native server encoding", () => {
  const [red, green] = encodeHeight(123.25);
  assert.equal(decodeHeightmapPixel(red, green), 123.25);
});

test("terrain sampling preserves exact pixels and smooth slopes", () => {
  const data = heightmap(10, 11, 12, 13);

  assert.deepEqual(sampleTerrainHeight(data, 2, 2, 1, -1), {
    height: 10,
    min: 10,
    max: 10,
    mode: "nearest"
  });
  assert.deepEqual(sampleTerrainHeight(data, 2, 2, 0.5, -0.5), {
    height: 11.5,
    min: 10,
    max: 13,
    mode: "bilinear"
  });
});

test("terrain sampling does not blur across a cliff", () => {
  const data = heightmap(0, 10, 0, 10);

  assert.equal(sampleTerrainHeight(data, 2, 2, 0.5, -0.5, 9)?.height, 10);
  assert.equal(sampleTerrainHeight(data, 2, 2, 0.5, -0.5, 1)?.height, 0);
});

test("ground selection stays on the current vertical layer", () => {
  assert.deepEqual(
    selectGroundSurface({
      terrainY: 10,
      structureY: 11,
      navY: 10.5,
      currentY: 10.5
    }),
    { height: 10.5, source: "navmesh" }
  );
  assert.deepEqual(
    selectGroundSurface({
      terrainY: 15,
      structureY: null,
      navY: 25.75,
      currentY: 25.5
    }),
    { height: 25.75, source: "navmesh" }
  );
});

test("ground selection follows a connected navmesh stair away from terrain", () => {
  assert.deepEqual(
    selectGroundSurface({
      terrainY: 23.4,
      structureY: 23.4,
      navY: 24.2,
      currentY: 23.65
    }),
    { height: 24.2, source: "navmesh" }
  );
  assert.deepEqual(
    selectGroundSurface({
      terrainY: 23.4,
      structureY: 23.4,
      navY: 23.8,
      currentY: 24.35
    }),
    { height: 23.8, source: "navmesh" }
  );
});

test("ground selection rejects buried and implausibly distant polygons", () => {
  assert.deepEqual(
    selectGroundSurface({
      terrainY: 10,
      structureY: 8,
      navY: 9,
      currentY: 9
    }),
    { height: 10, source: "terrain" }
  );
  assert.deepEqual(
    selectGroundSurface({
      terrainY: 23,
      structureY: null,
      navY: 35,
      currentY: 23
    }),
    { height: 23, source: "terrain" }
  );
  assert.deepEqual(
    selectGroundSurface({
      terrainY: 15,
      structureY: null,
      navY: 25,
      currentY: 31
    }),
    { height: 31, source: "current" }
  );
});

test("ground selection falls back through terrain, navmesh, and current Y", () => {
  assert.deepEqual(
    selectGroundSurface({
      terrainY: null,
      structureY: null,
      navY: 7,
      currentY: 5
    }),
    { height: 7, source: "navmesh" }
  );
  assert.deepEqual(
    selectGroundSurface({
      terrainY: null,
      structureY: null,
      navY: null,
      currentY: 5
    }),
    { height: 5, source: "current" }
  );
});
