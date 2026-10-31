# NPC synchronized motion investigation (2026-10-31)

## Established defect and correction

`NavManager.updt()` called Recast with `maxSubSteps=1`. Every late callback
therefore advanced every agent by only 1/60 s, accumulating simulation debt.
The packet animation speed still came from instantaneous crowd velocity, even
when the crowd had advanced much less than the real packet interval.
The simulation clock also began before navmesh loading finished.

Real Z1 navmesh reproduction, 60 callbacks at 50 ms (3 seconds total):

| Step limit | Simulated time | Backlog | Agent travel |
|---|---:|---:|---:|
| Previous: 1 | 1.000 s | 2.000 s | 1.616455 m |
| Recast default: 10 | 3.000 s | <1e-15 s | 5.615479 m |

The correction uses the pinned library's default bounded catch-up, keeping
fixed 1/60-second physics steps, and resets the clock after loading the crowd.
An integration test through the actual `NavManager.updt()` also catches up
after a 500 ms delay, with no call executing more than ten substeps.

The first live deployment then exposed the larger blocking source: a 356 ms
movement-publication frame and 16.38 seconds of accumulated crowd debt while
world NPCs became active. In the same frame a flat-ground control remained
at exactly Y=23.5, with no movement packet submitted. After warm-up the crowd
recovered, demonstrating intermittent shared stalls rather than shared Y state.

A reproduction using 803 real spawn points identified synchronous full-tile
triangle-bin rebuilding on terrain cache misses as the dominant terrain query
cost. The correction builds only the requested cell's candidate list and
caches it; exact barycentric intersections and upper-surface selection are
unchanged. Warm-frame costs in the same 12-frame benchmark fell from 51–146 ms
to 37–75 ms; cold-frame cost fell from 1474 ms to 903 ms. All twelve height
sums matched, and 474 individual height-and-slope comparisons matched exactly,
including positive/negative tile and cell boundaries. This reduces stalls;
it does not make cold synchronous tile decoding asynchronous or guarantee a
frame budget on every machine.

This is a proven shared simulation/animation timing defect, **not proof of the
reported client-rendered vertical bouncing or downhill gliding being resolved**.
There is no client capture establishing that causal link. No further damping,
height offsets, road geometry edits, or route algorithm changes were made.

## State and replication audit

Terrain/road queries return fresh sample objects, `npcNavToGame()` allocates
each position, and each NPC owns its `NpcGroundMotion` state. The crowd's
position accessor returns an individual position. Position packets include
the individual transient ID, are packed synchronously into new buffers, and
are then queued for the clients observing that entity. No shared mutable
height, velocity, position, or filter state was found in this pipeline.

The three-entity regression runs actual geometry samples through `Npc.goTo()`
and the full `PlayerUpdatePosition` encoder and decoder. An uphill road NPC,
downhill road NPC, and stationary NPC on a measured horizontal high-ground
terrain triangle produce identical samples and encoded packets when run
together versus in isolation: 300 concurrent samples and 300 controls.
Stationary Y never changes; downhill velocities never have an upward sign;
previously packed buffers retain identical bytes. X/Z and authoritative Y
remain exactly the original geometry-derived Float32 values.

This excludes cross-NPC aliasing in the exercised path; it does not exclude
an unobserved client interpolation, animation, or other runtime defect.

## Temporary live diagnostics

`NPC_MOTION_TRACE=1` enables `[NPC-MOTION-FRAME]` logs for ten minutes after
startup, at most once per second. The diagnostic override enables this.
Each record samples available uphill, downhill, stationary-flat and level
roles from the same publication frame, preferring NPCs visible to a client
and retaining distant controls when no visible NPC fills a role. It reports ID, current/previous XYZ,
terrain/road/navmesh heights, chosen surface/target/final Y, elapsed time,
observed and packet vertical velocity, horizontal packet speed, packet
timestamp, submission, and recipient count. `packetSent` means queued to at
least one recipient, **not confirmed received/rendered by the game**.
Frame duration/interval, crowd update duration/elapsed time and crowd backlog
are recorded. Missing roles are omitted rather than fabricated; a real client
must bring the desired NPCs into the test scenario. Diagnostics never move NPCs.

Capture while reproducing with a client:

```cmd
docker compose -f docker-compose.yml -f road-diagnostics.override.yml --profile 2016 up -d --build --no-deps zone-server-2016
docker compose --profile 2016 logs --since=10m zone-server-2016 > npc-motion-live.log
```

The trace is map-wide so it can include flat-ground controls away from the
hill. The older, more expensive regional provenance trace is disabled in this
override to avoid running both traces simultaneously. Neither production movement nor timing corrections contain Hemingway
coordinates. To restart the ten-minute capture, recreate the zone container.
To disable it, recreate using only the base Compose file:

```cmd
docker compose --profile 2016 up -d --force-recreate --no-deps zone-server-2016
```

## Files

- `src/utils/recast.ts`: bounded catch-up, post-load clock reset, optional timing metrics.
- `src/utils/terrainheight.ts`: build/cache candidate bins only for requested cells.
- `src/utils/npcmotiontrace.ts`: per-entity, correlated frame diagnostics.
- `src/servers/ZoneServer2016/entities/npc.ts`: diagnostic packet time/recipient count.
- `src/servers/ZoneServer2016/zoneserver.ts`: diagnostic hooks; broadcast returns recipient count.
- `road-diagnostics.override.yml`: enables temporary frame trace.
- `scripts/verify-crowd-clock.cjs`: real Recast timing reproduction and manager integration.
- `scripts/verify-independent-npcs.cjs`: concurrent versus isolated geometry/motion/wire test.
- `scripts/profile-terrain-frames.cjs`: real-spawn benchmark.
- `scripts/verify-terrain-index.cjs` and `scripts/fixtures/terrainheight-pre-sync.ts`: exact comparison against the previous index.
- `terrain-frame-before.json`, `terrain-frame-after.json`: benchmark measurements.
- `npc-independent-validation.json`: all 300 concurrent samples and encoded packets.
- `npc-sync-live.log`: first-deployment trace exposing the shared stalls.
- `npc-sync-final-live.log`, `npc-sync-final-live-summary.json`: final live evidence and summary.
- This report.

## Checks

- Full TypeScript build, 2016 zone build, test build and repository Oxlint pass.
- Test suite: 103 passed, 5 skipped, zero failures, with the previously broken
  `PluginManager` fixture excluded using `--test-skip-pattern '^PluginManager$'`.
- Real foundation obstacle: direct ray blocked, foundation avoided, target
  reached, 562 valid ground samples.
- Paired AI/navigation regression: both road chases pass; 22/24 routes pass;
  two routes are also blocked in the unchanged baseline. 5,630 ground samples,
  420 zombie attack hits, maximum ground error 0.000003815 m.
- Independent NPC and packet regression and real crowd clock regression pass.
- An initial attempt to use ESLint failed because it is not installed and the
  registry was inaccessible. The project's configured linter is Oxlint; that
  check subsequently passed.

## Final deployment and live check

The final Docker image compiled successfully, the zone was recreated and
reported ready, and Zone 2 registered with `login-server:1110`. MongoDB and
login were healthy, and the zone was running. The config bind mount and
original terrain/road assets were preserved. Backups are under
`.npc-sync-backup-20261031-181216`, `.npc-sync-index-backup-20261031-181901`
and `.npc-sync-index-backup-20261031-182028` in the active source.

The saved final capture contains 49 frame records, 136 NPC samples and 24
stationary-flat samples. None of the stationary samples changed Y, no downhill
sample advertised positive vertical velocity, and maximum selected-ground
rounding error was 0.0000114441 m. The maximum publication frame was 316.92 ms
during warm-up; the last ten had maximum 157.43 ms and maximum crowd backlog
0.015 seconds, ending at 0.00233 seconds. Cold terrain reads can still delay
a frame; this is not a guarantee of stall-free operation. No recurring
connection exception, uncaught exception or range error appeared in this capture.

There were **zero packet recipients** during this run: no game client was
connected. These measurements establish independent server heights and
corrected timing under the tested conditions; **the precise cause of the
reported synchronized client-rendered bouncing and downhill gliding remains
unconfirmed until a client reproduces it with this trace**. The user elected
to perform the client test after this task finishes. The trace expires ten
minutes after startup; recreate the zone with the override above to renew it.

Docker emitted dependency audit warnings (one high severity production
dependency; six findings in the build dependency tree). Builds succeeded;
dependency upgrades were not mixed into this movement investigation.
