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

import {
  ConstructionPermissionIds,
  ContainerErrors,
  Effects,
  HealTypes,
  Items,
  LoadoutIds,
  LoadoutSlots,
  MaterialTypes,
  MeleeTypes,
  ResourceIds,
  ResourceTypes,
  WeaponDefinitionIds
} from "../models/enums";
import { ZoneClient2016 } from "../classes/zoneclient";
import { ZoneServer2016 } from "../zoneserver";
import { BaseFullCharacter } from "./basefullcharacter";
import {
  CharacterEffect,
  characterIndicatorData,
  DamageInfo,
  DamageRecord,
  HealType,
  positionUpdate,
  StanceFlags
} from "../../../types/zoneserver";
import {
  calculateOrientation,
  isFloat,
  isPosInRadius,
  randomIntFromInterval,
  _
} from "../../../utils/utils";
import { BaseItem } from "../classes/baseItem";
import { BaseLootableEntity } from "./baselootableentity";
import { characterDefaultLoadout } from "../data/loadouts";
import {
  AccessedCharacterBeginCharacterAccess,
  AccessedCharacterEndCharacterAccess,
  AddLightweightPc,
  CharacterWeaponStance,
  ClientUpdateDamageInfo,
  ClientUpdateModifyMovementSpeed,
  CommandPlayDialogEffect,
  EquipmentSetCharacterEquipment,
  EquipmentSetCharacterEquipmentSlot,
  LoadoutSetLoadoutSlots,
  SendSelfToClient
} from "types/zone2016packets";
import { Vehicle2016 } from "../entities/vehicle";
import {
  EXTERNAL_CONTAINER_GUID,
  LOADOUT_CONTAINER_ID
} from "../../../utils/constants";
const stats = require("../../../../data/2016/sampleData/stats.json");

interface CharacterStates {
  invincibility: boolean;
  gmHidden?: boolean;
  knockedOut?: boolean;
  inWater?: boolean;
  userMovementDisabled?: boolean;
}

interface CharacterMetrics {
  zombiesKilled: number;
  wildlifeKilled: number;
  recipesDiscovered: number;
  startedSurvivingTP: number; // timestamp
}

interface MeleeHit {
  abilityHitLocation: string;
  characterId: string;
}
export class Character2016 extends BaseFullCharacter {
  name!: string;
  spawnLocation?: string;
  resourcesUpdater?: any;
  factionId = 2;
  set godMode(state: boolean) {
    this.characterStates.invincibility = state;
  }
  get godMode() {
    return this.characterStates.invincibility;
  }
  characterStates: CharacterStates;
  isRunning = false;
  isHidden: string = "";
  isBleeding = false;
  isBandaged = false;
  isExhausted = false;
  lastMeleeHitTime: number = 0;
  static isAlive = true;
  public set isAlive(state) {
    this.characterStates.knockedOut = !state;
  }
  public get isAlive() {
    return !this.characterStates.knockedOut;
  }
  isMoving = false;
  actorModelId!: number;
  headActor!: string;
  hairModel!: string;
  isRespawning = false;
  isReady = false;
  creationDate!: string;
  lastLoginDate!: string;
  vehicleExitDate: number = new Date().getTime();
  currentLoadoutSlot = LoadoutSlots.FISTS;
  readonly loadoutId = LoadoutIds.CHARACTER;
  healingIntervals: Record<HealTypes, NodeJS.Timeout | null> = {
    1: null,
    2: null,
    3: null
  };
  healType: { [healType: number]: HealType } = {
    1: {
      healingTicks: 0,
      healingMaxTicks: 0
    },
    2: {
      healingTicks: 0,
      healingMaxTicks: 0
    },
    3: {
      healingTicks: 0,
      healingMaxTicks: 0
    }
  };
  starthealingInterval: (
    client: ZoneClient2016,
    server: ZoneServer2016,
    healType: HealTypes
  ) => void;
  timeouts: any;
  hasConveys: boolean = false;
  positionUpdate?: positionUpdate;
  tempGodMode = false;
  isSpectator = false;
  initialized = false; // if sendself has been sent
  spawnGridData: number[] = [];
  lastJumpTime: number = 0;
  lastSitTime: number = 0;
  sitCount: number = 0;
  weaponStance: number = 1;
  stance?: StanceFlags;
  readonly metrics: CharacterMetrics = {
    recipesDiscovered: 0,
    zombiesKilled: 0,
    wildlifeKilled: 0,
    startedSurvivingTP: Date.now()
  };
  private combatlog: DamageRecord[] = [];
  // characterId of vehicle spawned by /hax drive or spawnvehicle
  ownedVehicle?: string;
  currentInteractionGuid: string = "";
  lastInteractionRequestGuid?: string;
  lastInteractionStringTime = 0;
  lastInteractionTime = 0;
  mountedContainer?: BaseLootableEntity;
  defaultLoadout = characterDefaultLoadout;
  mutedCharacters: Array<string> = [];
  groupId: number = 0;
  _characterEffects: {
    [effectId: number]: CharacterEffect;
  } = {};
  lastLockFailure: number = 0;
  resourceHudIndicators: string[] = [];
  hudIndicators: { [typeName: string]: characterIndicatorData } = {};
  screenEffects: string[] = [];
  abilityInitTime: number = 0;
  meleeHit: MeleeHit = {
    abilityHitLocation: "",
    characterId: ""
  };
  constructor(
    characterId: string,
    transientId: number,
    server: ZoneServer2016
  ) {
    super(
      characterId,
      transientId,
      0,
      new Float32Array([0, 0, 0, 1]),
      new Float32Array([0, 0, 0, 1]),
      server
    );
    this.npcRenderDistance = 400;
    (this._resources = {
      [ResourceIds.HEALTH]: 10000,
      [ResourceIds.STAMINA]: 600,
      [ResourceIds.HUNGER]: 10000,
      [ResourceIds.HYDRATION]: 10000,
      [ResourceIds.VIRUS]: 0,
      [ResourceIds.COMFORT]: 5000,
      [ResourceIds.BLEEDING]: 0,
      [ResourceIds.ENDURANCE]: 8000
    }),
      (this.characterStates = {
        knockedOut: false,
        inWater: false,
        invincibility: false
      });
    this.timeouts = {};
    this.starthealingInterval = (
      client: ZoneClient2016,
      server: ZoneServer2016,
      healType: HealTypes
    ) => {
      client.character.healingIntervals[healType] = setTimeout(() => {
        if (!server._clients[client.sessionId]) {
          return;
        }
        let typeName = "";
        switch (healType) {
          case 1:
            typeName = "HEALING_BANDAGE_DRESSED";
            break;
          case 2:
            typeName = "HEALING_BANDAGE";
            break;
          case 3:
            typeName = "HEALING_FIRST_AID";
            break;
        }
        if (!typeName) return;
        const index = this.resourceHudIndicators.indexOf(typeName);
        if (index <= -1) {
          this.resourceHudIndicators.push(typeName);
          server.sendHudIndicators(client);
        }
        client.character._resources[ResourceIds.HEALTH] += 100;
        if (client.character._resources[ResourceIds.HEALTH] > 10000) {
          client.character._resources[ResourceIds.HEALTH] = 10000;
        }

        server.updateResource(
          client,
          client.character.characterId,
          client.character._resources[ResourceIds.HEALTH],
          ResourceIds.HEALTH
        );
        if (
          client.character.healType[healType].healingTicks++ <
          client.character.healType[healType].healingMaxTicks
        ) {
          client.character.healingIntervals[healType]?.refresh();
        } else {
          client.character.healType[healType].healingMaxTicks = 0;
          client.character.healType[healType].healingTicks = 0;
          clearTimeout(
            client.character.healingIntervals[healType] as NodeJS.Timeout
          );
          this.resourceHudIndicators.splice(index, 1);
          server.sendHudIndicators(client);
          client.character.healingIntervals[healType] = null;
        }
      }, 1000);
    };
    this.materialType = MaterialTypes.FLESH;
  }

  startResourceUpdater(client: ZoneClient2016, server: ZoneServer2016) {
    client.character.resourcesUpdater = setTimeout(
      () => this.updateResources(client, server),
      3000
    );
  }

  updateResources(client: ZoneClient2016, server: ZoneServer2016) {
    let effectId;
    for (const a in this.hudIndicators) {
      const indicator = this.hudIndicators[a];
      if (Date.now() > indicator.expirationTime) {
        delete this.hudIndicators[a];
        server.sendHudIndicators(client);
      }
    }
    for (const a in this._characterEffects) {
      const characterEffect = this._characterEffects[a];
      if (characterEffect.duration < Date.now()) {
        if (characterEffect.endCallback)
          characterEffect.endCallback(server, this);
        effectId = 0;
        delete this._characterEffects[a];
        continue;
      }
      if (characterEffect.callback) characterEffect.callback(server, this);
      effectId = characterEffect.id;
    }
    if (effectId == 0 && effectId != undefined) {
      server.sendDataToAllWithSpawnedEntity<CommandPlayDialogEffect>(
        server._characters,
        this.characterId,
        "Command.PlayDialogEffect",
        {
          characterId: this.characterId,
          effectId: effectId
        }
      );
    }
    if (this.isGodMode()) {
      client.character.resourcesUpdater.refresh();
      return;
    }

    if (!server._clients[client.sessionId]) {
      return;
    }
    const hunger = this._resources[ResourceIds.HUNGER],
      hydration = this._resources[ResourceIds.HYDRATION],
      health = this._resources[ResourceIds.HEALTH],
      virus = this._resources[ResourceIds.VIRUS],
      stamina = this._resources[ResourceIds.STAMINA],
      bleeding = this._resources[ResourceIds.BLEEDING],
      energy = this._resources[ResourceIds.ENDURANCE];

    if (
      client.character.isRunning &&
      (client.vehicle.mountedVehicle == "" || !client.vehicle.mountedVehicle)
    ) {
      client.character._resources[ResourceIds.STAMINA] -= 4;
      client.character.isExhausted =
        client.character._resources[ResourceIds.STAMINA] < 120;
    } else if (!client.character.isBleeding || !client.character.isMoving) {
      client.character._resources[ResourceIds.STAMINA] += 12;
    }

    client.character._resources[ResourceIds.HUNGER] -= 2;
    client.character._resources[ResourceIds.ENDURANCE] -= 2;
    client.character._resources[ResourceIds.HYDRATION] -= 4;

    let desiredEnergyIndicator = "";
    const energyIndicators = ["VERY_TIRED", "TIRED", "EXHAUSTED"];
    switch (true) {
      case energy <= 801:
        desiredEnergyIndicator = "EXHAUSTED";
        client.character._resources[ResourceIds.STAMINA] -= 20;
        break;
      case energy <= 2601 && energy > 801:
        desiredEnergyIndicator = "VERY_TIRED";
        client.character._resources[ResourceIds.STAMINA] -= 14;
        break;
      case energy <= 3501 && energy > 2601:
        desiredEnergyIndicator = "TIRED";
        break;
      case energy > 3501:
        desiredEnergyIndicator = "";
        break;
      default:
        desiredEnergyIndicator = "";
        break;
    }
    this.checkResource(server, ResourceIds.ENDURANCE);
    this.checkResource(server, ResourceIds.STAMINA);
    energyIndicators.forEach((indicator: string) => {
      const index = this.resourceHudIndicators.indexOf(indicator);
      if (index > -1 && indicator != desiredEnergyIndicator) {
        this.resourceHudIndicators.splice(index, 1);
        server.sendHudIndicators(client);
      } else if (indicator == desiredEnergyIndicator && index <= -1) {
        this.resourceHudIndicators.push(desiredEnergyIndicator);
        server.sendHudIndicators(client);
      }
    });

    const bleedingIndicators = [
      "BLEEDING_LIGHT",
      "BLEEDING_MODERATE",
      "BLEEDING_SEVERE"
    ];
    let desiredBleedingIndicator = "";
    switch (true) {
      case bleeding > 0 && bleeding < 30:
        desiredBleedingIndicator = "BLEEDING_LIGHT";
        break;
      case bleeding >= 30 && bleeding < 60:
        desiredBleedingIndicator = "BLEEDING_MODERATE";
        break;
      case bleeding >= 60:
        desiredBleedingIndicator = "BLEEDING_SEVERE";
        break;
      default:
        desiredBleedingIndicator = "";
        break;
    }
    bleedingIndicators.forEach((indicator: string) => {
      const index = this.resourceHudIndicators.indexOf(indicator);
      if (index > -1 && indicator != desiredBleedingIndicator) {
        this.resourceHudIndicators.splice(index, 1);
        server.sendHudIndicators(client);
      } else if (indicator == desiredBleedingIndicator && index <= -1) {
        this.resourceHudIndicators.push(desiredBleedingIndicator);
        server.sendHudIndicators(client);
      }

      const index2 = this.screenEffects.indexOf(indicator);
      if (index2 > -1 && indicator != desiredBleedingIndicator) {
        this.screenEffects.splice(index2, 1);
        server.removeScreenEffect(client, server._screenEffects[indicator]);
      } else if (indicator == desiredBleedingIndicator && index2 <= -1) {
        this.screenEffects.push(desiredBleedingIndicator);
        server.addScreenEffect(
          client,
          server._screenEffects[desiredBleedingIndicator]
        );
      }
    });
    if (client.character._resources[ResourceIds.BLEEDING] > 0) {
      this.damage(server, {
        entity: "Character.Bleeding",
        damage:
          Math.ceil(client.character._resources[ResourceIds.BLEEDING] / 40) *
          100
      });
    }
    this.checkResource(server, ResourceIds.BLEEDING);
    this.checkResource(server, ResourceIds.HUNGER, () => {
      this.damage(server, { entity: "Character.Hunger", damage: 100 });
    });
    const indexHunger = this.resourceHudIndicators.indexOf("STARVING");
    if (hunger == 0) {
      if (indexHunger <= -1) {
        this.resourceHudIndicators.push("STARVING");
        server.sendHudIndicators(client);
      }
    } else {
      if (indexHunger > -1) {
        this.resourceHudIndicators.splice(indexHunger, 1);
        server.sendHudIndicators(client);
      }
    }
    this.checkResource(server, ResourceIds.HUNGER, () => {
      this.damage(server, { entity: "Character.Hunger", damage: 100 });
    });
    this.checkResource(server, ResourceIds.HYDRATION, () => {
      this.damage(server, { entity: "Character.Hydration", damage: 100 });
    });
    const indexDehydrated = this.resourceHudIndicators.indexOf("DEHYDRATED");
    if (hydration == 0) {
      if (indexDehydrated <= -1) {
        this.resourceHudIndicators.push("DEHYDRATED");
        server.sendHudIndicators(client);
      }
    } else {
      if (indexDehydrated > -1) {
        this.resourceHudIndicators.splice(indexDehydrated, 1);
        server.sendHudIndicators(client);
      }
    }
    this.checkResource(server, ResourceIds.HEALTH);

    this.updateResource(
      server,
      client,
      ResourceIds.HUNGER,
      ResourceTypes.HUNGER,
      hunger
    );
    this.updateResource(
      server,
      client,
      ResourceIds.HYDRATION,
      ResourceTypes.HYDRATION,
      hydration
    );
    this.updateResource(
      server,
      client,
      ResourceIds.HEALTH,
      ResourceTypes.HEALTH,
      health
    );
    this.updateResource(
      server,
      client,
      ResourceIds.VIRUS,
      ResourceTypes.VIRUS,
      virus
    );
    this.updateResource(
      server,
      client,
      ResourceIds.STAMINA,
      ResourceTypes.STAMINA,
      stamina
    );
    this.updateResource(
      server,
      client,
      ResourceIds.BLEEDING,
      ResourceTypes.BLEEDING,
      bleeding
    );
    this.updateResource(
      server,
      client,
      ResourceIds.ENDURANCE,
      ResourceTypes.ENDURANCE,
      energy
    );

    client.character.resourcesUpdater.refresh();
  }

  checkResource(
    server: ZoneServer2016,
    resourceId: ResourceIds,
    damageCallback?: () => void
  ) {
    const minValue = resourceId == ResourceIds.BLEEDING ? -40 : 0,
      maxValue = server.getResourceMaxValue(resourceId);
    if (this._resources[resourceId] > maxValue) {
      this._resources[resourceId] = maxValue;
    } else if (this._resources[resourceId] < minValue) {
      this._resources[resourceId] =
        minValue + resourceId == ResourceIds.ENDURANCE ? 1 : 0;
      if (damageCallback) {
        damageCallback();
      }
    }
  }

  updateResource(
    server: ZoneServer2016,
    client: ZoneClient2016,
    resourceId: ResourceIds,
    resouceType: ResourceTypes,
    oldValue?: number
  ) {
    const resource = client.character._resources[resourceId];
    if (resource == oldValue) return;
    // only network stamina to other clients
    if (resourceId == ResourceIds.STAMINA) {
      server.updateResourceToAllWithSpawnedEntity(
        client.character.characterId,
        resource > 0 ? resource : 0,
        resourceId,
        resouceType,
        server._characters
      );
      return;
    }
    server.updateResource(
      client,
      this.characterId,
      resource > 0 ? resource : 0,
      resourceId,
      resouceType
    );
  }

  isGodMode() {
    return this.godMode || this.tempGodMode;
  }

  clearReloadTimeout() {
    const weaponItem = this.getEquippedWeapon();
    if (!weaponItem || !weaponItem.weapon || !weaponItem.weapon.reloadTimer)
      return;
    clearTimeout(weaponItem.weapon.reloadTimer);
    weaponItem.weapon.reloadTimer = undefined;
  }
  addCombatlogEntry(entry: DamageRecord) {
    this.combatlog.push(entry);
    if (this.combatlog.length > 10) {
      this.combatlog.shift();
    }
  }
  getCombatLog() {
    return this.combatlog;
  }

  updateLoadout(server: ZoneServer2016, sendPacketToLocalClient = true) {
    const client = server.getClientByContainerAccessor(this);
    if (!client || !client.character.initialized) return;
    server.checkConveys(client);
    if (sendPacketToLocalClient) {
      server.sendData(
        client,
        "Loadout.SetLoadoutSlots",
        this.pGetLoadoutSlots()
      );
    }
    server.sendDataToAllOthersWithSpawnedEntity(
      server._characters,
      client,
      this.characterId,
      "Loadout.SetLoadoutSlots",
      this.pGetLoadoutSlots()
    );
    const abilities: any = [
      {
        loadoutSlotId: 1,
        abilityLineId: 1,
        unknownArray1: [
          {
            unknownDword1: 1111164,
            unknownDword2: 1111164,
            unknownDword3: 0
          }
        ],
        unknownDword3: 2,
        itemDefinitionId: 83,
        unknownByte: 64
      }
      // hardcoded one weapon ability to fix fists after respawning
    ];
    const abilityLineId = 1;
    for (const a in client.character._loadout) {
      const slot = client.character._loadout[a];
      const itemDefinition = server.getItemDefinition(slot.itemDefinitionId);
      if (!itemDefinition) continue;

      const abilityId = itemDefinition.ACTIVATABLE_ABILITY_ID;
      if (slot.itemDefinitionId == Items.WEAPON_FISTS) {
        const object = {
          loadoutSlotId: slot.slotId,
          abilityLineId,
          unknownArray1: [
            {
              unknownDword1: 1111278,
              unknownDword2: 1111278,
              unknownDword3: 0
            },
            {
              unknownDword1: abilityId,
              unknownDword2: abilityId,
              unknownDword3: 0
            }
          ],
          unknownDword3: 2,
          itemDefinitionId: slot.itemDefinitionId,
          unknownByte: 64
        };
        abilities.push(object);
      } else {
        const object = {
          loadoutSlotId: slot.slotId,
          abilityLineId,
          unknownArray1: [
            {
              unknownDword1: abilityId,
              unknownDword2: abilityId,
              unknownDword3: 0
            }
          ],
          unknownDword3: 2,
          itemDefinitionId: slot.itemDefinitionId,
          unknownByte: 64
        };
        abilities.push(object);
      }
      //abilityLineId++;
    }
    server.sendData(client, "Abilities.SetActivatableAbilityManager", {
      abilities
    });
  }

  /**
   * Gets the lightweightpc packetfields for use in sendself and addlightweightpc
   */
  pGetLightweight() {
    return {
      ...super.pGetLightweight(),
      rotation: this.state.lookAt,
      identity: {
        characterName: this.name
      }
    };
  }

  pGetLightweightPC(
    server: ZoneServer2016,
    client: ZoneClient2016
  ): AddLightweightPc {
    const vehicleId = client.vehicle.mountedVehicle,
      vehicle = vehicleId ? server._vehicles[vehicleId] : false;
    return {
      ...this.pGetLightweight(),
      mountGuid: vehicleId || "",
      mountSeatId: vehicle ? vehicle.getCharacterSeat(this.characterId) : 0,
      mountRelatedDword1: vehicle ? 1 : 0,
      flags1: {
        isAdmin: client.isAdmin ? 1 : 0
      }
    };
  }

  pGetSendSelf(
    server: ZoneServer2016,
    guid = "",
    client: ZoneClient2016
  ): SendSelfToClient {
    return {
      data: {
        ...this.pGetLightweight(),
        guid: guid,
        hairModel: this.hairModel,
        isRespawning: this.isRespawning,
        gender: this.gender,
        creationDate: this.creationDate,
        lastLoginDate: this.lastLoginDate,
        identity: {
          characterName: this.name
        },
        inventory: {
          items: this.pGetInventoryItems(server)
          //unknownDword1: 2355
        },
        recipes: server.pGetRecipes(), // todo: change to per-character recipe lists
        stats: this.getStats(),
        loadoutSlots: this.pGetLoadoutSlots(),
        equipmentSlots: this.pGetEquipment() as any,
        characterResources: this.pGetResources(),
        containers: this.pGetContainers(server),
        //unknownQword1: this.characterId,
        //unknownDword38: 1,
        //vehicleLoadoutRelatedQword: this.characterId,
        //unknownQword3: this.characterId,
        //vehicleLoadoutRelatedDword: 1,
        //unknownDword40: 1
        isAdmin: client.isAdmin
      } as any
    };
  }

  pGetRemoteWeaponData(server: ZoneServer2016, item: BaseItem) {
    const itemDefinition = server.getItemDefinition(item.itemDefinitionId),
      weaponDefinition = server.getWeaponDefinition(
        itemDefinition?.PARAM1 ?? 0
      ),
      firegroups: Array<any> = weaponDefinition.FIRE_GROUPS || [];
    return {
      weaponDefinitionId: weaponDefinition.ID,
      equipmentSlotId: this.getActiveEquipmentSlot(item),
      firegroups: firegroups.map((firegroup: any) => {
        const firegroupDef = server.getFiregroupDefinition(
            firegroup.FIRE_GROUP_ID
          ),
          firemodes = firegroupDef?.FIRE_MODES || [];
        if (!firemodes) {
          console.error(`firegroupDef missing for`);
          console.log(firegroup);
        }
        return {
          firegroupId: firegroup.FIRE_GROUP_ID,
          unknownArray1: firegroup
            ? firemodes.map((firemode: any, j: number) => {
                return {
                  unknownDword1: j,
                  unknownDword2: firemode.FIRE_MODE_ID
                };
              })
            : [] // probably firemodes
        };
      })
    };
  }

  pGetRemoteWeaponExtraData(server: ZoneServer2016, item: BaseItem) {
    const itemDefinition = server.getItemDefinition(item.itemDefinitionId),
      weaponDefinition = server.getWeaponDefinition(
        itemDefinition?.PARAM1 ?? 0
      ),
      firegroups = weaponDefinition.FIRE_GROUPS;
    return {
      guid: item.itemGuid,
      unknownByte1: 0, // firegroupIndex (default 0)?
      unknownByte2: 0, // MOST LIKELY firemodeIndex?
      unknownByte3: -1,
      unknownByte4: -1,
      unknownByte5: 1,
      unknownDword1: 0,
      unknownByte6: 0,
      unknownDword2: 0,
      unknownArray1: firegroups.map(() => {
        // same len as firegroups in remoteweapons
        return {
          // setting unknownDword1 makes the 308 sound when fullpc packet it sent
          unknownDword1: 0, //firegroup.FIRE_GROUP_ID,
          unknownBoolean1: false,
          unknownBoolean2: false
        };
      })
    };
  }

  pGetRemoteWeaponsData(server: ZoneServer2016) {
    const remoteWeapons: any[] = [];
    Object.values(this._loadout).forEach((item) => {
      if (server.isWeapon(item.itemDefinitionId)) {
        remoteWeapons.push({
          guid: item.itemGuid,
          ...this.pGetRemoteWeaponData(server, item)
        });
      }
    });
    return remoteWeapons;
  }

  pGetRemoteWeaponsExtraData(server: ZoneServer2016) {
    const remoteWeaponsExtra: any[] = [];
    Object.values(this._loadout).forEach((item) => {
      if (server.isWeapon(item.itemDefinitionId)) {
        remoteWeaponsExtra.push(this.pGetRemoteWeaponExtraData(server, item));
      }
    });
    return remoteWeaponsExtra;
  }

  pGetContainers(server: ZoneServer2016) {
    if (!this.mountedContainer) return super.pGetContainers(server);

    // to avoid a mounted container being dismounted if container list is updated while mounted
    const containers = super.pGetContainers(server),
      mountedContainer = this.mountedContainer.getContainer();
    if (!mountedContainer) return containers;
    /*containers.push({
      loadoutSlotId: mountedContainer.slotId,
      containerData: super.pGetContainerData(server, mountedContainer),
    });*/
    return containers;
  }

  pGetLoadoutSlots() {
    //if (!this.mountedContainer) return super.pGetLoadoutSlots();

    // to avoid a mounted container being dismounted if loadout is updated while mounted

    const loadoutSlots = Object.values(this.getLoadoutSlots()).map((slotId) => {
      return this.pGetLoadoutSlot(slotId);
    });

    //const mountedContainer = this.mountedContainer.getContainer();
    //if (mountedContainer) {}
    /*loadoutSlots.push(
        this.mountedContainer.pGetLoadoutSlot(mountedContainer.slotId)
      );*/
    return {
      characterId: this.characterId,
      loadoutId: this.loadoutId, // needs to be 3
      loadoutData: {
        loadoutSlots: loadoutSlots
      },
      currentSlotId: this.currentLoadoutSlot
    };
  }

  resetMetrics() {
    this.metrics.zombiesKilled = 0;
    this.metrics.wildlifeKilled = 0;
    this.metrics.recipesDiscovered = 0;
    this.metrics.startedSurvivingTP = Date.now();
  }

  resetResources(server: ZoneServer2016) {
    this._resources[ResourceIds.HEALTH] = 10000;
    this._resources[ResourceIds.HUNGER] = 10000;
    this._resources[ResourceIds.HYDRATION] = 10000;
    this._resources[ResourceIds.STAMINA] = 600;
    this._resources[ResourceIds.BLEEDING] = 0;
    this._resources[ResourceIds.ENDURANCE] = 8000;
    this._resources[ResourceIds.VIRUS] = 0;
    this._resources[ResourceIds.COMFORT] = 5000;
    for (const a in this.healType) {
      const healType = this.healType[a];
      healType.healingTicks = 0;
      healType.healingMaxTicks = 0;
    }
    this.hudIndicators = {};
    this.resourcesUpdater?.refresh();
    const client = server.getClientByCharId(this.characterId);
    if (!client) return;
    server.sendHudIndicators(client);
    server.updateResource(
      client,
      this.characterId,
      this._resources[ResourceIds.HEALTH],
      ResourceIds.HEALTH
    );
    server.updateResource(
      client,
      this.characterId,
      this._resources[ResourceIds.STAMINA],
      ResourceIds.STAMINA
    );
    server.updateResource(
      client,
      this.characterId,
      this._resources[ResourceIds.HUNGER],
      ResourceIds.HUNGER
    );
    server.updateResource(
      client,
      this.characterId,
      this._resources[ResourceIds.HYDRATION],
      ResourceIds.HYDRATION
    );
    server.updateResource(
      client,
      this.characterId,
      this._resources[ResourceIds.BLEEDING],
      ResourceIds.BLEEDING
    );
    server.updateResource(
      client,
      this.characterId,
      this._resources[ResourceIds.ENDURANCE],
      ResourceIds.ENDURANCE
    );
    server.updateResource(
      client,
      this.characterId,
      this._resources[ResourceIds.VIRUS],
      ResourceIds.VIRUS
    );
    server.updateResource(
      client,
      this.characterId,
      this._resources[ResourceIds.COMFORT],
      ResourceIds.COMFORT
    );
  }

  damage(server: ZoneServer2016, damageInfo: DamageInfo) {
    const client = server.getClientByCharId(this.characterId),
      damage = damageInfo.damage,
      oldHealth = this._resources[ResourceIds.HEALTH];
    if (!client) return;

    if (this.isGodMode() || !this.isAlive || damage < 100) return;
    if (damageInfo.causeBleed) {
      if (randomIntFromInterval(0, 100) < damage / 100 && damage > 500) {
        this._resources[ResourceIds.BLEEDING] += 41;
        if (damage > 4000) {
          this._resources[ResourceIds.BLEEDING] += 41;
        }
        server.updateResourceToAllWithSpawnedEntity(
          this.characterId,
          this._resources[ResourceIds.BLEEDING],
          ResourceIds.BLEEDING,
          ResourceTypes.BLEEDING,
          server._characters
        );
      }
    }
    this._resources[ResourceIds.HEALTH] -= damage;
    if (this._resources[ResourceIds.HEALTH] <= 0) {
      this._resources[ResourceIds.HEALTH] = 0;
      server.killCharacter(client, damageInfo);
    }
    server.updateResource(
      client,
      this.characterId,
      this._resources[ResourceIds.HEALTH],
      ResourceIds.HEALTH
    );

    const sourceEntity = server.getEntity(damageInfo.entity);
    const orientation = calculateOrientation(
      this.state.position,
      sourceEntity?.state.position || this.state.position // send damaged screen effect during falling/hunger etc
    );
    server.sendData<ClientUpdateDamageInfo>(client, "ClientUpdate.DamageInfo", {
      transientId: 0,
      orientationToSource: orientation,
      unknownDword2: 100
    });
    server.sendChatText(client, `Received ${damage} damage`);

    const damageRecord = server.generateDamageRecord(
      this.characterId,
      damageInfo,
      oldHealth
    );
    this.addCombatlogEntry(damageRecord);
    //server.combatLog(client);

    const sourceClient = server.getClientByCharId(damageInfo.entity);
    if (!sourceClient?.character) return;
    sourceClient.character.addCombatlogEntry(damageRecord);
    //server.combatLog(sourceClient);
  }

  mountContainer(server: ZoneServer2016, lootableEntity: BaseLootableEntity) {
    const client = server.getClientByCharId(this.characterId);
    if (!client) return;
    const container = lootableEntity.getContainer();
    if (!container) {
      server.containerError(client, ContainerErrors.NOT_CONSTRUCTED);
      return;
    }

    if (
      !(lootableEntity instanceof Vehicle2016) &&
      !isPosInRadius(
        lootableEntity.interactionDistance,
        this.state.position,
        lootableEntity.state.position
      )
    ) {
      server.containerError(client, ContainerErrors.INTERACTION_VALIDATION);
      return;
    }

    // construction container permissions
    const lootableConstruction =
      server._lootableConstruction[lootableEntity.characterId];
    if (lootableConstruction && lootableConstruction.parentObjectCharacterId) {
      const parent = lootableConstruction.getParent(server);
      if (
        parent &&
        parent.isSecured &&
        !parent.getHasPermission(
          server,
          this.characterId,
          ConstructionPermissionIds.CONTAINERS
        )
      ) {
        server.containerError(client, ContainerErrors.NO_PERMISSION);
        return;
      }
    }

    const oldMount = this.mountedContainer?.characterId;

    lootableEntity.mountedCharacter = this.characterId;
    this.mountedContainer = lootableEntity;

    server.sendData<AccessedCharacterBeginCharacterAccess>(
      client,
      "AccessedCharacter.BeginCharacterAccess",
      {
        objectCharacterId:
          lootableEntity instanceof Vehicle2016
            ? lootableEntity.characterId
            : EXTERNAL_CONTAINER_GUID,
        mutatorCharacterId: client.character.characterId,
        dontOpenInventory:
          lootableEntity instanceof Vehicle2016 ? true : !!oldMount,
        itemsData: {
          items: Object.values(container.items).map((item) => {
            return lootableEntity.pGetItemData(
              server,
              item,
              container.containerDefinitionId
            );
          }),
          unknownDword1: 92 // idk
        }
      }
    );

    server.initializeContainerList(client, lootableEntity);

    Object.values(lootableEntity._loadout).forEach((item) => {
      server.addItem(client, item, LOADOUT_CONTAINER_ID, lootableEntity);
    });

    Object.values(container.items).forEach((item) => {
      server.addItem(
        client,
        item,
        container.containerDefinitionId,
        lootableEntity
      );
    });

    server.sendData<LoadoutSetLoadoutSlots>(client, "Loadout.SetLoadoutSlots", {
      characterId:
        lootableEntity instanceof Vehicle2016
          ? lootableEntity.characterId
          : EXTERNAL_CONTAINER_GUID,
      loadoutId:
        lootableEntity instanceof Vehicle2016 ? lootableEntity.loadoutId : 5,
      loadoutData: {
        loadoutSlots: Object.values(lootableEntity.getLoadoutSlots()).map(
          (slotId) => {
            return lootableEntity.pGetLoadoutSlot(slotId);
          }
        )
      },
      currentSlotId: lootableEntity.currentLoadoutSlot
    });
  }

  dismountContainer(server: ZoneServer2016) {
    const client = server.getClientByCharId(this.characterId);
    if (!client || !this.mountedContainer) return;

    const container = this.mountedContainer.getContainer();
    if (!container) {
      server.containerError(client, ContainerErrors.NOT_CONSTRUCTED);
      return;
    }

    server.deleteItem(this, container.itemGuid);
    Object.values(container.items).forEach((item) => {
      if (!this.mountedContainer) return;
      server.deleteItem(this, item.itemGuid);
    });

    if (this.mountedContainer.isLootbag && !_.size(container.items)) {
      server.deleteEntity(this.mountedContainer.characterId, server._lootbags);
    }

    server.sendData<AccessedCharacterEndCharacterAccess>(
      client,
      "AccessedCharacter.EndCharacterAccess",
      {
        characterId: this.mountedContainer.characterId || ""
      }
    );

    delete this.mountedContainer.mountedCharacter;
    delete this.mountedContainer;
    this.updateLoadout(server);
    server.initializeContainerList(client);
  }

  getStats() {
    return stats.map((stat: any) => {
      return {
        statId: stat.statData.statId,
        statData: {
          statId: stat.statData.statId,
          statValue: {
            type:
              isFloat(stat.statData.statValue.value.base) ||
              isFloat(stat.statData.statValue.value.modifier)
                ? 1
                : 0,
            value: {
              base: stat.statData.statValue.value.base,
              modifier: stat.statData.statValue.value.modifier
            }
          }
        }
      };
    });
  }

  updateEquipmentSlot(
    server: ZoneServer2016,
    slotId: number,
    sendPacketToLocalClient = true
  ) {
    if (!server.getClientByCharId(this.characterId)?.character.initialized)
      return;
    /*
    server.sendDataToAllWithSpawnedEntity(
      server._characters,
      this.characterId,
      "Equipment.SetCharacterEquipmentSlot",
      this.pGetEquipmentSlotFull(slotId) as EquipmentSetCharacterEquipmentSlot
    );
    */
    // GROUP OUTLINE WORKAROUND

    server.executeFuncForAllReadyClients((client) => {
      let groupId = 0;
      if (client.character != this) {
        groupId = client.character.groupId;
      }
      if (
        sendPacketToLocalClient ||
        this.characterId != client.character.characterId
      ) {
        server.sendData<EquipmentSetCharacterEquipmentSlot>(
          client,
          "Equipment.SetCharacterEquipmentSlot",
          this.pGetEquipmentSlotFull(
            slotId,
            groupId
          ) as EquipmentSetCharacterEquipmentSlot
        );
      }
    });
  }

  meleeBlocked(delay: number = 1000) {
    return this.lastMeleeHitTime + delay >= Date.now();
  }

  checkCurrentInteractionGuid() {
    // mainly for melee workaround (3s timeout)
    if (
      this.currentInteractionGuid &&
      this.lastInteractionStringTime + 1000 <= Date.now()
    ) {
      this.currentInteractionGuid = "";
    }
  }

  pGetEquipmentSlotFull(slotId: number, groupId?: number) {
    const slot = this._equipment[slotId];
    if (!slot) return;
    return {
      characterData: {
        characterId: this.characterId
      },
      equipmentSlot: this.pGetEquipmentSlot(slotId),
      attachmentData: this.pGetAttachmentSlot(slotId, groupId)
    };
  }

  updateEquipment(server: ZoneServer2016, groupId?: number) {
    if (!server.getClientByCharId(this.characterId)?.character.initialized)
      return;
    server.sendDataToAllWithSpawnedEntity(
      server._characters,
      this.characterId,
      "Equipment.SetCharacterEquipment",
      this.pGetEquipment(groupId)
    );
  }

  pGetEquipment(groupId?: number) {
    return {
      characterData: {
        profileId: 5,
        characterId: this.characterId
      },
      unknownDword1: 0,
      unknownString1: "Default",
      unknownString2: "#",
      equipmentSlots: this.pGetEquipmentSlots(),
      attachmentData: this.pGetAttachmentSlots(groupId),
      unknownBoolean1: true
    };
  }

  pGetAttachmentSlots(groupId?: number) {
    return Object.keys(this._equipment).map((slotId) => {
      return this.pGetAttachmentSlot(Number(slotId), groupId);
    });
  }

  pGetAttachmentSlot(slotId: number, groupId?: number) {
    const slot = this._equipment[slotId];
    return slot
      ? {
          modelName:
            slot.modelName /* == "Weapon_Empty.adr" ? slot.modelName : ""*/,
          effectId: this.groupId > 0 && this.groupId == groupId ? 3 : 0,
          textureAlias: slot.textureAlias || "",
          tintAlias: slot.tintAlias || "Default",
          decalAlias: slot.decalAlias || "#",
          slotId: slot.slotId
          //SHADER_PARAMETER_GROUP: slot.SHADER_PARAMETER_GROUP
        }
      : undefined;
  }

  pGetItemData(server: ZoneServer2016, item: BaseItem, containerDefId: number) {
    let durability: number = 0;
    switch (true) {
      case server.isWeapon(item.itemDefinitionId):
        durability = 2000;
        break;
      case server.isArmor(item.itemDefinitionId):
        durability = 1000;
        break;
      case server.isHelmet(item.itemDefinitionId):
        durability = 100;
        break;
    }
    return {
      itemDefinitionId: item.itemDefinitionId,
      tintId: 0,
      guid: item.itemGuid,
      count: item.stackCount,
      itemSubData: {
        hasSubData: false
      },
      containerGuid: item.containerGuid,
      containerDefinitionId: containerDefId,
      containerSlotId: item.slotId,
      baseDurability: durability,
      currentDurability: durability ? item.currentDurability : 0,
      maxDurabilityFromDefinition: durability,
      unknownBoolean1: true,
      ownerCharacterId: this.characterId,
      unknownDword9: 1,
      weaponData: this.pGetItemWeaponData(server, item)
    };
  }

  OnFullCharacterDataRequest(server: ZoneServer2016, client: ZoneClient2016) {
    server.sendData(client, "LightweightToFullPc", {
      useCompression: false,
      fullPcData: {
        transientId: this.transientId,
        attachmentData: this.pGetAttachmentSlots(client.character.groupId),
        headActor: this.headActor,
        hairModel: this.hairModel,
        resources: { data: this.pGetResources() },
        remoteWeapons: { data: this.pGetRemoteWeaponsData(server) }
      },
      positionUpdate: {
        ...this.positionUpdate,
        sequenceTime: server.getGameTime(),
        position: this.state.position, // trying to fix invisible characters/vehicles until they move
        stance: 66561
      },
      stats: this.getStats().map((stat: any) => {
        return stat.statData;
      }),
      remoteWeaponsExtra: this.pGetRemoteWeaponsExtraData(server)
    });

    // needed so all weapons replicate reload and projectile impact
    Object.values(this._loadout).forEach((item) => {
      if (!server.isWeapon(item.itemDefinitionId)) return;
      server.sendRemoteWeaponUpdateData(
        client,
        this.transientId,
        item.itemGuid,
        "Update.SwitchFireMode",
        {
          firegroupIndex: 0,
          firemodeIndex: 0
        }
      );
    });

    server.sendData<CharacterWeaponStance>(client, "Character.WeaponStance", {
      characterId: this.characterId,
      stance: this.weaponStance
    });

    // GROUP OUTLINE WORKAROUND
    server.sendData<EquipmentSetCharacterEquipment>(
      client,
      "Equipment.SetCharacterEquipment",
      this.pGetEquipment(client.character.groupId)
    );
    const c = server.getClientByCharId(this.characterId);
    if (c && !c.firstLoading) {
      server.updateCharacterState(
        client,
        this.characterId,
        this.characterStates,
        false
      );
    }

    if (this.onReadyCallback) {
      this.onReadyCallback(client);
      delete this.onReadyCallback;
    }
  }

  OnProjectileHit(server: ZoneServer2016, damageInfo: DamageInfo) {
    if (!this.isAlive) return;

    const itemDefinition = server.getItemDefinition(damageInfo.weapon);
    if (!itemDefinition) return;
    const weaponDefinitionId = itemDefinition.PARAM1;

    const client = server.getClientByCharId(damageInfo.entity), // source
      c = server.getClientByCharId(this.characterId); // target
    if (!client || !c || !damageInfo.hitReport) {
      return;
    }

    server.fairPlayManager.hitMissFairPlayCheck(
      server,
      client,
      true,
      damageInfo.hitReport?.hitLocation || ""
    );
    const hasHelmetBefore = this.hasHelmet(server);
    const hasArmorBefore = this.hasArmor(server);

    let damage = damageInfo.damage,
      canStopBleed,
      armorDmgModifier;
    weaponDefinitionId == WeaponDefinitionIds.WEAPON_SHOTGUN
      ? (armorDmgModifier = 10)
      : (armorDmgModifier = 4);
    if (weaponDefinitionId == WeaponDefinitionIds.WEAPON_308)
      armorDmgModifier = 2;
    switch (damageInfo.hitReport?.hitLocation) {
      case "HEAD":
      case "GLASSES":
      case "NECK":
        weaponDefinitionId == WeaponDefinitionIds.WEAPON_SHOTGUN
          ? (damage *= 2)
          : (damage *= 4);
        weaponDefinitionId == WeaponDefinitionIds.WEAPON_308
          ? (damage *= 2)
          : damage;
        damage = server.checkHelmet(this.characterId, damage, 1);
        break;
      default:
        damage = server.checkArmor(this.characterId, damage, armorDmgModifier);
        canStopBleed = true;
        break;
    }

    if (this.isAlive) {
      server.sendHitmarker(
        client,
        damageInfo.hitReport?.hitLocation,
        this.hasHelmet(server),
        this.hasArmor(server),
        hasHelmetBefore,
        hasArmorBefore
      );
    }

    /* eslint-disable @typescript-eslint/no-unused-vars */
    switch (weaponDefinitionId) {
      case WeaponDefinitionIds.WEAPON_BLAZE:
        this._characterEffects[Effects.PFX_Fire_Person_loop] = {
          id: Effects.PFX_Fire_Person_loop,
          duration: Date.now() + 10000,
          callback: function (
            server: ZoneServer2016,
            character: Character2016
          ) {
            character.damage(server, {
              entity: "Character.CharacterEffect",
              damage: 500
            });
            server.sendDataToAllWithSpawnedEntity(
              server._characters,
              character.characterId,
              "Command.PlayDialogEffect",
              {
                characterId: character.characterId,
                effectId: Effects.PFX_Fire_Person_loop
              }
            );
          }
        };
        server.sendDataToAllWithSpawnedEntity(
          server._characters,
          this.characterId,
          "Command.PlayDialogEffect",
          {
            characterId: this.characterId,
            effectId: Effects.PFX_Fire_Person_loop
          }
        );
        break;
      case WeaponDefinitionIds.WEAPON_FROSTBITE:
        if (!this._characterEffects[Effects.PFX_Seasonal_Holiday_Snow_skel]) {
          server.sendData<ClientUpdateModifyMovementSpeed>(
            c,
            "ClientUpdate.ModifyMovementSpeed",
            {
              speed: 0.5
            }
          );
        }
        this._characterEffects[Effects.PFX_Seasonal_Holiday_Snow_skel] = {
          id: Effects.PFX_Seasonal_Holiday_Snow_skel,
          duration: Date.now() + 5000,
          endCallback: function (
            server: ZoneServer2016,
            character: Character2016
          ) {
            server.sendData<ClientUpdateModifyMovementSpeed>(
              c,
              "ClientUpdate.ModifyMovementSpeed",
              {
                speed: 2
              }
            );
          }
        };
        server.sendDataToAllWithSpawnedEntity(
          server._characters,
          this.characterId,
          "Command.PlayDialogEffect",
          {
            characterId: this.characterId,
            effectId: Effects.PFX_Seasonal_Holiday_Snow_skel
          }
        );
        break;
    }
    /* eslint-enable @typescript-eslint/no-unused-vars */
    this.damage(server, {
      ...damageInfo,
      damage: damage,
      causeBleed: !(canStopBleed && this.hasArmor(server))
    });
  }

  OnMeleeHit(server: ZoneServer2016, damageInfo: DamageInfo) {
    let damage = damageInfo.damage / 2;
    let bleedingChance = 5;
    switch (damageInfo.meleeType) {
      case MeleeTypes.BLADE:
        bleedingChance = 35;
        break;
      case MeleeTypes.BLUNT:
        bleedingChance = 15;
        break;
      case MeleeTypes.FISTS:
        bleedingChance = 5;
        break;
      case MeleeTypes.GUITAR:
        bleedingChance = 15;
        break;
      case MeleeTypes.KNIFE:
        bleedingChance = 35;
        break;
    }
    switch (damageInfo.hitReport?.hitLocation) {
      case "HEAD":
      case "GLASSES":
      case "NECK":
        damage = server.checkHelmet(this.characterId, damage, 1);
        break;
      default:
        damage = server.checkArmor(this.characterId, damage, 4);
        break;
    }
    if (randomIntFromInterval(0, 100) <= bleedingChance) {
      this._resources[ResourceIds.BLEEDING] += 20;
      server.updateResourceToAllWithSpawnedEntity(
        this.characterId,
        this._resources[ResourceIds.BLEEDING],
        ResourceIds.BLEEDING,
        ResourceIds.BLEEDING,
        server._characters
      );
    }
    this.damage(server, { ...damageInfo, damage });
  }
}
