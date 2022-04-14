import {ZoneClient2016 as Client} from "../../../classes/zoneclient";
import {Euler, PlantingSetting, Vector4} from "../Model/TypeModels";
import {Euler2Quaternion, getLookAtPos, MoveToByParent, Quaternion2Euler} from "../Utils";
import {ZoneServer2016} from "../../../zoneserver";
import {Furrows, Hole, Seed} from "../Model/DataModels";
import {TemporaryEntity} from "../../../classes/temporaryentity";
import {generateRandomGuid} from "../../../../../utils/utils";


export class FarmlandManager {
    private readonly _charactersFurrows: { [key: string]: Furrows[] };
    private readonly _furrowsUsePeriodTimers: { [key: string]: NodeJS.Timeout };
    private readonly _fertilizerExpirationTimers: { [key: string]: NodeJS.Timeout };
    private _server?: ZoneServer2016;

    //region private d3d calc functions
    //region cross pos calc
    private static calcLookAtPosition(client: Client): Vector4 | null {
        let roleHeight = 1.5;
        let pos = client.character.state.position;
        // let euler = convertDudesQuaternion2Eul(client.character.state.rotation);
        let euler = Quaternion2Euler(Vector4.FromXYZW({
            Z: client.character.state.rotation[0],
            Y: client.character.state.rotation[1],
            X: client.character.state.rotation[2],
            W: client.character.state.rotation[3]
        }), "XZY");
        // console.log(pos,euler);
        if (euler[1] > 0) {
            console.warn('you cant place in the sky');
            return null;
        }
        // console.log('rol pos:', pos, 'euler:', euler, 'dest pos:',crossPos);
        return getLookAtPos(new Vector4(pos[2], pos[1], pos[0], 1), -euler[0], euler[2], euler[1], roleHeight);
    }

    //endregion
    //endregion
    public Reclaim = (client: Client, server: ZoneServer2016): boolean => {
        if (!this._server) {
            this._server = server;
        }
        let rot = Quaternion2Euler(Vector4.FromXYZW({
            Z: client.character.state.rotation[0],
            Y: client.character.state.rotation[1],
            X: client.character.state.rotation[2],
            W: client.character.state.rotation[3]
        }), "XZY");
        let pos = FarmlandManager.calcLookAtPosition(client);
        // console.log('look at pos:', pos);
        // let rot = this.getBillboardRot(client);
        if (pos) {
            if (!this._charactersFurrows[client.character.characterId]) {
                this._charactersFurrows[client.character.characterId] = [];
            }
            let newFurrows = new Furrows(client.character.characterId, pos,
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

    //If the furrows is reused it's duration is extended beyond the crop maturity time
    public ReUseFurrows = (furrows: Furrows, cropDuration: number) => {
        const guid = furrows.Id;
        if (guid) {
            clearTimeout(this._furrowsUsePeriodTimers[guid]);
            this.setFurrowsTimeout(furrows, this._setting.DefaultFurrowsDuration + cropDuration);
            console.log('reset furrows duration : ', furrows);
        }
    }

    //is simulating~~~~~~~~
    public SimulateGetSurroundingSowAbleFurrows = (client: Client,
                                                   //false is get role surrounding
                                                   bySightPoint: boolean): Furrows | null => {
        let usePos = new Vector4(client.character.state.position[2], client.character.state.position[1], client.character.state.position[0], client.character.state.position[3]);
        if (bySightPoint) {
            let sightPos = FarmlandManager.calcLookAtPosition(client);
            if (!sightPos) {
                console.log('cant get sight point, use role pos');
            } else {
                usePos = sightPos;
            }
        }
        let fs = this.searchTiledFurrowsListAroundPosition(client.character.characterId, usePos, this._setting.FertilizerActionRadius);
        if (fs.length > 0) {
            let bestFurrows: any;
            //get best hole
            for (const f of fs) {
                for (const hole of f.Holes) {
                    if (!hole.InsideSeed) {
                        bestFurrows = <Furrows>f;
                        return bestFurrows;
                    }
                }
            }
        }
        return null;
    }

    public GetSurroundingFertilizeAbleHoles = (client: Client, circleRadius: number): Hole[] => {
        let fs = this.searchTiledFurrowsListAroundPosition(client.character.characterId,
            new Vector4(client.character.state.position[2],
                client.character.state.position[1],
                client.character.state.position[0],
                client.character.state.position[3],
            ), circleRadius);
        let ret = [];
        //It can only be fertilize if there is something in it
        for (const f of fs) {
            for (const hole of f.Holes) {
                if (hole.InsideSeed || hole.InsideCropsPile) {
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

    public BurySeedIntoHole = (hole: Hole, seed: Seed, server: ZoneServer2016) => {
        if (!hole.Id) return;
        let seedQU = Euler2Quaternion(hole.Rotation.Yaw, hole.Rotation.Pitch, hole.Rotation.Roll);
        server._temporaryObjects[hole.Id] = new TemporaryEntity(
            hole.Id, server.getTransientId(hole.Id), 9163, hole.Position.ToFloat32ArrayZYXW(), seedQU.ToFloat32ArrayZYXW()
        );
    }

    public ReFertilizeHole = (hole: Hole): boolean => {
        let guid = hole.Id;
        if (!guid) return false;
        if (!this._fertilizerExpirationTimers[guid])
            return false;
        clearTimeout(this._fertilizerExpirationTimers[guid]);
        delete this._fertilizerExpirationTimers[guid];
        this.setFertilizerInHoleTimeout(hole, this._setting.DefaultFertilizerDuration);
        return true;
    }

    private simulateCreateHoles = (destFurrows: Furrows): void => {
        for (let i = 0; i < 4; i++) {
            let seedPosRot = MoveToByParent(destFurrows.Position, destFurrows.Rotation,
                new Euler(-Math.PI / 4 + (-Math.PI / 2 * i), 0, 0),
                0.4);
            // console.warn('播种到:',bestHoleIndexOfFurrows+1);
            // console.log('best furrows pos:', bestFurrows.Position);
            // console.log('best furrows rot:', bestFurrows.Rotation);
            console.log('seed pos:', seedPosRot.NewPos);
            seedPosRot.NewPos.W = 0;
            destFurrows.Holes.push(new Hole(null, null, seedPosRot.NewPos, seedPosRot.NewRot, 0, generateRandomGuid()));
        }
    }

    private placeFurrows = (furrows: Furrows, server: ZoneServer2016) => {
        if (!furrows.Id) return;
        // console.log('place angle, same as packet.data.orientation:', rot[0] / Math.PI * 180);
        //add to server dataset
        let rotQU = Euler2Quaternion(furrows.Rotation.Yaw, furrows.Rotation.Pitch, furrows.Rotation.Roll);
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
            rotQU.ToFloat32ArrayZYXW());
    }

    //use for fertilize furrows or simple seed placement
    private searchTiledFurrowsListAroundPosition(characterId: string, sightPoint: Vector4, circleRadius: number): Furrows[] {
        let ret: Furrows[] = [];
        let fs = this._charactersFurrows[characterId];
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
            if (h.InsideCropsPile || h.InsideSeed) {
                return false;
            }
        }
        const guid = furrows.Id;
        if (!guid) return;
        if (this._server) {
            this._server.deleteEntity(guid,this._server._temporaryObjects);
        }
        clearTimeout(this._furrowsUsePeriodTimers[guid]);
        delete this._furrowsUsePeriodTimers[guid];
    }

    private triggerRemoveFertilizerFromHoleEffect = (hole: Hole) => {
        console.log('need to trigger the effect of fertilizer removal from the hole', hole);
    }

    private triggerBuryFertilizerIntoHoleEffect = (hole: Hole) => {
        console.log('need to trigger the effect of hole has been fertilize', hole);
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
        this._fertilizerExpirationTimers[guid] = setTimeout(() => {
            hole.LastFertilizeTime = undefined;
            hole.FertilizerDuration = 0;
            clearTimeout(this._fertilizerExpirationTimers[guid]);
            delete this._fertilizerExpirationTimers[guid];
            this.triggerRemoveFertilizerFromHoleEffect(hole);
        }, duration);
        hole.FertilizerDuration = duration;
    }

    constructor(
        public _setting: PlantingSetting,
        charactersFurrowsData: { [key: string]: Furrows[] } | null) {
        this._charactersFurrows = charactersFurrowsData ? charactersFurrowsData : {};
        this._furrowsUsePeriodTimers = {};
        this._fertilizerExpirationTimers = {};
        //re set timer on server restart
        if (charactersFurrowsData) {
            Object.entries(charactersFurrowsData).forEach(([k, v]) => {
                console.log('resetting furrows and fertilizers timer, character guid:', k);
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
}
