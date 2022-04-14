//region translation functions
import {Euler, Quaternion, Vector4} from "./Model/TypeModels";

const twoAxisRot = (r11: number, r12: number, r21: number, r31: number, r32: number): Float32Array => {
    let res = new Float32Array(3);
    res[0] = Math.atan2(r11, r12);
    res[1] = Math.acos(r21);
    res[2] = Math.atan2(r31, r32);
    return res;
}
const threeAxisRot = (r11: number, r12: number, r21: number, r31: number, r32: number): Float32Array => {
    let res = new Float32Array(3);
    res[0] = Math.atan2(r31, r32);
    res[1] = Math.asin(r21);
    res[2] = Math.atan2(r11, r12);
    return res;
}
export const Quaternion2Euler = (q: Quaternion, rotMethod: string): Float32Array => {
    let res = new Float32Array(3);
    switch (rotMethod) {
        case "ZYX":
            res = threeAxisRot(2 * (q.X * q.Y + q.W * q.Z),
                q.W * q.W + q.X * q.X - q.Y * q.Y - q.Z * q.Z,
                -2 * (q.X * q.Z - q.W * q.Y),
                2 * (q.Y * q.Z + q.W * q.X),
                q.W * q.W - q.X * q.X - q.Y * q.Y + q.Z * q.Z,
            );
            break;

        case "ZYZ":
            res = twoAxisRot(2 * (q.Y * q.Z - q.W * q.X),
                2 * (q.X * q.Z + q.W * q.Y),
                q.W * q.W - q.X * q.X - q.Y * q.Y + q.Z * q.Z,
                2 * (q.Y * q.Z + q.W * q.X),
                -2 * (q.X * q.Z - q.W * q.Y));
            break;

        case "ZXY":
            res = threeAxisRot(-2 * (q.X * q.Y - q.W * q.Z),
                q.W * q.W - q.X * q.X + q.Y * q.Y - q.Z * q.Z,
                2 * (q.Y * q.Z + q.W * q.X),
                -2 * (q.X * q.Z - q.W * q.Y),
                q.W * q.W - q.X * q.X - q.Y * q.Y + q.Z * q.Z);
            break;

        case "ZXZ":
            res = twoAxisRot(2 * (q.X * q.Z + q.W * q.Y),
                -2 * (q.Y * q.Z - q.W * q.X),
                q.W * q.W - q.X * q.X - q.Y * q.Y + q.Z * q.Z,
                2 * (q.X * q.Z - q.W * q.Y),
                2 * (q.Y * q.Z + q.W * q.X));
            break;

        case "YXZ":
            res = threeAxisRot(2 * (q.X * q.Z + q.W * q.Y),
                q.W * q.W - q.X * q.X - q.Y * q.Y + q.Z * q.Z,
                -2 * (q.Y * q.Z - q.W * q.X),
                2 * (q.X * q.Y + q.W * q.Z),
                q.W * q.W - q.X * q.X + q.Y * q.Y - q.Z * q.Z);
            break;

        case "YXY":
            res = twoAxisRot(2 * (q.X * q.Y - q.W * q.Z),
                2 * (q.Y * q.Z + q.W * q.X),
                q.W * q.W - q.X * q.X + q.Y * q.Y - q.Z * q.Z,
                2 * (q.X * q.Y + q.W * q.Z),
                -2 * (q.Y * q.Z - q.W * q.X));
            break;

        case "YZX":
            res = threeAxisRot(-2 * (q.X * q.Z - q.W * q.Y),
                q.W * q.W + q.X * q.X - q.Y * q.Y - q.Z * q.Z,
                2 * (q.X * q.Y + q.W * q.Z),
                -2 * (q.Y * q.Z - q.W * q.X),
                q.W * q.W - q.X * q.X + q.Y * q.Y - q.Z * q.Z);
            break;

        case "YZY":
            res = twoAxisRot(2 * (q.Y * q.Z + q.W * q.X),
                -2 * (q.X * q.Y - q.W * q.Z),
                q.W * q.W - q.X * q.X + q.Y * q.Y - q.Z * q.Z,
                2 * (q.Y * q.Z - q.W * q.X),
                2 * (q.X * q.Y + q.W * q.Z));
            break;

        case "XYZ":
            res = threeAxisRot(-2 * (q.Y * q.Z - q.W * q.X),
                q.W * q.W - q.X * q.X - q.Y * q.Y + q.Z * q.Z,
                2 * (q.X * q.Z + q.W * q.Y),
                -2 * (q.X * q.Y - q.W * q.Z),
                q.W * q.W + q.X * q.X - q.Y * q.Y - q.Z * q.Z);
            break;

        case "XYX":
            res = twoAxisRot(2 * (q.X * q.Y + q.W * q.Z),
                -2 * (q.X * q.Z - q.W * q.Y),
                q.W * q.W + q.X * q.X - q.Y * q.Y - q.Z * q.Z,
                2 * (q.X * q.Y - q.W * q.Z),
                2 * (q.X * q.Z + q.W * q.Y));
            break;

        case "XZY":
            res = threeAxisRot(2 * (q.Y * q.Z + q.W * q.X),
                q.W * q.W - q.X * q.X + q.Y * q.Y - q.Z * q.Z,
                -2 * (q.X * q.Y - q.W * q.Z),
                2 * (q.X * q.Z + q.W * q.Y),
                q.W * q.W + q.X * q.X - q.Y * q.Y - q.Z * q.Z);
            break;

        case "XZX":
            res = twoAxisRot(2 * (q.X * q.Z - q.W * q.Y),
                2 * (q.X * q.Y + q.W * q.Z),
                q.W * q.W + q.X * q.X - q.Y * q.Y - q.Z * q.Z,
                2 * (q.X * q.Z + q.W * q.Y),
                -2 * (q.X * q.Y - q.W * q.Z));
            break;

        default:
            break;
    }
    return res;
}
export const Transform = (value: Vector4, rotation: Quaternion) => {
    let num = rotation.X + rotation.X;
    let num2 = rotation.Y + rotation.Y;
    let num3 = rotation.Z + rotation.Z;
    let num4 = rotation.W * num;
    let num5 = rotation.W * num2;
    let num6 = rotation.W * num3;
    let num7 = rotation.X * num;
    let num8 = rotation.X * num2;
    let num9 = rotation.X * num3;
    let num10 = rotation.Y * num2;
    let num11 = rotation.Y * num3;
    let num12 = rotation.Z * num3;
    return new Vector4(((value.X * ((1 - num10) - num12)) + (value.Y * (num8 - num6))) + (value.Z * (num9 + num5)), ((value.X * (num8 + num6)) + (value.Y * ((1 - num7) - num12))) + (value.Z * (num11 - num4)), ((value.X * (num9 - num5)) + (value.Y * (num11 + num4))) + (value.Z * ((1 - num7) - num10)), 1);
}
const GetCrossDotOnPlane = (Lx1: number, Ly1: number, Lz1: number, Lx2: number, Ly2: number, Lz2: number, Px1: number, Py1: number, Pz1: number, Px2: number, Py2: number, Pz2: number, Px3: number, Py3: number, Pz3: number): Vector4 | null => {
    let newCrossPoint = new Vector4(0, 0, 0, 1);
    //L直线矢量 L line vector
    let m = Lx2 - Lx1;
    let n = Ly2 - Ly1;
    let p = Lz2 - Lz1;
    //平面方程Ax+BY+CZ+d=0 行列式计算 / base on square equation ax+by+cz+d=0
    let A = Py1 * Pz2 + Py2 * Pz3 + Py3 * Pz1 - Py1 * Pz3 - Py2 * Pz1 - Py3 * Pz2;
    let B = -(Px1 * Pz2 + Px2 * Pz3 + Px3 * Pz1 - Px3 * Pz2 - Px2 * Pz1 - Px1 * Pz3);
    let C = Px1 * Py2 + Px2 * Py3 + Px3 * Py1 - Px1 * Py3 - Px2 * Py1 - Px3 * Py2;
    let D = -(Px1 * Py2 * Pz3 + Px2 * Py3 * Pz1 + Px3 * Py1 * Pz2 - Px1 * Py3 * Pz2 - Px2 * Py1 * Pz3 - Px3 * Py2 * Pz1);

    if (A * m + B * n + C * p === 0)  //判断直线是否与平面平行 / calc the line vector is parallel
    {
        return null;
    } else {
        let t = -(Lx1 * A + Ly1 * B + Lz1 * C + D) / (A * m + B * n + C * p);
        newCrossPoint.X = Lx1 + m * t;
        newCrossPoint.Y = Ly1 + n * t;
        newCrossPoint.Z = Lz1 + p * t;
    }
    return newCrossPoint;
}
/*
in h1z1 client, yaw ,pitch, roll are not defined as aircraft flight attitude [yaw,pitch,roll].
instead, they are based on three components of [precession, nutation,rotation]
* */
export const Euler2Quaternion = (yaw: number, pitch: number, roll: number): Quaternion => {
    let quaternion = new Vector4(0,0,0,0);
    let num7 = roll * 0.5;
    let num = Math.sin(num7);
    let num2 = Math.cos(num7);
    let num8 = pitch * 0.5;
    let num3 = Math.sin(num8);
    let num4 = Math.cos(num8);
    let num9 = yaw * 0.5;
    let num5 = Math.sin(num9);
    let num6 = Math.cos(num9);
    quaternion.X = ((num6 * num3) * num2) + ((num5 * num4) * num);
    quaternion.Y = ((num5 * num4) * num2) - ((num6 * num3) * num);
    quaternion.Z = ((num6 * num4) * num) - ((num5 * num3) * num2);
    quaternion.W = ((num6 * num4) * num2) + ((num5 * num3) * num);
    return quaternion;
};


//endregion


//region useful
export const getLookAtPos = (standPos: Vector4, yaw: number, pitch: number, roll: number, roleHeight: number): Vector4 | null => {
    let rolePos = standPos;
    let cameraPos = {X: rolePos.X, Y: rolePos.Y + roleHeight, Z: rolePos.Z, W: 1};
    let cameraDefaultDirect = new Vector4(1,0,0,0);
    let cameraDirectRotQU = Euler2Quaternion(yaw, pitch, roll);
    let cameraNewDirect = Transform(cameraDefaultDirect, cameraDirectRotQU);
    let cameraLookAtOnePos = new Vector4(cameraPos.X + cameraNewDirect.X, cameraPos.Y + cameraNewDirect.Y, cameraPos.Z + cameraNewDirect.Z, 0);

    return GetCrossDotOnPlane(cameraPos.X, cameraPos.Y, cameraPos.Z, cameraLookAtOnePos.X, cameraLookAtOnePos.Y, cameraLookAtOnePos.Z,
        0, standPos.Y, 0,
        1, standPos.Y, 0,
        1, standPos.Y, 1);
}
//get new target by parentPos and parent pose
//use this way to move a npc/object, must save last location in the world and rotation(of world) info
export const MoveToByParent = (
    //like furrows npc position
    parentPos: Vector4,
    //like furrows npc rotationYPR
    parentYPROfWorld:Euler,
    //not base on parent location of world, only base on nearest parent towards
    YPLBaseOnParent: Euler,
    distanceBaseOnParent: number): {NewPos:Vector4,NewRot:Euler} => {
    let parentDir = new Vector4(1, 0, 0, 0);
    let parentRotOfWorldQU = Euler2Quaternion(parentYPROfWorld.Yaw, parentYPROfWorld.Pitch, parentYPROfWorld.Roll);
    parentDir = Transform(parentDir, parentRotOfWorldQU);
    parentDir.W = 0;
    parentDir = Vector4.Normalize(parentDir);
    // console.log('parent rot eul of world:', Quaternion.ToFixedAngleString(parentRotOfWorldQU,2));
    // console.log('parentDir : ', parentDir);
    let toNewDirQU = Euler2Quaternion(YPLBaseOnParent.Yaw, YPLBaseOnParent.Pitch, YPLBaseOnParent.Roll);
    // console.log('self rot eul:',Quaternion.ToFixedAngleString(toNewDirQU,2));
    let newDir = Transform(parentDir, toNewDirQU);
    // console.log('parentDir:',parentDir);
    // console.log('newDir:',newDir);
    let newLine = Vector4.Multiply(newDir, distanceBaseOnParent);
    let newPos = Vector4.Add(parentPos, newLine);
    newPos.W = 1;
    //reverse from YZX  (yaw by Y, pitch by new Z, roll by new X)
    let rot = Quaternion2Euler(toNewDirQU,"XZY");
    return {NewPos:newPos,NewRot:new Euler(rot[0],rot[1],rot[2])};
}
//endregion
