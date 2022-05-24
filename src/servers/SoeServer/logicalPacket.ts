

export class LogicalPacket{
    sequence?: number;
    data: Buffer;
    constructor(
        data: Buffer,
        sequence?: number
    ){
        this.sequence = sequence;
        this.data = data;
    }
}