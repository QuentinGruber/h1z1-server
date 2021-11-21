export interface zoneObject {
    actorDefinition: string;
    renderDistance: number;
    instances: zoneObjectInstance[];
  }
  
export interface zoneObjectInstance {
    position: number[];
    rotation: number[];
    scale: number[];
    id: number;
    unknownByte1: number;
    unknownFloat1: number;
  }