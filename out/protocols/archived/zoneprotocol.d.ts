export var ZonePackets: typeof import("../../packets/archived/zonepackets");
export var ZoneProtocol: typeof ZoneProtocol;
declare function ZoneProtocol(): void;
declare class ZoneProtocol {
    pack(packetName: any, object: any, referenceData: any): any;
    parse(data: any, flags: any, fromClient: any, referenceData: any): {
        name: any;
        data: any;
    } | undefined;
}
declare namespace ZoneProtocol {
    function reloadPacketDefinitions(): void;
}
export {};
