// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2022 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

import DataSchema from "h1z1-dataschema";
import { LZ4 } from "../../../utils/utils";
import { packVehicleReferenceData, parseVehicleReferenceData } from "./shared";
import { profileDataSchema } from "./shared";

const weaponDefinitionSchema: any[] = [
  {
    name: "WEAPON_DEFINITIONS",
    type: "array",
    defaultValue: [],
    fields: [
      { name: "ID", type: "uint32", defaultValue: 0 },
      {
        name: "DATA",
        type: "schema",
        defaultValue: {},
        fields: [
          { name: "ID", type: "uint32", defaultValue: 0 },
          { name: "WEAPON_GROUP_ID", type: "uint32", defaultValue: 0 },
          { name: "FLAGS", type: "uint8", defaultValue: 0 },
          { name: "EQUIP_MS", type: "uint32", defaultValue: 0 },
          { name: "UNEQUIP_MS", type: "uint32", defaultValue: 0 },
          { name: "FROM_PASSIVE_MS", type: "uint32", defaultValue: 0 },
          { name: "TO_PASSIVE_MS", type: "uint32", defaultValue: 0 },
          { name: "XP_CATEGORY", type: "uint32", defaultValue: 0 },
          { name: "TO_IRON_SIGHTS_MS", type: "uint32", defaultValue: 0 },
          { name: "FROM_IRON_SIGHTS_MS", type: "uint32", defaultValue: 0 },
          { name: "TO_IRON_SIGHTS_ANIM_MS", type: "uint32", defaultValue: 0 },
          { name: "FROM_IRON_SIGHTS_ANIM_MS", type: "uint32", defaultValue: 0 },
          { name: "SPRINT_RECOVERY_MS", type: "uint32", defaultValue: 0 },
          { name: "NEXT_USE_DELAY_MSEC", type: "uint32", defaultValue: 0 },
          { name: "TURN_RATE_MODIFIER", type: "float", defaultValue: 0 },
          { name: "MOVEMENT_SPEED_MODIFIER", type: "float", defaultValue: 0 },
          { name: "PROPULSION_TYPE", type: "uint32", defaultValue: 0 },
          { name: "HEAT_BLEED_OFF_RATE", type: "uint32", defaultValue: 0 },
          { name: "HEAT_CAPACITY", type: "uint32", defaultValue: 0 },
          { name: "OVERHEAT_PENALTY_MS", type: "uint32", defaultValue: 0 },
          { name: "RANGE_STRING_ID", type: "uint32", defaultValue: 0 },
          {
            name: "MELEE_DETECT",
            type: "schema",
            defaultValue: {},
            fields: [
              { name: "MELEE_DETECT_WIDTH", type: "uint32", defaultValue: 0 },
              { name: "MELEE_DETECT_HEIGHT", type: "uint32", defaultValue: 0 },
            ],
          },
          { name: "ANIMATION_SET_NAME", type: "string", defaultValue: "" },
          {
            name: "VEHICLE_FIRST_PERSON_CAMERA_ID",
            type: "uint32",
            defaultValue: 0,
          },
          {
            name: "VEHICLE_THIRD_PERSON_CAMERA_ID",
            type: "uint32",
            defaultValue: 0,
          },
          { name: "OVERHEAT_EFFECT_ID", type: "uint32", defaultValue: 0 },
          { name: "MIN_PITCH", type: "float", defaultValue: 0 },
          { name: "MAX_PITCH", type: "float", defaultValue: 0 },
          { name: "AUDIO_GAME_OBJECT", type: "uint32", defaultValue: 0 },
          {
            name: "AMMO_SLOTS",
            type: "array",
            defaultValue: [],
            fields: [
              { name: "AMMO_ID", type: "uint32", defaultValue: 0 },
              { name: "CLIP_SIZE", type: "uint32", defaultValue: 0 },
              { name: "CAPACITY", type: "uint32", defaultValue: 0 },
              { name: "START_EMPTY", type: "boolean", defaultValue: 0 },
              { name: "REFILL_AMMO_PER_TICK", type: "uint32", defaultValue: 0 },
              { name: "REFILL_AMMO_DELAY_MS", type: "uint32", defaultValue: 0 },
              { name: "CLIP_ATTACHMENT_SLOT", type: "uint32", defaultValue: 0 },
              { name: "CLIP_MODEL_NAME", type: "string", defaultValue: "" },
              { name: "RELOAD_WEAPON_BONE", type: "string", defaultValue: "" },
              {
                name: "RELOAD_CHARACTER_BONE",
                type: "string",
                defaultValue: "",
              },
            ],
          },
          {
            name: "FIRE_GROUPS",
            type: "array",
            defaultValue: [],
            fields: [
              { name: "FIRE_GROUP_ID", type: "uint32", defaultValue: 0 },
            ],
          },
        ],
      },
    ],
  },
  {
    name: "FIRE_GROUP_DEFINITIONS",
    type: "array",
    defaultValue: [],
    fields: [
      { name: "ID", type: "uint32", defaultValue: 0 },
      {
        name: "DATA",
        type: "schema",
        defaultValue: {},
        fields: [
          { name: "ID", type: "uint32", defaultValue: 0 },
          {
            name: "unknownArray1",
            type: "array",
            defaultValue: [],
            fields: [
              { name: "unknownDword1", type: "uint32", defaultValue: 0 },
            ],
          },
          { name: "unknownByte1", type: "uint8", defaultValue: 0 },
          { name: "unknownDword1", type: "uint32", defaultValue: 0 },
          { name: "unknownDword2", type: "uint32", defaultValue: 0 },
          { name: "unknownDword3", type: "uint32", defaultValue: 0 },
          { name: "unknownDword4", type: "uint32", defaultValue: 0 },
          { name: "unknownDword5", type: "uint32", defaultValue: 0 },
          { name: "unknownDword6", type: "uint32", defaultValue: 0 },
          { name: "unknownDword7", type: "uint32", defaultValue: 0 },
          { name: "unknownDword8", type: "uint32", defaultValue: 0 },
          { name: "unknownDword9", type: "uint32", defaultValue: 0 },
          { name: "unknownDword10", type: "uint32", defaultValue: 0 },
        ],
      },
    ],
  },
  {
    name: "FIRE_MODE_DEFINITIONS",
    type: "array",
    defaultValue: [],
    fields: [
      { name: "ID", type: "uint32", defaultValue: 0 },
      {
        name: "DATA",
        type: "schema",
        defaultValue: {},
        fields: [
          { name: "ID", type: "uint32", defaultValue: 0 },
          {
            name: "DATA",
            type: "schema",
            defaultValue: {},
            fields: [
              {
                name: "FLAGS",
                type: "schema",
                defaultValue: {},
                fields: [
                  { name: "unknownByte1", type: "uint8", defaultValue: 0 },
                  { name: "unknownByte2", type: "uint8", defaultValue: 0 },
                  { name: "unknownByte3", type: "uint8", defaultValue: 0 },
                ],
              },
              { name: "TYPE", type: "uint8", defaultValue: 0 },
              { name: "AMMO_ITEM_ID", type: "uint32", defaultValue: 0 },
              { name: "AMMO_SLOT", type: "uint8", defaultValue: 0 },
              { name: "BURST_COUNT", type: "uint8", defaultValue: 0 },
              { name: "FIRE_DURATION_MS", type: "uint16", defaultValue: 0 },
              {
                name: "FIRE_COOLDOWN_DURATION_MS",
                type: "uint16",
                defaultValue: 0,
              },
              { name: "REFIRE_TIME_MS", type: "uint16", defaultValue: 0 },
              { name: "FIRE_DELAY_MS", type: "uint16", defaultValue: 0 },
              { name: "AUTO_FIRE_TIME_MS", type: "uint16", defaultValue: 0 },
              { name: "COOK_TIME_MS", type: "uint16", defaultValue: 0 },
              { name: "RANGE", type: "float", defaultValue: 0 },
              { name: "AMMO_PER_SHOT", type: "uint8", defaultValue: 0 },
              { name: "RELOAD_TIME_MS", type: "uint16", defaultValue: 0 },
              {
                name: "RELOAD_CHAMBER_TIME_MS",
                type: "uint16",
                defaultValue: 0,
              },
              {
                name: "RELOAD_AMMO_FILL_TIME_MS",
                type: "uint16",
                defaultValue: 0,
              },
              {
                name: "RELOAD_LOOP_START_TIME_MS",
                type: "uint16",
                defaultValue: 0,
              },
              {
                name: "RELOAD_LOOP_END_TIME_MS",
                type: "uint16",
                defaultValue: 0,
              },
              { name: "PELLETS_PER_SHOT", type: "uint8", defaultValue: 0 },
              { name: "PELLET_SPREAD", type: "float", defaultValue: 0 },
              { name: "COF_RECOIL", type: "float", defaultValue: 0 },
              { name: "COF_SCALAR", type: "float", defaultValue: 0 },
              { name: "COF_SCALAR_MOVING", type: "float", defaultValue: 0 },
              { name: "COF_OVERRIDE", type: "float", defaultValue: 0 },
              { name: "RECOIL_ANGLE_MIN", type: "float", defaultValue: 0 },
              { name: "RECOIL_ANGLE_MAX", type: "float", defaultValue: 0 },
              {
                name: "RECOIL_HORIZONTAL_TOLERANCE",
                type: "float",
                defaultValue: 0,
              },
              { name: "RECOIL_HORIZONTAL_MIN", type: "float", defaultValue: 0 },
              { name: "RECOIL_HORIZONTAL_MAX", type: "float", defaultValue: 0 },
              { name: "RECOIL_MAGNITUDE_MIN", type: "float", defaultValue: 0 },
              { name: "RECOIL_MAGNITUDE_MAX", type: "float", defaultValue: 0 },
              {
                name: "RECOIL_RECOVERY_DELAY_MS",
                type: "uint16",
                defaultValue: 0,
              },
              { name: "RECOIL_RECOVERY_RATE", type: "float", defaultValue: 0 },
              {
                name: "RECOIL_RECOVERY_ACCELERATION",
                type: "float",
                defaultValue: 0,
              },
              {
                name: "RECOIL_SHOTS_AT_MIN_MAGNITUDE",
                type: "uint8",
                defaultValue: 0,
              },
              {
                name: "RECOIL_MAX_TOTAL_MAGNITUDE",
                type: "float",
                defaultValue: 0,
              },
              { name: "RECOIL_INCREASE", type: "float", defaultValue: 0 },
              {
                name: "RECOIL_INCREASE_CROUCHED",
                type: "float",
                defaultValue: 0,
              },
              {
                name: "RECOIL_FIRST_SHOT_MODIFIER",
                type: "float",
                defaultValue: 0,
              },
              {
                name: "RECOIL_HORIZONTAL_MIN_INCREASE",
                type: "float",
                defaultValue: 0,
              },
              {
                name: "RECOIL_HORIZONTAL_MAX_INCREASE",
                type: "float",
                defaultValue: 0,
              },
              { name: "FIRE_DETECT_RANGE", type: "uint16", defaultValue: 0 },
              { name: "EFFECT_GROUP", type: "float", defaultValue: 0 },
              { name: "PLAYER_STATE_GROUP_ID", type: "float", defaultValue: 0 },
              { name: "MOVEMENT_MODIFIER", type: "float", defaultValue: 0 },
              { name: "TURN_MODIFIER", type: "float", defaultValue: 0 },
              { name: "LOCK_ON_ICON_ID", type: "float", defaultValue: 0 },
              { name: "LOCK_ON_ANGLE", type: "float", defaultValue: 0 },
              { name: "LOCK_ON_RADIUS", type: "float", defaultValue: 0 },
              { name: "LOCK_ON_RANGE", type: "float", defaultValue: 0 },
              { name: "LOCK_ON_RANGE_CLOSE", type: "float", defaultValue: 0 },
              { name: "LOCK_ON_RANGE_FAR", type: "float", defaultValue: 0 },
              {
                name: "LOCK_ON_ACQUIRE_TIME_MS",
                type: "uint16",
                defaultValue: 0,
              },
              {
                name: "LOCK_ON_ACQUIRE_TIME_CLOSE_MS",
                type: "uint16",
                defaultValue: 0,
              },
              {
                name: "LOCK_ON_ACQUIRE_TIME_FAR_MS",
                type: "uint16",
                defaultValue: 0,
              },
              { name: "LOCK_ON_LOSE_TIME_MS", type: "uint16", defaultValue: 0 },
              { name: "DEFAULT_ZOOM", type: "float", defaultValue: 0 },
              {
                name: "FIRST_PERSON_OFFSET",
                type: "schema",
                defaultValue: {},
                fields: [
                  {
                    name: "FIRST_PERSON_OFFSET_X",
                    type: "float",
                    defaultValue: 0,
                  },
                  {
                    name: "FIRST_PERSON_OFFSET_Y",
                    type: "float",
                    defaultValue: 0,
                  },
                  {
                    name: "FIRST_PERSON_OFFSET_Z",
                    type: "float",
                    defaultValue: 0,
                  },
                ],
              },
              { name: "RETICLE_ID", type: "uint8", defaultValue: 0 },
              { name: "FULL_SCREEN_EFFECT", type: "uint8", defaultValue: 0 },
              { name: "HEAT_PER_SHOT", type: "uint32", defaultValue: 0 },
              { name: "HEAT_THRESHOLD", type: "uint32", defaultValue: 0 },
              {
                name: "HEAT_RECOVERY_DELAY_MS",
                type: "uint16",
                defaultValue: 0,
              },
              {
                name: "SWAY_AMPLITUDE",
                type: "schema",
                defaultValue: {},
                fields: [
                  { name: "SWAY_AMPLITUDE_X", type: "float", defaultValue: 0 },
                  { name: "SWAY_AMPLITUDE_Y", type: "float", defaultValue: 0 },
                ],
              },
              {
                name: "SWAY_PERIOD",
                type: "schema",
                defaultValue: {},
                fields: [
                  { name: "SWAY_PERIOD_X", type: "float", defaultValue: 0 },
                  { name: "SWAY_PERIOD_Y", type: "float", defaultValue: 0 },
                ],
              },
              { name: "SWAY_INITIAL_Y_OFFSET", type: "float", defaultValue: 0 },
              { name: "ARMS_FOV_SCALAR", type: "float", defaultValue: 0 },
              { name: "ANIM_KICK_MAGNITUDE", type: "float", defaultValue: 0 },
              { name: "ANIM_RECOIL_MAGNITUDE", type: "float", defaultValue: 0 },
              { name: "DESCRIPTION_ID", type: "uint32", defaultValue: 0 },
              { name: "INDIRECT_EFFECT", type: "uint32", defaultValue: 0 },
              { name: "BULLET_ARC_KICK_ANGLE", type: "float", defaultValue: 0 },
              {
                name: "PROJECTILE_SPEED_OVERRIDE",
                type: "float",
                defaultValue: 0,
              },
              { name: "INHERIT_FROM_ID", type: "uint32", defaultValue: 0 },
              {
                name: "INHERIT_FROM_CHARGE_POWER",
                type: "float",
                defaultValue: 0,
              },
              { name: "HUD_IMAGE_ID", type: "uint32", defaultValue: 0 },
              { name: "TARGET_REQUIREMENT", type: "uint32", defaultValue: 0 },
              {
                name: "FIRE_ANIM_DURATION_MS",
                type: "uint32",
                defaultValue: 0,
              },
              {
                name: "SEQUENTIAL_FIRE_ANIM_START",
                type: "uint8",
                defaultValue: 0,
              },
              {
                name: "SEQUENTIAL_FIRE_ANIM_COUNT",
                type: "uint8",
                defaultValue: 0,
              },
              { name: "CYLOF_RECOIL", type: "float", defaultValue: 0 },
              { name: "CYLOF_SCALAR", type: "float", defaultValue: 0 },
              { name: "CYLOF_SCALAR_MOVING", type: "float", defaultValue: 0 },
              { name: "CYLOF_OVERRIDE", type: "float", defaultValue: 0 },
              {
                name: "MELEE_COMPOSITE_EFFECT_ID",
                type: "uint32",
                defaultValue: 0,
              },
              { name: "MELEE_ABILITY_ID", type: "uint32", defaultValue: 0 },
              { name: "SWAY_CROUCH_SCALAR", type: "float", defaultValue: 0 },
              { name: "SWAY_PRONE_SCALAR", type: "float", defaultValue: 0 },
              {
                name: "LAUNCH_PITCH_ADDITIVE_DEGREES",
                type: "float",
                defaultValue: 0,
              },
              {
                name: "TP_FORCE_CAMERA_OVERRIDES",
                type: "boolean",
                defaultValue: false,
              },
              {
                name: "TP_CAMERA_LOOK_OFFSET_X",
                type: "float",
                defaultValue: 0,
              },
              {
                name: "TP_CAMERA_LOOK_OFFSET_Y",
                type: "float",
                defaultValue: 0,
              },
              {
                name: "TP_CAMERA_LOOK_OFFSET_Z",
                type: "float",
                defaultValue: 0,
              },
              {
                name: "TP_CAMERA_POSITION_OFFSET_X",
                type: "float",
                defaultValue: 0,
              },
              {
                name: "TP_CAMERA_POSITION_OFFSET_Y",
                type: "float",
                defaultValue: 0,
              },
              {
                name: "TP_CAMERA_POSITION_OFFSET_Z",
                type: "float",
                defaultValue: 0,
              },
              { name: "TP_CAMERA_FOV", type: "float", defaultValue: 0 },
              {
                name: "FP_FORCE_CAMERA_OVERRIDES",
                type: "boolean",
                defaultValue: false,
              },
              {
                name: "TP_EXTRA_LEAD_FROM_PITCH_A",
                type: "float",
                defaultValue: 0,
              },
              {
                name: "TP_EXTRA_LEAD_FROM_PITCH_B",
                type: "float",
                defaultValue: 0,
              },
              { name: "TP_EXTRA_LEAD_PITCH_A", type: "float", defaultValue: 0 },
              { name: "TP_EXTRA_LEAD_PITCH_B", type: "float", defaultValue: 0 },
              {
                name: "TP_EXTRA_HEIGHT_FROM_PITCH_A",
                type: "float",
                defaultValue: 0,
              },
              {
                name: "TP_EXTRA_HEIGHT_FROM_PITCH_B",
                type: "float",
                defaultValue: 0,
              },
              {
                name: "TP_EXTRA_HEIGHT_PITCH_A",
                type: "float",
                defaultValue: 0,
              },
              {
                name: "TP_EXTRA_HEIGHT_PITCH_B",
                type: "float",
                defaultValue: 0,
              },
              { name: "FP_CAMERA_FOV", type: "float", defaultValue: 0 },
              {
                name: "TP_CR_CAMERA_LOOK_OFFSET_X",
                type: "float",
                defaultValue: 0,
              },
              {
                name: "TP_CR_CAMERA_LOOK_OFFSET_Y",
                type: "float",
                defaultValue: 0,
              },
              {
                name: "TP_CR_CAMERA_LOOK_OFFSET_Z",
                type: "float",
                defaultValue: 0,
              },
              {
                name: "TP_CR_CAMERA_POSITION_OFFSET_X",
                type: "float",
                defaultValue: 0,
              },
              {
                name: "TP_CR_CAMERA_POSITION_OFFSET_Y",
                type: "float",
                defaultValue: 0,
              },
              {
                name: "TP_CR_CAMERA_POSITION_OFFSET_Z",
                type: "float",
                defaultValue: 0,
              },
              {
                name: "TP_PR_CAMERA_LOOK_OFFSET_X",
                type: "float",
                defaultValue: 0,
              },
              {
                name: "TP_PR_CAMERA_LOOK_OFFSET_Y",
                type: "float",
                defaultValue: 0,
              },
              {
                name: "TP_PR_CAMERA_LOOK_OFFSET_Z",
                type: "float",
                defaultValue: 0,
              },
              {
                name: "TP_PR_CAMERA_POSITION_OFFSET_X",
                type: "float",
                defaultValue: 0,
              },
              {
                name: "TP_PR_CAMERA_POSITION_OFFSET_Y",
                type: "float",
                defaultValue: 0,
              },
              {
                name: "TP_PR_CAMERA_POSITION_OFFSET_Z",
                type: "float",
                defaultValue: 0,
              },
              {
                name: "TP_CR_EXTRA_LEAD_FROM_PITCH_A",
                type: "float",
                defaultValue: 0,
              },
              {
                name: "TP_CR_EXTRA_LEAD_FROM_PITCH_B",
                type: "float",
                defaultValue: 0,
              },
              {
                name: "TP_CR_EXTRA_LEAD_PITCH_A",
                type: "float",
                defaultValue: 0,
              },
              {
                name: "TP_CR_EXTRA_LEAD_PITCH_B",
                type: "float",
                defaultValue: 0,
              },
              {
                name: "TP_CR_EXTRA_HEIGHT_FROM_PITCH_A",
                type: "float",
                defaultValue: 0,
              },
              {
                name: "TP_CR_EXTRA_HEIGHT_FROM_PITCH_B",
                type: "float",
                defaultValue: 0,
              },
              {
                name: "TP_CR_EXTRA_HEIGHT_PITCH_A",
                type: "float",
                defaultValue: 0,
              },
              {
                name: "TP_CR_EXTRA_HEIGHT_PITCH_B",
                type: "float",
                defaultValue: 0,
              },
              {
                name: "TP_PR_EXTRA_LEAD_FROM_PITCH_A",
                type: "float",
                defaultValue: 0,
              },
              {
                name: "TP_PR_EXTRA_LEAD_FROM_PITCH_B",
                type: "float",
                defaultValue: 0,
              },
              {
                name: "TP_PR_EXTRA_LEAD_PITCH_A",
                type: "float",
                defaultValue: 0,
              },
              {
                name: "TP_PR_EXTRA_LEAD_PITCH_B",
                type: "float",
                defaultValue: 0,
              },
              {
                name: "TP_PR_EXTRA_HEIGHT_FROM_PITCH_A",
                type: "float",
                defaultValue: 0,
              },
              {
                name: "TP_PR_EXTRA_HEIGHT_FROM_PITCH_B",
                type: "float",
                defaultValue: 0,
              },
              {
                name: "TP_PR_EXTRA_HEIGHT_PITCH_A",
                type: "float",
                defaultValue: 0,
              },
              {
                name: "TP_PR_EXTRA_HEIGHT_PITCH_B",
                type: "float",
                defaultValue: 0,
              },
              { name: "TP_CAMERA_DISTANCE", type: "float", defaultValue: 0 },
              { name: "TP_CR_CAMERA_DISTANCE", type: "float", defaultValue: 0 },
              { name: "TP_PR_CAMERA_DISTANCE", type: "float", defaultValue: 0 },
              { name: "TP_CR_CAMERA_FOV", type: "float", defaultValue: 0 },
              { name: "TP_PR_CAMERA_FOV", type: "float", defaultValue: 0 },
              { name: "FP_CR_CAMERA_FOV", type: "float", defaultValue: 0 },
              { name: "FP_PR_CAMERA_FOV", type: "float", defaultValue: 0 },
              { name: "FORCE_FP_SCOPE", type: "boolean", defaultValue: false },
              { name: "AIM_ASSIST_CONFIG", type: "uint32", defaultValue: 0 },
              {
                name: "ALLOW_DEPTH_ADJUSTMENT",
                type: "boolean",
                defaultValue: false,
              },
              {
                name: "TP_EXTRA_DRAW_FROM_PITCH_A",
                type: "float",
                defaultValue: 0,
              },
              {
                name: "TP_EXTRA_DRAW_FROM_PITCH_B",
                type: "float",
                defaultValue: 0,
              },
              { name: "TP_EXTRA_DRAW_PITCH_A", type: "float", defaultValue: 0 },
              { name: "TP_EXTRA_DRAW_PITCH_B", type: "float", defaultValue: 0 },
              {
                name: "TP_CR_EXTRA_DRAW_FROM_PITCH_A",
                type: "float",
                defaultValue: 0,
              },
              {
                name: "TP_CR_EXTRA_DRAW_FROM_PITCH_B",
                type: "float",
                defaultValue: 0,
              },
              {
                name: "TP_CR_EXTRA_DRAW_PITCH_A",
                type: "float",
                defaultValue: 0,
              },
              {
                name: "TP_CR_EXTRA_DRAW_PITCH_B",
                type: "float",
                defaultValue: 0,
              },
              {
                name: "TP_CAMERA_POS_OFFSET_Y_MOV",
                type: "float",
                defaultValue: 0,
              },
              {
                name: "TP_CAMERA_LOOK_OFFSET_Y_MOV",
                type: "float",
                defaultValue: 0,
              },
              {
                name: "TP_CR_CAMERA_POS_OFFSET_Y_MOV",
                type: "float",
                defaultValue: 0,
              },
              {
                name: "TP_CR_CAMERA_LOOK_OFFSET_Y_MOV",
                type: "float",
                defaultValue: 0,
              },
              {
                name: "TP_ALLOW_MOVE_HEIGHTS",
                type: "boolean",
                defaultValue: false,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    name: "PLAYER_STATE_GROUP_DEFINITIONS",
    type: "array",
    defaultValue: [],
    fields: [
      { name: "ID", type: "uint32", defaultValue: 0 },
      { name: "_ID", type: "uint32", defaultValue: 0 },
      {
        name: "PLAYER_STATE_PROPERTIES",
        type: "array",
        defaultValue: [],
        fields: [
          { name: "GROUP_ID", type: "uint32", defaultValue: 0 },
          {
            name: "DATA",
            type: "schema",
            defaultValue: {},
            fields: [
              { name: "unknownDword1", type: "uint32", defaultValue: 0 },
              { name: "unknownByte1", type: "uint8", defaultValue: 0 },
              { name: "unknownFloat1", type: "float", defaultValue: 0 },
              { name: "unknownFloat2", type: "float", defaultValue: 0 },
              { name: "unknownFloat3", type: "float", defaultValue: 0 },
              { name: "unknownFloat4", type: "float", defaultValue: 0 },
              { name: "unknownDword2", type: "uint32", defaultValue: 0 },
              { name: "unknownDword3", type: "uint32", defaultValue: 0 },
              { name: "unknownFloat5", type: "float", defaultValue: 0 },
              { name: "unknownDword5", type: "uint32", defaultValue: 0 },
              { name: "unknownFloat6", type: "float", defaultValue: 0 },
              { name: "unknownFloat7", type: "float", defaultValue: 0 },
              { name: "unknownFloat8", type: "float", defaultValue: 0 },
              { name: "unknownFloat9", type: "float", defaultValue: 0 },
              { name: "unknownFloat10", type: "float", defaultValue: 0 },
              { name: "unknownDword5", type: "uint32", defaultValue: 0 },
              { name: "unknownFloat11", type: "float", defaultValue: 0 },
              { name: "unknownDword6", type: "uint32", defaultValue: 0 },
            ],
          },
        ],
      },
    ],
  },
  {
    name: "FIRE_MODE_PROJECTILE_MAPPING_DATA",
    type: "array",
    defaultValue: [],
    fields: [
      { name: "ID", type: "uint32", defaultValue: 0 },
      {
        name: "DATA",
        type: "schema",
        defaultValue: {},
        fields: [
          { name: "ID", type: "uint32", defaultValue: 0 },
          { name: "unknownDword2", type: "uint32", defaultValue: 0 },
          { name: "unknownDword3", type: "uint32", defaultValue: 0 },
        ],
      },
    ],
  },
  {
    name: "AIM_ASSIST_DEFINITIONS",
    type: "array",
    defaultValue: [],
    fields: [
      { name: "ID", type: "uint32", defaultValue: 0 },
      {
        name: "DATA",
        type: "schema",
        defaultValue: {},
        fields: [
          { name: "unknownFloat1", type: "float", defaultValue: 0 },
          { name: "unknownFloat2", type: "float", defaultValue: 0 },
          { name: "unknownFloat3", type: "float", defaultValue: 0 },
          { name: "unknownFloat4", type: "float", defaultValue: 0 },
          { name: "unknownFloat5", type: "float", defaultValue: 0 },
          { name: "unknownFloat6", type: "float", defaultValue: 0 },
          { name: "unknownFloat7", type: "float", defaultValue: 0 },
          { name: "unknownFloat8", type: "float", defaultValue: 0 },
          { name: "unknownFloat9", type: "float", defaultValue: 0 },
          { name: "unknownFloat10", type: "float", defaultValue: 0 },
          { name: "unknownFloat11", type: "float", defaultValue: 0 },
          { name: "unknownFloat12", type: "float", defaultValue: 0 },
          { name: "unknownFloat13", type: "float", defaultValue: 0 },
          { name: "unknownFloat14", type: "float", defaultValue: 0 },
          { name: "unknownFloat15", type: "float", defaultValue: 0 },
          { name: "unknownFloat16", type: "float", defaultValue: 0 },
          { name: "unknownDword1", type: "uint32", defaultValue: 0 },
          { name: "unknownFloat19", type: "float", defaultValue: 0 },
          { name: "unknownFloat20", type: "float", defaultValue: 0 },
          { name: "unknownFloat21", type: "float", defaultValue: 0 },
          { name: "unknownFloat22", type: "float", defaultValue: 0 },
          { name: "unknownFloat23", type: "float", defaultValue: 0 },
          { name: "unknownFloat24", type: "float", defaultValue: 0 },
        ],
      },
    ],
  },
];

function packWeaponDefinitionData(obj: any) {
  const compressionData = Buffer.allocUnsafe(8),
    data = DataSchema.pack(weaponDefinitionSchema, obj).data,
    input = data;
  let output = Buffer.alloc(LZ4.encodeBound(input.length));
  output = output.slice(0, LZ4.encodeBlock(input, output));
  compressionData.writeUInt32LE(output.length, 0);
  compressionData.writeUInt32LE(data.length, 4);
  return Buffer.concat([compressionData, output]);
}

export const referenceDataPackets: any = [
  ["ReferenceData.ItemClassDefinitions", 0x1701, {}],
  ["ReferenceData.ItemCategoryDefinitions", 0x1702, {}],
  [
    "ReferenceData.ClientProfileData",
    0x1703,
    {
      fields: [
        {
          name: "profiles",
          type: "array",
          defaultValue: [],
          fields: profileDataSchema,
        },
      ],
    },
  ],
  [
    "ReferenceData.WeaponDefinitions",
    0x1704,
    {
      fields: [
        {
          name: "data",
          type: "byteswithlength",
          fields: [
            {
              name: "definitionsData",
              type: "custom",
              packer: packWeaponDefinitionData,
            },
          ],
        },
      ],
    },
  ],
  ["ReferenceData.ProjectileDefinitions", 0x1705, {}],
  [
    "ReferenceData.VehicleDefinitions",
    0x1706,
    {
      fields: [
        {
          name: "data",
          type: "custom",
          parser: parseVehicleReferenceData,
          packer: packVehicleReferenceData,
        },
      ],
    },
  ],
];
