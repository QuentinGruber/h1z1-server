import {
  CommandDeliveryDisplayInfo,
  CommandDeliveryManagerStatus
} from "types/zone2016packets";
import { ZoneServer2016 } from "../zoneserver";
import { Effects, Items, ModelIds } from "../models/enums";
import {
  _,
  getCurrentServerTimeWrapper,
  TimeWrapper
} from "../../../utils/utils";
import { ZoneClient2016 } from "../classes/zoneclient";
import { ExplosiveEntity } from "../entities/explosiveentity";
import { AirdropConfig, AirdropTypeConfig } from "../models/config";

interface DeliveryProgressData {
  progress: number;
  position: Float32Array;
}

/** One model shown falling/flying in a Command.DeliveryDisplayInfo packet. */
interface DeliverySegment {
  actorModelId: number;
  activationTime: number;
  totalTicks: number;
  rotation: number;
  effectId: number;
  endPosition: Float32Array;
  unknownDword3: number;
  progressStages: DeliveryProgressData[];
}

/** Geometry + timing handed to a payload so it can build its delivery. */
interface AirdropContext {
  position: Float32Array;
  dropPoint: Float32Array;
  callerPos: Float32Array;
  dir: [number, number];
  totalDist: number;
  tickAtPos: number;
  movementSpeed: number;
  calledTick: number;
  forcedAirdropType: string;
  config: AirdropTypeConfig;
}

/**
 * A kind of airdrop. To add one, register it in `airdropTypes` with a default
 * `config` (any field overridable from config.yaml) and a `deliver` that
 * schedules the server-side effects and returns the models shown falling
 * (everything after the plane) in the delivery packet.
 */
interface AirdropType {
  config: AirdropTypeConfig;
  deliver: (ctx: AirdropContext) => DeliverySegment[];
}

export class AirdropManager {
  private nextAirdropId: number = 0;
  private activeAirdrops: Map<
    number,
    {
      path: DeliveryProgressData[];
      calledTick: number;
      removeTick: number;
      segments: DeliverySegment[];
    }
  > = new Map();
  private readonly bombModelId = 9372; // Common_Props_Bomb.adr
  private maxAirdrops: number = 1;
  public minimumPlayers: number = 0;
  public useNavmesh: boolean = false;

  // Default config per type; config.yaml (airdrop.types.<name>) overrides any
  // field via applyConfig(). A regular IED is radius 5 / 50000 for reference.
  private readonly airdropTypes: Record<string, AirdropType> = {
    normal: {
      config: {
        planeSpeed: 140000,
        levelFlight: false,
        arrivalAlert: "Air drop released. The package is delivered.",
        crateDropSpeed: 60000,
        bombCount: 0,
        bombBlastRadius: 0,
        bombBlastDamage: 0,
        bombReleaseHeight: 0,
        bombFallSpeed: 60,
        corridorLength: 0,
        corridorWidth: 0
      },
      deliver: (ctx) => this.deliverCrate(ctx)
    },
    bombing: {
      config: {
        planeSpeed: 24000,
        levelFlight: true,
        arrivalAlert: "",
        crateDropSpeed: 0,
        bombCount: 100,
        bombBlastRadius: 12,
        bombBlastDamage: 150000,
        bombReleaseHeight: 950, // matches the plane's cruise altitude
        bombFallSpeed: 60, // bomb falls at ~60 world units per second
        corridorLength: 260,
        corridorWidth: 90
      },
      deliver: (ctx) => this.deliverBombs(ctx)
    }
  };

  constructor(public server: ZoneServer2016) {}

  /** Apply config.yaml overrides: minimum players + per-type field overrides. */
  applyConfig(cfg: AirdropConfig) {
    this.minimumPlayers = cfg.minimumPlayers;
    this.useNavmesh = cfg.useNavmesh ?? false;
    for (const [name, overrides] of Object.entries(cfg.types ?? {})) {
      const type = this.airdropTypes[name];
      if (!type) continue; // unknown type in config; nothing to tune
      type.config = { ...type.config, ...overrides };
    }
  }

  generateDeliveryPath(
    position: Float32Array,
    movementSpeed: number,
    levelFlight: boolean = false
  ): {
    path: DeliveryProgressData[];
    tickAtPos: number;
    dropPoint: Float32Array;
    dir: [number, number];
    totalDist: number;
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

    const length = Math.hypot(dirX, dirZ) || 1;
    dirX /= length;
    dirZ /= length;

    if (Math.sign(dirX) != (Math.sign(playerX) || 1)) dirX = -dirX;
    if (Math.sign(dirZ) != (Math.sign(playerZ) || 1)) dirZ = -dirZ;

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
      Math.floor((distToPlayer / totalDist) * movementSpeed)
    );

    const distToDrop = Math.max(0, distToPlayer - 1800);
    const distToRise = Math.min(totalDist, distToPlayer + 1800);

    const adjustedDistToDrop = Math.max(0, distToDrop - 300);
    const adjustedDistToRise = Math.min(totalDist, distToRise + 300);

    // Level-flight planes (e.g. bombing runs) stay at cruise altitude instead
    // of dipping down to the drop height near the target.
    const cruise = 950;
    const dropAlt = levelFlight ? cruise : 450;

    const segments = [
      { count: 3, startDist: 0, endDist: adjustedDistToDrop, height: cruise },
      {
        count: 4,
        startDist: adjustedDistToDrop,
        endDist: distToPlayer,
        height: dropAlt
      },
      {
        count: 1,
        startDist: distToPlayer,
        endDist: distToPlayer,
        height: dropAlt,
        isPlayerPoint: true
      },
      {
        count: 3,
        startDist: distToPlayer,
        endDist: adjustedDistToRise,
        height: dropAlt
      },
      {
        count: 3,
        startDist: adjustedDistToRise,
        endDist: totalDist,
        height: cruise
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

    return { path, tickAtPos, dropPoint, dir: [dirX, dirZ], totalDist };
  }

  spawnAirdrop(
    position: Float32Array,
    forcedAirdropType: string,
    forceSpawn: boolean = false,
    caller: string = "",
    type: string = "normal"
  ): boolean {
    if (!forceSpawn && !this.allowedAirdropSpawn()) {
      return false;
    }
    const airdropType = this.airdropTypes[type] ?? this.airdropTypes.normal;
    const config = airdropType.config;
    const movementSpeed = config.planeSpeed;
    const { path, tickAtPos, dropPoint, dir, totalDist } =
      this.generateDeliveryPath(position, movementSpeed, config.levelFlight);

    const calledTick = getCurrentServerTimeWrapper().getTruncatedU32();
    const callerPos = new Float32Array([
      position[0],
      position[1],
      position[2],
      0
    ]);

    // The payload schedules its own server-side effects and returns the models
    // shown falling in the delivery packet.
    const segments = airdropType.deliver({
      position,
      dropPoint,
      callerPos,
      dir,
      totalDist,
      tickAtPos,
      movementSpeed,
      calledTick,
      forcedAirdropType,
      config
    });

    const airdropId = this.nextAirdropId++;
    this.activeAirdrops.set(airdropId, {
      path,
      calledTick,
      removeTick: movementSpeed,
      segments
    });

    if (config.arrivalAlert) {
      const alert = config.arrivalAlert;
      setTimeout(() => {
        const client = this.server.getClientByCharId(caller);
        if (client) this.server.sendAlert(client, alert);
      }, Math.floor(tickAtPos));
    }

    setTimeout(() => {
      this.activeAirdrops.delete(airdropId);
      this.sendDeliveryStatus();
    }, movementSpeed);

    this.broadcastDeliveryInfo();
    this.sendDeliveryStatus();
    return true;
  }

  // ---- Payload types --------------------------------------------------

  /** Normal airdrop: parachute a loot crate down to the caller. */
  private deliverCrate(ctx: AirdropContext): DeliverySegment[] {
    const { position, dropPoint, callerPos, tickAtPos, calledTick, config } =
      ctx;
    const crateDropSpeed = config.crateDropSpeed;

    setTimeout(
      () => {
        this.server.worldObjectManager.createAirdropContainer(
          this.server,
          position,
          ctx.forcedAirdropType
        );
        this.server.sendCompositeEffectToAllInRange(
          400,
          "",
          position,
          Effects.PFX_Impact_Explosion_AirdropBomb_Default_10m
        );
      },
      Math.floor(tickAtPos + crateDropSpeed)
    );

    return [
      ModelIds.MILITARY_CRATE_PARACHUTE,
      ModelIds.AIRDROP_CARGO_CONTAINER,
      ModelIds.MILITARY_CRATE
    ].map((modelId) => ({
      actorModelId: modelId,
      activationTime: new TimeWrapper(calledTick + tickAtPos).getTruncatedU32(),
      totalTicks: crateDropSpeed / 1000,
      rotation: 0,
      effectId: 0,
      endPosition: callerPos,
      unknownDword3: 0,
      progressStages: [
        { progress: 0, position: dropPoint },
        { progress: 1, position: callerPos }
      ]
    }));
  }

  /** Bombing run: carpet-bomb the drop point along the flight path. */
  private deliverBombs(ctx: AirdropContext): DeliverySegment[] {
    const {
      position,
      dropPoint,
      dir,
      totalDist,
      tickAtPos,
      movementSpeed,
      calledTick,
      config
    } = ctx;
    const bombs = this.generateBombs(
      position,
      dropPoint,
      dir,
      totalDist,
      tickAtPos,
      movementSpeed,
      config
    );

    // Detonate each bomb when its falling model lands (releaseDelay + fall).
    for (const bomb of bombs) {
      setTimeout(
        () =>
          this.detonateBomb(
            bomb.impact,
            config.bombBlastRadius,
            config.bombBlastDamage
          ),
        Math.max(0, Math.floor(bomb.releaseDelay + bomb.fallMs))
      );
    }

    return bombs.map((bomb) => ({
      actorModelId: this.bombModelId,
      activationTime: new TimeWrapper(
        calledTick + bomb.releaseDelay
      ).getTruncatedU32(),
      totalTicks: bomb.fallMs / 1000,
      rotation: 0,
      effectId: 0,
      endPosition: bomb.impact,
      unknownDword3: 0,
      progressStages: [
        {
          progress: 0,
          position: new Float32Array([
            bomb.impact[0],
            config.bombReleaseHeight,
            bomb.impact[2],
            0
          ])
        },
        { progress: 1, position: bomb.impact }
      ]
    }));
  }

  // Carpet-bomb along the flight path: ~100 bombs scattered in a corridor
  // centred on the drop point. Returns each bomb's impact point and the delay
  // (from calledTick) at which it releases, so the falling model in the
  // delivery packet and the server-side detonation stay in sync.
  generateBombs(
    position: Float32Array,
    dropPoint: Float32Array,
    dir: [number, number],
    totalDist: number,
    tickAtPos: number,
    movementSpeed: number,
    config: AirdropTypeConfig
  ): { impact: Float32Array; releaseDelay: number; fallMs: number }[] {
    const {
      bombCount,
      corridorLength,
      corridorWidth,
      bombReleaseHeight,
      bombFallSpeed
    } = config;
    const msPerMetre = movementSpeed / totalDist;

    const [dirX, dirZ] = dir;
    const perpX = -dirZ,
      perpZ = dirX;

    const bombs: {
      impact: Float32Array;
      releaseDelay: number;
      fallMs: number;
    }[] = [];
    for (let i = 0; i < bombCount; i++) {
      const along = (Math.random() - 0.5) * corridorLength;
      const lateral = (Math.random() - 0.5) * corridorWidth;
      const x = dropPoint[0] + dirX * along + perpX * lateral;
      const z = dropPoint[2] + dirZ * along + perpZ * lateral;

      const groundPoint = this.server.navManager.getNavGroundPoint(x, z);
      const y = groundPoint ? groundPoint[1] : position[1];

      // Fall time from the release altitude down to the ground at fall speed.
      const fallMs =
        (Math.max(0, bombReleaseHeight - y) / bombFallSpeed) * 1000;
      // Release when the plane passes over this point, with a little jitter.
      const releaseDelay = tickAtPos + along * msPerMetre + Math.random() * 200;
      bombs.push({
        impact: new Float32Array([x, y, z, 1]),
        releaseDelay,
        fallMs
      });
    }
    return bombs;
  }

  private detonateBomb(
    pos: Float32Array,
    blastRadius: number,
    blastDamage: number
  ) {
    const characterId = this.server.generateGuid();
    const bomb = new ExplosiveEntity(
      characterId,
      this.server.getTransientId(characterId),
      this.bombModelId,
      pos,
      new Float32Array([0, 0, 0, 0]),
      this.server,
      Items.IED
    );
    // Use the airdrop explosion effect rather than the default landmine one.
    bomb.explosionEffectId =
      Effects.PFX_Impact_Explosion_AirdropBomb_Default_10m;
    // Airdrop bombs hit harder and wider than a regular IED.
    bomb.blastRadius = blastRadius;
    bomb.charBlastDamage = blastDamage;
    this.server._explosives[characterId] = bomb;
    bomb.detonate();
  }

  broadcastDeliveryInfo(client: ZoneClient2016 | undefined = undefined) {
    for (const [airdropId, airdrop] of this.activeAirdrops.entries()) {
      const { path, calledTick, removeTick, segments } = airdrop;
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
          ...segments
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
