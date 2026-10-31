Login and zone registration repair — 2026-10-31
===============================================

AI-assisted diagnosis, implementation and validation by Codex.
Active checkout: C:\Users\Nightcore\Downloads\h1z1-2016-complete-patched-server\h1z1-server-0.50.0
Original-file backups: .login-fix-backup-20261031-150451

Observed causes
---------------

At the start of this investigation the accessible Docker engine had only the
zone-server-2016 container. MongoDB and login-server were absent, despite the
earlier reported Up state. They were started using the existing Compose config.

After starting dependencies, the actual login application listened on UDP 1115
(game login), UDP 1110 (legacy zone transport), and TCP/WS 1110 (authenticated
zone transport). These listeners were verified via /proc/net/udp and tcp6.
Docker DNS resolved login-server to 172.18.0.3 and TCP 1110 was reachable from
the zone. No port change or host publication of internal port 1110 was needed.

The running bridge-network zone selected legacy LoginConnectionManager because
LZ_SERVER_SECRET was unset. Its SessionRequest was subject to source-IP
whitelisting against MongoDB servers.serverAddress. That record advertised
127.0.0.1:1117, while the container source IP was 172.18.0.4. Those identities
cannot match. Additionally, the legacy client compares an incoming numeric
source IP against the configured hostname string, login-server. Its original
retry path throws after ten unanswered attempts; a container can remain Up
under the global uncaught-exception handler while registration is absent.

The original CharacterLoginRequest called askZone(), which returns numeric 0
when no registered zone exists, a request times out, or packing/sending throws.
It then treated that 0 as ConnectionAllowed and read .status/.rejectionFlag.
The missing rejection flag selects the generic "old version" client message.
This is not evidence of an actual game/server version mismatch. The string
onCharacterLogin does not occur in server source; the supplied "dispatch game
event" line is a client-side event label, not a server stack trace.

allowedAccess is updated by the login server as online/registration state:
successful SessionRequest authentication sets it true, disconnect or missing
registration sets it false. Server locks can further suppress client access.
Manually setting it true cannot create an internal zone connection, so server
listing alone did not repair CharacterAllowedRequest/Reply.

Changes
-------

docker-compose.yml:
  - MongoDB health check and login health check.
  - Login waits for healthy MongoDB; zone waits for both healthy dependencies.
  - Zone mounts .zone-2016.secret as a Docker secret and selects the existing
    secret-authenticated WS transport using LZ_SERVER_SECRET_FILE.
  - Existing public and internal ports, MongoDB data volume, WORLD_ID and
    client-facing server address were preserved.

docker/2016/zoneServer.js:
  - Read the mounted registration secret before constructing ZoneServer2016.
  - Report fatal asynchronous startup failures and exit nonzero for Docker restart.

docker/2015/loginServer.js:
  - Log actual application readiness; report fatal startup failures and exit nonzero.

docker/2015/LoginServer.Dockerfile:
  - Explicit locked dependency installation and full TypeScript build.

docker/login-healthcheck.js (new):
  - Check the game-login UDP socket and internal TCP listener inside the container.

src/servers/LoginServer/loginserver.ts:
  - Start internal zone listeners only after MongoDB is connected/initialized,
    stale server statuses are updated, and queue reset completes.
  - Log successful zone registration and missing-zone/timeout diagnostics.
  - Map unavailable/non-object zone replies to ERROR/status 0 with a useful
    availability message instead of a false version warning.
  - Throw a meaningful MongoDB startup error instead of throwing debug()'s return.

src/servers/ZoneServer2016/zoneserver.ts:
  - Log successful internal registration; await connection-manager startup.
  - Await CharacterAllowedRequest and report/reject unexpected asynchronous errors.
  - Return immediately after CHARACTER_NOT_FOUND rejection. Previously this branch
    could fall through and send an acceptance after its rejection.

.gitignore and .dockerignore:
  - Exclude the registration-secret file and login backups; exclude terrain
    backups from Docker context so credentials/backups are not baked into images.

tests/login-registration.test.cjs (new):
  - Missing registration, request timeout, allowed and banned logins, and a single
    missing-character rejection without fallthrough.

Additional artifacts:
  .zone-2016.secret (private; existing world-2 MongoDB secret, not a new identity)
  scripts/live-soe-probe.cjs
  scripts/verify-live-login.cjs
  LOGIN_FIX.md

The secret was copied from the enabled world-2 server record without printing it.
The database secret, bans, security rules, file hash checks and protocol checks
were not disabled or weakened. Internal WS traffic stays on the Compose network;
1110 is not published to the host. The local secret file must accompany Compose
deployment or be provisioned from the destination database's matching secret.

Character login flow
--------------------

1. The client opens an SOE UDP session to the login service on 1115 and sends
   LoginUdp_11 LoginRequest. The server resolves account/session information.
2. ServerListRequest reads the matching game-version server records and reports
   dynamic registration availability, subject to server locks.
3. CharacterLoginRequest loads server and user-session data, constructs the
   candidate gateway reply, and computes existing rejection flags.
4. askZone sends CharacterAllowedRequest over the authenticated internal zone
   connection on TCP 1110. The zone checks readiness, reboot, locks/admin status,
   bans/rejection flags, and a live character in the selected world.
5. CharacterAllowedReply determines CharacterLoginReply status. Queue handling
   remains active. An accepted reply supplies the gateway address, session ticket,
   encryption key and character/session identifiers.
6. The actual game client must then connect to the zone gateway on UDP 1117.
   The gateway/zone checks the ClientProtocol_1080 version and ban/session data
   and initializes the character/world. The synthetic test deliberately stops
   at the accepted gateway handoff; full in-game initialization still needs
   a real game-client test.

Validation performed
--------------------

Passed locally: npm run build, npm run build-tests, npm run lint-quiet.
Focused login/terrain/WS tests: 11 passed, one Mongo-only test skipped.
General suite, excluding only the previously broken PluginManager fixture:
93 passed, zero failed, five skipped. Log: login-fix-test-validation.log in
the validated working copy under the terrain extractor workspace.
The pre-existing PluginManager fixture dependency/build issue is documented
in TERRAIN_FIX.md; it was not hidden by changing production plugin behavior.

Executed in the selected source directory:

    docker compose --profile 2016 up -d --build --force-recreate
    docker compose --profile 2016 ps -a
    docker compose --profile 2016 logs --tail=150 login-server
    docker compose --profile 2016 logs --tail=150 zone-server-2016

Both Docker builds compiled successfully. MongoDB and login-server were healthy;
zone-server-2016 was Up. Logs confirmed:

    [LOGIN] Ready: client UDP 1115; internal UDP/WS 1110
    [LOGIN] Zone 2 registered from 172.18.0.4 (0.50.0)
    [LOGIN] Zone 2 registered with login-server:1110

MongoDB changed allowedAccess to true through normal registration. It was not
forced true. Zone restart count was zero, OOMKilled=false, and terrain/navmesh
startup completed in approximately five seconds. A live memory sample showed
about 1.05 GiB for the zone, not an OOM/restart. All 1,025 terrain dataset files
and the terrain-height, navigation adapter and NPC implementation hashes matched
the previous validated terrain patch. Terrain work was preserved.

Live UDP probes passed both INSIDE the login container and THROUGH Windows
localhost's published UDP 1115 and MongoDB 27018 ports:

    LoginUdp_11 login: accepted
    Server-list world 2: allowedAccess=true
    Character login: accepted
    Advertised gateway: 127.0.0.1:1117
    Missing character: rejected

The probes used randomly generated temporary account/session/character records.
All three collections were checked afterward: zero probe records remained.
No real player credentials were used. Initial diagnostic attempts exposed an
obsolete bundled example SOE client API and an invalid UUID-shaped test session;
the corrected diagnostic uses current stream APIs and hexadecimal uint64 IDs.
The historical RangeError in login logs came from that malformed probe ID,
not from a real player or the terrain implementation.

A login-only container restart was also tested: zone 2 re-registered automatically
without restarting the zone or editing MongoDB flags. Observed logs after recovery
had no new recurring connection exceptions. Services remain running for client tests.

Local testing and later VPS deployment
-------------------------------------

The advertised 127.0.0.1:1117 address is correct for a game client on this Windows
PC. Confirm the launcher uses localhost:1115, then test selecting a character,
loading into the world, and moving/chasing zombies in game. The protocol probe
verifies server list and character-login handoff, not rendering/world initialization.

On a VPS, set the existing world-2 serverAddress to the VPS address/domain plus
:1117 and point the launcher at its login address. Provision a matching private
zone secret from that VPS database; do not copy or hardcode an unrelated secret.
Keep internal 1110 private and MongoDB off the public internet. No VPS settings
were applied during this local repair.

To rerun the diagnostic inside the current containers:

    docker compose cp scripts/live-soe-probe.cjs login-server:/usr/src/app/live-soe-probe.cjs
    docker compose cp scripts/verify-live-login.cjs login-server:/usr/src/app/verify-live-login.cjs
    docker compose exec -T login-server node verify-live-login.cjs

It creates temporary test records and removes them in finally. Do not forcibly
kill it mid-run; if interrupted, inspect _id values beginning connectivity- in
user-sessions, characters-light and characters before manually removing only
those test records. It never forces server status or overrides security checks.
