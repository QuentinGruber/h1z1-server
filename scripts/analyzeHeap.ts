#!/usr/bin/env npx tsx
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
//
// Usage:
//   npx tsx scripts/analyzeHeap.ts [heapprofile] [heaptimeline]
//
// Defaults to the paths passed on the command line or the constants below.
// ======================================================================

import * as fs from "fs";
import * as path from "path";
import { createReadStream } from "fs";

// ── Defaults ────────────────────────────────────────────────────────────────
const DEFAULT_PROFILE =
  "C:\\Users\\jason\\Downloads\\Heap-20260407T202017.heapprofile";
const DEFAULT_TIMELINE =
  "C:\\Users\\jason\\Downloads\\Heap-20260407T202309.heaptimeline";

const profilePath = process.argv[2] ?? DEFAULT_PROFILE;
const timelinePath = process.argv[3] ?? DEFAULT_TIMELINE;

const TOP_N = 30; // how many entries to show in each section
const SRC_ROOT = path.join(__dirname, "..", "src");
const PROJECT_URL_SUBSTR = "h1z1-server"; // used to identify project frames

// ── Helpers ──────────────────────────────────────────────────────────────────
function fmt(bytes: number): string {
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(2)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

function pct(part: number, total: number): string {
  return total === 0 ? "0%" : `${((part / total) * 100).toFixed(1)}%`;
}

function shortUrl(url: string): string {
  const idx = url.indexOf(PROJECT_URL_SUBSTR);
  if (idx !== -1) return url.slice(idx + PROJECT_URL_SUBSTR.length + 1);
  // strip node internals prefix
  return url.replace(/^node:/, "node:");
}

function header(title: string) {
  const line = "═".repeat(70);
  console.log(`\n${line}`);
  console.log(`  ${title}`);
  console.log(line);
}

function subheader(title: string) {
  console.log(`\n── ${title} ${"─".repeat(Math.max(0, 66 - title.length))}`);
}

// ── Part 1: Heap Sampling Profile (.heapprofile) ──────────────────────────────
interface CallFrame {
  functionName: string;
  url: string;
  lineNumber: number;
  columnNumber: number;
  scriptId: string;
}
interface ProfileNode {
  callFrame: CallFrame;
  selfSize: number;
  id: number;
  children?: ProfileNode[];
}
interface HeapProfile {
  head: ProfileNode;
  samples?: unknown[];
  startTime?: number;
  endTime?: number;
}

interface FlatAlloc {
  key: string;
  functionName: string;
  url: string;
  line: number;
  selfSize: number;
  isProject: boolean;
}

function flattenProfileNode(
  node: ProfileNode,
  out: Map<string, FlatAlloc>
): void {
  if (node.selfSize > 0) {
    const key = `${node.callFrame.url}:${node.callFrame.lineNumber}:${node.callFrame.functionName}`;
    const existing = out.get(key);
    if (existing) {
      existing.selfSize += node.selfSize;
    } else {
      out.set(key, {
        key,
        functionName:
          node.callFrame.functionName || "(anonymous)",
        url: node.callFrame.url,
        line: node.callFrame.lineNumber,
        selfSize: node.selfSize,
        isProject: node.callFrame.url.includes(PROJECT_URL_SUBSTR)
      });
    }
  }
  for (const child of node.children ?? []) {
    flattenProfileNode(child, out);
  }
}

function analyzeProfile(filePath: string) {
  header("HEAP SAMPLING PROFILE  (.heapprofile)");
  console.log(`  File: ${filePath}`);

  const raw = fs.readFileSync(filePath, "utf8");
  const profile: HeapProfile = JSON.parse(raw);

  const flat = new Map<string, FlatAlloc>();
  flattenProfileNode(profile.head, flat);

  const all = Array.from(flat.values()).sort(
    (a, b) => b.selfSize - a.selfSize
  );
  const totalSize = all.reduce((s, x) => s + x.selfSize, 0);
  const projectFrames = all.filter((x) => x.isProject);
  const projectTotal = projectFrames.reduce((s, x) => s + x.selfSize, 0);

  console.log(`\n  Total sampled allocation: ${fmt(totalSize)}`);
  console.log(
    `  Project frames total:     ${fmt(projectTotal)} (${pct(projectTotal, totalSize)} of all)`
  );

  subheader("Top allocation sites — ALL frames");
  console.log(
    `  ${"Size".padStart(10)}  ${"% total".padStart(7)}  Location`
  );
  for (const f of all.slice(0, TOP_N)) {
    const loc = f.url
      ? `${shortUrl(f.url)}:${f.line}  ${f.functionName}`
      : f.functionName;
    console.log(
      `  ${fmt(f.selfSize).padStart(10)}  ${pct(f.selfSize, totalSize).padStart(7)}  ${loc}`
    );
  }

  subheader("Top allocation sites — PROJECT frames only");
  if (projectFrames.length === 0) {
    console.log("  (none found — make sure the profile was taken from an out/ build)");
  } else {
    console.log(
      `  ${"Size".padStart(10)}  ${"% proj".padStart(7)}  Location`
    );
    for (const f of projectFrames.slice(0, TOP_N)) {
      const loc = `${shortUrl(f.url)}:${f.line}  ${f.functionName}`;
      console.log(
        `  ${fmt(f.selfSize).padStart(10)}  ${pct(f.selfSize, projectTotal).padStart(7)}  ${loc}`
      );
    }
  }

  return { all, projectFrames, totalSize, projectTotal };
}

// ── Part 2: Heap Snapshot (.heaptimeline) ────────────────────────────────────
//
// V8 heap snapshots use a compact flat encoding:
//   nodes: flat array of (nodeFieldCount) integers per node
//   edges: flat array of (edgeFieldCount) integers per edge
//   strings: string table
//
// We do a streaming parse so we don't OOM on 337 MB JSON.

interface SnapshotMeta {
  node_fields: string[];
  node_types: (string | string[])[];
  edge_fields: string[];
  edge_types: (string | string[])[];
}

interface TypeStats {
  count: number;
  shallowSize: number;
  retainedSize?: number; // too expensive to compute fully, skipped
}

// Chunk-read and parse a huge JSON file using the `node_fields` layout.
// Rather than fully parsing the 337 MB file, we extract just what we need.
async function analyzeTimeline(filePath: string): Promise<void> {
  header("HEAP SNAPSHOT  (.heaptimeline)");
  console.log(`  File: ${filePath}`);
  console.log(`  Reading (this may take a moment for large snapshots)...`);

  const raw = await fs.promises.readFile(filePath, "utf8");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const snap: any = JSON.parse(raw);

  const meta: SnapshotMeta = snap.snapshot.meta;
  const nodeFields: string[] = meta.node_fields; // e.g. ["type","name","id","self_size","edge_count","trace_node_id","detachedness"]
  const nodeTypes: string[] = meta.node_types[0] as string[]; // type name table
  const strings: string[] = snap.strings;
  const nodes: number[] = snap.nodes;
  const nFields = nodeFields.length;

  const typeIdx = nodeFields.indexOf("type");
  const nameIdx = nodeFields.indexOf("name");
  const selfSizeIdx = nodeFields.indexOf("self_size");
  const edgeCountIdx = nodeFields.indexOf("edge_count");

  const nodeCount = nodes.length / nFields;
  console.log(`  Node count: ${nodeCount.toLocaleString()}`);

  // ── Aggregate by type ────────────────────────────────────────────────────
  const byType = new Map<string, TypeStats>();

  let totalShallow = 0;
  for (let i = 0; i < nodeCount; i++) {
    const base = i * nFields;
    const typeCode = nodes[base + typeIdx];
    const typeName = nodeTypes[typeCode] ?? `type_${typeCode}`;
    const selfSize = nodes[base + selfSizeIdx];

    const stat = byType.get(typeName);
    if (stat) {
      stat.count++;
      stat.shallowSize += selfSize;
    } else {
      byType.set(typeName, { count: 1, shallowSize: selfSize });
    }
    totalShallow += selfSize;
  }

  subheader("Heap totals");
  console.log(`  Total shallow size: ${fmt(totalShallow)}`);
  console.log(`  Node types found:   ${byType.size}`);

  subheader(`Object types by shallow size (top ${TOP_N})`);
  const typeRows = Array.from(byType.entries()).sort(
    ([, a], [, b]) => b.shallowSize - a.shallowSize
  );
  console.log(
    `  ${"Type".padEnd(22)}  ${"Count".padStart(10)}  ${"Shallow".padStart(12)}  ${"% total".padStart(7)}`
  );
  for (const [name, stat] of typeRows.slice(0, TOP_N)) {
    console.log(
      `  ${name.padEnd(22)}  ${stat.count.toLocaleString().padStart(10)}  ${fmt(stat.shallowSize).padStart(12)}  ${pct(stat.shallowSize, totalShallow).padStart(7)}`
    );
  }

  subheader(`Object types by instance count (top ${TOP_N})`);
  const countRows = Array.from(byType.entries()).sort(
    ([, a], [, b]) => b.count - a.count
  );
  console.log(
    `  ${"Type".padEnd(22)}  ${"Count".padStart(10)}  ${"Shallow".padStart(12)}  ${"Avg size".padStart(10)}`
  );
  for (const [name, stat] of countRows.slice(0, TOP_N)) {
    const avg = stat.count > 0 ? stat.shallowSize / stat.count : 0;
    console.log(
      `  ${name.padEnd(22)}  ${stat.count.toLocaleString().padStart(10)}  ${fmt(stat.shallowSize).padStart(12)}  ${fmt(avg).padStart(10)}`
    );
  }

  // ── String analysis ─────────────────────────────────────────────────────
  subheader("String table analysis");
  const stringCount = strings.length;
  const stringSizeBytes = strings.reduce((s, str) => s + str.length * 2, 0); // UTF-16
  console.log(`  Unique strings in table: ${stringCount.toLocaleString()}`);
  console.log(`  Est. string table size:  ${fmt(stringSizeBytes)} (UTF-16)`);

  // Find duplicate strings by value
  const strFreq = new Map<string, number>();
  for (const s of strings) {
    strFreq.set(s, (strFreq.get(s) ?? 0) + 1);
  }
  // only deduplicated ones (same string appearing multiple times in table)
  const duplicates = Array.from(strFreq.entries())
    .filter(([, count]) => count > 1)
    .sort(([a, ca], [b, cb]) => {
      // sort by wasted bytes (count-1) * len
      const wasteA = (ca - 1) * a.length * 2;
      const wasteB = (cb - 1) * b.length * 2;
      return wasteB - wasteA;
    });

  if (duplicates.length > 0) {
    console.log(`\n  Top duplicated strings (wasted bytes):`);
    console.log(
      `  ${"Count".padStart(6)}  ${"Wasted".padStart(10)}  Value`
    );
    for (const [str, count] of duplicates.slice(0, 20)) {
      const wasted = (count - 1) * str.length * 2;
      const preview = str.length > 60 ? str.slice(0, 57) + "..." : str;
      console.log(
        `  ${count.toString().padStart(6)}  ${fmt(wasted).padStart(10)}  ${JSON.stringify(preview)}`
      );
    }
  }

  // ── Closure / function analysis ──────────────────────────────────────────
  subheader("Closure allocations by script URL");
  const edges: number[] = snap.edges;
  const edgeFields: string[] = meta.edge_fields;
  const edgeTypes: string[] = meta.edge_types[0] as string[];
  const eFields = edgeFields.length;
  const eTypeIdx = edgeFields.indexOf("type");
  const eNameIdx = edgeFields.indexOf("name_or_index");
  const eToIdx = edgeFields.indexOf("to_node");

  // Build a map from node index → script url for "code" / "closure" nodes
  const closureTypeCode = nodeTypes.indexOf("closure");
  const codeTypeCode = nodeTypes.indexOf("code");

  // For closures: find the "context" or "shared" edge → code → url isn't directly
  // stored per node in snapshot format. Instead we look at "closure" nodes and
  // find their name (which in V8 is the function name) and group them.
  const closureByName = new Map<string, { count: number; size: number }>();
  for (let i = 0; i < nodeCount; i++) {
    const base = i * nFields;
    const typeCode = nodes[base + typeIdx];
    if (typeCode !== closureTypeCode) continue;
    const nameStringIdx = nodes[base + nameIdx];
    const name = strings[nameStringIdx] ?? "(anonymous)";
    const selfSize = nodes[base + selfSizeIdx];
    const stat = closureByName.get(name);
    if (stat) {
      stat.count++;
      stat.size += selfSize;
    } else {
      closureByName.set(name, { count: 1, size: selfSize });
    }
  }

  const closureRows = Array.from(closureByName.entries()).sort(
    ([, a], [, b]) => b.size - a.size
  );
  const totalClosureSize = closureRows.reduce((s, [, v]) => s + v.size, 0);
  const totalClosureCount = closureRows.reduce((s, [, v]) => s + v.count, 0);
  console.log(
    `  Total closures: ${totalClosureCount.toLocaleString()}  |  Total size: ${fmt(totalClosureSize)}`
  );
  console.log(
    `  ${"Count".padStart(8)}  ${"Size".padStart(12)}  Name`
  );
  for (const [name, stat] of closureRows.slice(0, TOP_N)) {
    console.log(
      `  ${stat.count.toString().padStart(8)}  ${fmt(stat.size).padStart(12)}  ${name}`
    );
  }

  return;
}

// ── Part 3: Recommendations ───────────────────────────────────────────────────
function printRecommendations(
  profileData: ReturnType<typeof analyzeProfile> | null
) {
  header("OPTIMIZATION RECOMMENDATIONS");

  const recs: Array<{ priority: "HIGH" | "MEDIUM" | "LOW"; title: string; detail: string }> = [];

  if (profileData) {
    const { all, projectFrames, totalSize, projectTotal } = profileData;

    // Find the biggest single allocating project frame
    const top = projectFrames[0];
    if (top && top.selfSize > totalSize * 0.05) {
      recs.push({
        priority: "HIGH",
        title: `Hot allocation: ${top.functionName} (${pct(top.selfSize, totalSize)} of all allocations)`,
        detail: `${shortUrl(top.url)}:${top.line}\n     This function is allocating a disproportionate amount of memory. Consider:\n     - Pooling/reusing objects instead of allocating new ones each call\n     - Moving large temporary buffers outside the hot path\n     - Using typed arrays (Float32Array, Uint8Array) for numeric data`
      });
    }

    // Look for Buffer / typed array sites
    const bufferFrames = all.filter(
      (f) =>
        f.functionName.toLowerCase().includes("buffer") ||
        f.url.toLowerCase().includes("buffer")
    );
    if (bufferFrames.length > 0) {
      const bufTotal = bufferFrames.reduce((s, f) => s + f.selfSize, 0);
      if (bufTotal > totalSize * 0.1) {
        recs.push({
          priority: "HIGH",
          title: `Buffer allocations: ${fmt(bufTotal)} (${pct(bufTotal, totalSize)})`,
          detail: `Buffer frames:\n${bufferFrames
            .slice(0, 5)
            .map((f) => `     - ${shortUrl(f.url)}:${f.line}  ${f.functionName}`)
            .join("\n")}\n     Consider using a Buffer pool (e.g. buf.fill(0) + reuse) for packet encoding.`
        });
      }
    }

    // Look for zoneserver tick / client tick frames
    const tickFrames = projectFrames.filter(
      (f) =>
        f.functionName.toLowerCase().includes("tick") ||
        f.functionName.toLowerCase().includes("routine") ||
        f.functionName.toLowerCase().includes("spawn")
    );
    if (tickFrames.length > 0) {
      const tickTotal = tickFrames.reduce((s, f) => s + f.selfSize, 0);
      recs.push({
        priority: "MEDIUM",
        title: `Tick/routine allocations: ${fmt(tickTotal)} total`,
        detail: `Hot tick paths:\n${tickFrames
          .slice(0, 5)
          .map(
            (f) =>
              `     - ${shortUrl(f.url)}:${f.line}  ${f.functionName}  (${fmt(f.selfSize)})`
          )
          .join("\n")}\n     Allocations in tick functions run every frame. Pre-allocate and mutate.`
      });
    }
  }

  // General recommendations based on common patterns in this codebase
  recs.push(
    {
      priority: "HIGH",
      title: "Packet encoding: avoid per-packet Buffer.alloc()",
      detail: `The packet encoding pipeline likely allocates a new Buffer for every outgoing packet.\n     Use a single large pre-allocated Buffer per connection and write into a slice,\n     or maintain a pool of fixed-size Buffers and recycle them after send().`
    },
    {
      priority: "HIGH",
      title: "Entity position arrays: use Float32Array instead of number[]",
      detail: `Every entity stores position/rotation as number[] (JS heap). Switching to Float32Array\n     reduces memory by ~5× (4 bytes vs 8 bytes per float) and improves GC pressure.\n     Affects all entities, vehicles, NPCs, construction, and projectiles.`
    },
    {
      priority: "HIGH",
      title: "Map iteration in hot paths: cache .values() / .entries() arrays",
      detail: `Calls like Object.values(_clients) or [...map.values()] inside tick loops create a\n     new array every tick. Cache the live array when the collection rarely changes,\n     or maintain a parallel array alongside the Map.`
    },
    {
      priority: "MEDIUM",
      title: "String concatenation in loops: use template literals or join()",
      detail: `If character IDs or packet headers are built via + concatenation inside loops,\n     each intermediate string is heap-allocated. Use a pre-built string table or\n     store IDs as numbers/typed arrays internally.`
    },
    {
      priority: "MEDIUM",
      title: "Closure retention in event listeners: unbind unused listeners",
      detail: `Long-lived event listeners (e.g., on('message')) that capture large scopes prevent\n     GC. Store listener references and call removeListener() when the client disconnects.`
    },
    {
      priority: "MEDIUM",
      title: "GridCell / spatial index: pre-size arrays to avoid re-allocation",
      detail: `If gridcell.ts uses arrays that grow dynamically (push), they double in capacity on\n     resize. Pre-size with new Array(expectedSize) or use typed arrays with a fixed\n     max-per-cell limit.`
    },
    {
      priority: "LOW",
      title: "JSON.stringify / JSON.parse in hot paths: use msgpack or binary protocol",
      detail: `Any JSON serialization in the tick path (logging, world state snapshots, IPC)\n     produces large transient strings. Consider msgpack-lite or a binary format.`
    },
    {
      priority: "LOW",
      title: "Worker thread IPC: transfer ArrayBuffers instead of copying",
      detail: `postMessage() with plain objects serializes via structured clone (copies memory).\n     For large loot plan payloads, serialize into a SharedArrayBuffer or use\n     transferable ArrayBuffers to avoid the copy overhead.`
    }
  );

  const priorities: Array<"HIGH" | "MEDIUM" | "LOW"> = ["HIGH", "MEDIUM", "LOW"];
  for (const p of priorities) {
    const group = recs.filter((r) => r.priority === p);
    if (group.length === 0) continue;
    subheader(`${p} priority`);
    for (const rec of group) {
      console.log(`\n  [${rec.priority}] ${rec.title}`);
      console.log(`     ${rec.detail}`);
    }
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log("\nH1Z1-Server Heap Analysis Tool");
  console.log("================================\n");

  let profileData: ReturnType<typeof analyzeProfile> | null = null;

  if (fs.existsSync(profilePath)) {
    profileData = analyzeProfile(profilePath);
  } else {
    console.warn(`[WARN] heapprofile not found: ${profilePath}`);
  }

  if (fs.existsSync(timelinePath)) {
    await analyzeTimeline(timelinePath);
  } else {
    console.warn(`[WARN] heaptimeline not found: ${timelinePath}`);
  }

  printRecommendations(profileData);

  console.log("\n");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
