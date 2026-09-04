import assert from "node:assert";
import test from "node:test";
import { ZoneServer2016 } from "./zoneserver";

type PathfindingInternals = {
  clearPathfindingAgentReferences(): void;
  releaseAuthoritativeCrowdAgents(): void;
};

const pathfindingInternals =
  ZoneServer2016.prototype as unknown as PathfindingInternals;

test("NPC movement follows the selected authored vertical layer", () => {
  let replicatedPosition: Float32Array | undefined;
  const npc = {
    state: { position: new Float32Array([10, 25, 10, 1]) },
    navAgent: { interpolatedPosition: { x: 11, y: 25.75, z: 12 } },
    goTo(position: Float32Array) {
      replicatedPosition = position;
    }
  };
  const server = {
    navManager: { crowdHealthy: true, removeAgent: () => true },
    _npcs: { npc },
    _characters: {},
    _vehicles: {},
    getGroundInfo(_position: Float32Array, navY: number, currentY: number) {
      assert.equal(navY, 25.75);
      assert.equal(currentY, 25);
      return { selection: { height: 25.75, source: "navmesh" } };
    },
    releaseAuthoritativeCrowdAgents:
      pathfindingInternals.releaseAuthoritativeCrowdAgents
  };

  ZoneServer2016.prototype.updatePathfindingPositions.call(server);

  assert.ok(replicatedPosition);
  assert.deepEqual(Array.from(replicatedPosition), [11, 25.75, 12, 0]);
});

test("players and vehicles are removed from the native NPC Crowd", () => {
  const playerAgent = { agentIndex: 8 };
  const vehicleAgent = { agentIndex: 9 };
  const character = { navAgent: playerAgent };
  const vehicle = { navAgent: vehicleAgent };
  const removed: object[] = [];
  const server = {
    navManager: {
      crowdHealthy: true,
      removeAgent(agent: object) {
        removed.push(agent);
        return true;
      }
    },
    _npcs: {},
    _characters: { character },
    _vehicles: { vehicle },
    releaseAuthoritativeCrowdAgents:
      pathfindingInternals.releaseAuthoritativeCrowdAgents
  };

  ZoneServer2016.prototype.updatePathfindingPositions.call(server);

  assert.deepEqual(removed, [playerAgent, vehicleAgent]);
  assert.equal(character.navAgent, undefined);
  assert.equal(vehicle.navAgent, undefined);
});

test("unhealthy Crowd state invalidates every retained agent reference", () => {
  const staleAgent = { agentIndex: 3 };
  const npc = { navAgent: staleAgent };
  const character = { navAgent: staleAgent };
  const vehicle = { navAgent: staleAgent };
  const server = {
    navManager: { crowdHealthy: false },
    _npcs: { npc },
    _characters: { character },
    _vehicles: { vehicle },
    clearPathfindingAgentReferences:
      pathfindingInternals.clearPathfindingAgentReferences
  };

  ZoneServer2016.prototype.updatePathfindingPositions.call(server);

  assert.equal(npc.navAgent, undefined);
  assert.equal(character.navAgent, undefined);
  assert.equal(vehicle.navAgent, undefined);
});
