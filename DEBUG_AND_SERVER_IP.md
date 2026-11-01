# Debug logging and client-facing IP configuration

## What changed

- All active `console.log(...)` calls in `src/`, `docker/`, `scripts/`, `benchmarks/`, and `h1z1-server.js` now call a named `console.log(...)` logger. Errors and warnings remain on `console.error` / `console.warn`.
- Existing debug namespaces are unchanged. Added namespaces use `h1emu:<path>:<filename>`.
- Docker Compose passes the optional `DEBUG` setting to login/zone services. Debug output is disabled unless enabled with a namespace pattern.
- The zone-to-login hostname is already taken from `LOGINSERVER_IP: login-server` in `docker-compose.yml` and is **not** a public IP.
- For world ID 2, the login-server can use `PUBLIC_SERVER_IP` and `PUBLIC_SERVER_PORT` from Compose to advertise the public IP in character-login replies and server-list ping info. No public IP address is hard-coded in the application source.
- The existing MongoDB `serverAddress` stays unchanged: **it is also used by the login server to authorize zone registration**. We do not overwrite it or bypass its authentication checks. When the environment override is empty, clients still receive the MongoDB address as before.
- Loopback defaults (such as `127.0.0.1`) in solo-mode code and initial sample database records are local development defaults, not configured production public IPs. Existing MongoDB data is retained.

## On Windows

In the folder containing `docker-compose.yml`, create/edit `.env` (optional):

```dotenv
PUBLIC_SERVER_IP=your.public.ip.or.hostname
PUBLIC_SERVER_PORT=1117
# Optional: DEBUG=h1emu:*,ZoneServer,LoginServer,nav
```

Use a hostname or IPv4 address without `:port` for `PUBLIC_SERVER_IP`. If you are already using a correct address in MongoDB, leave it unset to preserve behavior.

Apply changes:

```cmd
docker compose --profile 2016 up -d --build --force-recreate
```

The internal login-server connection uses Compose `LOGINSERVER_IP: login-server`; it does not use `PUBLIC_SERVER_IP`.

**IMPORTANT:** If zone authentication fails, inspect MongoDB's `servers.serverAddress` for the proper authorization address. The public client-address override intentionally does not change zone authentication.

Debug logger output requires `DEBUG` patterns. For example, temporarily set `DEBUG=h1emu:*,ZoneServer,LoginServer,nav` in `.env`, then recreate the services.
