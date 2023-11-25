// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2023 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

import { CharacterEquipment } from "../../../types/zoneserver";
import { ZoneServer2015 } from "../zoneserver";
import { ZoneClient } from "./zoneclient";

export class Character {
  characterId: string;
  transientId: number;
  name?: string;
  loadouts?: any;
  extraModel?: string;
  resourcesUpdater?: any;
  healingInterval?: any;
  healingTicks: number;
  healingMaxTicks: number;
  equipment: CharacterEquipment[];
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
  characterStates: any;
  isRunning: boolean = false;
  isHidden: boolean = false;
  isBleeding: boolean = false;
  isBandaged: boolean = false;
  isExhausted: boolean = false;
  isAlive: boolean = true;
  isSonic: boolean = false;
  isMoving: boolean = false;
  constructor(characterId: string, generatedTransient: number) {
    this.characterId = characterId;
    this.transientId = generatedTransient;
    this.equipment = [
      { modelName: "Weapon_Empty.adr", slotId: 1 }, // yeah that's an hack TODO find a better way
      { modelName: "Weapon_Empty.adr", slotId: 7 },
      {
        modelName: "SurvivorMale_Ivan_Shirt_Base.adr",
        defaultTextureAlias: "Ivan_Tshirt_Navy_Shoulder_Stripes",
        slotId: 3
      },
      {
        modelName: "SurvivorMale_Ivan_Pants_Base.adr",
        defaultTextureAlias: "Ivan_Pants_Jeans_Blue",
        slotId: 4
      }
    ];
    this.healingTicks = 0;
    this.healingMaxTicks = 0;
    this.resources = {
      health: 10000,
      stamina: 10000,
      food: 10000,
      water: 10000,
      virus: 0
    };
    this.godMode = false;
    this.state = {
      position: new Float32Array([0, 0, 0, 0]),
      rotation: new Float32Array([0, 0, 0, 0]),
      lookAt: new Float32Array([0, 0, 0, 0]),
      health: 0,
      shield: 0
    };
    this.characterStates = {
      visible: true,
      revivable: true
    };
  }

  startRessourceUpdater(client: ZoneClient, server: ZoneServer2015) {
    this.resourcesUpdater = setTimeout(() => {
      // prototype resource manager
      const { isRunning } = this;
      if (isRunning) {
        this.resources.stamina -= 20;
        this.isExhausted = this.resources.stamina < 120;
      } else if (!this.isBleeding || !this.isMoving) {
        this.resources.stamina += 30;
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
      // Prototype bleeding
      if (this.isBleeding && this.isAlive) {
        if (!this.isBandaged) {
          server.playerDamage(client, 100);
        }
        if (this.isBandaged) {
          this.resources.health += 100;
          server.updateResource(
            client,
            this.characterId,
            this.resources.health,
            48,
            1
          );
        }
        if (this.resources.health >= 2000) {
          this.isBleeding = false;
        }
        if (this.resources.stamina > 130 && isRunning) {
          this.resources.stamina -= 100;
        }
        server.sendDataToAll("PlayerUpdate.EffectPackage", {
          characterId: this.characterId,
          stringId: 1,
          effectId: 5042
        });
        if (
          this.resources.health < 10000 &&
          !this.isBleeding &&
          this.isBandaged
        ) {
          this.resources.health += 400;
          server.updateResource(
            client,
            this.characterId,
            this.resources.health,
            48,
            1
          );
        }
        if (this.resources.health >= 10000) {
          this.isBandaged = false;
        }
      }
      if (this.isBleeding && !this.isAlive) {
        this.isBleeding = false;
      }
      const { stamina, food, water, virus } = this.resources;
      server.updateResource(client, this.characterId, stamina, 6, 6);
      server.updateResource(client, this.characterId, food, 4, 4);
      server.updateResource(client, this.characterId, water, 5, 5);
      server.updateResource(client, this.characterId, virus, 9, 12);
      this.resourcesUpdater.refresh();
    }, 3000);
  }
}
