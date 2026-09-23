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

import test, { after, mock } from "node:test";
import assert from "node:assert";
import { ZoneServer2016 } from "../zoneserver";
import {
  createFakeCharacter,
  createFakeZoneClient
} from "../../../utils/test.utils";
import { H1Z1Protocol } from "../../../protocols/h1z1protocol";
import {
  EMOTE_ABILITY_EXPIRE_MS,
  EMOTE_ABILITY_KEY,
  NIGHT_VISION_ABILITY_KEY,
  emoteAbilities
} from "../data/hotkeyabilities";
import { AbilityIds, Items, LoadoutSlots } from "../models/enums";

process.env.FORCE_DISABLE_WS = "true";

const WAVE_BYE = 1111391;

type SentPacket = { name: string; data: any };

function captureSends(zone: ZoneServer2016) {
  const sent: SentPacket[] = [];
  zone.sendData = ((_client: unknown, name: string, data: any) => {
    sent.push({ name, data });
  }) as any;
  zone.sendDataToAllOthersWithSpawnedEntity = ((
    _dictionary: unknown,
    _client: unknown,
    _entityId: string,
    name: string,
    data: any
  ) => {
    sent.push({ name, data });
  }) as any;
  return sent;
}

function initPacket(abilityId: number, key: number) {
  return {
    unknownDword1: 1,
    unknownDword2: 0,
    abilityId,
    unknownDword3: key,
    characterId: "0x0000000000000001",
    unknownDword4: 0,
    unknownDword5: 0,
    unknownDword6: 0,
    targetCharacterId: "0x0000000000000001",
    unknownDword7: 0,
    unknownDword8: 0,
    position: [0, 0, 0, 1],
    abilityData: { unknownByte1: 0, unknownByte2: 0 }
  };
}

test("Hotkey abilities", { timeout: 60000 }, async (t) => {
  const zone = new ZoneServer2016(0);
  await zone.start();
  const character = createFakeCharacter(zone);
  const client = createFakeZoneClient(zone, character);

  await t.test("0xA105 carries the emote and night vision entries", () => {
    const abilities = client.character.pGetActivatableAbilities(zone);
    const hotkeyEntries = abilities.filter(
      (entry) => entry.loadoutSlotId >= EMOTE_ABILITY_KEY
    );
    const emoteIds = Object.keys(emoteAbilities).map(Number);
    assert.strictEqual(hotkeyEntries.length, emoteIds.length + 1);
    const keys = new Set<number>();
    for (const entry of hotkeyEntries) {
      assert.strictEqual(entry.abilityLineId, entry.loadoutSlotId);
      assert.strictEqual(entry.unknownArray1.length, 1);
      const member = entry.unknownArray1[0];
      assert.strictEqual(member.unknownDword1, member.unknownDword2);
      assert.strictEqual(member.unknownDword3, 0);
      assert.strictEqual(entry.unknownDword3, 2);
      assert.strictEqual(entry.itemDefinitionId, 0);
      assert.strictEqual(entry.unknownByte, 64);
      keys.add(entry.loadoutSlotId);
    }
    assert.strictEqual(keys.size, hotkeyEntries.length);
    const nightVision = hotkeyEntries.find(
      (entry) => entry.loadoutSlotId == NIGHT_VISION_ABILITY_KEY
    );
    assert.strictEqual(
      nightVision?.unknownArray1[0].unknownDword1,
      AbilityIds.NV_GOGGLES
    );
    for (const abilityId of emoteIds) {
      assert.ok(
        hotkeyEntries.some(
          (entry) => entry.unknownArray1[0].unknownDword1 == abilityId
        ),
        `emote ability ${abilityId} is granted`
      );
    }
  });

  await t.test("0xA105 packs with the hotkey entries", () => {
    const protocol = new H1Z1Protocol("ClientProtocol_1080");
    const abilities = client.character.pGetActivatableAbilities(zone);
    const data = protocol.pack("Abilities.SetActivatableAbilityManager", {
      abilities
    });
    assert.ok(data);
    const parsed: any = protocol.parse(data, 0);
    assert.strictEqual(parsed.data.abilities.length, abilities.length);
  });

  await t.test("goggles entry line id equals its slot", () => {
    client.character._loadout[LoadoutSlots.EYES] = {
      slotId: LoadoutSlots.EYES,
      itemDefinitionId: Items.NV_GOGGLES
    } as any;
    const goggles = client.character
      .pGetActivatableAbilities(zone)
      .find(
        (entry) =>
          entry.loadoutSlotId == LoadoutSlots.EYES &&
          entry.itemDefinitionId == Items.NV_GOGGLES
      );
    delete client.character._loadout[LoadoutSlots.EYES];
    assert.ok(goggles);
    assert.strictEqual(goggles.abilityLineId, LoadoutSlots.EYES);
  });

  await t.test("emote activation confirms, relays and ends on expiry", () => {
    const sent = captureSends(zone);
    mock.timers.enable({ apis: ["setTimeout"] });
    try {
      zone.abilitiesManager.processAbilityInit(
        zone,
        client,
        initPacket(WAVE_BYE, EMOTE_ABILITY_KEY) as any
      );
      assert.deepStrictEqual(
        sent.map((packet) => packet.name),
        ["Abilities.InitAbility", "Animation.Play"]
      );
      assert.strictEqual(sent[0].data.unknownDword1, 3);
      assert.strictEqual(sent[0].data.unknownDword2, 0);
      assert.strictEqual(sent[0].data.abilityId, WAVE_BYE);
      assert.strictEqual(sent[1].data.animationId, emoteAbilities[WAVE_BYE]);

      mock.timers.tick(EMOTE_ABILITY_EXPIRE_MS - 1);
      assert.strictEqual(sent.length, 2);
      mock.timers.tick(1);
      assert.strictEqual(sent.length, 3);
      assert.strictEqual(sent[2].name, "Abilities.UninitAbility");
      assert.deepStrictEqual(sent[2].data, {
        unknownDword1: 3,
        abilityId: WAVE_BYE,
        unknownDword2: 1
      });
    } finally {
      mock.timers.reset();
    }
  });

  await t.test("a stop request cancels the pending expiry", () => {
    const sent = captureSends(zone);
    const uninits = () =>
      sent.filter((packet) => packet.name == "Abilities.UninitAbility");
    mock.timers.enable({ apis: ["setTimeout"] });
    try {
      zone.abilitiesManager.processAbilityInit(
        zone,
        client,
        initPacket(WAVE_BYE, EMOTE_ABILITY_KEY) as any
      );
      mock.timers.tick(100);
      zone.abilitiesManager.processHotkeyAbilityUninit(zone, client, {
        unknownDword1: 1,
        abilityId: WAVE_BYE,
        unknownDword2: 0
      });
      assert.deepStrictEqual(uninits().at(-1)?.data, {
        unknownDword1: 3,
        abilityId: WAVE_BYE,
        unknownDword2: 1
      });
      mock.timers.tick(100);
      zone.abilitiesManager.processAbilityInit(
        zone,
        client,
        initPacket(WAVE_BYE, EMOTE_ABILITY_KEY) as any
      );
      mock.timers.tick(EMOTE_ABILITY_EXPIRE_MS - 1);
      assert.strictEqual(uninits().length, 1);
      mock.timers.tick(1);
      assert.strictEqual(uninits().length, 2);
    } finally {
      mock.timers.reset();
    }
  });

  await t.test("a repeated activation of a playing emote is ignored", () => {
    const sent = captureSends(zone);
    mock.timers.enable({ apis: ["setTimeout"] });
    try {
      for (let i = 0; i < 3; i++) {
        zone.abilitiesManager.processAbilityInit(
          zone,
          client,
          initPacket(WAVE_BYE, EMOTE_ABILITY_KEY) as any
        );
      }
      assert.strictEqual(
        sent.filter((packet) => packet.name == "Animation.Play").length,
        1
      );
      mock.timers.tick(EMOTE_ABILITY_EXPIRE_MS);
      zone.abilitiesManager.processAbilityInit(
        zone,
        client,
        initPacket(WAVE_BYE, EMOTE_ABILITY_KEY) as any
      );
      assert.strictEqual(
        sent.filter((packet) => packet.name == "Animation.Play").length,
        2
      );
      mock.timers.tick(EMOTE_ABILITY_EXPIRE_MS);
    } finally {
      mock.timers.reset();
    }
  });

  await t.test("night vision stop request is confirmed", () => {
    const sent = captureSends(zone);
    const handled = zone.abilitiesManager.processHotkeyAbilityUninit(
      zone,
      client,
      { unknownDword1: 1, abilityId: AbilityIds.NV_GOGGLES, unknownDword2: 0 }
    );
    assert.ok(handled);
    assert.deepStrictEqual(sent, [
      {
        name: "Abilities.UninitAbility",
        data: {
          unknownDword1: 3,
          abilityId: AbilityIds.NV_GOGGLES,
          unknownDword2: 1
        }
      }
    ]);
  });

  await zone.stop();
});

after(() => {
  setImmediate(() => {
    process.exit(0);
  });
});
