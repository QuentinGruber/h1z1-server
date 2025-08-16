// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2025 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

class ScheduledTask {
  lastRun: number = -1;
  constructor(
    public time: number,
    public cb: any
  ) {}
}

export class TaskManager {
  private queue: any[] = [];
  private priorityQueue: any[] = [];
  private scheduleQueue: ScheduledTask[] = [];

  get taskCount() {
    return this.queue.length + this.priorityQueue.length;
  }

  register(cb: () => unknown, prioritize: boolean = false) {
    if (prioritize) {
      this.priorityQueue.push(cb);
    } else {
      this.queue.push(cb);
    }
  }

  checkElapsed(startTime: bigint, allowedTime: bigint): boolean {
    return process.hrtime.bigint() - startTime < allowedTime;
  }

  process(time_ms: number) {
    const startTime = process.hrtime.bigint();
    const allowedTime = BigInt(time_ms) * 1_000_000n;
    this.process_schedule();
    if (!this.checkElapsed(startTime, allowedTime)) {
      console.warn(
        "[TaskManager] didn't had time to process tasks after schedule"
      );
      return;
    }
    let current = 0;
    for (let index = 0; index < this.priorityQueue.length; index++) {
      if (!this.checkElapsed(startTime, allowedTime)) {
        console.warn(
          "[TaskManager] didn't had time to process all tasks, stopped in priority queue"
        );
        break;
      }
      const element = this.priorityQueue.shift();
      element();
      current++;
    }
    for (let index = 0; index < this.queue.length; index++) {
      if (!this.checkElapsed(startTime, allowedTime)) {
        console.warn("[TaskManager] didn't had time to process all tasks");
        break;
      }
      const element = this.queue.shift();
      element();
      current++;
    }
  }

  register_schedule(cb: () => unknown, time: number) {
    this.scheduleQueue.push(new ScheduledTask(time, cb));
  }
  process_schedule() {
    const now = Date.now();
    for (let index = 0; index < this.scheduleQueue.length; index++) {
      const schedule = this.scheduleQueue[index];
      if (now - schedule.lastRun > schedule.time) {
        schedule.cb();
        schedule.lastRun = now;
      }
    }
  }
}
