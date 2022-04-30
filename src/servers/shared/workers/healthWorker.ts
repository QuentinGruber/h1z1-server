// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2022 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

import { parentPort, workerData, Worker } from "worker_threads";

interface Target {
    prototype:any
}

export function healthThreadDecorator(target:Target) {
    target.prototype._healthWorker = new Worker(
        `${__dirname}/healthWorker.js`,
        {
          workerData: { threadToWatchPid: process.pid },
        }
      );
      if(!process.env.VSCODE_DEBUG){
        target.prototype._healthWorker.on("message", () => {
            target.prototype._healthWorker.postMessage(true);
        });
      }
}
function checkHealth() {
    const { threadToWatchPid } = workerData;
    let healthTimeoutTimer:any;
    const healthTimer = setTimeout(() => {
        parentPort?.postMessage(true);
        healthTimeoutTimer  = setTimeout(() => {
            process.kill(threadToWatchPid);
        }, 25000);
    }, 10000);
    parentPort?.on("message", () => {
        healthTimer.refresh();
        clearTimeout(healthTimeoutTimer)
    }
    );
    
}
if( workerData?.threadToWatchPid && workerData.threadToWatchPid === process.pid && !process.env.VSCODE_DEBUG) {
    checkHealth();
}
