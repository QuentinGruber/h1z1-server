import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';
import { ZoneServer2016 } from "../zoneserver";
import * as vm from 'vm';

export abstract class BasePlugin {
  public abstract name: string;
  public abstract description: string;
  public abstract version: string;
  public abstract init(server: ZoneServer2016): void;
}

export class PluginManager {
  private plugins: Array<BasePlugin> = [];
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
    // TODO: CLEAR OUT FOLDER BEFORE LOADING ALL
    const filePath = path.join(this.pluginDir, file);
      const source = fs.readFileSync(filePath, 'utf-8');
      const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } });
      const compiledPath = path.join(this.outDir, file.replace(/\.ts$/, ".js"));
      fs.writeFileSync(compiledPath, output.outputText);

      const module = await import(compiledPath);



      //const module = eval(output.outputText);

      for (const exportedItem in module) {
        if (true/*module[exportedItem].prototype instanceof Plugin*/) {
          const plugin = new module[exportedItem]();
          this.plugins.push(plugin);
          console.log(`Loaded plugin: ${plugin.name}`);
        }
      }
    /*const filePath = path.join(this.pluginDir, file),
      source = fs.readFileSync(filePath, 'utf-8'),
      output = ts.transpileModule(source, { compilerOptions: 
        { 
          module: ts.ModuleKind.CommonJS,
          //baseUrl: "./h1z1-server",
          paths: {
            "@h1z1-server/*": ["./*"],
          }, 
        } });


  
      
      console.log(output.outputText)

      output.outputText = output.outputText.replace("@h1z1-server", "../h1z1-server");

      console.log(output.outputText)
      
      
      const module = import(`${output.outputText}`).then((m)=> {
        const test = new m();
        console.log("Loaded!")
        console.log(test)
      });
      
     
      
      if (truemodule?.default?.prototype instanceof BasePlugin) {
        const plugin = new module();
        this.plugins.push(plugin);
        console.log(`Loaded plugin: ${plugin.name}`);
      } else {
        console.warn(`Failed to load plugin ${file}`);
      }*/
      
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