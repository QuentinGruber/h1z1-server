// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2024 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

import { Collection } from "mongodb";
import {
  FairPlayValues,
  StanceFlags,
  FireHint,
  HitReport
} from "types/zoneserver";
import {
  CONNECTION_REJECTION_FLAGS,
  DB_COLLECTIONS
} from "../../../utils/enums";
import {
  decrypt,
  getCurrentServerTimeWrapper,
  getDistance,
  getDistance1d,
  getDistance2d,
  isPointNearLine,
  isPosInRadius,
  isPosInRadiusWithY,
  logClientActionToMongo,
  movePoint
} from "../../../utils/utils";
import { LoadoutItem } from "../classes/loadoutItem";
import { ZoneClient2016 as Client } from "../classes/zoneclient";
import { BaseEntity } from "../entities/baseentity";
import { Vehicle2016 as Vehicle } from "../entities/vehicle";
import {
  ConstructionPermissionIds,
  WeaponDefinitionIds
} from "../models/enums";
import { ZoneServer2016 } from "../zoneserver";
import { FileHash } from "types/shared";

const encryptedData = require("../../../../data/2016/encryptedData/encryptedData.json"),
  fairPlayData = require("../../../../data/2016/encryptedData/fairPlayData.json"),
  defaultHashes: Array<FileHash> = require("../../../../data/2016/dataSources/AllowedFileHashes.json");

export class FairPlayManager {
  _decryptKey: string = "";
  _fairPlayDecryptKey: string = "";
  _suspiciousList: string[] = [];
  fairPlayValues?: FairPlayValues;
  defaultHashes = defaultHashes;

  /** MANAGED BY CONFIGMANAGER - See defaultConfig.yaml for more information */
  useFairPlay!: boolean;
  maxPing!: number;
  acceptedRejectionTypes!: Array<CONNECTION_REJECTION_FLAGS>;
  useAssetValidation!: boolean;
  hashSubmissionTimeout!: number;
  allowedPacks!: Array<FileHash>;
  requiredPacks!: Array<FileHash>;

  decryptFairPlayValues() {
    if (this._decryptKey) {
      this._suspiciousList = encryptedData.map(
        (x: { iv: string; encryptedData: string }) =>
          decrypt(x, this._decryptKey)
      );
    }
    if (this._fairPlayDecryptKey && this.useFairPlay) {
      const decryptedData = fairPlayData.map(
        (x: { iv: string; encryptedData: string }) =>
          decrypt(x, this._fairPlayDecryptKey)
      );
      this.fairPlayValues = {
        defaultMaxProjectileSpeed: Number(decryptedData[0]),
        defaultMinProjectileSpeed: Number(decryptedData[1]),
        defaultMaxDistance: Number(decryptedData[2]),
        WEAPON_308: {
          maxSpeed: Number(decryptedData[3]),
          minSpeed: Number(decryptedData[4]),
          maxDistance: Number(decryptedData[5])
        },
        WEAPON_CROSSBOW: {
          maxSpeed: Number(decryptedData[6]),
          minSpeed: Number(decryptedData[7]),
          maxDistance: Number(decryptedData[8])
        },
        WEAPON_BOW_MAKESHIFT: {
          maxSpeed: Number(decryptedData[9]),
          minSpeed: Number(decryptedData[10]),
          maxDistance: Number(decryptedData[11])
        },
        WEAPON_BOW_RECURVE: {
          maxSpeed: Number(decryptedData[12]),
          minSpeed: Number(decryptedData[13]),
          maxDistance: Number(decryptedData[14])
        },
        WEAPON_BOW_WOOD: {
          maxSpeed: Number(decryptedData[15]),
          minSpeed: Number(decryptedData[16]),
          maxDistance: Number(decryptedData[17])
        },
        WEAPON_SHOTGUN: {
          maxSpeed: Number(decryptedData[18]),
          minSpeed: Number(decryptedData[19]),
          maxDistance: Number(decryptedData[20])
        },
        lastLoginDateAddVal: Number(decryptedData[21]),
        maxTimeDrift: Number(decryptedData[22]),
        maxSpeed: Number(decryptedData[23]),
        maxVerticalSpeed: Number(decryptedData[24]),
        speedWarnsNumber: Number(decryptedData[25]),
        maxTpDist: Number(decryptedData[26]),
        dotProductMin: Number(decryptedData[27]),
        dotProductMinShotgun: Number(decryptedData[28]),
        dotProductBlockValue: Number(decryptedData[29]),
        requiredFile: decryptedData[30],
        requiredString: decryptedData[31],
        requiredFile2: decryptedData[32],
        respawnCheckRange: Number(decryptedData[33]),
        respawnCheckTime: Number(decryptedData[34]),
        respawnCheckIterations: Number(decryptedData[35]),
        maxFlying: Number(decryptedData[36]),
        maxPositionDesync: Number(decryptedData[37]),
        maxFlaggedShots: Number(decryptedData[38])
      };
    }
  }

  async checkPlayerSpeed(
    server: ZoneServer2016,
    client: Client,
    sequenceTime: number,
    position: Float32Array
  ): Promise<boolean> {
    if (client.isAdmin || !this.fairPlayValues || !client.isSynced)
      return false;
    if (!server.isSaving) {
      if (
        client.isInAir &&
        position[1] - client.startLoc > this.fairPlayValues.maxFlying
      ) {
        let kick = true;
        for (const a in server._constructionFoundations) {
          if (
            server._constructionFoundations[a].getHasPermission(
              server,
              client.character.characterId,
              ConstructionPermissionIds.VISIT
            ) &&
            server._constructionFoundations[a].isInside(
              client.character.state.position
            )
          )
            kick = false;
        }
        for (const char in server._characters) {
          if (
            server._characters[char].characterId == client.character.characterId
          )
            continue;
          if (
            isPosInRadiusWithY(
              3,
              client.character.state.position,
              server._characters[char].state.position,
              4.5
            )
          )
            kick = false;
        }
        if (kick) {
          server.kickPlayer(client);
          server.sendAlertToAll(`FairPlay: kicking ${client.character.name}`);
          server.sendChatTextToAdmins(
            `FairPlay: ${
              client.character.name
            } has been kicked for possible flying by ${(
              position[1] - client.startLoc
            ).toFixed(2)} at [${position[0]} ${position[1]} ${position[2]}]`,
            false
          );
          return true;
        }
      }
      const distance = getDistance2d(client.oldPos.position, position);
      if (
        Number(client.character.lastLoginDate) +
          this.fairPlayValues.lastLoginDateAddVal <
        new Date().getTime()
      ) {
        const drift = Math.abs(
          sequenceTime - getCurrentServerTimeWrapper().getTruncatedU32()
        );
        if (drift > this.fairPlayValues.maxTimeDrift) {
          server.kickPlayer(client);
          server.sendAlertToAll(`FairPlay: kicking ${client.character.name}`);
          server.sendChatTextToAdmins(
            `FairPlay: ${client.character.name} has been kicked for sequence time drifting by ${drift}`,
            false
          );
          return true;
        }
        if (!client.isLoading && client.enableChecks) {
          if (distance > this.fairPlayValues.maxTpDist) {
            /*this.sendData(client, "ClientUpdate.UpdateLocation", {
              position: new Float32Array([...client.oldPos.position, 0]),
              triggerLoadingScreen: true,
              unknownByte1: 1,
            });
            client.isMovementBlocked = true;*/
            server.kickPlayer(client);
            server.sendChatTextToAdmins(
              `FairPlay: Kicking ${client.character.name} for suspected teleport by ${distance} from [${client.oldPos.position[0]} ${client.oldPos.position[1]} ${client.oldPos.position[2]}] to [${position[0]} ${position[1]} ${position[2]}]`,
              false
            );
            return true;
          }
        }
      }

      const speed =
        (distance / 1000 / (sequenceTime - client.oldPos.time)) * 3600000;
      const verticalSpeed =
        (getDistance1d(client.oldPos.position[1], position[1]) /
          1000 /
          (sequenceTime - client.oldPos.time)) *
        3600000;
      if (
        speed > this.fairPlayValues.maxSpeed &&
        verticalSpeed < this.fairPlayValues.maxVerticalSpeed
      ) {
        const avgPing = await server._gatewayServer.getSoeClientAvgPing(
          client.soeClientId
        );
        if (avgPing) {
          if (avgPing >= 250) return false;
        }
        client.speedWarnsNumber += 1;
      } else if (client.speedWarnsNumber > 0) {
        client.speedWarnsNumber -= 1;
      }
      if (client.speedWarnsNumber > this.fairPlayValues.speedWarnsNumber) {
        server.kickPlayer(client);
        client.speedWarnsNumber = 0;
        if (!server._soloMode) {
          logClientActionToMongo(
            server._db?.collection(DB_COLLECTIONS.FAIRPLAY) as Collection,
            client,
            server._worldId,
            { type: "SpeedHack" }
          );
        }
        server.sendAlertToAll(`FairPlay: kicking ${client.character.name}`);
        server.sendChatTextToAdmins(
          `FairPlay: ${client.character.name} has been kicking for speed hacking: ${speed} m/s at position [${position[0]} ${position[1]} ${position[2]}]`,
          false
        );
        return true;
      }
    }
    client.oldPos = { position: position, time: sequenceTime };
    return false;
  }

  async checkVehicleSpeed(
    server: ZoneServer2016,
    client: Client,
    sequenceTime: number,
    position: Float32Array,
    vehicle: Vehicle
  ): Promise<boolean> {
    if (client.isAdmin || !this.useFairPlay) return false;
    if (!server.isSaving) {
      const drift = Math.abs(
        sequenceTime - getCurrentServerTimeWrapper().getTruncatedU32()
      );
      if (drift > 10000) {
        server.kickPlayer(client);
        server.sendAlertToAll(`FairPlay: kicking ${client.character.name}`);
        server.sendChatTextToAdmins(
          `FairPlay: ${client.character.name} has been kicked for sequence time drifting in vehicle by ${drift}`,
          false
        );
        return true;
      }
      const distance = getDistance2d(vehicle.oldPos.position, position);
      const speed =
        (distance / 1000 / (sequenceTime - vehicle.oldPos.time)) * 3600000;
      const verticalSpeed =
        (getDistance1d(vehicle.oldPos.position[1], position[1]) /
          1000 /
          (sequenceTime - vehicle.oldPos.time)) *
        3600000;

      if (speed > 130 && verticalSpeed < 20) {
        const avgPing = await server._gatewayServer.getSoeClientAvgPing(
          client.soeClientId
        );
        if (avgPing) {
          if (avgPing >= 250) return false;
        }
        client.speedWarnsNumber += 1;
      } else if (client.speedWarnsNumber > 0) {
        client.speedWarnsNumber -= 1;
      }
      if (client.speedWarnsNumber > 5) {
        server.kickPlayer(client);
        client.speedWarnsNumber = 0;
        if (!server._soloMode) {
          logClientActionToMongo(
            server._db?.collection(DB_COLLECTIONS.FAIRPLAY) as Collection,
            client,
            server._worldId,
            { type: "SpeedHack" }
          );
        }
        server.sendAlertToAll(`FairPlay: kicking ${client.character.name}`);
        server.sendChatTextToAdmins(
          `FairPlay: ${client.character.name} has been kicking for vehicle speed hacking: ${speed} m/s at position [${position[0]} ${position[1]} ${position[2]}]`,
          false
        );
        return true;
      }
    }
    return false;
  }

  hitMissFairPlayCheck(
    server: ZoneServer2016,
    client: Client,
    hit: boolean,
    hitLocation: string
  ) {
    const weaponItem = client.character.getEquippedWeapon();
    if (!weaponItem) return;
    const itemDefinition = server.getItemDefinition(
      weaponItem.itemDefinitionId
    );
    if (!itemDefinition) return;
    const weaponDefinitionId = itemDefinition.PARAM1;
    if (
      !this.useFairPlay ||
      !weaponItem ||
      weaponDefinitionId == WeaponDefinitionIds.WEAPON_SHOTGUN
    ) {
      return;
    }
    if (hit) {
      client.pvpStats.shotsHit += 1;
      switch (hitLocation.toLowerCase()) {
        case "head":
        case "glasses":
        case "neck":
          client.pvpStats.head += 1;
          break;
        case "spineupper":
        case "spinelower":
        case "spinemiddle":
          client.pvpStats.spine += 1;
          break;
        case "l_hip":
        case "r_hip":
        case "l_knee":
        case "r_knee":
        case "l_ankle":
        case "r_ankle":
          client.pvpStats.legs += 1;
          break;
        case "l_elbow":
        case "r_elbow":
        case "r_shoulder":
        case "l_shoulder":
        case "r_wrist":
        case "l_wrist":
          client.pvpStats.hands += 1;
          break;
        default:
          break;
      }
      const hitRatio =
        (100 * client.pvpStats.shotsHit) / client.pvpStats.shotsFired;
      if (client.pvpStats.shotsFired > 10 && hitRatio > 80) {
        if (!server._soloMode) {
          logClientActionToMongo(
            server._db?.collection(DB_COLLECTIONS.FAIRPLAY) as Collection,
            client,
            server._worldId,
            {
              type: "exceeds hit/miss ratio",
              hitRatio,
              totalShotsFired: client.pvpStats.shotsFired
            }
          );
        }
        server.sendChatTextToAdmins(
          `FairPlay: ${
            client.character.name
          } exceeds hit/miss ratio (${hitRatio.toFixed(4)}% of ${
            client.pvpStats.shotsFired
          } shots fired)`,
          false
        );
      }
    } else {
      client.pvpStats.shotsFired += 1;
    }
  }

  validateProjectileHit(
    server: ZoneServer2016,
    client: Client,
    entity: BaseEntity,
    fireHint: FireHint,
    weaponItem: LoadoutItem,
    hitReport: HitReport,
    gameTime: number
  ): boolean {
    if (!this.fairPlayValues) return true;
    const message = `[${Date.now()}] FairPlay: Blocked incoming projectile from ${
        client.character.name
      }`,
      targetClient = server.getClientByCharId(entity.characterId);

    if (targetClient) fireHint.hitNumber++;
    const checkWeapons = [
      WeaponDefinitionIds.WEAPON_BOW_MAKESHIFT,
      WeaponDefinitionIds.WEAPON_BOW_RECURVE,
      WeaponDefinitionIds.WEAPON_BOW_WOOD,
      WeaponDefinitionIds.WEAPON_CROSSBOW
    ];
    if (!weaponItem) return false;
    const itemDefinition = server.getItemDefinition(
      weaponItem.itemDefinitionId
    );
    if (!itemDefinition) return false;
    const weaponDefinitionId = itemDefinition.PARAM1;
    if (checkWeapons.includes(weaponDefinitionId)) {
      if (
        !fireHint.marked ||
        fireHint.marked.characterId != entity.characterId ||
        getDistance(fireHint.marked.position, hitReport.position) > 0.1 ||
        Math.abs(gameTime - fireHint.marked.gameTime) > 5
      ) {
        if (targetClient) {
          server.sendChatTextToAdmins(
            `FairPlay: ${client.character.name} is hitting invalid projectiles on player ${targetClient.character.name}`,
            false
          );
          server.sendConsoleText(targetClient, message);
        }
        return false;
      }
    }
    /*const angle = getAngle(fireHint.position, packet.hitReport.position);
      const fixedRot = (fireHint.rotation + 2 * Math.PI) % (2 * Math.PI);
      const dotProduct =
        Math.cos(angle) * Math.cos(fixedRot) +
        Math.sin(angle) * Math.sin(fixedRot);
      if (
        dotProduct <
        (weaponDefinitionId == WeaponDefinitionIds.WEAPON_SHOTGUN
          ? this.fairPlayValues.dotProductMinShotgun
          : this.fairPlayValues.dotProductMin)
      ) {
        if (dotProduct < this.fairPlayValues.dotProductBlockValue) {
          if (c) {
            this.sendConsoleText(c, message);
          }
          this.sendChatTextToAdmins(
            `FairPlay: ${
              client.character.name
            } projectile was blocked due to invalid rotation: ${Number(
              ((1 - dotProduct) * 100).toFixed(2)
            )} / ${
              Number(
                (1 - this.fairPlayValues.dotProductBlockValue).toFixed(3)
              ) * 100
            }% max deviation`,
            false
          );
          return;
        }

        this.sendChatTextToAdmins(
          `FairPlay: ${
            client.character.name
          } projectile is hitting with possible invalid rotation: ${Number(
            ((1 - dotProduct) * 100).toFixed(2)
          )} / ${
            Number(
              (
                1 -
                (weaponDefinitionId == WeaponDefinitionIds.WEAPON_SHOTGUN
                  ? this.fairPlayValues.dotProductMinShotgun
                  : this.fairPlayValues.dotProductMin)
              ).toFixed(3)
            ) * 100
          }% max deviation`,
          false
        );
      }*/

    if (targetClient) {
      /*if (!targetClient.vehicle.mountedVehicle) {
        if (
          getDistance(
            targetClient.character.state.position,
            hitReport.position
          ) > this.fairPlayValues.maxPositionDesync
        ) {
          server.sendChatTextToAdmins(
            `FairPlay: ${targetClient.character.name} shot has been blocked due to position desync`,
            false
          );
          server.sendConsoleText(targetClient, message);
          return false;
        }
      }*/
      const distance = getDistance(fireHint.position, hitReport.position);
      const speed =
        (distance / 1000 / (gameTime - fireHint.timeStamp)) * 3600000;
      let maxSpeed = this.fairPlayValues.defaultMaxProjectileSpeed;
      let minSpeed = this.fairPlayValues.defaultMinProjectileSpeed;
      let maxDistance = this.fairPlayValues.defaultMaxDistance;
      switch (weaponDefinitionId) {
        case WeaponDefinitionIds.WEAPON_308:
        case WeaponDefinitionIds.WEAPON_REAPER:
          maxSpeed = this.fairPlayValues.WEAPON_308.maxSpeed;
          minSpeed = this.fairPlayValues.WEAPON_308.minSpeed;
          maxDistance = this.fairPlayValues.WEAPON_308.maxDistance;
          break;
        case WeaponDefinitionIds.WEAPON_CROSSBOW:
          maxSpeed = this.fairPlayValues.WEAPON_CROSSBOW.maxSpeed;
          minSpeed = this.fairPlayValues.WEAPON_CROSSBOW.minSpeed;
          maxDistance = this.fairPlayValues.WEAPON_CROSSBOW.maxDistance;
          break;
        case WeaponDefinitionIds.WEAPON_BOW_MAKESHIFT:
          maxSpeed = this.fairPlayValues.WEAPON_BOW_MAKESHIFT.maxSpeed;
          minSpeed = this.fairPlayValues.WEAPON_BOW_MAKESHIFT.minSpeed;
          maxDistance = this.fairPlayValues.WEAPON_BOW_MAKESHIFT.maxDistance;
          break;
        case WeaponDefinitionIds.WEAPON_BOW_RECURVE:
          maxSpeed = this.fairPlayValues.WEAPON_BOW_RECURVE.maxSpeed;
          minSpeed = this.fairPlayValues.WEAPON_BOW_RECURVE.minSpeed;
          maxDistance = this.fairPlayValues.WEAPON_BOW_RECURVE.maxDistance;
          break;
        case WeaponDefinitionIds.WEAPON_BOW_WOOD:
          maxSpeed = this.fairPlayValues.WEAPON_BOW_WOOD.maxSpeed;
          minSpeed = this.fairPlayValues.WEAPON_BOW_WOOD.minSpeed;
          maxDistance = this.fairPlayValues.WEAPON_BOW_WOOD.maxDistance;
          break;
        case WeaponDefinitionIds.WEAPON_SHOTGUN:
        case WeaponDefinitionIds.WEAPON_NAGAFENS_RAGE:
          maxSpeed = this.fairPlayValues.WEAPON_SHOTGUN.maxSpeed;
          minSpeed = this.fairPlayValues.WEAPON_SHOTGUN.minSpeed;
          maxDistance = this.fairPlayValues.WEAPON_SHOTGUN.maxDistance;
      }
      let block = false;
      if (distance > maxDistance && speed < minSpeed) block = true;
      if (
        distance > maxDistance &&
        (speed > maxSpeed ||
          speed < minSpeed ||
          speed <= 0 ||
          speed == Infinity)
      )
        block = true;
      if (block) {
        server.sendChatTextToAdmins(
          `FairPlay: prevented ${
            client.character.name
          }'s projectile from hitting ${
            targetClient.character.name
          } | speed: (${speed.toFixed(
            0
          )} / ${minSpeed}:${maxSpeed}) | ${distance.toFixed(2)}m | ${
            server.getItemDefinition(weaponItem.itemDefinitionId)?.NAME
          } | ${hitReport.hitLocation}`,
          false
        );
        server.sendConsoleText(targetClient, message);
        return false;
      }
    }
    return true;
  }

  checkAimVector(server: ZoneServer2016, client: Client, orientation: number) {
    if (client.character.weaponStance != 2) return;
    for (const a in server._characters) {
      const char = server._characters[a];
      if (client.character.name == char.name) continue;
      const fixedOrientation =
        orientation < 0
          ? orientation * (180.0 / Math.PI) + 360
          : orientation * (180.0 / Math.PI);
      const fixedPosUpdOrientation =
        char.positionUpdate?.orientation < 0
          ? char.positionUpdate?.orientation * (180.0 / Math.PI) + 360
          : char.positionUpdate?.orientation * (180.0 / Math.PI);
      const distance = getDistance(
        char.state.position,
        client.character.state.position
      );
      if (
        !isPosInRadius(
          char.npcRenderDistance,
          client.character.state.position,
          char.state.position
        ) ||
        distance <= 4
      )
        continue;
      if (
        Math.abs(fixedOrientation - fixedPosUpdOrientation) < 15 ||
        Math.abs(fixedOrientation - fixedPosUpdOrientation) > 345 ||
        (Math.abs(fixedOrientation - fixedPosUpdOrientation) > 165 &&
          Math.abs(fixedOrientation - fixedPosUpdOrientation) < 195)
      ) {
        continue;
      }

      const fixedCharPos = movePoint(
        char.state.position,
        char.positionUpdate?.orientation * -1 + 1.570795,
        -1
      );

      const startpoint = movePoint(
        client.character.state.position,
        orientation * -1 + 1.570795,
        1
      );
      const nextpoint = movePoint(
        client.character.state.position,
        orientation * -1 + 1.570795,
        200
      );
      if (
        isPointNearLine(
          new Float32Array([fixedCharPos[0], fixedCharPos[2]]),
          new Float32Array([startpoint[0], startpoint[2]]),
          new Float32Array([nextpoint[0], nextpoint[2]]),
          0.3
        )
      ) {
        client.character.aimVectorWarns += 1;
        if (client.character.aimVectorWarns >= 3) {
          server.sendChatTextToAdmins(
            `[FairPlay] ${client.character.name} possible aimlock [warns: ${client.character.aimVectorWarns}, distance: ${distance}`
          );
        }
      } else {
        client.character.aimVectorWarns = 0;
      }
    }
  }

  detectJumpXSMovement(
    server: ZoneServer2016,
    client: Client,
    stanceFlags: StanceFlags
  ) {
    if (stanceFlags.SITTING && stanceFlags.JUMPING) {
      const pos = client.character.state.position;
      if (!server._soloMode) {
        logClientActionToMongo(
          server._db?.collection(DB_COLLECTIONS.FAIRPLAY) as Collection,
          client,
          server._worldId,
          { type: "XS glitching", pos }
        );
      }
      server.sendChatTextToAdmins(
        `FairPlay: Possible XS glitching detected by ${client.character.name} at position [${pos[0]} ${pos[1]} ${pos[2]}]`
      );
      server.sendData(client, "ClientUpdate.UpdateLocation", {
        position: pos,
        triggerLoadingScreen: true
      });
    }
  }
  detectDroneMovement(
    server: ZoneServer2016,
    client: Client,
    stanceFlags: StanceFlags
  ) {
    if (stanceFlags.SITTING) {
      if (Date.now() - client.character.lastSitTime <= 200) {
        client.character.sitCount++;
      } else {
        client.character.sitCount = 0;
        client.character.lastSitTime = 0;
      }
      client.character.lastSitTime = Date.now();
      if (client.character.sitCount >= 10) {
        const pos = client.character.state.position;
        if (!server._soloMode) {
          logClientActionToMongo(
            server._db?.collection(DB_COLLECTIONS.FAIRPLAY) as Collection,
            client,
            server._worldId,
            { type: "Drone exploit", pos }
          );
        }
        server.sendChatTextToAdmins(
          `FairPlay: Possible drone exploit detected by ${client.character.name} at position [${pos[0]} ${pos[1]} ${pos[2]}]`
        );
        server.sendData(client, "ClientUpdate.UpdateLocation", {
          position: pos,
          triggerLoadingScreen: true
        });
        client.character.sitCount = 0;
      }
    }
  }

  handleAssetValidationInit(server: ZoneServer2016, client: Client) {
    if (!this.useAssetValidation || server._soloMode || client.isAdmin) return;

    server.sendData(client, "H1emu.RequestAssetHashes", {});
    server.sendData(client, "UpdateWeatherData", server.weatherManager.weather);
    server.sendConsoleText(client, "[SERVER] Requested asset hashes");

    client.assetIntegrityKickTimer = setTimeout(() => {
      if (!client) return;
      server.kickPlayerWithReason(client, "Missing asset integrity check.");
    }, this.hashSubmissionTimeout);
  }

  validateFile(file1: FileHash, file2: FileHash) {
    if (file1.file_name != file2.file_name) {
      return false;
    }
    return (
      file1.crc32_hash == file2.crc32_hash ||
      file1.old_crc32_hash == file2.crc32_hash ||
      file2.old_crc32_hash == file1.crc32_hash
    );
  }

  handleAssetCheck(server: ZoneServer2016, client: Client, data: string) {
    if (!this.useAssetValidation || server._soloMode) return;
    const receivedHashes: Array<FileHash> = JSON.parse(data);

    if (!receivedHashes || !Array.isArray(receivedHashes)) {
      console.log(
        `${client.loginSessionId} failed asset integrity check due to invalid JSON data.`
      );
      server.kickPlayerWithReason(
        client,
        "Failed asset integrity check - Invalid JSON Received"
      );
      return;
    }

    const hashes = this.defaultHashes,
      validatedHashes: Array<FileHash> = [];

    // check if all default / required packs are found in game files
    for (const serverValue of hashes) {
      if (!serverValue) continue;
      let received: FileHash | undefined;
      if (
        receivedHashes.find((clientValue) => {
          received = clientValue;
          return this.validateFile(serverValue, clientValue);
        })
      ) {
        validatedHashes.push(serverValue);
        continue;
      }
      console.log(
        `${client.loginSessionId} (${client.character.name}) failed asset integrity check due to missing or invalid file ${serverValue.file_name} received: ${received?.crc32_hash} expected: ${serverValue.crc32_hash}`
      );
      server.kickPlayerWithReason(
        client,
        `Failed asset integrity check - Missing or invalid file: ${serverValue.file_name}`
      );
      return;
    }

    for (const clientValue of receivedHashes) {
      if (
        validatedHashes.find((serverValue) =>
          this.validateFile(clientValue, serverValue)
        ) ||
        this.allowedPacks.find((serverValue) =>
          this.validateFile(clientValue, serverValue)
        )
      ) {
        continue;
      }
      console.log(
        `Unauthorized file on client: ${client.loginSessionId} - ${clientValue.file_name}: ${clientValue.crc32_hash}`
      );
      server.kickPlayerWithReason(
        client,
        `Failed asset integrity check - Unauthorized file: ${clientValue.file_name}`
      );
      return;
    }

    console.log(`${client.loginSessionId} passed asset integrity check.`);
    server.sendConsoleText(client, "[SERVER] Passed asset integrity check");
    clearTimeout(client.assetIntegrityKickTimer);
    delete client.assetIntegrityKickTimer;
  }
}
