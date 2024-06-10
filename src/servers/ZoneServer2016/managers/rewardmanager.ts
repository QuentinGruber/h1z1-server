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

import { clearTimeout } from "timers";
import { ZoneServer2016 } from "../zoneserver";
import { Items } from "../models/enums";

export class RewardManager {
  private rewards: any[] = [];
  private timer?: NodeJS.Timeout;
  constructor(public server: ZoneServer2016) {}

  startInterval() {
    this.timer = setTimeout(this.update.bind(this), 1000);
  }
  start() {
    this.startInterval();
  }
  stop() {
    clearTimeout(this.timer);
  }
  update() {
    const clients = this.server._clients;
    const clientsKeys = Object.keys(clients);
    // if there is not enought players
    if (clientsKeys.length < 1) {
      this.startInterval();
      return;
    }
    const selectedKey =
      clientsKeys[Math.floor(Math.random() * clientsKeys.length)];
    const selectedClient = clients[selectedKey];
    const item = this.server.generateAccountItem(Items.REWARD_CRATE_WASTELAND);
    if (item) {
      console.log("reward granted");
      selectedClient.character.lootAccountItem(
        this.server,
        selectedClient,
        item,
        true
      );
    } else {
      console.log("Server failed to generate reward account item");
    }
    this.startInterval();
  }
}
