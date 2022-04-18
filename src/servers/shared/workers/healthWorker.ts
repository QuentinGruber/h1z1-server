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

import { parentPort, workerData } from "worker_threads";

const { mainThreadId } = workerData;
function checkHealth() {
    let healthTimeoutTimer:any;
    const healthTimer = setTimeout(() => {
        parentPort?.postMessage(true);
        healthTimeoutTimer  = setTimeout(() => {
            process.kill(mainThreadId);
        }, 25000);
    }, 10000);
    parentPort?.on("message", () => {
        healthTimer.refresh();
        clearTimeout(healthTimeoutTimer)
    }
    );
    
}

checkHealth();
