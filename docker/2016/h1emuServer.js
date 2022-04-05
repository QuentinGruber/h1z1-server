const { spawn } = require("child_process");

const loginServer = spawn("node", [`${__dirname}/../2015/loginServer.js`]);
const zoneServer = spawn("node", [`${__dirname}/zoneServer.js`]);

loginServer.stdout.on("data", (data) => {
  console.log(`${data}`);
});

loginServer.stderr.on("data", (data) => {
  console.log(`${data}`);
});

loginServer.on("close", (code) => {
  if (code) {
    throw new Error(`loginServer exited with code ${code}`);
  }
});

zoneServer.stdout.on("data", (data) => {
  console.log(`${data}`);
});

zoneServer.stderr.on("data", (data) => {
  console.log(`${data}`);
});

zoneServer.on("close", (code) => {
  if (code) {
    throw new Error(`zoneServer exited with code ${code}`);
  }
});
