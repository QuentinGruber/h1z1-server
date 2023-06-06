import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';
import { ZoneServer2016 } from "../zoneserver";

export abstract class BasePlugin {
  public abstract name: string;
  public abstract description: string;
  public abstract version: string;
  public abstract init(server: ZoneServer2016): void;
}

export class PluginManager {
  private plugins: Array<BasePlugin> = [];
  get pluginCount() {
    return this.plugins.length;
  }
  private pluginDir = path.join(process.cwd(), 'plugins');
  private outDir = path.join(this.pluginDir, 'out');

  private checkPluginsFolder(): void {
    if (!fs.existsSync(this.pluginDir)) {
      fs.mkdirSync(this.pluginDir);
      console.log(`Created plugins folder: ${this.pluginDir}`);
    }
  }

  private checkOutFolder(): void {
    if (!fs.existsSync(this.outDir)) {
      fs.mkdirSync(this.outDir);
      console.log(`Created out folder: ${this.outDir}`);
    }
  }

  private async loadPlugin(file: string) {
    // TODO: CLEAR "OUT" FOLDER BEFORE LOADING ALL

    const filePath = path.join(this.pluginDir, file),
      source = fs.readFileSync(filePath, 'utf-8'),
      output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021} }),
      compiledPath = path.join(this.outDir, file.replace(/\.ts$/, ".js"));
      
      fs.writeFileSync(compiledPath, output.outputText.replaceAll("@h1z1-server", "../../h1z1-server"));

      // clear previous import in case of plugin reload
      delete require.cache[require.resolve(compiledPath)];
      const module = await import(compiledPath);
      for (const exportedItem in module) {
        if (module[exportedItem].prototype instanceof BasePlugin) {
          const plugin = new module[exportedItem]();
          this.plugins.push(plugin);
          console.log(`Loaded plugin: ${plugin.name}`);
        }
      }
  }

  private async loadPlugins() {
    this.checkPluginsFolder();
    this.checkOutFolder();
    const pluginFiles = fs.readdirSync(this.pluginDir).filter(file => file.endsWith('.ts'));

    for (const file of pluginFiles) {
      try {
        await this.loadPlugin(file)
      }
      catch(e: any) {
        console.error(e);
      }
    }
  }

  public async initializePlugins(server: ZoneServer2016) {
    this.plugins = [];
    await this.loadPlugins();

    for (const plugin of this.plugins) {
      
      try {
        plugin.init(server);
      }
      catch(e: any) {
        console.error(e);
      }
    }

    if(this.plugins.length == 0) {
      console.log(`No plugins loaded.`);
    }
  }
}