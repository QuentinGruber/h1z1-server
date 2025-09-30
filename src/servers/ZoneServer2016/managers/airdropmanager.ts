import {
  CommandDeliveryDisplayInfo,
  CommandDeliveryManagerStatus
} from "types/zone2016packets";
import { ZoneServer2016 } from "../zoneserver";
import { Effects, ModelIds } from "../models/enums";
import {
  _,
  getCurrentServerTimeWrapper,
  TimeWrapper
} from "../../../utils/utils";
import { ZoneClient2016 } from "../classes/zoneclient";

interface DeliveryProgressData {
  progress: number;
  position: Float32Array;
}

// TODO: This only allows for normal airdrops currently.
// TODO: Refactor so bombing planes are alllowed

export class AirdropManager {
  private nextAirdropId: number = 0;
  private activeAirdrops: Map<
    number,
    {
      path: DeliveryProgressData[];
      dropPoint: Float32Array;
      callerPos: Float32Array;
      tickAtPos: number;
      calledTick: number;
      crateSpawnTick: number;
      removeTick: number;
    }
  > = new Map();
  private maxAirdrops: number = 1;
  public crateDropSpeed: number = 35496.3;
  public planeMovementSpeed: number = 40000;
  public minimumPlayers: number = 0;

  constructor(public server: ZoneServer2016) {}

  generateDeliveryPath(position: Float32Array): {
    path: DeliveryProgressData[];
    tickAtPos: number;
    dropPoint: Float32Array;
  } {
    const mapBound = 4096;
    const playerX = position[0];
    const playerZ = position[2];

    const isVertical = Math.random() < 0.5;
    let dirX = 0,
      dirZ = 0;
    if (isVertical) {
      dirX = 1;
      dirZ = Math.random() * 0.4 - 0.2;
    } else {
      dirZ = 1;
      dirX = Math.random() * 0.4 - 0.2;
    }

    const length = Math.hypot(dirX, dirZ);
    dirX /= length;
    dirZ /= length;

    const maxDist = mapBound * 1.5;

    const startX = playerX - dirX * maxDist;
    const startZ = playerZ - dirZ * maxDist;

    const endX = playerX + dirX * maxDist;
    const endZ = playerZ + dirZ * maxDist;

    const start: [number, number, number] = [startX, 950, startZ];
    const end: [number, number, number] = [endX, 950, endZ];
    const dropPoint = new Float32Array([position[0], 450, position[2], 0]);

    const totalDist = Math.hypot(endX - startX, endZ - startZ);
    const distToPlayer = Math.hypot(playerX - startX, playerZ - startZ);

    const tickAtPos = Math.floor(
      Math.floor((distToPlayer / totalDist) * this.planeMovementSpeed)
    );

    const distToDrop = Math.max(0, distToPlayer - 1800);
    const distToRise = Math.min(totalDist, distToPlayer + 1800);

    const adjustedDistToDrop = Math.max(0, distToDrop - 300);
    const adjustedDistToRise = Math.min(totalDist, distToRise + 300);

    const segments = [
      { count: 3, startDist: 0, endDist: adjustedDistToDrop, height: 950 },
      {
        count: 4,
        startDist: adjustedDistToDrop,
        endDist: distToPlayer,
        height: 450
      },
      {
        count: 1,
        startDist: distToPlayer,
        endDist: distToPlayer,
        height: 450,
        isPlayerPoint: true
      },
      {
        count: 3,
        startDist: distToPlayer,
        endDist: adjustedDistToRise,
        height: 450
      },
      {
        count: 3,
        startDist: adjustedDistToRise,
        endDist: totalDist,
        height: 950
      }
    ];

    const path: DeliveryProgressData[] = [];

    for (const segment of segments) {
      for (let i = 0; i < segment.count; i++) {
        const fraction = segment.count > 1 ? i / (segment.count - 1) : 0;
        const dist =
          segment.startDist + fraction * (segment.endDist - segment.startDist);
        const t = dist / totalDist;

        const isPlayer = segment.isPlayerPoint || false;
        const x = isPlayer ? playerX : start[0] + (end[0] - start[0]) * t;
        const z = isPlayer ? playerZ : start[2] + (end[2] - start[2]) * t;

        path.push({
          progress: Math.min(1, Math.max(0, t)),
          position: new Float32Array([x, segment.height, z, 0])
        });
      }
    }

    return { path, tickAtPos, dropPoint };
  }

  spawnAirdrop(
    position: Float32Array,
    forcedAirdropType: string,
    forceSpawn: boolean = false,
    caller: string = ""
  ): boolean {
    if (!forceSpawn && !this.allowedAirdropSpawn()) {
      return false;
    }
    const { path, tickAtPos, dropPoint } = this.generateDeliveryPath(position);

    const currentTick = getCurrentServerTimeWrapper().getTruncatedU32();
    const airdropId = this.nextAirdropId++;
    this.activeAirdrops.set(airdropId, {
      path: path,
      callerPos: new Float32Array([position[0], position[1], position[2], 0]),
      calledTick: currentTick,
      dropPoint: dropPoint,
      tickAtPos: new TimeWrapper(tickAtPos).getTruncatedU32(),
      crateSpawnTick: new TimeWrapper(
        tickAtPos + this.crateDropSpeed
      ).getTruncatedU32(),
      removeTick: this.planeMovementSpeed
    });

    setTimeout(() => {
      const client = this.server.getClientByCharId(caller);
      if (client) {
        this.server.sendAlert(
          client,
          "Air drop released. The package is delivered."
        );
      }
    }, Math.floor(tickAtPos));

    setTimeout(
      () => {
        this.server.worldObjectManager.createAirdropContainer(
          this.server,
          position,
          forcedAirdropType
        );
        this.server.sendCompositeEffectToAllInRange(
          400,
          "",
          position,
          Effects.PFX_Impact_Explosion_AirdropBomb_Default_10m
        );
      },
      Math.floor(tickAtPos + this.crateDropSpeed)
    );

    setTimeout(() => {
      this.activeAirdrops.delete(airdropId);
      this.sendDeliveryStatus();
    }, this.planeMovementSpeed);

    this.broadcastDeliveryInfo();
    this.sendDeliveryStatus();
    return true;
  }

  broadcastDeliveryInfo(client: ZoneClient2016 | undefined = undefined) {
    for (const [airdropId, airdrop] of this.activeAirdrops.entries()) {
      const { path, dropPoint, callerPos, calledTick, tickAtPos, removeTick } =
        airdrop;
      const deliveryData: CommandDeliveryDisplayInfo = {
        startIndex: airdropId,
        segments: [
          {
            actorModelId: ModelIds.AIRDROP_PLANE,
            activationTime: new TimeWrapper(calledTick).getTruncatedU32(),
            totalTicks: removeTick / 1000,
            rotation: 0.5,
            effectId: 0,
            endPosition: new Float32Array([0, 0, 0, 0]),
            unknownDword3: 0,
            progressStages: path
          },
          ...[
            ModelIds.MILITARY_CRATE_PARACHUTE,
            ModelIds.AIRDROP_CARGO_CONTAINER,
            ModelIds.MILITARY_CRATE
          ].map((modelId) => ({
            actorModelId: modelId,
            activationTime: new TimeWrapper(
              calledTick + tickAtPos
            ).getTruncatedU32(),
            totalTicks: this.crateDropSpeed / 1000,
            rotation: 0,
            effectId: 0,
            endPosition: callerPos,
            unknownDword3: 0,
            progressStages: [
              {
                progress: 0,
                position: dropPoint
              },
              { progress: 1, position: callerPos }
            ]
          }))
        ]
      };

      if (client) {
        this.server.sendData(
          client,
          "Command.DeliveryDisplayInfo",
          deliveryData
        );
        return;
      }
      this.server.sendDataToAll("Command.DeliveryDisplayInfo", deliveryData);
    }
  }

  allowedAirdropSpawn() {
    return this.activeAirdrops.size < this.maxAirdrops;
  }

  sendDeliveryStatus() {
    const hasEnoughSurvivors =
      this.server._soloMode ||
      this.minimumPlayers < _.size(this.server._clients);

    let status = 0;
    switch (true) {
      case !hasEnoughSurvivors:
        status = 2;
        break;
      case this.activeAirdrops.size > 0:
        status = 1;
        break;
    }

    this.server.sendDataToAll<CommandDeliveryManagerStatus>(
      "Command.DeliveryManagerStatus",
      {
        deliveryAvailable: status == 0 ? 1 : 0,
        status: status
      }
    );
  }
}
