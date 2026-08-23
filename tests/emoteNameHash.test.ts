import test from "node:test";
import assert from "node:assert";
import { flhash } from "../out/utils/utils";
import { bindableEmotes } from "../out/servers/ZoneServer2016/data/emotes";

// Fixtures for h1emu dynamic emote resolution (Option B). The Dec-2016 client computes a ForgeLight hash
// (flhash) of the CASED InputProfile action name; the server tags each skinItems.emotes entry with
// flhash(casedName) in unknownDword2 so the dinput8 patch can map key -> emote itemDef by nameHash.
// If the cased names drift, flhash mismatches the client's known nameHash and the patch lookup misses -
// this test makes that fail loudly. (re validated 36/36: flhash(casedName) == client nameHash.)
const EXPECTED: { casedName: string; itemDef: number; nameHash: number }[] = [
  { casedName: "Agree", itemDef: 3285, nameHash: 0xc7b4befc },
  { casedName: "AirGuitar", itemDef: 3288, nameHash: 0x64a654b4 },
  { casedName: "Applause", itemDef: 3277, nameHash: 0x433a86b6 },
  { casedName: "Beckon", itemDef: 3278, nameHash: 0xdeebb36c },
  { casedName: "Beg", itemDef: 2438, nameHash: 0x10f0567a },
  { casedName: "BirdCannon", itemDef: 1999, nameHash: 0x2186d966 },
  { casedName: "BootySlap", itemDef: 2000, nameHash: 0x2dd475b9 },
  { casedName: "Bow", itemDef: 3291, nameHash: 0x77dcc6c1 },
  { casedName: "CrotchChop", itemDef: 2001, nameHash: 0x6a398c1b },
  { casedName: "CryBaby", itemDef: 2002, nameHash: 0xe2e985d4 },
  { casedName: "CutThroat", itemDef: 3279, nameHash: 0x6f33e763 },
  { casedName: "DanceA", itemDef: 3286, nameHash: 0xe2ec3b6e },
  { casedName: "DoubleBird", itemDef: 5376, nameHash: 0xb490e0f7 },
  { casedName: "Fisticuffs", itemDef: 2439, nameHash: 0xc0805836 },
  { casedName: "Flex", itemDef: 2441, nameHash: 0xb50423e3 },
  { casedName: "FlexPoint", itemDef: 3154, nameHash: 0x71312f42 },
  { casedName: "Grind", itemDef: 2003, nameHash: 0xecb157f4 },
  { casedName: "Hump", itemDef: 2440, nameHash: 0x364023c5 },
  { casedName: "Laugh", itemDef: 3281, nameHash: 0x323ac39d },
  { casedName: "ListenToTheCrowd", itemDef: 3155, nameHash: 0x226f13a2 },
  { casedName: "NoWay", itemDef: 3282, nameHash: 0x78ad4259 },
  { casedName: "PelvicThrust", itemDef: 2004, nameHash: 0xa2d40486 },
  { casedName: "Point", itemDef: 3283, nameHash: 0xa9bec11f },
  { casedName: "RaiseCrown", itemDef: 3819, nameHash: 0x412e9eaa },
  { casedName: "Salute", itemDef: 3284, nameHash: 0xd89d0ffc },
  { casedName: "SarcasmDance", itemDef: 2005, nameHash: 0xe550423d },
  { casedName: "ScrewYou2", itemDef: 2006, nameHash: 0x1f1c05f5 },
  { casedName: "ShimmyDance", itemDef: 2007, nameHash: 0x39816f62 },
  { casedName: "TeaBag", itemDef: 3280, nameHash: 0x86637979 },
  { casedName: "TeabagLight", itemDef: 3342, nameHash: 0xc0b85592 },
  { casedName: "Violin", itemDef: 3348, nameHash: 0xa6cf6426 },
  { casedName: "Wave", itemDef: 3350, nameHash: 0x1980e542 },
  { casedName: "WaveBye", itemDef: 3287, nameHash: 0x4e08aed5 },
  { casedName: "WaveHello", itemDef: 3276, nameHash: 0xb5678c7e },
  { casedName: "WaveHelloB", itemDef: 3350, nameHash: 0x52baa064 },
  { casedName: "WereNotWorthy", itemDef: 2008, nameHash: 0xeb330c10 }
];

test("flhash(casedName) matches the client nameHash for all 36 bindable emotes", () => {
  for (const { casedName, nameHash } of EXPECTED) {
    const got = flhash(casedName);
    assert.strictEqual(
      got,
      nameHash,
      `flhash("${casedName}") = 0x${got.toString(16)} != expected 0x${nameHash.toString(16)}`
    );
  }
});

test("bindableEmotes matches the known cased-name / itemDef fixtures", () => {
  assert.strictEqual(
    bindableEmotes.length,
    EXPECTED.length,
    `bindableEmotes has ${bindableEmotes.length} entries, expected ${EXPECTED.length}`
  );
  const byName = new Map(
    bindableEmotes.map((e: { casedName: string; itemDef: number }) => [
      e.casedName,
      e.itemDef
    ])
  );
  for (const { casedName, itemDef } of EXPECTED) {
    assert.strictEqual(
      byName.get(casedName),
      itemDef,
      `bindableEmotes["${casedName}"] itemDef = ${byName.get(casedName)} != expected ${itemDef}`
    );
  }
});
