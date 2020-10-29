/// <reference types="node" />
export var SOEOutputStream: typeof SOEOutputStream;
declare function SOEOutputStream(cryptoKey: any, fragmentSize: any): void;
declare class SOEOutputStream {
    constructor(cryptoKey: any, fragmentSize: any);
    _useEncryption: boolean;
    _fragmentSize: any;
    _sequence: number;
    _lastAck: number;
    _cache: any[];
    _rc4: import("crypto").Cipher;
    write(data: any, overrideEncryption: any): void;
    ack(sequence: any): void;
    resendData(sequence: any): void;
    setEncryption(value: any): void;
    toggleEncryption(): void;
    setFragmentSize(value: any): void;
}
export {};
