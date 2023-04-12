export interface PacketField {
    name:string,
    type: string,
    defaultValue?:unknown,
    parser?:unknown,
    packer?:unknown,
    fields?:PacketFields,
    length?: number | string,
    flags?: unknown,
    elementType? : string,
    elementtype? : string,// TODO
    types?: unknown,
  }
  export type PacketFields = PacketField[];
  export interface PacketObject {
    fields?:PacketFields,
    fn?: unknown,
  }
  export type PacketStructure = [string,number,PacketObject];

  export type PacketStructures = PacketStructure[];