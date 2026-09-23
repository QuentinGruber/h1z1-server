// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2026 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

import { AbilityIds } from "../models/enums";

/** InitAbility operation of a client activation request. */
export const ABILITY_OPERATION_REQUEST = 1;
/** InitAbility operation the server echoes to confirm an activation. */
export const ABILITY_OPERATION_ACTIVATED = 3;
/** Server-sent UninitAbility {operation, abilityId, value}: operation 3
 *  removes the client's ability instance and clears its active record, so the
 *  same ability can be activated again; the value must be non-zero. */
export const ABILITY_END_OPERATION = 3;
export const ABILITY_END_VALUE = 1;

/** Emote abilities without a requirement, keyed by AbilityEx id, mapped to the
 *  EmoteAnimations row with the same INPUT_ACTION_KEY. A Sku=1 client activates
 *  the ability whose key matches the pressed Emotes action. */
export const emoteAbilities: Readonly<Record<number, number>> = {
  1111389: 2, // WaveHello
  1111391: 3, // WaveBye
  1111392: 4, // DoubleBird
  1111393: 5, // Point
  1111394: 6, // Agree
  1111395: 7, // Applause
  1111396: 8, // Beckon
  1111397: 9, // CutThroat
  1111398: 10, // Salute
  1111399: 11, // DanceA
  1111416: 12, // WaveHelloB
  1111417: 13, // Laugh
  1111418: 14, // No
  1111419: 15, // NoWay
  1111427: 18 // TeaBag
};

/** AbilityEx EXPIRE_MSEC of the emote abilities; the server ends a run once it
 *  expires. */
export const EMOTE_ABILITY_EXPIRE_MS = 800;

/** First activatable store key of the emote entries, above every loadout slot id. */
export const EMOTE_ABILITY_KEY = 1000;
/** Activatable store key of the night vision entry. */
export const NIGHT_VISION_ABILITY_KEY = 1100;

/** Abilities whose activation the server ends with UninitAbility operation 3. */
export function isHotkeyAbility(abilityId: number) {
  return abilityId in emoteAbilities || abilityId == AbilityIds.NV_GOGGLES;
}

function hotkeyAbilityEntry(key: number, abilityId: number) {
  // the input-action index resolves an entry by its line id, which therefore
  // equals its slot key
  return {
    loadoutSlotId: key,
    abilityLineId: key,
    unknownArray1: [
      {
        unknownDword1: abilityId,
        unknownDword2: abilityId,
        unknownDword3: 0
      }
    ],
    unknownDword3: 2,
    itemDefinitionId: 0,
    unknownByte: 64
  };
}

/** SetActivatableAbilityManager entries for the night vision and emote hotkeys.
 *  Every manager send replaces the whole client store, so each send carries them. */
export function getHotkeyAbilityEntries() {
  return [
    hotkeyAbilityEntry(NIGHT_VISION_ABILITY_KEY, AbilityIds.NV_GOGGLES),
    ...Object.keys(emoteAbilities).map((abilityId, index) =>
      hotkeyAbilityEntry(EMOTE_ABILITY_KEY + index, Number(abilityId))
    )
  ];
}
