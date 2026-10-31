# Persistent vehicle/corpse clipping: protocol investigation

Follow-up: the subsequent client test still clipped. Client Stop packets arrived on channel 0 and reported roots near the old impact position. See NPC_CORPSE_MANAGED_TRANSFORM.md for the native handler evidence and the pre-death managed-transform correction. Statements below describe the earlier parser investigation and its validation limits.

## Established defect and correction

The short-circuit gateway channel (3) looked up `Packets[0xce]` and skipped three bytes. There is no such packet entry. The actual 2016 ragdoll definitions are CE0101 (UpdatePose), CE0202 (Stop), etc. Consequently these packets returned null before dispatch. Resolve their complete opcode using the existing variable-length resolver, just as the world channel does. Authentication and corpse-manager checks remain in the existing handlers.

Earlier tests invoked handlers directly and therefore missed this defect. New regression tests pack complete wire packets, parse gateway channels 1 and 3, and run the resulting packets through the real handlers for zombie, bear, deer and wolf. They also check unauthorized senders and immutable, lootable corpse anchors.

**This proves a broken server receive path, not that every reported visual clipping incident was caused by that path.** The captured live log had no NPC-CORPSE-POSE entries, but this cannot distinguish discarded packets from a client that never emitted those packets.

## Death pipeline and packet ordering

Managed vehicle movement validates ownership and timing, then sweeps previous-to-current vehicle geometry against living NPC dimensions. Lethal damage carries the support contact, normal, swept time, speed and geometry into the shared NPC death method. Damage marks the NPC dead and removes its living crowd agent. Existing corpse placement chooses a terrain/road-valid position outside the impact and anticipated vehicle sweep. The same NPC entity is retained, reindexed and receives loot. Dead NPCs are excluded from living collision candidates; damage is guarded against repeated death.

The position anchor is queued before StartMultiStateDeath and ManagedObject. The actual ZoneServer packing and gateway send methods were exercised by a wire-level transport test: both anchor and death use the same Reliable stream, anchor first. The gateway wraps outgoing packets on its world channel. This establishes server queue order only. It does not establish that the client's interpolator applies the movement transform before its death animation starts.

The existing authorized ragdoll pose/stop handlers are retained. No unverified immediate teleport, knockback, physics impulse, death delay, new offset or larger separation distance was added. Geometry selection, damage calculations, horizontal navigation, terrain sampling and road correction are unchanged.

## Client examined and limits

Read-only static inspection used H:\H1Z1\H1Z1.exe, SHA256 `8D49BD11FA04B06DA4B0C9B51977D3888704D1683AFFE83D9E404660CCB1414E` (54,779,328 bytes). Packet identifier strings for RagdollBase, StartMultiStateDeath, PlayerUpdatePosition and UpdateManagedLocation are present. Their enum registration references alone do not establish live handler behavior. Full native ragdoll transform handling was not established. No game binary was patched, injected into or attached to a debugger.

Approach A's existing position-before-death queue order is verified. Whether it is visually effective is unverified. Approach B's server packet definitions and corrected inbound path are verified; whether this client accepts a corpse root correction while locally simulating a ragdoll is unverified. No assertion that it does, or that it ignores dead movement, is justified by these tests.

The previous live trace contained a lethal bear impact at 15.6057 m/s: original root approximately (-2935.932,54.500,-916.508), separated root (-2933.580,54.670,-918.570), distance 3.128 m. Other recorded bear separations were 4.606 m and 3.697 m. Server relocation already happened while visual clipping persisted. Additional separation offsets would not establish the cause.

## Targeted diagnostics

With `NPC_COLLISION_DIAGNOSTICS=1`, each lethal impact produces `[NPC-CORPSE-TRACE]` records, with independent monotonic ordinal and server time per corpse. Records include vehicle ID/previous and current position/heading/pitch/roll, speed and velocity; NPC ID/species/original position; swept contact and time; endpoint penetration depth; selected ground position; queued anchor/death/managed packets; incoming ragdoll packet/channel/sender/reported root; authorized pose acceptance; watchdog versus client settling; final Stop position; and subsequent server overlap transitions.

The contact is labelled as the NPC support point on the swept contact normal, not an exact mesh triangle intersection. Penetration depth is computed by OBB SAT for diagnostics only; null means separation, zero contact. Corpse overlap uses its conservative authored-body clearance envelope, not a measured rendered ragdoll. Overlap checks are bounded to ten seconds after death and log transitions only. They never alter movement or response. Incoming packet types are logged once per corpse. Removal cancels diagnostic state.

`clientVisibleOverlap` explicitly remains unobserved. Incoming root positions are client reports, not measurements of ragdoll limbs. Distinguish this from server overlap before interpreting a client screenshot.

## Changed files

- src/protocols/h1z1protocol.ts: complete ragdoll opcode resolution on channel 3.
- src/utils/collisiongeometry.ts: diagnostic SAT penetration-depth helper; existing sweep unchanged.
- src/utils/npccorpseplacement.ts: optional impact vehicle-pose metadata only; placement unchanged.
- src/servers/ZoneServer2016/managers/npccollisionmanager.ts: capture pose metadata and call bounded overlap observation.
- src/servers/ZoneServer2016/managers/npccorpsemanager.ts: bounded fatal-impact, pose, settlement and overlap traces.
- src/servers/ZoneServer2016/entities/npc.ts: trace queued death/manager packets.
- src/servers/ZoneServer2016/zonepackethandlers.ts: trace incoming impact-corpse packets, retaining authorization.
- tests/ragdoll-protocol.test.cjs: wire/parser/handler, real transport ordering and diagnostic tests.
- tests/npc-corpse-scenarios.test.cjs: 48 species/speed/grade/stopping combinations and four stationary-vehicle cases.
- NPC_CORPSE_PROTOCOL.md: this report.

## Validation and remaining client test

Both full and 2016-zone TypeScript builds pass. Initial diagnostic typing errors were corrected. Oxlint and changed-file formatting pass. Twelve new protocol/diagnostic tests and 52 additional scenario tests pass. Existing collision/corpse tests pass; the final full suite passed 240 tests, zero failures, five skips (existing PluginManager fixture excluded). Six actual-map corpse-placement cases pass, including road slopes, construction and parked-car uncarving. All four actual NPC navigation state-machine cases pass.

Server tests cover low/high impacts, all species, continuing/stopped vehicles, raised sloping roads, foundations, multiple deaths, nonfatal navigation, authorization, loot/harvest and independent corpse anchors. Stationary vehicles remain non-damaging under the existing collision rules; no artificial fatal stationary impact was introduced. These are server simulations, not in-game visual tests.

After deployment, test all four species with slow/high impacts, stopping and continuing, uphill/downhill. Compare the ordinal trace with video/screenshots. A channel-3 received/authorized pose establishes that the corrected receive path is used. A watchdog without any received pose does not. If server overlap is empty while visible limbs remain inside the car, the remaining issue is client simulation/animation and requires a supported native transform/ownership solution; this patch does not claim to have established that solution.

Rebuild from the active server directory:

```powershell
docker compose -f docker-compose.yml -f npc-collision.override.yml --profile 2016 up -d --build --no-deps zone-server-2016
docker compose --profile 2016 ps -a
docker compose --profile 2016 logs --since=10m zone-server-2016 | Select-String 'NPC-CORPSE|Exception|Error'
```

The existing override enables the diagnostics. Disable NPC_COLLISION_DIAGNOSTICS after collecting the client evidence. No base Compose, config, authentication, terrain assets or client files are changed.

Deployment completed: zone image rebuilt and recreated, server ready, zone 2 registration confirmed by both zone and login logs. MongoDB and login remain healthy. Both corrected opcode round trips also passed inside the running zone image. Startup retains an existing warning about a destroyed effect with modelId undefined; it did not prevent initialization. No post-deployment client reproduction was performed.

Validation evidence in the staging checkout: persistent-clipping-suite-final.log, persistent-clipping-protocol.log, persistent-clipping-scenarios.log, persistent-clipping-map.log, persistent-clipping-navigation.log. Docker build output is npc-corpse-protocol-docker-build.log in the active checkout. Installation uses a hash-checked manifest and backs up replaced files under .npc-corpse-protocol-backup-*.
