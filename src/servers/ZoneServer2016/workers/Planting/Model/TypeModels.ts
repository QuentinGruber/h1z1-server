import {Quaternion2Euler} from "../Utils";

// export enum FurrowsPlacingDestinationTypeEnum {
//     Ground,
//     Water,
//     Basement
// }

//The type will use for place something on their base surface
export type SurfacePlane =
    {
        a: number,
        b: number,
        c: number,
        d: number,
    }

export type XYZW =
    {
        X: number,
        Y: number,
        Z: number,
        W: number
    }

export class Vector4 {
    constructor(public X: number, public Y: number, public Z: number, public W: number) {
    }

    public static FromXYZW(o: XYZW): Vector4 {
        return new Vector4(o.X, o.Y, o.Z, o.W);
    }

    public static Multiply(left: number, right: Vector4): Vector4;
    public static Multiply(left: Vector4, right: number): Vector4;
    public static Multiply(left: Vector4, right: Vector4): Vector4;
    public static Multiply(left: any, right: any): Vector4 {
        let x = 0, y = 0, z = 0, w = 0;
        if (typeof left == "number" && right.X !== undefined) {
            x = left * right.X;
            y = left * right.Y;
            z = left * right.Z;
            w = left * right.W;
        } else if (typeof right == "number" && left.X !== undefined) {
            x = left.X * right;
            y = left.Y * right;
            z = left.Z * right;
            w = left.W * right;
        } else if (left.X !== undefined && right.X !== undefined) {
            x = left.X * right.X;
            y = left.Y * right.Y;
            z = left.Z * right.Z;
            w = left.W * right.W;
        }
        return new Vector4(x, y, z, w);
    }

    public static Add(a:Vector4,b:Vector4)
    {
        return new Vector4(a.X + b.X, a.Y + b.Y , a.Z + b.Z, a.W + b.W);
    }

    public static Distance = (v1: Vector4, v2: Vector4): number => {
        const num2 = v1.X - v2.X;
        const num3 = v1.Y - v2.Y;
        const num4 = v1.Z - v2.Z;
        const num5 = v1.W - v2.W;
        const num6 = (((num2 * num2) + (num3 * num3)) + (num4 * num4)) + (num5 * num5);
        return Math.sqrt(num6);
    }

    public static Normalize = (vector: Vector4): Vector4 => {
        const num2 = (((vector.X * vector.X) + (vector.Y * vector.Y)) + (vector.Z * vector.Z)) + (vector.W * vector.W);
        const num3 = 1 / (Math.sqrt(num2));
        return new Vector4(vector.X * num3, vector.Y * num3, vector.Z * num3, vector.W * num3);
    }

    public static ForceToFixed(v:Vector4, floatLen : number)
    {
        return new Vector4(
            Number(v.X.toFixed(floatLen)),
            Number(v.Y.toFixed(floatLen)),
            Number(v.Z.toFixed(floatLen)),
            Number(v.W.toFixed(floatLen))
        );
    }
    public ToFloat32ArrayZYXW()
    {
        return new Float32Array([this.Z,this.Y,this.X,this.W]);
    }
    public static FromH1Z1ClientPosFormat = (pos:Float32Array) :Vector4=>
    {
        return new Vector4(pos[2],pos[1],pos[0],1);
    }
}

export class Euler {
    constructor(public Yaw: number, public Pitch: number, public Roll: number) {
    }
    public static ToH1Z1ClientRotFormat = (euler:Euler):Float32Array =>
    {
        return new Float32Array([euler.Roll, euler.Yaw, euler.Pitch]);
    }
    public static ForceToFixed(e:Euler, floatLen : number = 2)
    {
        return new Euler(
            Number(e.Yaw.toFixed(floatLen)),
            Number(e.Pitch.toFixed(floatLen)),
            Number(e.Roll.toFixed(floatLen))
        );
    }
}

export class Quaternion extends Vector4
{
    public static ToFixedAngleString=(qu:Quaternion,floatLen:number):string=> {
        const ret = Quaternion2Euler(qu, "XZY");
        return JSON.stringify({Yaw: ret[0].toFixed(floatLen), Pitch: ret[1].toFixed(floatLen), Roll: ret[2].toFixed(floatLen)});
    }
    public ToFloat32ArrayZYXW()
    {
        return new Float32Array([this.Z,this.Y,this.X,this.W]);
    }
}

//region for growing manager
export interface Stage {
    StageName: string,
    TimeToReach: number,
    NewModelId: number,
    Outcome?:
        {
            Name: string,
            ItemDefinitionId: number,
            ModelId: number,
            DefiniteCount?: number,
            MinCount?:number,
            MaxCount?:number,
            //0~100
            RateOfGetting?:number,
            LootAble: boolean
        }[],
}

interface Stages {
    [key: string]: Stage
}

export interface GrowthScript {
    [key: string]: {
        PetriDish: any,
        Stages: Stages
    },
}
//endregion

export interface PlantingSetting
{
    PerFertilizerCanUseForHolesCount :number,
    DefaultFurrowsDuration: number,
    DefaultFertilizerDuration: number,
    FertilizerAcceleration: number,
    FertilizerActionRadius: number,
    GrowthScripts:GrowthScript,
}
