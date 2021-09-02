import fs from "fs";
import loginpackets2015 from "../src/packets/LoginUdp/LoginUdp_9/loginpackets"
import loginpackets2016 from "../src/packets/LoginUdp/LoginUdp_11/loginpackets"

const h1z1packets2015 = require("../src/packets/ClientProtocol/ClientProtocol_860/h1z1packets")
const h1z1packets2016 = require("../src/packets/ClientProtocol/ClientProtocol_1080/h1z1packets")

const packetsFiles:any = {
    h1z1Packets2015:Object.keys(h1z1packets2015.PacketTypes),
    h1z1Packets2016:Object.keys(h1z1packets2016.PacketTypes),
    loginPackets2015:Object.keys(loginpackets2015.PacketTypes),
    loginPackets2016:Object.keys(loginpackets2016.PacketTypes),
};

const typePath:string = "../src/types/packets.ts"
let steamString ="";
Object.keys(packetsFiles).forEach(packetsFileName => {
    const packetsFile:string[] = packetsFiles[packetsFileName];
    steamString += `export type ${packetsFileName} = `
    for (let index = 0; index < packetsFile.length; index++) {
        const packet:string = packetsFile[index];
        steamString += `"${packet}" | `;
    }
    steamString += `; \n`;
});

fs.writeFileSync(typePath,steamString);
