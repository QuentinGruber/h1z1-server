// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2024 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

import { GAME_VERSIONS } from "utils/enums";
import SoeClient from "../SoeServer/soeclient";
export default abstract class LoginClient extends SoeClient {
  authKey!: string;
  gameVersion!: GAME_VERSIONS;
}
