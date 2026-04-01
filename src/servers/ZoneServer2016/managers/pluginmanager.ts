// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2026 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

import * as fs from "fs";
import * as path from "path";
import * as yaml from "js-yaml";
import type { ZoneServer2016 } from "../zoneserver";
import type { Command } from "../handlers/commands/types";
import type { ZoneClient2016 } from "../classes/zoneclient";
import type { LoginServer } from "servers/LoginServer/loginserver";
import { spawn } from "child_process";

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
  public abstract init(server: ZoneServer2016 | LoginServer): Promise<void>;
  public dir!: string;
}

function isZoneServer(
  server: ZoneServer2016 | LoginServer
): server is ZoneServer2016 {
  return "commandHandler" in server;
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
    if (err.code === "ENOENT" || err.code === "ENOTDIR") {
      // Folder doesn't exist or path traverses through a non-directory
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

function fileExists(filePath: string): boolean {
  try {
    fs.accessSync(filePath);
    return true;
  } catch {
    return false;
  }
}

async function copyFile(
  originalFilePath: string,
  newFilePath: string
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const readStream = fs.createReadStream(originalFilePath);
    const writeStream = fs.createWriteStream(newFilePath);

    readStream.pipe(writeStream);

    writeStream.on("finish", () => {
      readStream.close();
      writeStream.close();
      resolve();
    });

    writeStream.on("error", (err) => {
      readStream.close();
      writeStream.close();
      reject(err);
    });
  });
}

function flhash(str: string): number {
  let hashvar1 = 0,
    hashvar2 = 0;

  for (let i = 0; i < str.length; i++) {
    hashvar1 = hashvar2 + str.charCodeAt(i);
    hashvar2 = ((1025 * hashvar1) >> 6) ^ (1025 * hashvar1);
  }

  const hash = 32769 * (((9 * hashvar2) >> 11) ^ (9 * hashvar2));
  return Number(`0x${hash.toString(16).slice(-8)}`);
}

export class PluginManager {
  private static readonly defaultInitTimeoutMs = Number(
    process.env.PLUGIN_INIT_TIMEOUT_MS ?? 10000
  );

  private static resolveModulePath(basePath: string): string | null {
    const candidates = [
      basePath,
      `${basePath}.json`,
      `${basePath}.js`,
      `${basePath}.cjs`,
      `${basePath}.mjs`,
      path.join(basePath, "index.json"),
      path.join(basePath, "index.js"),
      path.join(basePath, "index.cjs"),
      path.join(basePath, "index.mjs")
    ];

    for (const candidate of candidates) {
      if (!fs.existsSync(candidate)) {
        continue;
      }

      try {
        if (fs.statSync(candidate).isFile()) {
          return candidate;
        }
      } catch {
        // Skip inaccessible files and keep trying candidates.
      }
    }

    return null;
  }

  private static getPluginDataRoots(): string[] {
    if (process.env.DISABLE_PLUGINS) {
      return [];
    }

    const pluginsDir =
      process.env.PLUGINS_DIR || path.join(process.cwd(), "plugins");

    if (!folderExists(pluginsDir)) {
      return [];
    }

    return fs
      .readdirSync(pluginsDir)
      .sort((a, b) => a.localeCompare(b))
      .map((folder) => path.join(pluginsDir, folder, "data"))
      .filter((pluginDataPath) => folderExists(pluginDataPath));
  }

  public static resolveServerDataModulePath(relativeDataPath: string): string {
    const normalizedPath = relativeDataPath
      .replaceAll("\\", "/")
      .replace(/^\/+/, "")
      .replace(/\/$/, "");

    const pluginDataRoots = this.getPluginDataRoots();
    let pluginOverridePath: string | null = null;

    for (const pluginDataRoot of pluginDataRoots) {
      const resolvedPluginPath = this.resolveModulePath(
        path.join(pluginDataRoot, normalizedPath)
      );
      if (resolvedPluginPath) {
        pluginOverridePath = resolvedPluginPath;
      }
    }

    if (pluginOverridePath) {
      return pluginOverridePath;
    }

    const defaultPath = this.resolveModulePath(
      path.join(process.cwd(), "data", normalizedPath)
    );

    if (defaultPath) {
      return defaultPath;
    }

    throw new Error(
      `[PluginManager] Unable to resolve server data module for path: ${relativeDataPath}`
    );
  }

  public static loadServerData<T = any>(relativeDataPath: string): T {
    return require(this.resolveServerDataModulePath(relativeDataPath)) as T;
  }

  private plugins: Array<BasePlugin> = [];
  get pluginCount() {
    return this.plugins.length;
  }

  private loadYaml(path: string) {
    return yaml.load(fs.readFileSync(path, "utf8")) as any;
  }
  private pluginsDir =
    process.env.PLUGINS_DIR || path.join(process.cwd(), "plugins");
  private moduleDir =
    process.env.PLUGIN_MODULES_DIR ||
    searchFolder(process.cwd(), "h1z1-server") ||
    process.cwd();

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
  private async installDependencies(pluginPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // shoutout chatGPT

      console.log("[PluginManager] Installing dependencies...");

      const installProcess = spawn("npm", ["install"], {
        cwd: path.join(this.pluginsDir, pluginPath),
        stdio: "inherit",
        shell: process.platform === "win32"
      });

      installProcess.once("error", (error) => {
        console.error(error);
        console.error("[PluginManager] Failed to install dependencies.");
        reject(error);
      });

      installProcess.once("close", (code) => {
        if (code === 0) {
          console.log("[PluginManager] Dependencies installed successfully.");
          resolve();
          return;
        }

        const error = new Error(
          `[PluginManager] npm install failed with exit code ${code ?? "unknown"}.`
        );
        console.error(error);
        reject(error);
      });
    });
  }

  private async initializePluginWithTimeout(
    plugin: BasePlugin,
    server: ZoneServer2016 | LoginServer
  ): Promise<void> {
    const timeoutMs = PluginManager.defaultInitTimeoutMs;

    try {
      await this.loadPluginConfig(plugin);
      console.time(`Loading ${plugin.name} plugin`);
      await Promise.race([
        plugin.init(server),
        new Promise((_, reject) => {
          setTimeout(() => {
            reject(
              new Error(
                `[PluginManager] ${plugin.name} init timeout after ${timeoutMs}ms.`
              )
            );
          }, timeoutMs);
        })
      ]);
      console.timeEnd(`Loading ${plugin.name} plugin`);

      if (isZoneServer(server)) {
        this.registerPluginCommands(server, plugin);
      } else if (plugin.commands?.length) {
        console.log(
          `[PluginManager] ${plugin.name} tried adding commands, but LoginServer does not support plugin commands.`
        );
      }
      console.log(`[PluginManager] ${plugin.name} initialized!`);
    } catch (e: any) {
      console.error(e);
    }
  }

  /**
   * Loads a plugin from the specified path.
   * @param pluginPath - The path of the plugin.
   * @returns A promise that resolves when the plugin is loaded.
   */
  private async loadPlugin(pluginPath: string) {
    const runPath = path.join(this.pluginsDir, pluginPath, "plugin.js");

    if (
      !folderExists(path.join(this.pluginsDir, pluginPath, "node_modules")) ||
      process.env.PLUGIN_FORCE_BUILD
    ) {
      // Install dependencies into the node_modules directory
      await this.installDependencies(pluginPath);
    } else {
      console.log(`[PluginManager] Dependencies loaded for ${pluginPath}`);
    }

    traverseAndReplace(
      path.join(this.pluginsDir, pluginPath),
      "@h1z1-server",
      this.moduleDir
    );

    delete require.cache[require.resolve(runPath)];
    const module = await import(runPath);

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
   * @param plugin - The plugin instance.
   */
  private async loadPluginConfig(plugin: BasePlugin) {
    const defaultConfigPath = path.join(
        plugin.dir,
        "data",
        "defaultconfig.yaml"
      ),
      defaultConfig = this.loadYaml(defaultConfigPath),
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

    const configFile = this.loadYaml(configPath);

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
  public async initializePlugins(server: ZoneServer2016 | LoginServer) {
    // Used in tests
    if (process.env.DISABLE_PLUGINS) {
      return;
    }
    if (!this.moduleDir) {
      console.error("[PluginManager] moduleDir is undefined!");
      console.log(`[PluginManager] No plugins loaded.`);
      return;
    }

    this.plugins = [];
    await this.loadPlugins();

    for (const plugin of this.plugins) {
      // Keep startup responsive by not serially awaiting plugin init.
      setImmediate(() => {
        void this.initializePluginWithTimeout(plugin, server);
      });
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
