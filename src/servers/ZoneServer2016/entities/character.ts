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
  Items,
  LoadoutIds,
  LoadoutSlots,
  ResourceIds,
  ResourceTypes,
} from "../models/enums";
import { ZoneClient2016 } from "../classes/zoneclient";
import { ZoneServer2016 } from "../zoneserver";
import { BaseFullCharacter } from "./basefullcharacter";
import {
  characterEffect,
  DamageInfo,
  DamageRecord,
  positionUpdate,
} from "../../../types/zoneserver";
import {
  calculateOrientation,
  isFloat,
  isPosInRadius,
  randomIntFromInterval,
  _,
} from "../../../utils/utils";
import { BaseItem } from "../classes/baseItem";
import { BaseLootableEntity } from "./baselootableentity";
import { LoadoutContainer } from "../classes/loadoutcontainer";
import { characterDefaultLoadout } from "../data/loadouts";
import { EquipmentSetCharacterEquipmentSlot } from "types/zone2016packets";
import { Vehicle2016 } from "../entities/vehicle";
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
  temporaryScrapTimeout: NodeJS.Timeout | undefined;
  temporaryScrapSoundTimeout: NodeJS.Timeout | undefined;
  static isAlive = true;
  public set isAlive(state) {
    this.characterStates.knockedOut = !state;
  }
  public get isAlive() {
    return !this.characterStates.knockedOut;
  }
  isSonic = false;
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
  healingInterval?: any;
  healingTicks: number;
  healingMaxTicks: number;
  starthealingInterval: any;
  timeouts: any;
  hasConveys: boolean = false;
  positionUpdate?: positionUpdate;
  tempGodMode = false;
  isSpectator = false;
  initialized = false; // if sendself has been sent
  spawnGridData: number[] = [];
  lastJumpTime: number = 0;
  weaponStance: number = 1;
  stance: number = 0;
  readonly metrics: CharacterMetrics = {
    recipesDiscovered: 0,
    zombiesKilled: 0,
    wildlifeKilled: 0,
    startedSurvivingTP: Date.now(),
  };
  private combatlog: DamageRecord[] = [];
  // characterId of vehicle spawned by /hax drive or spawnvehicle
  ownedVehicle?: string;
  currentInteractionGuid?: string;
  lastInteractionTime = 0;
  mountedContainer?: BaseLootableEntity;
  defaultLoadout = characterDefaultLoadout;
  mutedCharacters: Array<string> = [];
  groupId: number = 0;
  _characterEffects: {
    [effectId: number]: characterEffect;
  } = {};
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
    this.healingTicks = 0;
    this.healingMaxTicks = 0;
    (this._resources = {
      [ResourceIds.HEALTH]: 10000,
      [ResourceIds.STAMINA]: 600,
      [ResourceIds.HUNGER]: 10000,
      [ResourceIds.HYDRATION]: 10000,
      [ResourceIds.VIRUS]: 0,
      [ResourceIds.COMFORT]: 5000,
      [ResourceIds.BLEEDING]: -40,
    }),
      (this.characterStates = {
        knockedOut: false,
        inWater: false,
        invincibility: false,
      });
    this.timeouts = {};
    this.starthealingInterval = (
      client: ZoneClient2016,
      server: ZoneServer2016
    ) => {
      client.character.healingInterval = setTimeout(() => {
        if (!server._clients[client.sessionId]) {
          return;
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
          client.character.healingTicks++ < client.character.healingMaxTicks
        ) {
          client.character.healingInterval.refresh();
        } else {
          client.character.healingMaxTicks = 0;
          client.character.healingTicks = 0;
          delete client.character.healingInterval;
        }
      }, 1000);
    };
  }

  startResourceUpdater(client: ZoneClient2016, server: ZoneServer2016) {
    client.character.resourcesUpdater = setTimeout(
      () => this.updateResources(client, server),
      3000
    );
  }

  updateResources(client: ZoneClient2016, server: ZoneServer2016) {
    let effectId;
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
      server.sendDataToAllWithSpawnedEntity(
        server._characters,
        this.characterId,
        "Command.PlayDialogEffect",
        {
          characterId: this.characterId,
          effectId: effectId,
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
      bleeding = this._resources[ResourceIds.BLEEDING];

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
    client.character._resources[ResourceIds.HYDRATION] -= 4;

    this.checkResource(server, ResourceIds.STAMINA);
    if (client.character._resources[ResourceIds.BLEEDING] > 0) {
      this.damage(server, {
        entity: "Character.Bleeding",
        damage:
          Math.ceil(client.character._resources[ResourceIds.BLEEDING] / 40) *
          100,
      });
    }
    this.checkResource(server, ResourceIds.BLEEDING);
    this.checkResource(server, ResourceIds.HUNGER, () => {
      this.damage(server, { entity: "Character.Hunger", damage: 100 });
    });
    this.checkResource(server, ResourceIds.HUNGER, () => {
      this.damage(server, { entity: "Character.Hunger", damage: 100 });
    });
    this.checkResource(server, ResourceIds.HYDRATION, () => {
      this.damage(server, { entity: "Character.Hydration", damage: 100 });
    });
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
      this._resources[resourceId] = minValue;
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
  /**
   * Gets the lightweightpc packetfields for use in sendself and addlightweightpc
   */
  pGetLightweight() {
    return {
      ...super.pGetLightweight(),
      rotation: this.state.lookAt,
      identity: {
        characterName: this.name,
      },
    };
  }

  pGetSendSelf(server: ZoneServer2016, guid = "", client: ZoneClient2016) {
    return {
      ...this.pGetLightweight(),
      guid: guid,
      hairModel: this.hairModel,
      isRespawning: this.isRespawning,
      gender: this.gender,
      creationDate: this.creationDate,
      lastLoginDate: this.lastLoginDate,
      identity: {
        characterName: this.name,
      },
      inventory: {
        items: this.pGetInventoryItems(server),
        //unknownDword1: 2355
      },
      recipes: server.pGetRecipes(), // todo: change to per-character recipe lists
      stats: this.getStats(),
      loadoutSlots: this.pGetLoadoutSlots(),
      equipmentSlots: this.pGetEquipment(),
      characterResources: this.pGetResources(),
      containers: this.pGetContainers(server),
      //unknownQword1: this.characterId,
      //unknownDword38: 1,
      //vehicleLoadoutRelatedQword: this.characterId,
      //unknownQword3: this.characterId,
      //vehicleLoadoutRelatedDword: 1,
      //unknownDword40: 1
      isAdmin: client.isAdmin,
    };
  }

  pGetRemoteWeaponData(server: ZoneServer2016, item: BaseItem) {
    const itemDefinition = server.getItemDefinition(item.itemDefinitionId),
      weaponDefinition = server.getWeaponDefinition(itemDefinition.PARAM1),
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
                  unknownDword2: firemode.FIRE_MODE_ID,
                };
              })
            : [], // probably firemodes
        };
      }),
    };
  }

  pGetRemoteWeaponExtraData(server: ZoneServer2016, item: BaseItem) {
    const itemDefinition = server.getItemDefinition(item.itemDefinitionId),
      weaponDefinition = server.getWeaponDefinition(itemDefinition.PARAM1),
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
          unknownBoolean2: false,
        };
      }),
    };
  }

  pGetRemoteWeaponsData(server: ZoneServer2016) {
    const remoteWeapons: any[] = [];
    Object.values(this._loadout).forEach((item) => {
      if (server.isWeapon(item.itemDefinitionId)) {
        remoteWeapons.push({
          guid: item.itemGuid,
          ...this.pGetRemoteWeaponData(server, item),
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
    containers.push({
      loadoutSlotId: mountedContainer.slotId,
      containerData: super.pGetContainerData(server, mountedContainer),
    });
    return containers;
  }

  pGetLoadoutSlots() {
    if (!this.mountedContainer) return super.pGetLoadoutSlots();

    // to avoid a mounted container being dismounted if loadout is updated while mounted

    const loadoutSlots = Object.values(this.getLoadoutSlots()).map(
      (slotId: any) => {
        return this.pGetLoadoutSlot(slotId);
      }
    );

    const mountedContainer = this.mountedContainer.getContainer();
    if (mountedContainer)
      loadoutSlots.push(
        this.mountedContainer.pGetLoadoutSlot(mountedContainer.slotId)
      );
    return {
      characterId: this.characterId,
      loadoutId: this.loadoutId, // needs to be 3
      loadoutData: {
        loadoutSlots: loadoutSlots,
      },
      currentSlotId: this.currentLoadoutSlot,
    };
  }

  resetMetrics() {
    this.metrics.zombiesKilled = 0;
    this.metrics.wildlifeKilled = 0;
    this.metrics.recipesDiscovered = 0;
    this.metrics.startedSurvivingTP = Date.now();
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
    server.sendData(client, "ClientUpdate.DamageInfo", {
      transientId: 0,
      orientationToSource: orientation,
      unknownDword2: 100,
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

    lootableEntity.mountedCharacter = this.characterId;
    this.mountedContainer = lootableEntity;

    server.initializeContainerList(client);

    server.addItem(client, container, 101);

    Object.values(container.items).forEach((item) => {
      server.addItem(client, item, container.containerDefinitionId);
    });

    this.updateLoadout(server);

    server.sendData(client, "AccessedCharacter.BeginCharacterAccess", {
      objectCharacterId:
        lootableEntity instanceof Vehicle2016
          ? lootableEntity.characterId
          : "0x0000000000000001",
      containerGuid: container.itemGuid,
      unknownBool1: false,
      itemsData: {
        items: [],
        unknownDword1: 92, // idk
      },
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

    server.deleteItem(client, container.itemGuid);
    Object.values(container.items).forEach((item) => {
      if (!this.mountedContainer) return;
      server.deleteItem(client, item.itemGuid);
    });

    if (this.mountedContainer.isLootbag && !_.size(container.items)) {
      server.deleteEntity(this.mountedContainer.characterId, server._lootbags);
    }

    delete this.mountedContainer.mountedCharacter;
    delete this.mountedContainer;
    this.updateLoadout(server);
    server.initializeContainerList(client);
  }

  getItemContainer(itemGuid: string): LoadoutContainer | undefined {
    // returns the container that an item is contained in
    let c;
    for (const container of Object.values(this._containers)) {
      if (container.items[itemGuid]) {
        c = container;
        break;
      }
    }
    // check mounted container
    if (!c && this.mountedContainer) {
      const container = this.mountedContainer.getContainer();
      if (container && container.items[itemGuid]) return container;
    }
    return c;
  }

  getContainerFromGuid(containerGuid: string): LoadoutContainer | undefined {
    let c;
    for (const container of Object.values(this._containers)) {
      if (container.itemGuid == containerGuid) {
        c = container;
      }
    }
    if (
      !c &&
      this.mountedContainer?.getContainer()?.itemGuid == containerGuid
    ) {
      c = this.mountedContainer.getContainer();
    }
    return c;
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
              modifier: stat.statData.statValue.value.modifier,
            },
          },
        },
      };
    });
  }

  updateEquipmentSlot(server: ZoneServer2016, slotId: number) {
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
      server.sendData(
        client,
        "Equipment.SetCharacterEquipmentSlot",
        this.pGetEquipmentSlotFull(
          slotId,
          groupId
        ) as EquipmentSetCharacterEquipmentSlot
      );
    });
  }

  pGetEquipmentSlotFull(slotId: number, groupId?: number) {
    const slot = this._equipment[slotId];
    return slot
      ? {
          characterData: {
            characterId: this.characterId,
          },
          equipmentSlot: this.pGetEquipmentSlot(slotId),
          attachmentData: this.pGetAttachmentSlot(slotId, groupId),
        }
      : undefined;
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
        characterId: this.characterId,
      },
      unknownDword1: 0,
      unknownString1: "Default",
      unknownString2: "#",
      equipmentSlots: this.pGetEquipmentSlots(),
      attachmentData: this.pGetAttachmentSlots(groupId),
      unknownBoolean1: true,
    };
  }

  pGetAttachmentSlots(groupId?: number) {
    return Object.keys(this._equipment).map((slotId: any) => {
      return this.pGetAttachmentSlot(slotId, groupId);
    });
  }

  pGetAttachmentSlot(slotId: number, groupId?: number) {
    const slot = this._equipment[slotId];
    return slot
      ? {
          modelName: slot.modelName,
          effectId: this.groupId > 0 && this.groupId == groupId ? 3 : 0,
          textureAlias: slot.textureAlias || "",
          tintAlias: slot.tintAlias || "Default",
          decalAlias: slot.decalAlias || "#",
          slotId: slot.slotId,
        }
      : undefined;
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
        remoteWeapons: { data: this.pGetRemoteWeaponsData(server) },
      },
      positionUpdate: {
        ...this.positionUpdate,
        sequenceTime: server.getGameTime(),
        position: this.state.position, // trying to fix invisible characters/vehicles until they move
        stance: 66561,
      },
      stats: this.getStats().map((stat: any) => {
        return stat.statData;
      }),
      remoteWeaponsExtra: this.pGetRemoteWeaponsExtraData(server),
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
          firemodeIndex: 0,
        }
      );
    });

    server.sendData(client, "Character.WeaponStance", {
      characterId: this.characterId,
      stance: this.weaponStance,
    });

    // GROUP OUTLINE WORKAROUND
    server.sendData(
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
    damageInfo.weapon == Items.WEAPON_SHOTGUN
      ? (armorDmgModifier = 10)
      : (armorDmgModifier = 4);
    if (damageInfo.weapon == Items.WEAPON_308) armorDmgModifier = 2;
    switch (damageInfo.hitReport?.hitLocation) {
      case "HEAD":
      case "GLASSES":
      case "NECK":
        damageInfo.weapon == Items.WEAPON_SHOTGUN
          ? (damage *= 2)
          : (damage *= 4);
        damageInfo.weapon == Items.WEAPON_308 ? (damage *= 2) : damage;
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
    switch (damageInfo.weapon) {
      case Items.WEAPON_BLAZE:
        this._characterEffects[1212] = {
          id: 1212,
          duration: Date.now() + 10000,
          callback: function (
            server: ZoneServer2016,
            character: Character2016
          ) {
            character.damage(server, {
              entity: "Character.CharacterEffect",
              damage: 500,
            });
            server.sendDataToAllWithSpawnedEntity(
              server._characters,
              character.characterId,
              "Command.PlayDialogEffect",
              {
                characterId: character.characterId,
                effectId: 1212,
              }
            );
          },
        };
        server.sendDataToAllWithSpawnedEntity(
          server._characters,
          this.characterId,
          "Command.PlayDialogEffect",
          {
            characterId: this.characterId,
            effectId: 1212,
          }
        );
        break;
      case Items.WEAPON_FROSTBITE:
        if (!this._characterEffects[5211]) {
          server.sendData(c, "ClientUpdate.ModifyMovementSpeed", {
            speed: 0.5,
          });
        }
        this._characterEffects[5211] = {
          id: 5211,
          duration: Date.now() + 5000,
          endCallback: function (
            server: ZoneServer2016,
            character: Character2016
          ) {
            server.sendData(c, "ClientUpdate.ModifyMovementSpeed", {
              speed: 2,
            });
          },
        };
        server.sendDataToAllWithSpawnedEntity(
          server._characters,
          this.characterId,
          "Command.PlayDialogEffect",
          {
            characterId: this.characterId,
            effectId: 5211,
          }
        );
        break;
    }
    /* eslint-enable @typescript-eslint/no-unused-vars */
    this.damage(server, {
      ...damageInfo,
      damage: damage,
      causeBleed: !(canStopBleed && this.hasArmor(server)),
    });
  }
}
