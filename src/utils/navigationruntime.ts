// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2021 - 2026 H1emu community
//
// ======================================================================

import { existsSync } from "node:fs";
import { pathToFileURL } from "node:url";

export type NavigationRuntime = typeof import("recast-navigation");

export type NavigationRuntimeSelection =
  | { mode: "stock" }
  | { mode: "monolithic64"; coreModule: string; wasmModule: string };

let loadedRuntime: NavigationRuntime | undefined;
let loadedSelection: NavigationRuntimeSelection | undefined;

// Preserve native ESM import when this TypeScript project compiles to CommonJS.
const importEsm = new Function("specifier", "return import(specifier)") as (
  specifier: string
) => Promise<Record<string, any>>;

export function selectNavigationRuntime(
  monolithic64: string | undefined,
  coreModule: string | undefined,
  wasmModule: string | undefined
): NavigationRuntimeSelection {
  if (monolithic64 !== "1") return { mode: "stock" };
  if (!coreModule || !wasmModule) {
    throw new Error(
      "[NAV] NAV_MONOLITHIC_64=1 requires NAV_64_CORE_MODULE and NAV_64_WASM_MODULE"
    );
  }
  return { mode: "monolithic64", coreModule, wasmModule };
}

function assertModuleExists(label: string, path: string): void {
  if (!existsSync(path)) throw new Error(`[NAV] ${label} is missing: ${path}`);
}

export function navigationRuntimeSelectionsMatch(
  left: NavigationRuntimeSelection,
  right: NavigationRuntimeSelection
): boolean {
  if (left.mode !== right.mode) return false;
  if (left.mode === "stock" || right.mode === "stock") return true;
  return (
    left.coreModule === right.coreModule && left.wasmModule === right.wasmModule
  );
}

export async function loadNavigationRuntime(
  selection: NavigationRuntimeSelection
): Promise<NavigationRuntime> {
  if (loadedRuntime) {
    if (
      !loadedSelection ||
      !navigationRuntimeSelectionsMatch(loadedSelection, selection)
    ) {
      throw new Error(
        `[NAV] cannot switch navigation runtime after ${loadedSelection?.mode} was initialized`
      );
    }
    return loadedRuntime;
  }

  if (selection.mode === "stock") {
    const runtime = (await import("recast-navigation")) as NavigationRuntime;
    await runtime.init();
    loadedRuntime = runtime;
    loadedSelection = selection;
    return runtime;
  }

  assertModuleExists("64-bit core module", selection.coreModule);
  assertModuleExists("64-bit WASM module", selection.wasmModule);
  const [core, wasm] = await Promise.all([
    importEsm(pathToFileURL(selection.coreModule).href),
    importEsm(pathToFileURL(selection.wasmModule).href)
  ]);
  if (typeof core.init !== "function" || typeof wasm.default !== "function") {
    throw new Error("[NAV] invalid 64-bit navigation module exports");
  }
  await core.init(wasm.default);
  if (
    typeof core.uses64BitPolyRefs !== "function" ||
    !core.uses64BitPolyRefs()
  ) {
    throw new Error("[NAV] requested runtime does not use 64-bit polygon refs");
  }

  loadedRuntime = core as NavigationRuntime;
  loadedSelection = selection;
  return loadedRuntime;
}

export function getNavigationRuntime(): NavigationRuntime {
  if (!loadedRuntime) {
    throw new Error("[NAV] navigation runtime has not been initialized");
  }
  return loadedRuntime;
}

export const navigationRuntime = new Proxy({} as NavigationRuntime, {
  get(_target, property) {
    return (getNavigationRuntime() as any)[property];
  }
});

export function resetNavigationRuntimeForTests(): void {
  loadedRuntime = undefined;
  loadedSelection = undefined;
}
