import H1Z1Packets = require("../packets/h1z1packets");
export function H1Z1Protocol(): void;
export class H1Z1Protocol {
    pack(packetName: any, object: any, referenceData: any): any;
    parse(data: any, flags: any, fromClient: any, referenceData: any): {
        name: any;
        data: any;
    } | undefined;
    calculatePacketLength(data: any, referenceData: any): any;
}
export namespace H1Z1Protocol {
    function reloadPacketDefinitions(): void;
}
export { H1Z1Packets };
