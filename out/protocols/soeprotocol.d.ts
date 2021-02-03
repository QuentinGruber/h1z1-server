declare const debug: any;
declare const PacketTable: any;
declare const appendCRC: any;
declare const stand_alone_packets: (string | number | {
    parse: (data: any) => {
        PingId: any;
        Data: any;
    };
    pack: (data: any) => any;
})[][];
declare const packets: ((string | number | {
    parse: (data: any, crcSeed: number, compression: number, isSubPacket: boolean) => {
        crcLength: any;
        sessionId: any;
        udpLength: any;
        protocol: any;
    };
    pack: (packet: any, crcSeed: number, compression: number, isSubPacket: boolean) => any;
})[] | (string | number | {
    parse: (data: any, crcSeed: number, compression: number, isSubPacket: boolean) => {
        crcSeed: any;
        crcLength: any;
        sessionId: any;
        compression: any;
        udpLength: any;
    };
    pack: (packet: any, crcSeed: number, compression: number, isSubPacket: boolean) => any;
})[] | (string | number | {
    parse: (data: any, crcSeed: number, compression: number, isSubPacket: boolean, appData: any) => {
        subPackets: ({
            type: any;
            name: any;
            result: any;
        } | {
            result: null;
            type?: undefined;
            name?: undefined;
        } | undefined)[];
    };
    pack: (packet: any, crcSeed: number, compression: number, isSubPacket: boolean) => any;
})[] | (string | number | {
    parse: (data: any) => {};
    pack: () => any;
})[] | {}[] | (string | number | {
    parse: (data: any, crcSeed: number, compression: number, isSubPacket: boolean, appData: any) => {
        channel: number;
        sequence: any;
        crc: any;
        data: any;
    };
    pack: (packet: any, crcSeed: number, compression: number, isSubPacket: boolean) => any;
})[] | (string | number | {
    parse: (data: any, crcSeed: number, compression: number, isSubPacket: boolean) => {
        channel: number;
        sequence: any;
    };
    pack: (packet: any, crcSeed: number, compression: number, isSubPacket: boolean) => any;
})[])[];
declare const SOEPackets: {
    PacketTypes: {};
    Packets: {};
};
declare const StandAlonePackets: {
    PacketTypes: {};
    Packets: {};
};
declare function packSOEPacket(packetName: string, object: any, crcSeed: number, compression: number, isSubPacket?: boolean): any;
declare function parseSOEPacket(data: any, crcSeed: number, compression: number, isSubPacket: boolean, appData: any): {
    type: any;
    name: any;
    result: any;
} | {
    result: null;
    type?: undefined;
    name?: undefined;
} | undefined;
declare function writeDataLength(length: number): any;
declare function readDataLength(data: any, offset: number): {
    value: any;
    numBytes: number;
};
declare class SOEProtocol {
    parse(data: any, crcSeed: number, compression: number): {
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
    pack(packetName: string, object: any, crcSeed: number, compression: number): any;
}
