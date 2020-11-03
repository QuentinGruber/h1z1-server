export var SOEProtocol: typeof SOEProtocol;
export namespace SOEPackets {
    const PacketTypes: {};
    const Packets: {};
}
declare function SOEProtocol(): void;
declare class SOEProtocol {
    parse(data: any, crcSeed: any, compression: any): {
        soePacket: {
            type: any;
            name: any;
            result: any;
        } | {
            result: null;
            type?: undefined;
            name?: undefined;
        } | undefined;
        appPackets: any[];
    };
    pack(packetName: any, object: any, crcSeed: any, compression: any): any;
}
export {};
