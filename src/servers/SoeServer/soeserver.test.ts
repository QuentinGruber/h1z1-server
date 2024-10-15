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
  await t.test("soeclient deletions", async () => {
    const c = soeServer["_createClient"]({
      address: "127.0.0.1",
      family: "IPv4",
      port: 0,
      size: 0
    });
    assert.strictEqual(soeServer["_clients"].size, 1, "Client wasn't created");
    soeServer.deleteClient(c);
    assert.strictEqual(soeServer["_clients"].size, 0, "Client wasn't deleted");
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
