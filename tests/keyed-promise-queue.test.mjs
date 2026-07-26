import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { createKeyedPromiseQueue } from "../keyed-promise-queue.mjs";

const server = fs.readFileSync(new URL("../server.mjs", import.meta.url), "utf8");

test("tasks for one key complete in invocation order", async () => {
  const queue = createKeyedPromiseQueue();
  const events = [];
  let releaseFirst;
  const firstGate = new Promise((resolve) => {
    releaseFirst = resolve;
  });

  const first = queue.run("job-1", async () => {
    events.push("first:start");
    await firstGate;
    events.push("first:end");
  });
  const second = queue.run("job-1", async () => {
    events.push("second");
  });

  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(events, ["first:start"]);
  releaseFirst();
  await Promise.all([first, second]);
  assert.deepEqual(events, ["first:start", "first:end", "second"]);
  assert.equal(queue.size, 0);
});

test("a rejected save does not block the next save for that job", async () => {
  const queue = createKeyedPromiseQueue();
  const events = [];
  const failed = queue.run("job-2", async () => {
    events.push("failed");
    throw new Error("disk unavailable");
  });
  const recovered = queue.run("job-2", async () => {
    events.push("recovered");
    return "ok";
  });

  await assert.rejects(failed, /disk unavailable/);
  assert.equal(await recovered, "ok");
  assert.deepEqual(events, ["failed", "recovered"]);
  assert.equal(queue.size, 0);
});

test("different keys are not globally serialized", async () => {
  const queue = createKeyedPromiseQueue();
  const events = [];
  let releaseA;
  const gateA = new Promise((resolve) => {
    releaseA = resolve;
  });
  const a = queue.run("job-a", async () => {
    events.push("a:start");
    await gateA;
    events.push("a:end");
  });
  const b = queue.run("job-b", async () => {
    events.push("b");
  });

  await b;
  assert.deepEqual(events, ["a:start", "b"]);
  releaseA();
  await a;
});

test("saveJob snapshots and serializes atomic writes per request ID", () => {
  assert.match(server, /const jobSaveQueue = createKeyedPromiseQueue\(\)/);
  assert.match(
    server,
    /async function saveJob\(job\)[\s\S]*?const snapshot = JSON\.parse\(JSON\.stringify\(job\)\)[\s\S]*?jobSaveQueue\.run\(job\.requestId, \(\) => writeJsonAtomic\(finalPath, snapshot\)\)/,
  );
});
