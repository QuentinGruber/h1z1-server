import { ZoneClient2016 } from "../classes/zoneclient";
import { Npc } from "../entities/npc";
import { Effects, Items, MeleeTypes } from "../models/enums";
import { ZoneServer2016 } from "../zoneserver";
import {
  CharacterAddEffectTagCompositeEffect,
  CharacterRemoveEffectTagCompositeEffect
} from "../../../types/zone2016packets";
import { DamageInfo } from "../../../types/zoneserver";
import {
  getCurrentServerTimeWrapper,
  getDistance,
  movePoint3D
} from "../../../utils/utils";

export const behavior_Zombie = (
  client: ZoneClient2016,
  server: ZoneServer2016,
  npc: Npc
) => {
  if (!npc.isAlive || !client || !client.character) {
    clearInterval(npc.behaviorInterval);
    npc.behaviorInterval = undefined;
    return;
  }
  if (!client.character.isAlive) {
    const angleInRadians2 = Math.atan2(
      client.character.state.position[0] - npc.state.position[0],
      client.character.state.position[2] - npc.state.position[2]
    );
    server.sendDataToAllWithSpawnedEntity(
      server._npcs,
      npc.characterId,
      "PlayerUpdatePosition",
      {
        transientId: npc.transientId,
        positionUpdate: {
          sequenceTime: getCurrentServerTimeWrapper().getTruncatedU32(),
          position: npc.state.position,
          unknown3_int8: 0,
          stance: 66565,
          engineRPM: 2,
          orientation: angleInRadians2,
          frontTilt: 0,
          sideTilt: 0,
          angleChange: 0,
          verticalSpeed: 0,
          horizontalSpeed: 0
        }
      }
    );
    server.sendDataToAllWithSpawnedEntity(
      server._npcs,
      npc.characterId,
      "Character.PlayAnimation",
      {
        characterId: npc.characterId,
        animationName: "Eating"
      }
    );
    setTimeout(() => {
      if (server._npcs[npc.characterId]) {
        server.sendDataToAllWithSpawnedEntity(
          server._npcs,
          npc.characterId,
          "Character.PlayAnimation",
          {
            characterId: npc.characterId,
            animationName: "EatingDone"
          }
        );
      }
    }, 3000);
    clearInterval(npc.behaviorInterval);
    npc.behaviorInterval = undefined;
    return;
  }
  if (getDistance(client.character.state.position, npc.state.position) <= 2) {
    const angleInRadians2 = Math.atan2(
      client.character.state.position[0] - npc.state.position[0],
      client.character.state.position[2] - npc.state.position[2]
    );
    server.sendDataToAllWithSpawnedEntity(
      server._npcs,
      npc.characterId,
      "PlayerUpdatePosition",
      {
        transientId: npc.transientId,
        positionUpdate: {
          sequenceTime: getCurrentServerTimeWrapper().getTruncatedU32() + 500,
          position: npc.state.position,
          unknown3_int8: 0,
          stance: 66565,
          engineRPM: 2,
          orientation: angleInRadians2,
          frontTilt: 0,
          sideTilt: 0,
          angleChange: 0,
          verticalSpeed: 0,
          horizontalSpeed: 0
        }
      }
    );
    if (!npc.isAttacking) {
      npc.setAttackingState(server);
      server.sendDataToAllWithSpawnedEntity(
        server._npcs,
        npc.characterId,
        "Character.PlayAnimation",
        {
          characterId: npc.characterId,
          animationName: "KnifeSlash"
        }
      );
      setTimeout(() => {
        const damageInfo: DamageInfo = {
          entity: client.character.characterId,
          weapon: Items.WEAPON_MACHETE01,
          damage: 2000, // need to figure out a good number for this
          causeBleed: false, // another method for melees to apply bleeding
          meleeType: MeleeTypes.BLADE,
          hitReport: {
            sessionProjectileCount: 0,
            characterId: client.character.characterId,
            position: client.character.state.position,
            unknownFlag1: 0,
            unknownByte2: 0,
            totalShotCount: 0,
            hitLocation: client.character.meleeHit.abilityHitLocation
          }
        };
        client.character.OnMeleeHit(server, damageInfo);
        const effectId: Effects =
          Effects["PFX_Impact_Zombie_Flesh" as keyof typeof Effects];
        if (client.character.effectTags.includes(effectId)) {
          server.sendDataToAllWithSpawnedEntity<CharacterRemoveEffectTagCompositeEffect>(
            server._characters,
            client.character.characterId,
            "Character.RemoveEffectTagCompositeEffect",
            {
              characterId: client.character.characterId,
              newEffectId: 0,
              effectId: effectId
            }
          );
        } else {
          client.character.effectTags.push(effectId);
        }
        server.sendDataToAllWithSpawnedEntity<CharacterAddEffectTagCompositeEffect>(
          server._characters,
          client.character.characterId,
          "Character.AddEffectTagCompositeEffect",
          {
            characterId: client.character.characterId,
            unknownDword1: effectId,
            effectId: effectId,
            unknownGuid: client.character.characterId,
            unknownDword2: 3
          }
        );
      }, 1000);
    }
    return;
  }
  if (getDistance(client.character.state.position, npc.state.position) > 30) {
    clearInterval(npc.behaviorInterval);
    npc.behaviorInterval = undefined;
    return;
  }
  const angleInRadians2 = Math.atan2(
    client.character.state.position[0] - npc.state.position[0],
    client.character.state.position[2] - npc.state.position[2]
  );
  const newPos = movePoint3D(npc.state.position, angleInRadians2, 2);
  const newPosFixed = server.getHeight(newPos);
  const angleInRadians = Math.atan2(
    newPosFixed[1] - npc.state.position[1],
    getDistance(npc.state.position, newPosFixed)
  );
  npc.state.position = newPosFixed;
  server.sendDataToAllWithSpawnedEntity(
    server._npcs,
    npc.characterId,
    "PlayerUpdatePosition",
    {
      transientId: npc.transientId,
      positionUpdate: {
        sequenceTime: getCurrentServerTimeWrapper().getTruncatedU32(),
        unknown3_int8: 0,
        stance: 66565,
        engineRPM: 0,
        orientation: angleInRadians2,
        frontTilt: 0,
        sideTilt: 0,
        angleChange: 0,
        verticalSpeed: angleInRadians,
        horizontalSpeed: 4
      }
    }
  );
  server.sendDataToAllWithSpawnedEntity(
    server._npcs,
    npc.characterId,
    "PlayerUpdatePosition",
    {
      transientId: npc.transientId,
      positionUpdate: {
        sequenceTime: getCurrentServerTimeWrapper().getTruncatedU32() + 500,
        position: npc.state.position,
        unknown3_int8: 0,
        stance: 66565,
        engineRPM: 2,
        orientation: angleInRadians2,
        frontTilt: 0,
        sideTilt: 0,
        angleChange: 0,
        verticalSpeed: angleInRadians,
        horizontalSpeed: 4
      }
    }
  );
};

export const behavior_Wolf = (
  client: ZoneClient2016,
  server: ZoneServer2016,
  npc: Npc
) => {
  if (!npc.isAlive || !client || !client.character) {
    clearInterval(npc.behaviorInterval);
    npc.behaviorInterval = undefined;
    return;
  }
  if (!client.character.isAlive) {
    const angleInRadians2 = Math.atan2(
      client.character.state.position[0] - npc.state.position[0],
      client.character.state.position[2] - npc.state.position[2]
    );
    server.sendDataToAllWithSpawnedEntity(
      server._npcs,
      npc.characterId,
      "PlayerUpdatePosition",
      {
        transientId: npc.transientId,
        positionUpdate: {
          sequenceTime: getCurrentServerTimeWrapper().getTruncatedU32(),
          position: npc.state.position,
          unknown3_int8: 0,
          stance: 66565,
          engineRPM: 2,
          orientation: angleInRadians2,
          frontTilt: 0,
          sideTilt: 0,
          angleChange: 0,
          verticalSpeed: 0,
          horizontalSpeed: 0
        }
      }
    );
    clearInterval(npc.behaviorInterval);
    npc.behaviorInterval = undefined;
    return;
  }
  if (getDistance(client.character.state.position, npc.state.position) < 2.5) {
    const angleInRadians2 = Math.atan2(
      client.character.state.position[0] - npc.state.position[0],
      client.character.state.position[2] - npc.state.position[2]
    );
    server.sendDataToAllWithSpawnedEntity(
      server._npcs,
      npc.characterId,
      "PlayerUpdatePosition",
      {
        transientId: npc.transientId,
        positionUpdate: {
          sequenceTime: getCurrentServerTimeWrapper().getTruncatedU32() + 500,
          position: npc.state.position,
          unknown3_int8: 0,
          stance: 66565,
          engineRPM: 2,
          orientation: angleInRadians2,
          frontTilt: 0,
          sideTilt: 0,
          angleChange: 0,
          verticalSpeed: 0,
          horizontalSpeed: 0
        }
      }
    );
    if (!npc.isAttacking) {
      npc.setAttackingState(server);
      server.sendDataToAllWithSpawnedEntity(
        server._npcs,
        npc.characterId,
        "Character.PlayAnimation",
        {
          characterId: npc.characterId,
          animationName: "KnifeSlash"
        }
      );
      setTimeout(() => {
        const damageInfo: DamageInfo = {
          entity: client.character.characterId,
          weapon: Items.WEAPON_MACHETE01,
          damage: 2000, // need to figure out a good number for this
          causeBleed: false, // another method for melees to apply bleeding
          meleeType: MeleeTypes.BLADE,
          hitReport: {
            sessionProjectileCount: 0,
            characterId: client.character.characterId,
            position: client.character.state.position,
            unknownFlag1: 0,
            unknownByte2: 0,
            totalShotCount: 0,
            hitLocation: client.character.meleeHit.abilityHitLocation
          }
        };
        client.character.OnMeleeHit(server, damageInfo);
        const effectId: Effects =
          Effects["PFX_Impact_Zombie_Flesh" as keyof typeof Effects];
        if (client.character.effectTags.includes(effectId)) {
          server.sendDataToAllWithSpawnedEntity<CharacterRemoveEffectTagCompositeEffect>(
            server._characters,
            client.character.characterId,
            "Character.RemoveEffectTagCompositeEffect",
            {
              characterId: client.character.characterId,
              newEffectId: 0,
              effectId: effectId
            }
          );
        } else {
          client.character.effectTags.push(effectId);
        }
        server.sendDataToAllWithSpawnedEntity<CharacterAddEffectTagCompositeEffect>(
          server._characters,
          client.character.characterId,
          "Character.AddEffectTagCompositeEffect",
          {
            characterId: client.character.characterId,
            unknownDword1: effectId,
            effectId: effectId,
            unknownGuid: client.character.characterId,
            unknownDword2: 3
          }
        );
      }, 500);
    }
    return;
  }
  if (getDistance(client.character.state.position, npc.state.position) > 40) {
    clearInterval(npc.behaviorInterval);
    npc.behaviorInterval = undefined;
    return;
  }
  const angleInRadians2 = Math.atan2(
    client.character.state.position[0] - npc.state.position[0],
    client.character.state.position[2] - npc.state.position[2]
  );
  const newPos = movePoint3D(npc.state.position, angleInRadians2, 4);
  const newPosFixed = server.getHeight(newPos);
  const angleInRadians = Math.atan2(
    newPosFixed[1] - npc.state.position[1],
    getDistance(npc.state.position, newPosFixed)
  );
  npc.state.position = newPosFixed;
  server.sendDataToAllWithSpawnedEntity(
    server._npcs,
    npc.characterId,
    "PlayerUpdatePosition",
    {
      transientId: npc.transientId,
      positionUpdate: {
        sequenceTime: getCurrentServerTimeWrapper().getTruncatedU32(),
        unknown3_int8: 0,
        stance: 66565,
        engineRPM: 2,
        orientation: angleInRadians2,
        frontTilt: 0,
        sideTilt: 0,
        angleChange: 0,
        verticalSpeed: angleInRadians,
        horizontalSpeed: 8
      }
    }
  );
  server.sendDataToAllWithSpawnedEntity(
    server._npcs,
    npc.characterId,
    "PlayerUpdatePosition",
    {
      transientId: npc.transientId,
      positionUpdate: {
        sequenceTime: getCurrentServerTimeWrapper().getTruncatedU32() + 500,
        position: npc.state.position,
        unknown3_int8: 0,
        stance: 66565,
        engineRPM: 2,
        orientation: angleInRadians2,
        frontTilt: 0,
        sideTilt: 0,
        angleChange: 0,
        verticalSpeed: angleInRadians,
        horizontalSpeed: 0
      }
    }
  );
};

export const behavior_Bear = (
  client: ZoneClient2016,
  server: ZoneServer2016,
  npc: Npc
) => {
  if (!npc.isAlive || !client || !client.character) {
    clearInterval(npc.behaviorInterval);
    npc.behaviorInterval = undefined;
    return;
  }
  if (!client.character.isAlive) {
    const angleInRadians2 = Math.atan2(
      client.character.state.position[0] - npc.state.position[0],
      client.character.state.position[2] - npc.state.position[2]
    );
    server.sendDataToAllWithSpawnedEntity(
      server._npcs,
      npc.characterId,
      "PlayerUpdatePosition",
      {
        transientId: npc.transientId,
        positionUpdate: {
          sequenceTime: getCurrentServerTimeWrapper().getTruncatedU32(),
          position: npc.state.position,
          unknown3_int8: 0,
          stance: 66565,
          engineRPM: 2,
          orientation: angleInRadians2,
          frontTilt: 0,
          sideTilt: 0,
          angleChange: 0,
          verticalSpeed: 0,
          horizontalSpeed: 0
        }
      }
    );
    clearInterval(npc.behaviorInterval);
    npc.behaviorInterval = undefined;
    return;
  }
  if (getDistance(client.character.state.position, npc.state.position) < 2.5) {
    const angleInRadians2 = Math.atan2(
      client.character.state.position[0] - npc.state.position[0],
      client.character.state.position[2] - npc.state.position[2]
    );
    server.sendDataToAllWithSpawnedEntity(
      server._npcs,
      npc.characterId,
      "PlayerUpdatePosition",
      {
        transientId: npc.transientId,
        positionUpdate: {
          sequenceTime: getCurrentServerTimeWrapper().getTruncatedU32() + 500,
          position: npc.state.position,
          unknown3_int8: 0,
          stance: 66565,
          engineRPM: 2,
          orientation: angleInRadians2,
          frontTilt: 0,
          sideTilt: 0,
          angleChange: 0,
          verticalSpeed: 0,
          horizontalSpeed: 0
        }
      }
    );
    if (!npc.isAttacking) {
      npc.setAttackingState(server);
      server.sendDataToAllWithSpawnedEntity(
        server._npcs,
        npc.characterId,
        "Character.PlayAnimation",
        {
          characterId: npc.characterId,
          animationName: "KnifeSlash"
        }
      );
      setTimeout(() => {
        const damageInfo: DamageInfo = {
          entity: client.character.characterId,
          weapon: Items.WEAPON_MACHETE01,
          damage: 6000, // need to figure out a good number for this
          causeBleed: false, // another method for melees to apply bleeding
          meleeType: MeleeTypes.BLADE,
          hitReport: {
            sessionProjectileCount: 0,
            characterId: client.character.characterId,
            position: client.character.state.position,
            unknownFlag1: 0,
            unknownByte2: 0,
            totalShotCount: 0,
            hitLocation: client.character.meleeHit.abilityHitLocation
          }
        };
        client.character.OnMeleeHit(server, damageInfo);
        const effectId: Effects =
          Effects["PFX_Impact_Zombie_Flesh" as keyof typeof Effects];
        if (client.character.effectTags.includes(effectId)) {
          server.sendDataToAllWithSpawnedEntity<CharacterRemoveEffectTagCompositeEffect>(
            server._characters,
            client.character.characterId,
            "Character.RemoveEffectTagCompositeEffect",
            {
              characterId: client.character.characterId,
              newEffectId: 0,
              effectId: effectId
            }
          );
        } else {
          client.character.effectTags.push(effectId);
        }
        server.sendDataToAllWithSpawnedEntity<CharacterAddEffectTagCompositeEffect>(
          server._characters,
          client.character.characterId,
          "Character.AddEffectTagCompositeEffect",
          {
            characterId: client.character.characterId,
            unknownDword1: effectId,
            effectId: effectId,
            unknownGuid: client.character.characterId,
            unknownDword2: 3
          }
        );
      }, 500);
    }
    return;
  }
  if (getDistance(client.character.state.position, npc.state.position) > 30) {
    clearInterval(npc.behaviorInterval);
    npc.behaviorInterval = undefined;
    return;
  }
  const angleInRadians2 = Math.atan2(
    client.character.state.position[0] - npc.state.position[0],
    client.character.state.position[2] - npc.state.position[2]
  );
  const newPos = movePoint3D(npc.state.position, angleInRadians2, 4);
  const newPosFixed = server.getHeight(newPos);
  const angleInRadians = Math.atan2(
    newPosFixed[1] - npc.state.position[1],
    getDistance(npc.state.position, newPosFixed)
  );
  npc.state.position = newPosFixed;
  server.sendDataToAllWithSpawnedEntity(
    server._npcs,
    npc.characterId,
    "PlayerUpdatePosition",
    {
      transientId: npc.transientId,
      positionUpdate: {
        sequenceTime: getCurrentServerTimeWrapper().getTruncatedU32(),
        unknown3_int8: 0,
        stance: 66565,
        engineRPM: 2,
        orientation: angleInRadians2,
        frontTilt: 0,
        sideTilt: 0,
        angleChange: 0,
        verticalSpeed: angleInRadians,
        horizontalSpeed: 8
      }
    }
  );
  server.sendDataToAllWithSpawnedEntity(
    server._npcs,
    npc.characterId,
    "PlayerUpdatePosition",
    {
      transientId: npc.transientId,
      positionUpdate: {
        sequenceTime: getCurrentServerTimeWrapper().getTruncatedU32() + 500,
        position: npc.state.position,
        unknown3_int8: 0,
        stance: 66565,
        engineRPM: 2,
        orientation: angleInRadians2,
        frontTilt: 0,
        sideTilt: 0,
        angleChange: 0,
        verticalSpeed: angleInRadians,
        horizontalSpeed: 0
      }
    }
  );
};

export const behavior_Deer = (
  client: ZoneClient2016,
  server: ZoneServer2016,
  npc: Npc
) => {
  if (
    !npc.isAlive ||
    !client ||
    !client.character ||
    !client.character.isAlive
  ) {
    clearInterval(npc.behaviorInterval);
    npc.behaviorInterval = undefined;
    return;
  }
  if (getDistance(client.character.state.position, npc.state.position) > 50) {
    clearInterval(npc.behaviorInterval);
    npc.behaviorInterval = undefined;
    return;
  }
  // Calculate the angle in radians
  const angleInRadians2 = Math.atan2(
    npc.state.position[0] - client.character.state.position[0],
    npc.state.position[2] - client.character.state.position[2]
  );
  const newPos = movePoint3D(npc.state.position, angleInRadians2, 3.5);
  const newPosFixed = server.getHeight(newPos);
  const angleInRadians = Math.atan2(
    newPosFixed[1] - npc.state.position[1],
    Math.abs(getDistance(npc.state.position, newPosFixed))
  );
  npc.state.position = newPosFixed;
  server.sendDataToAllWithSpawnedEntity(
    server._npcs,
    npc.characterId,
    "PlayerUpdatePosition",
    {
      transientId: npc.transientId,
      positionUpdate: {
        sequenceTime: getCurrentServerTimeWrapper().getTruncatedU32(),
        unknown3_int8: 0,
        stance: 66565,
        engineRPM: 2,
        orientation: angleInRadians2,
        frontTilt: 0,
        sideTilt: 0,
        angleChange: 0,
        verticalSpeed: angleInRadians,
        horizontalSpeed: 7
      }
    }
  );
  server.sendDataToAllWithSpawnedEntity(
    server._npcs,
    npc.characterId,
    "PlayerUpdatePosition",
    {
      transientId: npc.transientId,
      positionUpdate: {
        sequenceTime: getCurrentServerTimeWrapper().getTruncatedU32() + 500,
        position: npc.state.position,
        unknown3_int8: 0,
        stance: 66565,
        engineRPM: 2,
        orientation: angleInRadians2,
        frontTilt: 0,
        sideTilt: 0,
        angleChange: 0,
        verticalSpeed: angleInRadians,
        horizontalSpeed: 0
      }
    }
  );
};
