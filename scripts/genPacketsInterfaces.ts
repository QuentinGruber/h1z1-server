import fs from "fs";
import { PacketDataType, PacketField, PacketFields } from "../src/types/packetStructure"
const h1z1packets2015 = require("../src/packets/ClientProtocol/ClientProtocol_860/h1z1packets");
const h1z1packets2016 = require("../src/packets/ClientProtocol/ClientProtocol_1080/h1z1packets");
const LoginUdp_9 = require("../src/packets/LoginUdp/LoginUdp_9/loginpackets");
const LoginUdp_11 = require("../src/packets/LoginUdp/LoginUdp_11/loginpackets");
const gatewayPackets = require("../src/packets/gatewaypackets");
const typeMap: Record<PacketDataType, string> = {
  uint8: "number",
  int8: "number",
  uint16: "number",
  int16: "number",
  uint32: "number",
  int32: "number",
  uint64: "bigint",
  bytes: "unknown[]",
  rgb: "number[]",
  variabletype8: "unknown",
  bitflags: "unknown",
  custom: "unknown",
  int64: "bigint",
  float: "number",
  array: "unknown[]",
  array8: "unknown[]",
  int64string: "string",
  uint64string: "string",
  floatvector3: "Float32Array",
  floatvector4: "Float32Array",
  // any type can be pass to a byteswithlength field but only the specified type in the table can be read
  byteswithlength: "unknown",
  string: "string",
  nullstring: "string",
  schema: "unknown",
  boolean: "boolean",
};

function addSimpleType(element: PacketField): String {

  const type = typeMap[element.type];
  const isOptional = element.defaultValue !== undefined;
  return `  ${element.name}${isOptional ? "?" : ""}: ${type || "any"
    };\n`;
}
function getSchemaBody(schema: PacketFields) {
  let bodyInterfaceString = "";
  schema.forEach((element: PacketField) => {
    if (element.type === "schema" || element.type === "byteswithlength") {
      if (element.fields) {
        bodyInterfaceString += "  ";
        bodyInterfaceString += element.name;
        bodyInterfaceString += " :{\n";
        bodyInterfaceString += getSchemaBody(element.fields as PacketFields);
        bodyInterfaceString += "}";
        bodyInterfaceString += ";\n";
      }
      else {
        bodyInterfaceString += addSimpleType(element);
      }
    }
    else if (element.type === "bitflags") {
      if (element.flags) {
        bodyInterfaceString += "  ";
        bodyInterfaceString += element.name;
        bodyInterfaceString += ":{\n";
        for (const flag of element.flags) {
          bodyInterfaceString += "     ";
          const isOptional = element.defaultValue !== undefined;
          bodyInterfaceString += `${flag.name}${isOptional?"?":""}: number,\n`;
        }
        bodyInterfaceString += "}";
        bodyInterfaceString += ";\n";
      }
      else {
        bodyInterfaceString += addSimpleType(element);
      }
    }
    else {
      bodyInterfaceString += addSimpleType(element);
    }
  });
  return bodyInterfaceString;
}

function writeInterface(packets: any, name: string) {
  let packetsInterfaces = "/* prettier-ignore */ \n";
  const packetsIntercacesNames: string[] = []
  Object.values(packets).forEach((packet: any) => {
    const { schema } = packet;
    let name;
    if (packet.name.includes(".")) {
      name = packet.name.replace(".", "");
    } else {
      name = packet.name;
    }
    let packetInterfaceString = "export interface " + name + " {\n";
    if (schema) {
      packetsIntercacesNames.push(name);
      packetInterfaceString += getSchemaBody(schema);
      packetInterfaceString += "}\n";
      packetsInterfaces += packetInterfaceString;
    }
  });
  packetsInterfaces += `export type ${name} = ${packetsIntercacesNames.join(" | ")};`
  fs.writeFileSync(`./src/types/${name}.ts`, packetsInterfaces);
}

writeInterface(h1z1packets2016.Packets, "zone2016packets");
writeInterface(h1z1packets2015.Packets, "zone2015packets");
writeInterface(LoginUdp_9.default.Packets, "LoginUdp_9packets");
writeInterface(LoginUdp_11.default.Packets, "LoginUdp_11packets");
writeInterface(gatewayPackets.default.Packets, "gatewaypackets");
