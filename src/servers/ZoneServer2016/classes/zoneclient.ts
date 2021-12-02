// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (c) 2020 - 2021 Quentin Gruber
//   copyright (c) 2021 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

import SOEClient from "../../SoeServer/soeclient";
import { ZoneClient } from "servers/ZoneServer/classes/zoneclient";
import { Character2016 } from "./character";

export class ZoneClient2016 extends ZoneClient {
  character: Character2016;
  managedObjects: any[] = [];

  constructor(
    initialClient: SOEClient,
    loginSessionId: string,
    characterId: string,
    generatedTransient: number
  ) {
    super(initialClient, loginSessionId, characterId, generatedTransient);

    this.character = new Character2016(characterId, generatedTransient);
  }
}
