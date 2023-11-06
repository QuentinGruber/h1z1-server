// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2023 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

import { LoadoutContainer } from "../classes/loadoutcontainer";
import { ZoneClient2016 } from "../classes/zoneclient";
import { Items, StringIds } from "../models/enums";
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
        super(characterId, transientId, actorModelId, position, rotation, server, scale, zoneId, renderDistance, actorModel);
        this.refillAmount = refillAmount;
    }

    replenish() {
        switch (this.actorModel) {
            case "Common_Props_Cabinets_BathroomSink.adr":
            case "Common_Props_Bathroom_Toilet01.adr":
                this.usesLeft = this.refillAmount;
                break;
            case "Common_Props_Well.adr":
                this.usesLeft = -1;
                break;
        }
    }

    refill(server: ZoneServer2016, client: ZoneClient2016) {
        Object.values(client.character._containers).forEach((container: LoadoutContainer) => {
            Object.values(container.items).forEach((item) => {
                if (item.itemDefinitionId == Items.WATER_EMPTY) {
                    server.utilizeHudTimer(client, StringIds.WATER_WELL, 1000, 0, () => {
                        server.fillPass(client, item, true);
                        if (this.usesLeft && this.usesLeft > 0) this.usesLeft--;
                    });
                    return;
                }
            });
        });
    }

    OnInteractionString(server: ZoneServer2016, client: ZoneClient2016) {
        switch (this.actorModel) {
            case "Common_Props_Cabinets_BathroomSink.adr":
            case "Common_Props_Bathroom_Toilet01.adr":
                if (this.usesLeft && this.usesLeft > 0) {
                    server.sendData(client, "Command.InteractionString", {
                        guid: this.characterId,
                        stringId: StringIds.COLLECT_WATER
                    });
                }
                break;
            case "Common_Props_Well.adr":
                server.sendData(client, "Command.InteractionString", {
                    guid: this.characterId,
                    stringId: StringIds.COLLECT_WATER
                });
                break;
        }
    }

    /* eslint-disable @typescript-eslint/no-unused-vars */
    OnPlayerSelect(
        server: ZoneServer2016,
        client: ZoneClient2016,
        /* eslint-enable @typescript-eslint/no-unused-vars */
    ) {
        switch (this.actorModel) {
            case "Common_Props_Cabinets_BathroomSink.adr":
            case "Common_Props_Bathroom_Toilet01.adr":
                if (this.usesLeft && this.usesLeft > 0) {
                    this.refill(server, client);
                }
                break;
            case "Common_Props_Well.adr":
                this.refill(server, client);
                break;
        }
    }
}
