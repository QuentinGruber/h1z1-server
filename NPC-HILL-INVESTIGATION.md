# Live zombie hill and vehicle investigation — 2026-11-01

## Evidence and limits

The user confirmed that the zombies are naturally spawned. Live, container-local
Node inspector snapshots recorded their FSM states, positions, Detour velocities,
route corners, targets, current animation and movement diagnostics. Captures are
`npc-live-hill-inspection.json` and `npc-live-hill-after-rollback.json`.

The captures showed a zombie in `chase` retaining `Idle`, one vehicle attacker
with others stuck in `chase` roughly three metres from the seated player, and
other zombies remaining in `wander` roughly 27 metres away. Their route corners
also included detours around the vehicle area. This does not prove a separate
static navmesh defect; navmesh generation and obstacle geometry were not changed.

The actual installed client executable matches the archived 2016 executable
(SHA256 `8D49BD11FA04B06DA4B0C9B51977D3888704D1683AFFE83D9E404660CCB1414E`).
Read-only binary analysis identified the native `State_Moving` and
`VelocityLocalZ` control updates, consistent with the extracted zombie MRN graph.
Animation movement is velocity-driven, so forward stance alone does not prove
that the legs are animating. No client binary or extracted asset was modified.

A bounded tilt-only packet experiment modified only the front/side tilt values
for visible zombies, with automatic restoration. The user reported that the
zombies continued gliding. The experiment was restored; no permanent tilt or
terrain changes were made. A positive visual result for the final build has
not yet been established.

## Source corrections

- Removed the unsuccessful use of raw crowd velocity for horizontal position
  prediction. It can disagree with collision-constrained published displacement.
  Prediction again follows published displacement; gait selection separately
  uses zombie horizontal crowd velocity.
- `hasPendingMovementStop()` avoids redundant position/zero-speed publication
  between crowd steps, with a one-crowd-interval limit. Real stops, stalled
  agents, and explicitly collision-constrained steps still publish zero speed.
  Tests execute the actual zone position publisher, rather than only `goTo()`.
- Zombie `Idle` requests no longer send a persistent looping override or retain
  it for later observers. This includes gasser and exploder idle transitions.
- Mounted prey is approached and measured at the nearest point on the existing
  oriented vehicle collision body, rather than the blocked seated-player center.
  Collision bounds, collision response, vehicle impact damage and melee damage
  delivery remain unchanged.
- Zombie attack FSMs stop requesting movement inside melee range. Standard
  melee and gasser melee/spit windups stop steering; the exploder retains its
  existing stop on its explosion windup.
- Zombie listeners periodically hear running engines even without vehicle
  position packets. This reuses the existing movement engine sound values
  (50 metre radius, agitation 3), throttled to the existing 3 second engine timer
  cadence. Wildlife hearing, vision ranges and navigation speed are unchanged.

Production files changed: `entities/npc.ts`, `zoneserver.ts`, and the standard
zombie, gasser and exploder JSM files under `src/servers/ZoneServer2016/`.

## Validation

The final Docker 2016 zone TypeScript build passed. An isolated container ran:

```
node --test /tests/verify-zombie-locomotion.cjs /tests/verify-zombie-vehicle-behavior.cjs
```

All 28 tests passed. Coverage includes level/uphill/downhill packets, walk/run
transitions, stopping, full position-publisher cadence, stalled and blocked steps,
wildlife controls, vehicle attacks from all four sides, rotation/dismount,
engine awareness, persistent Idle suppression and special attack transitions.

These are server and protocol regression results. They do not substitute for
the user's in-game validation of hill animations, bounce, crowd approach and
the final vehicle behavior. No terrain-height, road/foundation avoidance,
navmesh generation, wildlife AI, corpse, damage-balance or login configuration
source was edited by this investigation.

## C8 real-map target projection regression (2026-11-01)

The captured parked-car case exposed a separate demonstrated chase defect:
`getClosestNavPointVec3` searched a 10 metre box using physical road Y.
Detour corridor Y differs from the visible road here, so the nearest 3D polygon
was horizontally displaced. Zombies reached that false goal and remained in
chase 2.562 metres from the vehicle body, outside melee range.

Zombie target projection now first searches within the existing NPC radius in
X/Z, retaining the existing 10 metre vertical extent and broad fallback for
missing local polygons. Failed queries never submit an invalid target. Standard,
gasser and exploder chase requests use this helper. No terrain sampling,
navmesh generation, obstacle clearance or physical collision bounds changed.

`verify-mounted-hill-nav.cjs` runs the actual map, crowd, collision manager,
position publisher and zombie FSM at the captured C8 vehicle pose. Results:

- Original lookup and original clearance: zero hits, stuck chase at 2.562 m.
- Reduced padding alone: zero hits, identical stuck chase (negative control).
- Corrected production lookup with original clearance: reaches attack, one hit,
  body range 0.682 m. Ground-height and no-penetration assertions pass.

Clean Docker 2016 build passed. All 29 focused locomotion/vehicle/projection
regression tests passed. These establish server behavior only; rendered walking,
running and bounce still require in-game verification. Earlier screenshots and
the tilt-only experiment did not demonstrate visual success.

## Confirmed animation cause and permanent fix

A bounded live test zeroed only the outgoing zombie `verticalSpeed`, preserving
XYZ, tilt, horizontal prediction, ground height and AI. The user observed legs
animating uphill/downhill. The wrapper restored after 60 seconds; animations
stopped again. After the same change was built into `Npc.goTo` and the zone
restarted, the user confirmed sustained animation working after the restarts.
The 2016 client does not treat slope Y velocity as ordinary grounded zombie
locomotion. Zombie verticalSpeed is now zero; actual slope positions and the
existing NpcGroundMotion calculations are preserved. Wildlife keeps its prior
vertical prediction. Earlier signed-vertical packet expectations were insufficient
and were corrected to test the demonstrated client behavior.

## Remaining vehicle crowd work

The actual captured 24-chaser crowd reproduces 10 vehicle attackers, with others
stalled/queuing. Reducing padding, ranking by horizontal distance, suppressing
repeated requests, and larger approach/slot rewrites did not resolve the crowd.
Some experimental slot routes failed no-penetration assertions and were rejected;
none of those rewrites or test-only rotation guards entered production source.

A control removing the static vehicle nav carve (retaining passive avoidance
markers and physical sweeps) increased attackers to 16/24. Removing avoidance
markers alone left the original 10/24. The shared static exclusion includes the
largest creature's clearance and pitched-body margins; it can place the endpoint
outside zombie melee range. The narrow implementation now lets standard, gasser
and exploder pursuit/attack refresh a one-second approach lease on the target
occupied vehicle. During that lease the existing moving-vehicle avoidance mode
is used. Its physical bounds, collision sweeps and impact damage are unchanged.
The parked carve returns when pursuit stops refreshing the lease. Unoccupied
vehicles and wildlife FSMs do not request this exception.

Additional production file for this vehicle fix:
`src/servers/ZoneServer2016/managers/npccollisionmanager.ts` (navigation obstacle
lifetime only). Other edits are the NPC refresh helper and the three zombie FSM
player-target lookups. Terrain, road/foundation geometry, navmesh generation,
collision shape/damage, corpse and configuration source remain unchanged.

## Final vehicle-approach validation and deployment

The final 2016 Docker build passed. All 30 focused packet, state-transition,
vehicle-target, projection and pursuit-scope tests passed. The actual-source
24-chaser replay improved from 10 attackers to 14, with zero physical vehicle
penetrations and unchanged ground heights. Avoidance markers remained active,
and the parked exclusion returned after the pursuit lease expired. This is a
measured partial crowd improvement, not proof that every queued zombie is fixed.

The existing real-map four-species vehicle-navigation test also passed: zombie,
bear, wolf and deer all routed around the vehicle without penetration. Maximum
recorded ground-height error was 0.00000190735 metres. Actual zombie/bear/wolf
FSMs reached their attack states and delivered a hit; deer entered flee and
completed its escape. Only a missing unmounted-client stub was added to that
test fixture; production wildlife code was not edited.

The tested vehicle-approach image was deployed to the zone service only. Live
visual validation of queue/stagger behavior is pending. The animation fix was
already confirmed working in-game by the user before this deployment.

## Closer body approach and stable attack transitions

The subsequent live screenshot/capture still showed the stand-off crowd. The
FSM used melee damage reach (2 m) as its movement stopping distance. That left
zombies attacking from the outer edge of reach instead of closing to the shell.
Mounted-player pursuit now uses a separate body approach distance derived from
the unchanged humanoid turning envelope/crowd radius and the vehicle tilt in the
approach direction. Damage reach remains unchanged. The resume threshold has one
crowd radius of hysteresis to avoid rapid chase/attack switching after small
crowd displacements. Standard zombie ReachPlayer also stops steering immediately.
Gassers finish the close approach before melee/gas windup; their damage/effects
and on-foot behavior are preserved. Exploder damage/death handling is unchanged.

A full 34-standard-zombie replay includes the already stationary inner group
from npc-live-current-surround.json, not only chasers. It exposed facing-only
updates turning a physically stopped zombie into the vehicle. Npc goTo/lookAt
now retain the previous safe facing when the new facing would introduce overlap
with the pursued vehicle. Existing collision envelopes are read-only; the
translation collision manager, impact damage and terrain code are untouched by
this correction. The check uses the cached pursued vehicle ID, avoiding scans
of every world vehicle for each NPC movement/attack update.

The replay passed no-penetration and exact-ground assertions. Median final
body gap among zombies that attacked decreased from 1.749 m to 0.986 m. Attacker
counts were 25/34 before and 23/34 after; remaining crowd waiting is not claimed
resolved. All 32 focused regressions passed before the final performance-bound
rebuild, including mounted approach stopping/hysteresis, safe facing packets,
unchanged wildlife facing and the eight original slope movement scenarios.

Final performance-bounded build and validation passed again: 32 focused tests,
full 34-zombie replay, and four-species real-map vehicle navigation/FSM checks.
The final replay reproduced the same 1.749 m to 0.986 m median body-gap change
with no penetration or ground-height failures. The zone-only deployment is up;
close-door surround and staggering remain pending in-game feedback. Files changed
for this closer-stop correction are entities/npc.ts and jsms/zombie.jsm.ts,
jsms/gasser.jsm.ts, jsms/exploder.jsm.ts. No navigation generation, terrain,
vehicle collision geometry or impact damage source was changed in this correction.

## Confirmed door-side navigation blocker (C8 end-cluster capture)

The closer-stop live test remained negative. A fresh capture is saved as
npc-live-end-clusters.json. The isolated reproducer primes collision history
from authoritative published NPC positions (not unpublished crowd positions).
This is necessary to avoid injecting an invalid initial step in the test fixture.

The unchanged current navigation replay has 33 standard zombies all at the
vehicle ends, 19 attackers, and 1423 blocked movement publications in 60 seconds.
A distributed attack-point/safe-route experiment did not establish a surround.
Correcting avoidance-marker Y alone also left the same 1423 rollbacks and the
same end-only arrangement. Neither experiment was applied to production source.

The coverage test at vehicle position [-1991.7700,52.5400,-2233.7600] found:

- Door-side point at world [-1991.7700,52.7406,-2235.7600]: valid road collision
  (RoadStraightSlope_512.adr), no cached-nav polygon in a 0.3 m X/Z search.
- Opposite door-side point at [-1991.7700,52.7406,-2231.7600]: valid road collision,
  no cached-nav polygon in the same search.
- Search vertical half-extent is 10 m, so this is not merely a Y search miss.
- The vehicle's static obstacle was removed and confirmed absent.
- The original standalone navmesh initially covered one of these points, but
  normal tile-cache rebuilding removed that coverage. Importing and using the
  navmesh paired with the existing cache also lacks both door-side surfaces,
  before any vehicle obstacle is added. This isolates the cached navigation
  data as the blocker, not only target selection or a persistent car exclusion.

Evidence: scripts/verify-door-nav-coverage.cjs,
scripts/verify-paired-nav-coverage.cjs, npc-door-nav-coverage.json,
npc-paired-nav-coverage.json, and npc-door-nav-coverage.svg. These run only in
isolated containers; live navmesh data and source were not altered this turn.

The next required work is a targeted repair of the affected road navigation
region and matching cache, followed by road/foundation, wildlife, vehicle-impact,
and crowded-surround regression validation. The original user scope expressly
forbids Recast generation/horizontal navigation changes, so approval for that
specific scope exception was requested. The animation fix and current running
server are preserved while awaiting that decision. No visual surround success
is claimed.
