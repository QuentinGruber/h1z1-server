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

import { ZoneServer2016 } from "../zoneserver";
import { ItemObject } from "./itemobject";
import { BaseItem } from "./baseItem";
import { ZoneClient2016 } from "./zoneclient";
import { PlantingDiameter } from "./plantingdiameter";

import { Items, StringIds } from "../models/enums";

export class Plant extends ItemObject {
    growState: number = 0;
    nextStateTime: number = new Date().getTime() + 28800000 // + 8h
    parentObjectCharacterId: string
    slot: string
    isFertilized: boolean = false
    constructor(
        characterId: string,
        transientId: number,
        actorModelId: number,
        position: Float32Array,
        rotation: Float32Array,
        server: ZoneServer2016,
        spawnerId: number,
        item: BaseItem,
        parentObjectCharacterId: string,
        slot: string
    ) {
        super(characterId, transientId, actorModelId, position, rotation, server, spawnerId, item);
        this.npcRenderDistance = 30;
        this.parentObjectCharacterId = parentObjectCharacterId;
        this.slot = slot;
        if (!server._temporaryObjects[parentObjectCharacterId]) return
        const parent = server._temporaryObjects[parentObjectCharacterId] as PlantingDiameter
        if (parent.isFertilized) this.isFertilized = true;
        if (this.item.itemDefinitionId == Items.SEED_CORN) {
            this.nameId = StringIds.CORN
        } else this.nameId = StringIds.WHEAT
        
    }

    grow(server: ZoneServer2016) {
        if (this.growState == 3) return
        this.growState++
        switch (this.item.itemDefinitionId) {
            case Items.SEED_CORN:
                switch (this.growState) {
                    case 1:
                        this.actorModelId = 59
                        break;
                    case 2:
                        this.actorModelId = 60
                        break;
                    case 3:
                        this.actorModelId = 61
                        break;
                }
                break;
            case Items.SEED_WHEAT:
                switch (this.growState) {
                    case 1:
                        this.actorModelId = 9191
                        break;
                    case 2:
                        this.actorModelId = 9190
                        break;
                    case 3:
                        this.actorModelId = 9189
                        break;
                }
        }
        server.sendDataToAllWithSpawnedEntity(
            server._plants,
            this.characterId,
            "Character.ReplaceBaseModel",
            {
                characterId: this.characterId,
                modelId: this.actorModelId,
                }
        )
        const timeToAdd = this.isFertilized ? 28800000 / 2 : 28800000 // 4 or 8h based on fertilized or not
        this.nextStateTime = new Date().getTime() + timeToAdd
    }

    OnPlayerSelect(server: ZoneServer2016, client: ZoneClient2016) {
        if (this.growState != 3) return
        if (!server._temporaryObjects[this.parentObjectCharacterId]) {
            server.deleteEntity(this.characterId, server._plants)
            return
        }
        const parent = server._temporaryObjects[this.parentObjectCharacterId] as PlantingDiameter
        delete parent.seedSlots[this.slot]

        switch (this.item.itemDefinitionId) {
            case Items.SEED_WHEAT:
                client.character.lootItem(server, server.generateItem(Items.WHEAT))
                client.character.lootItem(server, server.generateItem(Items.SEED_WHEAT, 2), 2)
                break;
            case Items.SEED_CORN:
                client.character.lootItem(server, server.generateItem(Items.CORN))
                client.character.lootItem(server, server.generateItem(Items.SEED_CORN, 2), 2)
                break;
        }

        server.deleteEntity(this.characterId, server._plants)
    }

    OnInteractionString(server: ZoneServer2016, client: ZoneClient2016): void {
        if (this.growState != 3) return
        server.sendData(client, "Command.InteractionString", {
            guid: this.characterId,
            stringId: StringIds.TAKE_ITEM,
        });
    }
}