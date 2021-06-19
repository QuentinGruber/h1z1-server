require("./loginServer");
require("./zoneServer");

if (process.env.TEST_BIN) {
  setTimeout(() => process.exit(0), 0);
}
