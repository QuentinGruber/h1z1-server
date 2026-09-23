import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// Account emote items of the 2016 client data: an emote ability whose client
// requirement expression is a single LocalPlayerOwnsAccountItem requirement,
// joined with the EmoteAnimations row of the same input action.
// Usage: tsx scripts/genEmoteAccountItems.ts <unpacked 2016 client data dir>
const assets = process.argv[2];
if (!assets) {
  console.error(
    "Usage: tsx scripts/genEmoteAccountItems.ts <unpacked 2016 client data dir>"
  );
  process.exit(1);
}

type Row = Record<string, string>;

function findTable(folder: string, name: string): string | undefined {
  for (const entry of readdirSync(folder, { withFileTypes: true })) {
    const entryPath = join(folder, entry.name);
    if (entry.isDirectory()) {
      const found = findTable(entryPath, name);
      if (found) return found;
    } else if (entry.name === name) {
      return entryPath;
    }
  }
  return undefined;
}

function readTable(name: string): Row[] {
  const tablePath = findTable(assets, name);
  if (!tablePath) throw new Error(`${name} not found under ${assets}`);
  const lines = readFileSync(tablePath, "utf8").split(/\r?\n/);
  const header = lines[0]
    .replace(/^#/, "")
    .split("^")
    .map((column) => column.replace(/^\*/, ""));
  return lines
    .slice(1)
    .filter(Boolean)
    .map((line) => {
      const values = line.split("^");
      const row: Row = {};
      header.forEach((column, index) => (row[column] = values[index] ?? ""));
      return row;
    });
}

const expressions = new Map(
  readTable("RequirementExpressions.txt").map((row) => [
    row.ID,
    row.EXPRESSION.trim()
  ])
);
const ownedItemByRequirement = new Map(
  readTable("Requirements.txt")
    .filter((row) => row.CODE_FACTORY_NAME === "LocalPlayerOwnsAccountItem")
    .map((row) => [row.DESIGN_NAME, Number(row.PARAM_1)])
);
const animationByAction = new Map(
  readTable("EmoteAnimations.txt").map((row) => [
    row.INPUT_ACTION_KEY,
    Number(row.ID)
  ])
);

const emotes: {
  accountItemId: number;
  abilityId: number;
  animationId: number;
}[] = [];
for (const ability of readTable("AbilityEx.txt")) {
  const animationId = animationByAction.get(ability.INPUT_ACTION_KEY);
  const requirement = expressions.get(ability.CLIENT_REQ_SET_ID);
  if (!ability.INPUT_ACTION_KEY || !animationId || !requirement) continue;
  if (ability.REQ_SET_ID !== "0") continue;
  const accountItemId = ownedItemByRequirement.get(requirement);
  if (!accountItemId) continue;
  emotes.push({ accountItemId, abilityId: Number(ability.ID), animationId });
}
emotes.sort((a, b) => a.abilityId - b.abilityId);

const output = join(
  __dirname,
  "../data/2016/dataSources/EmoteAccountItems.json"
);
writeFileSync(output, JSON.stringify(emotes, null, 1) + "\n");
console.log(`${emotes.length} account emote items -> ${output}`);
