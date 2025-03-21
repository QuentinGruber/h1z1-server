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

import { Characters } from "../ZoneServer2016/models/enums";

export function getCharacterModelData(payload: any): any {
  switch (payload.headType) {
    case Characters.FEMALE_BLACK:
      return {
        modelId: 9474,
        headActor: "SurvivorFemale_Head_03.adr",
        hairModel: "SurvivorFemale_Hair_ShortMessy.adr"
      };
    case Characters.MALE_BLACK:
      return {
        modelId: 9469,
        headActor: "SurvivorMale_Head_03.adr",
        hairModel: ""
      };
    case Characters.FEMALE_WHITE:
      return {
        modelId: 9474,
        headActor: "SurvivorFemale_Head_02.adr",
        hairModel: "SurvivorFemale_Hair_ShortBun.adr"
      };
    case Characters.FEMALE_WHITE_YOUNG:
      return {
        modelId: 9474,
        headActor: "SurvivorFemale_Head_02.adr",
        hairModel: "SurvivorFemale_Hair_ShortBun.adr"
      };
    case Characters.MALE_WHITE_BALD:
      return {
        modelId: 9469,
        headActor: "SurvivorMale_Head_02.adr",
        hairModel: ""
      };
    case Characters.MALE_WHITE:
    default:
      return {
        modelId: 9469,
        headActor: "SurvivorMale_Head_01.adr",
        hairModel: "SurvivorMale_Hair_ShortMessy.adr"
      };
  }
}
