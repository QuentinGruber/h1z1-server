export interface Packet {
  result: any;
  name: string;
  tunnelData: any;
  flags: any;
}
export interface httpServerMessage {
  type: string;
  requestId: number;
  data: any;
}
