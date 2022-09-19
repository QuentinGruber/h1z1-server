// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2022 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

/* eslint-disable @typescript-eslint/no-unused-vars */
// TODO enable @typescript-eslint/no-unused-vars
const debug = require("debug")("zonepacketHandlers");
import { zoneShutdown } from "../../../utils/utils";
import { ZoneClient2016 as Client } from "../classes/zoneclient";
import { ZoneServer2016 } from "../zoneserver";

const admin: any = {
  list: function (server: ZoneServer2016, client: Client, args: any[]) {
    server.sendChatText(
      client,
      `/admin commands list: \n${Object.keys(this).join("\n")}`
    );
  },
  shutdown: async function (
    server: ZoneServer2016,
    client: Client,
    args: any[]
  ) {
    const timeLeft = args[1] ? args[1] : 0;
    const message = args[2] ? args[2] : " ";
    const startedTime = Date.now();
    await zoneShutdown(server, startedTime, timeLeft, message);
  },
  // respawnloot, respawnnpcs, respawnvehicles
  // lootrespawntime, npcrespawntime, vehiclerespawntime
  respawnloot: function (server: ZoneServer2016, client: Client, args: any[]) {
    server.worldObjectManager.createLoot(server);
    server.sendChatText(client, `Respawned loot`);
  },
  respawnnpcs: function (server: ZoneServer2016, client: Client, args: any[]) {
    server.worldObjectManager.createNpcs(server);
    server.sendChatText(client, `Respawned npcs`);
  },
  respawnvehicles: function (
    server: ZoneServer2016,
    client: Client,
    args: any[]
  ) {
    server.worldObjectManager.createVehicles(server);
    server.sendChatText(client, `Respawned vehicles`);
  },
  lootrespawntimer: function (
    server: ZoneServer2016,
    client: Client,
    args: any[]
  ) {
    if (!args[1]) {
      server.sendChatText(
        client,
        `Correct usage: /admin lootrespawntimer <time>`
      );
      return;
    }
    server.worldObjectManager.lootRespawnTimer = Number(args[1]);
    server.sendChatText(client, `Loot respawn timer set to ${Number(args[1])}`);
  },
  silentban: function (
        server: ZoneServer2016,
        client: Client,
        args: any[]
    ) {
        if (!args[1] || !args[2]) {
            server.sendChatText(
                client,
                `Correct usage: /admin silentban {name} {type} {time} {reason}`
            );
            return;
      }
      const banTypes = ["nodamage", "hiddenplayers", "rick"];
      const banType = args[2].toString().toLowerCase()
      if (!banTypes.includes(banType)) {
          server.sendChatText(
              client,
              `valid ban types: ${banTypes.join(", ") }`
          );
          return;
      }
        for (const a in server._clients) {
            const iteratedClient = server._clients[a];
            if (iteratedClient.character.name && iteratedClient.character.name.toLocaleLowerCase() === args[1].toString().toLowerCase()) {
                let time = Number(args[3]) ? Number(args[3]) * 60000 : 0;
                if (time > 0) {
                    time += Date.now()
                    server.sendChatText(
                        client,
                        `You have silently banned ${iteratedClient.character.name} until ${server.getDateString(time)}`
                    );
                } else {
                    server.sendChatText(
                        client,
                        `You have silently banned ${iteratedClient.character.name} permemently, banType: ${banType}`
                    );
                }
                const reason = args.slice(4).join(" ");
                server.banClient(iteratedClient, reason, banType, client.character.name ? client.character.name:"", time)
                return;
            }
        }
        server.sendChatText(
            client,
            `Cannot find any user with name ${args[1]}`
        );
    },
  ban: function (
    server: ZoneServer2016,
    client: Client,
    args: any[]
  ) {
    if (!args[1]) {
      server.sendChatText(
        client,
        `Correct usage: /admin ban {name} {time} {reason}`
      );
      return;
      }
      for (const a in server._clients) {
          const iteratedClient = server._clients[a];
          if (iteratedClient.character.name && iteratedClient.character.name.toLocaleLowerCase() === args[1].toString().toLowerCase()) {
              let time = Number(args[2]) ? Number(args[2]) * 60000 : 0;
              if (time > 0) {
                  time += Date.now()
                  server.sendChatText(
                      client,
                      `You have banned ${iteratedClient.character.name} until ${server.getDateString(time)}`
                  );
              } else {
                  server.sendChatText(
                      client,
                      `You have banned ${iteratedClient.character.name} permemently`
                  );
              }            
              const reason = args.slice(3).join(" ");
              server.banClient(iteratedClient, reason, "normal", client.character.name ? client.character.name : "", time)
              return;
          }
      }
      server.sendChatText(
          client,
          `Cannot find any user with name ${args[1]}`
      );
    },
    silentbanid: function (
        server: ZoneServer2016,
        client: Client,
        args: any[]
    ) {
        if (!args[1] || !args[2]) {
            server.sendChatText(
                client,
                `Correct usage: /admin silentban {ZoneClientId} {type} {time} {reason}`
            );
            return;
        }
        const banTypes = ["nodamage", "hiddenplayers", "rick"];
        const banType = args[2].toString().toLowerCase()
        if (!banTypes.includes(banType)) {
            server.sendChatText(
                client,
                `valid ban types: ${banTypes.join(", ")}`
            );
            return;
        }
        for (const a in server._clients) {
            const iteratedClient = server._clients[a];
            if (Number(iteratedClient.loginSessionId) === Number(args[1])) {
                let time = Number(args[3]) ? Number(args[3]) * 60000 : 0;
                if (time > 0) {
                    time += Date.now()
                    server.sendChatText(
                        client,
                        `You have silently banned ${iteratedClient.character.name} until ${server.getDateString(time)}`
                    );
                } else {
                    server.sendChatText(
                        client,
                        `You have silently banned ${iteratedClient.character.name} permemently, banType: ${banType}`
                    );
                }
                const reason = args.slice(4).join(" ");
                server.banClient(iteratedClient, reason, banType, client.character.name ? client.character.name : "", time)
                return;
            }
        }
        server.sendChatText(
            client,
            `Cannot find any user with name ${args[1]}`
        );
    },
    banid: function (
        server: ZoneServer2016,
        client: Client,
        args: any[]
    ) {
        if (!args[1]) {
            server.sendChatText(
                client,
                `Correct usage: /admin ban {name} {ZoneClientId} {reason}`
            );
            return;
        }
        for (const a in server._clients) {
            const iteratedClient = server._clients[a];
            if (Number(iteratedClient.loginSessionId) === Number(args[1])) {
                let time = Number(args[2]) ? Number(args[2]) * 60000 : 0;
                if (time > 0) {
                    time += Date.now()
                    server.sendChatText(
                        client,
                        `You have banned ${iteratedClient.character.name} until ${server.getDateString(time)}`
                    );
                } else {
                    server.sendChatText(
                        client,
                        `You have banned ${iteratedClient.character.name} permemently`
                    );
                }
                const reason = args.slice(3).join(" ");
                server.banClient(iteratedClient, reason, "normal", client.character.name ? client.character.name : "", time)
                return;
            }
        }
        server.sendChatText(
            client,
            `Cannot find any user with zoneClientId ${args[1]}`
        );
    },
    unban: function (
        server: ZoneServer2016,
        client: Client,
        args: any[]
    ) {
        if (!args[1]) {
            server.sendChatText(
                client,
                `Correct usage: /admin unban {banned name}`
            );
            return;
        }
        const name = args[1].toString().toLowerCase();
        for (const a in server._bannedClients) {
            const bannedClient = server._bannedClients[a]
            if (bannedClient.name?.toLowerCase() === name) {
                delete server._bannedClients[a];
                server.sendChatText(
                    client,
                    `Removed ban on user ${bannedClient.name}`
                );
                return;
            }
        }

        server.sendChatText(
            client,
            `Cannot find any banned user with name ${args[1]}`
        );
    },
    unbanid: function (
        server: ZoneServer2016,
        client: Client,
        args: any[]
    ) {
        if (!args[1]) {
            server.sendChatText(
                client,
                `Correct usage: /admin unbanid {ZoneClientId}`
            );
            return;
        }
        for (const a in server._bannedClients) {
            const bannedClient = server._bannedClients[a]
            if (Number(bannedClient.loginSessionId) === Number(args[1])) {
                delete server._bannedClients[a];
                server.sendChatText(
                    client,
                    `Removed ban on user ${args[1]}`
                );
                return;
            }
        }

        server.sendChatText(
            client,
            `Cannot find any banned user with ZoneClientId ${args[1]}`
        );
    },
  npcrespawntimer: function (
    server: ZoneServer2016,
    client: Client,
    args: any[]
  ) {
    if (!args[1]) {
      server.sendChatText(
        client,
        `Correct usage: /admin npcrespawntimer <time>`
      );
      return;
    }
    server.worldObjectManager.npcRespawnTimer = Number(args[1]);
    server.sendChatText(client, `Npc respawn timer set to ${Number(args[1])}`);
  },
  vehiclerespawntimer: function (
    server: ZoneServer2016,
    client: Client,
    args: any[]
  ) {
    if (!args[1]) {
      server.sendChatText(
        client,
        `Correct usage: /admin vehiclerespawntimer <time>`
      );
      return;
    }
    server.worldObjectManager.vehicleRespawnTimer = Number(args[1]);
    server.sendChatText(
      client,
      `Vehicle respawn timer set to ${Number(args[1])}`
    );
  },
  god: function (server: ZoneServer2016, client: Client, args: any[]) {
    server.setGodMode(client, !client.character.godMode);
    server.sendAlert(client, `Set godmode to ${client.character.godMode}`);
  },
  alert: function (server: ZoneServer2016, client: Client, args: any[]) {
    args.shift();
    server.sendAlertToAll(args.join(" "));
  },
  remover: function (server: ZoneServer2016, client: Client, args: any[]) {
    server.lootItem(client, server.generateItem(1776));
  },
  players: function (server: ZoneServer2016, client: Client, args: any[]) {
    server.sendChatText(
      client,
      `Players: ${Object.values(server._clients)
        .map((c) => {
          return `${c.character.name}: ${c.loginSessionId}`;
        })
        .join(", ")}`
    );
  },
  kick: function (server: ZoneServer2016, client: Client, args: any[]) {
    if (!args[1]) {
      server.sendChatText(client, "Missing guid (use /admin players)");
      return;
    }
    const targetClient = Object.values(server._clients).find((c) => {
      if (c.loginSessionId == args[1] || c.loginSessionId == args[1].slice(2)) {
        // in case "0x" is included
        return c;
      }
    });
    if (!targetClient) {
      server.sendChatText(client, "Client not found.");
      return;
    }
    const reason = args[2] ? args.slice(2).join(" ") : "Undefined";
    for (let i = 0; i < 5; i++) {
      server.sendAlert(
        targetClient,
        `You are being kicked from the server. Reason: ${reason}`
      );
    }

    setTimeout(() => {
      if (!targetClient) {
        return;
      }
      server.sendGlobalChatText(
        `${targetClient.character.name} has been kicked from the server!`
      );
      server.sendData(targetClient, "CharacterSelectSessionResponse", {
        status: 1,
        sessionId: targetClient.loginSessionId,
      });
    }, 2000);
  },
  savecharacters: async function (
    server: ZoneServer2016,
    client: Client,
    args: any[]
  ) {
    if (!server.enableWorldSaves) {
      server.sendChatText(client, "Server saving is disabled.");
      return;
    }
    server.sendChatText(client, "CharacterData save started.");
    await server.worldDataManager.saveCharacters(server);
    server.sendChatText(client, "Character data has been saved!");
  },
  savevehicles: async function (
    server: ZoneServer2016,
    client: Client,
    args: any[]
  ) {
    if (!server.enableWorldSaves) {
      server.sendChatText(client, "Server saving is disabled.");
      return;
    }
    server.sendChatText(client, "VehicleData save started.");
    await server.worldDataManager.saveVehicles(server);
    server.sendChatText(client, "Vehicles have been saved!");
  },
  save: async function (server: ZoneServer2016, client: Client, args: any[]) {
    if (!server.enableWorldSaves) {
      server.sendChatText(client, "Server saving is disabled.");
      return;
    }
    server.sendChatText(client, "World save started.");
    await server.worldDataManager.saveWorld(server);
    server.sendChatText(client, "World saved!");
  },
};

export default admin;
