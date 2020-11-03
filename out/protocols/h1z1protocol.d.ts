export var H1Z1Packets: typeof import("../packets/h1z1packets");
export var H1Z1Protocol: typeof H1Z1Protocol;
declare function H1Z1Protocol(): void;
declare class H1Z1Protocol {
    pack(packetName: any, object: any, referenceData: any): any;
    parse(data: any, flags: any, fromClient: any, referenceData: any): {
        name: any;
        data: any;
    } | undefined;
}
declare namespace H1Z1Protocol {
    function reloadPacketDefinitions(): void;
}
export {};
