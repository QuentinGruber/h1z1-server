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

import { ZoneClient } from "../../ZoneServer/classes/zoneclient";
import { Character2016 } from "./character";

export class ZoneClient2016 extends ZoneClient {
  character: Character2016;
  constructor(
    sessionId: number,
    soeClientId: string,
    loginSessionId: string,
    characterId: string,
    generatedTransient: number
  ) {
    super(
      sessionId,
      soeClientId,
      loginSessionId,
      characterId,
      generatedTransient
    );
      console.log("mdrrr")
    this.character = new Character2016(characterId, generatedTransient);
  }
}
