

export class LogicalPacket{
    sequence?: number;
    data: Buffer;
    isReliable: boolean;
    constructor(
        data: Buffer,
        sequence?: number
    ){
        this.sequence = sequence;
        this.data = data;
        this.isReliable = data[1] === 9 || data[1] === 13;
    }
}