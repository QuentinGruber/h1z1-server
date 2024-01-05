import test from "node:test";
import { H1Z1Protocol } from "../../h1z1-server";
const { H1Z1Packets } = new H1Z1Protocol("ClientProtocol_1080");
const { H1Z1Packets: H1Z1Packets2015 } = new H1Z1Protocol("ClientProtocol_860");

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
  "nullstring"
];

test("Check for issues in packet schemas 2016", async () => {
  Object.values(H1Z1Packets.Packets).forEach((packet: any) => {
    const { schema } = packet;
    checkFields(schema);
  });
});
test("Check for issues in packet schemas 2015", async () => {
  Object.values(H1Z1Packets2015.Packets).forEach((packet: any) => {
    const { schema } = packet;
    checkFields(schema);
  });
});

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
