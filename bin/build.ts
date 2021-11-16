import { spawn } from "child_process";
const servers: ServerBin[] = require("./bin.json");


interface ServerBin {
    name: string;
    version: string;
    fileName: string;
  }
function buildAllBinaries(serverVersion:string) {
    servers.forEach((server) => {
    const { name, version, fileName } = server;
    const buildProcess = spawn("npx", [
      "pkg",
      "-t",
      `./bin/${version}/${name}.js`,
      "node16-win-x64",
      "--output",
      `./bin/${fileName}-${serverVersion}.exe`,
    ]);

    buildProcess.stdout.on("data", (data) => {
      console.log(`${name}(${version}): ${data}`);
    });

    buildProcess.stderr.on("data", (data) => {
      console.log(`${name}(${version}): ${data}`);
    });

    buildProcess.on("close", (code) => {
      if (code) {
        throw new Error(`${name}(${version}) exited with code ${code}`);
      } else {
        console.log(`${name}(${version}) builded!`);
      }
    });
  });
}

const serverVersion = require("../package.json").version
console.log("You need to have pkg installed to run this script, if it's not the case execute npm i -g pkg")
buildAllBinaries(serverVersion);
