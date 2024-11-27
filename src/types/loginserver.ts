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

import { CONNECTION_REJECTION_FLAGS } from "../utils/enums";

export interface GameServer {
  serverId: number;
  serverState: number;
  serverAddress: string;
  populationNumber: number;
  maxPopulationNumber: number;
  locked: boolean;
  name: string;
  nameId: number;
  description: string;
  descriptionId: number;
  reqFeatureId: number;
  serverInfo: string;
  populationLevel: number;
  populationData: string;
  allowedAccess: boolean;
  isDisabled: boolean;
  queueSize: number;
}

export interface BannedUser {
  name: string;
  loginSessionId: string;
  IP : string;
  active: boolean;
}


export interface ConnectionAllowed {
  status: 0|1;
  rejectionFlag?: CONNECTION_REJECTION_FLAGS
  message?: string;
}

export interface UserSession {
  serverId: number;
  authKey: string;
  guid: string;
}
