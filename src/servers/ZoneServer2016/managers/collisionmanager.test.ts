// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2026 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

import assert from "node:assert";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { CollisionManager } from "./collisionmanager";

type MeshFixture = {
  kind: number;
  positions: number[];
  indices: number[];
};

type InstanceFixture = {
  meshIndex: number;
  transformAndBounds: number[];
};

function buildCollisionFixture(
  meshes: MeshFixture[],
  instances: InstanceFixture[]
): Buffer {
  const parts: Buffer[] = [];
  parts.push(Buffer.from("H1COL2\0\0", "latin1"));
  const header = Buffer.alloc(12);
  header.writeUInt32LE(2, 0);
  header.writeUInt32LE(meshes.length, 4);
  header.writeUInt32LE(instances.length, 8);
  parts.push(header);

  for (const mesh of meshes) {
    const meshHeader = Buffer.alloc(9);
    meshHeader.writeUInt8(mesh.kind, 0);
    meshHeader.writeUInt32LE(mesh.positions.length / 3, 1);
    meshHeader.writeUInt32LE(mesh.indices.length, 5);
    parts.push(meshHeader);
    parts.push(Buffer.from(new Float32Array(mesh.positions).buffer));
    parts.push(Buffer.from(new Uint32Array(mesh.indices).buffer));
  }

  parts.push(
    Buffer.from(
      new Uint32Array(instances.map((instance) => instance.meshIndex)).buffer
    )
  );
  parts.push(
    Buffer.from(
      new Float32Array(
        instances.flatMap((instance) => instance.transformAndBounds)
      ).buffer
    )
  );
  return Buffer.concat(parts);
}

test("CollisionManager grounds NPCs and exposes solid obstacles", () => {
  const fixtureDir = mkdtempSync(join(tmpdir(), "h1z1-collision-"));
  const fixturePath = join(fixtureDir, "z1_collision.bin");
  try {
    const plane = {
      positions: [-1, 1, -1, 1, 1, -1, 1, 1, 1, -1, 1, 1],
      indices: [0, 2, 1, 0, 3, 2]
    };
    const wall = {
      positions: [-1, 0, 0, 1, 0, 0, 1, 2, 0, -1, 2, 0],
      indices: [0, 1, 2, 0, 2, 3]
    };
    writeFileSync(
      fixturePath,
      buildCollisionFixture(
        [
          { kind: 0, ...plane },
          { kind: 1, ...plane },
          // Building actors are kind 0 because they contain walkable floors,
          // but their wall triangles must still block projectiles.
          { kind: 0, ...wall }
        ],
        [
          {
            meshIndex: 0,
            transformAndBounds: [
              0, 0, 0, 0, 0, 0, 1, 1, 1, 1, -1, 1, -1, 1, 1, 1
            ]
          },
          {
            meshIndex: 1,
            transformAndBounds: [
              10, 0, 10, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 20, 4, 20
            ]
          },
          {
            meshIndex: 2,
            transformAndBounds: [
              0, 0, 0, 0, 0, 0, 1, 1, 1, 1, -1, 0, -0.05, 1, 2, 0.05
            ]
          }
        ]
      )
    );

    const manager = new CollisionManager();
    manager.load(fixturePath);

    assert.strictEqual(manager.loaded, true);
    assert.strictEqual(manager.groundRaycast(0, 0, 0), 1);
    assert.strictEqual(manager.groundRaycast(10, 10, 0), null);
    assert.strictEqual(
      manager.segmentBlocked(
        new Float32Array([0, 1, -2, 1]),
        new Float32Array([0, 1, 2, 1])
      ),
      true
    );
    assert.strictEqual(
      manager.segmentBlocked(
        new Float32Array([3, 1, -2, 1]),
        new Float32Array([3, 1, 2, 1])
      ),
      false
    );
    assert.deepStrictEqual(manager.obstaclesNear(10, 10, 20), [
      {
        id: 1,
        cx: 10,
        cy: 2,
        cz: 10,
        hx: 8,
        hy: 2,
        hz: 8
      }
    ]);
  } finally {
    rmSync(fixtureDir, { recursive: true, force: true });
  }
});
