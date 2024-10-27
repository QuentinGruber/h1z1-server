// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2024 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

import { setInterval } from "timers";
import { ZoneServer2016 } from "../zoneserver";
import { Items } from "../models/enums";
import { ZoneClient2016 } from "../classes/zoneclient";

interface Reward {
  itemId: Items;
  dropChances: number;
}

export class RewardManager {
  rewards: Reward[];
  private timer?: NodeJS.Timeout;
  constructor(public server: ZoneServer2016) {
    this.rewards = [
      {
        itemId: Items.MYSTERY_BAG_1,
        dropChances: 20
      },
      {
        itemId: Items.MYSTERY_BAG_V2,
        dropChances: 20
      },
      {
        itemId: Items.ELITE_BAG_HARDCORE,
        dropChances: 10
      },
      {
        itemId: Items.REWARD_CRATE_MARAUDER,
        dropChances: 30
      },
      {
        itemId: Items.REWARD_CRATE_SHOWDOWN,
        dropChances: 10
      },
      {
        itemId: Items.REWARD_CRATE_INVITATIONAL,
        dropChances: 10
      }
    ];
  }

  startInterval() {
    this.timer = setInterval(this.update.bind(this), 1_000);
  }
  start() {
    this.startInterval();
  }
  stop() {
    clearInterval(this.timer);
  }
  addRewardToPlayer(client: ZoneClient2016, rewardId: Items) {
    const item = this.server.generateAccountItem(rewardId);
    if (item) {
      this.server.lootAccountItem(this.server, client, item, true);
    } else {
      console.log("Server failed to generate reward account item");
    }
  }
  dropReward(client: ZoneClient2016) {
    client.character.lastDropPlaytime = client.character.playTime;
    let rewardId: Items = Items.MYSTERY_BAG_1;
    let random = Math.random() * 100;
    for (const reward of this.rewards) {
      random -= reward.dropChances;
      if (random <= 0) {
        rewardId = reward.itemId;
        break;
      }
    }
    this.addRewardToPlayer(client, rewardId);
  }

  update() {
    for (const clientKey in this.server._clients) {
      const client = this.server._clients[clientKey];
      if (client.character.playTime - client.character.lastDropPlaytime > 120) {
        this.dropReward(client);
      }
    }
  }
}
