import {ZoneClient2016 as Client} from "../../../classes/zoneclient";
import {Euler, PlantingSetting, Vector4} from "../Model/TypeModels";
import {Euler2Quaternion, getLookAtPos, MoveToByParent, Quaternion2Euler} from "../Utils";
import {ZoneServer2016} from "../../../zoneserver";
import {Furrows, Hole, Seed} from "../Model/DataModels";
import {TemporaryEntity} from "../../../classes/temporaryentity";
import {generateRandomGuid} from "../../../../../utils/utils";
import {ItemObject} from "../../../classes/itemobject";
import {inventoryItem} from "../../../../../types/zoneserver";

const debug = require("debug")("PlantingManager");


export class FarmlandManager {
    //region variables
    private readonly _charactersFurrows: { [key: string]: Furrows[] };
    private readonly _furrowsUsePeriodTimers: { [key: string]: NodeJS.Timeout };
    private readonly _fertilizerExpirationTimers: { [key: string]: NodeJS.Timeout };
    private _server?: ZoneServer2016;

    //endregion

    constructor(
        public _setting: PlantingSetting,
        charactersFurrowsData: { [key: string]: Furrows[] } | null) {
        this._charactersFurrows = charactersFurrowsData ? charactersFurrowsData : {};
        this._furrowsUsePeriodTimers = {};
        this._fertilizerExpirationTimers = {};
        //re set timer on server restart
        if (charactersFurrowsData) {
            Object.entries(charactersFurrowsData).forEach(([k, v]) => {
                debug('resetting furrows and fertilizers timer, character guid:' + k);
                for (const furrows of v) {
                    this.setFurrowsTimeout(furrows, furrows.Duration);
                    for (const hole of furrows.Holes) {
                        if (hole.FertilizerDuration > 0) {
                            this.setFertilizerInHoleTimeout(hole, hole.FertilizerDuration)
                        }
                    }
                }
            });
        }
    }

    public Reclaim = (client: Client, server: ZoneServer2016): boolean => {
        if (!this._server) {
            this._server = server;
        }
        const rot = Quaternion2Euler(Vector4.FromXYZW({
            Z: client.character.state.rotation[0],
            Y: client.character.state.rotation[1],
            X: client.character.state.rotation[2],
            W: client.character.state.rotation[3]
        }), "XZY");
        const pos = FarmlandManager.calcLookAtPosition(client);
        // console.log('look at pos:', pos);
        // let rot = this.getBillboardRot(client);
        if (pos) {
            if (!this._charactersFurrows[client.character.characterId]) {
                this._charactersFurrows[client.character.characterId] = [];
            }
            const newFurrows = new Furrows(client.character.characterId, pos,
                new Euler(rot[0], 0, 0), Date.now(), this._setting.DefaultFurrowsDuration, [], server.generateGuid());
            this.placeFurrows(newFurrows, server);
            this.simulateCreateHoles(newFurrows);
            this._charactersFurrows[client.character.characterId].push(newFurrows);
            //If the furrows is not used, destroy it within a certain period of time
            this.setFurrowsTimeout(newFurrows, newFurrows.Duration);
            return true;
        }
        return false;
    }

    //If the furrows is reused its duration is extended beyond the crop maturity time
    public ReUseFurrows = (furrows: Furrows, cropDuration: number) => {
        const guid = furrows.Id;
        if (guid) {
            clearTimeout(this._furrowsUsePeriodTimers[guid]);
            this.setFurrowsTimeout(furrows, this._setting.DefaultFurrowsDuration + cropDuration);
            debug('reset furrows duration : ', furrows);
        }
    }

    //is simulating~~~~~~~~
    public SimulateGetSurroundingSowAbleFurrows = (client: Client,
                                                   //false is get role surrounding
                                                   bySightPoint: boolean): Furrows | null => {
        let usePos = new Vector4(client.character.state.position[2], client.character.state.position[1], client.character.state.position[0], client.character.state.position[3]);
        if (bySightPoint) {
            const sightPos = FarmlandManager.calcLookAtPosition(client);
            if (!sightPos) {
                debug('cant get sight point, use role pos');
            } else {
                usePos = sightPos;
            }
        }
        const fs = this.searchTiledFurrowsListAroundPosition(client.character.characterId, usePos, this._setting.FertilizerActionRadius);
        if (fs.length > 0) {
            let bestFurrows: Furrows;
            //get best hole
            for (const f of fs) {
                for (const hole of f.Holes) {
                    if (!hole.InsideCropsPile) {
                        bestFurrows = f;
                        return bestFurrows;
                    }
                }
            }
        }
        return null;
    }

    public GetSurroundingFertilizeAbleHoles = (client: Client, circleRadius: number): Hole[] => {
        const fs = this.searchTiledFurrowsListAroundPosition(client.character.characterId,
            new Vector4(client.character.state.position[2],
                client.character.state.position[1],
                client.character.state.position[0],
                client.character.state.position[3],
            ), circleRadius);
        const ret = [];
        //It can only be fertilize if there is something in it
        for (const f of fs) {
            for (const hole of f.Holes) {
                if (hole.InsideCropsPile) {
                    ret.push(hole);
                }
            }
        }
        return ret;
    }

    public BuryFertilizerIntoHole = (hole: Hole) => {
        if (hole.FertilizerDuration || (hole.Id && this._fertilizerExpirationTimers[hole.Id]))
            return false;
        this.setFertilizerInHoleTimeout(hole, this._setting.DefaultFertilizerDuration);
        this.triggerBuryFertilizerIntoHoleEffect(hole);
    }

    public MakeFertilizerUseless = (hole:Hole)=>
    {
        const guid = hole.Id;
        if (!guid) return;
        hole.LastFertilizeTime = undefined;
        hole.FertilizerDuration = 0;
        if(this._fertilizerExpirationTimers[guid])
        {
            clearTimeout(this._fertilizerExpirationTimers[guid]);
        }
    }

    public BurySeedIntoHole = (hole: Hole, seed: Seed, server: ZoneServer2016):inventoryItem|null => {
        const seedQU = Euler2Quaternion(hole.Rotation.Yaw, hole.Rotation.Pitch, hole.Rotation.Roll);
        //loot able seed at server side
        const objInHole = server.generateItem(seed.Type, 1);
        if (!objInHole || !objInHole.itemGuid)
            return null;
        //client side
        server._objects[objInHole.itemGuid] = new ItemObject(
            objInHole.itemGuid,
            server.getTransientId(objInHole.itemGuid),
            9163,
            hole.Position.ToFloat32ArrayZYXW(),
            // Euler.ToH1Z1ClientRotFormat(hole.Rotation),
            seedQU.ToFloat32ArrayZYXW(),
            hole.CreateTime,
            objInHole
        );
        return objInHole;
    }

    public ReFertilizeHole = (hole: Hole): boolean => {
        const guid = hole.Id;
        if (!guid) return false;
        if (!this._fertilizerExpirationTimers[guid])
            return false;
        clearTimeout(this._fertilizerExpirationTimers[guid]);
        delete this._fertilizerExpirationTimers[guid];
        this.setFertilizerInHoleTimeout(hole, this._setting.DefaultFertilizerDuration);
        this.triggerBuryFertilizerIntoHoleEffect(hole);
        return true;
    }

    public IsSeedOrCropsInHole = (itemGuid: string): Hole | null => {
        for (const cid of Object.keys(this._charactersFurrows)) {
            for (const f of this._charactersFurrows[cid]) {
                for (const hole of f.Holes) {
                    if (hole.InsideCropsPile && hole.InsideCropsPile.Guid == itemGuid) {
                        return hole;
                    }
                }
            }
        }
        return null;
    }

    //region private
    private static calcLookAtPosition(client: Client): Vector4 | null {
        const roleHeight = 1.5;
        const pos = client.character.state.position;
        // let euler = convertDudesQuaternion2Eul(client.character.state.rotation);
        const euler = Quaternion2Euler(Vector4.FromXYZW({
            Z: client.character.state.rotation[0],
            Y: client.character.state.rotation[1],
            X: client.character.state.rotation[2],
            W: client.character.state.rotation[3]
        }), "XZY");
        // console.log(pos,euler);
        if (euler[1] > 0) {
            debug('you cant place in the sky');
            return null;
        }
        // console.log('rol pos:', pos, 'euler:', euler, 'dest pos:',crossPos);
        return getLookAtPos(new Vector4(pos[2], pos[1], pos[0], 1), -euler[0], euler[2], euler[1], roleHeight);
    }

    private simulateCreateHoles = (destFurrows: Furrows): void => {
        const rot = new Euler(-destFurrows.Rotation.Yaw,0,0);
        const h1posRot = MoveToByParent(
            destFurrows.Position,
            rot,
            new Euler(Math.PI/4*0.8, 0, 0),
            0.38);
        h1posRot.NewPos.Y += 0.03;
        const h2posRot = MoveToByParent(
            destFurrows.Position,
            rot,
            new Euler(Math.PI/4*3, 0, 0),
            0.45);
        h2posRot.NewPos.Y += 0.03;
        const h3posRot = MoveToByParent(
            destFurrows.Position,
            rot,
            new Euler(Math.PI/4*5, 0, 0),
            0.38);
        h3posRot.NewPos.Y += 0.04;
        const h4posRot = MoveToByParent(
            destFurrows.Position,
            rot,
            new Euler(Math.PI/4*7-Math.PI/36, 0, 0),
            0.47);
        h4posRot.NewPos.Y += 0.03;

        destFurrows.Holes.push(new Hole(null, h1posRot.NewPos, destFurrows.Rotation, 0, generateRandomGuid()));
        destFurrows.Holes.push(new Hole(null, h2posRot.NewPos, destFurrows.Rotation, 0, generateRandomGuid()));
        destFurrows.Holes.push(new Hole(null, h3posRot.NewPos, destFurrows.Rotation, 0, generateRandomGuid()));
        destFurrows.Holes.push(new Hole(null, h4posRot.NewPos, destFurrows.Rotation, 0, generateRandomGuid()));
    }

    private placeFurrows = (furrows: Furrows, server: ZoneServer2016) => {
        if (!furrows.Id) return;
        // console.log('place angle, same as packet.data.orientation:', rot[0] / Math.PI * 180);
        //add to server dataset
        // const rotQU = Euler2Quaternion(furrows.Rotation.Yaw, furrows.Rotation.Pitch, furrows.Rotation.Roll);
        //Use a chair just to check the rotation rules
        // modelId: 10004,
        //9191 9190 9189,59 60 61 is wheat and corn sapling growing grown status model
        //if this param like [z,y,x] structure,calc order is: first rot y second rot z and third rot x.
        //y=yaw z=pitch and x=roll
        server._temporaryObjects[furrows.Id] = new TemporaryEntity(
            furrows.Id,
            server.getTransientId(furrows.Id),
            62,
            furrows.Position.ToFloat32ArrayZYXW(),
            // rotQU.ToFloat32ArrayZYXW()
            Euler.ToH1Z1ClientRotFormat(furrows.Rotation),
        );
    }

    //use for fertilize furrows or simple seed placement
    private searchTiledFurrowsListAroundPosition(characterId: string, sightPoint: Vector4, circleRadius: number): Furrows[] {
        const ret: Furrows[] = [];
        const fs = this._charactersFurrows[characterId];
        if (fs && fs.length > 0) {
            for (const f of fs) {
                if (Math.abs(Vector4.Distance(f.Position, sightPoint)) < circleRadius) {
                    ret.push(f);
                }
            }
        }
        return ret;
    }

    private removeFurrows = (furrows: Furrows) => {
        //if furrows contains seed or crops abort
        for (const h of furrows.Holes) {
            if (h.InsideCropsPile) {
                return false;
            }
        }
        const guid = furrows.Id;
        if (!guid) return;
        if (this._server) {
            this._server.deleteEntity(guid, this._server._temporaryObjects);
        }
        clearTimeout(this._furrowsUsePeriodTimers[guid]);
        delete this._furrowsUsePeriodTimers[guid];
    }

    private triggerRemoveFertilizerFromHoleEffect = (hole: Hole) => {
        if(!this._server) {
            debug('need to trigger the effect of fertilizer removal from the hole: ' ,hole);
            return false;
        }
        if(!hole || !hole.InsideCropsPile)
            return false;
        this._server.sendDataToAllWithSpawnedEntity(
            this._server._objects,
            hole.InsideCropsPile.Guid,
            "Command.PlayDialogEffect",
            {
                characterId: hole.InsideCropsPile.Guid,
                effectId: 2,
            }
        );
    }

    private triggerBuryFertilizerIntoHoleEffect = (hole: Hole) => {
        if(!this._server) {
            debug('need to trigger the effect of hole has been fertilize', hole);
            return;
        }
        let cid = null;
        if(hole.InsideCropsPile)
        {
            cid = hole.InsideCropsPile.Guid;
        }
        if(!cid)
            return;
        this._server.sendDataToAllWithSpawnedEntity(
            this._server._objects,
            cid,
            "Command.PlayDialogEffect",
            {
                characterId: cid,
                effectId: 5056,
            }
        );
    }

    private setFurrowsTimeout = (furrows: Furrows, totalDuration: number) => {
        const guid = furrows.Id;
        if (!guid) return;
        this._furrowsUsePeriodTimers[guid] = setTimeout(() => {
            this.removeFurrows(furrows);
        }, totalDuration);
        furrows.Duration = totalDuration;
    }

    private setFertilizerInHoleTimeout = (hole: Hole, duration: number) => {
        const guid = hole.Id;
        if (!guid) return;
        hole.LastFertilizeTime = Date.now();
        this._fertilizerExpirationTimers[guid] = setTimeout(() => {
            hole.LastFertilizeTime = undefined;
            hole.FertilizerDuration = 0;
            clearTimeout(this._fertilizerExpirationTimers[guid]);
            delete this._fertilizerExpirationTimers[guid];
            this.triggerRemoveFertilizerFromHoleEffect(hole);
        }, duration);
        hole.FertilizerDuration = duration;
    }
    //endregion
}
