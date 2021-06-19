require("./loginServer");
require("./zoneServer");

console.log(process.env.TEST_BIN);
if (process.env.TEST_BIN) {
  setTimeout(() => process.exit(0), 0);
}
