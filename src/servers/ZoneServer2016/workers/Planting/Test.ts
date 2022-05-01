import {Euler2Quaternion, getLookAtPos, MoveToByParent, Quaternion2Euler, Transform} from "./Utils";
import {Euler, Quaternion, Vector4} from "./Model/TypeModels";
import {ZoneServer2016} from "../../zoneserver";
import {ZoneClient2016 as Client, ZoneClient2016} from "../../classes/zoneclient";
import {PlantingManager} from "./PlantingManager";
import {Furrows, Hole, SeedType} from "./Model/DataModels";
import {TemporaryEntity} from "../../classes/temporaryentity";
import {generateRandomGuid} from "../../../../utils/utils";

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace NormanTest {
//test euler from client->server->quaternion encode(by other dude,not correct maybe)->decode to euler
    const Test = () => {
        //server received : -1.24,-0.1,-0.23; it's order by yaw pitch roll, i am sure.
        //eul2quat function got : {X:0.02618025 Y:-0.5811435 Z:-0.122121 W:0.80416}
        //order by x y z w mode: let qu = {X:0.02618025, Y:-0.5811435, Z:-0.122121, W:0.80416};(not work)
        //order by z y x w mode, that's right
        const qu = new Vector4(-0.122121, -0.5811435, 0.02618025, 0.80416);
        const methods = ["ZYX", "ZYZ", "ZXY", "ZXZ", "YXZ", "YXY", "YZX", "YZY", "XYZ", "XYX", "XZY", "XZX"];
        for (let i = 0; i < methods.length; i++) {
            const currentMethod = methods[i];
            const currentQu = Quaternion2Euler(qu, currentMethod);
            console.log('使用四元数的ZYX:当前方法:', currentMethod, '方法值', currentQu);
        }
        //:::2 steps calc server received euler 2 quaternion:::
        //step 1:
        //in value:h1z1 client->h1emu server(here, as origin euler angle3)->quaternion converted by eul2quat method
        //out value:x z y origin euler angle(server received origin euler)
        const q = Quaternion2Euler(qu, "XZY");
        console.log('z->y->x->w quaternion 2 euler by XZY result:', q);
        console.warn('q value is not a x y z info struct, it contains yaw pitch row info, yaw=q[0] pitch=q[1] roll=q[2]');
        //step 2:
        //in value:server received origin euler
        //out value:quaternion,same as c# and eul2quat function's result
        const e = Euler2Quaternion(q[0], q[1], q[2]);
        console.log('XZY(origin->eul->q4->eul) euler(yaw pitch roll) 2 quaternion by yaw=x, pitch=y, roll=z calc result:', e);
        //region is not right this:
        // /*
        //   // * idk the euler 2 quaternion function call use yaw=x pitch=y and roll=z is incorrect
        //   // * i try to rotation a object, use yaw=y pitch=z and roll=x,it works for me*/
        //   // let eRight = Euler2Quaternion(q[1],q[2],q[0]);
        //   // console.log('right quaternion values is :', eRight);
        //endregion
    };


//region just a test
//decode encoded euler angle by given values test, values from utils_1.eul2quat
    export const convertDudesQuaternion2Eul = (qu: Float32Array): Float32Array => {
        const quaternion = Vector4.FromXYZW({Z: qu[0], Y: qu[1], X: qu[2], W: qu[3]});
        return Quaternion2Euler(quaternion, "XZY");
    };
//input a role standing position and look down angle(2/PI~-2/PI) and roleHeight to calc some positions around role standing position,default count is 12;
    const standLookAroundPositions = (standPos: Vector4, lookDownAngle: number, roleHeight: number): Array<Vector4> => {
        const lookAroundPosList = new Array<Vector4>();
        // let rolePos = {X:x,Y:world.Y,Z:z,W:1};
        const cameraPos = Vector4.FromXYZW({X: standPos.X, Y: standPos.Y + roleHeight, Z: standPos.Z, W: 1});
        console.log('cameraPos:', cameraPos);
        // let cameraDefaultDirect = {X: 1, Y: 0, Z: 0, W: 0};
        const testYawCount = 12;
        for (let k = 0; k < testYawCount; k++) {
            const yaw = (Math.PI * 2) / testYawCount * k - Math.PI;
            // -Math.PI/6;//angle 30;
            const crossPos = getLookAtPos(standPos, yaw, 0, lookDownAngle, roleHeight)
            if (!crossPos || Math.abs(crossPos.X) > 2000 || Math.abs(crossPos.Z) > 2000) {
                console.warn('the cross position maybe incorrect:', crossPos);
            } else {
                lookAroundPosList.push(crossPos);
            }
            // console.log('pos:', rolePos, '  angle:',yaw,0,roll, '  cross pos',crossPos);
        }
        return lookAroundPosList;
    }
//endregion
    const Test2 = () => {
        //{0:0.02618025 1:-0.5811435 2:-0.122121 3:0.80416}
        const ret = convertDudesQuaternion2Eul(new Float32Array([0.02618025, -0.5811435, -0.122121, 0.80416]));
        //-1.24,-0.1,-0.23
        console.log('convert from the quaternion decoded ret is :', ret);
        console.log(standLookAroundPositions(new Vector4(1, 0, 0, 1), -Math.PI / 4, 0.5));
    }

//simulate role move and get look at pos
    const Test3 = () => {
        const perGridSize = 100;
        const world = {X: -1000, Y: 30, Z: -1000, Width: 2000, Height: 0, Depth: 2000};
        for (let i = 0; i < world.Width; i += perGridSize) {
            const x = i - world.Width / 2;
            for (let j = 0; j < world.Depth; j += perGridSize) {
                const z = j - world.Depth / 2;
                //look down 45 deg and role height set 2m;
                // let crossList = standLookAround(CreateV4(x,world.Y,z,1),Math.PI/4,2);

                // let crossList = standLookAround(CreateV4(x,world.Y,z,1),Math.PI/4,2);
                // console.log(crossList)

                const cross = getLookAtPos(new Vector4(x, world.Y, z, 1), -1.24, -0.1, 0.23, 1.5);
                console.log('cross pos:', cross);
            }
        }
    }
//test given location and euler info to calc look at pos

//look at pos get test
    const Test4 = () => {
        //region if same below,that's right
        //euler
        // Array(4) [-2.15,
        //     -0.22,
        //     0,
        //     0]
        //pos
        // {
        //     "0": 1837.5400390625,
        //     "1": 64.3499984741211,
        //     "2": -427,
        //     "3": 0
        // }
        //endregion
        const stand = {
            Z: 1837.5400390625,
            Y: 64.3499984741211,
            X: -427,
            W: 0
        }
        const ret = getLookAtPos(Vector4.FromXYZW(stand), -2.15, 0, 0.22, 1.5);
        console.log(ret);
    }

//get positions for fly flares like a kite
    export const GetKiteLineDots = (eyePos: Vector4, yaw: number, pitch: number, roll: number, perDotDistance: number, dotCount: number): Array<Vector4> => {
        const ret = new Array<Vector4>();
        let roleDirect = Transform(new Vector4(1, 0, 0, 0), Euler2Quaternion(yaw, pitch, roll));
        roleDirect = Vector4.Normalize(roleDirect);
        for (let i = 0; i < dotCount; i++) {
            let current = Vector4.Multiply(roleDirect, perDotDistance * (i + 1));
            current = new Vector4(current.X + eyePos.X, current.Y + eyePos.Y, current.Z + eyePos.Z, 1);
            ret.push(current);
        }
        return ret;
    }
    const Test5 = () => {
        console.log(GetKiteLineDots(new Vector4(0, 1.5, 0, 1), -Math.PI / 4, 0, Math.PI / 6, 0.2, 100));
    }

//rot rot rot
    const RotRotRotByParent = (firstMoved: Vector4, times: number, perTimeAngle: number, distance: number) => {
        const start = firstMoved;
        let parentDir = Vector4.Normalize(start);
        let currentWorld = start;
        for (let i = 0; i < times; i++) {
            let newDir = parentDir;
            newDir = Transform(newDir, Euler2Quaternion(perTimeAngle, 0, 0));
            parentDir = newDir;
            // console.log(newDir);
            const newLine = Vector4.Multiply(newDir, distance);
            // parent = newLine;
            // console.log(newDir)
            currentWorld = Vector4.Add(currentWorld, newLine);
            currentWorld.W = 1;
            console.log('current world', Vector4.ForceToFixed(currentWorld, 3));
        }
    }
    const Test6 = () => {
        //turn 45 deg 8/16/24/32 .... will go back the first start point
        RotRotRotByParent(new Vector4(2, 0, 0, 1), 16, -Math.PI / 4, 2);
    }


//move by parent test
    const Test7 = () => {
        const euler1 = {Yaw: -Math.PI / 4, Pitch: 0, Roll: 0};
        const newPos = MoveToByParent(new Vector4(2, 0, 0, 1),
            new Euler(0, 0, 0),
            euler1,
            2);
        console.log(Vector4.ForceToFixed(newPos.NewPos, 2));
        const euler2 = new Euler(Math.PI / 4, 0, 0);
        /*
        turn left 45 deg and move 2 distance  then  turn right 45 deg base on it's parent's pose
        like below
            ___
        ___/

        * */
        const newPos2 = MoveToByParent(newPos.NewPos,
            euler1,
            euler2,
            2
        );
        console.log(Vector4.ForceToFixed(newPos2.NewPos, 2));

        /*
        2,0 to left 45deg and move 2distance is 3.41,1.41
        ant to right 45deg and move 2distance is 5.41,1.41
        and to right 45deg and move 2distance is 6.83,0
        like this

            ___
        ___/   \

        * */
        const newPos3 = MoveToByParent(newPos2.NewPos, newPos2.NewRot, new Euler(Math.PI / 4, 0, 0), 2);
        console.log(Vector4.ForceToFixed(newPos3.NewPos, 2));
    }


//reclaim furrows and auto place 4seeds;
    const Test8 = () => {
        const server = new ZoneServer2016(
            1117,
            Buffer.from("F70IaxuU8C/w7FPXY1ibXw==", "base64"),
            process.env.MONGO_URL,
            2
        );
        // server.start();
        const client = new ZoneClient2016(0, "", "", "norman", 888);
        //z y x / N E sky
        client.character.state.position = new Float32Array([0, 0, 2]);
        //quaternion i am not use
        const qu = Euler2Quaternion(0, 0, -Math.PI / 4);
        client.character.state.rotation = new Float32Array([qu.Z, qu.Y, qu.X, qu.W]);
        //euler z y x   but   rot y -> z -> x;
        // client.character.state.rotationRaw = new Float32Array([0,-Math.PI/6,0]);

        const m = new PlantingManager(null);
        m.Reclaim(client, server);
        for (let i = 0; i < 1; i++) {
            m.SowSeed(client, server, SeedType.Corn, server.generateGuid());
        }
    }


//placement params test
    const Test9 = (client: ZoneClient2016, server: ZoneServer2016) => {
        for (let i = 0; i < 100000; i++) {
            const delay = i * 100;
            setTimeout(() => {
                server.sendData(client, "Construction.PlacementResponse", {
                    unknownDword1: i,
                    model: 9130,
                });
                console.log('place test ', i);
            }, delay)
        }
    }

//do place flares on sight line test
    const placeFlare = (pos: Vector4, rot: Float32Array, duration: number, server: ZoneServer2016) => {
        const p = pos.ToFloat32ArrayZYXW();
        console.log('目标位置:', p, '旋转:', rot);
        const cid = server.generateGuid();
        server._temporaryObjects[cid] = new TemporaryEntity(
            cid,
            server.getTransientId(cid),
            1,
            p,
            rot
            // new Float32Array([0,0,0])
        );
        // server.sendDataToAll("AddLightweightNpc", flare);
        setTimeout(function () {
            server.deleteEntity(cid, server._temporaryObjects);
        }, duration);
        return true;
    }
    const placeChair = (pos: Vector4, rot: Float32Array, duration: number, server: ZoneServer2016) => {
        const p = pos.ToFloat32ArrayZYXW();
        console.log('目标位置:', p, '旋转:', rot);
        const cid = server.generateGuid();
        server._temporaryObjects[cid] = new TemporaryEntity(
            cid,
            server.getTransientId(cid),
            10004,
            p,
            rot
            // new Float32Array([0,0,0])
        );
        // server.sendDataToAll("AddLightweightNpc", flare);
        setTimeout(function () {
            server.deleteEntity(cid, server._temporaryObjects);
        }, duration);
        return true;
    }
    export const Test10 = (client: ZoneClient2016, server: ZoneServer2016, distance:number, modelId:number) => {
        //effect params
        const eyeHeight = 1.5, perDotDistance = 0.5, dotCount = 50, perPlaceDelay = 20,
            duration = 10000 + dotCount * perPlaceDelay;

        // let rot = client.character.state.rotationRaw;
        const rot = Quaternion2Euler(Vector4.FromXYZW({
            Z: client.character.state.rotation[0],
            Y: client.character.state.rotation[1],
            X: client.character.state.rotation[2],
            W: client.character.state.rotation[3]
        }), "XZY");
        const positions = GetKiteLineDots(new Vector4(client.character.state.position[2], client.character.state.position[1] + eyeHeight, client.character.state.position[0], client.character.state.position[0]),
            -rot[0], 0, rot[1],
            perDotDistance, dotCount
        );
        // console.log('人物位置:', client.character.state.position);
        // const cid = server.generateGuid();
        // const tid = server.getTransientId(cid);
        // server._temporaryObjects[cid] = new TemporaryEntity(
        //     cid,
        //     tid,
        //     1,
        //     client.character.state.position,
        //     client.character.state.lookAt,
        // );
        server.sendChatText(client,'place on sight started');
        for (let i = 0; i < positions.length; i++) {
            setTimeout(() => {
                    // placeFlare(positions[i], rot, duration, server);
                    if (modelId === 1) {
                        placeFlare(positions[i], new Float32Array([0, 0, 0, 0]), duration, server);
                    } else if (modelId === 10004) {
                        placeChair(positions[i], new Float32Array([0, rot[0], 0]), duration, server);
                    } else {
                        placeModel(positions[i], 0, modelId, server);
                    }
                },
                (i + 1) * perPlaceDelay)
        }
    }
    export const placeModel = (pos: Vector4, offsetY: number, modelId: number, server: ZoneServer2016, rot:Euler=new Euler(0,0,0)) => {
        const characterId = server.generateGuid();
        const transientId = server.getTransientId(characterId);
        // const realPos = new Vector4(pos.X, pos.Y + offsetY, pos.Z, pos.W);
        server._temporaryObjects[characterId] = new TemporaryEntity(characterId,
            transientId,
            modelId,
            pos.ToFloat32ArrayZYXW(),
            Euler.ToH1Z1ClientRotFormat(rot));
    }

    const placeModels = (server: ZoneServer2016, startPos: Vector4, offsetY: number, perModelDistance: number, perPlaceDelay: number) => {
        let models: any = [];
        try {
            models = require("../../../../../../data/2016/dataSources/Models.json");
        } catch (e) {
            console.log(e);
        }
        console.log('start pos is :', startPos);
        let row = 0;
        for (let i = 0; i < models.length; i++) {
            if (i % 20 == 0) {
                row++;
            }
            const current = models[i];
            setTimeout(() => {
                const destPos = new Vector4(startPos.X + i * perModelDistance, startPos.Y, startPos.Z + row * perModelDistance, 1);
                console.log('model id :', current.ID, 'pos:', destPos)
                placeModel(destPos, offsetY, current.ID, server);
            }, i * perPlaceDelay
            )
        }
    }

//place all models on ground test
    const Test11 = (client: ZoneClient2016, server: ZoneServer2016) => {
        placeModels(server, new Vector4(client.character.state.position[2], client.character.state.position[1], client.character.state.position[0], 1),
            0.2, 1, 100);
    }

//get 4 positions for seeds
    const Test12 = () => {
        //region test1
        // let furrowsPos = new Vector4(2,0,2,1);
        // let furrowsPosDistanceOfWorld = Vector4.Distance(furrowsPos, new Vector4(0,0,0,1));
        // console.log('furrows distance ', furrowsPosDistanceOfWorld);
        // let furrowsRot = new Euler(-Math.PI/4,0,0);
        // for (let i = 0; i <4; i++) {
        //     let seedPosAndRot = MoveToByParent(furrowsPos,furrowsRot,new Euler(-Math.PI/4+(-Math.PI/2*i),0,0),1.414);
        //     console.log(Vector4.ForceToFixed(seedPosAndRot.NewPos,2));
        //     console.log(seedPosAndRot.NewRot);
        // }
        // //distance=1
        // // ->2,3   1,2  2,1  3,2
        // //distance=1.414
        // // -> 2,3.41  0.586,2,  2,0.586  3.41,2
        //endregion

        //region test2 see vector4moveByParent.skp
        // let worldDir = new Vector4(1, 0, 0, 0);
        const furrowsPosRot = MoveToByParent(new Vector4(0, 0, 0, 1), new Euler(0, 0, 0), new Euler(-Math.PI / 6, 0, 0), 500);
        const furrowsPos = furrowsPosRot.NewPos;
        console.log('furrowsPos = ', furrowsPosRot);
        const furrowsPosDistanceOfWorld = Vector4.Distance(furrowsPos, new Vector4(0, 0, 0, 1));
        console.log('furrows distance ', furrowsPosDistanceOfWorld);
        const furrowsRot = furrowsPosRot.NewRot;
        for (let i = 0; i < 4; i++) {
            const seedPosAndRot = MoveToByParent(furrowsPos, furrowsRot, new Euler(-Math.PI / 4 + (-Math.PI / 2 * i), 0, 0), 70.7);
            console.log(Vector4.ForceToFixed(seedPosAndRot.NewPos, 2));
            // console.log(seedPosAndRot.NewRot);
        }
        //endregion
    }

    const simulateCreateHoles = (destFurrows: Furrows): void => {
        const rot = new Euler(-destFurrows.Rotation.Yaw,0,0);
        const h1yaw = Math.PI/4*0.8;
        const h2yaw = Math.PI/4*3;
        const h3yaw = Math.PI/4*5;
        const h4yaw = Math.PI/4*7-Math.PI/36;

        const h1far = 0.38;
        const h2far = 0.45;
        const h3far = 0.38;
        const h4far = 0.47;

        const h1posRot = MoveToByParent(
            destFurrows.Position,
            rot,
            new Euler(h1yaw, 0, 0),
            h1far);
        h1posRot.NewPos.Y += 0.03;
        const h2posRot = MoveToByParent(
            destFurrows.Position,
            rot,
            new Euler(h2yaw, 0, 0),
            h2far);
        h2posRot.NewPos.Y += 0.03;
        const h3posRot = MoveToByParent(
            destFurrows.Position,
            rot,
            new Euler(h3yaw, 0, 0),
            h3far);
        h3posRot.NewPos.Y += 0.04;
        const h4posRot = MoveToByParent(
            destFurrows.Position,
            rot,
            new Euler(h4yaw, 0, 0),
            h4far);
        h4posRot.NewPos.Y += 0.03;

        destFurrows.Holes.push(new Hole(null, null, h1posRot.NewPos, destFurrows.Rotation, 0, generateRandomGuid()));
        destFurrows.Holes.push(new Hole(null, null, h2posRot.NewPos, destFurrows.Rotation, 0, generateRandomGuid()));
        destFurrows.Holes.push(new Hole(null, null, h3posRot.NewPos, destFurrows.Rotation, 0, generateRandomGuid()));
        destFurrows.Holes.push(new Hole(null, null, h4posRot.NewPos, destFurrows.Rotation, 0, generateRandomGuid()));
    }
    export const TestEntry = (server: ZoneServer2016 | null = null, client: Client | null = null, args : any[] | null = null) => {
        if (!args) {
            return;
        }
        // if (!server) {
        //     server = new ZoneServer2016(
        //         1117,
        //         Buffer.from("F70IaxuU8C/w7FPXY1ibXw==", "base64"),
        //         process.env.MONGO_URL,
        //         2
        //     );
        // }
        // server.start();
        // if (!client) {
        //     client = new ZoneClient2016(0, "", "", "norman", 888);
        // }
        if (!args[1]) {
            if(server && client)
            server.sendChatText(client, "missing sub command");
            return ;
        }
        const cmd = args[1].toLowerCase();
        const pos = client? Vector4.FromH1Z1ClientPosFormat(client.character.state.position):new Vector4(2,0,0,1);
        const rot = client? Quaternion2Euler(Quaternion.FromXYZW({
            Z: client.character.state.rotation[0],
            Y: client.character.state.rotation[1],
            X: client.character.state.rotation[2],
            W: client.character.state.rotation[3]
        }), "XZY"):new Float32Array([Math.PI/4,0,0])
        switch (cmd) {
            //show model center
            case 'mc':
                if (!args[2]) {
                    if(server && client)
                    server.sendChatText(client, "missing model id");
                    return;
                }
                if(server)
                {
                NormanTest.placeModel(pos, 0, Number(args[2]), server
                );
                //place a flare to finger out model center
                NormanTest.placeModel(pos, 0, 1, server);}
                break;
            //show furrows holes location
            case 'fh':
                if(server) {
                    const f = new Furrows('', pos, new Euler(rot[0], 0, 0), 1, 100000, [], '');
                    console.log('furrows pos:', Vector4.ForceToFixed(f.Position,2), 'rotation:', Euler.ForceToFixed(f.Rotation));
                    NormanTest.placeModel(f.Position, 0, 62, server, f.Rotation);
                    //center
                    NormanTest.placeModel(f.Position, 0.2, 9163, server, f.Rotation);
                    simulateCreateHoles(f);
                    for (let i = 0; i < f.Holes.length; i++) {
                        // NormanTest.placeModel(f.Holes[i].Position, 0.2, i+1, server, f.Rotation);
                        NormanTest.placeModel(f.Holes[i].Position, 0.2, 9163, server, f.Rotation);
                    }
                }
                else
                {
                    const f = new Furrows('', pos, new Euler(rot[0], 0, 0), 1, 100000, [], '');
                    simulateCreateHoles(f);
                    for (let i = 0; i < f.Holes.length; i++) {
                        console.log(Vector4.ForceToFixed(f.Holes[i].Position,3));
                    }
                }
                break;
            //show sight line
            case 'sight':
                if(!client || !server)return;
                const distance = args[2]?Number(args[2]):10;
                const modelId = args[3]?Number(args[3]):10004;
                NormanTest.Test10(client, server, distance, modelId);
                break;
            case '1':
                Test();
                break;
            case '2':
                Test2();
                break;
            case '3':
                Test3();
                break;
            case '4':
                Test4();
                break;
            case '5':
                Test5();
                break;
            case '6':
                Test6();
                break;
            case '7':
                Test7();
                break;
            case '8':
                Test8();
                break;
            case '9':
                if(!client || !server)return;
                Test9(client, server);
                break;
            case '10':
                if(!client || !server)return;
                Test10(client, server,10,10004);
                break;
            case '11':
                if(!client || !server)return;
                Test11(client, server);
                break;
            case '12':
                Test12();
                break;
        }
    }
    if (process.env.NM) {
        TestEntry(null,null,['norman','fh']);
    }
}