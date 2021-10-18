import { H1emuServer } from "./shared/h1emuserver";

export class H1emuZoneServer extends H1emuServer{
    constructor(serverPort?:number){
        super(serverPort)
    }
}