export interface NpcGroundSample {
  height: number;
  surface: "terrain" | "road" | "navmesh";
  valid: boolean;
  slopeX: number;
  slopeZ: number;
  roadInstanceId?: number;
}

/** Per-NPC packet prediction state. Authoritative ground Y is never filtered. */
export class NpcGroundMotion {
  private verticalSpeed = 0;
  constructor(
    private position: Float32Array,
    private ground: NpcGroundSample,
    private timeMs: number
  ) {}

  update(
    position: Float32Array,
    ground: NpcGroundSample,
    timeMs: number,
    responseMs: number,
    moving: boolean
  ) {
    const dt = (timeMs - this.timeMs) / 1000;
    const dx = position[0] - this.position[0],
      dz = position[2] - this.position[2];
    const dy = position[1] - this.position[1];
    const distance = Math.hypot(dx, dz);
    const slopeBound =
      Math.max(
        Math.hypot(this.ground.slopeX, this.ground.slopeZ),
        Math.hypot(ground.slopeX, ground.slopeZ)
      ) * distance;
    // Float32 rounding allowance, not a world-space clearance or height offset.
    const roundoff =
      8 *
      2 ** -23 *
      Math.max(1, Math.abs(position[1]), Math.abs(this.position[1]));
    const continuous =
      ground.valid &&
      this.ground.valid &&
      Math.abs(dy) <= slopeBound + roundoff;
    const rawVerticalSpeed = dt > 0 ? dy / dt : 0;
    const stopped = !moving || distance === 0;
    if (stopped || !continuous || dt <= 0) this.verticalSpeed = 0;
    else if (
      this.verticalSpeed === 0 ||
      this.verticalSpeed * rawVerticalSpeed <= 0
    ) {
      // A real crest/direction change must never retain the opposite sign.
      this.verticalSpeed = rawVerticalSpeed;
    } else {
      const responseSeconds = responseMs > 0 ? responseMs / 1000 : dt;
      const alpha = -Math.expm1(-dt / responseSeconds);
      this.verticalSpeed += alpha * (rawVerticalSpeed - this.verticalSpeed);
    }
    const result = {
      previous: Array.from(this.position.slice(0, 3)),
      previousSurface: this.ground.surface,
      previousRoadInstanceId: this.ground.roadInstanceId,
      dt,
      rawVerticalSpeed,
      verticalSpeed: this.verticalSpeed,
      continuous,
      stopped,
      selectedSurface: ground.surface,
      selectedHeight: ground.height,
      roadInstanceId: ground.roadInstanceId,
      finalY: position[1]
    };
    this.position = position.slice();
    this.ground = ground;
    this.timeMs = timeMs;
    return result;
  }
}
