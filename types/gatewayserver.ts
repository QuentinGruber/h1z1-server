import {Packet} from "./shared"

export interface Client {
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
  outOfOrderTimer: () => void;
}

export interface GatewayProtocolInterface {
  pack: (arg0: string, arg1: any) => Packet;
  parse: (arg0: any) => Packet;
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