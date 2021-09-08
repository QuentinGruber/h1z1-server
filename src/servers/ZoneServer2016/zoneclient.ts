import SOEClient from "../SoeServer/soeclient";
import ZoneClient from "servers/ZoneServer/zoneclient";
import Character2016 from "./character";

export default class ZoneClient2016 extends ZoneClient {
  character: Character2016;
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
