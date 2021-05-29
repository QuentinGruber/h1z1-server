// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (c) 2021 Quentin Gruber
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

export default function PacketTableBuild(packets: string | any[], prefix?: string):any[] {
  prefix = prefix ? prefix + "." : "";
  const packetTypes:any = {};
  const packetDescriptors:any = {}; 
  for (let i = 0; i < packets.length; i++) {
    const packet = packets[i],
      name = prefix + packet[0],
      type = packet[1] >>> 0,
      packetDesc = packet[2];
    packetTypes[name] = type;
    packetDescriptors[type] = {
      type: type,
      name: name,
      schema: packetDesc.fields,
      fn: packetDesc.fn,
      parse: packetDesc.parse,
      pack: packetDesc.pack,
    };
  }
  return [packetTypes,packetDescriptors]
}