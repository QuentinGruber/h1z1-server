import ZonePackets = require("../../packets/archived/zonepackets");
export function ZoneProtocol(): void;
export class ZoneProtocol {
    pack(packetName: any, object: any, referenceData: any): any;
    parse(data: any, flags: any, fromClient: any, referenceData: any): {
        name: any;
        data: any;
    } | undefined;
}
export namespace ZoneProtocol {
    function reloadPacketDefinitions(): void;
}
export { ZonePackets };
