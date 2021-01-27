export declare class LoginProtocol {
    LoginPackets: any;
    protocolName: String;
    constructor(protocolName?: String);
    parse(data: any): false | {
        type: any;
        name: any;
        result: {};
    };
    pack(packetName: string, object: any): any;
}
