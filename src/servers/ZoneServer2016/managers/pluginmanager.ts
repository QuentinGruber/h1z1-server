import { BasePlugin } from "types/zoneserver";
import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';

export class PluginManager {
  private plugins: Array<BasePlugin> = [];
  public loadPlugins(): void {
    const pluginDir = path.join(__dirname, '..', 'plugins');
    const pluginFiles = fs.readdirSync(pluginDir).filter(file => file.endsWith('.ts'));

    for (const file of pluginFiles) {
      const filePath = path.join(pluginDir, file),
      source = fs.readFileSync(filePath, 'utf-8'),
      output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }),
      module = eval(output.outputText);

      if (module.default.prototype instanceof BasePlugin) {
        const plugin = new module.default();
        this.plugins.push(plugin);
        console.log(`Loaded plugin: ${plugin.name}`);
      } else {
        console.warn(`File ${file} is not a valid plugin`);
      }
    }
  }

  public initializePlugins(): void {
    for (const plugin of this.plugins) {
      plugin.init();
    }
  }
}