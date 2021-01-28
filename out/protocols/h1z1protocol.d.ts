/// <reference types="node" />
interface UpdatePositionObject {
    flags: any;
    unknown2_int32: any;
    unknown3_int8: any;
    unknown4: any;
    position: any;
    unknown6_int32: any;
    unknown7_float: any;
    unknown8_float: any;
    unknown9_float: any;
    unknown10_float: any;
    unknown11_float: any;
    unknown12_float: any;
    unknown13_float: any;
    unknown14_float: any;
    unknown15_float: any;
}
interface PositionZoneToClient {
    unknown1_uint: number;
    positionData: UpdatePositionObject;
}
export declare class H1Z1Protocol {
    H1Z1Packets: any;
    protocolName: String;
    constructor(protocolName?: String);
    parseFacilityReferenceData(data: Buffer): {};
    parseWeaponDefinitionReferenceData(data: Buffer): {} | undefined;
    parseUpdatePositionClientToZone(data: Buffer, offset: number): {
        result: UpdatePositionObject;
    };
    parseUpdatePositionZoneToClient(data: Buffer, offset: number): {
        result: PositionZoneToClient;
    };
    pack(packetName: string, object: Buffer, referenceData: any): any;
    parse(data: Buffer, flags: any, fromClient: boolean, referenceData: any): {
        name: any;
        data: any;
    } | undefined;
    reloadPacketDefinitions(): void;
}
export {};
