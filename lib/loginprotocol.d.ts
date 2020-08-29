export declare class LoginProtocol {
    constructor();
    parse(data: any): false | {
        type: any;
        name: any;
        result: any;
    };
    pack(packetName: string, object: any): any;
}
