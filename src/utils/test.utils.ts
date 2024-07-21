import { ZoneClient2016 } from "../servers/ZoneServer2016/classes/zoneclient";
import { Character2016 } from "../servers/ZoneServer2016/entities/character";
import { ZoneServer2016 } from "../servers/ZoneServer2016/zoneserver";

export function createFakeCharacter(zone: ZoneServer2016) {
  const characterId = zone.generateGuid();
  const transientId = zone.getTransientId(characterId);
  const character = new Character2016(characterId, transientId, zone);
  zone._characters[characterId] = character;
  return character;
}

export function createFakeZoneClient(
  zone: ZoneServer2016,
  character: Character2016
) {
  const randomInt = Math.floor(Math.random() * 1000);
  const client = new ZoneClient2016(
    randomInt,
    "fake",
    "fake",
    character.characterId,
    character.transientId,
    zone
  );
  zone._clients[randomInt] = client;
  return client;
}
