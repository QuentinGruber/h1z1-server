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

  private checkPluginsFolder(): void {
    if (!fs.existsSync(this.pluginDir)) {
      fs.mkdirSync(this.pluginDir);
      console.log(`Created plugins folder: ${this.pluginDir}`);
    }
  }

  private async loadPlugin(file: string) {
    const filePath = path.join(this.pluginDir, file),
      source = fs.readFileSync(filePath, 'utf-8'),
      output = ts.transpileModule(source, { compilerOptions: 
        { 
          module: ts.ModuleKind.CommonJS,
          //baseUrl: "./h1z1-server",
          paths: {
            "@h1z1-server/*": ["./*"],
          }, 
        } });


      

        async function runCode(compiledCode: string): Promise<any> {
          const sandbox = {
            require: require,
            module: module,
            exports: exports,
          };
        
          const script = new vm.Script(compiledCode);
          const context = vm.createContext(sandbox);
          script.runInContext(context);
        
          return sandbox.module.exports;
        }
        
        async function loadAndRunPlugin(compiledCode: string): Promise<any> {
          return runCode(compiledCode);
        }
        runCode(output.outputText)
          .then((result) => {
            console.log('Plugin executed successfully:', result.default);
            const test = new result.default();
            console.log(test)
            this.plugins.push(test);
          })
          .catch((error) => {
            console.error('Error executing plugin:', error);
          });



      
      //console.log(output.outputText)

      //output.outputText = output.outputText.replace("@h1z1-server", "../h1z1-server");

      //console.log(output.outputText)
      
      /*
      const module = import(`${output.outputText}`).then((m)=> {
        const test = new m();
        console.log("Loaded!")
        console.log(test)
      });
      */
     
      /*
      if (true/*module?.default?.prototype instanceof BasePlugin*//*) {
        const plugin = new module();
        this.plugins.push(plugin);
        console.log(`Loaded plugin: ${plugin.name}`);
      } else {
        console.warn(`Failed to load plugin ${file}`);
      }
      */
  }

  private async loadPlugins() {
    this.checkPluginsFolder();
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