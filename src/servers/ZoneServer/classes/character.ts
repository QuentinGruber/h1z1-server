import { characterEquipment } from "../../../types/zoneserver";
import { Int64String } from "../../../utils/utils";
import { ZoneServer } from "../zoneserver";
import { ZoneClient } from "./zoneclient";

export class Character {
  characterId: string;
  transientId: number;
  name?: string;
  loadouts?: any;
  extraModel?: string;
  isRunning: boolean;
  isHidden: boolean;
  isBleeding: boolean;
  resourcesUpdater?: any;
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
  godMode: boolean;
  state: {
    position: Float32Array;
    rotation: Float32Array;
    lookAt: Float32Array;
    health: number;
    shield: number;
  };
  isExhausted: boolean = false;
  isAlive: boolean = true;
  isSonic: boolean = false;
  constructor(characterId: string, generatedTransient: number) {
    this.characterId = characterId;
    this.transientId = generatedTransient;
    this.isRunning = false;
    this.isHidden = false;
    this.isBleeding = false,
    this.equipment = [
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
    ];
    this.resources = {
      health: 10000,
      stamina: 10000,
      food: 10000,
      water: 10000,
      virus: 0,
    };
    this.godMode = false;
    this.state = {
      position: new Float32Array([0, 0, 0, 0]),
      rotation: new Float32Array([0, 0, 0, 0]),
      lookAt: new Float32Array([0, 0, 0, 0]),
      health: 0,
      shield: 0,
    };
  }

  startRessourceUpdater(client: ZoneClient, server: ZoneServer) {
    this.resourcesUpdater = setTimeout(() => {
      // prototype resource manager
    const { isRunning } = this;
    if(!this.isBleeding) {
        if (!isRunning) {
           this.resources.stamina += 30;
         } else {
           this.resources.stamina -= 20;
           this.isExhausted = this.resources.stamina < 120;
         }
      }
      // if we had a packets we could modify sprint stat to 0
      // or play exhausted sounds etc
      this.resources.food -= 10;
      this.resources.water -= 20;
      if (this.resources.stamina > 600) {
        this.resources.stamina = 600;
      } else if (this.resources.stamina < 0) {
        this.resources.stamina = 0;
      }
      if (this.resources.food > 10000) {
        this.resources.food = 10000;
      } else if (this.resources.food < 0) {
        this.resources.food = 0;
        server.playerDamage(client, 100);
      }
      if (this.resources.water > 10000) {
        this.resources.water = 10000;
      } else if (this.resources.water < 0) {
        this.resources.water = 0;
        server.playerDamage(client, 100);
      }

      if (this.resources.health > 10000) {
        this.resources.health = 10000;
      } else if (this.resources.health < 0) {
        this.resources.health = 0;
      }
      if (this.isBleeding == true) {
        server.playerDamage(client, 100);
        if(this.resources.stamina > 0 && isRunning)
      {
        this.resources.stamina -= 100; 
      }
      else if (this.resources.stamina <= 130) {
        this.resources.stamina = 0;
      }  
      const { stamina, food, water, virus } = this.resources;

      server.updateResource(client, this.characterId, stamina, 6, 6);
      server.updateResource(client, this.characterId, food, 4, 4);
      server.updateResource(client, this.characterId, water, 5, 5);
      server.updateResource(client, this.characterId, virus, 9, 12);
      this.resourcesUpdater.refresh();
    }, 3000);

    server.sendData(client, "ZoneDoneSendingInitialData", {});

    server.sendData(client, "PlayerUpdate.UpdateCharacterState", {
      characterId: this.characterId,
      state: "000000000000000000",
      gameTime: Int64String(server.getGameTime()),
    });
  }
}
