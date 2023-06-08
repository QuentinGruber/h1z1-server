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

  private async loadPluginFile(file: string) {
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

  // For loading entire plugin folders
  private async loadPluginFolder(projectPath: string) {

    const configPath = path.resolve(projectPath, 'tsconfig.json');

    // Load the tsconfig.json file
    const configFile = ts.readConfigFile(configPath, ts.sys.readFile);

    // Parse the JSON configuration file
    const config = ts.parseJsonConfigFileContent(
      configFile.config,
      ts.sys,
      projectPath
    );

    // Create the TypeScript program using the parsed configuration
    const program = ts.createProgram(config.fileNames, config.options);

    // Perform the actual transpilation
    program.emit();

    const compiledPath = path.join(
      this.pluginDir,
      projectPath,
      'plugin.js' // Replace with the appropriate file name of the compiled module
    );
    
    this.traverseAndReplace(path.join(this.pluginDir, projectPath), "@h1z1-server", "../../../h1z1-server");

    delete require.cache[require.resolve(compiledPath)];
      const module = await import(compiledPath);
      //for (const exportedItem in module) {
        if (module.default.ServerPlugin.default.prototype instanceof BasePlugin) {
          console.log(module)
          const plugin = new module.default.ServerPlugin.default();//[exportedItem]()
          this.plugins.push(plugin);
          console.log(`Loaded plugin: ${plugin.name}`);
        }
      //}
  }

  private traverseAndReplace(directory: string, searchString: string, replaceString: string): void {
    const files = fs.readdirSync(directory)
    files.forEach(file => {
      const filePath = path.join(directory, file);
  
      const stats = fs.statSync(filePath)
      if (stats.isDirectory()) {
        this.traverseAndReplace(filePath, searchString, replaceString);
      } else if (stats.isFile() && file.endsWith('.js')) {
        this.replaceInFile(filePath, searchString, replaceString);
      }
    });
  }
  
  private replaceInFile(filePath: string, searchString: string, replaceString: string): void {
    const content = fs.readFileSync(filePath, 'utf8')
  
    const replacedContent = content.replace(new RegExp(searchString, 'g'), replaceString);
  
    fs.writeFileSync(filePath, replacedContent, 'utf8')

    console.log(`Replaced in file: ${filePath}`);
  }




  private async loadPlugins() {
    this.checkPluginsFolder();
    /*
    this.checkOutFolder();
    const pluginFiles = fs.readdirSync(this.pluginDir).filter(file => file.endsWith('.ts'));
    
    for (const file of pluginFiles) {
      try {
        await this.loadPluginFile(file)
      }
      catch(e: any) {
        console.error(e);
      }
    }
    */

    const pluginFolders = fs.readdirSync(this.pluginDir).filter(folder => 
     // const stats = fs.statSync(folder);
      !(folder == "node_modules") /*&& stats.isDirectory()*/
    );
    
    for (const folder of pluginFolders) {
      console.log(folder)
      try {
        await this.loadPluginFolder(folder)
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