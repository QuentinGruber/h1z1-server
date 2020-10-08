
import { EventEmitter } from "events";
import {GatewayServer} from "./gatewayserver";
import fs from "fs"
import packetHandlers from "./zonepackethandlers"
import {H1Z1Protocol as ZoneProtocol} from "./h1z1protocol"
import {MongoClient} from "mongodb"
const debug = require("debug")("ZoneServer")

function Int64String(value:number) {
  return "0x" + ("0000000000000000" + value.toString(16)).substr(-16);
}

export class ZoneServer extends EventEmitter {
  _gatewayServer:any;
  _protocol:any;
  _clients:any;
  _characters:any;
  _ncps:any;
  _usingMongo:any;
  _serverTime:any;
  _transientId:any;
  _guids:any;
  constructor(serverPort:number, gatewayKey:string, UsingMongo:boolean) {
    super()
    this._gatewayServer = new GatewayServer(
      "ExternalGatewayApi_3",
      serverPort,
      gatewayKey
    )
  this._protocol = new ZoneProtocol()
  this._clients = {}
  this._characters = {}
  this._ncps = {};
  this._usingMongo = UsingMongo;
  this._serverTime = 6662384021;
  this._transientId = 0;
  this._guids = {};

  this.on("data", function (err, client, packet) {
    if (err) {
      console.error(err);
    } else {
      if (packet.name != "KeepAlive") {
        debug(`Receive Data ${[packet.name]}`);
      }
      if (packetHandlers.default[packet.name]) {
        try {
          packetHandlers.default[packet.name](this, client, packet);
        } catch (e) {
          console.log(e);
        }
      } else {
        debug("Packet not implemented in packetHandlers");
      }
    }
  });

  this.on("login", function (err, client) {
    if (err) {
      console.error(err);
    } else {
      debug("login");
      /*
      this.sendRawData(
        client,
        fs.readFileSync(
          `${__dirname}/data/zone/ReferenceData.WeaponDefinitions.dat`
        )
      );
      this.sendRawData(
        client,
        fs.readFileSync(`${__dirname}/data/zone/InitializationParameters.dat`)
      );
        */
      var itemData = fs.readFileSync(
          `${__dirname}/data/ClientItemDefinitions.txt`,
          "utf8"
        ),
        itemLines = itemData.split("\n"),
        items = {};
      for (var i = 1; i < itemLines.length; i++) {
        var line = itemLines[i].split("^");
        if (line[0]) {
          items[line[0]] = line[1];
        }
      }
      const referenceData = { itemTypes: items };
      this.setReferenceData(referenceData);

      this.sendData(client, "SendZoneDetails", {
        zoneName: "Z1",
        unknownDword1: 4,
        unknownBoolean1: true,
        unknownFloat1: 1,
        skyData: {
          name: "sky",
          unknownDword1: 0,
          unknownDword2: 0,
          unknownDword3: 0,
          fog: 0, // fog intensity
          unknownDword5: 0,
          unknownDword6: 0,
          unknownDword7: 0,
          unknownDword8: 0,
          temperature: 40, // 0 : snow map , 40+ : spring map
          unknownDword10: 0,
          unknownDword11: 0,
          unknownDword12: 0,
          unknownDword13: 0,
          unknownDword14: 0,
          unknownDword15: 0,
          unknownDword16: 0,// sun orientation on x axis ???
          unknownDword17: 0, // night when 100
          unknownDword18: 0, 
          unknownDword19: 0,
          unknownDword20: 0,
          unknownDword21: 0,
          unknownDword22: 0,
          unknownDword23: 0,
          unknownDword24: 0,
          unknownDword25: 0,
          unknownArray: [],
        },
        zoneId1: 3905829720,
        zoneId2: 3905829720,
        nameId: 7699,
        unknownBoolean7: true,
      });

      /*
      this.sendRawData(
        client,
        fs.readFileSync(`${__dirname}/data/zone/ClientUpdateZonePopulation.dat`)
      );
      this.sendRawData(
        client,
        fs.readFileSync(
          `${__dirname}/data/zone/ClientUpdateRespawnLocations.dat`
        )
      );
*/
      this.sendData(client, "ClientGameSettings", {
        unknownDword1: 0,
        unknownDword2: 7,
        unknownBoolean1: true,
        unknownFloat1: 1,
        unknownDword3: 1,
        unknownDword4: 1,
        unknownDword5: 0,
        unknownFloat2: 12,
        unknownFloat3: 110,
      });

      /*
      this.sendRawData(
        client,
        fs.readFileSync(`${__dirname}/data/zone/Command.ItemDefinitions.dat`)
      );
*/
      /*
      this.sendRawData(client, fs.readFileSync(`${__dirname}/data/zone/VehicleBaseLoadVehicleDefinitionManager.dat`));
      this.sendRawData(
        client,
        fs.readFileSync(
          `${__dirname}/data/zone/ReferenceData.VehicleDefinitions.dat`
        )
      );
*/
      var self = JSON.parse(fs.readFileSync(`${__dirname}/data/sendself.json`));
      client.character.guid = self.data.guid = this.generateGuid();
      client.character.loadouts = self.data.characterLoadoutData.loadouts;
      client.character.inventory = self.data.inventory;
      client.character.factionId = self.data.factionId;
      client.character.name = self.data.identity.characterName;

      this.sendData(client, "SendSelfToClient", self);
      this.sendData(client, "PlayerUpdate.SetBattleRank", {
        characterId: client.character.characterId,
        battleRank: 100,
      });
    }
  });

  
  }


}