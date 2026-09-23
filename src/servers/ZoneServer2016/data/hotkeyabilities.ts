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
import { PluginManager } from "../managers/pluginmanager";

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

/** An emote ability the player may use once it owns the account item its
 *  client requirement names (scripts/genEmoteAccountItems.ts). */
export interface EmoteAccountItem {
  accountItemId: number;
  abilityId: number;
  animationId: number;
}

export const emoteAccountItems: readonly EmoteAccountItem[] =
  PluginManager.loadServerData("2016/dataSources/EmoteAccountItems.json");

const accountEmoteByItem = new Map(
  emoteAccountItems.map((emote) => [emote.accountItemId, emote])
);
const accountEmoteByAbility = new Map(
  emoteAccountItems.map((emote) => [emote.abilityId, emote])
);

/** Emote unlocked by an account item, if it is one. */
export function emoteForAccountItem(
  accountItemId: number
): EmoteAccountItem | undefined {
  return accountEmoteByItem.get(accountItemId);
}

/** Account emote an ability id activates, if it is one. */
export function accountEmoteForAbility(
  abilityId: number
): EmoteAccountItem | undefined {
  return accountEmoteByAbility.get(abilityId);
}

/** EmoteAnimations id an emote ability plays for a player owning the given
 *  account items, 0 when it is no emote ability the player may use. */
export function emoteAnimationForAbility(
  abilityId: number,
  ownedEmoteAccountItems: ReadonlySet<number>
): number {
  if (abilityId in emoteAbilities) return emoteAbilities[abilityId];
  const accountEmote = accountEmoteForAbility(abilityId);
  return accountEmote && ownedEmoteAccountItems.has(accountEmote.accountItemId)
    ? accountEmote.animationId
    : 0;
}

/** Abilities whose activation the server ends with UninitAbility operation 3. */
export function isHotkeyAbility(abilityId: number) {
  return (
    abilityId in emoteAbilities ||
    abilityId == AbilityIds.NV_GOGGLES ||
    accountEmoteByAbility.has(abilityId)
  );
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

/** SetActivatableAbilityManager entries for the night vision and emote hotkeys:
 *  every requirement-free emote plus the emote of each owned account emote
 *  item. Every manager send replaces the whole client store, so each send
 *  carries them. An account emote's store key is its ability id, unique and
 *  stable across grants. */
export function getHotkeyAbilityEntries(
  ownedEmoteAccountItems: Iterable<number> = []
) {
  const entries = [
    hotkeyAbilityEntry(NIGHT_VISION_ABILITY_KEY, AbilityIds.NV_GOGGLES),
    ...Object.keys(emoteAbilities).map((abilityId, index) =>
      hotkeyAbilityEntry(EMOTE_ABILITY_KEY + index, Number(abilityId))
    )
  ];
  for (const accountItemId of ownedEmoteAccountItems) {
    const emote = emoteForAccountItem(accountItemId);
    if (!emote) continue;
    entries.push(hotkeyAbilityEntry(emote.abilityId, emote.abilityId));
  }
  return entries;
}
