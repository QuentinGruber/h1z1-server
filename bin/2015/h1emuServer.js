require("../shared/loginServer");
require("./zoneServer");

if (process.argv[2] === "--test") {
  setTimeout(() => process.exit(0), 0);
}
