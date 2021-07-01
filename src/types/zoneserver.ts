export interface Client {
  currentPOI?: number;
  firstLoading: boolean;
  isLoading: boolean;
  isInteracting: boolean;
  mountedVehicle?: string;
  mountedVehicleType: string;
  posAtLastRoutine: Float32Array;
  posAtLogoutStart: Float32Array;
  logoutTimer: NodeJS.Timeout | null;
  spawnedEntities: any[];
  gameClient: {
    currentWeather: Weather;
  };
  character: {
    characterId: string;
    transientId: number;
    name?: string;
    loadouts?: any;
    extraModel?: string;
    isRunning: boolean;
    resourcesUpdater?: any;
    resources: {
      health: number;
      stamina: number;
      virus: number;
      food: number;
      water: number;
    };
    currentLoadoutTab?: number;
    currentLoadoutId?: number;
    currentLoadout?: number;
    guid?: string;
    inventory?: Array<any>;
    factionId?: number;
    spawnLocation?: string;
    state: {
      position: Float32Array;
      rotation: Float32Array;
      lookAt: Float32Array;
      health: number;
      shield: number;
    };
  };
  loginSessionId?: string;
  sessionId: number;
  address: string;
  port: number;
  crcSeed: number;
  crcLength: number;
  clientUdpLength: number;
  serverUdpLength: number;
  sequences: any;
  compression: number;
  useEncryption: boolean;
  outQueue: any;
  outOfOrderPackets: any;
  nextAck: number;
  lastAck: number;
  inputStream: () => void;
  outputStream: () => void;
  outQueueTimer: () => void;
  ackTimer: () => void;
  lastPingTime: number;
  pingTimer: NodeJS.Timeout;
  savePositionTimer?: NodeJS.Timeout;
  outOfOrderTimer: () => void;
}

export interface SendZoneDetailsPacket {
  zoneName: string;
  zoneType: number;
  unknownBoolean1: boolean;
  skyData: Weather;
  zoneId1: number;
  zoneId2: number;
  nameId: number;
  unknownBoolean7: boolean;
}

export interface Weather {
  templateName?: string;
  name: string;
  unknownDword1: number;
  unknownDword2: number;
  unknownDword3: number;
  unknownDword4: number;
  fogDensity: number;
  fogGradient: number;
  fogFloor: number;
  unknownDword7: number;
  rain: number;
  temp: number;
  skyColor: number;
  cloudWeight0: number;
  cloudWeight1: number;
  cloudWeight2: number;
  cloudWeight3: number;
  sunAxisX: number;
  sunAxisY: number;
  sunAxisZ: number;
  unknownDword18: number;
  unknownDword19: number;
  unknownDword20: number;
  wind: number;
  unknownDword22: number;
  unknownDword23: number;
  unknownDword24: number;
  unknownDword25: number;
  unknownArray: UnknownArray[];
}

export interface UnknownArray {
  unknownDword1: number;
  unknownDword2: number;
  unknownDword3: number;
  unknownDword4: number;
  unknownDword5: number;
  unknownDword6: number;
  unknownDword7: number;
}

export interface skyData {
  templateName?: string;
  snow: number;
  snowMap: number;
  colorGradient: number;
  sunAxisX: number;
  sunAxisY: number;
  wind: number;
}

export interface SoeServer {
  on: (arg0: string, arg1: any) => void;
  start: (
    compression: any,
    crcSeed: any,
    crcLength: any,
    udpLength: any
  ) => void;
  stop: () => void;
  _sendPacket: () => void;
  sendAppData: (arg0: Client, arg1: any, arg2: undefined | any) => void;
  toggleEncryption: (arg0: Client) => void;
  setEncryption: (arg0: boolean) => void;
  deleteClient: (client: Client) => void;
}
