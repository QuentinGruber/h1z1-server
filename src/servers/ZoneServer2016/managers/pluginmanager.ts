import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';
import { ZoneServer2016 } from "../zoneserver";

export default abstract class BasePlugin {
  public abstract name: string;
  public abstract description: string;
  public abstract version: string;
  public abstract init(server: ZoneServer2016): void;
}

export class PluginManager {
  private plugins: Array<BasePlugin> = [];
  private pluginDir = path.join(process.cwd(), 'plugins');

  private checkPluginsFolder(): void {
    if (!fs.existsSync(this.pluginDir)) {
      fs.mkdirSync(this.pluginDir);
      console.log(`Created plugins folder: ${this.pluginDir}`);
    }
  }

  private loadPlugins(): void {
    this.checkPluginsFolder();
    const pluginFiles = fs.readdirSync(this.pluginDir).filter(file => file.endsWith('.ts'));

    for (const file of pluginFiles) {
      const filePath = path.join(this.pluginDir, file),
      source = fs.readFileSync(filePath, 'utf-8'),
      output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }),
      module = eval(output.outputText);

      if (module?.default?.prototype instanceof BasePlugin) {
        const plugin = new module.default();
        this.plugins.push(plugin);
        console.log(`Loaded plugin: ${plugin.name}`);
      } else {
        console.warn(`Failed to load plugin ${file}`);
      }
    }
  }

  public initializePlugins(server: ZoneServer2016): void {
    this.loadPlugins();

    for (const plugin of this.plugins) {
      plugin.init(server);
    }

    if(this.plugins.length == 0) {
      console.log(`No plugins loaded.`);
    }
  }
}