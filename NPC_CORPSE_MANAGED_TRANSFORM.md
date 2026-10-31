# Follow-up: client ragdoll starts at the old impact position

## Evidence from the failed in-game test

The previous parser patch did not resolve this incident. Actual `Ragdoll.Stop` packets arrived on gateway channel **0**, so the fixed channel-3 branch was not used by these client reports.

Bear 0x24c073d4bc6aea42 was struck at approximately (-2912.784,54.500,-874.416). The server selected (-2915.880,54.500,-873.570), a 3.209 m separation, with no subsequent overlap transitions into a vehicle. It queued the ordinary PlayerUpdatePosition before StartMultiStateDeath and ManagedObject. About 4.76 seconds later, the authorized client reported ragdoll root (-2912.382,54.820,-876.090), approximately **4.323 m from the corrected server anchor**. This is client-reported root evidence, not a direct measurement of all rendered limbs.

Another bear, 0x07cd15ea0929d581, had server separation of 2.166 m, then a late client Stop near its original impact position. Both cases demonstrate disagreement between the server's placement and the client's ragdoll root. No pose updates were recorded; Stop reports did arrive. The prior assumption that queuing a regular movement packet before death would seed the client's ragdoll was insufficient.

Evidence captured in active checkout: corpse-latest-test.log. Original terrain, road geometry and corpse placement remain unchanged. The exact internal scheduling of the ordinary movement sample is not established; do not infer that every dead-entity movement packet is universally ignored.

## Supported native correction

Read-only static inspection of H:\H1Z1\H1Z1.exe (SHA256 8D49BD11FA04B06DA4B0C9B51977D3888704D1683AFFE83D9E404660CCB1414E) established the ClientUpdate 0x11/subtype 0x23 handler:

- VA 0x140405A42 initializes base 0x11 and subtype 0x23 in the ClientUpdate family dispatcher at 0x140404980.
- Reader 0x14036D220 consumes one-byte base, two-byte subtype, GUID, four position floats, four quaternion floats, boolean and byte. This matches the existing `ClientUpdate.UpdateManagedLocation` schema (45 bytes including opcode).
- At 0x140405AEC it resolves the entity GUID through 0x1403F83F0, which delegates to the entity registry lookup 0x14071EE60.
- The boolean is tested at 0x140405AF4. With true and an existing entity, the branch constructs a position/quaternion transform; the quaternion is normalized or replaced by the native identity fallback.
- At 0x140405BA2 it calls the physics representation's transform setter directly (virtual slot +0x30). Further vector setters at 0x140405BD1 and 0x140405C01 receive zero vectors. There is no species/vehicle-only test before the transform call. This is different from merely queueing a timestamped movement sample.

This establishes a native transform-application path in the supplied build. It does not substitute for seeing a subsequent in-game ragdoll use the new root.

## Source change

Only src/servers/ZoneServer2016/managers/npccorpsemanager.ts changes runtime behavior in this follow-up. Immediately after queuing the existing zero-speed ordinary anchor, and before the caller queues StartMultiStateDeath, it sends ClientUpdate.UpdateManagedLocation to observing clients. Position uses the already validated ground anchor unchanged, with homogeneous W=1. Rotation uses the current NPC yaw as a quaternion, retaining existing rotation if no yaw is available. The explicit apply-transform boolean is true. Each NPC gets independent packet arrays. The same ordering is applied when replaying full data before its death transition.

No corpse deletion/respawn, artificial death delay, additional separation offset, terrain correction, health rule or living NPC pathfinding change is introduced. Species-specific death handling and corpse loot remain intact. Post-death settling still uses the existing path. New trace event `death-transform-queued` identifies the immediate correction; client packet traces now include `reportedRootError` to compare subsequent reports with the server anchor. Rendered overlap is still labelled unobserved.

Other changed files: tests/ragdoll-protocol.test.cjs (all-species ordering and native wire-layout assertions), this report. NPC_CORPSE_PROTOCOL.md records the previous investigation and links to this follow-up.

## Validation

Full and 2016-zone TypeScript builds pass. Oxlint passes. All 94 focused collision/corpse/protocol/scenario tests pass. The real server transport test checks ordinary anchor -> managed transform -> death on the same reliable stream and recipient. It verifies all 45 wire bytes by field offsets, unchanged ground XYZ, W=1, valid current-yaw quaternion, and boolean=1. All four species tests assert that the transform precedes death. The scenario matrix still covers slow/high, uphill/downhill/flat and stopping/continuing vehicles; existing loot/harvest, authorization, multiple corpses and nonfatal impacts pass.

Client visual confirmation is pending for this follow-up. After deployment, a client test must determine whether the corrected native pre-death transform removes embedding. A client Stop root can move naturally during ragdoll simulation, so exact zero reportedRootError is not required; compare its origin and video with server overlap. Do not claim the visuals are verified from these server tests alone.

Rebuild from the active checkout using the existing diagnostic override:

```powershell
docker compose -f docker-compose.yml -f npc-collision.override.yml --profile 2016 up -d --build --no-deps zone-server-2016
docker compose --profile 2016 logs --since=10m zone-server-2016 | Select-String 'NPC-CORPSE'
```

