import assert from "node:assert";
import test from "node:test";
import {
  navigationRuntimeSelectionsMatch,
  selectNavigationRuntime
} from "./navigationruntime";

test("stock navigation runtime needs no external module paths", () => {
  assert.deepEqual(selectNavigationRuntime(undefined, undefined, undefined), {
    mode: "stock"
  });
  assert.deepEqual(selectNavigationRuntime("0", undefined, undefined), {
    mode: "stock"
  });
});

test("64-bit navigation runtime fails closed without both modules", () => {
  assert.throws(
    () => selectNavigationRuntime("1", undefined, undefined),
    /requires NAV_64_CORE_MODULE/
  );
  assert.throws(
    () => selectNavigationRuntime("1", "core.mjs", undefined),
    /requires NAV_64_CORE_MODULE/
  );
  assert.throws(
    () => selectNavigationRuntime("1", undefined, "wasm.mjs"),
    /requires NAV_64_CORE_MODULE/
  );
});

test("64-bit navigation runtime preserves and compares module paths", () => {
  const selected = selectNavigationRuntime("1", "core.mjs", "wasm.mjs");
  assert.deepEqual(selected, {
    mode: "monolithic64",
    coreModule: "core.mjs",
    wasmModule: "wasm.mjs"
  });
  assert.equal(navigationRuntimeSelectionsMatch(selected, selected), true);
  assert.equal(
    navigationRuntimeSelectionsMatch(
      selected,
      selectNavigationRuntime("1", "other-core.mjs", "wasm.mjs")
    ),
    false
  );
  assert.equal(
    navigationRuntimeSelectionsMatch(selected, { mode: "stock" }),
    false
  );
});
