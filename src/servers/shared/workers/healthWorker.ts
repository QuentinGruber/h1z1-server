// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2023 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

import { parentPort, workerData, Worker } from "node:worker_threads";
const debug = require("debug")("HEALTHWORKER");
interface Target {
  prototype: any;
}

export function healthThreadDecorator(target: Target) {
  target.prototype._healthWorker = new Worker(`${__dirname}/healthWorker.js`, {
    workerData: { threadToWatchPid: process.pid }
  });
  if (!process.env.VSCODE_DEBUG) {
    target.prototype._healthWorker.on("message", () => {
      target.prototype._healthWorker.postMessage(true);
    });
  }
}
const healthTime = 10000;
function checkHealth() {
  const { threadToWatchPid } = workerData;
  let healthTimeoutTimer: any;
  const healthTimer = setTimeout(() => {
    parentPort?.postMessage(true);
    healthTimeoutTimer = setTimeout(() => {
      console.log("Health check failed");
      process.kill(threadToWatchPid);
    }, healthTime);
  }, healthTime);
  parentPort?.on("message", () => {
    healthTimer.refresh();
    clearTimeout(healthTimeoutTimer);
  });
}
if (
  workerData?.threadToWatchPid &&
  workerData.threadToWatchPid === process.pid &&
  !process.env.VSCODE_DEBUG
) {
  debug("Health check started");
  checkHealth();
}
