export function GatewayProtocol(): void;
export class GatewayProtocol {
    parse(data: any): {
        type: any;
        flags: number;
        fromClient: boolean;
        name: any;
        tunnelData: any;
        result?: undefined;
    } | {
        type: any;
        flags: number;
        name: any;
        result: {} | undefined;
        fromClient?: undefined;
        tunnelData?: undefined;
    } | undefined;
    pack(packetName: any, object: any): any;
}
import GatewayPackets = require("../packets/gatewaypackets");
export { GatewayPackets };
