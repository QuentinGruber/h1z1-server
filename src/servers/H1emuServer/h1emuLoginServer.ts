import { H1emuServer } from "./shared/h1emuserver";

export class H1emuLoginServer extends H1emuServer{
    constructor(serverPort?:number){
        super(serverPort)
    }
}