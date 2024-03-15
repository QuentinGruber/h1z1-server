// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2024 H1emu community
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
import { copyFile, fileExists, flhash } from "../../../utils/utils";
import { Command } from "../handlers/commands/types";
import { ZoneClient2016 } from "../classes/zoneclient";

/**
 * Abstract class representing a base plugin.
 */
export abstract class BasePlugin {
  public abstract name: string;
  public abstract description: string;
  public abstract version: string;
  public abstract commands?: Array<Command>;
  /**
   * Loads the configuration for the plugin.
   * @param config - The configuration object for the plugin.
   */
  public abstract loadConfig(config: any): void;
  /**
   * Initializes the plugin.
   * @param server - The ZoneServer2016 instance.
   * @returns A promise that resolves when the initialization is complete.
   */
  public abstract init(server: ZoneServer2016): Promise<void>;
  public dir!: string;
}

/**
 * Checks if a folder exists at the specified path.
 * @param path - The path of the folder to check.
 * @returns A boolean indicating whether the folder exists.
 */
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

/**
 * Searches for a folder within a directory.
 * @param directory - The directory to search in.
 * @param folderName - The name of the folder to search for.
 * @returns The path of the found folder, or null if not found.
 */
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

/**
 * Recursively traverses a directory and replaces a search string with a replace string in all files.
 * @param directory - The directory to traverse.
 * @param searchString - The string to search for.
 * @param replaceString - The string to replace with.
 */
function traverseAndReplace(
  directory: string,
  searchString: string,
  replaceString: string
): void {
  // shoutout chatGPT
  if (process.platform === "win32") {
    // https://stackoverflow.com/a/70560464
    replaceString = path.resolve(replaceString).split(path.sep).join("/");
  }

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

/**
 * Replaces a search string with a replace string in a specific file.
 * @param filePath - The path of the file.
 * @param searchString - The string to search for.
 * @param replaceString - The string to replace with.
 */
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
  private pluginsDir =
    process.env.PLUGINS_DIR || path.join(process.cwd(), "plugins");
  private moduleDir =
    process.env.PLUGIN_MODULES_DIR ||
    searchFolder(process.cwd(), "h1z1-server") ||
    "";

  /**
   * Checks if the plugins directory exists and creates it if it doesn't.
   */
  private checkPluginsFolder(): void {
    if (!fs.existsSync(this.pluginsDir)) {
      fs.mkdirSync(this.pluginsDir);
      console.log(`[PluginManager] Created plugins folder: ${this.pluginsDir}`);
    }
  }

  /**
   * Retrieves the dependencies for a plugin.
   * @param projectPath - The path of the plugin.
   * @returns An array of dependencies.
   */
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

  /**
   * Installs the dependencies for a plugin.
   * @param pluginPath - The path of the plugin.
   * @param dependencies - An array of dependencies to install.
   */
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

  /**
   * Loads a plugin from the specified path.
   * @param pluginPath - The path of the plugin.
   * @returns A promise that resolves when the plugin is loaded.
   */
  private async loadPlugin(pluginPath: string) {
    const runPath = path.join(this.pluginsDir, pluginPath, "plugin.js");

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

  /**
   * Loads all plugins from the plugins directory.
   * @returns A promise that resolves when all plugins are loaded.
   */
  private async loadPlugins() {
    this.checkPluginsFolder();

    const pluginFolders = fs.readdirSync(this.pluginsDir);

    for (const folder of pluginFolders) {
      if (!folderExists(path.join(this.pluginsDir, folder))) continue; // if not folder
      try {
        await this.loadPlugin(folder);
      } catch (e: any) {
        console.error(e);
        console.log(
          `[PluginManager] Plugin "${folder}" not loaded, make sure you've compiled the plugin before attempting to load it.`
        );
      }
    }
  }

  /**
   * Loads the configuration for a plugin.
   * @param server - The ZoneServer2016 instance.
   * @param plugin - The plugin instance.
   */
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

  /**
   * Registers all commands defined by the plugin.
   * @param server - The ZoneServer2016 instance.
   * @param plugin - The plugin instance.
   */
  private registerPluginCommands(server: ZoneServer2016, plugin: BasePlugin) {
    if (!plugin.commands) return;
    plugin.commands.forEach((command) => {
      this.registerCommand(plugin, server, command);
    });
  }

  /**
   * Initializes the plugins and loads their configurations.
   * @param server - The ZoneServer2016 instance.
   */
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
        await this.loadPluginConfig(server, plugin);
        await plugin.init(server);
        this.registerPluginCommands(server, plugin);
        console.log(`[PluginManager] ${plugin.name} initialized!`);
      } catch (e: any) {
        console.error(e);
      }
    }

    if (this.plugins.length == 0) {
      console.log(`[PluginManager] No plugins loaded.`);
    }
  }

  //#region PLUGIN HELPERS

  /**
   * Hooks a method by overriding its default behavior.
   * @param plugin - The plugin instance ("this")
   * @param thisArg - The object on which the method is defined.
   * @param methodName - The name of the method to be hooked.
   * @param hook - A function that will be called during the hooking process.
   * @param options - Options for controlling the hooking behavior. Specifies whether to call the original method before/after the hook.
   * @returns
   */
  public hookMethod(
    plugin: BasePlugin,
    thisArg: any,
    methodName: string,
    hook: (...args: any[]) => boolean | void,
    options: { callBefore: boolean; callAfter: boolean }
  ) {
    const originalFunction = thisArg[methodName];

    if (!originalFunction) {
      console.log(
        `\n\n\n[PluginManager] Plugin ${plugin.name} tried to hook an invalid method!\n\n\n`
      );
      return;
    }

    thisArg[methodName] = function (...args: any[]) {
      if (options.callBefore) originalFunction.call(thisArg, ...args);
      const ret = hook(...args);
      if (ret !== false && options.callAfter)
        originalFunction.call(thisArg, ...args);
    };
  }

  /**
   * Registers a custom command to be used in-game.
   * @param plugin - The plugin instance ("this").
   * @param server - The ZoneServer2016 instance.
   * @param command - The command to register.
   * @deprecated Add your command to the commands array instead. Refer to documentation for more info.
   */
  // to be made private, keeping public for a bit in case plugins use legacy command adding
  public registerCommand(
    plugin: BasePlugin,
    server: ZoneServer2016,
    command: Command
  ) {
    server.commandHandler.commands[flhash(command.name.toUpperCase())] =
      command;
    console.log(
      `[PluginManager] Plugin ${plugin.name} registered a command: /${command.name}`
    );
  }

  /**
   * Lists and sends commands from a plugin to a player's console.
   *
   * This function iterates through the list of commands provided by a plugin
   * and sends each command to a client's console in a game server.
   *
   * @param server - The ZoneServer2016 instance.
   * @param client - The client requesting the command list.
   * @param plugin - The plugin instance ("this").
   */
  public listCommands(
    server: ZoneServer2016,
    client: ZoneClient2016,
    plugin: BasePlugin
  ) {
    if (!plugin.commands) return;
    const commands = plugin.commands.map((command) => {
      return `/${command.name}: ${command.description}`;
    });

    // workaround for possible h1z1 console text limit?
    commands.forEach((command) => {
      server.sendConsoleText(client, `${command}`, true);
    });
  }

  //#endregion
}
