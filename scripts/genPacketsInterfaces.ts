import fs from "fs";
import {PacketDataType, PacketField, PacketFields} from "../src/types/packetStructure"
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
  bytes: "any[]",
  rgb: "number[]",
  variabletype8: "any",
  bitflags: "number[]",
  custom: "any",
  int64: "bigint",
  float: "number",
  array: "any[]",
  array8: "any[]",
  int64string: "string",
  uint64string: "string",
  floatvector3: "Float32Array",
  floatvector4: "Float32Array",
  byteswithlength: "any", // todo
  string: "string",
  nullstring : "string",
  schema: "custom handle",
  boolean: "boolean",
};
function getSchemaBody(schema: PacketFields) {
  let bodyInterfaceString = "";
  schema.forEach((element: PacketField) => {
    if (element.type === "schema") {
      bodyInterfaceString += "  ";
      bodyInterfaceString += element.name + "?";
      bodyInterfaceString += " :{\n";
      bodyInterfaceString += getSchemaBody(element.fields as PacketFields);
      bodyInterfaceString += "}\n";
    } else {
      const type = typeMap[element.type];
      const isOptionnal = element.defaultValue !== undefined;
      bodyInterfaceString += `  ${element.name}${isOptionnal ? "?" : ""}: ${
        type || "any"
      };\n`;
    }
  });
  return bodyInterfaceString;
}

function writeInterface(packets: any, name: string) {
  let packetsInterfaces = "/* prettier-ignore */ \n";
  const packetsIntercacesNames:string[] = []
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
