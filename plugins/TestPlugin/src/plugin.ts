import { BasePlugin } from "h1z1-server/out/servers/ZoneServer2016/managers/pluginmanager.js";
import { ZoneServer2016 } from "h1z1-server/out/servers/ZoneServer2016/zoneserver.js";
import {
  ZoneClient2016 as Client,
  ZoneClient2016
} from "h1z1-server/out/servers/ZoneServer2016/classes/zoneclient";

export default class ServerPlugin extends BasePlugin {
  public name = "testPlugin";
  public description = "testingPlugin";
  public author = "Kentin";
  public version = "0.0.0";
  public commands = [
    {
      name: "testPlugin",
      description: "",
      permissionLevel: 3, //
      execute: (
        server: ZoneServer2016,
        client: ZoneClient2016,
        args: string[]
      ) => {
        server.sendAlert(client, "work");
      }
    }
  ];

  /**
   * This method is called by PluginManager, do NOT call this manually
   * Use this method to set any plugin properties from the values in your config.yaml
   */
  public loadConfig(config: any) {}

  public async init(server: ZoneServer2016): Promise<void> {
    // @ts-ignore
    server.__PLUGIN_TEST__ = true;
  }
}
