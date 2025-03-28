// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2025 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

import {
  createPositionUpdate,
  getCurrentServerTimeWrapper
} from "../../../utils/utils";
import { ZoneServer2016 } from "../zoneserver";
import { Vehicle2016 } from "../entities/vehicle";
import { ZoneClient2016 } from "../classes/zoneclient";

export class Plane extends Vehicle2016 {
  /** See Vehicle2016 */
  isManaged: boolean = false;
  destroyedEffect: number = 0;
  destroyedModel: number = 0;
  minorDamageEffect: number = 0;
  majorDamageEffect: number = 0;
  criticalDamageEffect: number = 0;
  supercriticalDamageEffect: number = 0;
  engineOn: boolean = false;
  isLocked: boolean = false;
  positionUpdate: any /*positionUpdate*/;
  engineRPM: number = 0;
  isInvulnerable: boolean = false;
  vehicleId: number;
  destroyedState = 0;
  constructor(
    characterId: string,
    transientId: number,
    actorModelId: number,
    position: Float32Array,
    rotation: Float32Array,
    server: ZoneServer2016,
    gameTime: number,
    vehicleId: number
  ) {
    super(
      characterId,
      transientId,
      actorModelId,
      position,
      rotation,
      server,
      gameTime,
      vehicleId
    );
    this.isMountable = false;
    this.state = {
      position: position,
      rotation: rotation,
      lookAt: new Float32Array([0, 0, 0, 1]),
      yaw: 0
    };
    this.vehicleId = vehicleId;
    this.npcRenderDistance = 400;
    this.isInvulnerable = true;
    this.positionUpdate = {
      ...createPositionUpdate(
        this.state.position,
        this.state.rotation,
        gameTime
      )
    };
  }

  pGetLightweightVehicle() {
    return {
      npcData: {
        ...this.pGetLightweight(),
        position: this.state.position,
        vehicleId: this.vehicleId,
        shaderGroupId: 0
      },
      positionUpdate: {
        ...this.positionUpdate
      }
    };
  }
  pGetFullVehicle(server: ZoneServer2016) {
    return {
      npcData: {
        ...this.pGetFull(server)
      },
      positionUpdate: {
        ...this.positionUpdate,
        sequenceTime: getCurrentServerTimeWrapper().getTruncatedU32(),
        position: this.state.position // trying to fix invisible characters/vehicles until they move
      },
      unknownArray1: [],
      unknownArray2: [],
      unknownArray3: [],
      unknownArray4: [],
      unknownArray5: [
        {
          unknownData1: {
            unknownData1: {}
          }
        }
      ],
      unknownArray6: [],
      unknownArray7: [],
      unknownArray8: [
        {
          unknownArray1: []
        }
      ]
    };
  }

  pGetPassengers(server: ZoneServer2016) {
    return this.getPassengerList().map((passenger) => {
      return {
        characterId: passenger,
        identity: {
          characterName: server._characters[passenger].name
        },
        unknownString1: server._characters[passenger].name,
        unknownByte1: 1
      };
    });
  }

  OnFullCharacterDataRequest(server: ZoneServer2016, client: ZoneClient2016) {
    server.sendData(
      client,
      "LightweightToFullVehicle",
      this.pGetFullVehicle(server)
    );
  }
}
