# 2016 login regression investigation

## Confirmed failure and correction

Before the fix, MongoDB and login were healthy but the zone container repeatedly
exited before registration. Its logs contained `Cannot find module './lz4/lz4'`
from `out/utils/utils.js`. This was a runtime packaging failure, not a MongoDB
authentication failure or a zombie locomotion change.

The host has `tsconfigs/tsconfig-2016-zone.tsbuildinfo`, tracking the LZ4 source.
Docker copied `tsconfigs/` including that incremental compilation metadata but
excluded `out/`. TypeScript could therefore skip unchanged outputs even though
the clean image did not contain them. Excluding `**/*.tsbuildinfo` from the build
context makes the image compile its complete runtime tree. The rebuilt zone
contains the module and starts successfully. The npm cache is also excluded.

The repository has no `.git` directory or discovered login backup to compare.
The diagnosis uses the failing deployed logs, current build inputs and successful
clean image builds, rather than attributing the change to an unverified commit.

## Availability and character login flow

1. `utils.initMongo()` creates server records from
   `data/defaultDatabase/shared/servers.json` only for an empty database. World 2
   is the 2016 record; its seed has `allowedAccess: true`.
2. Login connects to database `h1server` before starting internal registration
   listeners. `updateServersStatus()` marks records without a registered zone
   unavailable. Disconnect handling also updates availability. This is intentional
   runtime availability tracking; manually enabling a record does not register it.
3. Compose selects `WORLD_ID=2`. The zone entry point reads its mounted secret;
   presence of that secret selects WebSocket authentication. The internal link is
   `ws://login-server:1110` (TCP), not the game's UDP port 1117. The legacy internal
   UDP transport also listens on 1110 but is not used by this configured zone.
4. The login server validates the secret against the enabled world record.
   Successful `SessionRequest` registration maps that connection to world 2,
   updates version/rules and calls `updateServerStatus(2, true)`.
5. A game client uses LoginUdp_11 on UDP 1115. LoginRequest resolves its user session;
   the server list selects the 2016 records and applies lock visibility rules.
6. CharacterLoginRequest resolves the world, user session and lightweight character,
   then asks the registered zone for `CharacterAllowedRequest`. The zone checks
   readiness, reboot/lock state, bans/rejection flags and its full character record.
7. With the broken image, `askZone()` finds no registered zone and returns zero.
   CharacterLoginRequest converts that to status zero with rejection flag ERROR,
   sends `CONNECTION REJECTED! Reason: ERROR` and rejects CharacterLoginReply.
   This matches the pre-fix live log: world 2 was not registered.
8. On acceptance, the reply supplies the public endpoint and session information.
   The client then connects to the zone gateway over UDP 1117. Gateway protocol,
   ban and character initialization checks remain unchanged. The probe below stops
   at the accepted character-login reply; it does not exercise full game loading.

## Address configuration and diagnostics

`docker-compose.yml`, login-server environment:

```yaml
PUBLIC_SERVER_IP: ${PUBLIC_SERVER_IP:-}
PUBLIC_SERVER_PORT: ${PUBLIC_SERVER_PORT:-1117}
PUBLIC_SERVER_WORLD_ID: ${WORLD_ID:-2}
```

Edit these values directly in Compose or set the corresponding shell/.env
variables. No `.env` file currently exists. An empty public IP preserves the
database address. To serve other PCs, configure a reachable LAN/public IP or
hostname. The current database address is `127.0.0.1:1117`; remote reachability
cannot be claimed with that address. Recreate the login service after editing.

The existing override helper controls both character-login endpoints and server
list ping endpoints, validates the public port, and applies only to its selected
world. It does not update MongoDB and does not influence secret validation.
`LOGINSERVER_IP=login-server` remains the independent Docker internal address.

New diagnostics use the existing `LoginServer` debug namespace and log world,
registration/authentication outcome, availability, rejection flag and endpoint.
Enable with `DEBUG=LoginServer` (or include it in a comma-separated DEBUG list).
The full character-login reply dump and 2016 protocol payload dumps were removed:
they contained session tickets, authentication data and encryption keys.

## Validation on 2026-11-01

- Requested Compose config validation passed.
- Requested `up -d --build --force-recreate` completed successfully. Both the
  login full TypeScript build and 2016 zone build passed in their Docker builders.
- Final `ps -a`: MongoDB and login healthy; zone running with UDP 1117 published.
  Login and zone restart counts were both zero.
- Requested log tails and full recreated-container logs checked: world 2
  authenticated and registered; no uncaught exception, unhandled rejection or
  startup failure found in those logs.
- Internal Docker DNS/TCP access to login-server:1110 passed. Read-only checks
  verified WORLD_ID=2, gameVersion=2, enabled record, matching mounted/database
  secret (boolean output only), LZ4 module presence and allowedAccess=true.
- Real LoginUdp_11 probe passed: login accepted, world 2 available, valid temporary
  character accepted, missing character rejected. Probe records and temporary
  container scripts were removed. No manual allowedAccess or secret updates made.
- Isolated public-address tests passed: custom hostname/port, world isolation,
  invalid port rejection and empty-IP database fallback. Production configuration
  and database were not changed by these tests.
- A separate Windows host build attempt failed on local TypeScript/type-definition
  parsing errors. The successful Docker builds are the deployment build results.
- No game client, full zone gateway join, LAN/internet UDP routing or graphical
  gameplay test performed. These remain client-side verification steps.

Gameplay source, terrain, pathfinding, wildlife, impacts, corpses and zombie
animation changes were not edited or reverted by this fix.
