import test from "node:test";
import assert from "node:assert/strict";
import { sampleTimes, timecode } from "../client/src/lib/video.ts";
test("samples interior timestamps for a selected clip, excluding EOF", () => {
  const ts = sampleTimes(120, 24, 30, 90);
  assert.equal(ts.length, 24);
  assert.ok(ts[0] > 30);
  assert.ok(ts.at(-1) < 90);
  assert.equal(ts[1] - ts[0], 2.5);
});
test("rejects invalid duration, reversed and out of bounds clips", () => {
  for (const args of [
    [0, 24],
    [Infinity, 24],
    [120, 24, 90, 30],
    [120, 24, 0, 121],
    [120, 0],
    [120, 121],
  ])
    assert.throws(() => sampleTimes(...args));
});
test("formats long video timestamps without wrapping hours", () => {
  assert.equal(timecode(3661.5), "01:01:01");
  assert.equal(timecode(75), "01:15");
});
