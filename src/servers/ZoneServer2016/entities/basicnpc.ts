// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2026 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

import { ZoneServer2016 } from "../zoneserver";
import { ZoneClient2016 } from "../classes/zoneclient";
import { Npc } from "./npc";

// ponytail: inert NPC — spawns and stands there. No fsm, so no AI tick;
// no loot/harvest/interaction. Used as the fallback for unknown model ids.
export class BasicNpc extends Npc {
  protected addLoot(_server: ZoneServer2016): void {}

  protected onHarvest(_server: ZoneServer2016, _client: ZoneClient2016): void {}

  protected buildInteractionString(
    _server: ZoneServer2016,
    _client: ZoneClient2016
  ): void {}
}
