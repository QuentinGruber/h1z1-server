import test, { after } from "node:test";
import { SOEServer } from "./soeserver";
import { LogicalPacket } from "./logicalPacket";
import { PacketsQueue } from "./PacketsQueue";
import assert from "node:assert";

test("SoeServer", { timeout: 5000 }, async (t) => {
  const soeServer = new SOEServer(0, Buffer.from("1"));
  await t.test("start", async () => {
    soeServer.start();
  });

  await t.test("canBeBufferedIntoQueue", async () => {
    const queue = new PacketsQueue();
    const max = soeServer["_maxMultiBufferSize"];
    const maxSizelogical = new LogicalPacket(Buffer.allocUnsafe(max), 1);
    let result = soeServer["_canBeBufferedIntoQueue"](maxSizelogical, queue);
    assert.strictEqual(result, true);
    const bigLogical = new LogicalPacket(Buffer.allocUnsafe(max + 1), 1);
    result = soeServer["_canBeBufferedIntoQueue"](bigLogical, queue);
    assert.strictEqual(result, false);
    // if there is already bytes in the queue
    queue.CurrentByteLength += 1;
    result = soeServer["_canBeBufferedIntoQueue"](maxSizelogical, queue);
    assert.strictEqual(result, false);
  });

  await t.test("stop", async () => {
    await soeServer.stop();
  });
});

after(() => {
  setImmediate(() => {
    process.exit(0);
  });
});
