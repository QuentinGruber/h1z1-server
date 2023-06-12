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

import * as fs from "fs";
import * as path from "path";
import { ZoneServer2016 } from "../zoneserver";
import { execSync } from "child_process";
import { copyFile, fileExists } from "../../../utils/utils";

export abstract class BasePlugin {
  public abstract name: string;
  public abstract description: string;
  public abstract version: string;
  public abstract loadConfig(config: any): void;
  public abstract init(server: ZoneServer2016): Promise<void>;
  public dir!: string;
}

function folderExists(path: string): boolean {
  // shoutout chatGPT
  try {
    const stats = fs.statSync(path);
    return stats.isDirectory();
  } catch (err: any) {
    if (err.code === "ENOENT") {
      // Folder doesn't exist
      return false;
    } else {
      // Other error occurred
      throw err;
    }
  }
}

function searchFolder(directory: string, folderName: string): string | null {
  // shoutout chatGPT
  const files = fs.readdirSync(directory);

  for (const file of files) {
    // this only puts a single backslash for some reason, so manually replace all with a double
    const filePath = path.join(directory, file).replaceAll("\\", "\\\\");
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

function traverseAndReplace(
  directory: string,
  searchString: string,
  replaceString: string
): void {
  // shoutout chatGPT
  const files = fs.readdirSync(directory);
  files.forEach((file) => {
    const filePath = path.join(directory, file);

    const stats = fs.statSync(filePath);
    if (stats.isDirectory()) {
      traverseAndReplace(filePath, searchString, replaceString);
    } else if (stats.isFile() && file.endsWith(".js")) {
      replaceInFile(filePath, searchString, replaceString);
    }
  });
}

function replaceInFile(
  filePath: string,
  searchString: string,
  replaceString: string
): void {
  // shoutout chatGPT
  const content = fs.readFileSync(filePath, "utf8"),
    replacedContent = content.replace(
      new RegExp(searchString, "g"),
      replaceString
    );

  fs.writeFileSync(filePath, replacedContent, "utf8");
}

export class PluginManager {
  private plugins: Array<BasePlugin> = [];
  get pluginCount() {
    return this.plugins.length;
  }
  private pluginsDir = path.join(process.cwd(), "plugins");
  private moduleDir = searchFolder(process.cwd(), "h1z1-server") || "";

  private checkPluginsFolder(): void {
    if (!fs.existsSync(this.pluginsDir)) {
      fs.mkdirSync(this.pluginsDir);
      console.log(`[PluginManager] Created plugins folder: ${this.pluginsDir}`);
    }
  }

  private getDependencies(projectPath: string): string[] {
    // shoutout chatGPT

    const packageJsonPath = path.join(
        this.pluginsDir,
        projectPath,
        "package.json"
      ),
      packageJsonContent = fs.readFileSync(packageJsonPath, "utf-8"),
      packageJson = JSON.parse(packageJsonContent),
      dependencies = Object.keys(packageJson.dependencies || {});
    return dependencies;
  }

  private installDependencies(
    pluginPath: string,
    dependencies: string[]
  ): void {
    // shoutout chatGPT

    if (dependencies.length === 0) {
      return;
    }

    console.log("[PluginManager] Installing dependencies...");

    const installCommand = `npm install ${dependencies.join(" ")}`;

    try {
      execSync(installCommand, {
        cwd: path.join(this.pluginsDir, pluginPath),
        stdio: "inherit"
      });
      console.log("[PluginManager] Dependencies installed successfully.");
    } catch (error) {
      console.error("[PluginManager] Failed to install dependencies.");
      process.exit(1);
    }
  }

  // For loading entire plugin folders
  private async loadPlugin(pluginPath: string) {
    const runPath = path.join(
      this.pluginsDir,
      pluginPath,
      "plugin.js" // Replace with the appropriate file name of the compiled module
    );

    if (!folderExists(path.join(this.pluginsDir, pluginPath, "node_modules"))) {
      // Install dependencies into the node_modules directory
      const dependencies = this.getDependencies(pluginPath);
      this.installDependencies(pluginPath, dependencies);
    } else {
      console.log(`[PluginManager] Dependencies detected for ${pluginPath}`);
    }

    traverseAndReplace(
      path.join(this.pluginsDir, pluginPath),
      "@h1z1-server",
      this.moduleDir
    );

    delete require.cache[require.resolve(runPath)];
    const module = await import(runPath);
    if (!(module.default.prototype instanceof BasePlugin)) {
      console.log(`[PluginManager] Invalid plugin detected! ${runPath}`);
      return;
    }

    const plugin = new module.default();
    plugin.dir = path.join(this.pluginsDir, pluginPath);
    this.plugins.push(plugin);
    console.log(`[PluginManager] Loaded: ${plugin.name}`);
  }

  private async loadPlugins() {
    this.checkPluginsFolder();

    const pluginFolders = fs.readdirSync(this.pluginsDir);

    for (const folder of pluginFolders) {
      if (!folderExists(path.join(this.pluginsDir, folder))) continue; // if not folder
      try {
        await this.loadPlugin(folder);
      } catch (e: any) {
        console.error(e);
      }
    }
  }

  private async loadPluginConfig(server: ZoneServer2016, plugin: BasePlugin) {
    const defaultConfigPath = path.join(
        plugin.dir,
        "data",
        "defaultconfig.yaml"
      ),
      defaultConfig = server.configManager.loadYaml(
        defaultConfigPath,
        false
      ) as any,
      fileName = `${plugin.name
        .toLowerCase()
        .replaceAll(" ", "-")}-config.yaml`,
      configPath = path.join(this.pluginsDir, fileName);

    if (!fileExists(path.join(this.pluginsDir, fileName))) {
      console.log(
        `[PluginManager] Generated config file for ${plugin.name} at base plugins directory: ${fileName}`
      );
      await copyFile(defaultConfigPath, configPath);
    }

    const configFile = server.configManager.loadYaml(configPath, false) as any;

    const config = {
      // in case a config file is outdated, load missing values using default
      ...defaultConfig,
      ...configFile
    };

    plugin.loadConfig(config);
  }

  public async initializePlugins(server: ZoneServer2016) {
    if (!this.moduleDir) {
      console.error("[PluginManager] moduleDir is undefined!");
      console.log(`[PluginManager] No plugins loaded.`);
      return;
    }

    this.plugins = [];
    await this.loadPlugins();

    for (const plugin of this.plugins) {
      try {
        await plugin.init(server);
        await this.loadPluginConfig(server, plugin);
      } catch (e: any) {
        console.error(e);
      }
    }

    if (this.plugins.length == 0) {
      console.log(`[PluginManager] No plugins loaded.`);
    }
  }
}
