import {ZoneClient2016 as Client} from "../../../classes/zoneclient";
import {Euler, Vector4} from "../Model/TypeModels";
import {Euler2Quaternion, getLookAtPos, MoveToByParent, Quaternion2Euler} from "../Utils";
import {ZoneServer2016} from "../../../zoneserver";
import {Furrows, Hole, Seed, SeedType} from "../Model/DataModels";


export class FarmlandManager {
    _charactersFurrows:{[key: string]:Furrows[]};

    //region private d3d calc functions
    //region cross pos calc
    private static calcLookAtPosition(client: Client): Vector4 | null {
        let roleHeight = 1.5;
        let pos = client.character.state.position;
        // let euler = convertDudesQuaternion2Eul(client.character.state.rotation);
        let euler = Quaternion2Euler(Vector4.FromXYZW({Z: client.character.state.rotation[0], Y: client.character.state.rotation[1], X: client.character.state.rotation[2], W: client.character.state.rotation[3]}), "XZY");
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
        let rot = Quaternion2Euler(Vector4.FromXYZW({Z: client.character.state.rotation[0], Y: client.character.state.rotation[1], X: client.character.state.rotation[2], W: client.character.state.rotation[3]}), "XZY");
        let pos = FarmlandManager.calcLookAtPosition(client);
        // console.log('look at pos:', pos);
        // let rot = this.getBillboardRot(client);
        if (pos && rot) {
            this.placeFurrows(<Vector4>pos, rot, server);
            if (!this._charactersFurrows[client.character.characterId])
            {
                this._charactersFurrows[client.character.characterId] = [];
            }
            let newFurrows = new Furrows(client.character.characterId,pos,
              new Euler(rot[0],0,0),Date.now(),3600000,[]);
            this.simulateCreateHoles(newFurrows);
            this._charactersFurrows[client.character.characterId].push(newFurrows);
            return true;
        }
        return false;
    }

    private simulateCreateHoles=(destFurrows:Furrows):void=>
    {
      for (let i = 0; i <4; i++) {
        let seedPosRot = MoveToByParent(destFurrows.Position, destFurrows.Rotation,
          new Euler(-Math.PI/4+(-Math.PI/2*i),0,0),
          0.4);
        // console.warn('播种到:',bestHoleIndexOfFurrows+1);
        // console.log('best furrows pos:', bestFurrows.Position);
        // console.log('best furrows rot:', bestFurrows.Rotation);
        console.log('seed pos:', seedPosRot.NewPos);
        destFurrows.Holes.push(new Hole(null,null,seedPosRot.NewPos,seedPosRot.NewRot));
      }
    }

    public SimulateGetSightPointSowAbleFurrows=(client:Client, server:ZoneServer2016):Furrows|null=>
    {
      let sightPoint = FarmlandManager.calcLookAtPosition(client);
      if (sightPoint) {
        let fs = this.searchTiledFurrowsListAroundSight(client.character.characterId, sightPoint, 0.2);
        if (fs.length>0)
        {
          let bestFurrows : any;
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
      }
      return null;
    }
    public SowSeedTest(client:Client,server:ZoneServer2016,itemId:number):boolean
    {
      if(!SeedType[itemId])
      {
        console.warn('it is not a valid seed item id');
        return false;
      }
        let sightPoint = FarmlandManager.calcLookAtPosition(client);
        if (sightPoint) {
            let fs = this.searchTiledFurrowsListAroundSight(client.character.characterId,sightPoint,0.2);
            // console.log('around furrows:', fs);
            if (fs.length>0)
            {
                let bestFurrows : any;
                let bestHole;
                let bestHoleIndexOfFurrows : any;
                //get best hole
                for (const f of fs) {
                    for (const hole of f.Holes) {
                        if (!hole.InsideSeed) {
                            bestFurrows = <Furrows>f;
                            bestHole = hole;
                            bestHoleIndexOfFurrows = f.Holes.indexOf(hole);
                            break;
                        }
                    }
                    if (bestHole) {
                        break;
                    }
                }
                //get best hole pos
                //360deg is Math.PI*2;
                //in h1z1 world,
                //45 = -Math.PI/4
                //135 = -Math.PI/4*3
                //225 = Math.PI/4*3
                //315 = Math.PI/4
                if (bestFurrows && bestHole)
                {
                    // let seedPosRot = MoveToByParent(bestFurrows.Position, bestFurrows.Rotation,
                    //     new Euler(-Math.PI/4+(-Math.PI/2*bestHoleIndexOfFurrows),0,0),
                    //     0.4);
                    // console.warn('播种到:',bestHoleIndexOfFurrows+1);
                    // console.log('best furrows pos:', bestFurrows.Position);
                    // console.log('best furrows rot:', bestFurrows.Rotation);
                    // console.log('seed pos:', seedPosRot.NewPos);
                    // this.placeSeedOrCrop(seedPosRot.NewPos,
                    //     //same as parent rot,but use new pos
                    //     bestFurrows.Rotation
                    //     ,9163,server);
                    //     bestHole.InsideSeed = new Seed(itemId,Date.now());
                    //     return true;
                }
            }
        }
        return false;
    }

    private placeFurrows(pos: Vector4, rot: Float32Array, server: ZoneServer2016) {
        let characterId = server.generateGuid();
        let guid = server.generateGuid();
        let transientId = server.getTransientId(guid);
        // console.log('place angle, same as packet.data.orientation:', rot[0] / Math.PI * 180);
        //add to server dataset
        let rotQU = Euler2Quaternion(rot[0],0,0);
        let newFurrows ={
            characterId: characterId,
            guid: guid,
            transientId: transientId,
            //Use a chair just to check the rotation rules
            // modelId: 10004,
            modelId:62,
            //9191 9190 9189,59 60 61 is wheat and corn sapling growing grown status model
            position: new Float32Array([pos.Z, pos.Y, pos.X]),
            //client calc order like below:
            //if this param like [z,y,x] structure,calc order is: first rot y second rot z and third rot x.
            //y=yaw z=pitch and x=roll
            rotation: new Float32Array([rotQU.Z,rotQU.Y,rotQU.X,rotQU.W]),
            dontSendFullNpcRequest: true,
            color: {},
            attachedObject: {},
        };
        // console.log('furrows rot qu:', rotQU);
        server._temporaryObjects[characterId] = newFurrows;
            server.sendDataToAll("AddLightweightNpc", newFurrows);
        setTimeout(function () {
            server.sendDataToAllWithSpawnedTemporaryObject(
                characterId,
                "Character.RemovePlayer",
                {
                    characterId: characterId,
                }
            );
            delete server._temporaryObjects[characterId];
        }, 20000);
        return true;
    }

    // private placeSeedOrCrop(pos:Vector4, rot: Euler,modelId:number, server:ZoneServer2016):boolean
    // {
    //     let characterId = server.generateGuid();
    //     let guid = server.generateGuid();
    //     let transientId = server.getTransientId(guid);
    //     let seedQU= Euler2Quaternion(rot.Yaw,rot.Pitch,rot.Roll);
    //     //add to server dataset
    //     let obj ={
    //         characterId: characterId,
    //         guid: guid,
    //         transientId: transientId,
    //         modelId:modelId,
    //         //9191 9190 9189,59 60 61 is wheat and corn sapling growing grown status model
    //         position: new Float32Array([pos.Z, pos.Y+0.05, pos.X]),
    //         //client calc order like below:
    //         //if like [z,y,x] structure,calc order is: first rot y second rot z and third rot x.
    //         //y=yaw z=pitch and x=roll
    //         // rotation: new Float32Array([0, rot.Yaw, 0]),
    //         rotation: new Float32Array([seedQU.Z,seedQU.Y,seedQU.X,seedQU.W]),
    //         dontSendFullNpcRequest: true,
    //         color: {},
    //         attachedObject: {},
    //     };
    //     server._temporaryObjects[characterId] = obj;
    //     server.sendDataToAll("AddLightweightNpc", obj);
    //     setTimeout(function () {
    //         server.sendDataToAllWithSpawnedTemporaryObject(
    //             characterId,
    //             "Character.RemovePlayer",
    //             {
    //                 characterId: characterId,
    //             }
    //         );
    //         delete server._temporaryObjects[characterId];
    //     }, 20000);
    //     return true;
    // }

    //use for fertilize furrows or simple seed placement
    private searchTiledFurrowsListAroundSight(characterId:string, sightPoint: Vector4, circleRadius: number):Furrows[] {
        let ret :Furrows[] = [];
        let fs = this._charactersFurrows[characterId];
        if (fs && fs.length > 0) {
            for (const f of fs) {
                if (Math.abs(Vector4.Distance(f.Position, sightPoint)) <circleRadius)
                {
                    ret.push(f);
                }
            }
        }
        return ret;
    }

    constructor(charactersFurrowsData:{[key: string]:Furrows[]}|null) {
        this._charactersFurrows = charactersFurrowsData? charactersFurrowsData:{};
    }
}
