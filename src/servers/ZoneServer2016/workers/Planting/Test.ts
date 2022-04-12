import {Euler2Quaternion, getLookAtPos, MoveToByParent, Quaternion2Euler, Transform} from "./Utils";
import {Euler, Vector4} from "./Model/TypeModels";
import {ZoneServer2016} from "../../zoneserver";
import {ZoneClient2016} from "../../classes/zoneclient";
import {PlantingManager} from "./PlantingManager";
import {SeedType} from "./Model/DataModels";

//test euler from client->server->quaternion encode(by other dude,not correct maybe)->decode to euler
const Test = () => {
  //server received : -1.24,-0.1,-0.23; it's order by yaw pitch roll, i am sure.
  //eul2quat function got : {X:0.02618025 Y:-0.5811435 Z:-0.122121 W:0.80416}
  //order by x y z w mode: let qu = {X:0.02618025, Y:-0.5811435, Z:-0.122121, W:0.80416};(not work)
  //order by z y x w mode, that's right
  let qu = new Vector4(-0.122121, -0.5811435, 0.02618025, 0.80416);
  let methods = ["ZYX", "ZYZ", "ZXY", "ZXZ", "YXZ", "YXY", "YZX", "YZY", "XYZ", "XYX", "XZY", "XZX"];
  for (let i = 0; i < methods.length; i++) {
    let currentMethod = methods[i];
    const currentQu = Quaternion2Euler(qu, currentMethod);
    console.log('使用四元数的ZYX:当前方法:', currentMethod, '方法值', currentQu);
  }
  //:::2 steps calc server received euler 2 quaternion:::
  //step 1:
  //in value:h1z1 client->h1emu server(here, as origin euler angle3)->quaternion converted by eul2quat method
  //out value:x z y origin euler angle(server received origin euler)
  let q = Quaternion2Euler(qu, "XZY");
  console.log('z->y->x->w quaternion 2 euler by XZY result:', q);
  console.warn('q value is not a x y z info struct, it contains yaw pitch row info, yaw=q[0] pitch=q[1] roll=q[2]');
  //step 2:
  //in value:server received origin euler
  //out value:quaternion,same as c# and eul2quat function's result
  let e = Euler2Quaternion(q[0], q[1], q[2]);
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
const convertDudesQuaternion2Eul = (qu: Float32Array): Float32Array => {
  let quaternion = Vector4.FromXYZW({Z: qu[0], Y: qu[1], X: qu[2], W: qu[3]});
  return Quaternion2Euler(quaternion, "XZY");
};
//input a role standing position and look down angle(2/PI~-2/PI) and roleHeight to calc some positions around role standing position,default count is 12;
const standLookAroundPositions = (standPos: Vector4, lookDownAngle: number, roleHeight: number): Array<Vector4> => {
  let lookAroundPosList = new Array<Vector4>();
  // let rolePos = {X:x,Y:world.Y,Z:z,W:1};
  let cameraPos = Vector4.FromXYZW({X: standPos.X, Y: standPos.Y + roleHeight, Z: standPos.Z, W: 1});
  console.log('cameraPos:',cameraPos);
  // let cameraDefaultDirect = {X: 1, Y: 0, Z: 0, W: 0};
  let testYawCount = 12;
  for (let k = 0; k < testYawCount; k++) {
    let yaw = (Math.PI * 2) / testYawCount * k - Math.PI;
    // -Math.PI/6;//angle 30;
    let crossPos = getLookAtPos(standPos, yaw, 0, lookDownAngle, roleHeight)
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
  let ret = convertDudesQuaternion2Eul(new Float32Array([0.02618025, -0.5811435, -0.122121, 0.80416]));
  //-1.24,-0.1,-0.23
  console.log('convert from the quaternion decoded ret is :', ret);
  console.log(standLookAroundPositions(new Vector4(1,0,0,1), -Math.PI/4,0.5));
}

//simulate role move and get look at pos
const Test3 = () => {
  let perGridSize = 100;
  let world = {X: -1000, Y: 30, Z: -1000, Width: 2000, Height: 0, Depth: 2000};
  for (let i = 0; i < world.Width; i += perGridSize) {
    let x = i - world.Width / 2;
    for (let j = 0; j < world.Depth; j += perGridSize) {
      let z = j - world.Depth / 2;
      //look down 45 deg and role height set 2m;
      // let crossList = standLookAround(CreateV4(x,world.Y,z,1),Math.PI/4,2);

      // let crossList = standLookAround(CreateV4(x,world.Y,z,1),Math.PI/4,2);
      // console.log(crossList)

      let cross = getLookAtPos(new Vector4(x, world.Y, z, 1), -1.24, -0.1, 0.23, 1.5);
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
  let stand = {
    Z: 1837.5400390625,
    Y: 64.3499984741211,
    X: -427,
    W: 0
  }
  let ret = getLookAtPos(Vector4.FromXYZW(stand), -2.15, 0, 0.22, 1.5);
  console.log(ret);
}

//get positions for fly flares like a kite
export const GetKiteLineDots = (eyePos: Vector4, yaw: number, pitch: number, roll: number, perDotDistance: number, dotCount: number): Array<Vector4> => {
  let ret = new Array<Vector4>();
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
  let start = firstMoved;
  let parent = start;
  let parentDir = Vector4.Normalize(parent);
  let currentWorld = start;
  for (let i = 0; i < times; i++) {
    let newDir = parentDir;
    newDir = Transform(newDir, Euler2Quaternion(perTimeAngle, 0, 0));
    parentDir = newDir;
    // console.log(newDir);
    let newLine = Vector4.Multiply(newDir, distance);
    parent = newLine;
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
  let euler1 = {Yaw: -Math.PI / 4, Pitch: 0, Roll: 0};
  let newPos = MoveToByParent(new Vector4(2, 0, 0, 1),
    new Euler(0, 0, 0),
    euler1,
    2);
  console.log(Vector4.ForceToFixed(newPos.NewPos, 2));
  let euler2 = new Euler(Math.PI / 4, 0, 0);
  /*
  turn left 45 deg and move 2 distance  then  turn right 45 deg base on it's parent's pose
  like below
      ___
  ___/

  * */
  let newPos2 = MoveToByParent(newPos.NewPos,
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
  let newPos3 = MoveToByParent(newPos2.NewPos, newPos2.NewRot, new Euler(Math.PI / 4, 0, 0), 2);
  console.log(Vector4.ForceToFixed(newPos3.NewPos, 2));
}


//reclaim furrows and auto place 4seeds;
const Test8 = () => {
  let server = new ZoneServer2016(
    1117,
    Buffer.from("F70IaxuU8C/w7FPXY1ibXw==", "base64"),
    process.env.MONGO_URL,
    2
  );
  // server.start();
  let client = new ZoneClient2016(0, "", "", "norman", 888);
  //z y x / N E sky
  client.character.state.position = new Float32Array([0, 0, 2]);
  //quaternion i am not use
  let qu = Euler2Quaternion(0, 0, -Math.PI/4);
  client.character.state.rotation = new Float32Array([qu.Z, qu.Y, qu.X, qu.W]);
  //euler z y x   but   rot y -> z -> x;
  // client.character.state.rotationRaw = new Float32Array([0,-Math.PI/6,0]);

  let m = new PlantingManager(null);
  m.Reclaim(client, server);
  for (let i = 0; i < 1; i++) {
    m.SowSeed(client, server, SeedType.Corn);
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
  let characterId = server.generateGuid();
  let guid = server.generateGuid();
  let transientId = server.getTransientId(guid);
  let flare = {
    characterId: characterId,
    guid: guid,
    transientId: transientId,
    modelId: 1,
    position: new Float32Array([pos.Z, pos.Y, pos.X]),
    rotation: new Float32Array([-rot[1], rot[0], 0]),
    dontSendFullNpcRequest: true,
    color: {},
    attachedObject: {},
  };
  server._temporaryObjects[characterId] = flare;
  server.sendDataToAll("AddLightweightNpc", flare);
  setTimeout(function () {
    delete server._temporaryObjects[characterId];
    server.sendDataToAllWithSpawnedTemporaryObject(
      characterId,
      "Character.RemovePlayer",
      {
        characterId: characterId,
      }
    );
  }, duration);
  return true;
}
const Test10 = (client: ZoneClient2016, server: ZoneServer2016) => {
  //effect params
  let eyeHeight = 1.5, perDotDistance = 0.5, dotCount = 50, perPlaceDelay = 20,
    duration = 1000 + dotCount * perPlaceDelay;

  // let rot = client.character.state.rotationRaw;
  let rot = Quaternion2Euler(Vector4.FromXYZW({
    Z: client.character.state.rotation[0],
    Y: client.character.state.rotation[1],
    X: client.character.state.rotation[2],
    W: client.character.state.rotation[3]
  }), "XZY");
  let positions = GetKiteLineDots(new Vector4(client.character.state.position[2], client.character.state.position[1] + eyeHeight, client.character.state.position[0], client.character.state.position[0]),
    -rot[0], 0, rot[1],
    perDotDistance, dotCount
  );
  // console.log('人物位置:', client.character.state.position);
  for (let i = 0; i < positions.length; i++) {
    setTimeout(() => {
        // console.log('目标位置:', positions[i]);
        placeFlare(positions[i], rot, duration, server);
      },
      (i + 1) * perPlaceDelay)
  }
}
const placeModel = (pos: Vector4, offsetY: number, modelId: number, server: ZoneServer2016) => {
  let characterId = server.generateGuid();
  let guid = server.generateGuid();
  let transientId = server.getTransientId(guid);
  let model = {
    characterId: characterId,
    guid: guid,
    transientId: transientId,
    modelId: modelId,
    position: new Float32Array([pos.Z, pos.Y + offsetY, pos.X]),
    rotation: new Float32Array(3),
    dontSendFullNpcRequest: true,
    positionUpdateType: true,
    color: {},
    attachedObject: {},
  };
  server._temporaryObjects[characterId] = model;
  server.sendDataToAll("AddLightweightNpc", model);
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
  let furrowsPosRot = MoveToByParent(new Vector4(0, 0, 0, 1), new Euler(0, 0, 0), new Euler(-Math.PI / 6, 0, 0), 500);
  let furrowsPos = furrowsPosRot.NewPos;
  console.log('furrowsPos = ', furrowsPosRot);
  let furrowsPosDistanceOfWorld = Vector4.Distance(furrowsPos, new Vector4(0, 0, 0, 1));
  console.log('furrows distance ', furrowsPosDistanceOfWorld);
  let furrowsRot = furrowsPosRot.NewRot;
  for (let i = 0; i < 4; i++) {
    let seedPosAndRot = MoveToByParent(furrowsPos, furrowsRot, new Euler(-Math.PI / 4 + (-Math.PI / 2 * i), 0, 0), 70.7);
    console.log(Vector4.ForceToFixed(seedPosAndRot.NewPos, 2));
    // console.log(seedPosAndRot.NewRot);
  }
  //endregion
}

// Test8();

const TestEntry=()=>
{
    let server = new ZoneServer2016(
        1117,
        Buffer.from("F70IaxuU8C/w7FPXY1ibXw==", "base64"),
        process.env.MONGO_URL,
        2
    );
    // server.start();
    let client = new ZoneClient2016(0, "", "", "norman", 888);
    Test();
    Test2();
    Test3();
    Test4();
    Test5();
    Test6();
    Test7();
    Test8();
    Test9(client, server);
    Test10(client, server);
    Test11(client, server);
    Test12();
}
if (process.env.NM)
{
  TestEntry();
}