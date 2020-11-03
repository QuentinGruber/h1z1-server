export declare class LoginProtocol {
    parse(data: any): false | {
        type: any;
        name: any;
        result: {};
    };
    pack(packetName: string, object: any): any;
}
