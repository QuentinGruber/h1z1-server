/// <reference types="node" />
export var SOEInputStream: typeof SOEInputStream;
declare function SOEInputStream(cryptoKey: any): void;
declare class SOEInputStream {
    constructor(cryptoKey: any);
    _sequences: any[];
    _sequenceAdd: number;
    _nextSequence: number;
    _lastAck: number;
    _nextFragment: number;
    _lastProcessedFragment: number;
    _fragments: any[];
    _useEncryption: boolean;
    _rc4: import("crypto").Decipher;
    _processDataFragments(): void;
    write(data: any, sequence: any, fragment: any): void;
    setEncryption(value: any): void;
    toggleEncryption(): void;
}
export {};
