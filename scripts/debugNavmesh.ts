import { NavManager } from "../src/utils/recast";

async function main() {
  const navManager = new NavManager();
  await navManager.loadNav();
  console.time("NavMeshDump");
  navManager.dumpNavmesh();
  console.timeEnd("NavMeshDump");
}

main();
