// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2023 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

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

function searchFolder(directory: string, folderName: string): string | null {
  const files = fs.readdirSync(directory);

  for (const file of files) {
    const filePath = path.join(directory, file);
    const stats = fs.statSync(filePath);

    if (stats.isDirectory()) {
      if (file === folderName) {
        return filePath; // Found the folder!
      } else {
        const subFolder = searchFolder(filePath, folderName);
        if (subFolder) {
          return subFolder; // Found the folder in a sub-folder!
        }
      }
    }
  }

  return null; // Folder not found
}

export class PluginManager {
  private plugins: Array<BasePlugin> = [];
  get pluginCount() {
    return this.plugins.length;
  }
  private pluginDir = path.join(process.cwd(), 'plugins');
  private outDir = path.join(this.pluginDir, 'out');
  private moduleDir = searchFolder(process.cwd(), "h1z1-server") || "";

  private checkPluginsFolder(): void {
    if (!fs.existsSync(this.pluginDir)) {
      fs.mkdirSync(this.pluginDir);
      console.log(`Created plugins folder: ${this.pluginDir}`);
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
    
    this.traverseAndReplace(path.join(this.pluginDir, projectPath), "@h1z1-server", this.moduleDir);

    delete require.cache[require.resolve(compiledPath)];
    const module = await import(compiledPath);
    if (module.default.ServerPlugin.default.prototype instanceof BasePlugin) {
      const plugin = new module.default.ServerPlugin.default();
      this.plugins.push(plugin);
      console.log(`Loaded plugin: ${plugin.name}`);
    }
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
    const content = fs.readFileSync(filePath, 'utf8'),
    replacedContent = content.replace(new RegExp(searchString, 'g'), replaceString);
  
    fs.writeFileSync(filePath, replacedContent, 'utf8');
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

    const pluginFolders = fs.readdirSync(this.pluginDir).filter(folder => !(folder == "node_modules"));
    
    for (const folder of pluginFolders) {
      try {
        await this.loadPluginFolder(folder)
      }
      catch(e: any) {
        console.error(e);
      }
    }
  }

  public async initializePlugins(server: ZoneServer2016) {

    if(!this.moduleDir) {
      console.error("[PluginManager] moduleDir is undefined!");
      console.log(`No plugins loaded.`);
      return;
    }

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