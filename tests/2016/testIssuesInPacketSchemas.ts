import { H1Z1Protocol } from "../../h1z1-server";
const { H1Z1Packets } = new H1Z1Protocol("ClientProtocol_1080");

const allowedTypes: string[] = [
  "uint8",
  "int8",
  "uint16",
  "int16",
  "uint32",
  "int32",
  "uint64",
  "bytes",
  "rgb",
  "variabletype8",
  "bitflags",
  "custom",
  "int64",
  "float",
  "schema",
  "array",
  "array8",
  "uint64string",
  "floatvector3",
  "floatvector4",
  "byteswithlength",
  "string",
  "boolean",
];

Object.values(H1Z1Packets.Packets).forEach((packet: any) => {
  const { schema } = packet;
  checkFields(schema);
});

process.stdout.write("No issue detected in H1Z1 packets schemas");

function checkFields(schema: any) {
  const schemaNames: any[] = [];
  schema?.forEach((field: any) => {
    if (!allowedTypes.includes(field.type)) {
      throw new Error(
        `Unsupported type "${field.type}" in ${JSON.stringify(schema)}\n`
      );
    } else if (field.type === "array" || field.type === "schema") {
      checkFields(field.fields);
    } else if (schemaNames.includes(field.name)) {
      throw new Error(
        `Duplicated name "${field.name}" in ${JSON.stringify(schema)}\n`
      );
    }
    schemaNames.push(field.name);
  });
}
