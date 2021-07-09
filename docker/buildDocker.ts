import { spawn } from "child_process";
const images: ServerImage[] = require("./images.json");

interface ServerImage {
  name: string;
  version: string;
  fileName: string;
}

function buildAllImages(imageTag:string) {
  images.forEach((image) => {
    const { name, version, fileName } = image;
    const buildProcess = spawn("docker", [
      "build",
      "-t",
      `h1emu/${name}:${imageTag}`,
      "-f",
      `./docker/${version}/${fileName}.Dockerfile`,
      "./",
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
buildAllImages(serverVersion);
buildAllImages("latest");

