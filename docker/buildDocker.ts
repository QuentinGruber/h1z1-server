const debug = require("debug")("h1emu:docker:buildDocker");
import { spawn } from "child_process";
import { ServerImage } from "./types";
const images: ServerImage[] = require("./images.json");

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
      debug(`${name}(${version}): ${data}`);
    });

    buildProcess.stderr.on("data", (data) => {
      debug(`${name}(${version}): ${data}`);
    });

    buildProcess.on("close", (code) => {
      if (code) {
        throw new Error(`${name}(${version}) exited with code ${code}`);
      } else {
        debug(`${name}(${version}) builded!`);
      }
    });
  });
}

const serverVersion = require("../package.json").version
buildAllImages(serverVersion);
buildAllImages("latest");

