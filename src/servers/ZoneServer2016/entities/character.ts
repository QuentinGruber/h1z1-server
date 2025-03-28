// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2025 H1emu community
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
  ResourceIndicators,
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
  Recipe,
  StanceFlags
} from "../../../types/zoneserver";
import {
  calculateOrientation,
  isFloat,
  isPosInRadius,
  randomIntFromInterval,
  _,
  checkConstructionInRange,
  getCurrentServerTimeWrapper,
  getDistance
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
  EquipmentSetCharacterEquipmentSlot,
  LoadoutSetLoadoutSlots,
  SendSelfToClient
} from "types/zone2016packets";
import { Vehicle2016 } from "../entities/vehicle";
import {
  EXTERNAL_CONTAINER_GUID,
  LOADOUT_CONTAINER_ID
} from "../../../utils/constants";
import { recipes } from "../data/Recipes";
import { ConstructionChildEntity } from "./constructionchildentity";
import { ConstructionParentEntity } from "./constructionparententity";
import { ExplosiveEntity } from "./explosiveentity";
import { BaseEntity } from "./baseentity";
import { ProjectileEntity } from "./projectileentity";
import { ChallengeType } from "../managers/challengemanager";
const stats = require("../../../../data/2016/sampleData/stats.json");

interface CharacterStates {
  invincibility: boolean;
  gmHidden?: boolean;
  knockedOut?: boolean;
  inWater?: boolean;
  userMovementDisabled?: boolean;
  revivable?: boolean;
  beingRevived?: boolean;
}

interface CharacterMetrics {
  zombiesKilled: number;
  wildlifeKilled: number;
  recipesDiscovered: number;
  startedSurvivingTP: number; // timestamp
  vehiclesDestroyed: number;
  playersKilled: number;
}

interface MeleeHit {
  abilityHitLocation: string;
  characterId: string;
}
export class Character2016 extends BaseFullCharacter {
  /** The players in-game name */
  name!: string;

  /** The location the player spawned at */
  spawnLocation?: string;

  /** Used to update the status of the players resources */
  resourcesUpdater?: any;
  factionId = 2;
  isInInventory: boolean = false;
  playTime: number = 0;
  lastDropPlaytime: number = 0;
  set godMode(state: boolean) {
    this.characterStates.invincibility = state;
  }
  get godMode() {
    return this.characterStates.invincibility;
  }
  /** Determines several states of the player such as being in water or knocked out */
  characterStates: CharacterStates;

  awaitingTeleportLocation?: Float32Array;

  /** States set by StanceFlags */
  isRunning = false;
  isSitting = false;

  /** The guid of the secured shelter the player is inside */
  isHidden: string = "";

  /** Used for resources */
  isBleeding = false;
  isBandaged = false;
  isExhausted = false;
  isPoisoned = false;
  isCoffeeSugared = false;
  isDeerScented = false;

  /** Last time (milliseconds) the player melee'd */
  lastMeleeHitTime: number = 0;

  /** Used to determine if a player has aimlock */
  aimVectorWarns: number = 0;

  /** Set by isAlive(state), determines whether the player is alive */
  static isAlive = true;

  /** Sets the knocked out state of the character to determine aliveness */
  public set isAlive(state) {
    this.characterStates.knockedOut = !state;
  }
  /** Checks whether the player is alive */
  public get isAlive() {
    return !this.characterStates.knockedOut;
  }
  /** Determines if a player is currently moving */
  isMoving = false;

  /** Values used upon character creation */
  hairModel!: string;
  isRespawning = false;
  isReady = false;
  creationDate!: string;

  /** Last login date for the player */
  lastLoginDate!: string;

  /** Last player that the user has whispered to */
  lastWhisperedPlayer!: string;

  /** Returns true if a player has recently melee'd a bee box */
  hasAlertedBees = false;

  /** Time (milliseconds) at which the player last exited a vehicle */
  vehicleExitDate: number = new Date().getTime();

  /** Current selected slot inside the player's hotbar */
  currentLoadoutSlot = LoadoutSlots.FISTS;

  /** Current player/vehicle loadout */
  readonly loadoutId = LoadoutIds.CHARACTER;

  /** Used for applying the interval of healing to be applied for any heal type */
  healingIntervals: Record<HealTypes, NodeJS.Timeout | null> = {
    1: null,
    2: null,
    3: null
  };
  /** Used for applying multiple healing types at once */
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

  /** Used for applying the interval of healing to be applied for any heal type */
  starthealingInterval: (
    client: ZoneClient2016,
    server: ZoneServer2016,
    healType: HealTypes
  ) => void;
  timeouts: any;

  /** Handles the current position of the player */
  positionUpdate?: positionUpdate;

  /** Admin tools */
  tempGodMode = false;
  isVanished = false;
  isSpectator = false;

  /** Called once SendSelfToClient has been sent */
  initialized = false;

  /** Data for the spawn grid map, keeps track of which grids to block out */
  spawnGridData: number[] = [];

  /** Values used by Fairplay */
  lastJumpTime: number = 0;
  lastSitTime: number = 0;
  sitCount: number = 0;

  /** Values used for detecting Enas movement (spamming crouch for an advantage) */
  crouchCount: number = 0;
  lastCrouchTime: number = 0;
  isCrouching: boolean = false;

  /** Current stance of the player while holding a weapon */
  weaponStance: number = 1;

  /** Current stance of the player: jumping, running etc. (See getStanceFlags for all possible stances) */
  stance?: StanceFlags;

  /** Metrics of miscellaneous attributes */
  metrics: CharacterMetrics = {
    recipesDiscovered: 0,
    zombiesKilled: 0,
    wildlifeKilled: 0,
    startedSurvivingTP: Date.now(),
    vehiclesDestroyed: 0,
    playersKilled: 0
  };

  /** Tracks combat with other players/entities */
  private combatlog: DamageRecord[] = [];

  /** CharacterId of the vehicle spawned by /hax drive or spawnVehicle */
  ownedVehicle?: string;

  /** Values determined by what entity the player is looking at and in range of */
  currentInteractionGuid: string = "";
  lastInteractionRequestGuid?: string;
  lastInteractionStringTime = 0;
  lastInteractionTime = 0;

  /** The current container attached in the top left of the player's inventory  */
  mountedContainer?: BaseLootableEntity;

  /** Default loadout the player will spawn with */
  defaultLoadout = characterDefaultLoadout;

  /** List of ignored players's characterIds */
  mutedCharacters: Array<string> = [];

  /** Id of the player's group */
  groupId: number = 0;

  /** Used for applied effects to a player - burning, movement speed etc. */
  _characterEffects: {
    [effectId: number]: CharacterEffect;
  } = {};

  /** The time at which the most recent unlock attempt, failed */
  lastLockFailure: number = 0;

  /** Array of the player's applied HUD indicators */
  resourceHudIndicators: string[] = [];

  /** Indicator's for the bottom right HUD: bleeding, bandage, BEES! etc. */
  hudIndicators: { [typeName: string]: characterIndicatorData } = {};

  /** Screen effects applied to a player: bleeding, night vision, etc. (see ScreenEffects.json) */
  screenEffects: string[] = [];

  /** The time (milliseconds) at which a user has sent a second melee hit */
  abilityInitTime: number = 0;

  /** Used for keeping track of the location and characterId of the first registered melee hit */
  meleeHit: MeleeHit = {
    abilityHitLocation: "",
    characterId: ""
  };
  lastRepairTime: number = 0;
  /** HashMap of all recipes on a server
   * uses recipeId (number) for indexing
   */
  recipes: { [recipeId: number]: Recipe } = recipes;

  currentChallenge: ChallengeType = ChallengeType.NONE;

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

    /** The distance at which the character will render, exceeding the renderDistance and the object renders away */
    this.npcRenderDistance = 310;

    /** Default resource amounts applied after respawning */
    this._resources = {
      [ResourceIds.HEALTH]: 10000,
      [ResourceIds.STAMINA]: 600,
      [ResourceIds.HUNGER]: 10000,
      [ResourceIds.HYDRATION]: 10000,
      [ResourceIds.VIRUS]: 0,
      [ResourceIds.COMFORT]: 5000,
      [ResourceIds.BLEEDING]: 0,
      [ResourceIds.ENDURANCE]: 8000
    };
    this.characterStates = {
      knockedOut: false,
      inWater: false,
      invincibility: false
    };
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

  getShaderGroup() {
    switch (this.headActor) {
      case "SurvivorMale_Head_02.adr":
      case "SurvivorFemale_Head_02.adr":
        return 125;
      case "SurvivorMale_Head_03.adr":
      case "SurvivorFemale_Head_03.adr":
        return 129;
      default:
        return 122;
    }
  }

  pGetRecipes(server: ZoneServer2016): any[] {
    const recipeKeys = Object.keys(this.recipes);

    const recipes: Array<any> = [];
    let i = 0;
    for (const recipe of Object.values(this.recipes)) {
      const recipeDef = server.getItemDefinition(Number(recipeKeys[i]));
      i++;
      if (!recipeDef) continue;
      recipes.push({
        recipeId: recipeDef.ID,
        itemDefinitionId: recipeDef.ID,
        nameId: recipeDef.NAME_ID,
        iconId: recipeDef.IMAGE_SET_ID,
        unknownDword1: 0, // idk
        descriptionId: recipeDef.DESCRIPTION_ID,
        unknownDword2: 1, // idk
        bundleCount: recipe.bundleCount || 1,
        membersOnly: false, // could be used for admin-only recipes?
        filterId: recipe.filterId,
        components: recipe.components
          .map((component: any) => {
            const componentDef = server.getItemDefinition(
              component.itemDefinitionId
            );
            if (!componentDef) return true;
            return {
              unknownDword1: 0, // idk
              nameId: componentDef.NAME_ID,
              iconId: componentDef.IMAGE_SET_ID,
              unknownDword2: 0, // idk
              requiredAmount: component.requiredAmount,
              unknownQword1: "0x0", // idk
              unknownDword3: 0, // idk
              itemDefinitionId: componentDef.ID
            };
          })
          .filter((component) => component !== true)
      });
    }

    return recipes;
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
      energy = this._resources[ResourceIds.ENDURANCE],
      comfort = this._resources[ResourceIds.COMFORT];

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
    if (
      client.character.isSitting &&
      (checkConstructionInRange(
        server._lootableConstruction,
        client.character.state.position,
        4,
        Items.CAMPFIRE
      ) ||
        checkConstructionInRange(
          server._worldLootableConstruction,
          client.character.state.position,
          4,
          Items.CAMPFIRE
        ))
    ) {
      client.character._resources[ResourceIds.COMFORT] += 30;
    }

    client.character._resources[ResourceIds.HUNGER] -= 2;
    client.character._resources[ResourceIds.ENDURANCE] -= 2;
    client.character._resources[ResourceIds.COMFORT] -= 3;
    client.character._resources[ResourceIds.HYDRATION] -= 4;

    let desiredEnergyIndicator = "";
    const energyIndicators = [
      ResourceIndicators.EXHAUSTED,
      ResourceIndicators.VERY_TIRED,
      ResourceIndicators.TIRED
    ];
    switch (true) {
      case energy <= 801:
        desiredEnergyIndicator = ResourceIndicators.EXHAUSTED;
        client.character._resources[ResourceIds.STAMINA] -= 20;
        break;
      case energy <= 2601 && energy > 801:
        desiredEnergyIndicator = ResourceIndicators.VERY_TIRED;
        client.character._resources[ResourceIds.STAMINA] -= 14;
        break;
      case energy <= 3501 && energy > 2601:
        server.challengeManager.registerChallengeProgression(
          client,
          ChallengeType.TIRED_BUDDY,
          1
        );
        desiredEnergyIndicator = ResourceIndicators.TIRED;
        break;
      case energy > 3501:
        desiredEnergyIndicator = "";
        break;
      default:
        desiredEnergyIndicator = "";
        break;
    }

    let desiredComfortIndicator = "";
    const comfortIndicators = [
      ResourceIndicators.COMFORT_PLUS,
      ResourceIndicators.COMFORT_PLUSPLUS
    ];
    switch (true) {
      case comfort > 2001:
        desiredComfortIndicator = ResourceIndicators.COMFORT_PLUSPLUS;
        client.character._resources[ResourceIds.HEALTH] += 10;
        client.character._resources[ResourceIds.STAMINA] += 2;
        break;
      case comfort >= 751 && comfort <= 2001:
        desiredComfortIndicator = ResourceIndicators.COMFORT_PLUS;
        client.character._resources[ResourceIds.HEALTH] += 5;
        client.character._resources[ResourceIds.STAMINA] += 1;
        break;
      case comfort < 751:
        desiredComfortIndicator = "";
        break;
      default:
        desiredComfortIndicator = "";
        break;
    }

    this.checkResource(server, ResourceIds.ENDURANCE);
    this.checkResource(server, ResourceIds.STAMINA);
    this.checkResource(server, ResourceIds.COMFORT);
    [...energyIndicators, ...comfortIndicators].forEach((indicator: string) => {
      const index = this.resourceHudIndicators.indexOf(indicator);
      const desiredIndicator =
        indicator === desiredEnergyIndicator
          ? desiredEnergyIndicator
          : indicator === desiredComfortIndicator
            ? desiredComfortIndicator
            : null;

      if (index > -1 && indicator != desiredIndicator) {
        this.resourceHudIndicators.splice(index, 1);
        server.sendHudIndicators(client);
      } else if (indicator == desiredIndicator && index <= -1) {
        this.resourceHudIndicators.push(desiredIndicator);
        server.sendHudIndicators(client);
      }
    });

    let desiredBleedingIndicator = "";
    const bleedingIndicators = [
      ResourceIndicators.BLEEDING_LIGHT,
      ResourceIndicators.BLEEDING_MODERATE,
      ResourceIndicators.BLEEDING_SEVERE
    ];
    switch (true) {
      case bleeding > 0 && bleeding < 30:
        desiredBleedingIndicator = ResourceIndicators.BLEEDING_LIGHT;
        break;
      case bleeding >= 30 && bleeding < 60:
        desiredBleedingIndicator = ResourceIndicators.BLEEDING_MODERATE;
        break;
      case bleeding >= 60:
        desiredBleedingIndicator = ResourceIndicators.BLEEDING_SEVERE;
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
        entity: "Server.Character.Bleeding",
        damage:
          Math.ceil(client.character._resources[ResourceIds.BLEEDING] / 40) *
          100
      });
    }
    this.checkResource(server, ResourceIds.BLEEDING);
    this.checkResource(server, ResourceIds.HUNGER, () => {
      this.damage(server, { entity: "Server.Character.Hunger", damage: 100 });
    });
    const indexHunger = this.resourceHudIndicators.indexOf(
      ResourceIndicators.STARVING
    );
    if (hunger == 0) {
      if (indexHunger <= -1) {
        this.resourceHudIndicators.push(ResourceIndicators.STARVING);
        server.sendHudIndicators(client);
      }
    } else {
      if (indexHunger > -1) {
        this.resourceHudIndicators.splice(indexHunger, 1);
        server.sendHudIndicators(client);
      }
    }
    const indexFoodPoison = this.resourceHudIndicators.indexOf(
      ResourceIndicators.FOOD_POISONING
    );
    if (this.isPoisoned) {
      if (indexFoodPoison <= -1) {
        this.resourceHudIndicators.push(ResourceIndicators.FOOD_POISONING);
        server.sendHudIndicators(client);
      }
    } else {
      if (indexFoodPoison > -1) {
        this.resourceHudIndicators.splice(indexFoodPoison);
        server.sendHudIndicators(client);
      }
    }
    const indexCoffeeSugared = this.resourceHudIndicators.indexOf(
      ResourceIndicators.COFFEE_SUGAR
    );
    if (this.isCoffeeSugared) {
      if (indexCoffeeSugared <= -1) {
        this.resourceHudIndicators.push(ResourceIndicators.COFFEE_SUGAR);
        server.sendHudIndicators(client);
      }
    } else {
      if (indexCoffeeSugared > -1) {
        this.resourceHudIndicators.splice(indexFoodPoison);
        server.sendHudIndicators(client);
      }
    }
    this.checkResource(server, ResourceIds.HUNGER, () => {
      this.damage(server, { entity: "Server.Character.Hunger", damage: 100 });
    });
    this.checkResource(server, ResourceIds.HYDRATION, () => {
      this.damage(server, {
        entity: "Server.Character.Hydration",
        damage: 100
      });
    });
    const indexDehydrated = this.resourceHudIndicators.indexOf(
      ResourceIndicators.DEHYDRATED
    );
    if (hydration == 0) {
      if (indexDehydrated <= -1) {
        this.resourceHudIndicators.push(ResourceIndicators.DEHYDRATED);
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
    if (stamina <= 2) {
      server.challengeManager.registerChallengeProgression(
        client,
        ChallengeType.CARDIO_ISSUES,
        1
      );
    }
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
    this.updateResource(
      server,
      client,
      ResourceIds.COMFORT,
      ResourceTypes.COMFORT,
      comfort
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
   * Gets the LightweightPC packet fields for use in SelfSendToClient and AddLightweightPC
   */
  pGetLightweight() {
    return {
      ...super.pGetLightweight(),
      rotation: this.state.lookAt,
      identity: {
        characterName: this.name
      },
      shaderGroupId: this.getShaderGroup()
    };
  }

  pGetLightweightPC(
    server: ZoneServer2016,
    client: ZoneClient2016
  ): AddLightweightPc {
    const vehicleId = client.vehicle.mountedVehicle,
      vehicle = server._vehicles[vehicleId ?? ""],
      mountSeatId = vehicle?.getCharacterSeat(this.characterId);
    return {
      ...this.pGetLightweight(),
      mountGuid: vehicleId || "",
      mountSeatId: mountSeatId == -1 ? 0 : mountSeatId,
      mountRelatedDword1: vehicle ? 1 : 0,
      flags1: {
        isAdmin: client.isAdmin ? 1 : 0
      }
    };
  }

  pGetSendSelf(
    server: ZoneServer2016,
    client: ZoneClient2016
  ): SendSelfToClient {
    return {
      data: {
        ...this.pGetLightweight(),
        guid: client.loginSessionId,
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
        recipes: this.pGetRecipes(server),
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
        isAdmin: client.isAdmin,
        firstPersonOnly: server.isFirstPersonOnly,
        shaderGroupId: this.getShaderGroup()
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
    this.metrics.vehiclesDestroyed = 0;
    this.metrics.playersKilled = 0;
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

  getHealth() {
    return this._resources[ResourceIds.HEALTH];
  }
  async damage(server: ZoneServer2016, damageInfo: DamageInfo) {
    if (
      server.isPvE &&
      damageInfo.hitReport?.characterId &&
      server._characters[damageInfo.hitReport?.characterId]
    )
      return;
    const client = server.getClientByCharId(this.characterId),
      damage = damageInfo.damage,
      oldHealth = this._resources[ResourceIds.HEALTH];
    if (!client) return;

    if (this.isGodMode() || !this.isAlive || this.isRespawning || damage <= 25)
      return;

    // Don't damage players inside shelters
    if (this.isHidden) {
      const entity = server.getConstructionEntity(this.isHidden);

      if (
        entity instanceof ConstructionChildEntity ||
        entity instanceof ConstructionParentEntity
      ) {
        if (
          damage > 0 &&
          !damageInfo.entity.includes("Server.") &&
          entity.isInside(this.state.position)
        ) {
          return;
        }
      }
    }

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
    const sourceEntity = server.getEntity(damageInfo.entity);
    this._resources[ResourceIds.HEALTH] -= damage;
    if (this._resources[ResourceIds.HEALTH] <= 0) {
      this._resources[ResourceIds.HEALTH] = 0;
      server.killCharacter(client, damageInfo);
      if (
        sourceEntity instanceof Character2016 &&
        sourceEntity.characterId != client.character.characterId
      ) {
        sourceEntity.metrics.playersKilled++;
      }
    }
    server.updateResource(
      client,
      this.characterId,
      this._resources[ResourceIds.HEALTH],
      ResourceIds.HEALTH
    );

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

    const damageRecord = await server.generateDamageRecord(
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

  /**
   *
   * @param {ZoneServer2016} server - The current server
   * @param {BaseLootableEntity} lootableEntity - The lootable entity the player will mount to
   * @returns
   */
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
      const c = server.getClientByCharId(this.characterId);
      if (
        parent &&
        parent.isSecured &&
        !c?.isDebugMode &&
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

    // Only mount container if none is mounted
    if (!lootableEntity.mountedCharacter) {
      lootableEntity.mountedCharacter = this.characterId;
    }

    this.mountedContainer = lootableEntity;

    // Change accessor so others in the vehicle will also see the loot but can't interact with
    let accessor = client.character.characterId;
    if (
      lootableEntity instanceof Vehicle2016 &&
      server._vehicles[lootableEntity.characterId]
    ) {
      const vehicle = server._vehicles[lootableEntity.characterId],
        driver = vehicle.getDriver(server);
      if (driver) accessor = driver.characterId;
      else accessor = "0x0";
    }

    server.sendData<AccessedCharacterBeginCharacterAccess>(
      client,
      "AccessedCharacter.BeginCharacterAccess",
      {
        objectCharacterId:
          lootableEntity instanceof Vehicle2016
            ? lootableEntity.characterId
            : EXTERNAL_CONTAINER_GUID,
        mutatorCharacterId: accessor,
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

  updateEquipmentSlot(server: ZoneServer2016, slotId: number) {
    if (!server.getClientByCharId(this.characterId)?.character.initialized)
      return;

    server.sendDataToAllWithSpawnedEntity(
      server._characters,
      this.characterId,
      "Equipment.SetCharacterEquipmentSlot",
      this.pGetEquipmentSlotFull(slotId) as EquipmentSetCharacterEquipmentSlot
    );
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

  pGetEquipmentSlotFull(slotId: number) {
    const slot = this._equipment[slotId];
    if (!slot) return;
    return {
      characterData: {
        characterId: this.characterId
      },
      equipmentSlot: this.pGetEquipmentSlot(slotId),
      attachmentData: this.pGetAttachmentSlot(slotId)
    };
  }

  updateEquipment(server: ZoneServer2016) {
    if (!server.getClientByCharId(this.characterId)?.character.initialized)
      return;
    server.sendDataToAllWithSpawnedEntity(
      server._characters,
      this.characterId,
      "Equipment.SetCharacterEquipment",
      this.pGetEquipment()
    );
  }

  pGetEquipment() {
    return {
      characterData: {
        profileId: 5,
        characterId: this.characterId
      },
      unknownDword1: 0,
      tintAlias: "Default",
      decalAlias: "#",
      equipmentSlots: this.pGetEquipmentSlots(),
      attachmentData: this.pGetAttachmentSlots(),
      unknownBoolean1: true
    };
  }

  pGetAttachmentSlots() {
    return Object.keys(this._equipment).map((slotId) => {
      return this.pGetAttachmentSlot(Number(slotId));
    });
  }

  pGetAttachmentSlot(slotId: number) {
    const slot = this._equipment[slotId];
    let shaderParams = slot?.SHADER_PARAMETER_GROUP ?? [];
    if (slotId == 3 && slot.SHADER_PARAMETER_GROUP?.length == 4) {
      shaderParams =
        this.hoodState == "Down"
          ? [slot.SHADER_PARAMETER_GROUP[0], slot.SHADER_PARAMETER_GROUP[1]]
          : [slot.SHADER_PARAMETER_GROUP[2], slot.SHADER_PARAMETER_GROUP[3]];
    }
    return slot
      ? {
          modelName: slot.modelName.replace(
            /Up|Down/g,
            this.hoodState == "Down" ? "Up" : "Down"
          ),
          textureAlias: slot.textureAlias || "",
          effectId: slot.effectId || 0,
          tintAlias: slot.tintAlias || "Default",
          decalAlias: slot.decalAlias || "#",
          slotId: slot.slotId,
          SHADER_PARAMETER_GROUP: shaderParams
        }
      : undefined;
  }

  pGetItemData(server: ZoneServer2016, item: BaseItem, containerDefId: number) {
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
      baseDurability: server.getItemBaseDurability(item.itemDefinitionId),
      currentDurability: item.currentDurability,
      maxDurabilityFromDefinition: server.getItemBaseDurability(
        item.itemDefinitionId
      ),
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
        attachmentData: this.pGetAttachmentSlots(),
        headActor: this.headActor,
        hairModel: this.hairModel,
        resources: { data: this.pGetResources() },
        remoteWeapons: { data: this.pGetRemoteWeaponsData(server) }
      },
      positionUpdate: {
        ...this.positionUpdate,
        sequenceTime: getCurrentServerTimeWrapper().getTruncatedU32(),
        position: this.state.position // trying to fix invisible characters/vehicles until they move
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

    const c = server.getClientByCharId(this.characterId);
    if (c && !c.firstLoading) {
      server.updateCharacterState(
        client,
        this.characterId,
        this.characterStates,
        false
      );

      //TODO: This is necessary to fix the audio on other clients. Have to figure out a better way of doing so but currently it works.
      setTimeout(() => {
        c.character.updateFootwearAudio(server);
      }, 7500);
    }

    if (this.onReadyCallback) {
      this.onReadyCallback(client);
      delete this.onReadyCallback;
    }
  }

  applySpecialWeaponEffect(
    server: ZoneServer2016,
    client: ZoneClient2016,
    weaponDefinitionId: WeaponDefinitionIds
  ) {
    switch (weaponDefinitionId) {
      case WeaponDefinitionIds.WEAPON_BLAZE:
        server.applyCharacterEffect(
          this,
          Effects.PFX_Fire_Person_loop,
          500,
          10000
        );
        break;
      case WeaponDefinitionIds.WEAPON_FROSTBITE:
        const effectTime = 5000;
        if (!this._characterEffects[Effects.PFX_Seasonal_Holiday_Snow_skel]) {
          server.sendData<ClientUpdateModifyMovementSpeed>(
            client,
            "ClientUpdate.ModifyMovementSpeed",
            {
              speed: 0.5
            }
          );
          setTimeout(() => {
            server.sendData<ClientUpdateModifyMovementSpeed>(
              client,
              "ClientUpdate.ModifyMovementSpeed",
              {
                speed: 2
              }
            );
          }, effectTime);
        }
        server.applyCharacterEffect(
          this,
          Effects.PFX_Seasonal_Holiday_Snow_skel,
          0,
          effectTime
        );
        break;
    }
  }

  OnProjectileHit(server: ZoneServer2016, damageInfo: DamageInfo) {
    if (!this.isAlive || server.isPvE) return;

    if (server.isHeadshotOnly) {
      switch (damageInfo.hitReport?.hitLocation) {
        case "HEAD":
        case "GLASSES":
        case "NECK":
          break;
        default:
          return;
      }
    }

    const itemDefinition = server.getItemDefinition(damageInfo.weapon);
    if (!itemDefinition) return;
    const weaponDefinitionId = itemDefinition.PARAM1;

    const sourceClient = server.getClientByCharId(damageInfo.entity), // source
      targetClient = server.getClientByCharId(this.characterId); // target
    if (!sourceClient || !targetClient || !damageInfo.hitReport) {
      return;
    }

    server.fairPlayManager.hitMissFairPlayCheck(
      server,
      sourceClient,
      true,
      damageInfo.hitReport?.hitLocation || ""
    );

    const hasHelmetBefore = this.hasHelmet(server);
    const hasArmorBefore = this.hasArmor(server);

    let damage = damageInfo.damage,
      canStopBleed,
      weaponDmgModifier,
      headshotDmgMultiplier;

    // these should be configurable
    const weaponDmgModifierDefault = 4,
      weaponDmgModifierShotgun = 10,
      weaponDmgModifierSniper = 1,
      headshotDmgMultiplierDefault = 4,
      headshotDmgMultiplierShotgun = 2,
      headshotDmgMultiplierSniper = 6;

    switch (weaponDefinitionId) {
      case WeaponDefinitionIds.WEAPON_SHOTGUN:
        weaponDmgModifier = weaponDmgModifierShotgun;
        headshotDmgMultiplier = headshotDmgMultiplierShotgun;
        break;
      case WeaponDefinitionIds.WEAPON_308:
        weaponDmgModifier = weaponDmgModifierSniper;
        headshotDmgMultiplier = headshotDmgMultiplierSniper;
        break;
      default:
        weaponDmgModifier = weaponDmgModifierDefault;
        headshotDmgMultiplier = headshotDmgMultiplierDefault;
        break;
    }

    switch (damageInfo.hitReport?.hitLocation) {
      case "HEAD":
      case "GLASSES":
      case "NECK":
        damage = damage *= headshotDmgMultiplier;
        damage = server.applyHelmetDamageReduction(this, damage, 1);
        break;
      default:
        damage = server.applyArmorDamageReduction(
          this,
          damage,
          weaponDmgModifier
        );
        canStopBleed = true;
        break;
    }

    if (this.isAlive) {
      server.sendHitmarker(
        sourceClient,
        damageInfo.hitReport?.hitLocation,
        this.hasHelmet(server),
        this.hasArmor(server),
        hasHelmetBefore,
        hasArmorBefore
      );
    }

    this.applySpecialWeaponEffect(server, targetClient, weaponDefinitionId);

    this.damage(server, {
      ...damageInfo,
      damage: damage,
      causeBleed: !(canStopBleed && this.hasArmor(server))
    });
  }

  OnMeleeHit(server: ZoneServer2016, damageInfo: DamageInfo) {
    if ((server.isPvE && !server._npcs[damageInfo.entity]) || this.isRespawning)
      return;
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
        damage = server.applyHelmetDamageReduction(this, damage, 1);
        break;
      default:
        damage = server.applyArmorDamageReduction(this, damage, 4);
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

  OnExplosiveHit(server: ZoneServer2016, sourceEntity: BaseEntity) {
    let damage = 10000;
    switch (true) {
      case sourceEntity instanceof ExplosiveEntity:
        damage = 50000;
        break;
      case sourceEntity instanceof ProjectileEntity:
        damage = sourceEntity.actorModelId == 0 ? 8000 : 10000;
        break;
      default:
        damage = 10000;
        break;
    }

    const distance = getDistance(
      sourceEntity.state.position,
      this.state.position
    );
    if (distance > 1) damage /= distance;
    this.damage(server, {
      entity: sourceEntity.characterId,
      damage: damage
    });
  }
}
