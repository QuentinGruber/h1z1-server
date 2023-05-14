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

import { Collection } from "mongodb";
import { FairPlayValues, fireHint } from "types/zoneserver";
import { BAN_INFO, DB_COLLECTIONS } from "../../../utils/enums";
import {
  decrypt,
  getDistance,
  getDistance1d,
  getDistance2d,
  isPosInRadiusWithY,
  logClientActionToMongo
} from "../../../utils/utils";
import { LoadoutItem } from "../classes/loadoutItem";
import { ZoneClient2016 as Client } from "../classes/zoneclient";
import { BaseEntity } from "../entities/baseentity";
import { Vehicle2016 as Vehicle } from "../entities/vehicle";
import { ConstructionPermissionIds, Items } from "../models/enums";
import { ZoneServer2016 } from "../zoneserver";

const encryptedData = require("../../../../data/2016/encryptedData/encryptedData.json"),
  fairPlayData = require("../../../../data/2016/encryptedData/fairPlayData.json");

export class FairPlayManager {
  _decryptKey: string = "";
  _fairPlayDecryptKey: string = "";
  _suspiciousList: string[] = [];
  fairPlayValues?: FairPlayValues;
  banInfoAcceptance: Array<BAN_INFO> = [
    BAN_INFO.GLOBAL_BAN,
    BAN_INFO.LOCAL_BAN,
    BAN_INFO.VPN,
    BAN_INFO.HWID,
    BAN_INFO.UNVERIFIED
  ];

  /* MANAGED BY CONFIGMANAGER */
  useFairPlay!: boolean;
  maxPing!: number;
  pingTimeoutTime!: number;

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

  checkPlayerSpeed(
    server: ZoneServer2016,
    client: Client,
    sequenceTime: number,
    position: Float32Array
  ): boolean {
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
        const drift = Math.abs(sequenceTime - server.getServerTime());
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
        const soeClient = server.getSoeClient(client.soeClientId);
        if (soeClient) {
          if (soeClient.avgPing >= 250) return false;
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

  checkVehicleSpeed(
    server: ZoneServer2016,
    client: Client,
    sequenceTime: number,
    position: Float32Array,
    vehicle: Vehicle
  ): boolean {
    if (client.isAdmin || !this.useFairPlay) return false;
    if (!server.isSaving) {
      const drift = Math.abs(sequenceTime - server.getServerTime());
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
        const soeClient = server.getSoeClient(client.soeClientId);
        if (soeClient) {
          if (soeClient.avgPing >= 250) return false;
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
    vehicle.oldPos = { position: position, time: sequenceTime };
    return false;
  }

  hitMissFairPlayCheck(
    server: ZoneServer2016,
    client: Client,
    hit: boolean,
    hitLocation: string
  ) {
    const weaponItem = client.character.getEquippedWeapon();
    if (
      !this.useFairPlay ||
      !weaponItem ||
      weaponItem.itemDefinitionId == Items.WEAPON_SHOTGUN
    )
      return;
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
    fireHint: fireHint,
    weaponItem: LoadoutItem,
    hitReport: any,
    gameTime: number
  ): boolean {
    if (!this.fairPlayValues) return true;
    const message = `FairPlay: blocked incoming projectile from ${client.character.name}`,
      targetClient = server.getClientByCharId(entity.characterId);

    if (targetClient) fireHint.hitNumber++;
    const checkWeapons = [
      Items.WEAPON_BOW_MAKESHIFT,
      Items.WEAPON_BOW_RECURVE,
      Items.WEAPON_BOW_WOOD,
      Items.WEAPON_CROSSBOW
    ];
    if (checkWeapons.includes(weaponItem.itemDefinitionId)) {
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
          server.sendChatText(targetClient, message, false);
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
        (weaponItem.itemDefinitionId == Items.WEAPON_SHOTGUN
          ? this.fairPlayValues.dotProductMinShotgun
          : this.fairPlayValues.dotProductMin)
      ) {
        if (dotProduct < this.fairPlayValues.dotProductBlockValue) {
          if (c) {
            this.sendChatText(c, message, false);
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
                (weaponItem.itemDefinitionId == Items.WEAPON_SHOTGUN
                  ? this.fairPlayValues.dotProductMinShotgun
                  : this.fairPlayValues.dotProductMin)
              ).toFixed(3)
            ) * 100
          }% max deviation`,
          false
        );
      }*/

    if (targetClient) {
      if (!targetClient.vehicle.mountedVehicle) {
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
          server.sendChatText(targetClient, message, false);
          return false;
        }
      }
      const distance = getDistance(fireHint.position, hitReport.position);
      const speed =
        (distance / 1000 / (gameTime - fireHint.timeStamp)) * 3600000;
      let maxSpeed = this.fairPlayValues.defaultMaxProjectileSpeed;
      let minSpeed = this.fairPlayValues.defaultMinProjectileSpeed;
      let maxDistance = this.fairPlayValues.defaultMaxDistance;
      switch (weaponItem.itemDefinitionId) {
        case Items.WEAPON_308:
        case Items.WEAPON_REAPER:
          maxSpeed = this.fairPlayValues.WEAPON_308.maxSpeed;
          minSpeed = this.fairPlayValues.WEAPON_308.minSpeed;
          maxDistance = this.fairPlayValues.WEAPON_308.maxDistance;
          break;
        case Items.WEAPON_CROSSBOW:
          maxSpeed = this.fairPlayValues.WEAPON_CROSSBOW.maxSpeed;
          minSpeed = this.fairPlayValues.WEAPON_CROSSBOW.minSpeed;
          maxDistance = this.fairPlayValues.WEAPON_CROSSBOW.maxDistance;
          break;
        case Items.WEAPON_BOW_MAKESHIFT:
          maxSpeed = this.fairPlayValues.WEAPON_BOW_MAKESHIFT.maxSpeed;
          minSpeed = this.fairPlayValues.WEAPON_BOW_MAKESHIFT.minSpeed;
          maxDistance = this.fairPlayValues.WEAPON_BOW_MAKESHIFT.maxDistance;
          break;
        case Items.WEAPON_BOW_RECURVE:
          maxSpeed = this.fairPlayValues.WEAPON_BOW_RECURVE.maxSpeed;
          minSpeed = this.fairPlayValues.WEAPON_BOW_RECURVE.minSpeed;
          maxDistance = this.fairPlayValues.WEAPON_BOW_RECURVE.maxDistance;
          break;
        case Items.WEAPON_BOW_WOOD:
          maxSpeed = this.fairPlayValues.WEAPON_BOW_WOOD.maxSpeed;
          minSpeed = this.fairPlayValues.WEAPON_BOW_WOOD.minSpeed;
          maxDistance = this.fairPlayValues.WEAPON_BOW_WOOD.maxDistance;
          break;
        case Items.WEAPON_SHOTGUN:
        case Items.WEAPON_NAGAFENS_RAGE:
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
            server.getItemDefinition(weaponItem.itemDefinitionId).NAME
          } | ${hitReport.hitLocation}`,
          false
        );
        server.sendChatText(targetClient, message, false);
        return false;
      }
    }
    return true;
  }
}
