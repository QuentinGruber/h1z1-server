import { Character } from "servers/ZoneServer/classes/character";

export class Character2016 extends Character {
  resources: {
    health: number;
    stamina: number;
    virus: number;
    food: number;
    water: number;
    comfort: number;
  };
  actorModelId!: number;
  headActor!: number;
  isRespawning: boolean = false;
  gender!: number;
  creationDate!: string;
  lastLoginDate!: string;

  constructor(characterId: string, generatedTransient: number) {
    super(characterId, generatedTransient);
    this.resources = {
      health: 5000,
      stamina: 50,
      food: 5000,
      water: 5000,
      virus: 6000,
      comfort: 6000,
    };
    this.equipment = [
      {
        modelName: "SurvivorMale_Head_01.adr",
        slotId: 1,
      },
      {
        modelName: "SurvivorMale_Legs_Pants_Underwear.adr",
        slotId: 4,
      },
      {
        modelName: "SurvivorMale_Eyes_01.adr",
        slotId: 105,
      },
      { modelName: "Weapon_Empty.adr", slotId: 2 },
      { modelName: "Weapon_Empty.adr", slotId: 7 },
      {
        modelName: "SurvivorMale_Hair_ShortMessy.adr",
        slotId: 27,
      },
      {
        modelName: "SurvivorMale_Chest_Shirt_TintTshirt.adr",
        defaultTextureAlias: "Wear.Chest.Shirt.TintTshirt.67",
        slotId: 3,
      },
      {
        modelName: "SurvivorMale_Legs_Pants_SkinnyLeg.adr",
        defaultTextureAlias: "Wear.Legs.Pants.SkinnyLeg.Anarchy",
        slotId: 4,
      },
    ];
  }
}
