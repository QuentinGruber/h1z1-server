import SOEClient from "../SoeServer/soeclient";
import ZoneClient from "servers/ZoneServer/zoneclient";
import { characterEquipment } from "types/zoneserver";

export default class ZoneClient2016 extends ZoneClient {
  character: {
    characterId: string;
    transientId: number;
    name?: string;
    loadouts?: any;
    extraModel?: string;
    isRunning: boolean;
    resourcesUpdater?: any;
    actorModelId?: number;
    headActor?: string;
    isRespawning?: boolean;
    gender?: number;
    creationDate?: string;
    lastLoginDate?: string;
    equipment: characterEquipment[];
    resources: {
      health: number;
      stamina: number;
      virus: number;
      food: number;
      water: number;
    };
    currentLoadoutTab?: number;
    currentLoadoutId?: number;
    currentLoadout?: number;
    guid?: string;
    inventory?: Array<any>;
    factionId?: number;
    spawnLocation?: string;
    state: {
      position: Float32Array;
      rotation: Float32Array;
      lookAt: Float32Array;
      health: number;
      shield: number;
    };
  };

  constructor(
    initialClient: SOEClient,loginSessionId:string,characterId:string,generatedTransient:number
  ) {
    super(
      initialClient,
      loginSessionId,
      characterId,
      generatedTransient
        );

        this.character = {
          characterId: characterId,
          transientId: generatedTransient,
          isRunning: false,
          equipment: [
            { modelName: "Weapon_Empty.adr", slotId: 1 }, // yeah that's an hack TODO find a better way
            { modelName: "Weapon_Empty.adr", slotId: 7 },
            {
              modelName: "SurvivorMale_Ivan_Shirt_Base.adr",
              defaultTextureAlias: "Ivan_Tshirt_Navy_Shoulder_Stripes",
              slotId: 3,
            },
            {
              modelName: "SurvivorMale_Ivan_Pants_Base.adr",
              defaultTextureAlias: "Ivan_Pants_Jeans_Blue",
              slotId: 4,
            },
          ],
          resources: {
            health: 5000,
            stamina: 50,
            food: 5000,
            water: 5000,
            virus: 6000,
          },
          state: {
            position: new Float32Array([0, 0, 0, 0]),
            rotation: new Float32Array([0, 0, 0, 0]),
            lookAt: new Float32Array([0, 0, 0, 0]),
            health: 0,
            shield: 0,
          },
        };
  }
}
