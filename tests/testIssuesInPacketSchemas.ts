import { H1Z1Protocol } from "../h1z1-server.js"
const { H1Z1Packets } = new H1Z1Protocol("ClientProtocol_860")

Object.values(H1Z1Packets.Packets).forEach((packet:any) => {
  const { schema } = packet;
  checkFields(schema)
});

process.stdout.write("No issue detected in H1Z1 packets schemas")

function checkFields(schema:any){
  const schemaNames:any[] = []
    schema?.forEach((field:any) => {
      if(field.type === "array" || field.type === "schema"){
        checkFields(field.fields)
      }
      else if(schemaNames.includes(field.name)){
        throw new Error(`Duplicated name "${field.name}" in ${JSON.stringify(schema)}\n`);
      }
      schemaNames.push(field.name)
    });
}