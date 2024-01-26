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

import { ZoneClient2016 } from "../classes/zoneclient";
import { Items, ResourceIds, StringIds } from "../models/enums";
import { ZoneServer2016 } from "../zoneserver";
import { TaskProp } from "./taskprop";

export class WaterSource extends TaskProp {
  usesLeft?: number;
  refillAmount!: number;
  constructor(
    characterId: string,
    transientId: number,
    actorModelId: number,
    position: Float32Array,
    rotation: Float32Array,
    server: ZoneServer2016,
    scale: Float32Array,
    zoneId: number,
    renderDistance: number,
    actorModel: string,
    refillAmount: number
  ) {
    super(
      characterId,
      transientId,
      actorModelId,
      position,
      rotation,
      server,
      scale,
      zoneId,
      renderDistance,
      actorModel
    );
    this.refillAmount = refillAmount;
  }

  replenish() {
    switch (this.actorModel) {
      case "Common_Props_Cabinets_BathroomSink.adr":
      case "Common_Props_Bathroom_Toilet01.adr":
        this.usesLeft = this.refillAmount;
        break;
      case "Common_Props_Dam_WaterValve01.adr":
      case "Common_Props_Well.adr":
        this.usesLeft = Number.MAX_SAFE_INTEGER;
        break;
    }
  }

  OnInteractionString(server: ZoneServer2016, client: ZoneClient2016) {
    switch (this.actorModel) {
      case "Common_Props_Dam_WaterValve01.adr":
      case "Common_Props_Cabinets_BathroomSink.adr":
      case "Common_Props_Bathroom_Toilet01.adr":
        if (this.usesLeft && this.usesLeft > 0) {
          server.sendData(client, "Command.InteractionString", {
            guid: this.characterId,
            stringId: client.character.hasItem(Items.WATER_EMPTY)
              ? StringIds.COLLECT_WATER
              : StringIds.DRINK_DIRTY_WATER
          });
        }
        break;
      case "Common_Props_Well.adr":
        server.sendData(client, "Command.InteractionString", {
          guid: this.characterId,
          stringId: client.character.hasItem(Items.WATER_EMPTY)
            ? StringIds.COLLECT_WATER
            : StringIds.DRINK_STAGNANT_WATER
        });
        break;
    }
  }

  /* eslint-disable @typescript-eslint/no-unused-vars */
  OnPlayerSelect(
    server: ZoneServer2016,
    client: ZoneClient2016
    /* eslint-enable @typescript-eslint/no-unused-vars */
  ) {
    const bottle = client.character.getItemById(Items.WATER_EMPTY),
      infiniteSources = [
        "Common_Props_Well.adr",
        "Common_Props_Dam_WaterValve01.adr"
      ],
      hasUses =
        infiniteSources.includes(this.actorModel) ||
        (this.usesLeft && this.usesLeft > 0);
    if (!hasUses) {
      server.utilizeHudTimer(client, StringIds.DIRTY_WATER, 250, 0, () => {
        server.sendAlert(client, "This water source is dry.");
      });
      return;
    }

    if (!bottle) {
      server.utilizeHudTimer(
        client,
        infiniteSources.includes(this.actorModel)
          ? StringIds.WATER_WELL
          : StringIds.DIRTY_WATER,
        1000,
        0,
        () => {
          client.character._resources[ResourceIds.HYDRATION] += 1000;
          client.character.damage(server, { entity: "", damage: 1000 });
          server.updateResource(
            client,
            client.character.characterId,
            client.character._resources[ResourceIds.HYDRATION],
            ResourceIds.HYDRATION
          );
          if (this.usesLeft) this.usesLeft--;
        }
      );
      return;
    }
    server.utilizeHudTimer(
      client,
      infiniteSources.includes(this.actorModel)
        ? StringIds.WATER_WELL
        : StringIds.DIRTY_WATER,
      1000,
      0,
      () => {
        if (!server.removeInventoryItem(client.character, bottle)) return;
        client.character.lootContainerItem(
          server,
          server.generateItem(
            infiniteSources.includes(this.actorModel)
              ? Items.WATER_STAGNANT
              : Items.WATER_DIRTY
          )
        );
        if (this.usesLeft) this.usesLeft--;
      }
    );
  }
}
