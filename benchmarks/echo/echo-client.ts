
import { Worker } from "worker_threads";
import { Soeprotocol }  from "h1emu-core"
interface ServerTarger {
	address:string;
	port: number;
}
export class EchoClient {
    private _connection: Worker;
		private _serverTarget: ServerTarger; 
		private _protocol: Soeprotocol
		private _sequenceNumber: number = 0;
		constructor(serverAddress:string,serverPort:number){
		this._serverTarget = {address:serverAddress,port:serverPort}
		this._protocol = new Soeprotocol(false,0);
    this._connection = new Worker(
      `${__dirname}/../../out/servers/shared/workers/udpServerWorker.js`,
      {
        workerData: { serverPort: 0},
      }
    );
		
    this._connection.on("message", (message) => {
      const data = message.data;
			this.receiveData(data);
			})
	}
	sendSessionRequest(){
		const sessionRequestPacket = this._protocol.pack_session_request_packet(1245,0,512,"Echo");
		this._sendPhysicalPacket(sessionRequestPacket);
		console.log("send session request")
	}
	
	private _sendPhysicalPacket(packet: Uint8Array): void {
	  this._connection.postMessage(
	    {
	      type: "sendPacket",
	      data: {
	        packetData: packet,
	        length: packet.length,
	        port: this._serverTarget.port,
	        address: this._serverTarget.address,
	      },
	    }
	  );
	}
	
	sendData(): void{
		const data = new Uint8Array([1,2,3,4,5,6,7,8,9,10,100185,485188,5428,418])
	  const dataPacket = this._protocol.pack_data_packet(data,this._sequenceNumber)
		this._sequenceNumber++;
		this._sendPhysicalPacket(dataPacket);
	}	
	
	handlePacket(packet:any): void{
  	switch(packet.name){
			case "SessionReply":
				console.log("sessionreply received")
				this.sendData();
				break;
			case "MultiPacket":
        for (let i = 0; i < packet.sub_packets.length; i++) {
          const subPacket = packet.sub_packets[i];
          this.handlePacket(subPacket);
          }
				break;
			case "Data":
				this.sendData();
				break;
			case "Ack":
				break;
		}
	}
	
	receiveData(data:Uint8Array): void{
		const raw_parsed_data: string = this._protocol.parse(data);
		console.log("client received ",data)
		const parsed_data = JSON.parse(raw_parsed_data);
		this.handlePacket(parsed_data);
	}
}
