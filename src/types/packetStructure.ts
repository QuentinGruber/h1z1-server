type PacketDataTypeUnsignedInt = "uint8" | "uint16" | "uint32" | "uint64" | "uint64string"
type PacketDataTypeSignedInt = "int8" | "int16" | "int32" | "int64" | "int64string"
type PacketDataTypeFloat = "float"
type PacketDataTypeBasic = "boolean"
type PacketDataTypeString = "string" | "nullstring"
type PacketDataTypeArray = "array" | "array8"
type PacketDataTypeVector = "floatvector3" | "floatvector4"
type PacketDataTypeSpecial = "custom" | "rgb" | "schema"
type PacketDataTypeByte = "byteswithlength" | "bitflags" | "variabletype8" | "bytes"

export type PacketDataType = PacketDataTypeByte | PacketDataTypeUnsignedInt | PacketDataTypeSignedInt | PacketDataTypeString | PacketDataTypeFloat | PacketDataTypeBasic | PacketDataTypeArray | PacketDataTypeVector | PacketDataTypeSpecial

interface Flag {
  name: string,
  bit: number,
  defaultValue?: unknown,
}

export interface PacketField {
  name: string,
  type: PacketDataType,
  defaultValue?: unknown,
  parser?: unknown,
  packer?: unknown,
  fields?: PacketFields,
  length?: number | string,
  flags?: Flag[],
  elementType?: string,
  elementtype?: string,// TODO
  types?: unknown,
}
export type PacketFields = PacketField[];
export interface PacketObject {
  fields?: PacketFields,
  fn?: unknown,
  parse?: unknown,
  pack?: unknown,
}
export type PacketStructure = [string, number, PacketObject];

export type PacketStructures = PacketStructure[];
